import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Wallet,
  Gift,
  Play,
  Info,
  X,
  PartyPopper,
  Calculator,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { getMathQuizState, startMathQuiz, answerMathQuiz } from "@/lib/earn.functions";

export const Route = createFileRoute("/_authenticated/math-quiz")({
  head: () => ({
    meta: [
      { title: "Math Quiz — EarnVerse" },
      {
        name: "description",
        content:
          "Watch an ad to unlock a two-digit math quiz on EarnVerse — answer correctly and win 10 to 50 coins. Up to 10 quizzes daily.",
      },
      { property: "og:title", content: "Math Quiz — EarnVerse" },
      {
        property: "og:description",
        content: "Solve quick math quizzes on EarnVerse and collect coins daily.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MathQuizPage,
});

type Quiz = { id: string; a: number; b: number; options: number[]; reward: number };
type AnswerResult = { correct: boolean; coins: number; correctAnswer: number };

declare global {
  interface Window {
    show_11729008?: (type?: "pop") => Promise<unknown>;
  }
}

/** Plays a rewarded ad. Resolves true when the ad was watched, false otherwise. */
async function showRewardedAd(type?: "pop"): Promise<boolean> {
  const fn = window.show_11729008;
  if (typeof fn !== "function") return false;
  try {
    await fn(type);
    return true;
  } catch {
    return false;
  }
}

function MathQuizPage() {
  const queryClient = useQueryClient();
  const fetchState = useServerFn(getMathQuizState);
  const startFn = useServerFn(startMathQuiz);
  const answerFn = useServerFn(answerMathQuiz);
  const q = useQuery({ queryKey: ["math-quiz-state"], queryFn: () => fetchState() });

  const [busy, setBusy] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [pending, setPending] = useState<AnswerResult | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const coins = q.data?.coins ?? 0;
  const remaining = q.data?.remaining ?? 10;
  const limit = q.data?.limit ?? 10;
  const earnedToday = q.data?.earnedToday ?? 0;
  const answered = pending ?? result;

  // 20-second cooldown between rounds.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const unlockQuiz = async () => {
    if (busy || cooldown > 0) return;
    if (remaining <= 0) {
      toast.error("Daily quiz limit reached. Come back tomorrow!");
      return;
    }
    setBusy(true);
    try {
      const res = (await startFn()) as Quiz & { remaining: number };
      setQuiz({ id: res.id, a: res.a, b: res.b, options: res.options, reward: res.reward });
      setPicked(null);
      setPending(null);
      setResult(null);
      void queryClient.invalidateQueries({ queryKey: ["math-quiz-state"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start quiz — try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async (choice: number) => {
    if (!quiz || answered || busy) return;
    setPicked(choice);
    setBusy(true);
    try {
      const res = (await answerFn({ data: { quizId: quiz.id, choice } })) as AnswerResult;
      setPending(res);
      void queryClient.invalidateQueries({ queryKey: ["math-quiz-state"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit answer");
      setPicked(null);
    } finally {
      setBusy(false);
    }
  };

  const collectCoins = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      if (pending.correct && pending.coins > 0) {
        const watched = await showRewardedAd();
        if (!watched) {
          toast.error("Ad not completed — please watch the full ad to collect your coins.");
          return;
        }
      }
      setResult(pending);
      setPending(null);
      setQuiz(null);
      setPicked(null);
      setCooldown(20);
      void queryClient.invalidateQueries({ queryKey: ["math-quiz-state"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    } finally {
      setBusy(false);
    }
  };

  const optionClass = (opt: number) => {
    if (!answered)
      return picked === opt
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border bg-card text-foreground active:scale-95";
    if (opt === answered.correctAnswer) return "border-success bg-success/15 text-success";
    if (opt === picked && !answered.correct)
      return "border-destructive bg-destructive/15 text-destructive";
    return "border-border bg-card text-muted-foreground opacity-60";
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="bg-gradient-purple px-4 pb-6 pt-8">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            to="/tasks"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-primary-foreground">Math Quiz</h1>
        </div>
      </div>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground">
          Math Quiz Challenge
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary">
              <Wallet className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Total Balance
              </p>
              <p className="truncate text-xl font-extrabold text-foreground">
                {coins.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-success">
              <Gift className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                FREE ({remaining}/{limit})
              </p>
              <p className="truncate text-xl font-extrabold text-success">+{earnedToday} today</p>
            </div>
          </div>
        </div>

        {!quiz ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-success/15 px-4 py-4">
            <Calculator className="h-6 w-6 text-success" />
            <p className="text-base font-extrabold text-success">
              {remaining <= 0
                ? "Daily quiz limit reached. Come back tomorrow."
                : cooldown > 0
                  ? `Next quiz unlocks in ${cooldown}s`
                  : "Start a quiz and win coins!"}
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Solve &amp; win {quiz.reward} coins
            </p>
            <p className="mt-3 text-center text-4xl font-extrabold tracking-tight text-foreground">
              {quiz.a} + {quiz.b} = ?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {quiz.options.map((opt) => (
                <button
                  key={opt}
                  disabled={!!answered || busy}
                  onClick={() => submitAnswer(opt)}
                  className={`rounded-2xl border-2 py-4 text-xl font-extrabold transition-all ${optionClass(opt)}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {answered && (
              <div className="mt-4 space-y-3">
                <p
                  className={`flex items-center justify-center gap-2 text-base font-extrabold ${
                    answered.correct ? "text-success" : "text-destructive"
                  }`}
                >
                  {answered.correct ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Correct! +{answered.coins} coins
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" /> Wrong! Answer was {answered.correctAnswer}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {!quiz && (
          <button
            onClick={unlockQuiz}
            disabled={busy || remaining <= 0 || cooldown > 0}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-brand py-4 text-lg font-extrabold uppercase tracking-wide text-primary-foreground shadow-pop active:scale-95 disabled:opacity-60"
          >
            <Play className="h-6 w-6" />
            {cooldown > 0
              ? `Next Quiz in ${cooldown}s`
              : busy
                ? "Please wait…"
                : "Start Quiz"}
          </button>
        )}

        <div className="flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm font-semibold text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Answer a two-digit math quiz, then watch a short ad to collect your coins. Correct
            answer wins 10–50 coins, added straight to your EarnVerse wallet. You get up to {limit}{" "}
            quizzes a day.
          </p>
        </div>
      </main>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-6">
          <div className="w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-pop">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
              <Gift className="h-8 w-8 text-gold" />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-foreground">
              {pending.correct ? `You Won ${pending.coins} Coins 🎉` : "Wrong Answer!"}
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {pending.correct
                ? "Watch a short ad to collect your coins."
                : `The correct answer was ${pending.correctAnswer}.`}
            </p>
            <button
              onClick={collectCoins}
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 font-extrabold text-primary-foreground active:scale-95 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {busy ? "Loading Ad…" : pending.correct ? "Watch Ad & Collect" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {result?.correct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-6">
          <div className="w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-pop">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <PartyPopper className="h-8 w-8 text-success" />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-foreground">
              {result.coins} Coins Credited ✅
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Coins have been added to your wallet.
            </p>
            <button
              onClick={() => setResult(null)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 font-extrabold text-primary-foreground active:scale-95"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
