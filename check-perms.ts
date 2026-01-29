import  prisma  from "./lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      role: true,
      canViewOrders: true,
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
