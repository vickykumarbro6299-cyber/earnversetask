declare global {
  interface Window {
    showGiga?: () => Promise<unknown>;
  }
}

/** Only a GigaPub ad that resolves (completed) counts; missing or failed ads do not. */
export async function showRewardedAd(show?: () => Promise<unknown>): Promise<boolean> {
  if (!show) return false;
  try {
    await show();
    return true;
  } catch {
    return false;
  }
}
