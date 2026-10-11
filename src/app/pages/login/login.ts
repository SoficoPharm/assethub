import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  errorMessage = '';
  loading = false;

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService
  ) {}

  signIn(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.loading = true;

    this.auth.login({
      userName: this.email.trim(),
      password: this.password.trim()
    }).subscribe({
      next: (res: any) => {
        this.auth.saveToken(res.token);

        localStorage.setItem('currentUser', JSON.stringify(res.user));

        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;

        if (err.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else {
          this.errorMessage = 'Server error, try again';
        }
      }
    });
  }
}