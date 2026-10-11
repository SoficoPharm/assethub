import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import {
  DeviceStatus,
  DevicesService,
  EDITABLE_DEVICE_STATUSES,
  normalizeSerial,
  serialInUseMessage
} from '../../services/devices.service';

@Component({
  selector: 'app-edit-device',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-device.html',
  styleUrls: ['./edit-device.scss']
})
export class EditDevice implements OnInit {
  private readonly notify = inject(NotificationService);

  deviceCode = '';

  deviceName = '';
  imeiSerial = '';
  serialNumber = '';
  deviceType = '';
  platform = '';
  brand = '';
  model = '';
  ram = '';
  storage1 = '';
  storage2 = '';
  cpu = '';
  gpu = '';
  screens: number | null = null;
  printer = false;
  scanner = false;
  status: DeviceStatus = 'Available';
  notes = '';
  internalNotes = '';
  imageUrl = '';

  /** Status and assignee as loaded, used to explain what a status change will do. */
  originalStatus: DeviceStatus = 'Available';
  assignedUser = '';

  imageFile: File | null = null;
  imagePreview = '';

  loading = false;
  saving = false;

  /** Serial already used by another device (from check-serial). Blocks Save while set. */
  serialError = '';
  checkingSerial = false;

  deviceTypes = ['Laptop', 'Mobile', 'Tablet', 'Desktop', 'Bag', 'SIM Line'];
  brands = ['Apple', 'Samsung', 'Lenovo', 'Dell', 'HP', 'Vodafone', 'Orange', 'Etisalat'];
  ramOptions = ['N/A', '4 GB', '8 GB', '16 GB', '32 GB'];
  storageOptions = ['N/A', '128 GB', '256 GB', '512 GB', '1 TB'];

  showAddType = false;
  showAddBrand = false;
  showAddRam = false;
  showAddStorage = false;

  newType = '';
  newBrand = '';
  newRam = '';
  newStorage = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly devicesService: DevicesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  /** Assigned can be kept but never chosen; assigning happens only through Assignments. */
  get statusOptions(): DeviceStatus[] {
    return this.originalStatus === 'Assigned'
      ? ['Assigned', ...EDITABLE_DEVICE_STATUSES]
      : EDITABLE_DEVICE_STATUSES;
  }

  onSerialInput(): void {
    this.serialError = '';
  }

  /** On blur: is this serial used by another device? */
  checkSerial(): void {
    const serial = normalizeSerial(this.serialNumber);
    this.serialError = '';

    if (!serial) {
      this.checkingSerial = false;
      this.cdr.detectChanges();
      return;
    }

    this.checkingSerial = true;
    this.cdr.detectChanges();

    this.devicesService.checkSerial(serial, this.deviceCode).subscribe({
      next: result => {
        // Ignore a late answer for a value the user has already changed.
        if (normalizeSerial(this.serialNumber) !== serial) return;

        this.checkingSerial = false;
        this.serialError = result.exists ? serialInUseMessage(result) : '';
        this.cdr.detectChanges();
      },
      error: err => {
        // Not blocking: the server checks again on save.
        this.checkingSerial = false;
        this.notify.apiError(err, 'Could not check the serial number.');
        this.cdr.detectChanges();
      }
    });
  }

  get willReturnDevice(): boolean {
    return this.originalStatus === 'Assigned' && this.status !== 'Assigned';
  }

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
          this.imeiSerial = device.imeiSerial || '';
          this.serialNumber = device.serialNumber || '';
          this.deviceType = device.type || '';
          this.platform = device.platform || '';
          this.brand = device.brand || '';
          this.model = device.model || '';
          this.ram = device.ram || '';
          this.storage1 = device.storage1 || device.storage || '';
          this.storage2 = device.storage2 || '';
          this.cpu = device.cpu || '';
          this.gpu = device.gpu || '';
          this.screens = device.screens ?? null;
          this.printer = !!device.printer;
          this.scanner = !!device.scanner;
          this.notes = device.notes || '';
          this.internalNotes = device.internalNotes || '';
          this.imageUrl = device.imageUrl || '';
          this.imagePreview = device.imageUrl || '';
          this.status = device.status || 'Available';
          this.originalStatus = this.status;
          this.assignedUser = device.assignedUser && device.assignedUser !== '—' ? device.assignedUser : '';

          this.ensureCurrentValuesExistInDropdowns();
        },
        error: (err) => {
          console.error('Get device error:', err);
          this.notify.apiError(err, 'Failed to load device.');
        }
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notify.error('Please select a valid image file.');
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
    if (!this.deviceName.trim()) {
      this.notify.error('Please enter device name.');
      return;
    }

    if (this.serialError || this.checkingSerial) {
      this.notify.error(this.serialError || 'Still checking the serial number.');
      return;
    }

    if (this.willReturnDevice) {
      const confirmed = confirm(
        `This device is assigned to ${this.assignedUser || 'an employee'}. ` +
        `Changing its status to ${this.status} will return it. Continue?`
      );
      if (!confirmed) return;
    }

    this.saving = true;

    this.devicesService.updateDeviceByCode(this.deviceCode, {
      deviceName: this.deviceName.trim(),
      imeiSerial: this.imeiSerial.trim(),
      serialNumber: normalizeSerial(this.serialNumber),
      deviceType: this.deviceType || 'N/A',
      platform: this.platform || this.deviceType || 'N/A',
      brand: this.brand || '',
      model: this.model || 'N/A',
      ram: this.ram || '',
      storage: this.storage1 || this.storage2 || '',
      storage1: this.storage1 || '',
      storage2: this.storage2 || '',
      cpu: this.cpu.trim(),
      gpu: this.gpu.trim(),
      screens: this.screens,
      printer: this.printer,
      scanner: this.scanner,
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
          this.notify.success('Device updated successfully');
          this.router.navigate(['/devices']);
        },
        error: (err) => {
          console.error('Update device error:', err);
          this.notify.apiError(err, 'Failed to update device.');
          if (err?.status === 409) this.checkSerial();
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
          this.notify.success('Device deleted successfully');
          this.router.navigate(['/devices']);
        },
        error: (err) => {
          console.error('Delete device error:', err);
          this.notify.apiError(err, 'Failed to delete device.');
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/devices']);
  }

  backToList(): void {
    this.router.navigate(['/devices']);
  }

  ensureCurrentValuesExistInDropdowns(): void {
    if (this.deviceType && !this.deviceTypes.includes(this.deviceType)) this.deviceTypes.push(this.deviceType);
    if (this.brand && !this.brands.includes(this.brand)) this.brands.push(this.brand);
    if (this.ram && !this.ramOptions.includes(this.ram)) this.ramOptions.push(this.ram);
    if (this.storage1 && !this.storageOptions.includes(this.storage1)) this.storageOptions.push(this.storage1);
    if (this.storage2 && !this.storageOptions.includes(this.storage2)) this.storageOptions.push(this.storage2);
  }

  toggleAddBox(type: 'type' | 'brand' | 'ram' | 'storage'): void {
    this.closeAllAddBoxes();

    if (type === 'type') this.showAddType = true;
    if (type === 'brand') this.showAddBrand = true;
    if (type === 'ram') this.showAddRam = true;
    if (type === 'storage') this.showAddStorage = true;
  }

  closeAllAddBoxes(): void {
    this.showAddType = false;
    this.showAddBrand = false;
    this.showAddRam = false;
    this.showAddStorage = false;
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
}
