import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, ReceiptText, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { getWallet, createDeposit, createWithdrawal } from "@/lib/earn.functions";
import {
  COINS_PER_RUPEE,
  MIN_WITHDRAW_COINS,
  DEPOSIT_PACKS,
  WITHDRAW_PACKS,
  payableAmount,
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

function PackGrid({
  packs,
  selected,
  onSelect,
  tone,
}: {
  packs: { rupees: number; coins: number }[];
  selected: number | null;
  onSelect: (rupees: number) => void;
  tone: "brand" | "success";
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {packs.map((p) => {
        const active = selected === p.rupees;
        return (
          <button
            key={p.rupees}
            type="button"
            onClick={() => onSelect(p.rupees)}
            className={`rounded-2xl border-2 p-3 text-left transition active:scale-95 ${
              active
                ? tone === "brand"
                  ? "border-primary bg-secondary shadow-pop"
                  : "border-success bg-success/10 shadow-pop"
                : "border-border bg-card shadow-card"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <CoinIcon className="h-6 w-6" />
              <span className="text-lg font-extrabold text-foreground">{p.coins}</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">coins</p>
            <p
              className={`mt-2 rounded-lg px-2 py-1 text-center text-sm font-extrabold ${
                tone === "brand"
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-success text-success-foreground"
              }`}
            >
              ₹{p.rupees}
            </p>
          </button>
        );
      })}
    </div>
  );
}

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
  const [rupees, setRupees] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const pack = DEPOSIT_PACKS.find((p) => p.rupees === rupees) ?? null;
  const payable = pack ? payableAmount(pack.rupees) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pack) return;
    setBusy(true);
    try {
      let proofPath: string | undefined;
      if (file) {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) throw new Error("Session expired");
        const ext = file.name.split(".").pop() ?? "png";
        const path = `${uid}/deposits/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("proofs").upload(path, file);
        if (error) throw error;
        proofPath = path;
      }
      await fn({ data: { rupees: pack.rupees, utr: utr.trim(), proofPath } });
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
      {step === 1 ? (
        <>
          <h3 className="text-lg font-extrabold">Buy Coins</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a coin pack • 1% tax added at payment
          </p>
          <div className="mt-4">
            <PackGrid packs={DEPOSIT_PACKS} selected={rupees} onSelect={setRupees} tone="brand" />
          </div>
          <button
            disabled={!pack}
            onClick={() => setStep(2)}
            className="mt-5 w-full rounded-xl bg-gradient-brand py-3 font-bold text-primary-foreground disabled:opacity-50"
          >
            {pack ? `Continue • ₹${pack.rupees}` : "Select a pack"}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mb-2 text-sm font-bold text-primary"
          >
            ← Change pack
          </button>
          <h3 className="text-lg font-extrabold">Complete Payment</h3>
          <div className="mt-3 rounded-xl bg-secondary p-3">
            <p className="text-xs font-semibold text-muted-foreground">Pay to UPI ID</p>
            <p className="select-all text-lg font-extrabold text-primary">{upi}</p>
            <p className="text-xs text-muted-foreground">{upiName}</p>
          </div>
          <div className="mt-3 space-y-1 rounded-xl bg-muted p-3 text-sm font-semibold">
            <div className="flex justify-between">
              <span>Coins</span>
              <span>{pack?.coins}</span>
            </div>
            <div className="flex justify-between">
              <span>Pack price</span>
              <span>₹{pack?.rupees}.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (1%)</span>
              <span>₹{((pack?.rupees ?? 0) * 0.01).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-extrabold text-primary">
              <span>Pay now</span>
              <span>₹{payable.toFixed(2)}</span>
            </div>
          </div>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              className={inputClass}
              placeholder="UPI transaction / UTR number"
              required
              maxLength={40}
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted px-3 py-2.5 text-sm font-semibold text-muted-foreground">
              <Upload className="h-4 w-4" />
              {file ? file.name.slice(0, 28) : "Submit payment screenshot"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-gradient-brand py-3 font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Sending…" : "Submit Deposit Request"}
            </button>
          </form>
        </>
      )}
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
  const [rupees, setRupees] = useState<number | null>(null);
  const [method, setMethod] = useState<"UPI" | "Google Play Redeem Code">("UPI");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  const pack = WITHDRAW_PACKS.find((p) => p.rupees === rupees) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pack) {
      toast.error("Select a withdrawal amount");
      return;
    }
    setBusy(true);
    try {
      if (pack.coins > coins) throw new Error("Not enough coins");
      await fn({ data: { rupees: pack.rupees, method, payoutDetail: detail.trim() } });
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
        Choose a fixed amount • minimum {MIN_WITHDRAW_COINS} coins • manual payout
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <PackGrid
          packs={WITHDRAW_PACKS}
          selected={rupees}
          onSelect={setRupees}
          tone="success"
        />
        <div className="grid grid-cols-2 gap-2 pt-1">
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
        <div className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
          {pack ? (
            <>
              Debit <span className="text-primary">{pack.coins} coins</span> • You receive{" "}
              <span className="text-primary">₹{pack.rupees}.00</span>
            </>
          ) : (
            "Select an amount above"
          )}
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

