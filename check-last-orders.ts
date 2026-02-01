
import { config } from "dotenv";
config();
import prisma from "@/lib/prisma";

async function main() {
  console.log("🔍 Vérification des 5 dernières commandes...");

  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      agent: { select: { name: true } },
      products: { select: { title: true, assignedAgentIds: true, hiddenForAgentIds: true } }
    }
  });

  console.log("----------------------------------------------------------------");
  for (const o of orders) {
    console.log(`📦 Order #${o.orderNumber} (ID: ${o.id})`);
    console.log(`   📅 Created: ${o.createdAt.toISOString()}`);
    console.log(`   👤 Agent: ${o.agent ? o.agent.name : "❌ NON ASSIGNÉ"}`);
    console.log(`   🛒 Produits (${o.products.length}):`);
    o.products.forEach(p => {
       console.log(`      - ${p.title}`);
       console.log(`        Assignés: [${(p.assignedAgentIds||[]).join(', ')}]`);
       console.log(`        Cachés:   [${(p.hiddenForAgentIds||[]).join(', ')}]`);
    });
    console.log("----------------------------------------------------------------");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
