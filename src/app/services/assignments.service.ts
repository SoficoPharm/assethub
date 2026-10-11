import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface AssignmentRow {
  dbId: number;
  id: string;
  user: string;
  initials: string;
  device: string;
  model: string;
  assignedDate: string;
  returnedDate: string;
  assignedDateRaw?: string;
  returnedDateRaw?: string | null;
  status: 'Active' | 'Returned';
}

export interface AssignDeviceRequest {
  userId: number;
  deviceId: number;
}

@Injectable({ providedIn: 'root' })
export class AssignmentsService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  getAssignments(): Observable<AssignmentRow[]> {
    return this.http.get<AssignmentRow[]>(`${this.api}/Assignments`, {
      headers: this.headers()
    });
  }

  assignDevice(data: AssignDeviceRequest): Observable<unknown> {
    return this.http.post(`${this.api}/Assignments`, data, {
      headers: this.headers()
    });
  }

  returnDevice(id: number): Observable<unknown> {
    return this.http.put(`${this.api}/Assignments/${id}/return`, {}, {
      headers: this.headers()
    });
  }
}