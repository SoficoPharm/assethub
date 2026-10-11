import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.scss']
})
export class Topbar {
  constructor(private router: Router) {}

  logout() {
    localStorage.clear(); // امسح التوكن
    this.router.navigate(['/login']);
  }
}