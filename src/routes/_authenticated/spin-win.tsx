import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ChevronLeft, Wallet, Gift, Unlock, Play, Info, X } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { getSpinState } from "@/lib/earn.functions";
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

function SpinWinPage() {
  const fetchState = useServerFn(getSpinState);
  const q = useQuery({ queryKey: ["spin-state"], queryFn: () => fetchState() });
  const [noAds, setNoAds] = useState(false);

  const coins = q.data?.coins ?? 0;
  const remaining = q.data?.remaining ?? SPINS_PER_DAY;

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

        <Wheel />

        <button
          onClick={() => setNoAds(true)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-brand py-4 text-lg font-extrabold uppercase tracking-wide text-primary-foreground shadow-pop active:scale-95"
        >
          <Play className="h-6 w-6" /> Watch Ad &amp; Spin
        </button>

        <div className="flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm font-semibold text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            You get up to {SPINS_PER_DAY} spins a day. Rewards are added straight to your
            EarnVerse coin balance.
          </p>
        </div>
      </main>

      {noAds && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-6"
          onClick={() => setNoAds(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-2xl font-extrabold text-foreground">No Ads Available ❌</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Please try again later.
            </p>
            <button
              onClick={() => setNoAds(false)}
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

function Wheel() {
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
          style={{ background: `conic-gradient(${gradient})` }}
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
