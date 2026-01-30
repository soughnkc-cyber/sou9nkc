// app/actions/user.ts
"use server";

import prisma from "@/lib/prisma";
import { UserFormData } from "@/lib/schema";
import { User as PrismaUser } from "@/app/generated/prisma";
import bcrypt from "bcrypt";
import { User } from "@/app/(dashboard)/list/users/columns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasPermission, Permissions } from "@/lib/auth-utils";
import { checkPermission } from "../auth-helper";
import { revalidatePath } from "next/cache";



const SALT_ROUNDS = 10;





function mapUser(u: PrismaUser) {
  return {
    id: u.id,
    name: u.name ?? "Sans nom",
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? undefined,
    lastLogoutAt: u.lastLogoutAt?.toISOString() ?? undefined,
    isActive: u.status === "ACTIVE",
    iconColor: u.iconColor,
    roleColor: u.roleColor,
    paymentRemainingDays: u.paymentRemainingDays,
    paymentDefaultDays: u.paymentDefaultDays,
    lastSeenAt: u.lastSeenAt?.toISOString() ?? undefined,
    // Permissions
    canViewOrders: u.canViewOrders,
    canEditOrders: u.canEditOrders,
    canViewUsers: u.canViewUsers,
    canEditUsers: u.canEditUsers,
    canViewProducts: u.canViewProducts,
    canEditProducts: u.canEditProducts,
    canViewStatuses: u.canViewStatuses,
    canEditStatuses: u.canEditStatuses,
    canViewReporting: u.canViewReporting,
    canViewDashboard: u.canViewDashboard,
  };
}


export async function getUsers(): Promise<User[]> {
  await checkPermission("canViewUsers");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();

  return users.map(u => {
    const lastSeen = u.lastSeenAt?.getTime() ?? 0;
    const lastLogout = u.lastLogoutAt?.getTime() ?? 0;
    
    // Online si : (Vu récemment) ET (Pas déconnecté depuis la dernière activité)
    const isRecent = (now - lastSeen) < ONLINE_THRESHOLD_MS;
    const isNotLoggedOut = lastSeen > lastLogout;
    
    const online = isRecent && isNotLoggedOut;

    return {
      id: u.id,
      name: u.name ?? "Sans nom",
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      lastLogin: u.lastLoginAt?.toISOString(),
      lastLogout: u.lastLogoutAt?.toISOString(),
      status: online ? "ONLINE" : "OFFLINE",
      isActive: u.status === "ACTIVE",
      iconColor: u.iconColor,
      roleColor: u.roleColor,
      paymentRemainingDays: u.paymentRemainingDays,
      paymentDefaultDays: u.paymentDefaultDays,
      // Permissions
      canViewOrders: u.canViewOrders,
      canEditOrders: u.canEditOrders,
      canViewUsers: u.canViewUsers,
      canEditUsers: u.canEditUsers,
      canViewProducts: u.canViewProducts,
      canEditProducts: u.canEditProducts,
      canViewStatuses: u.canViewStatuses,
      canEditStatuses: u.canEditStatuses,
      canViewReporting: u.canViewReporting,
      canViewDashboard: u.canViewDashboard,
    };
  });
}

/**
 * Returns a basic list of active agents for assignment/filtering.
 * Accessible to ADMIN, SUPERVISOR, and anyone with access to Orders or Products.
 */
export async function getAgents(): Promise<{ id: string; name: string; role: string }[]> {
// await checkPermission(["canViewUsers", "canViewOrders", "canViewProducts"]);
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const agents = await prisma.user.findMany({
    where: {
      role: { in: ["AGENT", "AGENT_TEST"] },
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      role: true,
      iconColor: true,
    },
    orderBy: { name: "asc" },
  });

  return agents.map(a => ({
    id: a.id,
    name: a.name ?? "Sans nom",
    role: a.role,
    iconColor: a.iconColor,
  }));
}



export async function toggleUserStatus(userId: string) {
  await checkPermission("canEditUsers");

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Utilisateur non trouvé");

    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    return { id: updated.id, status: updated.status };
  } catch (err) {
    console.error("Erreur toggleUserStatus:", err);
    throw new Error("Impossible de changer le statut de l'utilisateur");
  }
}



export async function createUserAction(data: UserFormData) {
  await checkPermission("canEditUsers");

  try {
    const hashedPassword = await bcrypt.hash(data.password!, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
        iconColor: data.iconColor,
        roleColor: data.roleColor,
        paymentRemainingDays: data.paymentRemainingDays,
        paymentDefaultDays: data.paymentDefaultDays,
        // Par défaut, pas de permissions pour les nouveaux utilisateurs sauf si spécifié plus tard
      },

    });

    return mapUser(user);
  } catch (err) {
    console.error("Erreur createUserAction:", err);
    throw new Error("Impossible de créer l'utilisateur");
  }
}

export async function updateUserAction(userId: string, data: Partial<UserFormData>) {
  await checkPermission("canEditUsers");

  try {
    const updateData: any = { ...data };

    // Hasher le mot de passe si fourni
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    } else {
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return mapUser(user);
  } catch (err) {
    console.error("Erreur updateUserAction:", err);
    throw new Error("Impossible de mettre à jour l'utilisateur");
  }
}

export async function deleteUsersAction(userIds: string[]) {
  await checkPermission("canEditUsers");

  try {
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });
    return result;
  } catch (err) {
    console.error("Erreur deleteUsersAction:", err);
    throw new Error("Impossible de supprimer les utilisateurs");
  }
}

export interface MeUser {
  id: string;
  name: string | null;
  role: string;
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
}

export async function getMe(): Promise<MeUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = session.user as any;
  // Update lastSeenAt as heartbeat
  const dbUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
    select: {
      id: true,
      name: true,
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

  return dbUser as unknown as MeUser;
}

export async function deleteUserAction(userId: string) {
  await checkPermission("canEditUsers");

  try {
    const user = await prisma.user.delete({ where: { id: userId } });
    return mapUser(user);
  } catch (err) {
    console.error("Erreur deleteUserAction:", err);
    throw new Error("Impossible de supprimer l'utilisateur");
  }
}

