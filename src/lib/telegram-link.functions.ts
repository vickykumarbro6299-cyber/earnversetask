import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TELEGRAM_LINK_BOT } from "./telegram-link";

const startInput = z.object({ deviceId: z.string().min(8).max(200) });
const tokenInput = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/) });

export const beginSignupTelegram = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => startInput.parse(input))
  .handler(async ({ data }) => {
    const { createLinkSession } = await import("./telegram-session.server");
    return createLinkSession(data.deviceId, null);
  });

export const beginAccountTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => startInput.parse(input))
  .handler(async ({ data, context }) => {
    const { createLinkSession } = await import("./telegram-session.server");
    return createLinkSession(data.deviceId, context.userId);
  });

export const telegramLinkStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tokenInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashLinkToken } = await import("./telegram-link.server");
    const { data: session, error } = await supabaseAdmin.from("telegram_link_sessions")
      .select("verified_at, consumed_at, expires_at, telegram_id, phone")
      .eq("token_hash", hashLinkToken(data.token)).maybeSingle();
    if (error) throw new Error("Could not check Telegram verification");
    if (!session || Date.parse(session.expires_at) <= Date.now() || session.consumed_at) {
      return { state: "expired" as const, telegramId: "", mobile: "" };
    }
    if (!session.verified_at || !session.telegram_id || !session.phone) {
      return { state: "waiting" as const, telegramId: "", mobile: "" };
    }
    return { state: "verified" as const, telegramId: String(session.telegram_id), mobile: session.phone.slice(-10) };
  });

export const finishAccountTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => tokenInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("consume_telegram_link", { p_token: data.token, p_user_id: context.userId, p_signup: false });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getTelegramIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("telegram_identities").select("telegram_id, phone").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("Could not load Telegram link");
    return data;
  });

export const getTelegramSignupProtection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !isAdmin) throw new Error("Admin access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("app_settings").select("value").eq("key", "telegram_signup_required").maybeSingle();
    if (error) throw new Error("Could not load Telegram signup protection");
    return { active: data?.value === "true" };
  });

export const activateTelegramSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ origin: z.enum(["https://www.earnverse.life", "https://earnverse.life", "https://earnversetask.lovable.app"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !isAdmin) throw new Error("Admin access required");
    const url = `${data.origin}/api/public/telegram/webhook`;
    const probe = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", redirect: "error" });
    if (probe.status !== 401 || probe.headers.get("X-EarnVerse-Telegram-Link") !== "1") {
      throw new Error("Publish the updated EarnVerse site first, then activate Telegram signup from the live Admin Console.");
    }
    const key = process.env["TELEGRAM_API_KEY"];
    if (!key) throw new Error("Telegram bot is not connected");
    const { telegramBotCall, telegramWebhookSecret } = await import("./telegram-link.server");
    await telegramBotCall("setWebhook", { url, secret_token: telegramWebhookSecret(key), allowed_updates: ["message"], drop_pending_updates: false });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("app_settings").upsert({ key: "telegram_signup_required", value: "true" });
    if (error) throw new Error("Bot connected but signup protection could not activate; try again.");
    return { active: true };
  });

export { TELEGRAM_LINK_BOT };