import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Eye } from "lucide-react";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import {
  getAdminData,
  adminCreateTask,
  adminSetTaskActive,
  adminReviewSubmission,
  adminReviewDeposit,
  adminReviewWithdrawal,
  adminUpdateSettings,
  getProofUrl,
} from "@/lib/earn.functions";
import { MIN_TASK_REWARD } from "@/lib/earn-constants";

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

const TABS = ["Proofs", "Deposits", "Withdrawals", "Tasks", "Users", "Settings"] as const;
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
  const [tab, setTab] = useState<Tab>("Proofs");

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

        {d && tab === "Proofs" && (
          <List
            empty="No proof submissions yet."
            items={d.submissions}
            render={(s: any) => (
              <Card
                key={s.id}
                title={s.tasks?.title ?? "Task"}
                sub={`${s.user?.name ?? "User"} • ${s.user?.email ?? ""} • ${s.reward_coins} coins`}
                note={s.note}
                status={s.status}
                extra={<ProofButton path={s.proof_url} />}
                onApprove={() => review("submission", s.id, true)}
                onReject={() => review("submission", s.id, false)}
              />
            )}
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
              <Card
                key={x.id}
                title={`${x.coins} coins • ₹${x.amount_inr} • ${x.method}`}
                sub={`${x.user?.name ?? "User"} • ${x.user?.email ?? ""}`}
                note={`Payout: ${x.payout_detail}`}
                status={x.status}
                onApprove={() => review("withdrawal", x.id, true)}
                onReject={() => review("withdrawal", x.id, false)}
              />
            )}
          />
        )}

        {d && tab === "Tasks" && <TasksTab tasks={d.tasks} onDone={refresh} />}

        {d && tab === "Users" && (
          <div className="mt-4 space-y-2">
            {d.users.map((u: any) => (
              <UserRow key={u.id} user={u} />
            ))}
            {!d.users.length && (
              <p className="mt-8 text-center text-muted-foreground">No users yet.</p>
            )}
          </div>
        )}


        {d && tab === "Settings" && <SettingsTab settings={d.settings} onDone={refresh} />}
      </div>
    </div>
  );

  async function review(kind: "submission" | "deposit" | "withdrawal", id: string, approve: boolean) {
    try {
      const map = {
        submission: adminReviewSubmission,
        deposit: adminReviewDeposit,
        withdrawal: adminReviewWithdrawal,
      } as const;
      await map[kind]({ data: { id, approve } });
      toast.success(approve ? "Approved" : "Rejected");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }
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
  status,
  extra,
  onApprove,
  onReject,
}: {
  title: string;
  sub: string;
  note?: string | null;
  status: string;
  extra?: React.ReactNode;
  onApprove: () => void;
  onReject: () => void;
}) {
  const pending = status === "pending";
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{title}</p>
          <p className="truncate text-sm text-muted-foreground">{sub}</p>
          {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
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
              onClick={onReject}
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
  if (!path) return null;
  return (
    <button
      onClick={async () => {
        try {
          const res = await fn({ data: { path } });
          if (res?.url) window.open(res.url, "_blank", "noopener");
        } catch {
          toast.error("Could not open proof");
        }
      }}
      className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm font-bold text-foreground"
    >
      <Eye className="h-4 w-4" /> View proof
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 ring-ring/40";

function TasksTab({ tasks, onDone }: { tasks: any[]; onDone: () => void }) {
  const createFn = useServerFn(adminCreateTask);
  const toggleFn = useServerFn(adminSetTaskActive);
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    rewardCoins: MIN_TASK_REWARD,
    totalSlots: 10,
  });
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-4 space-y-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await createFn({ data: form });
            toast.success("Task added");
            setForm({ ...form, title: "", description: "", link: "" });
            onDone();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3 rounded-2xl bg-card p-4 shadow-card"
      >
        <h3 className="font-extrabold">Add Official Task</h3>
        <input
          className={inputClass}
          required
          maxLength={100}
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className={inputClass}
          rows={3}
          maxLength={600}
          placeholder="Instructions"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className={inputClass}
          maxLength={300}
          placeholder="Task link (optional)"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.rewardCoins}
            onChange={(e) => setForm({ ...form, rewardCoins: Number(e.target.value) })}
          />
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.totalSlots}
            onChange={(e) => setForm({ ...form, totalSlots: Number(e.target.value) })}
          />
        </div>
        <button
          disabled={busy}
          className="w-full rounded-xl bg-gradient-brand py-3 font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add Task"}
        </button>
      </form>

      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{t.title}</p>
            <p className="text-xs text-muted-foreground">
              {t.reward_coins} coins • {t.claimed_count}/{t.total_slots} claimed •{" "}
              {t.is_admin_task ? "Official" : "User task"}
            </p>
          </div>
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

function UserRow({ user }: { user: any }) {
  const fn = useServerFn(adminSetUserPassword);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-xl bg-card p-3 shadow-card">
      <p className="font-bold">{user.name}</p>
      <p className="text-sm text-muted-foreground">
        {user.email} • {user.mobile}
      </p>
      <p className="mt-1 text-sm font-bold text-primary">{user.coins} coins</p>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-2 flex items-center gap-1 rounded-lg bg-muted px-3 py-2 text-xs font-bold text-foreground"
      >
        <KeyRound className="h-3.5 w-3.5" /> Change password
      </button>

      {open && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await fn({ data: { targetUserId: user.id, password } });
              toast.success("Password updated");
              setPassword("");
              setOpen(false);
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
    </div>
  );
}
