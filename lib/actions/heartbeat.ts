"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Updates the user's lastSeenAt timestamp.
 * This should be called periodically by the client to maintain "Online" status.
 */
export async function updateHeartbeat() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return;
    
    const userId = (session.user as any).id;
    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  } catch (error) {
    // Silent fail - heartbeat shouldn't crash app
    console.error("Heartbeat failed", error);
  }
}
