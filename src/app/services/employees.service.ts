import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface EmployeeRow {
  id: number;
  name: string;
  email: string | null;
  employeeId: string;
  department: string;
  title: string;
  jobTitle?: string;
  devices: number;
  images: number;
  initials: string;
  imageUrl?: string;
  userDomain?: string;
  isActive: boolean;
}

export interface EmployeeRequest {
  fullName: string;
  /** Optional. An empty string is stored as no email. */
  email: string;
  employeeId: string;
  department: string;
  jobTitle: string;
  images: number;
  imageUrl?: string;
  imageFile?: File | null;
  userDomain?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email is optional: empty is fine, anything else must look like an email address. */
export function emailFormatError(email: string): string {
  const value = email.trim();
  return !value || EMAIL_PATTERN.test(value) ? '' : 'Enter a valid email address, or leave it empty.';
}

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private toFormData(data: EmployeeRequest): FormData {
    const formData = new FormData();

    formData.append('FullName', data.fullName ?? '');
    formData.append('Email', data.email ?? '');
    formData.append('EmployeeId', data.employeeId ?? '');
    formData.append('Department', data.department ?? '');
    formData.append('JobTitle', data.jobTitle ?? '');
    formData.append('Images', String(data.images ?? 0));
    formData.append('ImageUrl', data.imageUrl ?? '');
    formData.append('UserDomain', data.userDomain ?? '');

    if (data.imageFile) {
      formData.append('ImageFile', data.imageFile, data.imageFile.name);
    }

    return formData;
  }

  getEmployees(): Observable<EmployeeRow[]> {
    return this.http.get<EmployeeRow[]>(`${this.api}/Users`);
  }

  getEmployeeById(id: number): Observable<EmployeeRow> {
    return this.http.get<EmployeeRow>(`${this.api}/Users/${id}`);
  }

  getEmployeeByEmployeeId(employeeId: string): Observable<EmployeeRow> {
    return this.http.get<EmployeeRow>(`${this.api}/Users/by-employee/${employeeId}`);
  }

  createEmployee(data: EmployeeRequest): Observable<unknown> {
    return this.http.post(`${this.api}/Users`, this.toFormData(data));
  }

  updateEmployee(id: number, data: EmployeeRequest): Observable<unknown> {
    return this.http.put(`${this.api}/Users/${id}`, this.toFormData(data));
  }

  toggleActive(id: number): Observable<{ message: string; id: number; isActive: boolean }> {
    return this.http.put<{ message: string; id: number; isActive: boolean }>(`${this.api}/Users/${id}/toggle-active`, {});
  }

  deleteEmployee(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Users/${id}`);
  }
}