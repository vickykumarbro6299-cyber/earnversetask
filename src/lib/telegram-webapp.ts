type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink?: (url: string) => void;
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

/**
 * Inside Telegram, `window.open` and plain anchor clicks to external sites are
 * blocked, so ad clicks appear to do nothing. Route them through Telegram's
 * own openLink/openTelegramLink so the advertiser page actually opens.
 */
function patchExternalLinkOpening(): void {
  const tg = getTelegramWebApp();
  if (!tg || typeof window === "undefined") return;

  const open = (url: string) => {
    try {
      if (/^(https?:\/\/)?(t\.me|telegram\.me|telegram\.dog)\//i.test(url) && tg.openTelegramLink) {
        tg.openTelegramLink(url);
      } else if (tg.openLink) {
        tg.openLink(url);
      }
    } catch {
      /* ignore */
    }
  };

  if (tg.openLink && !(window as unknown as { __tgOpenPatched?: boolean }).__tgOpenPatched) {
    (window as unknown as { __tgOpenPatched?: boolean }).__tgOpenPatched = true;
    const nativeOpen = window.open.bind(window);
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      const href = typeof url === "string" ? url : url?.toString();
      if (href && /^https?:\/\//i.test(href)) {
        open(href);
        return null;
      }
      return nativeOpen(url as string, target, features);
    }) as typeof window.open;

    // Anchors with target=_blank injected by ad scripts.
    document.addEventListener(
      "click",
      (e) => {
        const el = (e.target as HTMLElement | null)?.closest?.("a") as HTMLAnchorElement | null;
        if (!el) return;
        const href = el.href;
        if (!href || !/^https?:\/\//i.test(href)) return;
        if (el.target !== "_blank" && el.origin === window.location.origin) return;
        e.preventDefault();
        open(href);
      },
      true,
    );
  }
}

/** Prepare the Mini App viewport: full height, no accidental swipe-to-close. */
export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    patchExternalLinkOpening();
  } catch {
    /* ignore */
  }
}
