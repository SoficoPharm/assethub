import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  departmentName = '';
  managerName = '';
  membersCount = 0;
  editId: number | null = null;

  departments: Department[] = [];

  isLoading = false;
  isSaving = false;
  deletingId: number | null = null;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

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
          this.showToastMessage(this.getErrorMessage(err, 'Error loading departments'), 'error');
        }
      });
  }

  createOrUpdateDepartment(): void {
    if (!this.departmentName.trim()) {
      this.showToastMessage('Please enter department name.', 'error');
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
          this.showToastMessage(
            this.editId !== null ? 'Department updated successfully' : 'Department created successfully',
            'success'
          );
          this.resetForm();
          this.loadDepartments();
        },
        error: (err) => {
          console.error('Save department error:', err);
          this.showToastMessage(this.getErrorMessage(err, 'Error saving department'), 'error');
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
          this.showToastMessage('Department deleted successfully', 'success');
          this.resetForm();
          this.loadDepartments();
        },
        error: (err) => {
          console.error('Delete department error:', err);
          this.showToastMessage(this.getErrorMessage(err, 'Error deleting department'), 'error');
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