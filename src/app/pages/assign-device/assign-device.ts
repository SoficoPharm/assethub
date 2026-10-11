import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UsersService, UserRow } from '../../services/users.service';
import { DevicesService, DeviceRow } from '../../services/devices.service';
import { AssignmentsService } from '../../services/assignments.service';

@Component({
  selector: 'app-assign-device',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-device.html',
  styleUrls: ['./assign-device.scss']
})
export class AssignDevice implements OnInit {
  userSearch = '';
  deviceSearch = '';

  selectedUser: UserRow | null = null;
  selectedDevice: DeviceRow | null = null;

  users: UserRow[] = [];
  devices: DeviceRow[] = [];

  loadingUsers = false;
  loadingDevices = false;
  assigning = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private readonly router: Router,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly assignmentsService: AssignmentsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadAvailableDevices();
  }

  loadUsers(): void {
    this.loadingUsers = true;

    this.usersService.getUsers()
      .pipe(finalize(() => {
        this.loadingUsers = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: res => this.users = res ?? [],
        error: err => {
          console.error('Assign users error:', err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to load users.'), 'error');
        }
      });
  }

  loadAvailableDevices(): void {
    this.loadingDevices = true;

    this.devicesService.getAvailableDevices()
      .pipe(finalize(() => {
        this.loadingDevices = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: res => this.devices = res ?? [],
        error: err => {
          console.error('Available devices error:', err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to load available devices.'), 'error');
        }
      });
  }

  get filteredUsers(): UserRow[] {
    const search = this.userSearch.trim().toLowerCase();

    return this.users.filter(user => {
      const name = user.name ?? '';
      const email = user.email ?? '';
      const department = user.department ?? '';
      const employeeId = user.employeeId ?? '';

      return (
        !search ||
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        department.toLowerCase().includes(search) ||
        employeeId.toLowerCase().includes(search)
      );
    });
  }

  get filteredDevices(): DeviceRow[] {
    const search = this.deviceSearch.trim().toLowerCase();

    return this.devices.filter(device => {
      const name = device.name ?? '';
      const code = device.code ?? '';
      const model = device.model ?? '';
      const type = device.type ?? '';
      const serial = device.serial ?? '';

      return (
        !search ||
        name.toLowerCase().includes(search) ||
        code.toLowerCase().includes(search) ||
        model.toLowerCase().includes(search) ||
        type.toLowerCase().includes(search) ||
        serial.toLowerCase().includes(search)
      );
    });
  }

  selectUser(user: UserRow): void {
    if (this.assigning) return;
    this.selectedUser = user;
  }

  selectDevice(device: DeviceRow): void {
    if (this.assigning) return;
    this.selectedDevice = device;
  }

  assignDevice(): void {
    if (!this.selectedUser || !this.selectedDevice) {
      this.showAppToast('Please select user and device.', 'error');
      return;
    }

    this.assigning = true;

    this.assignmentsService.assignDevice({
      userId: this.selectedUser.id,
      deviceId: this.selectedDevice.id
    })
      .pipe(finalize(() => {
        this.assigning = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.showAppToast('Device assigned successfully', 'success');

          setTimeout(() => {
            this.router.navigate(['/assignments/history']);
          }, 600);
        },
        error: err => {
          console.error('Assign error:', err);
          this.showAppToast(this.getErrorMessage(err, 'Failed to assign device.'), 'error');
        }
      });
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
}