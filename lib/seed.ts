import { PrismaClient, Prisma } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Seeding database...");

  // 1. Create Admin User if not exists
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!existingAdmin) {
    console.log("Creating Admin user...");
    const hashedPassword = await bcrypt.hash("12345678", 10);
    await prisma.user.create({
      data: {
        name: "Admin Lebatt",
        phone: "28282828",
        password: hashedPassword,
        role: "ADMIN",
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
      },
    });
  } else {
    console.log("Admin user already exists.");
  }

  // 2. Create Statuses from Enum
  console.log("Seeding Statuses...");
  // Mapping of enums keys to themselves since we want 15 distinct statuses
  // The enum is defined as STATUS_01 ... STATUS_15 in schema.prisma

  // Since we don't import the Enum directly from generated/client here (to avoid circular dependency or build issues if not generated yet),
  // we can list them manually or assume they match the strings.
  const etats = [
    "STATUS_01", "STATUS_02", "STATUS_03", "STATUS_04", "STATUS_05",
    "STATUS_06", "STATUS_07", "STATUS_08", "STATUS_09", "STATUS_10",
    "STATUS_11", "STATUS_12", "STATUS_13", "STATUS_14", "STATUS_15"
  ];

  for (const etat of etats) {
    const exists = await prisma.status.findUnique({
      where: { name: etat }, // Assuming we want the name to be the enum key initially
    });

    if (!exists) {
        // Safe cast to any to avoid strict typing issues during seed if types aren't fully regenerated
      await prisma.status.create({
        data: {
          name: etat,
          etat: etat as any, 
          color: "#6366f1", // Default indigo Color
        },
      });
      console.log(`Created status: ${etat}`);
    } else {
        // Optional: Update the etat field if it's missing (migration scenarios)
        if ((exists as any).etat !== etat) {
             console.log(`Updating etat for status: ${etat}`);
             await prisma.status.update({
                 where: { id: exists.id },
                 data: { etat: etat as any }
             })
        }
    }
  }

  console.log("Seeding completed.");
}

main()
