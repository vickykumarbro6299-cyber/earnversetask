export const COINS_PER_RUPEE = 100;
export const MIN_DEPOSIT_COINS = 1000;
export const MIN_WITHDRAW_COINS = 1000;
export const MIN_TASK_REWARD = 50;
export const DEPOSIT_TAX = 0.01;
export const TASK_PLATFORM_FEE = 0.02;
export const ADMIN_EMAIL = "trustmeiamjonathan12@gmail.com";
export const APP_VERSION = "1.0.0";
export const CLAIM_MINUTES = 10;

export const toRupees = (coins: number) => (coins / COINS_PER_RUPEE).toFixed(2);

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
  10, 20, 30, 50, 100, 200, 500,
].map((rupees) => ({ rupees, coins: rupees * COINS_PER_RUPEE }));

export const payableAmount = (rupees: number) =>
  Number((rupees * (1 + DEPOSIT_TAX)).toFixed(2));

export const TASK_CATEGORIES = [
  { key: "video", label: "Video Task" },
  { key: "gmail", label: "Gmail Task" },
  { key: "app", label: "App Task" },
  { key: "other", label: "Other" },
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number]["key"];
