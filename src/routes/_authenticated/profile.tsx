import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Mail,
  FileText,
  ScrollText,
  Trash2,
  LogOut,
  ChevronRight,
  Ticket,
  BadgeCheck,
  AlertCircle,
  Pencil,
  Camera,
  Share2,
  Wallet,
  ListChecks,
  Users,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/bottom-nav";
import { CoinIcon } from "@/components/brand";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import {
  redeemPromo,
  updateMyProfile,
  getProfileStats,
  getProofUrl,
} from "@/lib/earn.functions";
import { APP_VERSION, toRupees, TELEGRAM_CHANNEL, SITE_URL } from "@/lib/earn-constants";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — EarnVerse Account" },
      {
        name: "description",
        content: "View your EarnVerse profile, photo, coin balance and account stats.",
      },
      { property: "og:title", content: "My Profile — EarnVerse" },
      { property: "og:description", content: "Your EarnVerse profile and stats." },
    ],
  }),
  component: ProfilePage,
});

const maskMobile = (m: string) =>
  m && m.length >= 6 ? `${m.slice(0, 2)}****${m.slice(-4)}` : m || "—";

function useAvatarUrl(path: string | null | undefined) {
  const fn = useServerFn(getProofUrl);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    fn({ data: { path } })
      .then((r) => alive && setUrl(r?.url ?? null))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [path, fn]);
  return url;
}

function ProfilePage() {
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const refresh = useRefreshAll();
  const statsFn = useServerFn(getProfileStats);
  const saveFn = useServerFn(updateMyProfile);
  const { data: stats } = useQuery({ queryKey: ["profile-stats"], queryFn: () => statsFn() });

  const p = me.data?.profile;
  const isAdmin = me.data?.isAdmin ?? false;
  const verified = me.data?.emailVerified ?? false;
  const avatar = useAvatarUrl(p?.avatar_url ?? null);
  const [edit, setEdit] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function uploadAvatar(file: File | null | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uid}/avatars/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("proofs").upload(path, file);
      if (error) throw error;
      await saveFn({
        data: {
          name: p?.name ?? "",
          mobile: p?.mobile ?? "",
          dob: p?.dob ?? null,
          avatarUrl: path,
        },
      });
      toast.success("Profile photo updated");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function shareProfile() {
    const text = `${p?.name ?? "I"} is earning on EarnVerse — join me!`;
    const url = SITE_URL;
    if (navigator.share) {
      try {
        await navigator.share({ title: "EarnVerse", text, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copied");
    } catch {
      toast.error("Could not share");
    }
  }

  const joined = p?.created_at
    ? new Date(p.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Profile</h1>
            <p className="text-sm font-medium text-muted-foreground">
              Your profile and stats.
            </p>
          </div>
          <button
            onClick={() => setEdit((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold text-foreground"
          >
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-4">
            <label className="relative h-20 w-20 shrink-0 cursor-pointer">
              {avatar ? (
                <img
                  src={avatar}
                  alt={`${p?.name ?? "User"} profile photo`}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand text-2xl font-extrabold text-primary-foreground">
                  {(p?.name ?? "U").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
              />
            </label>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-extrabold text-foreground">
                {p?.name || "EarnVerse User"}
              </h2>
              <p className="text-sm font-semibold text-muted-foreground">
                {maskMobile(p?.mobile ?? "")}
              </p>
              <p className="text-sm text-muted-foreground">Member since {joined}</p>
            </div>

            <button
              onClick={shareProfile}
              className="flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatCard
            icon={<Wallet className="h-5 w-5 text-success" />}
            value={(stats?.totalEarned ?? 0).toLocaleString()}
            label="Total Earned"
          />
          <StatCard
            icon={<ListChecks className="h-5 w-5 text-primary" />}
            value={String(stats?.tasksDone ?? 0)}
            label="Tasks Done"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-primary" />}
            value={String(stats?.referrals ?? 0)}
            label="Referrals"
          />
          <StatCard
            icon={<CoinIcon className="h-5 w-5" />}
            value={`${p?.coins ?? 0}`}
            label={`Balance • ₹${toRupees(p?.coins ?? 0)}`}
          />
        </div>

        <ProfileDetails
          edit={edit}
          setEdit={setEdit}
          verified={verified}
          profile={{
            name: p?.name ?? "",
            mobile: p?.mobile ?? "",
            dob: p?.dob ?? "",
            email: p?.email ?? "",
            avatarUrl: p?.avatar_url ?? null,
          }}
        />

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

        <p className="mt-6 text-center text-xs text-muted-foreground">EarnVerse v{APP_VERSION}</p>
      </main>
      <BottomNav />
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">{icon}</span>
      <p className="mt-3 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileDetails({
  edit,
  setEdit,
  verified,
  profile,
}: {
  edit: boolean;
  setEdit: (v: boolean) => void;
  verified: boolean;
  profile: {
    name: string;
    mobile: string;
    dob: string;
    email: string;
    avatarUrl: string | null;
  };
}) {
  const refresh = useRefreshAll();
  const fn = useServerFn(updateMyProfile);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(profile.name);
  const [mobile, setMobile] = useState(profile.mobile);
  const [dob, setDob] = useState(profile.dob);

  useEffect(() => {
    if (edit) {
      setName(profile.name);
      setMobile(profile.mobile);
      setDob(profile.dob);
    }
  }, [edit, profile.name, profile.mobile, profile.dob]);

  return (
    <section className="mt-4 rounded-2xl bg-card p-4 shadow-card">
      <h2 className="font-extrabold text-foreground">My Details</h2>

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
          <Row label="Full name" value={profile.name || "—"} />
          <Row label="Mobile number" value={profile.mobile || "—"} />
          <Row label="Date of birth" value={profile.dob || "—"} />
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-foreground">{profile.email || "—"}</span>
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
