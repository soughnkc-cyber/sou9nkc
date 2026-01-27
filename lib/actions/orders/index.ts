"use server";


import { User } from "@/app/(dashboard)/list/users/columns";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

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
  // 1️⃣ Récupérer tous les agents éligibles
  // ----------------------------
  const agents = await prisma.user.findMany({
    where: { role: { in: ["AGENT", "AGENT_TEST"] } },
    orderBy: { id: "asc" },
  });
  if (agents.length === 0) return console.warn("Aucun agent trouvé pour l'attribution automatique");

  // Identifier les agents spécialisés (ceux qui sont dans assignedAgentIds d'au moins un produit)
  const productsWithAssignments = await prisma.product.findMany({
    where: { assignedAgentIds: { isEmpty: false } },
    select: { assignedAgentIds: true }
  });
  const specializedAgentIds = new Set(productsWithAssignments.flatMap(p => p.assignedAgentIds));

  // ----------------------------
  // 2️⃣ Insérer toutes les commandes sans agentId
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

    const productIds = order.line_items?.map(li => li.product_id.toString()) || [];
    const products = await prisma.product.findMany({
      where: { shopifyId: { in: productIds } },
    });
    if (products.length === 0) continue;

    // Création de la commande sans agentId
    await prisma.order.create({
      data: {
        orderNumber: order.order_number,
        customerName,
        customerPhone,
        productNote: products.map(p => p.title).join(", "),
        orderDate: new Date(order.created_at),
        totalPrice: parseFloat(order.total_price),
        products: {
          connect: products.map(p => ({ id: p.id })),
        },
      },
    });

    console.log(`Commande #${order.order_number} insérée sans agent`);
  }

  // ----------------------------
  // 3️⃣ Attribution des agents après insertion
  // ----------------------------
  const ordersWithoutAgent = await prisma.order.findMany({
    where: { agentId: null },
    include: { products: true },
  });

  for (const order of ordersWithoutAgent) {
    // Calculer le nombre de commandes par agent pour le load balancing
    const agentOrderCounts = await prisma.order.groupBy({
      by: ['agentId'],
      _count: { id: true },
      where: { agentId: { not: null } }
    });

    const getAgentScore = (agentId: string) => {
      const found = agentOrderCounts.find(c => c.agentId === agentId);
      return found ? found._count.id : 0;
    };

    // Filtrer les agents compatibles
    const compatibleAgents = agents.filter(agent => {
      const isSpecialized = specializedAgentIds.has(agent.id);

      return order.products.every(p => {
        const assigned = p.assignedAgentIds || [];
        const hidden = p.hiddenForAgentIds || [];

        // Règle 2: Caché -> ne peut pas voir
        if (hidden.includes(agent.id)) return false;

        if (isSpecialized) {
          // Règle 1: Agent spécialisé -> ne peut voir QUE ses produits assignés
          return assigned.includes(agent.id);
        }

        // Agent non spécialisé -> peut voir tout ce qui n'est pas "caché" pour lui
        return true;
      });
    });

    if (compatibleAgents.length > 0) {
      // Dispatching: Trier par nombre de commandes (le moins chargé en premier)
      // et ajouter un peu de hasard pour les égalités
      const bestAgent = compatibleAgents.sort((a, b) => {
        const scoreA = getAgentScore(a.id);
        const scoreB = getAgentScore(b.id);
        if (scoreA === scoreB) return Math.random() - 0.5;
        return scoreA - scoreB;
      })[0];

      await prisma.order.update({
        where: { id: order.id },
        data: { agentId: bestAgent.id },
      });
      console.log(`Commande #${order.orderNumber} assignée à l'agent ${bestAgent.id} (Score: ${getAgentScore(bestAgent.id)})`);
    } else {
      console.log(`Commande #${order.orderNumber} aucun agent compatible`);
    }
  }
};





type UserLite = {
  id: string;
  role: "ADMIN" | "AGENT" | "SUPERVISOR" | "AGENT_TEST";
};

export const getOrders = async (user: UserLite) => {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPERVISOR";

  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { agentId: user.id },
    include: {
      status: true,
      agent: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { orderDate: "desc" },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    productNote: o.productNote,
    orderDate: o.orderDate.toISOString(),
    totalPrice: o.totalPrice,
    recallAt: o.recallAt?.toISOString() || null,
    status: o.status ? { id: o.status.id, name: o.status.name } : null,
    agent: o.agent
      ? { id: o.agent.id, name: o.agent.name, phone: o.agent.phone }
      : null,
  }));
};

export const updateOrderRecallAt = async (
  orderId: string,
  recallAt: Date | null
) => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { recallAt },
  });

  return {
    ...order,
    recallAt: order.recallAt ? order.recallAt.toISOString() : null,
  };
};


