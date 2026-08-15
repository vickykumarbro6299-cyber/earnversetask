import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Ban, Save } from "lucide-react";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { SamplePhoto, SamplePhotoInput } from "@/components/sample-photo";
import { adminTaskDetail, adminCancelTask, adminUpdateTask } from "@/lib/earn.functions";
import { TASK_CATEGORIES } from "@/lib/earn-constants";

export const Route = createFileRoute("/_authenticated/admin_/task/$taskId")({
  head: () => ({
    meta: [
      { title: "Task Details — EarnVerse Admin" },
      {
        name: "description",
        content:
          "Full EarnVerse task details for admins: instructions, sample screenshots, creator info and refund controls.",
      },
      { property: "og:title", content: "Task Details — EarnVerse Admin" },
      {
        property: "og:description",
        content: "Review a task, see who created it and cancel with refund.",
      },
    ],
  }),
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const me = useMe();
  const navigate = useNavigate();
  const refresh = useRefreshAll();
  const detailFn = useServerFn(adminTaskDetail);
  const cancelFn = useServerFn(adminCancelTask);
  const updateFn = useServerFn(adminUpdateTask);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<{
    title: string;
    description: string;
    link: string;
    rewardCoins: number;
    totalSlots: number;
    sampleImageUrl: string;
    allowMultiple: boolean;
  } | null>(null);

  const isAdmin = me.data?.isAdmin ?? false;
  const q = useQuery({
    queryKey: ["admin-task", taskId],
    queryFn: () => detailFn({ data: { taskId } }),
    enabled: isAdmin,
  });

  const loaded = q.data?.task as any;
  useEffect(() => {
    if (!loaded) return;
    setEdit({
      title: loaded.title ?? "",
      description: loaded.description ?? "",
      link: loaded.link ?? "",
      rewardCoins: loaded.reward_coins ?? 0,
      totalSlots: loaded.total_slots ?? 1,
      sampleImageUrl: loaded.sample_image_url ?? "",
      allowMultiple: !!loaded.allow_multiple,
    });
  }, [loaded]);

  if (me.isLoading) return <Center>Loading…</Center>;
  if (!isAdmin)
    return (
      <Center>
        <p className="font-bold">Access denied</p>
        <Link to="/tasks" className="mt-3 text-primary underline">
          Back to tasks
        </Link>
      </Center>
    );

  const t = q.data?.task as any;
  const creator = q.data?.creator as any;
  const stats = q.data?.stats;
  const categoryLabel =
    TASK_CATEGORIES.find((c) => c.key === t?.category)?.label ?? t?.category ?? "Other";

  async function cancel() {
    if (!confirm("Cancel this task and refund unused coins to the creator?")) return;
    setBusy(true);
    try {
      await cancelFn({ data: { taskId } });
      toast.success("Task cancelled & unused coins refunded");
      refresh();
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    try {
      await updateFn({ data: { taskId, ...edit } });
      toast.success("Task updated");
      refresh();
      q.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="bg-gradient-brand px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/admin" className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-primary-foreground">Task Details</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        {q.isLoading && <p className="text-center text-muted-foreground">Loading task…</p>}
        {q.isError && <p className="text-center text-destructive">Could not load this task.</p>}

        {t && (
          <>
            <section className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-extrabold">{t.title}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    t.active
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {t.active ? "Active" : "Closed"}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-primary">{categoryLabel}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Info label="Reward" value={`${t.reward_coins} coins`} />
                <Info label="Slots" value={`${t.claimed_count}/${t.total_slots} claimed`} />
                <Info label="Type" value={t.is_admin_task ? "Official task" : "User task"} />
                <Info label="Multiple times" value={t.allow_multiple ? "Allowed" : "No"} />
                <Info label="Created" value={new Date(t.created_at).toLocaleString()} />
                <Info label="Task ID" value={t.id.slice(0, 8)} />
              </div>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-card">
              <h3 className="font-extrabold">Instructions</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {t.description || "—"}
              </p>
              {t.link && (
                <a
                  href={t.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-sm font-bold text-primary underline"
                >
                  {t.link}
                </a>
              )}
              <SamplePhoto path={t.sample_image_url} />
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-card">
              <h3 className="font-extrabold">Added by</h3>
              {creator ? (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-bold">{creator.name || "User"}</p>
                  <p className="break-all text-muted-foreground">{creator.email}</p>
                  <p className="text-muted-foreground">
                    {creator.mobile || "—"} • {creator.coins} coins balance
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Official task added from the admin console.
                </p>
              )}
            </section>

            {stats && (
              <section className="rounded-2xl bg-card p-4 shadow-card">
                <h3 className="font-extrabold">Submissions</h3>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs font-bold">
                  <Stat label="Total" value={stats.total} />
                  <Stat label="Pending" value={stats.pending} />
                  <Stat label="Approved" value={stats.approved} />
                  <Stat label="Rejected" value={stats.rejected} />
                </div>
              </section>
            )}

            <button
              onClick={cancel}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive py-3 font-bold text-destructive-foreground disabled:opacity-60"
            >
              <Ban className="h-4 w-4" />
              {busy ? "Cancelling…" : "Cancel Task & Refund"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-2.5">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted p-2.5">
      <p className="text-base font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center text-muted-foreground">
      {children}
    </div>
  );
}
