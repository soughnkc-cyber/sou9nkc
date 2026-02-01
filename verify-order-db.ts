
import { config } from "dotenv";
config();
import prisma from "@/lib/prisma";

async function main() {
  const orderNumber = 4679;
  console.log(`🔍 Vérification de la commande #${orderNumber} en base de données...`);

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      agent: true,
      products: true
    }
  });

  if (!order) {
    console.error("❌ Commande introuvable !");
    return;
  }

  console.log("-----------------------------------------");
  console.log(`📦 ID: ${order.id}`);
  console.log(`📅 CreatedAt: ${order.createdAt.toISOString()}`);
  console.log(`🔄 UpdatedAt: ${order.updatedAt.toISOString()}`);
  console.log("-----------------------------------------");
  console.log(`👤 AGENT ID:   ${order.agentId}`);
  console.log(`👤 AGENT NAME: ${order.agent?.name || "❌ NULL / NON ASSIGNÉ"}`);
  console.log("-----------------------------------------");
  console.log(`🛒 Produits:`);
  order.products.forEach(p => {
    console.log(`   - ${p.title}`);
    console.log(`     Restrictions: Hidden=[${p.hiddenForAgentIds}] Assigned=[${p.assignedAgentIds}]`);
  });
  console.log("-----------------------------------------");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
