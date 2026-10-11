import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CreateDeviceType,
  DeviceType,
  DeviceTypesService
} from '../../services/device-types.service';

@Component({
  selector: 'app-device-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './device-types.html',
  styleUrls: ['./device-types.scss']
})
export class DeviceTypes implements OnInit {
  typeName = '';
  countValue = 0;
  selectedIcon = '📱';

  editId: number | null = null;

  types: DeviceType[] = [];

  isLoading = false;
  isSaving = false;
  deletingId: number | null = null;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  iconOptions: string[] = ['📱', '💻', '⌨️', '🖥️', '📦', '🖨️', '📡', '🎧'];

  constructor(
    private readonly deviceTypesService: DeviceTypesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes(): void {
    this.isLoading = true;

    this.deviceTypesService.getAll()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.types = data ?? [];
          this.syncDeviceTypeDropdownOptions();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Device types error:', err);
          this.showToastMessage(this.getErrorMessage(err, 'Error loading device types'), 'error');
        }
      });
  }

  createOrUpdateType(): void {
    if (!this.typeName.trim()) {
      this.showToastMessage('Please enter type name.', 'error');
      return;
    }

    const payload: CreateDeviceType = {
      typeName: this.typeName.trim(),
      devicesCount: Number(this.countValue) || 0,
      icon: this.selectedIcon
    };

    this.isSaving = true;

    const request$ = this.editId !== null
      ? this.deviceTypesService.update(this.editId, payload)
      : this.deviceTypesService.create(payload);

    request$
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showToastMessage(
            this.editId !== null ? 'Device type updated successfully' : 'Device type created successfully',
            'success'
          );

          this.resetForm();
          this.loadTypes();
        },
        error: (err) => {
          console.error('Save device type error:', err);
          this.showToastMessage(this.getErrorMessage(err, 'Error saving device type'), 'error');
        }
      });
  }

  editType(item: DeviceType): void {
    if (this.isSaving || this.deletingId !== null) return;

    this.editId = item.id;
    this.typeName = item.typeName ?? '';
    this.countValue = Number(item.devicesCount) || 0;
    this.selectedIcon = item.icon || '📱';
  }

  deleteType(item: DeviceType): void {
    if (this.isSaving || this.deletingId !== null) return;

    const confirmed = confirm(`Are you sure you want to delete ${item.typeName}?`);
    if (!confirmed) return;

    this.deletingId = item.id;

    this.deviceTypesService.delete(item.id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showToastMessage('Device type deleted successfully', 'success');
          this.resetForm();
          this.loadTypes();
        },
        error: (err) => {
          console.error('Delete device type error:', err);
          this.showToastMessage(this.getErrorMessage(err, 'Error deleting device type'), 'error');
        }
      });
  }

  selectIcon(icon: string): void {
    if (this.isSaving) return;
    this.selectedIcon = icon;
  }

  cancelEdit(): void {
    if (this.isSaving) return;
    this.resetForm();
  }

  resetForm(): void {
    this.typeName = '';
    this.countValue = 0;
    this.selectedIcon = '📱';
    this.editId = null;
  }

  syncDeviceTypeDropdownOptions(): void {
    const names = this.types.map(type => type.typeName);
    localStorage.setItem('assethub_device_types', JSON.stringify(names));
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