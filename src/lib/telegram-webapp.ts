type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  isExpanded?: boolean;
  platform?: string;
  initData?: string;
};

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  return tg ?? null;
}

/** True when the app is being rendered inside the Telegram Mini App container. */
export function isTelegramMiniApp(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.platform && tg.platform !== "unknown");
}

/** Prepare the Mini App viewport: full height, no accidental swipe-to-close. */
export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
  } catch {
    /* ignore */
  }
}
