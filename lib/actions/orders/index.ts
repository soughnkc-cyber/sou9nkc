"use server";


import { User } from "@/app/(dashboard)/list/users/columns";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { hasPermission } from "@/lib/auth-utils";
import { checkPermission } from "../auth-helper";
import { revalidatePath } from "next/cache";







type ShopifyOrder = {
  order_number: number;
  name: string;
  note?: string | null;
  created_at: string;
  total_price: string;
  customer?: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  } | null;
  billing_address?: {
    phone?: string | null;
  } | null;
  line_items?: {
    title: string;
    product_id: number;
  }[];
};


export const insertNewOrders = async (shopifyOrders: ShopifyOrder[]) => {
  // ----------------------------
  // 1️⃣ Récupérer tous les agents éligibles et produits concernés
  // ----------------------------
  const agents = await prisma.user.findMany({
    where: { 
      role: { in: ["AGENT", "AGENT_TEST", "SUPERVISOR"] }, // Ajouté SUPERVISOR si nécessaire
      status: "ACTIVE",
      canViewOrders: true,
    },

    orderBy: { id: "asc" },
  });
  console.log(`📡 [Assignment] Found ${agents.length} active agents with canViewOrders=true:`, agents.map(a => `${a.name} (${a.role}, ${a.id})`).join(", "));
  
  if (agents.length === 0) {
    console.warn("⚠️ [Assignment] Aucun agent éligible trouvé ! Vérifiez role, status:ACTIVE et canViewOrders:true");
    return;
  }

  // Identifier les agents spécialisés (ceux qui sont dans assignedAgentIds d'au moins un produit)
  const productsWithAssignments = await prisma.product.findMany({
    where: { assignedAgentIds: { isEmpty: false } },
    select: { assignedAgentIds: true }
  });
  const specializedAgentIds = new Set(productsWithAssignments.flatMap(p => p.assignedAgentIds));
  console.log(`🎯 [Assignment] Specialized agents count: ${specializedAgentIds.size}`);

  const insertedOrderIds: string[] = [];

  // ----------------------------
  // 2️⃣ Insérer les commandes
  // ----------------------------
  for (const order of shopifyOrders) {
    const existing = await prisma.order.findUnique({
      where: { orderNumber: order.order_number },
    });
    if (existing) continue;

    const customerName = order.customer
      ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim()
      : order.name;
    const customerPhone = order.customer?.phone ?? order.billing_address?.phone ?? null;

    const productIds = order.line_items?.map(li => li.product_id?.toString()).filter(Boolean) as string[] || [];
    const products = await prisma.product.findMany({
      where: { shopifyId: { in: productIds } },
    });

    const productNote = products.length > 0
      ? products.map(p => p.title).join(", ")
      : order.line_items?.map(li => li.title).join(", ") || "Produit inconnu";

    const created = await prisma.order.create({
      data: {
        orderNumber: order.order_number,
        customerName,
        customerPhone,
        productNote,
        orderDate: new Date(order.created_at),
        totalPrice: parseFloat(order.total_price),
        products: {
          connect: products.map(p => ({ id: p.id })),
        },
      },
    });
    insertedOrderIds.push(created.id);
  }

  revalidatePath("/");

  if (insertedOrderIds.length === 0) return;


  // ----------------------------
  // 3️⃣ Attribution des agents
  // ----------------------------
  const ordersToAssign = await prisma.order.findMany({
    where: { id: { in: insertedOrderIds }, agentId: null },
    include: { products: true },
  });

  console.log(`🔍 [Assignment] Orders to assign: ${ordersToAssign.length}`);

  // Fetch current load
  const agentOrderCounts = await prisma.order.groupBy({
    by: ['agentId'],
    _count: { id: true },
    where: { agentId: { not: null } }
  });

  const localCounts = new Map<string, number>();
  agentOrderCounts.forEach(c => {
    if (c.agentId) localCounts.set(c.agentId, c._count.id);
  });

  for (const order of ordersToAssign) {
    const getAgentScore = (agentId: string) => localCounts.get(agentId) || 0;
    console.log(`⚡ [Assignment] Processing Order #${order.orderNumber} with ${order.products.length} known products`);

    if (order.products.length === 0) {
        console.warn(`⚠️ [Assignment] Order #${order.orderNumber} has no products in DB. Treating as Totally General.`);
    }

    // Tentative 1: Séparation stricte (Spécialisé -> Spécialisé, Général -> Général) + Hidden
    let candidateAgents = agents.filter(agent => {
      const isAgentSpecialized = specializedAgentIds.has(agent.id);

      if (order.products.length === 0) {
          // Produit inconnu en base: Réservé aux non-spécialisés par défaut
          return !isAgentSpecialized;
      }

      return order.products.every(p => {
        const assigned = p.assignedAgentIds || [];
        const hidden = p.hiddenForAgentIds || [];

        // Règle de base: Jamais si l'agent est banni du produit
        if (hidden.includes(agent.id)) return false;

        if (assigned.length > 0) {
          // Produit Spécialisé: L'agent DOIT être dedans
          return assigned.includes(agent.id);
        } else if (hidden.length > 0) {
          // Produit avec restrictions uniquement: Tout le monde sauf les banni (spécialisés inclus)
          return !hidden.includes(agent.id);
        } else {
          // Produit totalement général (ni assigned ni hidden): Réservé aux non-spécialisés
          return !isAgentSpecialized;
        }
      });
    });

    console.log(`🔸 [Assignment] Tier 1 candidate count: ${candidateAgents.length}`);

    // Tentative 2: Fallback - On ignore la séparation Spécialisé/Général, on ne garde que le Hidden
    if (candidateAgents.length === 0) {
      console.log(`⚠️ [Assignment] Commande #${order.orderNumber}: Aucun match strict, passage au Fallback (Hidden uniquement)`);
      candidateAgents = agents.filter(agent => {
        if (order.products.length === 0) return true; // Si pas de produit, n'importe qui
        return order.products.every(p => {
          const hidden = p.hiddenForAgentIds || [];
          return !hidden.includes(agent.id);
        });
      });
      console.log(`🔸 [Assignment] Tier 2 candidate count: ${candidateAgents.length}`);
    }

    // Tentative 3: Secours ultime (Tous les agents actifs)
    if (candidateAgents.length === 0) {
      console.warn(`🚨 [Assignment] Commande #${order.orderNumber}: Conflit total, attribution d'urgence à tout agent actif`);
      candidateAgents = agents;
      console.log(`🔸 [Assignment] Tier 3 candidate count: ${candidateAgents.length}`);
    }

    if (candidateAgents.length > 0) {
      // Équilibrage : On trie par nombre de commandes actuelles
      const bestAgent = candidateAgents.sort((a, b) => {
        const scoreA = getAgentScore(a.id);
        const scoreB = getAgentScore(b.id);
        if (scoreA === scoreB) return Math.random() - 0.5;
        return scoreA - scoreB;
      })[0];

      await prisma.order.update({
        where: { id: order.id },
        data: { agentId: bestAgent.id },
      });
      
      const newScore = getAgentScore(bestAgent.id) + 1;
      localCounts.set(bestAgent.id, newScore);
      console.log(`✅ [Assignment] Commande #${order.orderNumber} assignée à ${bestAgent.name} (ID: ${bestAgent.id}, Nouveau Score: ${newScore})`);
    } else {
        console.error(`❌ [Assignment] Commande #${order.orderNumber}: IMPOSSIBLE d'assigner un agent (liste d'agents actifs vide)`);
    }
  }

};





type UserLite = {
  id: string;
  role: "ADMIN" | "AGENT" | "SUPERVISOR" | "AGENT_TEST";
};

export const getOrders = async (user: UserLite) => {
  const session = await checkPermission("canViewOrders");
  const sessionUser = session.user as any;

  // Limitation Agent/Supervisor logic - On garde l'isolation par défaut
  // Seuls ADMIN et SUPERVISOR (si autorisé à voir) voient tout.
  const isGlobalViewer = sessionUser.role === "ADMIN" || sessionUser.role === "SUPERVISOR";

  const allStatuses = await prisma.status.findMany({ select: { id: true, name: true, etat: true } });
  console.log("📝 [DB Statuses Check]:", allStatuses);

  const orders = await prisma.order.findMany({
    where: isGlobalViewer ? {} : { agentId: sessionUser.id },
    include: {
      status: true,
      agent: {
        select: { id: true, name: true, phone: true, iconColor: true },
      },
    },
    orderBy: { orderDate: "desc" },
  });

  // 📝 Server Diagnostics
  const totalCount = await prisma.order.count();
  const latestOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log(`🔍 [getOrders Debug] User: ${sessionUser.name} (${sessionUser.role}), Visible: ${orders.length}, Total in DB: ${totalCount}`);
  if (latestOrder) {
      console.log(`🔍 [getOrders Debug] Newest Order in DB: #${latestOrder.orderNumber}, CreatedAt: ${latestOrder.createdAt.toISOString()}, ServerNow: ${new Date().toISOString()}`);
  }


  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      productNote: o.productNote,
      orderDate: o.orderDate.toISOString(),
      totalPrice: o.totalPrice,
      recallAt: o.recallAt?.toISOString() || null,
      processingTimeMin: o.processingTimeMin,
      recallAttempts: o.recallAttempts,
      status: o.status ? { id: o.status.id, name: o.status.name, color: o.status.color, etat: o.status.etat } : null,
      agent: o.agent
        ? { id: o.agent.id, name: o.agent.name, phone: o.agent.phone, iconColor: o.agent.iconColor }
        : null,
      createdAt: o.createdAt.toISOString(),
    })),
    serverTime: new Date().toISOString()
  };
};

export const updateOrderRecallAt = async (
  orderId: string,
  recallAt: Date | null
) => {
  await checkPermission("canEditOrders");
  
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { recallAt },
  });

  revalidatePath("/");

  return {
    ...order,
    recallAt: order.recallAt ? order.recallAt.toISOString() : null,
  };
};

export const updateOrderAgent = async (orderId: string, agentId: string) => {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  try {
     const order = await prisma.order.update({
      where: { id: orderId },
      data: { agentId: agentId === "unassigned" ? null : agentId },
      include: { agent: true, status: true }
    });

    revalidatePath("/");
    
    return {
        ...order,
        orderDate: order.orderDate.toISOString(),
        recallAt: order.recallAt ? order.recallAt.toISOString() : null,
        status: order.status ? { id: order.status.id, name: order.status.name, color: order.status.color } : null,
        agent: order.agent ? { id: order.agent.id, name: order.agent.name, phone: order.agent.phone, iconColor: order.agent.iconColor } : null
    };

  } catch (err) {
    console.error("Erreur updateOrderAgent:", err);
    throw new Error("Impossible de modifier l'agent");
  }
};
export const deleteOrders = async (orderIds: string[]) => {
  await checkPermission("canEditOrders");
  
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  if ((session.user as any).role !== "ADMIN") throw new Error("Seul un administrateur peut supprimer des commandes");

  try {
    await prisma.order.deleteMany({
      where: {
        id: { in: orderIds },
      },
    });

    revalidatePath("/");
    
    return { success: true };

  } catch (err) {
    console.error("Erreur deleteOrders:", err);
    throw new Error("Impossible de supprimer les commandes");
  }
};
