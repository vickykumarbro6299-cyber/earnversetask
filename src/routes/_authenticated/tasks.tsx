import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Clock, CheckCircle2, XCircle, Upload, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { listTasks, claimTask, submitProof, createUserTask } from "@/lib/earn.functions";
import { MIN_TASK_REWARD, TASK_PLATFORM_FEE } from "@/lib/earn-constants";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Earn Coins on EarnVerse" },
      {
        name: "description",
        content:
          "Claim limited tasks, submit your proof screenshot and get coins credited after admin approval.",
      },
      { property: "og:title", content: "Tasks — Earn Coins on EarnVerse" },
      { property: "og:description", content: "Claim tasks, submit proof, earn coins." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const me = useMe();
  const refresh = useRefreshAll();
  const listFn = useServerFn(listTasks);
  const claimFn = useServerFn(claimTask);
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listFn() });
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const coins = me.data?.profile?.coins ?? 0;
  const tasks = tasksQ.data?.tasks ?? [];
  const subs = tasksQ.data?.mySubmissions ?? [];
  const subFor = (taskId: string) => subs.find((s) => s.task_id === taskId);

  async function onClaim(taskId: string) {
    setBusy(taskId);
    try {
      await claimFn({ data: { taskId } });
      toast.success("Task claimed! Complete it and upload proof.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not claim task");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar coins={coins} name={me.data?.profile?.name ?? ""} />

      <main className="mx-auto max-w-md px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-foreground">Available Tasks</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 rounded-full bg-gradient-purple px-3 py-2 text-sm font-bold text-primary-foreground shadow-card active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>

        {tasksQ.isLoading && (
          <p className="mt-8 text-center text-muted-foreground">Loading tasks…</p>
        )}
        {!tasksQ.isLoading && tasks.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">
            No tasks available right now. Check back soon.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {tasks.map((t) => {
            const sub = subFor(t.id);
            const left = Math.max(0, t.total_slots - t.claimed_count);
            return (
              <article key={t.id} className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-foreground">{t.title}</h3>
                    {t.description && (
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                        {t.description}
                      </p>
                    )}
                    {t.link && (
                      <a
                        href={t.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 inline-block break-all text-sm font-semibold text-primary underline"
                      >
                        Open task link
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-sm font-bold text-secondary-foreground">
                      <CoinIcon className="h-5 w-5" />
                      {t.reward_coins}
                    </span>
                    {!sub ? (
                      <button
                        disabled={left === 0 || busy === t.id}
                        onClick={() => onClaim(t.id)}
                        className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-card active:scale-95 disabled:opacity-50"
                      >
                        {left === 0 ? "Full" : busy === t.id ? "…" : "Claim"}
                      </button>
                    ) : (
                      <StatusPill sub={sub} />
                    )}
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

                {sub && sub.status === "pending" && !sub.submitted_at && (
                  <ProofForm submissionId={sub.id} onDone={refresh} />
                )}
              </article>
            );
          })}
        </div>
      </main>

      {showAdd && <AddTaskSheet coins={coins} onClose={() => setShowAdd(false)} onDone={refresh} />}
      <BottomNav />
    </div>
  );
}

function StatusPill({ sub }: { sub: { status: string; submitted_at: string | null } }) {
  if (sub.status === "approved")
    return (
      <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
        <CheckCircle2 className="h-3.5 w-3.5" /> Approved
      </span>
    );
  if (sub.status === "rejected")
    return (
      <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-bold text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
      <Clock className="h-3.5 w-3.5" /> {sub.submitted_at ? "In verification" : "Claimed"}
    </span>
  );
}

function ProofForm({ submissionId, onDone }: { submissionId: string; onDone: () => void }) {
  const submitFn = useServerFn(submitProof);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) {
      toast.error("Select a proof screenshot");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Session expired");
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${uid}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("proofs").upload(path, file);
      if (error) throw error;
      await submitFn({ data: { submissionId, proofPath: path, note: note.slice(0, 300) } });
      toast.success("Proof submitted — waiting for admin verification");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-muted p-3">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground">
        <Upload className="h-4 w-4" />
        {file ? file.name.slice(0, 28) : "Choose proof screenshot"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        placeholder="Note (optional)"
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none"
      />
      <button
        onClick={upload}
        disabled={busy}
        className="w-full rounded-lg bg-gradient-brand py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit Proof"}
      </button>
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
    rewardCoins: MIN_TASK_REWARD,
    totalSlots: 1,
  });
  const [busy, setBusy] = useState(false);
  const base = form.rewardCoins * form.totalSlots;
  const total = Math.ceil(base * (1 + TASK_PLATFORM_FEE));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
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
        <h3 className="text-lg font-extrabold">Add Your Task</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Minimum {MIN_TASK_REWARD} coins reward. 2% platform fee applies.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
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
            placeholder="What should the user do?"
            rows={3}
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
