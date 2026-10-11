import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import {
  ActivityItem,
  ChartItem,
  DashboardResponse,
  DashboardService,
  StatCard
} from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  statCards: StatCard[] = [];
  deviceTypes: ChartItem[] = [];
  platforms: ChartItem[] = [];
  activities: ActivityItem[] = [];

  loading = false;
  errorMessage = '';

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.getDashboard()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: DashboardResponse) => {
          this.statCards = res?.statCards ?? [];

          this.deviceTypes = (res?.devicesByType ?? []).map((item, index) => ({
            name: item.name || 'N/A',
            value: Number(item.value) || 0,
            className: this.getTypeClass(index)
          }));

          this.platforms = (res?.devicesByPlatform ?? []).map((item, index) => ({
            name: item.name || 'N/A',
            value: Number(item.value) || 0,
            className: this.getPlatformClass(item.name || '', index)
          }));

          this.activities = res?.recentActivity ?? [];

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Dashboard error:', err);
          this.errorMessage = `Failed to load dashboard data. Status: ${err.status || 'error'}`;
        }
      });
  }

  get donutStyle(): string {
    const total = this.deviceTypes.reduce((sum, item) => sum + item.value, 0);

    if (!total) {
      return '#e5e7eb';
    }

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];
    let currentDegree = 0;

    const parts = this.deviceTypes.map((item, index) => {
      const start = currentDegree;
      const degree = (item.value / total) * 360;
      currentDegree += degree;

      return `${colors[index % colors.length]} ${start}deg ${currentDegree}deg`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  }

  getMaxPlatformValue(): number {
    if (!this.platforms.length) return 1;
    return Math.max(...this.platforms.map(item => item.value), 1);
  }

  getBarHeight(value: number): number {
    return (value / this.getMaxPlatformValue()) * 190;
  }

  getTypeClass(index: number): string {
    const classes = ['blue', 'green', 'amber', 'purple', 'red', 'gray'];
    return classes[index % classes.length];
  }

  getPlatformClass(name: string, index: number): string {
    const lower = name.toLowerCase();

    if (lower.includes('mac')) return 'mac';
    if (lower.includes('windows')) return 'windows';
    if (lower.includes('ios')) return 'ios';
    if (lower.includes('android')) return 'android';

    const classes = ['mac', 'windows', 'ios', 'android'];
    return classes[index % classes.length];
  }
}