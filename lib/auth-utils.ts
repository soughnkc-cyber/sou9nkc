import { Role } from "@/app/generated/prisma/client";

export type Permissions = {
  canViewOrders: boolean;
  canEditOrders: boolean;
  canViewUsers: boolean;
  canEditUsers: boolean;
  canViewProducts: boolean;
  canEditProducts: boolean;
  canViewStatuses: boolean;
  canEditStatuses: boolean;
  canViewReporting: boolean;
  canViewDashboard: boolean;
};

/**
 * Checks if a user has a specific permission.
 * ADMIN role bypasses all checks and returns true.
 */
export const hasPermission = (
  role: string | undefined,
  permissions: Partial<Permissions> | undefined,
  requiredPermission: keyof Permissions
): boolean => {
  if (!role) return false;
  
  // Rule: ADMIN and SUPERVISOR can NEVER edit orders
  if (requiredPermission === "canEditOrders" && (role === "ADMIN" || role === "SUPERVISOR")) {
    return false;
  }

  if (!permissions) return false;
  
  // Check the specific permission flag strictly
  return permissions[requiredPermission] === true;
};


/**
 * Checks if a user can view a specific route based on their permissions.
 */
export const canAccessRoute = (
  role: string | undefined,
  permissions: Partial<Permissions> | undefined,
  pathname: string
): boolean => {
  if (!role || !permissions) return false;

  // 1. Dashboard Routes
  if (pathname === "/admin") return role === "ADMIN" && hasPermission(role, permissions, "canViewDashboard");
  if (pathname === "/supervisor") return role === "SUPERVISOR" && hasPermission(role, permissions, "canViewDashboard");
  if (pathname === "/agent") return (role === "AGENT" || role === "AGENT_TEST") && hasPermission(role, permissions, "canViewDashboard");

  // 2. Module Routes (Role + Permission check)
  if (pathname.startsWith("/list/users")) {
    return role === "ADMIN" && hasPermission(role, permissions, "canViewUsers");
  }
  
  if (pathname.startsWith("/list/orders")) {
    return hasPermission(role, permissions, "canViewOrders"); // All roles can see orders if permitted
  }
  
  if (pathname.startsWith("/list/products")) {
    return (role === "ADMIN" || role === "SUPERVISOR") && hasPermission(role, permissions, "canViewProducts");
  }
  
  if (pathname.startsWith("/list/status")) {
    return role === "ADMIN" && hasPermission(role, permissions, "canViewStatuses");
  }
  
  if (pathname.startsWith("/list/reporting")) {
    return (role === "ADMIN" || role === "SUPERVISOR") && hasPermission(role, permissions, "canViewReporting");
  }

  return true;
};

