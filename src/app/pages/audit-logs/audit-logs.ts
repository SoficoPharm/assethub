import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuditLog, AuditLogsService } from '../../services/audit-logs.service';

interface AuditRow {
  id: number;
  timestamp: string;
  actor: string;
  actorInitials: string;
  action: string;
  target: string;
  details: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './audit-logs.html',
  styleUrls: ['./audit-logs.scss']
})
export class AuditLogs implements OnInit, OnDestroy {
  searchText = '';
  selectedAction = 'All';

  actions = ['All', 'Assign', 'Update', 'Sync', 'Return', 'Create', 'Delete', 'Alert'];

  logs: AuditRow[] = [];

  isLoading = false;
  errorMessage = '';

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  page = 1;
  pageSize = 12;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly datePipe: DatePipe,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.auditLogsService.getAll(this.searchText, this.selectedAction)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.logs = (data ?? []).map(log => this.mapLog(log));
          this.page = 1;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Audit logs error:', err);
          this.logs = [];
          this.errorMessage = this.getErrorMessage(err, 'Failed to load audit logs.');
        }
      });
  }

  get filteredLogs(): AuditRow[] {
    return this.logs;
  }

  get pagedLogs(): AuditRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.filteredLogs.length / this.pageSize), 1);
  }

  get startEntry(): number {
    if (this.filteredLogs.length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.page * this.pageSize, this.filteredLogs.length);
  }

  mapLog(log: AuditLog): AuditRow {
    return {
      id: log.id,
      timestamp:
        log.timestampText ||
        this.datePipe.transform(log.timestamp, 'MMM d, y HH:mm:ss') ||
        log.timestamp ||
        '',
      actor: log.actor || 'Unknown',
      actorInitials: this.getInitials(log.actor || 'Unknown'),
      action: log.logAction || 'Update',
      target: log.target || '—',
      details: log.details || '—'
    };
  }

  getInitials(name: string): string {
    if (!name) return 'NA';

    const initials = name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');

    return initials || 'NA';
  }

  setAction(action: string): void {
    this.selectedAction = action;
    this.page = 1;
    this.loadLogs();
  }

  onSearchChange(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.loadLogs();
    }, 350);
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedAction = 'All';
    this.page = 1;
    this.loadLogs();
  }

  clearAllLogs(): void {
    const confirmed = confirm('Are you sure you want to clear all audit logs?');
    if (!confirmed) return;

    this.isLoading = true;

    this.auditLogsService.clearAll()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showToastMessage('Audit logs cleared successfully', 'success');
          this.loadLogs();
        },
        error: (err) => {
          console.error('Clear audit logs error:', err);
          this.showToastMessage(this.getErrorMessage(err, 'Failed to clear audit logs.'), 'error');
        }
      });
  }

  exportCsv(): void {
    const headers = ['Timestamp', 'Actor', 'Action', 'Target', 'Details'];

    const rows = this.filteredLogs.map(log => [
      log.timestamp,
      log.actor,
      log.action,
      log.target,
      log.details
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-logs.csv';
    link.click();

    URL.revokeObjectURL(url);

    this.showToastMessage('CSV exported successfully', 'success');
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
  }

  getActionClass(action: string): string {
    return (action || '').toLowerCase();
  }

  showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;

    if (err?.error?.errors) {
      const errors = err.error.errors;
      return Object.keys(errors)
        .map(key => errors[key].join(', '))
        .join(' | ');
    }

    return fallback;
  }
}