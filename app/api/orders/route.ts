import { insertNewOrders } from "@/lib/actions/orders";
import { NextResponse } from "next/server";
export const runtime = "nodejs";


export const GET = async () => {
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const shop = process.env.SHOPIFY_STORE_URL;

  try {
    const res = await fetch(`https://${shop}/admin/api/2026-01/orders.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken!,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    // Insère uniquement les nouvelles commandes
    await insertNewOrders(data.orders);

    return NextResponse.json({ success: true, orders: data.orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
};
