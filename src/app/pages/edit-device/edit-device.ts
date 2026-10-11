import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { DevicesService } from '../../services/devices.service';

@Component({
  selector: 'app-edit-device',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-device.html',
  styleUrls: ['./edit-device.scss']
})
export class EditDevice implements OnInit {
  deviceCode = '';

  deviceName = '';
  imeiSerial = '';
  serialNumber = '';
  deviceType = '';
  brand = '';
  model = '';
  ram = '';
  storage1 = '';
  storage2 = '';
  status = 'Available';
  notes = '';
  internalNotes = '';
  imageUrl = '';

  imageFile: File | null = null;
  imagePreview = '';

  loading = false;
  saving = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  deviceTypes = ['Laptop', 'Mobile', 'Tablet', 'Desktop', 'Bag', 'SIM Line'];
  brands = ['Apple', 'Samsung', 'Lenovo', 'Dell', 'HP', 'Vodafone', 'Orange', 'Etisalat'];
  ramOptions = ['N/A', '4 GB', '8 GB', '16 GB', '32 GB'];
  storageOptions = ['N/A', '128 GB', '256 GB', '512 GB', '1 TB'];
  statusOptions = ['Active', 'Available', 'Inactive', 'Lost', 'Maintenance', 'Assigned'];

  showAddType = false;
  showAddBrand = false;
  showAddRam = false;
  showAddStorage = false;
  showAddStatus = false;

  newType = '';
  newBrand = '';
  newRam = '';
  newStorage = '';
  newStatus = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly devicesService: DevicesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.deviceCode = this.route.snapshot.paramMap.get('code') || '';

    if (!this.deviceCode) {
      this.router.navigate(['/devices']);
      return;
    }

    this.loadDevice();
  }

  loadDevice(): void {
    this.loading = true;

    this.devicesService.getDeviceByCode(this.deviceCode)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (device) => {
          this.deviceName = device.name || '';
          this.imeiSerial = device.imeiSerial || device.serial || '';
          this.serialNumber = device.serialNumber || '';
          this.deviceType = device.type || '';
          this.brand = device.brand || '';
          this.model = device.model || '';
          this.ram = device.ram || '';
          this.storage1 = device.storage1 || device.storage || '';
          this.storage2 = device.storage2 || '';
          this.notes = device.notes || '';
          this.internalNotes = device.internalNotes || '';
          this.imageUrl = device.imageUrl || '';
          this.imagePreview = device.imageUrl || '';
          this.status = device.status || 'Available';

          this.ensureCurrentValuesExistInDropdowns();
        },
        error: (err) => {
          console.error('Get device error:', err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to load device.'), 'error');
        }
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showAppToast('Please select a valid image file.', 'error');
      input.value = '';
      return;
    }

    if (this.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imageFile = file;
    this.imagePreview = URL.createObjectURL(file);
    this.cdr.detectChanges();
  }

  removeImage(): void {
    if (this.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imageFile = null;
    this.imagePreview = '';
    this.imageUrl = '';
    this.cdr.detectChanges();
  }

  saveChanges(): void {
    if (!this.deviceName.trim() || (!this.imeiSerial.trim() && !this.serialNumber.trim())) {
      this.showAppToast('Please enter device name and IMEI or Serial Number.', 'error');
      return;
    }

    this.saving = true;

    this.devicesService.updateDeviceByCode(this.deviceCode, {
      deviceName: this.deviceName.trim(),
      imeiSerial: this.imeiSerial.trim(),
      serialNumber: this.serialNumber.trim(),
      deviceType: this.deviceType || 'N/A',
      platform: this.deviceType || 'N/A',
      brand: this.brand || '',
      model: this.model || 'N/A',
      ram: this.ram || '',
      storage: this.storage1 || this.storage2 || '',
      storage1: this.storage1 || '',
      storage2: this.storage2 || '',
      status: this.status,
      notes: this.notes || '',
      internalNotes: this.internalNotes || '',
      imageUrl: this.imageUrl || '',
      imageFile: this.imageFile
    })
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.showAppToast('Device updated successfully', 'success');

          setTimeout(() => {
            this.router.navigate(['/devices']);
          }, 500);
        },
        error: (err) => {
          console.error('Update device error:', err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to update device.'), 'error');
        }
      });
  }

  deleteDevice(): void {
    const confirmed = confirm(`Are you sure you want to delete ${this.deviceName}?`);
    if (!confirmed) return;

    this.saving = true;

    this.devicesService.deleteDeviceByCode(this.deviceCode)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.showAppToast('Device deleted successfully', 'success');

          setTimeout(() => {
            this.router.navigate(['/devices']);
          }, 500);
        },
        error: (err) => {
          console.error('Delete device error:', err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to delete device.'), 'error');
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/devices']);
  }

  backToList(): void {
    this.router.navigate(['/devices']);
  }

  showAppToast(message: string, type: 'success' | 'error' = 'success'): void {
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

  ensureCurrentValuesExistInDropdowns(): void {
    if (this.deviceType && !this.deviceTypes.includes(this.deviceType)) this.deviceTypes.push(this.deviceType);
    if (this.brand && !this.brands.includes(this.brand)) this.brands.push(this.brand);
    if (this.ram && !this.ramOptions.includes(this.ram)) this.ramOptions.push(this.ram);
    if (this.storage1 && !this.storageOptions.includes(this.storage1)) this.storageOptions.push(this.storage1);
    if (this.storage2 && !this.storageOptions.includes(this.storage2)) this.storageOptions.push(this.storage2);
    if (this.status && !this.statusOptions.includes(this.status)) this.statusOptions.push(this.status);
  }

  toggleAddBox(type: 'type' | 'brand' | 'ram' | 'storage' | 'status'): void {
    this.closeAllAddBoxes();

    if (type === 'type') this.showAddType = true;
    if (type === 'brand') this.showAddBrand = true;
    if (type === 'ram') this.showAddRam = true;
    if (type === 'storage') this.showAddStorage = true;
    if (type === 'status') this.showAddStatus = true;
  }

  closeAllAddBoxes(): void {
    this.showAddType = false;
    this.showAddBrand = false;
    this.showAddRam = false;
    this.showAddStorage = false;
    this.showAddStatus = false;
  }

  addDeviceType(): void {
    const value = this.newType.trim();
    if (!value) return;
    if (!this.deviceTypes.includes(value)) this.deviceTypes.push(value);
    this.deviceType = value;
    this.newType = '';
    this.showAddType = false;
  }

  addBrand(): void {
    const value = this.newBrand.trim();
    if (!value) return;
    if (!this.brands.includes(value)) this.brands.push(value);
    this.brand = value;
    this.newBrand = '';
    this.showAddBrand = false;
  }

  addRam(): void {
    const value = this.newRam.trim();
    if (!value) return;
    if (!this.ramOptions.includes(value)) this.ramOptions.push(value);
    this.ram = value;
    this.newRam = '';
    this.showAddRam = false;
  }

  addStorage(): void {
    const value = this.newStorage.trim();
    if (!value) return;
    if (!this.storageOptions.includes(value)) this.storageOptions.push(value);
    this.storage1 = value;
    this.newStorage = '';
    this.showAddStorage = false;
  }

  addStatus(): void {
    const value = this.newStatus.trim();
    if (!value) return;
    if (!this.statusOptions.includes(value)) this.statusOptions.push(value);
    this.status = value;
    this.newStatus = '';
    this.showAddStatus = false;
  }
}