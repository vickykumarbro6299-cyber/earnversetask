import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, Upload, Hourglass, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { listMyTasks, submitProof } from "@/lib/earn.functions";
import { CLAIM_MINUTES } from "@/lib/earn-constants";

export const Route = createFileRoute("/_authenticated/my-tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — EarnVerse" },
      {
        name: "description",
        content:
          "See your claimed EarnVerse tasks, the 10 minute completion timer, full instructions and submit your proof screenshot.",
      },
      { property: "og:title", content: "My Tasks — EarnVerse" },
      {
        property: "og:description",
        content: "Track claimed tasks, timers and proof approval status.",
      },
    ],
  }),
  component: MyTasksPage,
});

function useTick() {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
}

function MyTasksPage() {
  const me = useMe();
  const refresh = useRefreshAll();
  const fn = useServerFn(listMyTasks);
  const q = useQuery({ queryKey: ["my-tasks"], queryFn: () => fn(), refetchInterval: 30_000 });
  useTick();

  const coins = me.data?.profile?.coins ?? 0;
  const items = q.data?.items ?? [];

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar coins={coins} name={me.data?.profile?.name ?? ""} />

      <main className="mx-auto max-w-md px-4 pt-4">
        <h2 className="text-xl font-extrabold text-foreground">My Tasks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Claimed tasks are reserved for you. Finish and submit proof within {CLAIM_MINUTES}{" "}
          minutes.
        </p>

        {q.isLoading && <p className="mt-8 text-center text-muted-foreground">Loading…</p>}
        {!q.isLoading && items.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">
            You haven&apos;t claimed any task yet.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {items.map((s) => (
            <MyTaskCard key={s.id} sub={s} onDone={refresh} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

type Sub = {
  id: string;
  status: string;
  reward_coins: number;
  submitted_at: string | null;
  expires_at: string | null;
  note: string | null;
  tasks: {
    title: string;
    description: string;
    link: string | null;
    category: string;
  } | null;
};

function MyTaskCard({ sub, onDone }: { sub: Sub; onDone: () => void }) {
  const task = sub.tasks;
  const msLeft = sub.expires_at ? new Date(sub.expires_at).getTime() - Date.now() : 0;
  const waiting = !sub.submitted_at && sub.status === "pending";
  const expired = waiting && msLeft <= 0;
  const mm = Math.max(0, Math.floor(msLeft / 60000));
  const ss = Math.max(0, Math.floor((msLeft % 60000) / 1000));

  return (
    <article className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-foreground">{task?.title ?? "Task"}</h3>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-sm font-bold text-secondary-foreground">
          <CoinIcon className="h-5 w-5" />
          {sub.reward_coins}
        </span>
      </div>

      {waiting && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold ${
            expired
              ? "bg-destructive/15 text-destructive"
              : "bg-gradient-brand text-primary-foreground"
          }`}
        >
          <Hourglass className="h-4 w-4" />
          {expired
            ? "Time over — this task will be released"
            : `Time left ${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`}
        </div>
      )}

      {task?.description && (
        <div className="mt-3 rounded-xl bg-muted p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            How to complete
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{task.description}</p>
          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-block break-all text-sm font-semibold text-primary underline"
            >
              Open task link
            </a>
          )}
        </div>
      )}

      {waiting && task?.link && (
        <a
          href={task.link}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-sm font-extrabold text-success-foreground active:scale-95"
        >
          <PlayCircle className="h-4 w-4" /> Start Task
        </a>
      )}

      <div className="mt-3">

        {sub.status === "approved" ? (
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-3 py-1.5 text-sm font-bold text-success">
            <CheckCircle2 className="h-4 w-4" /> Approved • coins credited
          </span>
        ) : sub.status === "rejected" ? (
          <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-3 py-1.5 text-sm font-bold text-destructive">
            <XCircle className="h-4 w-4" /> Rejected
          </span>
        ) : sub.submitted_at ? (
          <span className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground">
            <Clock className="h-4 w-4" /> In verification
          </span>
        ) : (
          <ProofForm submissionId={sub.id} disabled={expired} onDone={onDone} />
        )}
      </div>
    </article>
  );
}

function ProofForm({
  submissionId,
  disabled,
  onDone,
}: {
  submissionId: string;
  disabled: boolean;
  onDone: () => void;
}) {
  const submitFn = useServerFn(submitProof);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) {
      toast.error("Select a proof screenshot");
      return;
    }
    setBusy(true);
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
    <div className="space-y-2 rounded-xl bg-muted p-3">
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
        disabled={busy || disabled}
        className="w-full rounded-lg bg-gradient-brand py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {disabled ? "Expired" : busy ? "Submitting…" : "Submit Proof"}
      </button>
    </div>
  );
}
