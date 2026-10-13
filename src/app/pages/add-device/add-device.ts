import { ChangeDetectorRef, Component, ElementRef, QueryList, ViewChildren, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';
import {
  CreateDeviceRequest,
  DeviceStatus,
  DevicesService,
  EDITABLE_DEVICE_STATUSES,
  HardwareField,
  missingHardware,
  normalizeSerial,
  requiresHardware,
  serialInUseMessage
} from '../../services/devices.service';

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

  /** Serial already used by an existing device (from check-serial). */
  serialError: string;
  /** Serial repeated inside this batch. */
  batchError: string;
  /** Error returned when this device failed to save (e.g. 409). */
  saveError: string;
  checkingSerial: boolean;
  /** Set after a save attempt or a system-info import: missing required hardware is highlighted. */
  showHardwareErrors: boolean;
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
      imagePreview: '',
      serialError: '',
      batchError: '',
      saveError: '',
      checkingSerial: false,
      showHardwareErrors: false
    };
  }

  /** Laptop and Desktop need RAM, Storage and CPU. */
  requiresHardware(device: DeviceForm): boolean {
    return requiresHardware(device.deviceType);
  }

  missingHardware(device: DeviceForm): HardwareField[] {
    return missingHardware(device.deviceType, {
      ram: device.ram,
      storage: device.storage1 || device.storage2,
      cpu: device.cpu
    });
  }

  isMissing(device: DeviceForm, field: HardwareField): boolean {
    return device.showHardwareErrors && this.missingHardware(device).includes(field);
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

        // Show right away which required fields the file did not fill.
        device.showHardwareErrors = true;
        const missing = this.missingHardware(device);

        if (missing.length) {
          this.notify.error(`System info loaded, but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} still required for ${device.deviceType}.`);
        } else {
          this.notify.success('System info loaded successfully');
        }
      } catch {
        this.notify.error('Invalid JSON file.');
      }

      input.value = '';
      this.cdr.detectChanges();

      // The import fills the serial (serviceTag): check it like a manual entry.
      this.checkSerial(index);
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
    this.updateBatchDuplicates();
  }

  cancel(): void {
    this.router.navigate(['/devices']);
  }

  /** Save is blocked while any serial is known to clash or is still being checked. */
  get hasSerialProblems(): boolean {
    return this.devicesToAdd.some(d => d.serialError || d.batchError || d.checkingSerial);
  }

  /** The serial input changed: old errors no longer apply until it is checked again. */
  onSerialInput(device: DeviceForm): void {
    device.serialError = '';
    device.saveError = '';
    this.updateBatchDuplicates();
  }

  /** On blur (and after a system-info import): check the batch and the server. */
  checkSerial(index: number): void {
    const device = this.devicesToAdd[index];
    if (!device) return;

    this.updateBatchDuplicates();

    const serial = normalizeSerial(device.serialNumber);
    device.serialError = '';

    if (!serial) {
      device.checkingSerial = false;
      this.cdr.detectChanges();
      return;
    }

    device.checkingSerial = true;
    this.cdr.detectChanges();

    this.devicesService.checkSerial(serial).subscribe({
      next: result => {
        // Ignore a late answer for a value the user has already changed.
        if (normalizeSerial(device.serialNumber) !== serial) return;

        device.checkingSerial = false;
        device.serialError = result.exists ? serialInUseMessage(result) : '';
        this.cdr.detectChanges();
      },
      error: err => {
        // Not blocking: the server checks again on save.
        device.checkingSerial = false;
        this.notify.apiError(err, 'Could not check the serial number.');
        this.cdr.detectChanges();
      }
    });
  }

  /** Marks devices whose serial repeats inside this batch. Returns true if any do. */
  updateBatchDuplicates(): boolean {
    const bySerial = new Map<string, number[]>();

    this.devicesToAdd.forEach((device, i) => {
      const serial = normalizeSerial(device.serialNumber);
      if (serial) bySerial.set(serial, [...(bySerial.get(serial) ?? []), i]);
    });

    let found = false;

    this.devicesToAdd.forEach((device, i) => {
      const indexes = bySerial.get(normalizeSerial(device.serialNumber)) ?? [];
      const others = indexes.filter(x => x !== i).map(x => `#${x + 1}`);

      device.batchError = others.length ? `Same serial as Device ${others.join(', ')} in this batch` : '';
      found ||= others.length > 0;
    });

    this.cdr.detectChanges();
    return found;
  }

  saveDevices(): void {
    if (this.loading) return;

    const invalid = this.devicesToAdd.some(device => !device.deviceName.trim());

    if (invalid) {
      this.notify.error('Please enter device name.');
      return;
    }

    this.devicesToAdd.forEach(d => (d.showHardwareErrors = true));
    const incomplete = this.devicesToAdd
      .map((device, i) => ({ i, device, missing: this.missingHardware(device) }))
      .filter(x => x.missing.length);

    if (incomplete.length) {
      const { i, device, missing } = incomplete[0];
      const more = incomplete.length > 1 ? ` (and ${incomplete.length - 1} more device(s))` : '';
      this.notify.error(`Device #${i + 1} (${device.deviceType}): ${missing.join(', ')} required${more}.`);
      this.cdr.detectChanges();
      return;
    }

    if (this.updateBatchDuplicates()) {
      this.notify.error('Some serial numbers are repeated in this batch.');
      return;
    }

    if (this.hasSerialProblems) {
      this.notify.error('Fix the serial number errors first.');
      return;
    }

    this.loading = true;
    this.devicesToAdd.forEach(d => (d.saveError = ''));
    this.cdr.detectChanges();

    const batch = [...this.devicesToAdd];

    // One at a time: parallel creates could race on the next DEV-xxxx code.
    from(batch)
      .pipe(
        concatMap(device =>
          this.devicesService.createDevice(this.toRequest(device)).pipe(
            map(() => ({ device, error: null as unknown })),
            catchError(error => of({ device, error }))
          )
        ),
        toArray()
      )
      .subscribe(results => {
        this.loading = false;

        const failed = results.filter(r => r.error !== null);
        const savedCount = results.length - failed.length;

        if (failed.length === 0) {
          this.notify.success(`${savedCount} device(s) added successfully`);
          this.cdr.detectChanges();
          this.router.navigate(['/devices']);
          return;
        }

        for (const { device, error } of failed) {
          console.error('Create device error:', error);
          device.saveError = this.notify.getErrorMessage(error, 'Failed to save device.');
        }

        // Saved devices already exist; keep only the failed ones, with their data, for a retry.
        this.devicesToAdd = failed.map(f => f.device);

        const first = failed[0].device;
        const label = first.deviceName.trim() || 'Device';
        this.notify.error(
          savedCount > 0
            ? `${savedCount} saved, ${failed.length} not saved. ${label}: ${first.saveError}`
            : `${label}: ${first.saveError}`
        );

        this.cdr.detectChanges();
      });
  }

  private toRequest(device: DeviceForm): CreateDeviceRequest {
    return {
      deviceName: device.deviceName.trim(),
      imeiSerial: device.imeiSerial?.trim() || '',
      serialNumber: normalizeSerial(device.serialNumber),
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
    };
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