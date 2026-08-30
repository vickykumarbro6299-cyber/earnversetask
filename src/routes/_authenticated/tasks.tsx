import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Megaphone,
  Rocket,
  ChevronRight,
  Bell,
} from "lucide-react";
import { useNotificationPermission } from "@/lib/use-task-notifications";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { TelegramNotice } from "@/components/telegram-notice";

import { CoinIcon } from "@/components/brand";
import { useMe, useRefreshAll, useHasSession } from "@/lib/use-earn";
import { listTasks, claimTask } from "@/lib/earn.functions";
import {
  TASK_CATEGORIES,
  CLAIM_MINUTES,
  PROMOTE_TAGLINE,
  greeting,
} from "@/lib/earn-constants";
import {
  YouTubeLogo,
  GmailLogo,
  AppLogo,
  TelegramLogo,
  OtherLogo,
} from "@/components/social-logos";


export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Earn Coins on EarnVerse" },
      {
        name: "description",
        content:
          "Claim video, Gmail and app tasks, submit your proof screenshot and get coins credited after admin approval.",
      },
      { property: "og:title", content: "Tasks — Earn Coins on EarnVerse" },
      { property: "og:description", content: "Claim tasks, submit proof, earn coins." },
    ],
  }),
  component: TasksPage,
});

const CAT_LOGO: Record<string, React.FC<{ className?: string }>> = {
  video: YouTubeLogo,
  shorts: YouTubeLogo,
  gmail: GmailLogo,
  app: AppLogo,
  telegram: TelegramLogo,
  other: OtherLogo,
};

const FILTERS = [{ key: "all", label: "All" }, ...TASK_CATEGORIES];

function TasksPage() {
  const me = useMe();
  const refresh = useRefreshAll();
  const listFn = useServerFn(listTasks);
  const claimFn = useServerFn(claimTask);
  const hasSession = useHasSession();
  const tasksQ = useQuery({
    queryKey: ["tasks"],
    queryFn: () => listFn(),
    enabled: hasSession === true,
    retry: false,
  });
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const coins = me.data?.profile?.coins ?? 0;
  const allTasks = tasksQ.data?.tasks ?? [];
  const subs = tasksQ.data?.mySubmissions ?? [];
  // Rejected attempts are released — task becomes claimable again.
  const claimedIds = new Set(
    subs.filter((s) => s.status !== "rejected").map((s) => s.task_id),
  );
  const tasks = allTasks.filter((t) => filter === "all" || t.category === filter);

  async function onClaim(taskId: string) {
    setBusy(taskId);
    try {
      await claimFn({ data: { taskId } });
      toast.success(`Task reserved for you • finish it within ${CLAIM_MINUTES} minutes`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not claim task");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar coins={coins} name={me.data?.profile?.name ?? ""} />

      <main className="mx-auto max-w-md px-4 pt-4">
        <section className="rounded-2xl bg-gradient-purple p-4 shadow-pop">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/70">
            {greeting()}
            {me.data?.profile?.name ? `, ${me.data.profile.name.split(" ")[0]}` : ""}
          </p>
          <div className="mt-1 flex items-end justify-between">
            <div>
              <p className="text-2xl font-extrabold text-primary-foreground">
                {allTasks.length} tasks live
              </p>
              <p className="text-sm text-primary-foreground/80">
                Claim • Complete in {CLAIM_MINUTES} min • Get paid
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-gold/25 px-3 py-1.5 text-sm font-extrabold text-gold">
              <CoinIcon className="h-6 w-6" />
              {coins}
            </span>
          </div>
        </section>

        <NotifyBanner />

        <Link
          to="/creator-studio"
          className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
            <Rocket className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-extrabold text-foreground">Creator Studio</span>
            <span className="block text-xs text-muted-foreground">
              Manage or cancel the tasks you published
            </span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </Link>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === f.key
                  ? "bg-gradient-brand text-primary-foreground shadow-card"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {tasksQ.isLoading && (
          <p className="mt-8 text-center text-muted-foreground">Loading tasks…</p>
        )}
        {!tasksQ.isLoading && tasks.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">
            No tasks in this category right now. Check back soon.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {tasks.map((t) => {
            const left = Math.max(0, t.total_slots - t.claimed_count);
            const openSub = subs.some(
              (s) => s.task_id === t.id && (!s.submitted_at || s.status === "pending"),
            );
            const mine = t.allow_multiple ? openSub : claimedIds.has(t.id);
            const Logo = CAT_LOGO[t.category] ?? OtherLogo;

            const catLabel =
              TASK_CATEGORIES.find((c) => c.key === t.category)?.label ?? "Task";
            return (
              <article key={t.id} className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Logo className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-foreground">{t.title}</h3>
                      <p className="text-xs font-semibold text-muted-foreground">{catLabel}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-sm font-bold text-secondary-foreground">
                      <CoinIcon className="h-5 w-5" />
                      {t.reward_coins}
                    </span>
                    <button
                      disabled={left === 0 || mine || busy === t.id}
                      onClick={() => onClaim(t.id)}
                      className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-card active:scale-95 disabled:opacity-50"
                    >
                      {mine ? "Claimed" : left === 0 ? "Full" : busy === t.id ? "…" : "Claim"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-border pt-2 text-xs font-semibold text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Limit: {t.claimed_count}/{t.total_slots} claimed • {left} left
                  {t.allow_multiple && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                      Multiple
                    </span>
                  )}
                  {t.is_admin_task && (
                    <span className="ml-auto rounded-full bg-gold/25 px-2 py-0.5 text-gold-foreground">
                      Official
                    </span>
                  )}

                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-6 rounded-2xl bg-gradient-brand p-4 shadow-pop">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary-foreground" />
            <h3 className="text-lg font-extrabold text-primary-foreground">
              Promote Your Platform
            </h3>
          </div>
          <p className="mt-1 text-sm text-primary-foreground/85">{PROMOTE_TAGLINE}</p>

          <Link
            to="/add-task"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-card py-3 font-extrabold text-primary active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Your Task
          </Link>
        </section>
      </main>

      <TelegramNotice />
      <BottomNav />

    </div>
  );
}

function NotifyBanner() {
  const { perm, request } = useNotificationPermission();
  if (perm !== "default") return null;
  return (
    <button
      onClick={() => void request()}
      className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-primary/40 bg-card p-3 text-left shadow-card"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
        <Bell className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-foreground">
          Turn on task notifications
        </span>
        <span className="block text-xs text-muted-foreground">
          Get a pop-up on your phone the moment a new task is added.
        </span>
      </span>
    </button>
  );
}
