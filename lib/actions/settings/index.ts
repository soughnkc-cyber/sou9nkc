"use server";

import prisma from "@/lib/prisma";
import { checkPermission } from "../auth-helper";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
  // Logic: Everyone with access to the dashboard or orders can probably see these settings if needed,
  // but strictly, it's for ADMIN.
  
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: "default", assignmentBatchSize: 1 },
    });
  }

  return settings;
}

export async function updateSystemSettings(data: { 
  assignmentBatchSize: number, 
  maxRecallAttempts?: number,
  workStart?: string;
  workEnd?: string;
  workDays?: number[];
  breakStart?: string | null;
  breakEnd?: string | null;
}) {
  await checkPermission("canEditUsers"); 

  const settings = await (prisma.systemSettings.upsert as any)({
    where: { id: "default" },
    update: { 
      assignmentBatchSize: data.assignmentBatchSize,
      maxRecallAttempts: data.maxRecallAttempts,
      workStart: data.workStart,
      workEnd: data.workEnd,
      workDays: data.workDays,
      breakStart: data.breakStart,
      breakEnd: data.breakEnd,
    },
    create: { 
      id: "default", 
      assignmentBatchSize: data.assignmentBatchSize,
      maxRecallAttempts: data.maxRecallAttempts ?? 3,
      workStart: data.workStart ?? "10:00",
      workEnd: data.workEnd ?? "22:00",
      workDays: data.workDays ?? [1, 2, 3, 4, 5, 6, 0],
      breakStart: data.breakStart ?? "13:30",
      breakEnd: data.breakEnd ?? "14:30",
    },
  });

  revalidatePath("/");
  return settings;
}
