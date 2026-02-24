"use server";


import prisma from "@/lib/prisma";
import { checkPermission } from "../auth-helper";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "../settings";
import { sendTelegramMessage } from "@/lib/telegram";







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

async function notifyAgentOfNewOrder(agentId: string, orderNumber: number, productNames: string) {
  try {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { telegramChatId: true, name: true }
    });

    if (agent?.telegramChatId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sou9nkc.vercel.app";
      const message = `🔔 <b>تم تعيين طلب جديد</b>\n\n<b>الطلب:</b> #${orderNumber}\n<b>المنتج:</b> ${productNames}\n<b>الوكيل:</b> ${agent.name}\n\n<a href="${appUrl}">👉 انقر هنا لفتح التطبيق</a>`;
      await sendTelegramMessage(agent.telegramChatId, message);
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}


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
  console.log(`📦 [Assignment] Using Max Untreated Batch Size: ${batchSize}`);

  // 💤 Count UNTREATED orders (assigned but status is null)
  const agentUntreatedCounts = await prisma.order.groupBy({
    by: ['agentId'],
    _count: { id: true },
    where: {
        agentId: { not: null },
        statusId: null // "Non traité"
    }
  });

  // Map for Untreated Count (Saturation & Balancing)
  const localUntreatedCounts = new Map<string, number>();
  agents.forEach(a => localUntreatedCounts.set(a.id, 0));
  agentUntreatedCounts.forEach(c => {
    if (c.agentId) localUntreatedCounts.set(c.agentId, c._count.id);
  });

  console.log("💤 [Assignment] Initial Untreated Load:", Object.fromEntries(localUntreatedCounts));

  for (const order of ordersToAssign) {
    const getAgentUntreatedCount = (agentId: string) => localUntreatedCounts.get(agentId) || 0;
    
    // 1. Determine eligible agents based on Restricted/Hidden rules
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

    let baseCandidates: typeof agents = [];

    // IMPORTANT: On vérifie si parmis les agents ASSIGNÉS au produit, il y en a au moins un qui est ACTIF (présent dans notre liste agents)
    const activeRequiredIds = requiredAgentIds.filter(id => agents.some(a => a.id === id));

    if (activeRequiredIds.length > 0) {
        // CASE A: Strict Assignment (Seulement si au moins un des assignés est réellement éligible/actif)
        baseCandidates = agents.filter(a => activeRequiredIds.includes(a.id) && !blockedAgentIds.includes(a.id));
    } else {
        // CASE B: Open Assignment (Si personne n'est assigné, ou si TOUS les assignés sont inactifs/éteints)
        baseCandidates = agents.filter(a => !blockedAgentIds.includes(a.id));
    }

    if (baseCandidates.length === 0) {
        console.warn(`🚨 [Assignment] Order #${order.orderNumber}: No eligible agents found due to restrictions.`);
        continue; 
    }

    // 2. Capacity Filtering (Backpressure)
    // We prefer agents who have NOT reached the batchSize limit of untreated orders.
    let candidates = baseCandidates.filter(a => getAgentUntreatedCount(a.id) < batchSize);

    if (candidates.length === 0) {
        // FALLBACK: Everyone is saturated. We must assign anyway to prevent stalling.
        candidates = baseCandidates;
        console.log(`⚠️ [Assignment] All agents saturated (Untreated >= ${batchSize}). Using saturated candidates.`);
    }

    // 3. Load Balancing (Least Untreated Orders)
    candidates.sort((a, b) => {
        const scoreA = getAgentUntreatedCount(a.id);
        const scoreB = getAgentUntreatedCount(b.id);
        
        // Primary: Least untreated orders currently
        if (scoreA !== scoreB) return scoreA - scoreB;
        
        // Secondary: Tie break random
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

        // Notify agent
        const productNames = order.products.map(p => p.title).join(", ");
        notifyAgentOfNewOrder(bestAgent.id, order.orderNumber, productNames);

        // Update local memory counters
        const newUntreatedScore = getAgentUntreatedCount(bestAgent.id) + 1;
        localUntreatedCounts.set(bestAgent.id, newUntreatedScore);

        console.log(`✅ [Assignment] Order #${order.orderNumber} -> ${bestAgent.name} (Untreated: ${newUntreatedScore})`);
    } catch (e) {
        console.error(`❌ [Assignment] Failed to update order #${order.orderNumber}`, e);
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
      absoluteDelayMin: o.absoluteDelayMin,
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
      include: { agent: true, status: true, products: true }
    });

    revalidatePath("/");

    // Notify agent if assigned
    if (agentId !== "unassigned") {
        const productNames = order.products.map((p: any) => p.title).join(", ");
        notifyAgentOfNewOrder(agentId, order.orderNumber, productNames);
    }
    
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
export const bulkUpdateOrders = async (
  orderIds: string[],
  updates: {
    agentId?: string;
    statusId?: string | null;
    recallAt?: Date | null;
  }
) => {
  await checkPermission("canEditOrders");
  
  try {
    const { agentId, statusId, recallAt } = updates;
    
    // If statusId is being updated, check if we need to auto-clear recallAt
    let shouldClearRecallAt = false;
    if (statusId !== undefined && recallAt === undefined) {
      // Only check if recallAt wasn't explicitly provided
      if (statusId === null) {
        // Clearing status (back to "To Process") should clear recall
        shouldClearRecallAt = true;
      } else {
        // Check if the selected status has recallAfterH
        const status = await prisma.status.findUnique({
          where: { id: statusId },
          select: { recallAfterH: true }
        });
        
        // If status doesn't have automatic recall, clear any existing recall date
        if (status && status.recallAfterH == null) {
          shouldClearRecallAt = true;
        }
      }
    }
    
    // ------------------------------------------------------------------
    // 🔍 PRE-FETCH: Get orders and settings to calculate Delay / processingTime
    // ------------------------------------------------------------------
    const [ordersToUpdate, settings] = await Promise.all([
      prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, orderNumber: true, orderDate: true, assignedAt: true, firstProcessedAt: true, processingTimeMin: true, updatedAt: true }
      }),
      getSystemSettings()
    ]);

    const { calculateWorkMinutes } = await import("@/lib/work-time");
    const now = new Date();

    // We'll use a transaction to ensure all orders are updated or none
    const results = await prisma.$transaction(
      ordersToUpdate.map(order => {
        let data: any = {};
        
        // --- 1. Agent & Assignment
        if (agentId !== undefined) {
          data.agentId = agentId === "unassigned" ? null : agentId;
          if (agentId !== "unassigned") data.assignedAt = now;
        }

        // --- 2. Status Update
        if (statusId !== undefined) {
          data.statusId = statusId;
          
          // ⏱️ TIME CALCULATION LOGIC (Same as updateOrderStatus)
          // If status is beneficial (not null) and we need to calc time
          if (statusId && (!order.firstProcessedAt || order.processingTimeMin === null)) {
             
             // Fallback: assignedAt -> updatedAt -> orderDate
             const calculationBase = order.assignedAt || order.updatedAt || order.orderDate;
             
             const absoluteDiffMs = now.getTime() - calculationBase.getTime();
             const absoluteDiffMin = Math.round(absoluteDiffMs / (1000 * 60));
             
             const workMin = calculateWorkMinutes(calculationBase, now, settings as any);
             
             // Only update firstProcessedAt if it was missing
             if (!order.firstProcessedAt) {
                 data.firstProcessedAt = now;
             }
             
             data.processingTimeMin = workMin;
             data.absoluteDelayMin = absoluteDiffMin;
          }
        }
        
        // --- 3. Recall Logic
        // Handle recallAt based on explicit value or auto-clear logic
        if (recallAt !== undefined) {
          data.recallAt = recallAt;
        } else if (shouldClearRecallAt) {
          data.recallAt = null;
        }
        
        return prisma.order.update({
          where: { id: order.id },
          data,
        });
      })
    );

    // Notify agents if assigned
    if (agentId !== undefined && agentId !== "unassigned") {
      ordersToUpdate.forEach(async order => {
        // We already have product titles in a bulk order? No, we only selected id, orderNumber... 
        // We need to fetch products or pass them. Let's fetch products for notifications.
        const orderWithProducts = await prisma.order.findUnique({
          where: { id: order.id },
          select: { products: { select: { title: true } } }
        });
        const productNames = orderWithProducts?.products.map(p => p.title).join(", ") || "";
        notifyAgentOfNewOrder(agentId, order.orderNumber, productNames);
      });
    }

    revalidatePath("/");
    return { success: true, count: results.length };
  } catch (err: any) {
    console.error("Erreur bulkUpdateOrders:", err);
    throw new Error(err.message || "Impossible de mettre à jour les commandes");
  }
};
