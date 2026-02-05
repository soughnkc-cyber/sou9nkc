"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/auth-utils";

/**
 * Standard server action helper to verify granular permissions in real-time.
 * Fetches the latest permissions directly from the database to bypass session lag.
 */
export async function checkPermission(requiredPermission: keyof Permissions | (keyof Permissions)[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Non authentifié");
  }

  const tokenUser = session.user as any;

  // Real-time fetch from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: {
      role: true,
      canViewOrders: true,
      canEditOrders: true,
      canViewUsers: true,
      canEditUsers: true,
      canViewProducts: true,
      canEditProducts: true,
      canViewStatuses: true,
      canEditStatuses: true,
      canViewReporting: true,
      canViewDashboard: true,
    }
  });

  if (!dbUser) {
    throw new Error("Compte utilisateur introuvable");
  }

  const permissionsArray = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  const isAuthorized = permissionsArray.some(p => hasPermission(dbUser.role, dbUser, p));

  if (!isAuthorized) {
    throw new Error("Accès refusé : Permission insuffisante");
  }

  // Update lastSeenAt as heartbeat (non-blocking for performance)
  prisma.user.update({
    where: { id: tokenUser.id },
    data: { lastSeenAt: new Date() }
  }).catch((err) => console.error("Heartbeat update failed:", err));

  return session;
}
