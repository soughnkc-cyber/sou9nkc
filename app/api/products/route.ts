// app/api/products/route.ts
import { insertNewProducts } from "@/lib/actions/products";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async () => {
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
