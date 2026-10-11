import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface StatCard {
  label: string;
  value: string;
  icon: string;
  iconClass: string;
}

export interface ChartItem {
  name: string;
  value: number;
  className?: string;
}

export interface ActivityItem {
  title: string;
  user: string;
  time: string;
  color: string;
}

export interface DashboardResponse {
  statCards: StatCard[];
  devicesByType: ChartItem[];
  devicesByPlatform: ChartItem[];
  recentActivity: ActivityItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.api}/Dashboard`);
  }
}