import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/notification.service';
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
  protected readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  typeName = '';
  countValue = 0;
  selectedIcon = '📱';

  editId: number | null = null;

  types: DeviceType[] = [];

  isLoading = false;
  isSaving = false;
  deletingId: number | null = null;


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
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Device types error:', err);
          this.notify.apiError(err, 'Error loading device types');
        }
      });
  }

  createOrUpdateType(): void {
    if (!this.typeName.trim()) {
      this.notify.error('Please enter type name.');
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
          this.notify.success(
            this.editId !== null ? 'Device type updated successfully' : 'Device type created successfully'
          );

          this.resetForm();
          this.loadTypes();
        },
        error: (err) => {
          console.error('Save device type error:', err);
          this.notify.apiError(err, 'Error saving device type');
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
          this.notify.success('Device type deleted successfully');
          this.resetForm();
          this.loadTypes();
        },
        error: (err) => {
          console.error('Delete device type error:', err);
          this.notify.apiError(err, 'Error deleting device type');
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
}