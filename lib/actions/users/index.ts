// app/actions/user.ts
"use server";

import prisma from "@/lib/prisma";
import { UserFormData } from "@/lib/schema";
import { User as PrismaUser } from "@/app/generated/prisma/client";
import bcrypt from "bcrypt";
import { User } from "@/app/(dashboard)/list/users/columns";

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
  };
}

export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const MAX_SESSION_MS = 60 * 60 * 1000;
  const now = Date.now();

  return users.map(u => {
    const login = u.lastLoginAt?.getTime() ?? 0;
    const logout = u.lastLogoutAt?.getTime() ?? 0;
    const online = login > logout && (now - login) < MAX_SESSION_MS;

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
    };
  });
}

export async function toggleUserStatus(userId: string) {
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
  try {
    const hashedPassword = await bcrypt.hash(data.password!, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
      },
    });

    return mapUser(user);
  } catch (err) {
    console.error("Erreur createUserAction:", err);
    throw new Error("Impossible de créer l'utilisateur");
  }
}

export async function updateUserAction(userId: string, data: Partial<UserFormData>) {
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

export async function deleteUserAction(userId: string) {
  try {
    const user = await prisma.user.delete({ where: { id: userId } });
    return mapUser(user);
  } catch (err) {
    console.error("Erreur deleteUserAction:", err);
    throw new Error("Impossible de supprimer l'utilisateur");
  }
}
