import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface EmployeeRow {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  title: string;
  jobTitle?: string;
  devices: number;
  images: number;
  initials: string;
  imageUrl?: string;
  userDomain?: string;
}

export interface EmployeeRequest {
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  jobTitle: string;
  images: number;
  imageUrl?: string;
  imageFile?: File | null;
  userDomain?: string;
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

  deleteEmployee(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Users/${id}`);
  }
}