import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.scss']
})
export class NotFound {
  constructor(private readonly router: Router) {}

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}