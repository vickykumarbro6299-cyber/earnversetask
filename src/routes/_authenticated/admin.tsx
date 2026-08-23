import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  X,
  Eye,
  KeyRound,
  Ticket,
  Power,
  Search,
  Coins,
  Trash2,
  Plus,
  History,
} from "lucide-react";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { SamplePhotoInput, splitPaths } from "@/components/sample-photo";
import {
  getAdminData,
  adminCreateTask,
  adminSetTaskActive,
  adminReviewTask,
  adminReviewSubmission,
  adminReviewDeposit,
  adminReviewWithdrawal,
  adminUpdateSettings,
  adminSetUserPassword,
  adminSetUserCoins,
  adminDeleteUser,
  adminCreatePromo,
  adminSetPromoActive,
  adminUserHistory,
  getProofUrl,
  adminCancelTask,
  adminUpdateTaskReward,
  adminDeviceReport,
  getAdminProofs,
} from "@/lib/earn.functions";

import {
  MIN_TASK_REWARD,
  TASK_CATEGORIES,
  CATEGORY_MIN_REWARD,
  NO_LINK_CATEGORIES,
  VIDEO_TASK_DESCRIPTION,
  SHORTS_TASK_DESCRIPTION,
  autoDescription,
} from "@/lib/earn-constants";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — EarnVerse Management" },
      {
        name: "description",
        content:
          "Manage EarnVerse users, tasks, proof verification, deposits and withdrawal approvals.",
      },
      { property: "og:title", content: "Admin Console — EarnVerse" },
      { property: "og:description", content: "Approve proofs, deposits and withdrawals." },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  "Overview",
  "Proofs",
  "Deposits",
  "Withdrawals",
  "Tasks",
  "Task History",
  "Reviews",
  "Users",
  "Devices",
  "Promo",
  "Settings",
] as const;
type Tab = (typeof TABS)[number];


function AdminPage() {
  const me = useMe();
  const refresh = useRefreshAll();
  const dataFn = useServerFn(getAdminData);
  const isAdmin = me.data?.isAdmin ?? false;
  const q = useQuery({
    queryKey: ["admin"],
    queryFn: () => dataFn(),
    enabled: isAdmin,
  });
  const [tab, setTab] = useState<Tab>("Overview");

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

  const d = q.data;

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="bg-gradient-brand px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link to="/profile" className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-primary-foreground">Admin Console</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {q.isLoading && <p className="mt-8 text-center text-muted-foreground">Loading data…</p>}

        {tab === "Proofs" && (
          <ProofsTab
            onReview={(id: string, approve: boolean, note?: string) =>
              review("submission", id, approve, note)
            }
          />
        )}

        {d && tab === "Deposits" && (
          <List
            empty="No deposit requests."
            items={d.deposits}
            render={(x: any) => (
              <Card
                key={x.id}
                title={`${x.coins} coins • ₹${x.amount_inr}`}
                sub={`${x.user?.name ?? "User"} • ${x.user?.email ?? ""}`}
                note={`UTR: ${x.utr ?? "—"}`}
                status={x.status}
                extra={x.proof_url ? <ProofButton path={x.proof_url} /> : null}
                onApprove={() => review("deposit", x.id, true)}
                onReject={() => review("deposit", x.id, false)}

              />
            )}
          />
        )}

        {d && tab === "Withdrawals" && (
          <List
            empty="No withdrawal requests."
            items={d.withdrawals}
            render={(x: any) => (
              <WithdrawalCard
                key={x.id}
                item={x}
                onReview={(approve, adminNote) =>
                  review("withdrawal", x.id, approve, adminNote)
                }
              />
            )}
          />
        )}

        {d && tab === "Tasks" && <TasksTab tasks={d.tasks} onDone={refresh} />}

        {d && tab === "Task History" && <TaskHistoryTab tasks={d.tasks} />}

        {d && tab === "Reviews" && <ReviewsTab tasks={d.tasks} onDone={refresh} />}

        {d && tab === "Users" && <UsersTab users={d.users} onDone={refresh} />}

        {tab === "Devices" && <DevicesTab />}



        {d && tab === "Overview" && <OverviewTab o={d.overview} />}

        {d && tab === "Promo" && <PromoTab promos={d.promoCodes} onDone={refresh} />}

        {d && tab === "Settings" && <SettingsTab settings={d.settings} onDone={refresh} />}
      </div>
    </div>
  );

  async function review(
    kind: "submission" | "deposit" | "withdrawal",
    id: string,
    approve: boolean,
    adminNote?: string,
  ) {
    try {
      if (kind === "withdrawal") {
        await adminReviewWithdrawal({ data: { id, approve, note: adminNote ?? "" } });
        toast.success(approve ? "Approved" : "Rejected");
        refresh();
        return;
      }
      if (kind === "submission") {
        await adminReviewSubmission({ data: { id, approve, note: adminNote ?? "" } });
      } else {
        await adminReviewDeposit({ data: { id, approve } });
      }
      toast.success(approve ? "Approved" : "Rejected");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }
}

function WithdrawalCard({
  item,
  onReview,
}: {
  item: any;
  onReview: (approve: boolean, note: string) => void;
}) {
  const [note, setNote] = useState("");
  const pending = item.status === "pending";
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">
            {item.coins} coins • ₹{item.amount_inr} • {item.method}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {item.user?.name ?? "User"} • {item.user?.email ?? ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Payout: {item.payout_detail}</p>
          {item.admin_note && (
            <p className="mt-1 text-sm font-semibold text-foreground">Note: {item.admin_note}</p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${
            item.status === "approved"
              ? "bg-success/15 text-success"
              : item.status === "rejected"
                ? "bg-destructive/15 text-destructive"
                : "bg-accent text-accent-foreground"
          }`}
        >
          {item.status}
        </span>
      </div>

      {pending && (
        <div className="mt-3 space-y-2">
          <textarea
            className={inputClass}
            rows={2}
            maxLength={300}
            placeholder="Note for user (shown in their withdrawal history)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => onReview(true, note)}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-success py-2.5 text-sm font-bold text-success-foreground active:scale-95"
            >
              <Check className="h-4 w-4" /> Approve
            </button>
            <button
              onClick={() => onReview(false, note)}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground active:scale-95"
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      )}
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

function List<T>({
  items,
  render,
  empty,
}: {
  items: T[];
  render: (item: T) => React.ReactNode;
  empty: string;
}) {
  if (!items.length) return <p className="mt-8 text-center text-muted-foreground">{empty}</p>;
  return <div className="mt-4 space-y-3">{items.map(render)}</div>;
}

function Card({
  title,
  sub,
  note,
  adminNote,
  status,
  extra,
  rejectNote,
  onApprove,
  onReject,
}: {
  title: string;
  sub: string;
  note?: string | null;
  adminNote?: string | null;
  status: string;
  extra?: React.ReactNode;
  rejectNote?: boolean;
  onApprove: () => void;
  onReject: (note: string) => void;
}) {
  const pending = status === "pending";
  const [noteText, setNoteText] = useState("");
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{title}</p>
          <p className="truncate text-sm text-muted-foreground">{sub}</p>
          {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
          {adminNote && (
            <p className="mt-1 text-sm font-semibold text-foreground">Note: {adminNote}</p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${
            status === "approved"
              ? "bg-success/15 text-success"
              : status === "rejected"
                ? "bg-destructive/15 text-destructive"
                : "bg-accent text-accent-foreground"
          }`}
        >
          {status}
        </span>
      </div>
      {pending && rejectNote && (
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="Reason for rejection (shown to the user)"
          className="mt-3 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 ring-ring/40"
        />
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {extra}
        {pending && (
          <>
            <button
              onClick={onApprove}
              className="flex items-center gap-1 rounded-lg bg-success px-3 py-2 text-sm font-bold text-success-foreground"
            >
              <Check className="h-4 w-4" /> Approve
            </button>
            <button
              onClick={() => onReject(noteText)}
              className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground"
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProofButton({ path }: { path: string | null }) {
  const fn = useServerFn(getProofUrl);
  const paths = splitPaths(path);
  if (!paths.length) return null;
  return (
    <>
      {paths.map((p, i) => (
        <button
          key={p}
          onClick={async () => {
            try {
              const res = await fn({ data: { path: p } });
              if (res?.url) window.open(res.url, "_blank", "noopener");
            } catch {
              toast.error("Could not open proof");
            }
          }}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm font-bold text-foreground"
        >
          <Eye className="h-4 w-4" /> View proof {paths.length > 1 ? i + 1 : ""}
        </button>
      ))}
    </>
  );
}

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 ring-ring/40";

type TaskDraft = {
  key: string;
  title: string;
  description: string;
  link: string;
  rewardCoins: number;
  totalSlots: number;
  category: string;
  sampleImageUrl: string;
  allowMultiple: boolean;
};

const newDraft = (): TaskDraft => ({
  key: crypto.randomUUID(),
  title: "",
  description: "",
  link: "",
  rewardCoins: MIN_TASK_REWARD,
  totalSlots: 10,
  category: "other",
  sampleImageUrl: "",
  allowMultiple: false,
});

function TasksTab({ tasks, onDone }: { tasks: any[]; onDone: () => void }) {
  const createFn = useServerFn(adminCreateTask);
  const toggleFn = useServerFn(adminSetTaskActive);
  const cancelFn = useServerFn(adminCancelTask);
  const rewardFn = useServerFn(adminUpdateTaskReward);
  const [drafts, setDrafts] = useState<TaskDraft[]>([newDraft()]);
  const [busy, setBusy] = useState(false);

  function patch(key: string, p: Partial<TaskDraft>) {
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...p } : d)));
  }

  async function publishAll(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    let added = 0;
    try {
      for (const [i, d] of drafts.entries()) {
        if (!d.title.trim()) throw new Error(`Task ${i + 1}: title is required`);
        if (!d.sampleImageUrl) throw new Error(`Task ${i + 1}: upload a sample photo`);
      }
      for (const d of drafts) {
        await createFn({
          data: {
            title: d.title,
            description: d.description,
            link: d.link,
            rewardCoins: d.rewardCoins,
            totalSlots: d.totalSlots,
            category: d.category,
            sampleImageUrl: d.sampleImageUrl,
            allowMultiple: d.allowMultiple,
          },
        });
        added += 1;
      }
      toast.success(`${added} task${added > 1 ? "s" : ""} added`);
      setDrafts([newDraft()]);
      onDone();
    } catch (err) {
      if (added) {
        toast.error(
          `${added} task(s) added, then failed: ${err instanceof Error ? err.message : "Error"}`,
        );
        setDrafts((ds) => ds.slice(added));
        onDone();
      } else {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={publishAll} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold">Add Official Tasks</h3>
          <span className="text-xs font-semibold text-muted-foreground">
            {drafts.length} in this batch
          </span>
        </div>

        {drafts.map((form, idx) => (
          <div key={form.key} className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-primary">Task {idx + 1}</p>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDrafts((ds) => ds.filter((d) => d.key !== form.key))}
                  className="flex items-center gap-1 rounded-lg bg-destructive/15 px-2.5 py-1.5 text-xs font-bold text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {TASK_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() =>
                    patch(form.key, {
                      category: c.key,
                      rewardCoins:
                        form.rewardCoins < (CATEGORY_MIN_REWARD[c.key] ?? MIN_TASK_REWARD)
                          ? (CATEGORY_MIN_REWARD[c.key] ?? MIN_TASK_REWARD)
                          : form.rewardCoins,
                      link: NO_LINK_CATEGORIES.includes(c.key) ? "" : form.link,
                      description:
                        autoDescription(c.key) ??
                        (form.description === VIDEO_TASK_DESCRIPTION ||
                        form.description === SHORTS_TASK_DESCRIPTION
                          ? ""
                          : form.description),
                    })
                  }
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
              className={inputClass}
              required
              maxLength={100}
              placeholder="Task title"
              value={form.title}
              onChange={(e) => patch(form.key, { title: e.target.value })}
            />
            <textarea
              className={inputClass}
              rows={3}
              maxLength={600}
              placeholder="Instructions"
              value={form.description}
              onChange={(e) => patch(form.key, { description: e.target.value })}
            />
            {!NO_LINK_CATEGORIES.includes(form.category) && (
              <input
                className={inputClass}
                maxLength={300}
                placeholder="Task link"
                value={form.link}
                onChange={(e) => patch(form.key, { link: e.target.value })}
              />
            )}
            <SamplePhotoInput
              value={form.sampleImageUrl}
              onChange={(p) => patch(form.key, { sampleImageUrl: p })}
            />
            <button
              type="button"
              onClick={() => patch(form.key, { allowMultiple: !form.allowMultiple })}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-bold ${
                form.allowMultiple
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Allow Multiple Times
              <span className="text-xs font-semibold">{form.allowMultiple ? "ON" : "OFF"}</span>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Reward coins
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={form.rewardCoins}
                  onChange={(e) => patch(form.key, { rewardCoins: Number(e.target.value) })}
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Task limit (slots)
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={form.totalSlots}
                  onChange={(e) => patch(form.key, { totalSlots: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setDrafts((ds) => [...ds, newDraft()])}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 bg-card py-3 text-sm font-extrabold text-primary"
        >
          <Plus className="h-4 w-4" /> Add another task
        </button>

        <button
          disabled={busy}
          className="w-full rounded-xl bg-gradient-brand py-3 font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Adding…" : `Publish ${drafts.length} Task${drafts.length > 1 ? "s" : ""}`}
        </button>
      </form>

      <h3 className="font-extrabold">Task List</h3>
      {tasks.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-card p-3 shadow-card">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{t.title}</p>
            <p className="text-xs text-muted-foreground">
              {t.reward_coins} coins • {t.claimed_count}/{t.total_slots} claimed •{" "}
              {t.is_admin_task ? "Official" : "User task"}
              {!t.approved && !t.disabled ? " • Under review" : ""}
            </p>
          </div>
          <Link
            to="/admin/task/$taskId"
            params={{ taskId: t.id }}
            className="rounded-lg bg-gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            View Details
          </Link>
          <button
            onClick={async () => {
              await toggleFn({ data: { taskId: t.id, active: !t.active } });
              onDone();
            }}
            className={`rounded-lg px-3 py-2 text-xs font-bold ${
              t.active ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
            }`}
          >
            {t.active ? "Disable" : "Enable"}
          </button>
          <button
            onClick={async () => {
              const input = prompt("New reward coins for this task:", String(t.reward_coins));
              if (input === null) return;
              try {
                await rewardFn({ data: { taskId: t.id, rewardCoins: Number(input) } });
                toast.success("Reward coins updated");
                onDone();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
            className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
          >
            Edit coins
          </button>
          <button
            onClick={async () => {
              if (!confirm("Cancel this task and refund unused coins to the creator?")) return;
              try {
                await cancelFn({ data: { taskId: t.id } });
                toast.success("Task cancelled & unused coins refunded");
                onDone();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
            className="rounded-lg bg-muted px-3 py-2 text-xs font-bold text-foreground"
          >
            Cancel & Refund
          </button>
        </div>
      ))}
    </div>
  );
}

function ReviewsTab({ tasks, onDone }: { tasks: any[]; onDone: () => void }) {
  const reviewFn = useServerFn(adminReviewTask);
  const [busy, setBusy] = useState<string | null>(null);
  const pending = tasks.filter((t) => !t.approved && !t.disabled);

  async function act(taskId: string, approve: boolean) {
    if (!approve && !confirm("Reject this task and refund all coins to the creator?")) return;
    setBusy(taskId);
    try {
      const r = await reviewFn({ data: { taskId, approve } });
      toast.success(approve ? "Task approved & live" : `Task rejected • ${r.refund} coins refunded`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {!pending.length && (
        <p className="mt-8 text-center text-muted-foreground">No tasks waiting for review.</p>
      )}
      {pending.map((t) => (
        <div key={t.id} className="rounded-2xl bg-card p-4 shadow-card">
          <p className="font-extrabold">{t.title}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {t.category} • {t.reward_coins} coins × {t.total_slots} slots
          </p>
          {t.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{t.description}</p>
          )}
          {t.link && (
            <a
              href={t.link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all text-xs font-semibold text-primary underline"
            >
              {t.link}
            </a>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/admin/task/$taskId"
              params={{ taskId: t.id }}
              className="rounded-lg bg-muted px-3 py-2 text-xs font-bold text-foreground"
            >
              View Details
            </Link>
            <button
              disabled={busy === t.id}
              onClick={() => act(t.id, true)}
              className="rounded-lg bg-success/15 px-3 py-2 text-xs font-bold text-success disabled:opacity-60"
            >
              Approve & Publish
            </button>
            <button
              disabled={busy === t.id}
              onClick={() => act(t.id, false)}
              className="rounded-lg bg-destructive/15 px-3 py-2 text-xs font-bold text-destructive disabled:opacity-60"
            >
              Reject & Refund
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DevicesTab() {
  const fn = useServerFn(adminDeviceReport);
  const q = useQuery({ queryKey: ["admin-devices"], queryFn: () => fn() });
  const groups = q.data?.groups ?? [];

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="font-extrabold">Multiple accounts in same device</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {q.isLoading
            ? "Loading…"
            : `${groups.length} flagged device(s) out of ${q.data?.totalDevices ?? 0} tracked.`}
        </p>
      </div>

      {!q.isLoading && groups.length === 0 && (
        <p className="mt-6 text-center text-muted-foreground">No multi-account devices found.</p>
      )}

      {groups.map((g: any) => (
        <div key={g.deviceId} className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-sm font-extrabold text-destructive">
            ⚠️ {g.accounts.length} accounts on one device
          </p>
          <p className="mt-1 break-all text-[11px] text-muted-foreground">{g.deviceId}</p>
          <div className="mt-3 space-y-2">
            {g.accounts.map((a: any) => (
              <div key={a.userId} className="rounded-xl bg-muted p-2.5">
                <p className="text-sm font-bold">{a.profile?.name ?? "Unknown user"}</p>
                <p className="break-all text-xs text-muted-foreground">
                  {a.profile?.email ?? a.userId} • {a.profile?.mobile ?? "—"} •{" "}
                  {a.profile?.coins ?? 0} coins
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Joined {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab({
  settings,
  onDone,
}: {
  settings: Record<string, string>;
  onDone: () => void;
}) {
  const fn = useServerFn(adminUpdateSettings);
  const [upi, setUpi] = useState(settings["deposit_upi"] ?? "");
  const [name, setName] = useState(settings["deposit_name"] ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await fn({ data: { upi: upi.trim(), name: name.trim() } });
          toast.success("Deposit details updated");
          onDone();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        } finally {
          setBusy(false);
        }
      }}
      className="mt-4 space-y-3 rounded-2xl bg-card p-4 shadow-card"
    >
      <h3 className="font-extrabold">Deposit Details</h3>
      <label className="block text-xs font-semibold text-muted-foreground">
        UPI ID
        <input className={inputClass} value={upi} onChange={(e) => setUpi(e.target.value)} />
      </label>
      <label className="block text-xs font-semibold text-muted-foreground">
        Display name
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button
        disabled={busy}
        className="w-full rounded-xl bg-gradient-purple py-3 font-bold text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function UsersTab({ users, onDone }: { users: any[]; onDone: () => void }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = term
    ? users.filter((u) =>
        [u.name, u.email, u.mobile, u.referral_code, u.id]
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(term)),
      )
    : users;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 rounded-xl bg-card px-3 shadow-card">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          className="w-full bg-transparent py-3 text-sm outline-none"
          placeholder="Search by name, email, mobile or referral code"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <p className="px-1 text-xs font-semibold text-muted-foreground">
        {list.length} of {users.length} users
      </p>
      {list.map((u: any) => (
        <UserRow key={u.id} user={u} onDone={onDone} />
      ))}
      {!list.length && (
        <p className="mt-8 text-center text-muted-foreground">No matching users.</p>
      )}
    </div>
  );
}

function UserRow({ user, onDone }: { user: any; onDone: () => void }) {
  const passFn = useServerFn(adminSetUserPassword);
  const coinsFn = useServerFn(adminSetUserCoins);
  const deleteFn = useServerFn(adminDeleteUser);
  const [open, setOpen] = useState<"" | "pass" | "coins" | "history">("");
  const [password, setPassword] = useState("");
  const [coins, setCoins] = useState<number>(user.coins);
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-xl bg-card p-3 shadow-card">
      <p className="font-bold">{user.name}</p>
      <p className="text-sm text-muted-foreground">
        {user.email} • {user.mobile}
      </p>
      <p className="mt-1 text-sm font-bold text-primary">{user.coins} coins</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => setOpen((v) => (v === "pass" ? "" : "pass"))}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold text-foreground"
        >
          <KeyRound className="h-3.5 w-3.5" /> Change password
        </button>
        <button
          onClick={() => setOpen((v) => (v === "coins" ? "" : "coins"))}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold text-foreground"
        >
          <Coins className="h-3.5 w-3.5" /> Adjust balance
        </button>
        <button
          onClick={() => setOpen((v) => (v === "history" ? "" : "history"))}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold text-foreground"
        >
          <History className="h-3.5 w-3.5" /> Earning history
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            if (
              !window.confirm(
                `Delete ${user.email}? This permanently removes the account and all its data.`,
              )
            )
              return;
            setBusy(true);
            try {
              await deleteFn({ data: { targetUserId: user.id } });
              toast.success("Account deleted");
              onDone();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            } finally {
              setBusy(false);
            }
          }}
          className="flex items-center gap-1 rounded-lg bg-destructive/15 px-3 py-2 text-xs font-bold text-destructive disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete account
        </button>
      </div>

      {open === "pass" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await passFn({ data: { targetUserId: user.id, password } });
              toast.success("Password updated");
              setPassword("");
              setOpen("");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-2 flex gap-2"
        >
          <input
            className={inputClass}
            type="text"
            required
            minLength={6}
            maxLength={72}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={busy}
            className="shrink-0 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "…" : "Save"}
          </button>
        </form>
      )}

      {open === "coins" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await coinsFn({ data: { targetUserId: user.id, coins } });
              toast.success("Balance updated");
              setOpen("");
              onDone();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-2 flex gap-2"
        >
          <input
            className={inputClass}
            type="number"
            min={0}
            required
            value={coins}
            onChange={(e) => setCoins(Number(e.target.value))}
          />
          <button
            disabled={busy}
            className="shrink-0 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "…" : "Set"}
          </button>
        </form>
      )}

      {open === "history" && <UserHistory userId={user.id} />}
    </div>
  );
}

function UserHistory({ userId }: { userId: string }) {
  const fn = useServerFn(adminUserHistory);
  const q = useQuery({
    queryKey: ["admin-user-history", userId],
    queryFn: () => fn({ data: { targetUserId: userId } }),
  });

  if (q.isLoading) return <p className="mt-2 text-xs text-muted-foreground">Loading history…</p>;
  const items = q.data?.items ?? [];

  return (
    <div className="mt-2 rounded-xl bg-muted p-3">
      <p className="text-xs font-bold text-foreground">
        Earned {q.data?.totalEarned ?? 0} coins • Withdrawn {q.data?.totalWithdrawn ?? 0} coins
      </p>
      {!items.length && (
        <p className="mt-2 text-xs text-muted-foreground">No history for this user yet.</p>
      )}
      <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
        {items.map((it) => (
          <div
            key={`${it.kind}-${it.id}`}
            className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">{it.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(it.date).toLocaleString()} • {it.status}
              </p>
            </div>
            <span
              className={`text-xs font-extrabold ${
                it.coins > 0
                  ? "text-success"
                  : it.coins < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {it.coins > 0 ? `+${it.coins}` : it.coins}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

function OverviewTab({ o }: { o: any }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Stat label="Total users" value={o.totalUsers} />
      <Stat label="Total coin balance" value={o.totalCoins} />
      <Stat label="Deposits approved" value={`₹${o.depositApprovedInr}`} />
      <Stat label="Withdrawals paid" value={`₹${o.withdrawApprovedInr}`} />
      <Stat label="Pending deposits" value={o.depositPending} />
      <Stat label="Pending withdrawals" value={o.withdrawPending} />
      <Stat label="Pending proofs" value={o.pendingProofs} />
      <Stat label="Coins paid to users" value={o.coinsPaidOut} />
      <Stat label="Total tasks" value={o.totalTasks} />
      <Stat label="Active tasks" value={o.activeTasks} />
    </div>
  );
}

function PromoTab({ promos, onDone }: { promos: any[]; onDone: () => void }) {
  const createFn = useServerFn(adminCreatePromo);
  const toggleFn = useServerFn(adminSetPromoActive);
  const [form, setForm] = useState({ code: "", coins: 100, maxUses: 100 });
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-4 space-y-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await createFn({ data: form });
            toast.success("Promo code created");
            setForm({ ...form, code: "" });
            onDone();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3 rounded-2xl bg-card p-4 shadow-card"
      >
        <h3 className="flex items-center gap-2 font-extrabold">
          <Ticket className="h-4 w-4" /> Create Promo Code
        </h3>
        <input
          className={inputClass}
          required
          maxLength={30}
          placeholder="Code e.g. WELCOME50"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-muted-foreground">
            Coins
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.coins}
              onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Max uses
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
            />
          </label>
        </div>
        <button
          disabled={busy}
          className="w-full rounded-xl bg-gradient-brand py-3 font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create Code"}
        </button>
      </form>

      {!promos.length && <p className="mt-8 text-center text-muted-foreground">No promo codes.</p>}
      {promos.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold">{p.code}</p>
            <p className="text-xs text-muted-foreground">
              {p.coins} coins • {p.used_count}/{p.max_uses} used
            </p>
          </div>
          <button
            onClick={async () => {
              await toggleFn({ data: { id: p.id, active: !p.active } });
              onDone();
            }}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${
              p.active ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {p.active ? "Disable" : "Enable"}
          </button>
        </div>
      ))}
    </div>
  );
}


/* ---------------- Task History ---------------- */

function TaskHistoryTab({ tasks }: { tasks: any[] }) {
  const [mode, setMode] = useState<"Users Task" | "Admin Task">("Users Task");
  const [q, setQ] = useState("");
  const list = tasks
    .filter((t) => (mode === "Admin Task" ? t.is_admin_task : !t.is_admin_task))
    .filter((t) =>
      q.trim() ? `${t.title} ${t.category}`.toLowerCase().includes(q.trim().toLowerCase()) : true,
    );

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {(["Users Task", "Admin Task"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-xl py-2.5 text-sm font-bold ${
              mode === m ? "bg-gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search task title or category"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <p className="text-xs font-semibold text-muted-foreground">{list.length} task(s)</p>

      {!list.length && <p className="mt-8 text-center text-muted-foreground">No tasks found.</p>}

      {list.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-card p-3 shadow-card">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{t.title}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {t.category} • {t.reward_coins} coins • {t.claimed_count}/{t.total_slots} claimed
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(t.created_at).toLocaleString()} •{" "}
              {t.disabled ? "Cancelled" : !t.approved ? "Under review" : t.active ? "Live" : "Closed"}
            </p>
          </div>
          <Link
            to="/admin/task/$taskId"
            params={{ taskId: t.id }}
            className="rounded-lg bg-gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            View Details
          </Link>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Proofs ---------------- */

function ProofsTab({
  onReview,
}: {
  onReview: (id: string, approve: boolean, note?: string) => void;
}) {
  const [mode, setMode] = useState<"Gmail Task Proof" | "Other Task Proof">("Other Task Proof");
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const proofsFn = useServerFn(getAdminProofs);
  const gmail = mode === "Gmail Task Proof";
  const pq = useQuery({
    queryKey: ["admin-proofs", gmail, date],
    queryFn: () => proofsFn({ data: { gmail, date: date || null } }),
  });
  const items = pq.data?.items ?? [];

  const list = items

    .filter((s) => {
      const t = q.trim().toLowerCase();
      if (!t) return true;
      return `${s.tasks?.title ?? ""} ${s.user?.name ?? ""} ${s.user?.email ?? ""} ${s.note ?? ""}`
        .toLowerCase()
        .includes(t);
    });

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {(["Gmail Task Proof", "Other Task Proof"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-xl py-2.5 text-sm font-bold ${
              mode === m ? "bg-gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by user, email or task"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {mode === "Gmail Task Proof" && (
        <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-card">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
          {date && (
            <button
              onClick={() => setDate("")}
              className="rounded-lg bg-muted px-2 py-1 text-xs font-bold text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <p className="text-xs font-semibold text-muted-foreground">
        {pq.isLoading ? "Loading…" : `${list.length} proof(s)`}
      </p>

      {!pq.isLoading && !list.length && (
        <p className="mt-8 text-center text-muted-foreground">No proofs found.</p>
      )}

      {list.map((s: any) => (
        <Card
          key={s.id}
          title={s.tasks?.title ?? "Task"}
          sub={`${s.user?.name ?? "User"} • ${s.user?.email ?? ""} • ${s.reward_coins} coins • ${
            s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"
          }`}
          note={s.note}
          adminNote={s.admin_note}
          status={s.status}
          rejectNote
          extra={<ProofButton path={s.proof_url} />}
          onApprove={() => onReview(s.id, true)}
          onReject={(n: string) => onReview(s.id, false, n)}
        />
      ))}
    </div>
  );
}
