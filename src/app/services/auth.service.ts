import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { EDIT_ROLES, Role, Roles } from '../core/roles';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface CurrentUser {
  id: number;
  fullName: string;
  userName: string;
  role: Role;
}

interface LoginResponse {
  token: string;
  user: CurrentUser;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'currentUser';

/** Login fails with a TimeoutError if the API does not answer within this time. */
const LOGIN_TIMEOUT_MS = 10_000;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = environment.apiUrl;

  private readonly user = signal<CurrentUser | null>(this.readStoredUser());

  /** The signed-in system user, or null. */
  readonly currentUser = this.user.asReadonly();

  readonly canEditSignal = computed(() => this.hasRole(...EDIT_ROLES));
  readonly isSuperAdminSignal = computed(() => this.hasRole(Roles.SuperAdmin));

  constructor(private readonly http: HttpClient) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/Auth/login`, data)
      .pipe(
        timeout(LOGIN_TIMEOUT_MS),
        tap(res => this.saveSession(res.token, res.user))
      );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isExpired(token) && !!this.user();
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.user()?.role;
    return !!role && roles.includes(role);
  }

  canEdit(): boolean {
    return this.canEditSignal();
  }

  isSuperAdmin(): boolean {
    return this.isSuperAdminSignal();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
  }

  private saveSession(token: string, user: CurrentUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.user.set(user);
  }

  private readStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /** Reads the JWT exp claim. The server still validates the token; this only avoids a pointless round trip. */
  private isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}
