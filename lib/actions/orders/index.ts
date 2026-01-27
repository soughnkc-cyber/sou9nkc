"use server";


import prisma from "@/lib/prisma";

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
  }[];
};

export const insertNewOrders = async (shopifyOrders: ShopifyOrder[]) => {
  for (const order of shopifyOrders) {
    // Vérifie si la commande existe déjà
    const existing = await prisma.order.findUnique({
      where: { orderNumber: order.order_number },
    });

    if (!existing) {
      const customerName = order.customer
        ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim()
        : order.name; // fallback sur order.name
      const customerPhone = order.customer?.phone ?? order.billing_address?.phone ?? null;

      const productNote =
        order.line_items && order.line_items.length > 0
          ? order.line_items.map((i) => i.title).join(", ")
          : null;

      await prisma.order.create({
        data: {
          orderNumber: order.order_number,
          customerName,
          customerPhone,
          productNote,
          orderDate: new Date(order.created_at),
          totalPrice: parseFloat(order.total_price),
        },
      });

      console.log(`Commande #${order.order_number} ajoutée à la DB`);
    }
  }
};

export const getOrders = async () => {
  const orders = await prisma.order.findMany({
    include: { status: true },
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
    status: o.status
      ? { id: o.status.id, name: o.status.name }
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


