import type { OrgRole } from "@/models/Organization";

export type Permission =
  | "manage_organization"
  | "manage_members"
  | "manage_campaigns"
  | "create_campaigns"
  | "view_campaigns"
  | "delete_organization";

const rolePermissions: Record<OrgRole, Permission[]> = {
  owner: [
    "manage_organization",
    "manage_members",
    "manage_campaigns",
    "create_campaigns",
    "view_campaigns",
    "delete_organization",
  ],
  admin: [
    "manage_members",
    "manage_campaigns",
    "create_campaigns",
    "view_campaigns",
  ],
  member: [
    "create_campaigns",
    "view_campaigns",
  ],
};

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: OrgRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getRolePermissions(role: OrgRole): Permission[] {
  return rolePermissions[role] ?? [];
}
