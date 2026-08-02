import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark, Wordmark } from "@/components/brand";

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

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
  });

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
        if (signInError) {
          toast.success("Account created! Please confirm your email, then sign in.");
          setMode("signin");
          return;
        }
        toast.success("Welcome to EarnVerse! 50 coins added as joining reward 🎉");
        navigate({ to: "/tasks", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/tasks", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none ring-ring/40 transition focus:ring-2";

  return (
    <main className="min-h-screen bg-gradient-brand px-5 pb-10 pt-10">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <BrandMark className="h-24 w-24 animate-float" />
        <Wordmark className="mt-2 text-4xl" />
        <p className="mt-1 text-sm font-medium text-primary-foreground/85">
          Watch • Work • Earn Daily
        </p>

        <div className="mt-7 w-full rounded-3xl bg-card p-5 shadow-pop">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <input
                  className={inputClass}
                  placeholder="Full name"
                  value={form.name}
                  onChange={set("name")}
                  maxLength={60}
                  required
                />
                <input
                  className={inputClass}
                  placeholder="Mobile number"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={set("mobile")}
                  maxLength={15}
                  required
                />
              </>
            )}
            <input
              className={inputClass}
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={set("email")}
              maxLength={255}
              required
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={set("password")}
              maxLength={72}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-purple py-3.5 text-base font-bold text-primary-foreground shadow-pop transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {mode === "signup" && (
            <p className="mt-4 rounded-xl bg-secondary px-3 py-2 text-center text-sm font-medium text-secondary-foreground">
              🎁 Get 50 coins instantly on registration
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
