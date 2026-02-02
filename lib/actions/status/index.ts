"use server";

import prisma from "@/lib/prisma";

import { StatusFormData } from "@/lib/schema";
import { Status as PrismaStatus } from "@/app/generated/prisma";
import { Status } from "@/app/(dashboard)/list/status/columns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasPermission } from "@/lib/auth-utils";
import { checkPermission } from "../auth-helper";
import { revalidatePath } from "next/cache";







function mapStatus(s: PrismaStatus): Status {
  return {
    id: s.id,
    name: s.name,
    etat: s.etat,
    color: s.color,
    isActive: s.isActive,
    recallAfterH: s.recallAfterH ?? undefined,
    createdAt: s.createdAt.toISOString(),
  };
}

/* =========================
   GET
========================= */
export async function getStatus(): Promise<Status[]> {
  await checkPermission(["canViewStatuses", "canViewOrders"]);
  
  const status = await prisma.status.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: "desc" },
  });

  return status.map(mapStatus);
}

/* =========================
   CREATE
========================= */
export async function createStatusAction(data: StatusFormData) {
  await checkPermission("canEditStatuses");
  
  try {
    const status = await prisma.status.create({
      data: {
        name: data.name,
        etat: data.etat,
        isActive: data.isActive,
        recallAfterH: data.recallAfterH,
        color: data.color || "#6366f1",
      },
    });

    revalidatePath("/");
    return mapStatus(status);
  } catch (err) {
    console.error("Erreur createStatusAction:", err);
    throw new Error("Impossible de créer le statut");
  }
}

/* =========================
   UPDATE
========================= */
export async function updateStatusAction(
  statusId: string,
  data: Partial<StatusFormData>
) {
  await checkPermission("canEditStatuses");
  
  try {
    const status = await prisma.status.update({
      where: { id: statusId },
      data: {
        name: data.name,
        // etat: data.etat, // Prevent etat modification
        isActive: data.isActive,
        recallAfterH: data.recallAfterH,
        color: data.color,
      },
    });

    revalidatePath("/");
    return mapStatus(status);
  } catch (err) {
    console.error("Erreur updateStatusAction:", err);
    throw new Error("Impossible de mettre à jour le statut");
  }
}


/* =========================
   DELETE (SOFT)
========================= */
export async function deleteStatusAction(statusId: string) {
  await checkPermission("canEditStatuses");
  
  try {
    // Soft delete: marks as archived
    const status = await prisma.status.update({
      where: { id: statusId },
      data: { isArchived: true },
    });

    revalidatePath("/");
    return mapStatus(status);

  } catch (err) {
    console.error("Erreur deleteStatusAction:", err);
    throw new Error("Impossible de supprimer le statut");
  }
}

export async function deleteStatusesAction(statusIds: string[]) {
  await checkPermission("canEditStatuses");
  
  try {
    // Soft delete many
    const result = await prisma.status.updateMany({
      where: {
        id: { in: statusIds },
      },
      data: { isArchived: true },
    });
    
    revalidatePath("/");
    return result;
  } catch (err) {
    console.error("Erreur deleteStatusesAction:", err);
    throw new Error("Impossible de supprimer les statuts");
  }
}


export const updateOrderStatus = async (
  orderId: string,
  statusId: string | null
) => {
  await checkPermission("canEditOrders");
  
  try {

    const status = statusId
      ? await prisma.status.findUnique({ where: { id: statusId } })
      : null;

    const currentOrder = await (prisma.order.findUnique as any)({
      where: { id: orderId },
      select: { orderDate: true, assignedAt: true, firstProcessedAt: true, recallAttempts: true }
    });

    let data: any = { statusId };

    if (currentOrder && !currentOrder.firstProcessedAt && statusId) {
      const now = new Date();
      const calculationBase = currentOrder.assignedAt || currentOrder.orderDate;
      const diffMs = now.getTime() - calculationBase.getTime();
      const diffMin = Math.round(diffMs / (1000 * 60));
      
      data.firstProcessedAt = now;
      data.processingTimeMin = diffMin;
    }

    // 🔹 Seulement si recallAfterH existe
    if (status?.recallAfterH != null) {
      if ((currentOrder?.recallAttempts || 0) >= 3) {
        throw new Error("Nombre maximum de rappels (3) atteint pour cette commande");
      }
      
      const recallAt = new Date();
      recallAt.setHours(recallAt.getHours() + status.recallAfterH);

      data.recallAt = recallAt;
      data.recallAttempts = { increment: 1 };
    } else {
      // Si le statut n'a pas de configuration de rappel, on vide la date de rappel
      data.recallAt = null;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
      include: { status: true },
    });

    return {
      ...order,
      recallAt: order.recallAt ? order.recallAt.toISOString() : null,
      status: order.status ? { id: order.status.id, name: order.status.name, color: order.status.color, etat: order.status.etat } : null,
      recallAttempts: order.recallAttempts,
    };


  } catch (err) {
    console.error(err);
    throw new Error("Impossible de mettre à jour le statut");
  }
};


