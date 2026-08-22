import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Trophy, Timer, Coins } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { getLeaderboard } from "@/lib/earn.functions";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Weekly Leaderboard — EarnVerse" },
      {
        name: "description",
        content:
          "Top 50 EarnVerse earners of the week. Complete tasks, climb the ranks and win up to 1500 bonus coins every Sunday.",
      },
      { property: "og:title", content: "Weekly Leaderboard — EarnVerse" },
      {
        property: "og:description",
        content: "Top 50 weekly earners on EarnVerse win bonus coins every week.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function useCountdown(endIso: string | undefined) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!endIso) return;
    const tick = () => setLeft(Math.max(0, new Date(endIso).getTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endIso]);
  const s = Math.floor(left / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

const medal = ["bg-gradient-to-br from-amber-300 to-amber-500", "bg-gradient-to-br from-slate-300 to-slate-400", "bg-gradient-to-br from-orange-300 to-orange-500"];

function LeaderboardPage() {
  const fn = useServerFn(getLeaderboard);
  const q = useQuery({ queryKey: ["leaderboard"], queryFn: () => fn(), refetchInterval: 60_000 });
  const data = q.data;
  const t = useCountdown(data?.weekEnd);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-purple px-4 pb-8 pt-8">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            to="/tasks"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-primary-foreground">
            <Trophy className="h-6 w-6" /> Leaderboard
          </h1>
        </div>

        <div className="mx-auto mt-4 max-w-md rounded-2xl bg-primary-foreground/15 p-3 text-primary-foreground">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-90">
            <Timer className="h-4 w-4" /> Week ends in
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {[
              { v: t.d, l: "Days" },
              { v: t.h, l: "Hrs" },
              { v: t.m, l: "Min" },
              { v: t.s, l: "Sec" },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-primary-foreground/20 py-2">
                <p className="text-lg font-extrabold leading-none">{String(x.v).padStart(2, "0")}</p>
                <p className="mt-1 text-[10px] font-semibold opacity-80">{x.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] opacity-90">
            Monday to Sunday • only task earnings count (deposits excluded)
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-md px-4 pt-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: "1st", v: 1500 },
            { l: "2nd", v: 1000 },
            { l: "3rd", v: 500 },
            { l: "Rest", v: 50 },
          ].map((p) => (
            <div key={p.l} className="rounded-2xl border border-border bg-card p-2 text-center">
              <p className="text-[11px] font-bold uppercase text-muted-foreground">{p.l}</p>
              <p className="text-sm font-extrabold text-success">{p.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Your position
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-base font-extrabold text-foreground">
              {data?.me.rank ? `#${data.me.rank}` : "Unranked"}
            </span>
            <span className="text-sm font-bold text-foreground">
              {data?.me.coins ?? 0} coins earned
            </span>
            <span className="flex items-center gap-1 text-sm font-extrabold text-success">
              <Coins className="h-4 w-4" /> {data?.me.reward ?? 0}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {q.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
          {!q.isLoading && !data?.entries.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No earnings this week yet. Complete a task to enter the leaderboard!
            </p>
          )}
          {data?.entries.map((e) => (
            <div
              key={e.userId}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                e.isMe ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <span className="w-6 text-center text-sm font-extrabold text-muted-foreground">
                {e.rank}
              </span>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-primary-foreground ${
                  medal[e.rank - 1] ?? "bg-gradient-brand"
                }`}
              >
                {initials(e.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">
                  {e.name}
                  {e.isMe && <span className="ml-1 text-xs text-primary">(You)</span>}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {e.tasks} task{e.tasks === 1 ? "" : "s"} • {e.coins} coins
                </span>
              </span>
              <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-extrabold text-success">
                +{e.reward}
              </span>
            </div>
          ))}
        </div>

        {!!data?.myPayouts.length && (
          <div className="mt-6">
            <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Your past rewards
            </p>
            <div className="space-y-2">
              {data.myPayouts.map((p) => (
                <div
                  key={p.week_start}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 text-sm"
                >
                  <span className="font-semibold text-foreground">
                    Week of {new Date(p.week_start).toLocaleDateString()}
                  </span>
                  <span className="text-muted-foreground">#{p.rank}</span>
                  <span className="font-extrabold text-success">+{p.coins}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
