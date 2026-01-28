import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { insertNewOrders } from "@/lib/actions/orders";

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Shopify Webhook ${requestId}] Start processing`);

  try {
    const body = await req.text();
    const hmacValue = req.headers.get("x-shopify-hmac-sha256");
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!secret) {
      console.error(`[Shopify Webhook ${requestId}] SHOPIFY_WEBHOOK_SECRET is not defined in environment`);
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    if (!hmacValue) {
      console.warn(`[Shopify Webhook ${requestId}] Missing X-Shopify-Hmac-Sha256 header`);
      return NextResponse.json({ error: "Unauthorized: Missing signature" }, { status: 401 });
    }

    // Verify HMAC
    const generatedHash = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    if (generatedHash !== hmacValue) {
      console.warn(`[Shopify Webhook ${requestId}] Invalid HMAC signature`);
      return NextResponse.json({ error: "Unauthorized: Invalid signature" }, { status: 401 });
    }

    const orderData = JSON.parse(body);
    console.log(`[Shopify Webhook ${requestId}] Received order #${orderData.order_number}. Processing...`);
    
    // Process and AWAIT (Required for Vercel Serverless)
    try {
      await insertNewOrders([orderData]);
      console.log(`[Shopify Webhook ${requestId}] Order #${orderData.order_number} processed successfully`);
    } catch (err) {
      console.error(`[Shopify Webhook ${requestId}] Error inserting order #${orderData.order_number}:`, err);
      // We still return 200 to Shopify if it's a processing error (unless we want retries)
      // but here we might want to know it failed.
      return NextResponse.json({ error: "Error processing data", details: String(err) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Order #${orderData.order_number} saved` });
  } catch (error) {
    console.error(`[Shopify Webhook ${requestId}] Fatal error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
