import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DeviceType {
  id: number;
  typeName: string;
  devicesCount: number;
  icon: string;
}

export interface CreateDeviceType {
  typeName: string;
  devicesCount: number;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceTypesService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<DeviceType[]> {
    return this.http.get<DeviceType[]>(`${this.api}/DeviceTypes`);
  }

  create(data: CreateDeviceType): Observable<DeviceType> {
    return this.http.post<DeviceType>(`${this.api}/DeviceTypes`, data);
  }

  update(id: number, data: CreateDeviceType): Observable<unknown> {
    return this.http.put(`${this.api}/DeviceTypes/${id}`, data);
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/DeviceTypes/${id}`);
  }
}
