import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from './roles';

/** Requires a signed-in user with an unexpired token. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.isLoggedIn()) return true;

  auth.logout();
  return inject(Router).createUrlTree(['/login']);
};

/** Requires one of the roles in route data `roles`. Use together with authGuard. */
export const roleGuard: CanActivateFn = route => {
  const roles = (route.data['roles'] ?? []) as Role[];

  if (inject(AuthService).hasRole(...roles)) return true;

  return inject(Router).createUrlTree(['/unauthorized']);
};
