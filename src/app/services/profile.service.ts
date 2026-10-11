import { HttpClient, HttpHeaders } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  getMyProfile(): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${this.api}/Profile/me`, {
      headers: this.headers()
    });
  }
}