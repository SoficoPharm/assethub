import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Profile } from './pages/profile/profile';
import { Unauthorized } from './pages/unauthorized/unauthorized';
import { AddDevice } from './pages/add-device/add-device';
import { EditDevice } from './pages/edit-device/edit-device';
import { DevicesList } from './pages/devices-list/devices-list';
import { DeviceDetails } from './pages/device-details/device-details';
import { EmployeesList } from './pages/employees-list/employees-list';
import { AddEmployee } from './pages/add-employee/add-employee';
import { EditEmployee } from './pages/edit-employee/edit-employee';
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

      { path: 'employees', component: EmployeesList },
      { path: 'employees/add', component: AddEmployee },
      { path: 'employees/edit/:employeeId', component: EditEmployee },
      { path: 'employees/details/:id', component: UserDetails },

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