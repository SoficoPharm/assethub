import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TimeoutError, finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

const CANNOT_CONNECT = 'Cannot connect to the server. Try again later.';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  email = '';
  password = '';
  rememberMe = false;

  // Signals so the view updates as soon as the response arrives (the app is zoneless).
  readonly errorMessage = signal('');
  readonly loading = signal(false);

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService
  ) {}

  clearError(): void {
    if (this.errorMessage()) this.errorMessage.set('');
  }

  signIn(): void {
    if (this.loading()) return;

    this.errorMessage.set('');

    if (!this.email.trim() || !this.password) {
      this.errorMessage.set('Please enter username and password');
      return;
    }

    this.loading.set(true);

    this.auth.login({
      userName: this.email.trim(),
      password: this.password
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err: unknown) => this.errorMessage.set(this.describeError(err))
      });
  }

  private describeError(err: unknown): string {
    if (err instanceof TimeoutError) return CANNOT_CONNECT;

    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return CANNOT_CONNECT;

      if (err.status === 401) return err.error?.message || 'Invalid username or password';
      if (err.status === 403) return err.error?.message || 'Your account is disabled. Contact the IT Helpdesk.';
    }

    return 'Something went wrong. Try again later.';
  }
}
