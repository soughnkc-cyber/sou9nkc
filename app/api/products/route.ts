// app/api/products/route.ts
import { insertNewProducts } from "@/lib/actions/products";
import { NextResponse } from "next/server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export const GET = async () => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { status: true, canEditProducts: true }
  });

  if (!user || user.status !== "ACTIVE" || !user.canEditProducts) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const shop = process.env.SHOPIFY_STORE_URL;

  try {
    const res = await fetch(
      `https://${shop}/admin/api/2026-01/products.json?limit=250`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken!,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Shopify error");
    }

    const data = await res.json();

    await insertNewProducts(data.products);

    return NextResponse.json({
      success: true,
      products: data.products,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
};
