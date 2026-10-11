import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DepartmentsService, Department, CreateDepartment } from '../../services/departments.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.html',
  styleUrls: ['./departments.scss']
})
export class Departments implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  departmentName = '';
  managerName = '';
  membersCount = 0;
  editId: number | null = null;

  departments: Department[] = [];

  isLoading = false;
  isSaving = false;
  deletingId: number | null = null;


  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading = true;

    this.departmentsService.getDepartments()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.departments = data ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Departments error:', err);
          this.notify.apiError(err, 'Error loading departments');
        }
      });
  }

  createOrUpdateDepartment(): void {
    if (!this.departmentName.trim()) {
      this.notify.error('Please enter department name.');
      return;
    }

    const payload: CreateDepartment = {
      departmentName: this.departmentName.trim(),
      managerName: this.managerName.trim(),
      membersCount: Number(this.membersCount) || 0
    };

    this.isSaving = true;

    const request$ = this.editId !== null
      ? this.departmentsService.updateDepartment(this.editId, payload)
      : this.departmentsService.createDepartment(payload);

    request$
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.notify.success(
            this.editId !== null ? 'Department updated successfully' : 'Department created successfully'
          );
          this.resetForm();
          this.loadDepartments();
        },
        error: (err) => {
          console.error('Save department error:', err);
          this.notify.apiError(err, 'Error saving department');
        }
      });
  }

  editDepartment(dept: Department): void {
    if (this.isSaving || this.deletingId !== null) return;

    this.editId = dept.id;
    this.departmentName = dept.departmentName ?? '';
    this.managerName = dept.managerName ?? '';
    this.membersCount = Number(dept.membersCount) || 0;
  }

  deleteDepartment(dept: Department): void {
    if (this.isSaving || this.deletingId !== null) return;

    const confirmed = confirm(`Are you sure you want to delete ${dept.departmentName}?`);
    if (!confirmed) return;

    this.deletingId = dept.id;

    this.departmentsService.deleteDepartment(dept.id)
      .pipe(finalize(() => {
        this.deletingId = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.notify.success('Department deleted successfully');
          this.resetForm();
          this.loadDepartments();
        },
        error: (err) => {
          console.error('Delete department error:', err);
          this.notify.apiError(err, 'Error deleting department');
        }
      });
  }

  cancelEdit(): void {
    if (this.isSaving) return;
    this.resetForm();
  }

  resetForm(): void {
    this.departmentName = '';
    this.managerName = '';
    this.membersCount = 0;
    this.editId = null;
  }
}