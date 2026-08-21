import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Mail,
  FileText,
  ScrollText,
  Trash2,
  LogOut,
  ChevronRight,
  Phone,
  Ticket,
  BadgeCheck,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { ReferEarn } from "@/components/refer-earn";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { redeemPromo, updateMyProfile } from "@/lib/earn.functions";
import { APP_VERSION, toRupees, TELEGRAM_CHANNEL } from "@/lib/earn-constants";


export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — EarnVerse Account" },
      {
        name: "description",
        content: "View your EarnVerse account details, coin balance and account settings.",
      },
      { property: "og:title", content: "My Profile — EarnVerse" },
      { property: "og:description", content: "Your EarnVerse account and coin balance." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const p = me.data?.profile;
  const isAdmin = me.data?.isAdmin ?? false;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-purple px-4 pb-16 pt-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary-foreground/60 bg-brand-deep text-3xl font-extrabold text-primary-foreground">
          {(p?.name ?? "U").charAt(0).toUpperCase()}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-primary-foreground">
          {p?.name ?? "EarnVerse User"}
        </h1>
        <p className="text-sm text-primary-foreground/80">{p?.email}</p>
      </div>

      <main className="mx-auto -mt-10 max-w-md px-4">
        <section className="rounded-2xl border-2 border-primary bg-card p-4 shadow-pop">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Coin balance
          </p>
          <div className="mt-1 flex items-center gap-2">
            <CoinIcon className="h-9 w-9" />
            <span className="text-4xl font-extrabold text-primary">{p?.coins ?? 0}</span>
            <span className="ml-auto rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
              ₹{toRupees(p?.coins ?? 0)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" /> {p?.mobile || "—"}
          </div>
        </section>

        <ProfileDetails />

        <ReferEarn />

        <PromoRedeem />

        <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-card">

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 border-b border-border bg-gold/15 px-4 py-4 font-bold text-foreground"
            >
              <ShieldCheck className="h-5 w-5 text-primary" />
              Admin Console
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          )}
          <LinkItem to="/contact" icon={<Mail className="h-5 w-5" />} label="Contact Us" />
          <LinkItem to="/privacy" icon={<FileText className="h-5 w-5" />} label="Privacy Policy" />
          <LinkItem
            to="/terms"
            icon={<ScrollText className="h-5 w-5" />}
            label="Terms & Conditions"
          />
          <Item icon={<Trash2 className="h-5 w-5" />} label="Delete Account" danger />
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 px-4 py-4 text-left font-semibold text-foreground"
          >
            <LogOut className="h-5 w-5 text-primary" />
            Log out
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          EarnVerse v{APP_VERSION}
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

function ProfileDetails() {
  const me = useMe();
  const refresh = useRefreshAll();
  const fn = useServerFn(updateMyProfile);
  const p = me.data?.profile;
  const verified = me.data?.emailVerified ?? false;
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");

  function startEdit() {
    setName(p?.name ?? "");
    setMobile(p?.mobile ?? "");
    setDob(p?.dob ?? "");
    setEdit(true);
  }

  return (
    <section className="mt-4 rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-foreground">My Details</h2>
        {!edit && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>

      {edit ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await fn({ data: { name, mobile, dob: dob || null } });
              toast.success("Profile updated");
              setEdit(false);
              refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not update profile");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-3 space-y-3"
        >
          <Field label="Full name">
            <input
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 ring-ring/40"
            />
          </Field>
          <Field label="Mobile number">
            <input
              inputMode="tel"
              maxLength={20}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 ring-ring/40"
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 ring-ring/40"
            />
          </Field>
          <div className="flex gap-2">
            <button
              disabled={busy}
              className="flex-1 rounded-xl bg-gradient-brand py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEdit(false)}
              className="rounded-xl bg-muted px-4 text-sm font-bold text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Full name" value={p?.name || "—"} />
          <Row label="Mobile number" value={p?.mobile || "—"} />
          <Row label="Date of birth" value={p?.dob || "—"} />
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-foreground">{p?.email || "—"}</span>
              {verified ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> Unverified
                </span>
              )}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-2 first:border-0 first:pt-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function PromoRedeem() {
  const fn = useServerFn(redeemPromo);
  const refresh = useRefreshAll();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fn({ data: { code } });
          toast.success(`Promo applied • ${r.coins} coins added`);
          setCode("");
          refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Invalid promo code");
        } finally {
          setBusy(false);
        }
      }}
      className="mt-4 rounded-2xl bg-card p-4 shadow-card"
    >
      <h2 className="flex items-center gap-2 font-extrabold text-foreground">
        <Ticket className="h-5 w-5 text-primary" /> Promo Code
      </h2>
      <div className="mt-2 flex gap-2">
        <input
          required
          maxLength={30}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 ring-ring/40"
        />
        <button
          disabled={busy}
          className="shrink-0 rounded-xl bg-gradient-brand px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "…" : "Redeem"}
        </button>
      </div>
    </form>
  );
}
function LinkItem({
  to,
  icon,
  label,
}: {
  to: "/contact" | "/privacy" | "/terms";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-border px-4 py-4 font-semibold text-foreground"
    >
      <span className="text-primary">{icon}</span>
      {label}
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function Item({
  icon,
  label,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <details className="border-b border-border">
      <summary
        className={`flex cursor-pointer list-none items-center gap-3 px-4 py-4 font-semibold ${
          danger ? "text-destructive" : "text-foreground"
        }`}
      >
        <span className={danger ? "text-destructive" : "text-primary"}>{icon}</span>
        {label}
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </summary>
      <p className="px-4 pb-4 text-sm text-muted-foreground">
        To delete your account and all data, contact support on our{" "}
        <a
          href={TELEGRAM_CHANNEL}
          target="_blank"
          rel="noreferrer noopener"
          className="font-bold text-primary underline"
        >
          Telegram channel
        </a>{" "}
        from your registered email.
      </p>


    </details>
  );
}
