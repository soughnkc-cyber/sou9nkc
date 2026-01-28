import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { insertNewOrders } from "@/lib/actions/orders"; // Ton fichier d'action
import prisma from "@/lib/prisma"; // Ton client prisma

export async function POST(req: NextRequest) {
  console.log("🟢 [Webhook] Réception d'une requête Shopify");

  try {
    const bodyText = await req.text();
    
    // 1. Vérification SECRET
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("🔴 [Webhook] Erreur : SHOPIFY_WEBHOOK_SECRET est manquant dans les env vars Vercel");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 2. Vérification HMAC
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    const hash = crypto.createHmac("sha256", secret).update(bodyText).digest("base64");

    if (hash !== hmac) {
      console.error(`🔴 [Webhook] Signature Invalide. Reçu: ${hmac}, Calculé: ${hash}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const orderData = JSON.parse(bodyText);
    console.log(`🔵 [Webhook] Commande #${orderData.order_number} reçue. Traitement...`);

    // 3. Vérification Préalable (Debug)
    // On vérifie si on a des agents AVANT de lancer l'action pour voir si le problème vient de la DB
    const agentCount = await prisma.user.count({
        where: { role: { in: ["AGENT", "AGENT_TEST"] }, status: "ACTIVE" }
    });
    console.log(`🟡 [Debug DB] Nombre d'agents actifs trouvés en base : ${agentCount}`);

    if (agentCount === 0) {
        console.error("🔴 [Webhook] Annulation : Aucun agent dans la base de données Production !");
        // On retourne 200 pour que Shopify arrête de réessayer, mais on log l'erreur
        return NextResponse.json({ message: "No agents found, skipped" });
    }

    // 4. Lancement de l'action
    await insertNewOrders([orderData]);
    
    console.log(`🟢 [Webhook] Commande #${orderData.order_number} traitée avec succès.`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔴 [Webhook] ERREUR FATALE :", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}