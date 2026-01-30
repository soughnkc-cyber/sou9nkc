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
    color: s.color,
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

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderDate: true, firstProcessedAt: true }
    });

    let data: any = { statusId };

    if (currentOrder && !currentOrder.firstProcessedAt && statusId) {
      const now = new Date();
      const diffMs = now.getTime() - currentOrder.orderDate.getTime();
      const diffMin = Math.round(diffMs / (1000 * 60));
      
      data.firstProcessedAt = now;
      data.processingTimeMin = diffMin;
    }

    // 🔹 Seulement si recallAfterH existe
    if (status?.recallAfterH != null) {
      const recallAt = new Date();
      recallAt.setHours(recallAt.getHours() + status.recallAfterH);

      data.recallAt = recallAt;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
      include: { status: true },
    });

    return {
      ...order,
      recallAt: order.recallAt ? order.recallAt.toISOString() : null,
      status: order.status ? { id: order.status.id, name: order.status.name, color: order.status.color } : null,
    };


  } catch (err) {
    console.error(err);
    throw new Error("Impossible de mettre à jour le statut");
  }
};


