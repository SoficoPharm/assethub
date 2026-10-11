import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  title: string;
  jobTitle?: string;
  role: string;
  devices: number;
  images: number;
  initials: string;
  imageUrl?: string;
  userDomain?: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  jobTitle: string;
  role: string;
  images: number;
  imageUrl?: string;
  imageFile?: File | null;
  userDomain?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  private toFormData(data: CreateUserRequest): FormData {
    const formData = new FormData();

    formData.append('FullName', data.fullName ?? '');
    formData.append('Email', data.email ?? '');
    formData.append('EmployeeId', data.employeeId ?? '');
    formData.append('Department', data.department ?? '');
    formData.append('JobTitle', data.jobTitle ?? '');
    formData.append('Role', data.role ?? 'Viewer');
    formData.append('Images', String(data.images ?? 0));
    formData.append('ImageUrl', data.imageUrl ?? '');
    formData.append('UserDomain', data.userDomain ?? '');

    if (data.imageFile) {
      formData.append('ImageFile', data.imageFile, data.imageFile.name);
    }

    return formData;
  }

  getUsers(): Observable<UserRow[]> {
    return this.http.get<UserRow[]>(`${this.api}/Users`, {
      headers: this.headers()
    });
  }

  getUserById(id: number): Observable<UserRow> {
    return this.http.get<UserRow>(`${this.api}/Users/${id}`, {
      headers: this.headers()
    });
  }

  getUserByEmployeeId(employeeId: string): Observable<UserRow> {
    return this.http.get<UserRow>(`${this.api}/Users/by-employee/${employeeId}`, {
      headers: this.headers()
    });
  }

  createUser(data: CreateUserRequest): Observable<unknown> {
    return this.http.post(`${this.api}/Users`, this.toFormData(data), {
      headers: this.headers()
    });
  }

  updateUser(id: number, data: CreateUserRequest): Observable<unknown> {
    return this.http.put(`${this.api}/Users/${id}`, this.toFormData(data), {
      headers: this.headers()
    });
  }

  deleteUser(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Users/${id}`, {
      headers: this.headers()
    });
  }
}