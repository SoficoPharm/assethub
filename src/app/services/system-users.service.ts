import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role } from '../core/roles';

export interface SystemUser {
  id: number;
  fullName: string;
  userName: string;
  email: string;
  department: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface SystemUserForm {
  fullName: string;
  userName: string;
  email: string;
  department: string;
  role: Role;
}

export interface CreateSystemUserRequest extends SystemUserForm {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class SystemUsersService {
  private readonly api = `${environment.apiUrl}/SystemUsers`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(this.api);
  }

  create(data: CreateSystemUserRequest): Observable<SystemUser> {
    return this.http.post<SystemUser>(this.api, data);
  }

  update(id: number, data: SystemUserForm): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.api}/${id}`, data);
  }

  resetPassword(id: number, newPassword: string): Observable<unknown> {
    return this.http.put(`${this.api}/${id}/reset-password`, { newPassword });
  }

  toggleActive(id: number): Observable<SystemUser> {
    return this.http.put<SystemUser>(`${this.api}/${id}/toggle-active`, {});
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
