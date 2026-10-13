/** Mirrors AssetHub.Api.Authorization.Roles. */
export const Roles = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  SupportIT: 'SupportIT',
  Viewer: 'Viewer'
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const ALL_ROLES: Role[] = [Roles.SuperAdmin, Roles.Admin, Roles.SupportIT, Roles.Viewer];

/** Roles allowed to create and edit, including assign, return and activate/deactivate (backend policy CanCreateOrEdit). */
export const EDIT_ROLES: Role[] = [Roles.SuperAdmin, Roles.Admin, Roles.SupportIT];

/** Roles allowed to delete (backend policy CanDelete). SupportIT can never delete. */
export const DELETE_ROLES: Role[] = [Roles.SuperAdmin, Roles.Admin];
