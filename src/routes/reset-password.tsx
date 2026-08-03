import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/brand";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Password — EarnVerse" },
      {
        name: "description",
        content: "Set a new password for your EarnVerse account and get back to earning coins.",
      },
      { property: "og:title", content: "Reset Password — EarnVerse" },
      { property: "og:description", content: "Set a new EarnVerse account password." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/tasks", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="rounded-b-[2.5rem] bg-gradient-brand px-6 pb-12 pt-10 shadow-pop">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <BrandMark className="h-20 w-20" />
          <h1 className="mt-3 text-2xl font-extrabold text-primary-foreground">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/85">
            Choose a strong password you&apos;ll remember
          </p>
        </div>
      </header>

      <div className="mx-auto -mt-8 w-full max-w-md px-5">
        <div className="rounded-3xl bg-card p-5 shadow-pop">
          {!ready ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Open this page from the reset link in your email to continue.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <Field value={password} onChange={setPassword} placeholder="New password" />
              <Field value={confirm} onChange={setConfirm} placeholder="Confirm new password" />
              <button
                disabled={busy}
                className="mt-2 w-full rounded-2xl bg-gradient-purple py-3.5 text-base font-extrabold text-primary-foreground shadow-pop disabled:opacity-60"
              >
                {busy ? "Updating…" : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/40">
      <Lock className="h-4 w-4 text-muted-foreground" />
      <input
        type="password"
        required
        maxLength={72}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
