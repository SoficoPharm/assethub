import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AssignmentRow, AssignmentsService } from '../../services/assignments.service';

@Component({
  selector: 'app-assignment-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assignment-history.html',
  styleUrls: ['./assignment-history.scss']
})
export class AssignmentHistory implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  searchText = '';
  selectedStatus: 'All' | 'Active' | 'Returned' = 'All';
  selectedDateRange: 'All' | 'Last 30 Days' | 'This Year' = 'All';

  statuses: Array<'All' | 'Active' | 'Returned'> = ['All', 'Active', 'Returned'];
  dateRanges: Array<'All' | 'Last 30 Days' | 'This Year'> = ['All', 'Last 30 Days', 'This Year'];

  rows: AssignmentRow[] = [];

  loading = false;
  errorMessage = '';
  returningId: number | null = null;

  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.assignmentsService.getAssignments()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.rows = res ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Assignments error:', err);
          this.errorMessage = `Failed to load assignments. Status: ${err.status || 'error'}`;
        }
      });
  }

  get filteredRows(): AssignmentRow[] {
    const search = this.searchText.trim().toLowerCase();

    return this.rows.filter(row => {
      const id = row.id ?? '';
      const user = row.user ?? '';
      const device = row.device ?? '';
      const model = row.model ?? '';
      const status = row.status ?? '';

      const matchesSearch =
        !search ||
        id.toLowerCase().includes(search) ||
        user.toLowerCase().includes(search) ||
        device.toLowerCase().includes(search) ||
        model.toLowerCase().includes(search) ||
        status.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' || status === this.selectedStatus;

      const matchesDateRange = this.matchesDateRange(row.assignedDateRaw || row.assignedDate);

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }

  returnDevice(row: AssignmentRow): void {
    if (this.returningId !== null) return;

    const confirmed = confirm(`Return ${row.device} from ${row.user}?`);
    if (!confirmed) return;

    this.returningId = row.dbId;

    this.assignmentsService.returnDevice(row.dbId)
      .pipe(finalize(() => {
        this.returningId = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.notify.success(`${row.device} returned`);
          this.loadAssignments();
        },
        error: err => this.notify.apiError(err, 'Failed to return device.')
      });
  }

  setStatus(status: 'All' | 'Active' | 'Returned'): void {
    this.selectedStatus = status;
  }

  setDateRange(range: 'All' | 'Last 30 Days' | 'This Year'): void {
    this.selectedDateRange = range;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
    this.selectedDateRange = 'All';
  }

  matchesDateRange(dateText?: string): boolean {
    if (this.selectedDateRange === 'All') return true;
    if (!dateText) return true;

    const assignedDate = new Date(dateText);
    const today = new Date();

    if (isNaN(assignedDate.getTime())) return true;

    if (this.selectedDateRange === 'Last 30 Days') {
      const last30 = new Date();
      last30.setDate(today.getDate() - 30);
      return assignedDate >= last30 && assignedDate <= today;
    }

    if (this.selectedDateRange === 'This Year') {
      return assignedDate.getFullYear() === today.getFullYear();
    }

    return true;
  }

  getStatusClass(status: string): string {
    return (status || '').toLowerCase();
  }
}