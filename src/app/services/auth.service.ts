import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface CurrentUser {
  id: number;
  fullName: string;
  userName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  login(data: LoginRequest) {
    return this.http.post(`${this.api}/Auth/login`, data);
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  saveCurrentUser(user: CurrentUser): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUser(): CurrentUser | null {
    const raw = localStorage.getItem('currentUser');

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getRole(): string {
    return this.getCurrentUser()?.role || '';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }
}