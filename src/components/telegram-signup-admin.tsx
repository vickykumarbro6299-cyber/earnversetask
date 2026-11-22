import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { activateTelegramSignup, getTelegramSignupProtection } from "@/lib/telegram-link.functions";

export function TelegramSignupAdmin() {
  const getProtection = useServerFn(getTelegramSignupProtection);
  const activate = useServerFn(activateTelegramSignup);
  const status = useQuery({ queryKey: ["telegram-signup-protection"], queryFn: () => getProtection() });
  const [busy, setBusy] = useState(false);
  async function enable() {
    setBusy(true);
    try {
      const origin = window.location.origin;
      if (origin !== "https://www.earnverse.life" && origin !== "https://earnverse.life" && origin !== "https://earnversetask.lovable.app") {
        throw new Error("Publish EarnVerse first, then activate this from your live Admin Console.");
      }
      await activate({ data: { origin } });
      await status.refetch();
      toast.success("Telegram bot connected. Verified Telegram is now required for every new signup.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not activate Telegram signup");
    } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground"><ShieldCheck />Telegram signup: {status.isError ? "Unavailable" : status.data?.active ? "Required" : "Not activated"}</p>
      {!status.data?.active && <Button type="button" onClick={enable} disabled={busy || !status.isSuccess}><ShieldCheck />{busy ? "Activating…" : "Activate Telegram Signup"}</Button>}
    </div>
  );
}