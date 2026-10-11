import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportChartItem {
  name: string;
  value: number;
}

export interface AvailabilityStatus {
  totalDevices: number;
  assigned: number;
  available: number;
  maintenance: number;
  inactiveLost: number;
}

export interface ReportsResponse {
  devicesPerType: ReportChartItem[];
  devicesPerDepartment: ReportChartItem[];
  availabilityStatus: AvailabilityStatus;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  getReports(range = 'This Year'): Observable<ReportsResponse> {
    const params = new HttpParams().set('range', range);

    return this.http.get<ReportsResponse>(`${this.api}/Reports`, {
      headers: this.headers(),
      params
    });
  }
}