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

    // Shopify Order Webhook sends a single order object
    // insertNewOrders expects an array
    console.log(`Received Shopify webhook for order #${orderData.order_number}`);
    
    await insertNewOrders([orderData]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Shopify webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
