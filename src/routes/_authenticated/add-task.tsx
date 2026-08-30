import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactElement } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { SamplePhotoInput } from "@/components/sample-photo";
import {
  TelegramLogo,
  InstagramLogo,
  YouTubeLogo,
  FacebookLogo,
  AppLogo,
  OtherLogo,
} from "@/components/social-logos";
import { useMe, useRefreshAll } from "@/lib/use-earn";
import { createUserTask } from "@/lib/earn.functions";
import {
  MIN_TASK_REWARD,
  TASK_PLATFORM_FEE,
  CATEGORY_MIN_REWARD,
  NO_LINK_CATEGORIES,
  VIDEO_TASK_DESCRIPTION,
  SHORTS_TASK_DESCRIPTION,
  autoDescription,
  minSlotsFor,
} from "@/lib/earn-constants";

export const Route = createFileRoute("/_authenticated/add-task")({
  head: () => ({
    meta: [
      { title: "Grow Your Platform — Add a Task on EarnVerse" },
      {
        name: "description",
        content:
          "Choose a platform, add your task details and get real, active users from EarnVerse.",
      },
      { property: "og:title", content: "Grow Your Platform — EarnVerse" },
      {
        property: "og:description",
        content: "Publish a task and get real users for your platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddTaskPage,
});

type Platform = {
  key: string;
  label: string;
  category: string;
  Logo: (p: { className?: string }) => ReactElement;
};

const PLATFORMS: Platform[] = [
  { key: "youtube", label: "YouTube", category: "video", Logo: YouTubeLogo },
  { key: "facebook", label: "Facebook", category: "other", Logo: FacebookLogo },
  { key: "instagram", label: "Instagram", category: "other", Logo: InstagramLogo },
  { key: "app", label: "App Task", category: "app", Logo: AppLogo },
  { key: "telegram", label: "Telegram", category: "telegram", Logo: TelegramLogo },
  { key: "other", label: "Other", category: "other", Logo: OtherLogo },
];

function AddTaskPage() {
  const me = useMe();
  const coins = me.data?.profile?.coins ?? 0;
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  function pickPlatform(p: Platform) {
    setPlatform(p);
    setCategory(p.key === "youtube" ? null : p.category);
  }

  const canContinue = !!platform && !!category;

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="bg-gradient-purple px-4 py-5">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="text-primary-foreground"
              aria-label="Back to platform selection"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link to="/tasks" className="text-primary-foreground" aria-label="Back to tasks">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div>
            <h1 className="text-lg font-extrabold text-primary-foreground">
              Grow Your Platform
            </h1>
            <p className="text-xs text-primary-foreground/80">
              Get real and active users with EarnVerse
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-5">
        {step === 1 ? (
          <>
            <h2 className="text-center text-base font-extrabold text-foreground">
              Choose Platform
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {PLATFORMS.map((p) => {
                const selected = platform?.key === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => pickPlatform(p)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-card p-4 shadow-card transition active:scale-95 ${
                      selected ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <p.Logo className="h-10 w-10" />
                    <span className="text-sm font-extrabold text-foreground">{p.label}</span>
                  </button>
                );
              })}
            </div>

            {platform?.key === "youtube" && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory("video")}
                  className={`rounded-2xl border-2 px-3 py-3 text-sm font-extrabold transition active:scale-95 ${
                    category === "video"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent bg-card text-foreground shadow-card"
                  }`}
                >
                  Long Video
                  <span className="block text-[10px] font-semibold opacity-70">
                    2 min watch • min {CATEGORY_MIN_REWARD["video"]} coins
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("shorts")}
                  className={`rounded-2xl border-2 px-3 py-3 text-sm font-extrabold transition active:scale-95 ${
                    category === "shorts"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent bg-card text-foreground shadow-card"
                  }`}
                >
                  Shorts Video
                  <span className="block text-[10px] font-semibold opacity-70">
                    10 sec watch • min {CATEGORY_MIN_REWARD["shorts"]} coins
                  </span>
                </button>
              </div>
            )}

            <button
              disabled={!canContinue}
              onClick={() => setStep(2)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 font-extrabold text-primary-foreground shadow-card active:scale-95 disabled:opacity-50"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          <TaskDetailsForm
            key={category}
            category={category!}
            platformLabel={
              platform?.key === "youtube"
                ? category === "video"
                  ? "YouTube • Long Video"
                  : "YouTube • Shorts Video"
                : (platform?.label ?? "Task")
            }
            coins={coins}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function TaskDetailsForm({
  category,
  platformLabel,
  coins,
}: {
  category: string;
  platformLabel: string;
  coins: number;
}) {
  const createFn = useServerFn(createUserTask);
  const refresh = useRefreshAll();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: autoDescription(category) ?? "",
    link: "",
    rewardCoins: CATEGORY_MIN_REWARD[category] ?? MIN_TASK_REWARD,
    totalSlots: minSlotsFor(category),
    category,
    sampleImageUrl: "",
    allowMultiple: false,
  });
  const [busy, setBusy] = useState(false);
  const minReward = CATEGORY_MIN_REWARD[category] ?? MIN_TASK_REWARD;
  const minSlots = minSlotsFor(category);
  const base = form.rewardCoins * form.totalSlots;
  const feePct = Math.round(TASK_PLATFORM_FEE * 100);
  const total = Math.ceil(base * (1 + TASK_PLATFORM_FEE));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.rewardCoins < minReward)
        throw new Error(`Minimum reward for this task is ${minReward} coins`);
      if (form.totalSlots < minSlots)
        throw new Error(`Minimum ${minSlots} slots required for this task`);
      if (!form.sampleImageUrl) throw new Error("Please upload a sample screenshot");
      if (total > coins) throw new Error("Not enough coins in wallet");
      await createFn({ data: form });
      toast.success(
        `Task sent for review • ${total} coins deducted. It goes live after admin approval.`,
      );
      refresh();
      navigate({ to: "/creator-studio" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create task");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 ring-ring/40";

  return (
    <div>
      <p className="rounded-xl bg-secondary px-3 py-2 text-center text-xs font-extrabold text-secondary-foreground">
        {platformLabel} • minimum {minReward} coins/slot • {feePct}% platform fee
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          className={input}
          placeholder="Task title"
          required
          maxLength={100}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        {(category === "video" || category === "shorts") && (
          <p className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground">
            {category === "video"
              ? "Long video rules are pre-filled. Submitting before 2 minutes = failed submission."
              : "Shorts rules are pre-filled. Submitting before 10 seconds = failed submission."}
          </p>
        )}
        <textarea
          className={input}
          placeholder="Full instructions — how should the user complete this task?"
          rows={4}
          maxLength={600}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {!NO_LINK_CATEGORIES.includes(category) && (
          <input
            className={input}
            placeholder="Task link"
            maxLength={300}
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
        )}
        <SamplePhotoInput
          value={form.sampleImageUrl}
          onChange={(p) => setForm((f) => ({ ...f, sampleImageUrl: p }))}
        />
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, allowMultiple: !f.allowMultiple }))}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-bold ${
            form.allowMultiple
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Allow Multiple Times
          <span className="text-xs font-semibold">{form.allowMultiple ? "ON" : "OFF"}</span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-muted-foreground">
            Reward coins (min {minReward})
            <input
              type="number"
              min={minReward}
              className={input}
              value={form.rewardCoins}
              onChange={(e) => setForm({ ...form, rewardCoins: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Task limit (min {minSlots} slots)
            <input
              type="number"
              min={minSlots}
              className={input}
              value={form.totalSlots}
              onChange={(e) => setForm({ ...form, totalSlots: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
          Total cost: {base} + {feePct}% fee ={" "}
          <span className="text-primary">{total} coins</span>
          <div className="text-xs font-medium text-muted-foreground">
            Your balance: {coins} coins
          </div>
        </div>
        <button
          disabled={busy}
          className="w-full rounded-xl bg-gradient-purple py-3 font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit Task for Review"}
        </button>
      </form>
    </div>
  );
}
