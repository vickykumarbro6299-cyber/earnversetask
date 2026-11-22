import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getDeviceId } from "@/lib/device-id";
import { beginSignupTelegram, beginAccountTelegram, telegramLinkStatus, finishAccountTelegram } from "@/lib/telegram-link.functions";
import type { TelegramVerification } from "@/lib/telegram-link";

export function TelegramLinkControl({ existing = false, onVerified }: { existing?: boolean; onVerified: (value: TelegramVerification) => void }) {
  const beginSignup = useServerFn(beginSignupTelegram);
  const beginAccount = useServerFn(beginAccountTelegram);
  const status = useServerFn(telegramLinkStatus);
  const finish = useServerFn(finishAccountTelegram);
  const [session, setSession] = useState<{ token: string; url: string } | null>(null);
  const [verified, setVerified] = useState<TelegramVerification | null>(null);
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    try {
      const data = { deviceId: getDeviceId() };
      setSession(await (existing ? beginAccount({ data }) : beginSignup({ data })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start Telegram linking");
    } finally { setBusy(false); }
  }

  async function check() {
    if (!session) return;
    setBusy(true);
    try {
      const result = await status({ data: { token: session.token } });
      if (result.state === "expired") {
        setSession(null);
        throw new Error("Link expired. Tap Link Telegram again.");
      }
      if (result.state !== "verified") {
        toast.info("Start the bot and share your own contact, then check again.");
        return;
      }
      if (existing) await finish({ data: { token: session.token } });
      const value = { token: session.token, telegramId: result.telegramId, mobile: result.mobile };
      setVerified(value);
      onVerified(value);
      toast.success("Telegram linked successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not check Telegram");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3 border-y border-border py-4">
      {verified ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold text-primary"><ShieldCheck className="h-4 w-4" /> Telegram verified</p>
          <label className="block text-xs font-semibold text-muted-foreground">Telegram ID
            <input aria-label="Telegram ID" readOnly value={verified.telegramId} className="mt-1 w-full rounded-md border border-input bg-muted p-2 text-sm text-foreground" />
          </label>
        </div>
      ) : session ? (
        <div className="space-y-2">
          <Button asChild className="w-full"><a href={session.url} target="_blank" rel="noopener noreferrer"><Send /> Start Bot & Share Contact</a></Button>
          <Button type="button" variant="outline" onClick={check} disabled={busy} className="w-full"><RefreshCw />{busy ? "Checking…" : "Check Status"}</Button>
          <Button type="button" variant="link" onClick={begin} disabled={busy} className="h-auto p-0 text-xs">Get a new link</Button>
        </div>
      ) : (
        <Button type="button" onClick={begin} disabled={busy} className="w-full"><Send />{busy ? "Please wait…" : "Link Telegram"}</Button>
      )}
    </div>
  );
}