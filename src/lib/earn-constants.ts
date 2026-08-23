export const COINS_PER_RUPEE = 100;
export const MIN_DEPOSIT_COINS = 1000;
export const MIN_WITHDRAW_COINS = 1500;
/** Users can request at most this many withdrawals per 24 hours. */
export const MAX_WITHDRAWALS_PER_DAY = 2;
export const MIN_TASK_REWARD = 20;
export const DEPOSIT_TAX = 0.01;
export const TASK_PLATFORM_FEE = 0.06;
export const ADMIN_EMAIL = "trustmeiamjonathan12@gmail.com";
export const APP_VERSION = "1.0.0";
export const CLAIM_MINUTES = 12;
export const TELEGRAM_CHANNEL = "https://t.me/EarnVerseTask";

export const toRupees = (coins: number) => (coins / COINS_PER_RUPEE).toFixed(2);

/** Time-of-day greeting shown on the tasks dashboard. */
export function greeting(date: Date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 17) return "Good Afternoon";
  if (h >= 17 && h < 21) return "Good Evening";
  return "Good Night";
}

/** Maximum screenshots a user can upload per sample / proof submission. */
export const MAX_SCREENSHOTS = 3;

export const PROMOTE_TAGLINE =
  "Grown Your Own Platform And Get Real And Active Users With EarnVerse.";

/** Fixed deposit packs — users can only buy these. rupees -> coins */
export const DEPOSIT_PACKS: { rupees: number; coins: number }[] = [
  { rupees: 10, coins: 900 },
  { rupees: 20, coins: 1900 },
  { rupees: 30, coins: 2800 },
  { rupees: 50, coins: 5000 },
  { rupees: 100, coins: 10000 },
  { rupees: 200, coins: 20000 },
  { rupees: 500, coins: 50000 },
];

/** Fixed withdrawal packs — users can only withdraw these amounts. */
export const WITHDRAW_PACKS: { rupees: number; coins: number }[] = [
  { coins: 1500, rupees: 10 },
  { coins: 3000, rupees: 25 },
  { coins: 5500, rupees: 50 },
  { coins: 11000, rupees: 100 },
];

export const payableAmount = (rupees: number) =>
  Number((rupees * (1 + DEPOSIT_TAX)).toFixed(2));

export const TASK_CATEGORIES = [
  { key: "video", label: "Long Video" },
  { key: "shorts", label: "Shorts Video" },
  { key: "gmail", label: "Gmail Task" },
  { key: "app", label: "App Task" },
  { key: "telegram", label: "Telegram Task" },
  { key: "other", label: "Other" },
] as const;

/** Minimum reward coins a user must offer per task category. */
export const CATEGORY_MIN_REWARD: Record<string, number> = {
  video: 20,
  shorts: 20,
  gmail: 2000,
  app: 300,
  telegram: 20,
  other: 50,
};

/** Categories where a task link makes no sense. */
export const NO_LINK_CATEGORIES = ["gmail"];

/** Categories exempt from the 10-slot minimum. */
export const LOW_SLOT_CATEGORIES = ["gmail", "telegram"];

/** Minimum slots a user must offer when adding a task. */
export const DEFAULT_MIN_SLOTS = 10;

export const minSlotsFor = (category: string) =>
  LOW_SLOT_CATEGORIES.includes(category) ? 1 : DEFAULT_MIN_SLOTS;

/** Fixed instructions auto-filled for Video tasks. */
export const VIDEO_TASK_DESCRIPTION = `1. Click on Start Task
2. Watch Video Atleast 2 Minutes
3. Like Comment Subscribe The Channel
4. Task Screenshot And Submit

Note: Submitting before 2 minutes will be marked as a failed submission.`;

/** Long video tasks must be watched for at least this long before proof is accepted. */
export const VIDEO_MIN_WATCH_SECONDS = 120;

/** Shorts video tasks must be watched for at least this long before proof is accepted. */
export const SHORTS_MIN_WATCH_SECONDS = 10;

/** Minimum watch time (seconds) enforced per task category. */
export const CATEGORY_MIN_WATCH_SECONDS: Record<string, number> = {
  video: VIDEO_MIN_WATCH_SECONDS,
  shorts: SHORTS_MIN_WATCH_SECONDS,
};

/** Fixed instructions auto-filled for Shorts video tasks. */
export const SHORTS_TASK_DESCRIPTION = `1. Click on Start Task
2. Watch The Shorts Video Atleast 10 Seconds
3. Like Comment Subscribe The Channel
4. Task Screenshot And Submit

Note: Submitting before 10 seconds will be marked as a failed submission.`;

/** Auto-filled description for a category, if any. */
export function autoDescription(category: string): string | null {
  if (category === "video") return VIDEO_TASK_DESCRIPTION;
  if (category === "shorts") return SHORTS_TASK_DESCRIPTION;
  return null;
}

export type TaskCategory = (typeof TASK_CATEGORIES)[number]["key"];


/** Public site URL used for shareable links (referral, profile). */
export const SITE_URL = "https://earnverse.life";
