import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Profile } from './pages/profile/profile';
import { Unauthorized } from './pages/unauthorized/unauthorized';
import { AddDevice } from './pages/add-device/add-device';
import { EditDevice } from './pages/edit-device/edit-device';
import { DevicesList } from './pages/devices-list/devices-list';
import { DeviceDetails } from './pages/device-details/device-details';
import { UsersList } from './pages/users-list/users-list';
import { AddUser } from './pages/add-user/add-user';
import { EditUser } from './pages/edit-user/edit-user';
import { UserDetails } from './pages/user-details/user-details';
import { NotFound } from './pages/not-found/not-found';
import { Departments } from './pages/departments/departments';
import { AssignDevice } from './pages/assign-device/assign-device';
import { Reports } from './pages/reports/reports';
import { AuditLogs } from './pages/audit-logs/audit-logs';
import { DeviceTypes } from './pages/device-types/device-types';
import { RolesPermissions } from './pages/roles-permissions/roles-permissions';
import { AssignmentHistory } from './pages/assignment-history/assignment-history';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: 'dashboard', component: Dashboard },
      { path: 'profile', component: Profile },
      { path: 'unauthorized', component: Unauthorized },

      { path: 'devices', component: DevicesList },
      { path: 'devices/add', component: AddDevice },
      { path: 'devices/edit/:code', component: EditDevice },
      { path: 'devices/details/:code', component: DeviceDetails },

      { path: 'users', component: UsersList },
      { path: 'users/add', component: AddUser },
      { path: 'users/edit/:id', component: EditUser },
      { path: 'users/details/:id', component: UserDetails },

      { path: 'departments', component: Departments },

      { path: 'assignments/add', component: AssignDevice },
      { path: 'assignments/history', component: AssignmentHistory },

      { path: 'reports', component: Reports },
      { path: 'audit-logs', component: AuditLogs },
      { path: 'device-types', component: DeviceTypes },
      { path: 'roles', component: RolesPermissions },

      { path: '404', component: NotFound }
    ]
  },

  { path: '**', redirectTo: '404' }
];