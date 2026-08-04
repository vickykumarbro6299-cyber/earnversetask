import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Users, Megaphone, Video, Mail, Smartphone, Sparkles } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { listTasks, claimTask, createUserTask } from "@/lib/earn.functions";
import {
  MIN_TASK_REWARD,
  TASK_PLATFORM_FEE,
  TASK_CATEGORIES,
  CLAIM_MINUTES,
} from "@/lib/earn-constants";

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

const CAT_ICON: Record<string, typeof Video> = {
  video: Video,
  gmail: Mail,
  app: Smartphone,
  other: Sparkles,
};

const FILTERS = [{ key: "all", label: "All" }, ...TASK_CATEGORIES];

function TasksPage() {
  const me = useMe();
  const refresh = useRefreshAll();
  const listFn = useServerFn(listTasks);
  const claimFn = useServerFn(claimTask);
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listFn() });
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const coins = me.data?.profile?.coins ?? 0;
  const allTasks = tasksQ.data?.tasks ?? [];
  const subs = tasksQ.data?.mySubmissions ?? [];
  const claimedIds = new Set(subs.map((s) => s.task_id));
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
            Today&apos;s pulse
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
            const mine = claimedIds.has(t.id);
            const Icon = CAT_ICON[t.category] ?? Sparkles;
            const catLabel =
              TASK_CATEGORIES.find((c) => c.key === t.category)?.label ?? "Task";
            return (
              <article key={t.id} className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="h-5 w-5" />
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
          <p className="mt-1 text-sm text-primary-foreground/85">
            Post your own task and get real users to complete it. Minimum {MIN_TASK_REWARD} coins
            reward, 2% platform fee.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-card py-3 font-extrabold text-primary active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Your Task
          </button>
        </section>
      </main>

      {showAdd && <AddTaskSheet coins={coins} onClose={() => setShowAdd(false)} onDone={refresh} />}
      <BottomNav />
    </div>
  );
}

function AddTaskSheet({
  coins,
  onClose,
  onDone,
}: {
  coins: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const createFn = useServerFn(createUserTask);
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    rewardCoins: CATEGORY_MIN_REWARD["other"] ?? MIN_TASK_REWARD,
    totalSlots: 1,
    category: "other" as string,
  });
  const [busy, setBusy] = useState(false);
  const minReward = CATEGORY_MIN_REWARD[form.category] ?? MIN_TASK_REWARD;
  const base = form.rewardCoins * form.totalSlots;
  const feePct = Math.round(TASK_PLATFORM_FEE * 100);
  const total = Math.ceil(base * (1 + TASK_PLATFORM_FEE));

  function pickCategory(key: string) {
    const min = CATEGORY_MIN_REWARD[key] ?? MIN_TASK_REWARD;
    setForm((f) => ({
      ...f,
      category: key,
      rewardCoins: f.rewardCoins < min ? min : f.rewardCoins,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.rewardCoins < minReward)
        throw new Error(`Minimum reward for this category is ${minReward} coins`);
      if (total > coins) throw new Error("Not enough coins in wallet");
      await createFn({ data: form });
      toast.success(`Task published • ${total} coins deducted`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create task");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 ring-ring/40";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/50" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold">Promote Your Platform</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Minimum reward: Video {CATEGORY_MIN_REWARD["video"]} • Gmail {CATEGORY_MIN_REWARD["gmail"]}{" "}
          • App {CATEGORY_MIN_REWARD["app"]} coins. {feePct}% platform fee applies.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {TASK_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setForm({ ...form, category: c.key })}
                className={`rounded-xl px-2 py-2 text-xs font-bold ${
                  form.category === c.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.label.replace(" Task", "")}
              </button>
            ))}
          </div>
          <input
            className={input}
            placeholder="Task title"
            required
            maxLength={100}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className={input}
            placeholder="Full instructions — how should the user complete this task?"
            rows={4}
            maxLength={600}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className={input}
            placeholder="Task link (optional)"
            maxLength={300}
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-muted-foreground">
              Reward coins
              <input
                type="number"
                min={MIN_TASK_REWARD}
                className={input}
                value={form.rewardCoins}
                onChange={(e) => setForm({ ...form, rewardCoins: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs font-semibold text-muted-foreground">
              Task limit (slots)
              <input
                type="number"
                min={1}
                className={input}
                value={form.totalSlots}
                onChange={(e) => setForm({ ...form, totalSlots: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
            Total cost: {base} + 2% fee = <span className="text-primary">{total} coins</span>
            <div className="text-xs font-medium text-muted-foreground">
              Your balance: {coins} coins
            </div>
          </div>
          <button
            disabled={busy}
            className="w-full rounded-xl bg-gradient-purple py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Publishing…" : "Publish Task"}
          </button>
        </form>
      </div>
    </div>
  );
}
