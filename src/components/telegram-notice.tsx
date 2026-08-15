import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";
import { TELEGRAM_CHANNEL } from "@/lib/earn-constants";

const KEY = "ev_telegram_notice_hidden_until";

export function TelegramNotice() {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(KEY) ?? 0);
      if (!until || Date.now() > until) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function close() {
    if (dontShow) {
      try {
        localStorage.setItem(KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-5 backdrop-blur-sm">
      <div className="relative w-full max-w-sm animate-pop-in rounded-2xl bg-card p-5 shadow-pop">
        <button
          onClick={close}
          aria-label="Close notice"
          className="absolute right-3 top-3 rounded-full bg-muted p-1.5 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#229ED9]">
          <Send className="h-6 w-6 -rotate-12 text-primary-foreground" />
        </span>

        <h2 className="mt-3 text-lg font-extrabold text-foreground">Join Telegram Channel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get instant updates on new tasks, payouts and important EarnVerse announcements.
        </p>

        <a
          href={TELEGRAM_CHANNEL}
          target="_blank"
          rel="noreferrer noopener"
          onClick={close}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-3 font-bold text-primary-foreground"
        >
          <Send className="h-4 w-4 -rotate-12" /> Join Telegram
        </a>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted-foreground">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
          Don&apos;t show again for 24 hours
        </label>
      </div>
    </div>
  );
}
