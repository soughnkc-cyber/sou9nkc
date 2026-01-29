"use server";

import prisma from "@/lib/prisma";

import { StatusFormData } from "@/lib/schema";
import { Status as PrismaStatus } from "@/app/generated/prisma/client";
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
    recallAfterH: s.recallAfterH ?? undefined,
    createdAt: s.createdAt.toISOString(),
  };
}

/* =========================
   GET
========================= */
export async function getStatus(): Promise<Status[]> {
  await checkPermission("canViewStatuses");
  
  const status = await prisma.status.findMany({

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
   DELETE
========================= */
export async function deleteStatusAction(statusId: string) {
  await checkPermission("canEditStatuses");
  
  try {
    const status = await prisma.status.delete({

      where: { id: statusId },
    });

    revalidatePath("/");
    return mapStatus(status);

  } catch (err) {
    console.error("Erreur deleteStatusAction:", err);
    throw new Error("Impossible de supprimer le statut");
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

    revalidatePath("/");
    return {
      ...order,
      recallAt: order.recallAt ? order.recallAt.toISOString() : null,
    };


  } catch (err) {
    console.error(err);
    throw new Error("Impossible de mettre à jour le statut");
  }
};


