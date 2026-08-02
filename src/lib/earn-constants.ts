export const COINS_PER_RUPEE = 100;
export const MIN_DEPOSIT_COINS = 1000;
export const MIN_WITHDRAW_COINS = 1000;
export const MIN_TASK_REWARD = 50;
export const DEPOSIT_TAX = 0.01;
export const TASK_PLATFORM_FEE = 0.02;
export const ADMIN_EMAIL = "trustmeiamjonathan12@gmail.com";
export const APP_VERSION = "1.0.0";

export const toRupees = (coins: number) => (coins / COINS_PER_RUPEE).toFixed(2);
