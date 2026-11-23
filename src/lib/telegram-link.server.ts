import { createHash, timingSafeEqual } from "node:crypto";

export function hashLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function telegramWebhookSecret(key: string) {
  return createHash("sha256").update(`telegram-webhook:${key}`).digest("base64url");
}

export function validTelegramWebhook(actual: string, expected: string) {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function telegramBotCall(method: string, body: object) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["TELEGRAM_API_KEY_1"];
  if (!apiKey || !connectionKey) throw new Error("Telegram linking is temporarily unavailable");
  const response = await fetch(`https://connector-gateway.lovable.dev/telegram/${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    console.error(`Telegram [${response.status}]: ${error}`);
    throw new Error(`Telegram [${response.status}]: ${error}`);
  }
  const result = await response.json() as { ok: boolean; description?: string };
  if (!result.ok) throw new Error(`Telegram: ${result.description ?? "Request failed"}`);
  return result;
}