import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import {
  AvailabilityStatus,
  ReportChartItem,
  ReportsService
} from '../../services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class Reports implements OnInit {
  selectedRange = 'This Year';

  deviceTypes: ReportChartItem[] = [];
  departmentData: ReportChartItem[] = [];

  availability: AvailabilityStatus = {
    totalDevices: 0,
    assigned: 0,
    available: 0,
    maintenance: 0,
    inactiveLost: 0
  };

  loading = false;
  errorMessage = '';

  constructor(
    private readonly reportsService: ReportsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reportsService.getReports(this.selectedRange)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.deviceTypes = res.devicesPerType ?? [];
          this.departmentData = res.devicesPerDepartment ?? [];

          this.availability = res.availabilityStatus ?? {
            totalDevices: 0,
            assigned: 0,
            available: 0,
            maintenance: 0,
            inactiveLost: 0
          };

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Reports error:', err);
          this.errorMessage = `Failed to load reports. Status: ${err.status || 'error'}`;
        }
      });
  }

  get maxTypeValue(): number {
    return Math.max(...this.deviceTypes.map(x => x.value), 1);
  }

  get maxDepartmentValue(): number {
    return Math.max(...this.departmentData.map(x => x.value), 1);
  }

  getTypeHeight(value: number): number {
    return (value / this.maxTypeValue) * 220;
  }

  getDepartmentWidth(value: number): number {
    return (value / this.maxDepartmentValue) * 180;
  }

  get totalDevicesText(): string {
    return this.availability.totalDevices.toLocaleString();
  }

  get donutStyle(): string {
    const total = this.availability.totalDevices;

    if (!total) {
      return '#e5e7eb';
    }

    const assignedDeg = (this.availability.assigned / total) * 360;
    const availableDeg = (this.availability.available / total) * 360;
    const maintenanceDeg = (this.availability.maintenance / total) * 360;
    const inactiveLostDeg = (this.availability.inactiveLost / total) * 360;

    const a1 = assignedDeg;
    const a2 = a1 + availableDeg;
    const a3 = a2 + maintenanceDeg;
    const a4 = a3 + inactiveLostDeg;

    return `conic-gradient(
      #10b981 0deg ${a1}deg,
      #64748b ${a1}deg ${a2}deg,
      #f59e0b ${a2}deg ${a3}deg,
      #ef4444 ${a3}deg ${a4}deg,
      #e5e7eb ${a4}deg 360deg
    )`;
  }

  exportPdf(): void {
    window.print();
  }
}