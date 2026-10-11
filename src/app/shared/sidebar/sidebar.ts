import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EDIT_ROLES, Role, Roles } from '../../core/roles';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  /** Roles that see this item. Omitted means every signed-in user. */
  roles?: Role[];
  children?: MenuItem[];
}

const MENU: MenuItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { label: 'Devices', icon: 'devices', route: '/devices' },
  { label: 'Employees', icon: 'users', route: '/employees' },
  {
    label: 'Assignments',
    icon: 'assignments',
    children: [
      { label: 'Assign Device', icon: 'assignments', route: '/assignments/add', roles: EDIT_ROLES },
      { label: 'Assignment History', icon: 'assignments', route: '/assignments/history' }
    ]
  },
  { label: 'Reports', icon: 'reports', route: '/reports' },
  {
    label: 'Settings',
    icon: 'settings',
    children: [
      { label: 'Departments', icon: 'departments', route: '/departments' },
      { label: 'Device Types', icon: 'device-types', route: '/device-types' },
      { label: 'System Users', icon: 'roles', route: '/system-users', roles: [Roles.SuperAdmin] }
    ]
  },
  { label: 'Audit Logs', icon: 'audit', route: '/audit-logs' }
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  readonly currentUser = this.auth.currentUser;

  readonly menuItems = computed(() => {
    this.currentUser();

    const visible = (item: MenuItem) => !item.roles || this.auth.hasRole(...item.roles);

    return MENU
      .filter(visible)
      .map(item => ({ ...item, children: item.children?.filter(visible) }))
      .filter(item => item.route || item.children?.length);
  });

  get fullName(): string {
    return this.currentUser()?.fullName || 'System User';
  }

  get userName(): string {
    return this.currentUser()?.userName || '';
  }

  get role(): string {
    return this.currentUser()?.role || '';
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
