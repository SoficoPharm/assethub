import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [],
  templateUrl: './unauthorized.html',
  styleUrls: ['./unauthorized.scss']
})
export class Unauthorized {
  constructor(
    private readonly router: Router,
    private readonly auth: AuthService
  ) {}

  goBack(): void {
    history.back();
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
