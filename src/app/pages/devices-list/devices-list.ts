import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DEVICE_STATUSES, DeviceRow, DevicesService } from '../../services/devices.service';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './devices-list.html',
  styleUrls: ['./devices-list.scss']
})
export class DevicesList implements OnInit {
  protected readonly auth = inject(AuthService);

  searchText = '';
  selectedStatus = 'All';
  selectedType = 'All';

  statuses: string[] = ['All', ...DEVICE_STATUSES];
  types = ['All', 'Mobile', 'Laptop', 'Tablet', 'Desktop', 'Bag', 'SIM Line'];

  devices: DeviceRow[] = [];

  loading = false;
  errorMessage = '';

  page = 1;
  pageSize = 12;

  constructor(
    private readonly devicesService: DevicesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.loading = true;
    this.errorMessage = '';

    this.devicesService.getDevices()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.devices = (res ?? []).map(device => ({
            ...device,
            imageUrl: this.normalizeImageUrl(device.imageUrl)
          }));

          this.page = 1;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Devices error:', err);
          this.errorMessage = `Failed to load devices. Status: ${err.status || 'error'}`;
        }
      });
  }

  private normalizeImageUrl(imageUrl?: string): string {
    if (!imageUrl) return '';

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    return imageUrl;
  }

  get filteredDevices(): DeviceRow[] {
    const search = this.searchText.trim().toLowerCase();

    return this.devices.filter(device => {
      const name = device.name ?? '';
      const code = device.code ?? '';
      const serial = device.serial ?? '';
      const type = device.type ?? '';
      const model = device.model ?? '';
      const status = device.status ?? '';
      const assignedUser = device.assignedUser ?? '';

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search) ||
        code.toLowerCase().includes(search) ||
        serial.toLowerCase().includes(search) ||
        type.toLowerCase().includes(search) ||
        model.toLowerCase().includes(search) ||
        status.toLowerCase().includes(search) ||
        assignedUser.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' || status === this.selectedStatus;

      const matchesType =
        this.selectedType === 'All' || type === this.selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  get pagedDevices(): DeviceRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredDevices.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.filteredDevices.length / this.pageSize), 1);
  }

  get startEntry(): number {
    if (this.filteredDevices.length === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endEntry(): number {
    return Math.min(this.page * this.pageSize, this.filteredDevices.length);
  }

  setStatus(status: string): void {
    this.selectedStatus = status;
    this.page = 1;
  }

  setType(type: string): void {
    this.selectedType = type;
    this.page = 1;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
    this.selectedType = 'All';
    this.page = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
  }

  getStatusClass(status: string): string {
    return (status || '').toLowerCase();
  }

  getDeviceInitial(device: DeviceRow): string {
    const type = device.type || device.name || 'D';
    return type.charAt(0).toUpperCase();
  }

  getDeviceImage(device: DeviceRow): string {
    if (!device.imageUrl) return '';

    const separator = device.imageUrl.includes('?') ? '&' : '?';
    return `${device.imageUrl}${separator}v=${device.id}`;
  }

  openImage(device: DeviceRow): void {
    if (!device.imageUrl) return;
    window.open(device.imageUrl, '_blank');
  }

  onImageError(event: Event, device: DeviceRow): void {
    device.imageUrl = '';
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    this.cdr.detectChanges();
  }
}