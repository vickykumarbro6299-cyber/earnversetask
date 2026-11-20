import { TASK_CATEGORIES } from "./earn-constants";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const CHANNEL = "@EarnVerseTask";

/** Posts a "New Task Added" alert to the Telegram channel. Never throws. */
export async function sendNewTaskAlert(task: { reward_coins: number; category: string | null }) {
  try {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const tgKey = process.env["TELEGRAM_API_KEY"];
    if (!lovableKey || !tgKey) return;
    const label = TASK_CATEGORIES.find((c) => c.key === task.category)?.label ?? task.category ?? "Other";
    const text = `New Task Added 🎉\n\nCoin :- ${task.reward_coins}\n\nCategory:- ${label}`;
    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: CHANNEL, text }),
    });
    if (!res.ok) console.error(`Telegram alert failed [${res.status}]: ${await res.text()}`);
  } catch (e) {
    console.error("Telegram alert error", e);
  }
}
