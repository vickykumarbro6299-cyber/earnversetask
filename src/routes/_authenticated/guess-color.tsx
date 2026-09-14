import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  CheckCircle2,
  Gift,
  Info,
  Palette,
  PartyPopper,
  Play,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import {
  answerGuessColor,
  collectGuessColorReward,
  getGuessColorState,
  startGuessColor,
} from "@/lib/earn.functions";

export const Route = createFileRoute("/_authenticated/guess-color")({
  head: () => ({
    meta: [
      { title: "Guess Color — EarnVerse" },
      {
        name: "description",
        content: "Watch an ad, find the requested color, and collect 10 coins on EarnVerse.",
      },
      { property: "og:title", content: "Guess Color — EarnVerse" },
      {
        property: "og:description",
        content: "Find the correct color and collect coins on EarnVerse.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuessColorPage,
});

type ColorOption = { name: string; value: string };
type ColorRound = { id: string; targetColor: string; options: ColorOption[]; reward: number };
type AnswerResult = { roundId: string; correct: boolean; coins: number; correctAnswer: string };
const COOLDOWN_KEY = "earnverse:guess-color-cooldown-until";

declare global {
  interface Window {
    show_11729008?: () => Promise<unknown>;
  }
}

async function showRewardedAd() {
  const ad = window.show_11729008;
  if (typeof ad !== "function") return false;
  try {
    await ad();
    return true;
  } catch {
    return false;
  }
}

function saveCooldown() {
  const until = Date.now() + 20_000;
  try {
    window.localStorage.setItem(COOLDOWN_KEY, String(until));
  } catch {
    /* in-memory fallback */
  }
  return 20;
}

function GuessColorPage() {
  const queryClient = useQueryClient();
  const fetchState = useServerFn(getGuessColorState);
  const startRound = useServerFn(startGuessColor);
  const answerRound = useServerFn(answerGuessColor);
  const collectReward = useServerFn(collectGuessColorReward);
  const q = useQuery({ queryKey: ["guess-color-state"], queryFn: () => fetchState() });
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState<ColorRound | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [pending, setPending] = useState<AnswerResult | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const remaining = q.data?.remaining ?? 10;
  const limit = q.data?.limit ?? 10;
  const answered = pending ?? result;

  useEffect(() => {
    const update = () => {
      let until = 0;
      try {
        until = Number(window.localStorage.getItem(COOLDOWN_KEY) ?? 0);
      } catch {
        return;
      }
      const seconds = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setCooldown(seconds);
      if (seconds === 0 && until > 0) window.localStorage.removeItem(COOLDOWN_KEY);
    };
    update();
    const timer = window.setInterval(update, 500);
    return () => window.clearInterval(timer);
  }, []);

  async function unlockRound() {
    if (busy || cooldown > 0 || remaining <= 0) return;
    setBusy(true);
    try {
      if (!(await showRewardedAd())) {
        toast.error("Ad not completed — watch the full ad to unlock.");
        return;
      }
      const data = (await startRound()) as ColorRound;
      setRound(data);
      setPicked(null);
      setPending(null);
      setResult(null);
      void queryClient.invalidateQueries({ queryKey: ["guess-color-state"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start round");
    } finally {
      setBusy(false);
    }
  }

  async function chooseColor(choice: string) {
    if (!round || answered || busy) return;
    setPicked(choice);
    setBusy(true);
    try {
      const data = (await answerRound({ data: { roundId: round.id, choice } })) as AnswerResult;
      setPending(data);
      void queryClient.invalidateQueries({ queryKey: ["guess-color-state"] });
    } catch (error) {
      setPicked(null);
      toast.error(error instanceof Error ? error.message : "Could not submit answer");
    } finally {
      setBusy(false);
    }
  }

  async function collectCoins() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      if (pending.correct) {
        if (!(await showRewardedAd())) {
          toast.error("Ad not completed — watch the full ad to collect coins.");
          return;
        }
        await collectReward({ data: { roundId: pending.roundId } });
      }
      setResult(pending);
      setPending(null);
      setRound(null);
      setPicked(null);
      setCooldown(saveCooldown());
      void queryClient.invalidateQueries({ queryKey: ["guess-color-state"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not collect coins");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="bg-gradient-purple px-4 pb-6 pt-8">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            to="/tasks"
            aria-label="Back to tasks"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-primary-foreground">Guess Color</h1>
        </div>
      </header>
      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        <h2 className="text-center text-3xl font-extrabold text-foreground">Color Challenge</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <Wallet className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Balance</p>
              <p className="text-xl font-extrabold text-foreground">
                {(q.data?.coins ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <Gift className="h-6 w-6 text-success" />
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Free ({remaining}/{limit})
              </p>
              <p className="text-xl font-extrabold text-success">
                +{q.data?.earnedToday ?? 0} today
              </p>
            </div>
          </div>
        </div>
        {!round ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-success/15 px-4 py-4">
            <Palette className="h-6 w-6 text-success" />
            <p className="font-extrabold text-success">
              {remaining <= 0
                ? "Daily limit reached. Come back tomorrow."
                : cooldown > 0
                  ? `Next round unlocks in ${cooldown}s`
                  : "Find the right color and win 10 coins!"}
            </p>
          </div>
        ) : (
          <section className="rounded-3xl bg-card p-5 shadow-card">
            <p className="text-center text-xs font-bold uppercase text-muted-foreground">
              Correct answer wins {round.reward} coins
            </p>
            <p className="mt-3 text-center text-3xl font-extrabold text-foreground">
              Find {round.targetColor} Colour
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {round.options.map((option) => {
                const stateClass = !answered
                  ? "border-border bg-card"
                  : option.name === answered.correctAnswer
                    ? "border-success bg-success/15"
                    : option.name === picked
                      ? "border-destructive bg-destructive/15"
                      : "border-border opacity-50";
                return (
                  <button
                    key={option.name}
                    aria-label={option.name}
                    disabled={!!answered || busy}
                    onClick={() => chooseColor(option.name)}
                    className={`flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border-2 p-4 transition active:scale-95 ${stateClass}`}
                  >
                    <span
                      className="h-16 w-16 rounded-full border-4 border-background shadow-card"
                      style={{ backgroundColor: option.value }}
                    />
                    <span className="font-extrabold text-foreground">{option.name}</span>
                  </button>
                );
              })}
            </div>
            {answered && (
              <p
                className={`mt-4 flex items-center justify-center gap-2 font-extrabold ${answered.correct ? "text-success" : "text-destructive"}`}
              >
                {answered.correct ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Correct! +10 coins
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" /> Wrong! It was {answered.correctAnswer}
                  </>
                )}
              </p>
            )}
          </section>
        )}
        {!round && (
          <button
            onClick={unlockRound}
            disabled={busy || remaining <= 0 || cooldown > 0}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-brand py-4 text-lg font-extrabold uppercase text-primary-foreground shadow-pop disabled:opacity-60"
          >
            <Play className="h-6 w-6" />
            {cooldown > 0
              ? `Next Round in ${cooldown}s`
              : busy
                ? "Loading Ad…"
                : "Watch Ad & Unlock"}
          </button>
        )}
        <div className="flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm font-semibold text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Watch an ad to unlock a round. Select the requested color, then watch another ad to
            collect 10 coins. Up to {limit} rounds daily.
          </p>
        </div>
      </main>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 px-6">
          <div className="w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-pop">
            <Gift className="mx-auto h-14 w-14 text-gold" />
            <p className="mt-3 text-2xl font-extrabold text-foreground">
              {pending.correct ? "You Won 10 Coins" : "Wrong Color!"}
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {pending.correct
                ? "Watch a short ad to collect your coins."
                : `The correct color was ${pending.correctAnswer}.`}
            </p>
            <button
              onClick={collectCoins}
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 font-extrabold text-primary-foreground disabled:opacity-60"
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
            <PartyPopper className="mx-auto h-14 w-14 text-success" />
            <p className="mt-3 text-2xl font-extrabold text-foreground">10 Coins Credited</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Coins have been added to your wallet.
            </p>
            <button
              onClick={() => setResult(null)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 font-extrabold text-primary-foreground"
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
