import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuditLog {
  id: number;
  timestamp: string;
  timestampText?: string;
  actor: string;
  logAction: string;
  target: string;
  details: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private readonly api = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  getAll(search = '', action = 'All'): Observable<AuditLog[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (action && action !== 'All') {
      params = params.set('action', action);
    }

    return this.http.get<AuditLog[]>(`${this.api}/AuditLogs`, {
      headers: this.headers(),
      params
    });
  }

  clearAll(): Observable<unknown> {
    return this.http.delete(`${this.api}/AuditLogs/clear`, {
      headers: this.headers()
    });
  }
}