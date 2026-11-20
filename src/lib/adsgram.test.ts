import { expect, test } from "bun:test";
import { showRewardedAd, type AdsgramSDK } from "./adsgram";

test("Spin & Win requests AdsGram block 60806", async () => {
  let requestedBlock = "";
  const sdk: AdsgramSDK = {
    init: ({ blockId }) => {
      requestedBlock = blockId;
      return { show: async () => ({ done: true, error: false }) };
    },
  };
  expect(await showRewardedAd(sdk)).toBe(true);
  expect(requestedBlock).toBe("60806");
});

test("unavailable, skipped and failed ads do not unlock a spin", async () => {
  expect(await showRewardedAd()).toBe(false);
  for (const result of [{ done: false, error: false }, { done: true, error: true }]) {
    expect(await showRewardedAd({ init: () => ({ show: async () => result }) })).toBe(false);
  }
  expect(await showRewardedAd({ init: () => ({ show: async () => { throw new Error("Ad skipped"); } }) })).toBe(false);
});