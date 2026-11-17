export const REFERRAL_EVENT_KEY = "newbie_800_v1";
export const REFERRAL_EVENT_COINS = 800;
export const REFERRAL_EVENT_DURATION_MS = 24 * 60 * 60 * 1000;

export function isNewbieTitle(title: string) {
  return title.trim().toUpperCase() === "NEWBIE";
}

export function referralEventState(publishedAt: string | null, now: number) {
  if (!publishedAt) return "pending" as const;
  const start = Date.parse(publishedAt);
  if (!Number.isFinite(start) || now < start) return "pending" as const;
  return now < start + REFERRAL_EVENT_DURATION_MS ? "active" as const : "ended" as const;
}

export function eligibleForReferralEvent(title: string, status: string, reviewedAt: string | null, publishedAt: string | null) {
  return isNewbieTitle(title) && status === "approved" && reviewedAt !== null &&
    referralEventState(publishedAt, Date.parse(reviewedAt)) === "active";
}