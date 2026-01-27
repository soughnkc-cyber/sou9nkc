import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { insertNewOrders } from "@/lib/actions/orders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const hmacValue = req.headers.get("x-shopify-hmac-sha256");
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("SHOPIFY_WEBHOOK_SECRET is not defined");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    if (!hmacValue) {
      console.warn("Missing X-Shopify-Hmac-Sha256 header");
      return NextResponse.json({ error: "Forbidden" }, { status: 401 });
    }

    // Verify HMAC
    const generatedHash = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    if (generatedHash !== hmacValue) {
      console.warn("Invalid HMAC signature");
      return NextResponse.json({ error: "Forbidden" }, { status: 401 });
    }

    const orderData = JSON.parse(body);

    console.log(`[Shopify Webhook] Received order #${orderData.order_number}. Acknowledging immediately.`);
    
    // Process in background
    insertNewOrders([orderData])
      .then(() => console.log(`[Shopify Webhook] Background processing completed for #${orderData.order_number}`))
      .catch((err) => console.error(`[Shopify Webhook] Background processing failed for #${orderData.order_number}:`, err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Shopify webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
