import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Ban, Rocket } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { useRefreshAll } from "@/lib/use-earn";
import { listMyCreatedTasks, cancelMyTask } from "@/lib/earn.functions";

export const Route = createFileRoute("/_authenticated/creator-studio")({
  head: () => ({
    meta: [
      { title: "Creator Studio — Manage Your EarnVerse Tasks" },
      {
        name: "description",
        content:
          "Track performance of the tasks you published on EarnVerse and cancel them to get unused coins refunded.",
      },
      { property: "og:title", content: "Creator Studio — EarnVerse" },
      {
        property: "og:description",
        content: "Manage and cancel your own published tasks, refund unused coins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatorStudioPage,
});

function CreatorStudioPage() {
  const listFn = useServerFn(listMyCreatedTasks);
  const cancelFn = useServerFn(cancelMyTask);
  const refresh = useRefreshAll();
  const q = useQuery({ queryKey: ["creator-tasks"], queryFn: () => listFn() });
  const [busy, setBusy] = useState<string | null>(null);

  const items = q.data?.items ?? [];

  async function onCancel(taskId: string, refundable: number) {
    if (
      !window.confirm(
        `Cancel this task? ${refundable} unused coins will be refunded (platform fee is not refunded).`,
      )
    )
      return;
    setBusy(taskId);
    try {
      const r = await cancelFn({ data: { taskId } });
      toast.success(`Task cancelled • ${r.refund} coins refunded`);
      await q.refetch();
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel task");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="bg-gradient-purple px-4 py-5">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link to="/tasks" className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-extrabold text-primary-foreground">
              <Rocket className="h-5 w-5" /> Creator Studio
            </h1>
            <p className="text-xs text-primary-foreground/80">
              Manage only the tasks you published
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4">
        {q.isLoading && <p className="mt-8 text-center text-muted-foreground">Loading…</p>}
        {!q.isLoading && !items.length && (
          <p className="mt-10 text-center text-muted-foreground">
            You have not published any task yet. Use “Promote Your Platform” on the Tasks page.
          </p>
        )}

        <div className="space-y-3">
          {items.map((t: any) => {
            const done = t.claimed_count >= t.total_slots;
            return (
              <div key={t.id} className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-foreground">{t.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {t.category} task • {t.claimed_count}/{t.total_slots} slots used
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                      !t.approved && !t.disabled
                        ? "bg-gold/25 text-gold-foreground"
                        : t.active
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {!t.approved && !t.disabled
                      ? "Under review"
                      : t.active
                        ? "Live"
                        : done
                          ? "Completed"
                          : "Cancelled"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Mini label="Pending" value={t.stats.pending} />
                  <Mini label="Approved" value={t.stats.approved} />
                  <Mini label="Rejected" value={t.stats.rejected} />
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                  <span className="flex items-center gap-1 text-sm font-bold text-primary">
                    <CoinIcon className="h-5 w-5" />
                    {t.reward_coins} / slot
                  </span>
                  <span className="ml-auto text-xs font-semibold text-muted-foreground">
                    Refundable: {t.refundable} coins
                  </span>
                </div>

                {(t.active || (!t.approved && !t.disabled)) && (
                  <button
                    disabled={busy === t.id}
                    onClick={() => onCancel(t.id, t.refundable)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground disabled:opacity-60"
                  >
                    <Ban className="h-4 w-4" />
                    {busy === t.id ? "Cancelling…" : "Cancel Task & Refund Unused Coins"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          On cancel, only coins for unused slots are refunded. Coins for claimed or completed
          slots and the platform fee are not refunded.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted py-2">
      <p className="text-sm font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
