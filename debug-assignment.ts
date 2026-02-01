
import { config } from "dotenv";
config();
import prisma from "@/lib/prisma";

async function main() {
  console.log("🔍 Démarrage du diagnostic d'attribution...");

  // 1. Récupérer les agents
  const agents = await prisma.user.findMany({
    where: { 
      role: { in: ["AGENT", "AGENT_TEST", "SUPERVISOR"] },
      status: "ACTIVE",
      canViewOrders: true,
    },
    select: { id: true, name: true, role: true }
  });
  console.log(`📡 Agents actifs et éligibles (${agents.length}):`, agents.map(a => `${a.name} (${a.id})`).join(", "));

  // 2. Trouver un produit "problématique" (Pas d'assignés, mais des cachés)
  // On cherche un produit où assignedAgentIds est vide mais hiddenForAgentIds n'est PAS vide
  const problematicProduct = await prisma.product.findFirst({
    where: {
      assignedAgentIds: { isEmpty: true },
      hiddenForAgentIds: { isEmpty: false }
    }
  });

  if (!problematicProduct) {
    console.log("✅ Aucun produit trouvé avec la config 'Caché mais pas Assigné'. Le problème vient peut-être d'ailleurs.");
    // Essayer de trouver un produit avec juste des cachés pour tester
    const hiddenProduct = await prisma.product.findFirst({ where: { hiddenForAgentIds: { isEmpty: false } } });
    if(hiddenProduct) console.log("ℹ️ Produit test (avec cachés):", hiddenProduct.title);
    return;
  }

  console.log(`⚠️ Produit Test trouvé: ${problematicProduct.title} (ID: ${problematicProduct.id})`);
  console.log(`   - Assigned: ${(problematicProduct.assignedAgentIds || []).length}`);
  console.log(`   - Hidden: ${(problematicProduct.hiddenForAgentIds || []).length} -> [${(problematicProduct.hiddenForAgentIds || []).join(", ")}]`);

  // 3. Simuler la logique (Copie conforme de index.ts)
  const requiredAgentIds: string[] = problematicProduct.assignedAgentIds || [];
  const blockedAgentIds: string[] = problematicProduct.hiddenForAgentIds || [];

  let candidates = [];

  if (requiredAgentIds.length > 0) {
      console.log("   👉 CASE A: Strict");
      candidates = agents.filter(a => requiredAgentIds.includes(a.id) && !blockedAgentIds.includes(a.id));
  } else {
      console.log("   👉 CASE B: Open");
      candidates = agents.filter(a => !blockedAgentIds.includes(a.id));
  }

  console.log(`   👉 Candidats initiaux: ${candidates.length}`);
  candidates.forEach(c => console.log(`      - ${c.name}`));

  if (candidates.length === 0) {
      console.warn("   🚨 ALERTE: Aucun candidat ! Fallback activé...");
      candidates = agents;
      console.log(`   👉 Candidats après Fallback: ${candidates.length}`);
  }

}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
