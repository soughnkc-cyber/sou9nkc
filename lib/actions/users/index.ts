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





import { encrypt, decrypt } from "@/lib/crypto";

function mapUser(u: PrismaUser) {
  return {
    // ... existing fields ...
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
    decryptedPassword: u.encryptedPassword ? decrypt(u.encryptedPassword) : undefined, // Add decrypted password
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
    // ... existing logic ...
    const lastSeen = u.lastSeenAt?.getTime() ?? 0;
    const lastLogout = u.lastLogoutAt?.getTime() ?? 0;
    
    // Online si : (Vu récemment) ET (Pas déconnecté depuis la dernière activité)
    const isRecent = (now - lastSeen) < ONLINE_THRESHOLD_MS;
    const isNotLoggedOut = lastSeen > lastLogout;
    
    const online = isRecent && isNotLoggedOut;

    return {
      // ... existing fields ...
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
      decryptedPassword: u.encryptedPassword ? decrypt(u.encryptedPassword) : undefined, // Add decrypted password
    };
  });
}


export async function getAgents() {
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: { name: "asc" },
  });
  return users.map(mapUser);
}

export async function toggleUserStatus(userId: string) {
  await checkPermission("canEditUsers");

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Utilisateur introuvable");

    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    revalidatePath("/");
    return { success: true, status: newStatus };
  } catch (err) {
    console.error("Erreur toggleUserStatus:", err);
    throw new Error("Impossible de changer le statut de l'utilisateur");
  }
}

export async function createUserAction(data: UserFormData) {
  await checkPermission("canEditUsers");

  try {
    const hashedPassword = await bcrypt.hash(data.password!, SALT_ROUNDS);
    const encryptedPassword = data.password ? encrypt(data.password) : undefined; // Encrypt if present

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        encryptedPassword: encryptedPassword, // Store encrypted
        role: data.role,
        iconColor: data.iconColor,
        roleColor: data.roleColor,
        paymentRemainingDays: data.paymentRemainingDays,
        paymentDefaultDays: data.paymentDefaultDays,
        // Par défaut, pas de permissions pour les nouveaux utilisateurs sauf si spécifié plus tard
      },
    });

    revalidatePath("/");
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
    if (updateData.password && updateData.password.trim() !== "") {
       updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
       updateData.encryptedPassword = encrypt(data.password!); // Store encrypted for visual retrieval
    } else {
       delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/");
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
    
    revalidatePath("/");
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
    
    revalidatePath("/");
    return mapUser(user);
  } catch (err) {
    console.error("Erreur deleteUserAction:", err);
    throw new Error("Impossible de supprimer l'utilisateur");
  }
}

