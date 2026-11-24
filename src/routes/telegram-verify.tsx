import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDeviceId } from "@/lib/device-id";
import { verifyTelegramDevice } from "@/lib/telegram-link.functions";

export const Route = createFileRoute("/telegram-verify")({
  validateSearch: z.object({ s: z.string().optional() }),
  head: () => ({ meta: [
    { title: "Verify Device — EarnVerse" },
    { name: "description", content: "Verify your device to finish linking Telegram with EarnVerse." },
    { property: "og:title", content: "Verify Device — EarnVerse" },
    { property: "og:description", content: "Finish Telegram verification on EarnVerse." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { s } = Route.useSearch();
  const verify = useServerFn(verifyTelegramDevice);
  const [state, setState] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!s) setState({ ok: false, msg: "Invalid link." }); }, [s]);
  async function run() {
    if (!s) return;
    setBusy(true);
    try { await verify({ data: { hash: s, deviceId: getDeviceId() } }); setState({ ok: true, msg: "Device verified ✅ Ab signup page par Check Status dabao." }); }
    catch (e) { setState({ ok: false, msg: e instanceof Error ? e.message : "Verification failed" }); }
    finally { setBusy(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <section className="w-full max-w-sm space-y-4 rounded-lg bg-card p-6 text-center shadow-pop">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="text-xl font-extrabold text-foreground">Verify Device</h1>
        <p className="text-sm text-muted-foreground">1 device par sirf 1 Telegram ID verify hogi.</p>
        {state && <p className={state.ok ? "text-sm font-bold text-primary" : "text-sm font-bold text-destructive"}>{state.msg}</p>}
        {!state?.ok && s && <Button className="w-full" onClick={run} disabled={busy}>{busy ? "Verifying…" : "Verify Device"}</Button>}
        <Button asChild variant="outline" className="w-full"><Link to="/auth">Back to EarnVerse</Link></Button>
      </section>
    </main>
  );
}
