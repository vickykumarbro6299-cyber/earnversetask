import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHasSession } from "@/lib/use-earn";
import { getTelegramIdentity } from "@/lib/telegram-link.functions";
import { TelegramLinkControl } from "./telegram-link-control";

export function TelegramLinkAlert() {
  const hasSession = useHasSession();
  const getIdentity = useServerFn(getTelegramIdentity);
  const identity = useQuery({ queryKey: ["telegram-identity"], queryFn: () => getIdentity(), enabled: hasSession === true, retry: false });
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  if (!hasSession || !identity.isSuccess || identity.data || dismissed || done) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 px-5 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="telegram-alert-title" className="relative w-full max-w-sm rounded-lg bg-card p-5 shadow-pop">
        <Button type="button" variant="ghost" size="icon" onClick={() => setDismissed(true)} aria-label="Close Telegram alert" className="absolute right-2 top-2"><X /></Button>
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h2 id="telegram-alert-title" className="mt-3 pr-6 text-lg font-extrabold text-foreground">Alert Link Your Telegram ID</h2>
        <TelegramLinkControl existing onVerified={() => { setDone(true); void identity.refetch(); }} />
      </section>
    </div>
  );
}