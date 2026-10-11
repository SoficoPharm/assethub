import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Department {
  id: number;
  departmentName: string;
  managerName: string;
  membersCount: number;
}

export interface CreateDepartment {
  departmentName: string;
  managerName: string;
  membersCount: number;
}

@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.api}/Departments`, {
      headers: this.headers()
    });
  }

  createDepartment(data: CreateDepartment): Observable<Department> {
    return this.http.post<Department>(`${this.api}/Departments`, data, {
      headers: this.headers()
    });
  }

  updateDepartment(id: number, data: CreateDepartment): Observable<unknown> {
    return this.http.put(`${this.api}/Departments/${id}`, data, {
      headers: this.headers()
    });
  }

  deleteDepartment(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Departments/${id}`, {
      headers: this.headers()
    });
  }
}