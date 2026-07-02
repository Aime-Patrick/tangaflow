"use client";

import { useAuth } from "@/lib/auth-context";
import { hasPermission, hasAnyPermission, type Permission } from "@/lib/permissions";

export function usePermission(permission: Permission): boolean {
  const { role } = useAuth();
  if (!role) return false;
  return hasPermission(role, permission);
}

export function useAnyPermission(permissions: Permission[]): boolean {
  const { role } = useAuth();
  if (!role) return false;
  return hasAnyPermission(role, permissions);
}
