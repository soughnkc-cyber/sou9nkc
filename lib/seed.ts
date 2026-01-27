import { PrismaClient, Prisma } from "../app/generated/prisma/client";
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
  // Add your seed data here
  const hashedPassword = await bcrypt.hash("12345678", 10);
  await prisma.user.create({
    data: {
      name: "Admin",
      phone: "22222222",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
}

main();
