import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { EmployeesService, EmployeeRow } from '../../services/employees.service';
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
  private readonly notify = inject(NotificationService);

  userSearch = '';
  deviceSearch = '';

  selectedUser: EmployeeRow | null = null;
  selectedDevice: DeviceRow | null = null;

  users: EmployeeRow[] = [];
  devices: DeviceRow[] = [];

  loadingUsers = false;
  loadingDevices = false;
  assigning = false;


  constructor(
    private readonly router: Router,
    private readonly employeesService: EmployeesService,
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

    this.employeesService.getEmployees()
      .pipe(finalize(() => {
        this.loadingUsers = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: res => this.users = res ?? [],
        error: err => {
          console.error('Assign employees error:', err);
          this.notify.apiError(err, 'Failed to load employees.');
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
          this.notify.apiError(err, 'Failed to load available devices.');
        }
      });
  }

  get filteredUsers(): EmployeeRow[] {
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

  selectUser(user: EmployeeRow): void {
    if (this.assigning) return;
    this.selectedUser = user;
  }

  selectDevice(device: DeviceRow): void {
    if (this.assigning) return;
    this.selectedDevice = device;
  }

  assignDevice(): void {
    if (!this.selectedUser || !this.selectedDevice) {
      this.notify.error('Please select an employee and a device.');
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
          this.notify.success('Device assigned successfully');

          setTimeout(() => {
            this.router.navigate(['/assignments/history']);
          }, 600);
        },
        error: err => {
          console.error('Assign error:', err);
          this.notify.apiError(err, 'Failed to assign device.');
        }
      });
  }
}