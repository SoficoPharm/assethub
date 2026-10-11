import { HttpClient } from '@angular/common/http';
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

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.api}/Departments`);
  }

  createDepartment(data: CreateDepartment): Observable<Department> {
    return this.http.post<Department>(`${this.api}/Departments`, data);
  }

  updateDepartment(id: number, data: CreateDepartment): Observable<unknown> {
    return this.http.put(`${this.api}/Departments/${id}`, data);
  }

  deleteDepartment(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/Departments/${id}`);
  }
}