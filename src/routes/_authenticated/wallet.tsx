import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, ReceiptText } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { getWallet, createDeposit, createWithdrawal } from "@/lib/earn.functions";
import {
  COINS_PER_RUPEE,
  MIN_DEPOSIT_COINS,
  MIN_WITHDRAW_COINS,
  toRupees,
} from "@/lib/earn-constants";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Coin Wallet — Deposit & Withdraw on EarnVerse" },
      {
        name: "description",
        content:
          "Check your coin balance, buy coins via UPI and withdraw earnings to UPI or Google Play redeem codes.",
      },
      { property: "og:title", content: "Coin Wallet — EarnVerse" },
      {
        property: "og:description",
        content: "Deposit coins via UPI and withdraw earnings anytime.",
      },
    ],
  }),
  component: WalletPage,
});

type Sheet = "deposit" | "withdraw" | null;

function WalletPage() {
  const me = useMe();
  const refresh = useRefreshAll();
  const walletFn = useServerFn(getWallet);
  const walletQ = useQuery({ queryKey: ["wallet"], queryFn: () => walletFn() });
  const [sheet, setSheet] = useState<Sheet>(null);
  const [showRecords, setShowRecords] = useState(false);

  const coins = me.data?.profile?.coins ?? 0;
  const upi = me.data?.settings?.["deposit_upi"] ?? "";
  const upiName = me.data?.settings?.["deposit_name"] ?? "EarnVerse";

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar coins={coins} name={me.data?.profile?.name ?? ""} />

      <div className="bg-gradient-purple px-4 pb-14 pt-4">
        <h2 className="text-center text-2xl font-extrabold text-primary-foreground">
          Coin Account
        </h2>
      </div>

      <main className="mx-auto -mt-10 max-w-md px-4">
        <section className="rounded-2xl border-2 border-primary bg-card p-5 shadow-pop">
          <div className="flex items-end gap-2">
            <CoinIcon className="h-11 w-11" />
            <span className="text-5xl font-extrabold leading-none text-primary">{coins}</span>
            <span className="pb-1 text-sm text-muted-foreground">
              {COINS_PER_RUPEE}=₹1.0
            </span>
          </div>
          <p className="mt-3 rounded-full bg-secondary px-4 py-2 text-center text-sm font-semibold text-secondary-foreground">
            You can withdraw after reaching {MIN_WITHDRAW_COINS} coins
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-gradient-purple p-5 shadow-card">
          <h3 className="text-lg font-extrabold text-primary-foreground">Convert to cash</h3>
          <p className="mt-1 text-4xl font-extrabold text-gold">₹{toRupees(coins)}</p>
        </section>

        <button
          onClick={() => setShowRecords((v) => !v)}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border-2 border-primary bg-card px-4 py-3.5 text-left font-bold shadow-card"
        >
          <ReceiptText className="h-5 w-5 text-primary" />
          Deposit & Withdrawal Record
          <span className="ml-auto text-primary">{showRecords ? "▴" : "▸"}</span>
        </button>

        {showRecords && (
          <div className="mt-3 space-y-2">
            {(walletQ.data?.withdrawals ?? []).map((w) => (
              <Row
                key={w.id}
                icon={<ArrowUpFromLine className="h-4 w-4" />}
                title={`Withdraw • ${w.method}`}
                sub={`${w.coins} coins → ₹${w.amount_inr}`}
                status={w.status}
                date={w.created_at}
              />
            ))}
            {(walletQ.data?.deposits ?? []).map((d) => (
              <Row
                key={d.id}
                icon={<ArrowDownToLine className="h-4 w-4" />}
                title="Deposit"
                sub={`${d.coins} coins • ₹${d.amount_inr} paid`}
                status={d.status}
                date={d.created_at}
              />
            ))}
            {!walletQ.isLoading &&
              !(walletQ.data?.deposits ?? []).length &&
              !(walletQ.data?.withdrawals ?? []).length && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No records yet.
                </p>
              )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setSheet("deposit")}
            className="rounded-xl bg-gradient-brand py-4 text-lg font-extrabold text-primary-foreground shadow-pop active:scale-95"
          >
            Deposit
          </button>
          <button
            onClick={() => setSheet("withdraw")}
            className="rounded-xl bg-success py-4 text-lg font-extrabold text-success-foreground shadow-pop active:scale-95"
          >
            Withdraw
          </button>
        </div>
      </main>

      {sheet === "deposit" && (
        <DepositSheet upi={upi} upiName={upiName} onClose={() => setSheet(null)} onDone={refresh} />
      )}
      {sheet === "withdraw" && (
        <WithdrawSheet coins={coins} onClose={() => setSheet(null)} onDone={refresh} />
      )}
      <BottomNav />
    </div>
  );
}

function Row({
  icon,
  title,
  sub,
  status,
  date,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  status: string;
  date: string;
}) {
  const tone =
    status === "approved"
      ? "bg-success/15 text-success"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive"
        : "bg-accent text-accent-foreground";
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {sub} • {new Date(date).toLocaleDateString()}
        </p>
      </div>
      <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${tone}`}>
        {status}
      </span>
    </div>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/50" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 ring-ring/40";

function DepositSheet({
  upi,
  upiName,
  onClose,
  onDone,
}: {
  upi: string;
  upiName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const fn = useServerFn(createDeposit);
  const [coins, setCoins] = useState(MIN_DEPOSIT_COINS);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const amount = ((coins / COINS_PER_RUPEE) * 1.01).toFixed(2);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fn({ data: { coins, utr: utr.trim() } });
      toast.success("Deposit request sent for admin approval");
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-lg font-extrabold">Buy Coins (Deposit)</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Minimum {MIN_DEPOSIT_COINS} coins • 1% deposit tax • UPI only
      </p>
      <div className="mt-3 rounded-xl bg-secondary p-3">
        <p className="text-xs font-semibold text-muted-foreground">Pay to UPI ID</p>
        <p className="select-all text-lg font-extrabold text-primary">{upi}</p>
        <p className="text-xs text-muted-foreground">{upiName}</p>
      </div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-xs font-semibold text-muted-foreground">
          Coins to buy
          <input
            type="number"
            min={MIN_DEPOSIT_COINS}
            className={inputClass}
            value={coins}
            onChange={(e) => setCoins(Number(e.target.value))}
          />
        </label>
        <div className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
          Pay amount (incl. 1% tax): <span className="text-primary">₹{amount}</span>
        </div>
        <input
          className={inputClass}
          placeholder="UPI transaction / UTR number"
          required
          maxLength={40}
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
        />
        <button
          disabled={busy}
          className="w-full rounded-xl bg-gradient-brand py-3 font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Sending…" : "Submit Deposit Request"}
        </button>
      </form>
    </Sheet>
  );
}

function WithdrawSheet({
  coins,
  onClose,
  onDone,
}: {
  coins: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const fn = useServerFn(createWithdrawal);
  const [amountCoins, setAmountCoins] = useState(MIN_WITHDRAW_COINS);
  const [method, setMethod] = useState<"UPI" | "Google Play Redeem Code">("UPI");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (amountCoins > coins) throw new Error("Not enough coins");
      await fn({ data: { coins: amountCoins, method, payoutDetail: detail.trim() } });
      toast.success("Withdrawal request submitted");
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-lg font-extrabold">Withdraw</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Minimum {MIN_WITHDRAW_COINS} coins • manual payout by admin
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(["UPI", "Google Play Redeem Code"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-xl px-3 py-2.5 text-sm font-bold ${
                method === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <label className="block text-xs font-semibold text-muted-foreground">
          Coins to withdraw
          <input
            type="number"
            min={MIN_WITHDRAW_COINS}
            max={coins}
            className={inputClass}
            value={amountCoins}
            onChange={(e) => setAmountCoins(Number(e.target.value))}
          />
        </label>
        <div className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
          You receive: <span className="text-primary">₹{toRupees(amountCoins)}</span>
        </div>
        <input
          className={inputClass}
          required
          maxLength={100}
          placeholder={method === "UPI" ? "Your UPI ID" : "Email for redeem code"}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        <button
          disabled={busy}
          className="w-full rounded-xl bg-success py-3 font-bold text-success-foreground disabled:opacity-60"
        >
          {busy ? "Sending…" : "Request Withdrawal"}
        </button>
      </form>
    </Sheet>
  );
}
