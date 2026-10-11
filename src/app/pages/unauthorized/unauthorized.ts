import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [],
  templateUrl: './unauthorized.html',
  styleUrls: ['./unauthorized.scss']
})
export class Unauthorized {
  constructor(private readonly router: Router) {}

  goBack(): void {
    history.back();
  }

  signOut(): void {
    this.router.navigate(['/login']);
  }
}