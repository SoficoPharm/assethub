import { HttpClient } from '@angular/common/http';
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
  /** ISO 8601 UTC */
  assignedDate: string;
  /** ISO 8601 UTC, null while the assignment is active */
  returnedDate: string | null;
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

  getAssignments(): Observable<AssignmentRow[]> {
    return this.http.get<AssignmentRow[]>(`${this.api}/Assignments`);
  }

  assignDevice(data: AssignDeviceRequest): Observable<unknown> {
    return this.http.post(`${this.api}/Assignments`, data);
  }

  returnDevice(id: number): Observable<unknown> {
    return this.http.put(`${this.api}/Assignments/${id}/return`, {});
  }
}