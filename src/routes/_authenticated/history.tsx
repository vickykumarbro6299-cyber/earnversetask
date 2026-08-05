import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, ClipboardCheck } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { useMe } from "@/lib/use-earn";
import { getEarningHistory } from "@/lib/earn.functions";
import { toRupees } from "@/lib/earn-constants";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Earning History — EarnVerse Coin Ledger" },
      {
        name: "description",
        content:
          "Track every coin you earned from tasks, plus your deposit and withdrawal records with admin notes.",
      },
      { property: "og:title", content: "Earning History — EarnVerse" },
      {
        property: "og:description",
        content: "Your complete EarnVerse coin earning, deposit and withdrawal ledger.",
      },
    ],
  }),
  component: HistoryPage,
});

const ICONS = {
  task: ClipboardCheck,
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
} as const;

function HistoryPage() {
  const me = useMe();
  const fn = useServerFn(getEarningHistory);
  const q = useQuery({ queryKey: ["history"], queryFn: () => fn() });

  const coins = me.data?.profile?.coins ?? 0;
  const items = q.data?.items ?? [];

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar coins={coins} name={me.data?.profile?.name ?? ""} />

      <main className="mx-auto max-w-md px-4 pt-4">
        <h1 className="text-xl font-extrabold text-foreground">Earning History</h1>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gradient-brand p-4 shadow-pop">
            <p className="text-xs font-bold uppercase text-primary-foreground/75">Total earned</p>
            <p className="mt-1 flex items-center gap-1 text-2xl font-extrabold text-primary-foreground">
              <CoinIcon className="h-6 w-6" />
              {q.data?.totalEarned ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <p className="text-xs font-bold uppercase text-muted-foreground">Total withdrawn</p>
            <p className="mt-1 text-2xl font-extrabold text-success">
              {q.data?.totalWithdrawn ?? 0} coins
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              ₹{toRupees(q.data?.totalWithdrawn ?? 0)} value
            </p>
          </div>

        </div>

        {q.isLoading && <p className="mt-8 text-center text-muted-foreground">Loading…</p>}
        {!q.isLoading && items.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">
            No earning history yet. Complete a task to get started.
          </p>
        )}

        <div className="mt-4 space-y-2">
          {items.map((it) => {
            const Icon = ICONS[it.kind];
            const tone =
              it.status === "approved"
                ? "bg-success/15 text-success"
                : it.status === "rejected"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-accent text-accent-foreground";
            return (
              <article key={`${it.kind}-${it.id}`} className="rounded-xl bg-card p-3 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{it.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(it.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-extrabold ${
                        it.coins > 0
                          ? "text-success"
                          : it.coins < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {it.coins > 0 ? `+${it.coins}` : it.coins}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${tone}`}>
                      {it.status}
                    </span>
                  </div>
                </div>
                {it.note && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted p-2 text-xs font-semibold text-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    Admin note: {it.note}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
