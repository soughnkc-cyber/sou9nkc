export async function sendTelegramMessage(chatId: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
    return { success: false, error: "Token not configured" };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  console.log(`📡 [Telegram] Sending message to ChatId: ${chatId}`);
  // console.log(`🔑 [Telegram] Using Token: ${token.substring(0, 5)}...`); 

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("❌ Telegram API error:", data);
      return { success: false, error: data.description || "Unknown Telegram error" };
    }

    console.log(`✅ [Telegram] Message delivered to ChatId: ${chatId}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error);
    return { success: false, error: "Network error" };
  }
}
