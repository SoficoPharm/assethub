import { ChangeDetectorRef, Component, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DeviceStatus, DevicesService, EDITABLE_DEVICE_STATUSES } from '../../services/devices.service';

interface DeviceForm {
  deviceName: string;
  imeiSerial: string;
  serialNumber: string;
  deviceType: string;
  brand: string;
  model: string;
  ram: string;
  storage1: string;
  storage2: string;
  cpu: string;
  gpu: string;
  screens: number | null;
  printer: boolean;
  scanner: boolean;
  initialStatus: DeviceStatus;
  notes: string;
  internalNotes: string;
  imageUrl: string;
  imageFile: File | null;
  imagePreview: string;
}

@Component({
  selector: 'app-add-device',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-device.html',
  styleUrls: ['./add-device.scss']
})
export class AddDevice {
  private readonly notify = inject(NotificationService);

  @ViewChildren('scanFileInput') scanFileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  devicesToAdd: DeviceForm[] = [this.createEmptyDevice()];

  deviceTypes = ['Laptop', 'Mobile', 'Tablet', 'Desktop', 'Bag', 'SIM Line', 'CPU', 'GPU', 'Screens', 'Printer', 'Scanner'];
  brands = ['Apple', 'Samsung', 'Lenovo', 'Dell', 'HP', 'Vodafone', 'Orange', 'Etisalat'];
  ramOptions = ['N/A', '4 GB', '8 GB', '16 GB', '32 GB', '64 GB'];
  storageOptions = ['N/A', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'];
  statusOptions: DeviceStatus[] = EDITABLE_DEVICE_STATUSES;

  loading = false;

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
    private readonly devicesService: DevicesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  createEmptyDevice(): DeviceForm {
    return {
      deviceName: '',
      imeiSerial: '',
      serialNumber: '',
      deviceType: '',
      brand: '',
      model: '',
      ram: '',
      storage1: '',
      storage2: '',
      cpu: '',
      gpu: '',
      screens: null,
      printer: false,
      scanner: false,
      initialStatus: 'Available',
      notes: '',
      internalNotes: '',
      imageUrl: '',
      imageFile: null,
      imagePreview: ''
    };
  }

  openScanFile(index: number): void {
    this.scanFileInputs.get(index)?.nativeElement.click();
  }

  onDeviceScanFile(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        const device = this.devicesToAdd[index];

        device.deviceName = data.hostName || data.deviceName || device.deviceName;
        device.serialNumber = data.serviceTag || data.serialNumber || device.serialNumber;
        device.brand = data.systemManufacturer || data.brand || device.brand;
        device.model = data.systemModel || data.model || device.model;
        device.cpu = data.cpu || device.cpu;

        device.gpu = Array.isArray(data.gpu)
          ? data.gpu.join(', ')
          : (data.gpu || device.gpu);

        device.ram = data.totalPhysicalMemory || data.ram || device.ram;

        if (Array.isArray(data.hardDriveSpace)) {
          device.storage1 = data.hardDriveSpace[0]?.sizeGB
            ? `${data.hardDriveSpace[0].sizeGB} GB`
            : device.storage1;

          device.storage2 = data.hardDriveSpace[1]?.sizeGB
            ? `${data.hardDriveSpace[1].sizeGB} GB`
            : device.storage2;
        }

        device.screens = Number(data.screens) || device.screens;
        device.printer = Boolean(data.printer);
        device.scanner = Boolean(data.scanner);

        if (!device.deviceType) {
          device.deviceType = 'Laptop';
        }

        const ipv4Text = Array.isArray(data.ipv4) ? data.ipv4.join(', ') : data.ipv4;

        device.internalNotes = [
          data.domain ? `Domain: ${data.domain}` : '',
          data.userName ? `Username: ${data.userName}` : '',
          data.userDomain ? `User Domain: ${data.userDomain}` : '',
          data.osName ? `OS Name: ${data.osName}` : '',
          data.osVersion ? `OS Version: ${data.osVersion}` : '',
          data.systemType ? `System Type: ${data.systemType}` : '',
          ipv4Text ? `IPv4: ${ipv4Text}` : ''
        ].filter(Boolean).join('\n');

        this.notify.success('System info loaded successfully');
      } catch {
        this.notify.error('Invalid JSON file.');
      }

      input.value = '';
      this.cdr.detectChanges();
    };

    reader.readAsText(file);
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notify.error('Please select a valid image file.');
      input.value = '';
      return;
    }

    this.devicesToAdd[index].imageFile = file;
    this.devicesToAdd[index].imagePreview = URL.createObjectURL(file);
    this.cdr.detectChanges();
  }

  removeImage(index: number): void {
    const preview = this.devicesToAdd[index].imagePreview;

    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    this.devicesToAdd[index].imageFile = null;
    this.devicesToAdd[index].imagePreview = '';
    this.devicesToAdd[index].imageUrl = '';
    this.cdr.detectChanges();
  }

  addAnotherDevice(): void {
    this.devicesToAdd.push(this.createEmptyDevice());
  }

  removeDevice(index: number): void {
    if (this.devicesToAdd.length === 1) return;

    const preview = this.devicesToAdd[index].imagePreview;

    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }

    this.devicesToAdd.splice(index, 1);
  }

  cancel(): void {
    this.router.navigate(['/devices']);
  }

  saveDevices(): void {
    const invalid = this.devicesToAdd.some(device => !device.deviceName.trim());

    if (invalid) {
      this.notify.error('Please enter device name.');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const requests = this.devicesToAdd.map(device =>
      this.devicesService.createDevice({
        deviceName: device.deviceName.trim(),
        imeiSerial: device.imeiSerial?.trim() || '',
        serialNumber: device.serialNumber?.trim() || '',
        deviceType: device.deviceType || 'N/A',
        platform: device.deviceType || 'N/A',
        brand: device.brand || '',
        model: device.model || 'N/A',
        ram: device.ram || '',
        storage: device.storage1 || device.storage2 || '',
        storage1: device.storage1 || '',
        storage2: device.storage2 || '',
        cpu: device.cpu || '',
        gpu: device.gpu || '',
        screens: device.screens,
        printer: device.printer,
        scanner: device.scanner,
        status: device.initialStatus || 'Available',
        notes: device.notes || '',
        internalNotes: device.internalNotes || '',
        imageUrl: device.imageUrl || '',
        imageFile: device.imageFile
      })
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success(`${this.devicesToAdd.length} device(s) added successfully`);
        this.cdr.detectChanges();

        setTimeout(() => this.router.navigate(['/devices']), 500);
      },
      error: (err) => {
        console.error('Create device error:', err);
        this.loading = false;
        this.notify.apiError(err, 'Failed to save device.');
        this.cdr.detectChanges();
      }
    });
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

    if (!this.deviceTypes.includes(value)) {
      this.deviceTypes.push(value);
    }

    this.devicesToAdd[this.devicesToAdd.length - 1].deviceType = value;
    this.newType = '';
    this.showAddType = false;
  }

  addBrand(): void {
    const value = this.newBrand.trim();
    if (!value) return;

    if (!this.brands.includes(value)) {
      this.brands.push(value);
    }

    this.devicesToAdd[this.devicesToAdd.length - 1].brand = value;
    this.newBrand = '';
    this.showAddBrand = false;
  }

  addRam(): void {
    const value = this.newRam.trim();
    if (!value) return;

    if (!this.ramOptions.includes(value)) {
      this.ramOptions.push(value);
    }

    this.devicesToAdd[this.devicesToAdd.length - 1].ram = value;
    this.newRam = '';
    this.showAddRam = false;
  }

  addStorage(): void {
    const value = this.newStorage.trim();
    if (!value) return;

    if (!this.storageOptions.includes(value)) {
      this.storageOptions.push(value);
    }

    this.devicesToAdd[this.devicesToAdd.length - 1].storage1 = value;
    this.newStorage = '';
    this.showAddStorage = false;
  }
}