import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, CurrentUser } from '../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar implements OnInit {
  currentUser: CurrentUser | null = null;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Devices', icon: 'devices', route: '/devices' },
    { label: 'Users', icon: 'users', route: '/users' },
    {
      label: 'Assignments',
      icon: 'assignments',
      children: [
        { label: 'Assign Device', icon: 'assignments', route: '/assignments/add' },
        { label: 'Assignment History', icon: 'assignments', route: '/assignments/history' }
      ]
    },
    { label: 'Reports', icon: 'reports', route: '/reports' },
    {
      label: 'Settings',
      icon: 'settings',
      children: [
        { label: 'Departments', icon: 'departments', route: '/departments' },
        { label: 'Device Types', icon: 'device-types', route: '/device-types' }
      ]
    },
    { label: 'Audit Logs', icon: 'audit', route: '/audit-logs' }
  ];

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  get fullName(): string {
    return this.currentUser?.fullName || 'System User';
  }

  get userName(): string {
    return this.currentUser?.userName || '';
  }

  get role(): string {
    return this.currentUser?.role || '';
  }

  get initials(): string {
    return this.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(x => x[0].toUpperCase())
      .join('') || 'SU';
  }

  get subtitle(): string {
    return this.role || this.userName || 'Logged in';
  }
}