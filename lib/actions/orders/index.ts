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
  if (agents.length === 0) return console.warn("Aucun agent trouvé pour l'attribution automatique");

  // Identifier les agents spécialisés (ceux qui sont dans assignedAgentIds d'au moins un produit)
  const productsWithAssignments = await prisma.product.findMany({
    where: { assignedAgentIds: { isEmpty: false } },
    select: { assignedAgentIds: true }
  });
  const specializedAgentIds = new Set(productsWithAssignments.flatMap(p => p.assignedAgentIds));

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
  // 3️⃣ Attribution des agents (Uniquement pour les nouvelles commandes)
  // ----------------------------
  const ordersToAssign = await prisma.order.findMany({
    where: { id: { in: insertedOrderIds }, agentId: null },
    include: { products: true },
  });

  // Fetch current load once
  const agentOrderCounts = await prisma.order.groupBy({
    by: ['agentId'],
    _count: { id: true },
    where: { agentId: { not: null } }
  });

  // Local map to track assignment in this batch
  const localCounts = new Map<string | null, number>();
  agentOrderCounts.forEach(c => localCounts.set(c.agentId, c._count.id));

  for (const order of ordersToAssign) {
    const getAgentScore = (agentId: string) => localCounts.get(agentId) || 0;

    const compatibleAgents = agents.filter(agent => {
      const isSpecialized = specializedAgentIds.has(agent.id);

      return order.products.every(p => {
        const assigned = p.assignedAgentIds || [];
        const hidden = p.hiddenForAgentIds || [];

        if (hidden.includes(agent.id)) return false;
        if (isSpecialized) return assigned.includes(agent.id);
        return true;
      });
    });

    if (compatibleAgents.length > 0) {
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
      
      // Update local count for the next order in the loop
      localCounts.set(bestAgent.id, getAgentScore(bestAgent.id) + 1);
      
      console.log(`Commande #${order.orderNumber} assignée à ${bestAgent.id}`);
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

  const orders = await prisma.order.findMany({
    where: isGlobalViewer ? {} : { agentId: sessionUser.id },
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
    processingTimeMin: o.processingTimeMin,
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
