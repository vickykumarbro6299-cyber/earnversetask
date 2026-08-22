import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, CalendarCheck, CheckCircle2, Coins } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { claimDailyBonus, getDailyBonus } from "@/lib/earn.functions";

export const Route = createFileRoute("/_authenticated/daily-bonus")({
  head: () => ({
    meta: [
      { title: "Daily Bonus — EarnVerse" },
      {
        name: "description",
        content:
          "Complete at least 5 tasks today on EarnVerse and claim your free 50 coins daily bonus.",
      },
      { property: "og:title", content: "Daily Bonus — EarnVerse" },
      {
        property: "og:description",
        content: "Finish 5 tasks a day and claim 50 bonus coins on EarnVerse.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DailyBonusPage,
});

function DailyBonusPage() {
  const fetchBonus = useServerFn(getDailyBonus);
  const claimFn = useServerFn(claimDailyBonus);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["daily-bonus"], queryFn: () => fetchBonus() });

  const claim = useMutation({
    mutationFn: () => claimFn(),
    onSuccess: (r) => {
      toast.success(`Daily bonus claimed — +${r.coins} coins 🎉`);
      qc.invalidateQueries({ queryKey: ["daily-bonus"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not claim bonus"),
  });

  const d = q.data;
  const completed = d?.completed ?? 0;
  const required = d?.required ?? 5;
  const pct = Math.min(100, Math.round((completed / required) * 100));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-purple px-4 pb-6 pt-8">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            to="/tasks"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-primary-foreground">
            <CalendarCheck className="h-6 w-6" /> Daily Bonus
          </h1>
        </div>
      </div>

      <div className="mx-auto -mt-4 max-w-md space-y-4 px-4">
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground">
              <Coins className="h-7 w-7" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-foreground">
                {d?.coins ?? 50} Coins
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                Complete at least {required} tasks today to claim
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">Today&apos;s progress</span>
              <span className="text-foreground">
                {completed}/{required} tasks
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <button
            disabled={q.isLoading || claim.isPending || !d?.canClaim}
            onClick={() => claim.mutate()}
            className="mt-5 w-full rounded-2xl bg-primary py-3 text-base font-extrabold text-primary-foreground disabled:opacity-50"
          >
            {q.isLoading
              ? "Loading…"
              : d?.claimed
                ? "Claimed today ✓"
                : claim.isPending
                  ? "Claiming…"
                  : d?.canClaim
                    ? `Claim ${d.coins} Coins`
                    : `Complete ${required - completed} more task${required - completed === 1 ? "" : "s"}`}
          </button>

          <p className="mt-3 text-center text-[11px] font-semibold text-muted-foreground">
            Only admin-approved tasks completed today count. Resets daily at 12:00 AM IST.
          </p>
        </div>

        <div className="rounded-3xl bg-card p-4 shadow-card">
          <p className="mb-2 text-sm font-extrabold text-foreground">Recent bonuses</p>
          {!d?.history?.length ? (
            <p className="py-3 text-center text-xs font-semibold text-muted-foreground">
              No bonus claimed yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {d.history.map((h) => (
                <li key={h.bonus_date} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {new Date(h.bonus_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-sm font-extrabold text-success">+{h.coins}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
