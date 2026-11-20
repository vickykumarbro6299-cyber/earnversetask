export const ADSGRAM_BLOCK_ID = "60806";

export interface AdsgramSDK {
  init(options: { blockId: string }): {
    show(): Promise<{ done: boolean; error: boolean }>;
  };
}

declare global {
  interface Window {
    Adsgram?: AdsgramSDK;
  }
}

/** Only a completed rewarded ad unlocks a spin; missing or failed ads do not. */
export async function showRewardedAd(sdk?: AdsgramSDK): Promise<boolean> {
  if (!sdk) return false;
  try {
    const result = await sdk.init({ blockId: ADSGRAM_BLOCK_ID }).show();
    return result.done === true && result.error === false;
  } catch {
    return false;
  }
}