import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/brand";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in or Sign up — EarnVerse" },
      {
        name: "description",
        content:
          "Create your free EarnVerse account and get 50 bonus coins instantly, or sign in to continue earning.",
      },
      { property: "og:title", content: "Sign in or Sign up — EarnVerse" },
      {
        property: "og:description",
        content: "Join EarnVerse and get 50 bonus coins on registration.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tasks", replace: true });
    });
  }, [navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        if (!form.email.trim()) throw new Error("Enter your Gmail address");
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent. Check your inbox.");
        setMode("signin");
        return;
      }

      if (mode === "signup") {
        if (form.name.trim().length < 2) throw new Error("Please enter your name");
        if (!/^\d{10,15}$/.test(form.mobile.trim()))
          throw new Error("Enter a valid mobile number");
        if (form.password.length < 6)
          throw new Error("Password must be at least 6 characters");
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: form.name.trim(), mobile: form.mobile.trim() },
          },
        });
        if (error) throw error;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (signInError) throw signInError;
        toast.success("Welcome to EarnVerse! 50 coins added as joining reward 🎉");
        navigate({ to: "/tasks", replace: true });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/tasks", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const heading =
    mode === "signup"
      ? "Welcome to EarnVerse"
      : mode === "forgot"
        ? "Reset your password"
        : "Good to see you again";
  const subheading =
    mode === "signup"
      ? "Create your account and get 50 coins instantly"
      : mode === "forgot"
        ? "We'll email you a secure reset link"
        : "Sign in and continue earning coins daily";

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="rounded-b-[2.5rem] bg-gradient-brand px-6 pb-12 pt-10 shadow-pop">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <BrandMark className="h-20 w-20 animate-float" />
          <h1 className="mt-3 text-2xl font-extrabold text-primary-foreground">{heading}</h1>
          <p className="mt-1 text-sm text-primary-foreground/85">{subheading}</p>
        </div>
      </header>

      <div className="mx-auto -mt-8 w-full max-w-md px-5">
        <div className="rounded-3xl bg-card p-5 shadow-pop">
          {mode !== "forgot" ? (
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
              {(["signup", "signin"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${
                    mode === m
                      ? "bg-gradient-brand text-primary-foreground shadow-card"
                      : "text-muted-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="mb-4 flex items-center gap-1 text-sm font-bold text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </button>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field
                  icon={<User className="h-4 w-4" />}
                  placeholder="Full name"
                  value={form.name}
                  onChange={set("name")}
                  maxLength={60}
                />
                <Field
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="Mobile number"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={set("mobile")}
                  maxLength={15}
                />
              </>
            )}
            <Field
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="Gmail address"
              value={form.email}
              onChange={set("email")}
              maxLength={255}
            />
            {mode !== "forgot" && (
              <Field
                icon={<Lock className="h-4 w-4" />}
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={set("password")}
                maxLength={72}
              />
            )}

            {mode === "signin" && (
              <p className="text-xs font-medium text-muted-foreground">
                Forgot your password? Contact us on Telegram @EarnVerseTask and the admin will reset
                it for you.
              </p>
            )}


            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl bg-gradient-purple py-3.5 text-base font-extrabold text-primary-foreground shadow-pop transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
            </button>
          </form>

          {mode === "signup" && (
            <p className="mt-4 rounded-2xl bg-secondary px-3 py-2.5 text-center text-sm font-semibold text-secondary-foreground">
              🎁 Get 50 coins instantly on registration
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-xs font-medium text-muted-foreground">
          Watch • Work • Earn Daily
        </p>
      </div>
    </main>
  );
}

function Field({
  icon,
  ...props
}: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/40">
      <span className="text-muted-foreground">{icon}</span>
      <input
        {...props}
        required
        className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
