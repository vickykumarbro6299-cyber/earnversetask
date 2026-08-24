import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, Gift, CircleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/brand";
import { getDeviceId } from "@/lib/device-id";
import { checkDevice, registerDevice, trackDevice } from "@/lib/earn.functions";

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

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "", referral: "" });

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setMode("signup");
      setForm((f) => ({ ...f, referral: ref.toUpperCase() }));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tasks", replace: true });
    });
  }, [navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function sendReset() {
    const email = forgotEmail.trim();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }
    setForgotBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent — check your email");
      setForgotOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setForgotBusy(false);
    }
  }

  async function resendVerification() {
    const email = verificationEmail.trim();
    if (!email) return;
    setResendBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
      toast.success("New verification email sent — also check Spam or Promotions");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resend verification email";
      toast.error(/rate limit/i.test(message) ? "Please wait a minute before trying again" : message);
    } finally {
      setResendBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {

        setVerificationEmail("");

        if (form.name.trim().length < 2) throw new Error("Please enter your name");
        if (!/^\d{10,15}$/.test(form.mobile.trim()))
          throw new Error("Enter a valid mobile number");
        if (form.password.length < 6)
          throw new Error("Password must be at least 6 characters");

        const deviceId = getDeviceId();
        // Device check is a safety net — a network hiccup must never block signup.
        try {
          const check = await checkDevice({ data: { deviceId } });
          if (check.blocked)
            throw new Error(
              "Multiple Accounts in same device Warning — We Couldn't Create A New Account For You.",
            );
        } catch (devErr) {
          if (devErr instanceof Error && devErr.message.startsWith("Multiple Accounts")) throw devErr;
          console.warn("device check skipped", devErr);
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              name: form.name.trim(),
              mobile: form.mobile.trim(),
              referral_code: form.referral.trim().toUpperCase(),
            },
          },
        });
        if (error) throw error;

        if (!signUpData.session) {
          setSentTo(form.email.trim());
          toast.success("Verification email sent — verify your Gmail to activate your account");
          return;
        }

        try {
          await registerDevice({ data: { deviceId, userAgent: navigator.userAgent } });
        } catch (devErr) {
          console.warn("device register skipped", devErr);
        }

        toast.success("Welcome to EarnVerse! 50 coins added as joining reward 🎉");
        navigate({ to: "/tasks", replace: true });
        return;
      }

      setVerificationEmail("");
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      try {
        await trackDevice({
          data: { deviceId: getDeviceId(), userAgent: navigator.userAgent },
        });
      } catch (devErr) {
        console.warn("device track skipped", devErr);
      }
      toast.success("Signed in");
      navigate({ to: "/tasks", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (/email not confirmed/i.test(msg)) {
        setVerificationEmail(form.email.trim());
        return;
      }
      toast.error(
        /failed to fetch|network|load failed/i.test(msg)
          ? "Network issue — please check your internet and try again."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  }



  const heading = mode === "signup" ? "Welcome to EarnVerse" : "Good to see you again";
  const subheading =
    mode === "signup"
      ? "Create your account and get 50 coins instantly"
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

          {sentTo ? (
            <div className="space-y-3 py-2 text-center">
              <p className="text-sm font-bold text-foreground">Verify your email</p>
              <p className="text-xs font-medium text-muted-foreground">
                We sent a verification link to <span className="font-bold">{sentTo}</span>. Open the
                link to activate your account, then sign in to get your 50 coins.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSentTo("");
                  setMode("signin");
                }}
                className="w-full rounded-2xl bg-gradient-purple py-3 text-sm font-extrabold text-primary-foreground shadow-pop"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signin" && verificationEmail && (
              <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-3" role="alert">
                <div className="flex gap-2">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-destructive">Email verification required</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      Verify the link sent to {verificationEmail}. Check Spam or Promotions too.
                    </p>
                    <button
                      type="button"
                      disabled={resendBusy}
                      onClick={resendVerification}
                      className="mt-2 text-xs font-extrabold text-primary disabled:opacity-60"
                    >
                      {resendBusy ? "Sending…" : "Resend verification email"}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
            <Field
              icon={<Lock className="h-4 w-4" />}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={set("password")}
              maxLength={72}
            />
            {mode === "signup" && (
              <Field
                icon={<Gift className="h-4 w-4" />}
                placeholder="Referral code (optional)"
                value={form.referral}
                onChange={set("referral")}
                maxLength={12}
                optional
              />
            )}


            {mode === "signin" && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(form.email);
                    setForgotOpen((v) => !v);
                  }}
                  className="text-xs font-bold text-primary"
                >
                  Forgot password?
                </button>
                {forgotOpen && (
                  <div className="mt-2 space-y-2 rounded-2xl bg-muted/50 p-3">
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      type="email"
                      placeholder="Your registered email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      maxLength={255}
                      optional
                    />
                    <button
                      type="button"
                      disabled={forgotBusy}
                      onClick={sendReset}
                      className="w-full rounded-xl bg-gradient-brand py-2.5 text-xs font-extrabold text-primary-foreground disabled:opacity-60"
                    >
                      {forgotBusy ? "Sending…" : "Send reset link"}
                    </button>
                  </div>
                )}
              </div>
            )}


            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl bg-gradient-purple py-3.5 text-base font-extrabold text-primary-foreground shadow-pop transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}

            </button>
          </form>
          )}

          {mode === "signup" && !sentTo && (
            <p className="mt-4 rounded-2xl bg-secondary px-3 py-2.5 text-center text-sm font-semibold text-secondary-foreground">
              🎁 Get 50 coins instantly on registration
            </p>
          )}

          <p className="mt-4 text-center text-xs font-medium leading-relaxed text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/terms" className="font-bold text-primary underline">
              Terms &amp; Conditions
            </Link>
            ,{" "}
            <Link to="/privacy" className="font-bold text-primary underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/refund" className="font-bold text-primary underline">
              Refund &amp; Cancellation Policy
            </Link>
            .
          </p>

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
  optional,
  ...props
}: { icon: React.ReactNode; optional?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/40">
      <span className="text-muted-foreground">{icon}</span>
      <input
        {...props}
        required={!optional}
        className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
      />
    </div>
  );

}
