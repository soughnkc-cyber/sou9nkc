"use server";

import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasPermission } from "@/lib/auth-utils";
import { checkPermission } from "../auth-helper";
import { revalidatePath } from "next/cache";






export const insertNewProducts = async (products: any[]) => {

  for (const p of products) {
    await prisma.product.upsert({
      where: { shopifyId: String(p.id) },
      update: {
        title: p.title,
        status: p.status,
        vendor: p.vendor,
        productType: p.product_type,
        price:
          p.variants?.[0]?.price
            ? parseFloat(p.variants[0].price)
            : 0,
      },
      create: {
        shopifyId: String(p.id),
        title: p.title,
        status: p.status,
        vendor: p.vendor,
        productType: p.product_type,
        price:
          p.variants?.[0]?.price
            ? parseFloat(p.variants[0].price)
            : 0,
      },
    });
  }
  revalidatePath("/");
};


export const getProducts = async () => {
  await checkPermission("canViewProducts");
  
  const products = await prisma.product.findMany({

    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    shopifyId: p.shopifyId,
    title: p.title,
    status: p.status,
    vendor: p.vendor,
    productType: p.productType,
    price: p.price,
    assignedAgentIds: p.assignedAgentIds,
    hiddenForAgentIds: p.hiddenForAgentIds,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
};

export const updateProductAgents = async (
  productId: string,
  data: { assignedAgentIds?: string[]; hiddenForAgentIds?: string[] }
) => {
  await checkPermission("canEditProducts");
  
  try {

    const product = await prisma.product.update({
      where: { id: productId },
      data,
    });

    revalidatePath("/");
    return {

      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Erreur updateProductAgents:", error);
    throw new Error("Impossible de mettre à jour les agents du produit");
  }
};

