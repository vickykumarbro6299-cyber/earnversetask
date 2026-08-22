import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Trophy, Timer, Crown } from "lucide-react";
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

function avatarBg(seed: string) {
  const hues = [200, 260, 320, 30, 160, 50, 340];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % hues.length;
  return `oklch(0.62 0.16 ${hues[h]!})`;
}

function formatCoins(n: number) {
  return n.toLocaleString("en-IN");
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

function LeaderboardPage() {
  const fn = useServerFn(getLeaderboard);
  const q = useQuery({ queryKey: ["leaderboard"], queryFn: () => fn(), refetchInterval: 60_000 });
  const data = q.data;
  const t = useCountdown(data?.weekEnd);

  const top3 = data?.entries.slice(0, 3) ?? [];
  const rest = data?.entries.slice(3) ?? [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative px-4 pb-4 pt-8">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link
            to="/tasks"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card text-foreground shadow-card"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-foreground">Leaderboard</h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Top Earners
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
            <Trophy className="h-5 w-5" />
          </span>
        </div>

        <div className="mx-auto mt-5 max-w-md">
          <div className="rounded-2xl border border-border bg-card p-1 shadow-card">
            <div className="flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-extrabold text-primary-foreground">
              Weekly
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
          <Timer className="h-4 w-4 text-primary" />
          <span>
            Week ends in {String(t.d).padStart(2, "0")}d {String(t.h).padStart(2, "0")}h{" "}
            {String(t.m).padStart(2, "0")}m {String(t.s).padStart(2, "0")}s
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4">
        {q.isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>}
        {!q.isLoading && !data?.entries.length && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No earnings this week yet. Complete a task to enter the leaderboard!
          </p>
        )}

        {!!top3.length && (
          <section className="relative mt-2 flex items-end justify-center gap-3 pb-2">
            {/* 2nd */}
            {top3[1] && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">🥈</div>
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-slate-300 text-lg font-extrabold text-primary-foreground shadow-lg"
                    style={{ backgroundColor: avatarBg(top3[1].name) }}
                  >
                    {initials(top3[1].name)}
                  </span>
                </div>
                <p className="mt-2 max-w-[84px] truncate text-xs font-bold text-foreground">
                  {top3[1].name}
                </p>
                <p className="text-xs font-extrabold text-slate-300">{formatCoins(top3[1].coins)}</p>
                <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                  +{formatCoins(top3[1].reward)} coins
                </span>
                <div className="mt-2 flex h-24 w-20 flex-col items-center justify-end rounded-t-2xl bg-gradient-to-b from-slate-300 to-slate-500 pb-3 shadow-lg">
                  <span className="text-2xl font-extrabold text-primary-foreground">2</span>
                </div>
              </div>
            )}

            {/* 1st */}
            {top3[0] && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                    <Crown className="h-7 w-7 text-gold" />
                  </div>
                  <span
                    className="flex h-20 w-20 items-center justify-center rounded-full border-[4px] border-gold text-2xl font-extrabold text-primary-foreground shadow-lg"
                    style={{ backgroundColor: avatarBg(top3[0].name) }}
                  >
                    {initials(top3[0].name)}
                  </span>
                </div>
                <p className="mt-2 max-w-[96px] truncate text-sm font-bold text-foreground">
                  {top3[0].name}
                </p>
                <p className="text-sm font-extrabold text-gold">{formatCoins(top3[0].coins)}</p>
                <span className="mt-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-extrabold text-gold">
                  +{formatCoins(top3[0].reward)} coins
                </span>
                <div className="mt-2 flex h-32 w-24 flex-col items-center justify-end rounded-t-2xl bg-gradient-to-b from-gold to-amber-600 pb-4 shadow-lg">
                  <span className="text-3xl font-extrabold text-primary-foreground">1</span>
                </div>
              </div>
            )}

            {/* 3rd */}
            {top3[2] && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">🥉</div>
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-orange-300 text-lg font-extrabold text-primary-foreground shadow-lg"
                    style={{ backgroundColor: avatarBg(top3[2].name) }}
                  >
                    {initials(top3[2].name)}
                  </span>
                </div>
                <p className="mt-2 max-w-[84px] truncate text-xs font-bold text-foreground">
                  {top3[2].name}
                </p>
                <p className="text-xs font-extrabold text-orange-300">{formatCoins(top3[2].coins)}</p>
                <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                  +{formatCoins(top3[2].reward)} coins
                </span>
                <div className="mt-2 flex h-20 w-20 flex-col items-center justify-end rounded-t-2xl bg-gradient-to-b from-orange-300 to-orange-600 pb-3 shadow-lg">
                  <span className="text-2xl font-extrabold text-primary-foreground">3</span>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="mt-4 space-y-3">
          {rest.map((e) => (
            <div
              key={e.userId}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                e.isMe ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">
                {e.rank}
              </span>
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-primary-foreground"
                style={{ backgroundColor: avatarBg(e.name) }}
              >
                {initials(e.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">
                  {e.name}
                  {e.isMe && <span className="ml-1 text-xs text-primary">(You)</span>}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatCoins(e.coins)} coins earned
                </span>
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary">
                +{formatCoins(e.reward)}
              </span>
            </div>
          ))}
        </div>

        {data?.me && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Your position
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-extrabold text-foreground">
                {data.me.rank ? `#${data.me.rank}` : "Unranked"}
              </span>
              <span className="text-sm font-bold text-foreground">{formatCoins(data.me.coins)} coins</span>
              <span className="text-sm font-extrabold text-primary">+{formatCoins(data.me.reward)}</span>
            </div>
          </div>
        )}

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
                  <span className="font-extrabold text-primary">+{p.coins}</span>
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
