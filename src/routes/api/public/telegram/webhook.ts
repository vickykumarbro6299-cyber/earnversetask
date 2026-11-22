import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifiedOwnContact } from "@/lib/telegram-link";

const updateSchema = z.object({
  update_id: z.number().int(),
  message: z.object({
    chat: z.object({ id: z.number().int(), type: z.string() }),
    from: z.object({ id: z.number().int(), is_bot: z.boolean().optional() }).optional(),
    text: z.string().max(4096).optional(),
    contact: z.object({ user_id: z.number().int().optional(), phone_number: z.string().max(30) }).optional(),
  }).optional(),
});

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: { handlers: {
    POST: async ({ request }) => {
      const { telegramWebhookSecret, validTelegramWebhook, hashLinkToken, telegramBotCall } = await import("@/lib/telegram-link.server");
      const key = process.env["TELEGRAM_API_KEY"];
      if (!key || !validTelegramWebhook(request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "", telegramWebhookSecret(key))) {
        return new Response("Unauthorized", { status: 401, headers: { "X-EarnVerse-Telegram-Link": "1" } });
      }
      const parsed = updateSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return new Response("Invalid update", { status: 400 });
      const message = parsed.data.message;
      if (!message?.from || message.from.is_bot || message.chat.type !== "private" || message.chat.id !== message.from.id) return Response.json({ ok: true });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const send = (text: string, reply_markup?: object) => telegramBotCall("sendMessage", { chat_id: message.chat.id, text, ...(reply_markup ? { reply_markup } : {}) });
      try {
        const start = message.text?.match(/^\/start(?:@\w+)? link_([a-f0-9]{48})$/);
        if (start?.[1]) {
          const hash = hashLinkToken(start[1]);
          const { data: session, error } = await supabaseAdmin.from("telegram_link_sessions").select("telegram_id, verified_at, consumed_at, expires_at").eq("token_hash", hash).maybeSingle();
          if (error) throw error;
          if (!session || session.consumed_at || Date.parse(session.expires_at) <= Date.now() || (session.telegram_id && session.telegram_id !== message.from.id)) {
            await send("This link is expired or unavailable. Open EarnVerse and tap Link Telegram again.");
          } else if (session.verified_at) {
            await send("Telegram already verified. Return to EarnVerse and tap Check Status.");
          } else {
            const { error: updateError } = await supabaseAdmin.from("telegram_link_sessions").update({ telegram_id: message.from.id }).eq("token_hash", hash).is("telegram_id", null);
            if (updateError) throw updateError;
            await send("Share your own Indian (+91) Telegram contact to link your EarnVerse account.", { keyboard: [[{ text: "Share My Contact", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
          }
        } else if (message.contact) {
          const phone = verifiedOwnContact(message.from.id, message.contact);
          if (!phone) {
            await send("Only your own Indian (+91) Telegram contact is accepted. Use Share My Contact; forwarded contacts are not valid.");
          } else {
            const { data: session, error } = await supabaseAdmin.from("telegram_link_sessions").select("token_hash, owner_id")
              .eq("telegram_id", message.from.id).is("consumed_at", null).is("verified_at", null)
              .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (error) throw error;
            const { data: linked, error: linkedError } = await supabaseAdmin.from("telegram_identities").select("user_id").or(`telegram_id.eq.${message.from.id},phone.eq.${phone}`).limit(1).maybeSingle();
            if (linkedError) throw linkedError;
            if (!session) await send("Open EarnVerse and tap Link Telegram first.");
            else if (linked) await send("This Telegram ID or phone is already linked to an EarnVerse account. Sign in to that account.");
            else {
              const { error: verifyError } = await supabaseAdmin.from("telegram_link_sessions").update({ phone, verified_at: new Date().toISOString() }).eq("token_hash", session.token_hash).is("verified_at", null).is("consumed_at", null);
              if (verifyError) throw verifyError;
              await send("Telegram verified ✅ Return to EarnVerse and tap Check Status.", { remove_keyboard: true });
            }
          }
        } else if (message.text?.startsWith("/start")) {
          await send("Welcome to EarnVerse! Open the signup page or account alert and tap Link Telegram to verify your account.");
        }
        return Response.json({ ok: true });
      } catch (error) {
        console.error("Telegram linking update failed", error);
        return Response.json({ ok: false }, { status: 500 });
      }
    },
  } },
});