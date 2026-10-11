import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guards';
import { EDIT_ROLES, Roles } from './core/roles';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Profile } from './pages/profile/profile';
import { Unauthorized } from './pages/unauthorized/unauthorized';
import { AddDevice } from './pages/add-device/add-device';
import { EditDevice } from './pages/edit-device/edit-device';
import { DevicesList } from './pages/devices-list/devices-list';
import { EmployeesList } from './pages/employees-list/employees-list';
import { AddEmployee } from './pages/add-employee/add-employee';
import { EditEmployee } from './pages/edit-employee/edit-employee';
import { NotFound } from './pages/not-found/not-found';
import { Departments } from './pages/departments/departments';
import { AssignDevice } from './pages/assign-device/assign-device';
import { Reports } from './pages/reports/reports';
import { AuditLogs } from './pages/audit-logs/audit-logs';
import { DeviceTypes } from './pages/device-types/device-types';
import { AssignmentHistory } from './pages/assignment-history/assignment-history';
import { SystemUsers } from './pages/system-users/system-users';
import { MainLayout } from './layout/main-layout/main-layout';

const editorsOnly = { canActivate: [roleGuard], data: { roles: EDIT_ROLES } };

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: 'dashboard', component: Dashboard },
      { path: 'profile', component: Profile },
      { path: 'unauthorized', component: Unauthorized },

      { path: 'devices', component: DevicesList },
      { path: 'devices/add', component: AddDevice, ...editorsOnly },
      { path: 'devices/edit/:code', component: EditDevice, ...editorsOnly },

      { path: 'employees', component: EmployeesList },
      { path: 'employees/add', component: AddEmployee, ...editorsOnly },
      { path: 'employees/edit/:employeeId', component: EditEmployee, ...editorsOnly },

      { path: 'departments', component: Departments },
      { path: 'device-types', component: DeviceTypes },

      { path: 'assignments/add', component: AssignDevice, ...editorsOnly },
      { path: 'assignments/history', component: AssignmentHistory },

      { path: 'reports', component: Reports },
      { path: 'audit-logs', component: AuditLogs },

      {
        path: 'system-users',
        component: SystemUsers,
        canActivate: [roleGuard],
        data: { roles: [Roles.SuperAdmin] }
      },

      { path: '404', component: NotFound }
    ]
  },

  { path: '**', redirectTo: '404' }
];
