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

export async function updateSystemSettings(data: { assignmentBatchSize: number }) {
  await checkPermission("canEditUsers"); // Only admins usually manage users/system

  const settings = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { assignmentBatchSize: data.assignmentBatchSize },
    create: { id: "default", assignmentBatchSize: data.assignmentBatchSize },
  });

  revalidatePath("/");
  return settings;
}
