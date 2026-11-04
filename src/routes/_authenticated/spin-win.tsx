import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ChevronLeft, Wallet, Gift, Unlock, Play, Info, X, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { getSpinState, spinWheel } from "@/lib/earn.functions";
import { SPIN_SEGMENTS, SPINS_PER_DAY } from "@/lib/earn-constants";

export const Route = createFileRoute("/_authenticated/spin-win")({
  head: () => ({
    meta: [
      { title: "Daily Spin & Win — EarnVerse" },
      {
        name: "description",
        content:
          "Spin the EarnVerse wheel every day and win bonus coins — up to 10 free spins daily.",
      },
      { property: "og:title", content: "Daily Spin & Win — EarnVerse" },
      {
        property: "og:description",
        content: "Win up to 1000 bonus coins with the daily EarnVerse spin wheel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpinWinPage,
});

type SpinResult = { key: string; label: string; coins: number; remaining: number };

declare global {
  interface Window {
    show_11729008?: (type?: "pop") => Promise<unknown>;
  }
}

/** Plays a rewarded ad. Resolves true when the ad was watched, false otherwise. */
async function showRewardedAd(type?: "pop"): Promise<boolean> {
  const fn = window.show_11729008;
  if (typeof fn !== "function") return false;
  try {
    await fn(type);
    return true;
  } catch {
    return false;
  }
}

function SpinWinPage() {
  const queryClient = useQueryClient();
  const fetchState = useServerFn(getSpinState);
  const runSpin = useServerFn(spinWheel);
  const q = useQuery({ queryKey: ["spin-state"], queryFn: () => fetchState() });

  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const rotationRef = useRef(0);

  const coins = q.data?.coins ?? 0;
  const remaining = result ? result.remaining : (q.data?.remaining ?? SPINS_PER_DAY);

  const handleSpin = async () => {
    if (busy || spinning) return;
    if (remaining <= 0) {
      toast.error("Daily spin limit reached. Come back tomorrow!");
      return;
    }
    setBusy(true);
    try {
      // Step 1: user must watch the rewarded ad first.
      const watched = await showRewardedAd();
      if (!watched) {
        toast.error("Ad not completed — please watch the full ad to spin.");
        return;
      }

      // Step 2: record the spin on the server and get the result.
      const res = (await runSpin()) as SpinResult;

      // Step 3: animate the wheel to the winning segment.
      const idx = Math.max(
        0,
        SPIN_SEGMENTS.findIndex((s) => s.key === res.key),
      );
      const slice = 360 / SPIN_SEGMENTS.length;
      const targetMod = 360 - (idx * slice + slice / 2);
      const currentMod = rotationRef.current % 360;
      const delta = (targetMod - currentMod + 360) % 360;
      const next = rotationRef.current + 360 * 6 + delta;
      rotationRef.current = next;
      setRotation(next);
      setSpinning(true);

      window.setTimeout(() => {
        setSpinning(false);
        setResult(res);
        void queryClient.invalidateQueries({ queryKey: ["spin-state"] });
        void queryClient.invalidateQueries({ queryKey: ["me"] });
      }, 5200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not spin — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="bg-gradient-purple px-4 pb-6 pt-8">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            to="/tasks"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-primary-foreground">Daily Spin &amp; Win</h1>
        </div>
      </div>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground">
          Daily Spin &amp; Win
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <StatBox
            icon={<Wallet className="h-5 w-5" />}
            tone="text-primary"
            label="Total Balance"
            value={coins.toLocaleString()}
            valueClass="text-foreground"
          />
          <StatBox
            icon={<Gift className="h-5 w-5" />}
            tone="text-success"
            label="FREE"
            value={String(remaining)}
            valueClass="text-success"
          />
        </div>

        <div className="flex items-center justify-center gap-3 rounded-2xl bg-success/15 px-4 py-4">
          <Unlock className="h-6 w-6 text-success" />
          <p className="text-base font-extrabold text-success">
            {remaining > 0
              ? "Great! The wheel is ready to spin."
              : "Daily spin limit reached. Come back tomorrow."}
          </p>
        </div>

        <Wheel rotation={rotation} spinning={spinning} />

        <button
          onClick={handleSpin}
          disabled={busy || spinning || remaining <= 0}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-brand py-4 text-lg font-extrabold uppercase tracking-wide text-primary-foreground shadow-pop active:scale-95 disabled:opacity-60"
        >
          <Play className="h-6 w-6" />
          {busy ? "Loading Ad…" : spinning ? "Spinning…" : "Watch Ad & Spin"}
        </button>

        <div className="flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm font-semibold text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Watch a short ad to spin the wheel. You get up to {SPINS_PER_DAY} spins a day — rewards
            are added straight to your EarnVerse coin balance.
          </p>
        </div>
      </main>

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-6">
          <div className="w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-pop">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <PartyPopper className="h-8 w-8 text-success" />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-foreground">
              {result.coins > 0 ? `You Won ${result.coins} Coins 🎉` : "Better Luck Next Time!"}
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {result.coins > 0
                ? "Coins have been added to your wallet."
                : "Spin again for another chance to win."}
            </p>
            <button
              onClick={() => setResult(null)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 font-extrabold text-primary-foreground active:scale-95"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function StatBox({
  icon,
  tone,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-muted ${tone}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`truncate text-xl font-extrabold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function Wheel({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  const n = SPIN_SEGMENTS.length;
  const slice = 360 / n;
  const gradient = SPIN_SEGMENTS.map(
    (s, i) => `${s.color} ${i * slice}deg ${(i + 1) * slice}deg`,
  ).join(", ");

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[22px] border-x-transparent border-t-foreground" />
      <div className="absolute inset-0 rounded-full bg-primary/30 p-2">
        <div
          className="relative h-full w-full rounded-full border-[6px] border-primary"
          style={{
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 5s cubic-bezier(0.12, 0.8, 0.08, 1)" : undefined,
          }}
        >
          {SPIN_SEGMENTS.map((s, i) => (
            <span
              key={s.key}
              className="absolute left-1/2 top-1/2 origin-left whitespace-nowrap text-[11px] font-extrabold text-white drop-shadow"
              style={{
                transform: `rotate(${i * slice + slice / 2 - 90}deg) translateX(58%)`,
              }}
            >
              {s.label}
            </span>
          ))}
          <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-background bg-foreground" />
          <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
