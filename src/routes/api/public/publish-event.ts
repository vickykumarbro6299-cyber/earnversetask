import { createFileRoute } from "@tanstack/react-router";
import { Webhook } from "standardwebhooks";
import { z } from "zod";

const eventSchema = z.object({
  type: z.literal("project.published.v1"),
  project_id: z.literal("f3ed7a99-3cd1-4597-aa1d-1feb249d887f"),
  data: z.object({ published_at: z.string().datetime({ offset: true }) }),
});

export const Route = createFileRoute("/api/public/publish-event")({
  server: { handlers: { POST: async ({ request }) => {
    const secret = process.env['LOVABLE_PUBLISH_WEBHOOK_SECRET'];
    if (!secret) return new Response("Publish notification not configured", { status: 503 });
    const raw = await request.text();
    let verified: unknown;
    try {
      verified = new Webhook(secret).verify(raw, {
        "webhook-id": request.headers.get("webhook-id") ?? "",
        "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": request.headers.get("webhook-signature") ?? "",
      });
    } catch { return new Response("Invalid signature", { status: 401 }); }
    const event = eventSchema.safeParse(verified);
    if (!event.success) return new Response("Ignored event", { status: 200 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("start_newbie_referral_event", {
      p_published_at: event.data.data.published_at,
      p_delivery_id: request.headers.get("webhook-id") ?? "",
    });
    if (error) return new Response("Could not record publication", { status: 500 });
    return new Response(null, { status: 204 });
  } } },
});