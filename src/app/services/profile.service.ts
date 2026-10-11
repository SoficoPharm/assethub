import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface ProfileDto {
  id: number;
  fullName: string;
  userName: string;
  email: string;
  department: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getMyProfile(): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${this.api}/Profile/me`);
  }

  changePassword(data: ChangePasswordRequest): Observable<unknown> {
    return this.http.post(`${this.api}/Profile/change-password`, data);
  }
}