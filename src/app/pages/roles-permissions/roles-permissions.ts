import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PermissionRow {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  assign: boolean;
}

interface RoleItem {
  name: string;
  desc: string;
  permissions: PermissionRow[];
}

@Component({
  selector: 'app-roles-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-permissions.html',
  styleUrls: ['./roles-permissions.scss']
})
export class RolesPermissions implements OnInit {
  selectedRoleIndex = 0;
  showRoleForm = false;
  editRoleIndex: number | null = null;

  roleName = '';
  roleDesc = '';

  showToast = false;
  toastMessage = '';

  modules = ['Devices', 'Users', 'Assignments', 'Reports', 'Settings'];

  roles: RoleItem[] = [
    {
      name: 'Admin',
      desc: 'Full access to all system features',
      permissions: this.createPermissions(true)
    },
    {
      name: 'IT Support',
      desc: 'Manage devices and assignments',
      permissions: [
        { module: 'Devices', view: true, create: true, edit: true, delete: false, assign: true },
        { module: 'Users', view: true, create: false, edit: false, delete: false, assign: false },
        { module: 'Assignments', view: true, create: true, edit: true, delete: false, assign: true },
        { module: 'Reports', view: true, create: false, edit: false, delete: false, assign: false },
        { module: 'Settings', view: false, create: false, edit: false, delete: false, assign: false }
      ]
    },
    {
      name: 'Manager',
      desc: 'View reports and team devices',
      permissions: [
        { module: 'Devices', view: true, create: false, edit: false, delete: false, assign: false },
        { module: 'Users', view: true, create: false, edit: false, delete: false, assign: false },
        { module: 'Assignments', view: true, create: false, edit: false, delete: false, assign: false },
        { module: 'Reports', view: true, create: false, edit: false, delete: false, assign: false },
        { module: 'Settings', view: false, create: false, edit: false, delete: false, assign: false }
      ]
    },
    {
      name: 'Viewer',
      desc: 'Read-only access to all data',
      permissions: this.createPermissions(false, true)
    }
  ];

  ngOnInit(): void {
    const savedRoles = localStorage.getItem('assethub_roles_permissions');

    if (savedRoles) {
      this.roles = JSON.parse(savedRoles);
    } else {
      this.saveToStorage();
    }

    this.syncRoleOptions();
  }

  get selectedRole(): RoleItem {
    return this.roles[this.selectedRoleIndex];
  }

  get permissions(): PermissionRow[] {
    return this.selectedRole.permissions;
  }

  selectRole(index: number): void {
    this.selectedRoleIndex = index;
    this.showRoleForm = false;
    this.editRoleIndex = null;
  }

  openAddRole(): void {
    this.showRoleForm = true;
    this.editRoleIndex = null;
    this.roleName = '';
    this.roleDesc = '';
  }

  editRole(index: number, event: Event): void {
    event.stopPropagation();

    const role = this.roles[index];

    this.showRoleForm = true;
    this.editRoleIndex = index;
    this.roleName = role.name;
    this.roleDesc = role.desc;
    this.selectedRoleIndex = index;
  }

  deleteRole(index: number, event: Event): void {
    event.stopPropagation();

    const role = this.roles[index];

    if (role.name === 'Admin') {
      this.showGreenToast('Admin role cannot be deleted.');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete ${role.name}?`);
    if (!confirmed) return;

    this.roles.splice(index, 1);

    if (this.selectedRoleIndex >= this.roles.length) {
      this.selectedRoleIndex = 0;
    }

    this.saveToStorage();
    this.syncRoleOptions();
    this.showGreenToast('Role deleted successfully');
  }

  saveRole(): void {
    if (!this.roleName.trim() || !this.roleDesc.trim()) {
      this.showGreenToast('Please enter role name and description.');
      return;
    }

    const roleName = this.roleName.trim();

    const duplicated = this.roles.some((role, index) =>
      role.name.toLowerCase() === roleName.toLowerCase() &&
      index !== this.editRoleIndex
    );

    if (duplicated) {
      this.showGreenToast('Role already exists.');
      return;
    }

    if (this.editRoleIndex !== null) {
      this.roles[this.editRoleIndex] = {
        ...this.roles[this.editRoleIndex],
        name: roleName,
        desc: this.roleDesc.trim()
      };

      this.selectedRoleIndex = this.editRoleIndex;
      this.showGreenToast('Role updated successfully');
    } else {
      this.roles.push({
        name: roleName,
        desc: this.roleDesc.trim(),
        permissions: this.createPermissions(false)
      });

      this.selectedRoleIndex = this.roles.length - 1;
      this.showGreenToast('Role created successfully');
    }

    this.saveToStorage();
    this.syncRoleOptions();
    this.cancelRoleForm();
  }

  cancelRoleForm(): void {
    this.showRoleForm = false;
    this.editRoleIndex = null;
    this.roleName = '';
    this.roleDesc = '';
  }

  togglePermission(permission: PermissionRow, key: keyof Omit<PermissionRow, 'module'>): void {
    permission[key] = !permission[key];
  }

  saveChanges(): void {
    this.saveToStorage();
    this.syncRoleOptions();
    this.showGreenToast('Permissions saved successfully');
  }

  createPermissions(all = false, viewOnly = false): PermissionRow[] {
    return this.modules.map(module => ({
      module,
      view: all || viewOnly,
      create: all,
      edit: all,
      delete: all,
      assign: all
    }));
  }

  saveToStorage(): void {
    localStorage.setItem('assethub_roles_permissions', JSON.stringify(this.roles));
  }

  syncRoleOptions(): void {
    const roleNames = this.roles.map(role => role.name);
    localStorage.setItem('assethub_user_roles', JSON.stringify(roleNames));
  }

  showGreenToast(message: string): void {
    this.toastMessage = message;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 2500);
  }
}