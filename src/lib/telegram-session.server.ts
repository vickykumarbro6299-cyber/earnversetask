import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashLinkToken } from "./telegram-link.server";
import { TELEGRAM_LINK_BOT } from "./telegram-link";

export async function createLinkSession(deviceId: string, ownerId: string | null) {
  if (!process.env["TELEGRAM_API_KEY_1"] || !process.env["LOVABLE_API_KEY"]) throw new Error("Telegram linking is temporarily unavailable");
  if (!ownerId) {
    const { count, error } = await supabaseAdmin.from("device_accounts").select("id", { head: true, count: "exact" }).eq("device_id", deviceId);
    if (error) throw new Error("Could not check this device; please try again");
    if (count) throw new Error("An account already exists on this device. Please sign in.");
  }
  const token = randomBytes(24).toString("hex");
  const { error } = await supabaseAdmin.from("telegram_link_sessions").insert({ token_hash: hashLinkToken(token), owner_id: ownerId, device_id: deviceId });
  if (error) throw new Error("Could not start Telegram linking");
  return { token, url: `https://t.me/${TELEGRAM_LINK_BOT}?start=link_${token}` };
}