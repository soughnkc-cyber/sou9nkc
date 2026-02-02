"use server";


import prisma from "@/lib/prisma";
import { checkPermission } from "../auth-helper";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "../settings";







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
      role: { in: ["AGENT", "AGENT_TEST"] }, // SUPERVISOR retiré de l'attribution auto
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

    if (existing) {
        if (!existing.agentId) {
            console.log(`⚠️ [Assignment] Commande #${order.order_number} existe déjà mais SANS agent. Tentative de ré-attribution.`);
            insertedOrderIds.push(existing.id);
        } else {
            console.log(`ℹ️ [Webhook] Commande #${order.order_number} déjà existante et assignée. Ignorée.`);
        }
        continue;
    }

    const customerName = order.customer
      ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim()
      : order.name;
    const customerPhone = order.customer?.phone ?? order.billing_address?.phone ?? null;

    // Validation : Le numéro de téléphone doit avoir au moins 8 chiffres
    // On ne garde que les chiffres pour vérifier la longueur
    const phoneDigits = customerPhone ? customerPhone.replace(/\D/g, '') : "";
    
    if (phoneDigits.length < 8) {
        console.log(`🚫 [Webhook] Commande #${order.order_number} ignorée : Téléphone invalide ou trop court (${customerPhone})`);
        continue;
    }

    const productIds = order.line_items?.map(li => li.product_id?.toString()).filter(Boolean) as string[] || [];
    const products = await prisma.product.findMany({
      where: { shopifyId: { in: productIds } },
    });

    const productNote = products.length > 0
      ? products.map(p => p.title).join(", ")
      : order.line_items?.map(li => li.title).join(", ") || "Produit inconnu";

    // 🔍 [DOUBLON CHECK] Vérification si une commande identique existe dans l'heure
    if (customerPhone) {
        const orderTime = new Date(order.created_at);
        const oneHourMillis = 60 * 60 * 1000;
        const potentialDuplicate = await prisma.order.findFirst({
            where: {
                customerPhone: customerPhone,
                productNote: productNote,
                orderDate: {
                    gte: new Date(orderTime.getTime() - oneHourMillis),
                    lte: new Date(orderTime.getTime() + oneHourMillis),
                }
            }
        });

        if (potentialDuplicate) {
            console.log(`🚫 [Webhook] Doublon détecté pour #${order.order_number} (Même téléphone/produits dans l'heure). Commande ignorée.`);
            continue;
        }
    }

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

  if (insertedOrderIds.length === 0) return;


  // ----------------------------
  // 3️⃣ Attribution des agents
  // ----------------------------
  
  // ⏳ PAUSE DE SÉCURITÉ : On attend 1s pour être sûr que la transaction DB est pleinement commuée
  // et visible pour une requête de lecture immédiate (Consistency Lag)
  await new Promise(resolve => setTimeout(resolve, 1000));

  const ordersToAssign = await prisma.order.findMany({
    where: { id: { in: insertedOrderIds }, agentId: null },
    include: { products: true },
  });

  if (ordersToAssign.length < insertedOrderIds.length) {
      console.warn(`⚠️ [Assignment Warning] Inserted ${insertedOrderIds.length} orders but only found ${ordersToAssign.length} for assignment. Some might have been missed by the DB query.`);
  }

  console.log(`🔍 [Assignment] Orders to assign: ${ordersToAssign.length}`);

  // 📦 Get Batch Size Setting
  const settings = await getSystemSettings();
  const batchSize = settings.assignmentBatchSize || 1;
  console.log(`📦 [Assignment] Using Batch Size: ${batchSize}`);

  // Fetch TODAY's load for balancing (Reset at midnight)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const agentOrderCountsToday = await prisma.order.groupBy({
    by: ['agentId'],
    _count: { id: true },
    where: { 
        agentId: { not: null },
        createdAt: { gte: todayStart }
    }
  });

  const localCounts = new Map<string, number>();
  agents.forEach(a => localCounts.set(a.id, 0)); // Initialize all to 0
  agentOrderCountsToday.forEach(c => {
    if (c.agentId) localCounts.set(c.agentId, c._count.id);
  });

  console.log("📊 [Assignment] Initial Load (Today):", Object.fromEntries(localCounts));

  for (const order of ordersToAssign) {
    const getAgentScore = (agentId: string) => localCounts.get(agentId) || 0;
    
    // 1. Determine if strict assignment is needed
    // If ANY product in the order has specific assigned agents, the order becomes "Restricted" to those agents.
    // We take the INTERSECTION of assigned agents if multiple products have assignments (to be safe), 
    // or UNION? Usually checking if "at least one" product requires it.
    // Let's assume: If a product has assigned agents, only they can take it.
    
    let requiredAgentIds: string[] = [];
    let blockedAgentIds: string[] = [];

    // Collect constraints
    order.products.forEach(p => {
        if (p.assignedAgentIds && p.assignedAgentIds.length > 0) {
            requiredAgentIds.push(...p.assignedAgentIds);
        }
        if (p.hiddenForAgentIds && p.hiddenForAgentIds.length > 0) {
            blockedAgentIds.push(...p.hiddenForAgentIds);
        }
    });

    let candidates: typeof agents = [];

    if (requiredAgentIds.length > 0) {
        // CASE A: Strict Assignment (At least one product requires specific agents)
        // We filter agents who are in the required list AND not blocked
        candidates = agents.filter(a => requiredAgentIds.includes(a.id) && !blockedAgentIds.includes(a.id));
    } else {
        // CASE B: Open Assignment (No product explicitly requires an agent)
        // Everyone is eligible EXCEPT those blocked
        candidates = agents.filter(a => !blockedAgentIds.includes(a.id));
    }

    if (candidates.length === 0) {
        console.warn(`🚨 [Assignment] Commande #${order.orderNumber}: Tous les agents sont exclus (Hidden/Restrictions). La commande restera SANS agent.`);
        continue; // Passer à la commande suivante, elle restera agentId: null
    }

    // 2. Load Balancing (Least Assigned Today) WITH Batch Logic
    if (candidates.length > 0) {
        // We randomize candidates with equal scores to avoid "locking" onto one agent for batch processing
        candidates.sort((a, b) => {
            const scoreA = getAgentScore(a.id);
            const scoreB = getAgentScore(b.id);
            
            const remA = scoreA % batchSize;
            const remB = scoreB % batchSize;

            // Rule 1: Priority to agents currently in an incomplete batch (remainder > 0)
            const isInBatchA = remA > 0;
            const isInBatchB = remB > 0;

            if (isInBatchA && !isInBatchB) return -1;
            if (!isInBatchA && isInBatchB) return 1;

            // Rule 2: If both are in a batch OR both are between batches, pick the one with lowest total load
            if (scoreA !== scoreB) return scoreA - scoreB;
            
            // Rule 3: Tie break
            return Math.random() - 0.5;
        });

        const bestAgent = candidates[0];

        try {
            await (prisma.order.update as any)({
                where: { id: order.id },
                data: { 
                    agentId: bestAgent.id,
                    assignedAt: new Date()
                },
            });

            const newScore = getAgentScore(bestAgent.id) + 1;
            localCounts.set(bestAgent.id, newScore);
            console.log(`✅ [Assignment] Order #${order.orderNumber} -> ${bestAgent.name} (Score Today: ${newScore})`);
        } catch (e) {
            console.error(`❌ [Assignment] Failed to update order #${order.orderNumber}`, e);
        }
    }
  }

  // VALIDATION FINALE: On rafraichit le cache seulement à la toute fin pour que l'UI affiche le résultat final
  revalidatePath("/");
};






export const getOrders = async () => {
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
    orderDate: order.orderDate.toISOString(),
    recallAt: order.recallAt ? order.recallAt.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
};

export const updateOrderAgent = async (orderId: string, agentId: string) => {
  await checkPermission("canEditOrders");

  try {
     const order = await (prisma.order.update as any)({
      where: { id: orderId },
      data: { 
        agentId: agentId === "unassigned" ? null : agentId,
        assignedAt: agentId === "unassigned" ? null : new Date()
      },
      include: { agent: true, status: true }
    });

    revalidatePath("/");
    
    const typedOrder = order as any;
    
    return {
        ...order,
        orderDate: order.orderDate.toISOString(),
        recallAt: order.recallAt ? order.recallAt.toISOString() : null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        status: typedOrder.status ? { id: typedOrder.status.id, name: typedOrder.status.name, color: typedOrder.status.color } : null,
        agent: typedOrder.agent ? { id: typedOrder.agent.id, name: typedOrder.agent.name, phone: typedOrder.agent.phone, iconColor: typedOrder.agent.iconColor } : null
    };

  } catch (err) {
    console.error("Erreur updateOrderAgent:", err);
    throw new Error("Impossible de modifier l'agent");
  }
};
export const deleteOrders = async (orderIds: string[]) => {
  const session = await checkPermission("canEditOrders");
  
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

export const updateOrdersAgent = async (orderIds: string[], agentId: string) => {
  await checkPermission("canEditOrders");

  try {
    const updated = await (prisma.order.updateMany as any)({
      where: { id: { in: orderIds } },
      data: { 
        agentId: agentId === "unassigned" ? null : agentId,
        assignedAt: agentId === "unassigned" ? null : new Date()
      },
    });

    revalidatePath("/");
    return updated;
  } catch (err) {
    console.error("Erreur updateOrdersAgent:", err);
    throw new Error("Impossible de modifier les agents en masse");
  }
};

export const updateOrdersStatus = async (orderIds: string[], statusId: string | null) => {
  await checkPermission("canEditOrders");
  
  try {
    // Note: statusId is null if we want to clear status (e.g. "To Process")
    // Use updateMany does not allow connecting relations easily if using `data: { status: ... }` direct connect syntax?
    // Prisma updateMany cannot assign relations directly with `connect`.
    // We must set `statusId` scalar field.
    
    const updated = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { statusId: statusId },
    });

    revalidatePath("/");
    return updated;
  } catch (err) {
    console.error("Erreur updateOrdersStatus:", err);
    throw new Error("Impossible de modifier les statuts en masse");
  }
};
