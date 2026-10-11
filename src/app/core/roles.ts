/** Mirrors AssetHub.Api.Authorization.Roles. */
export const Roles = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  Viewer: 'Viewer'
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const ALL_ROLES: Role[] = [Roles.SuperAdmin, Roles.Admin, Roles.Viewer];

/** Roles allowed to create, edit and delete (backend policy CanEdit). */
export const EDIT_ROLES: Role[] = [Roles.SuperAdmin, Roles.Admin];
