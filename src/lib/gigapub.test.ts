import { expect, test } from "bun:test";
import { showRewardedAd } from "./gigapub";

test("completed GigaPub ad unlocks the reward", async () => {
  expect(await showRewardedAd(async () => undefined)).toBe(true);
});

test("missing or failed ads do not unlock the reward", async () => {
  expect(await showRewardedAd()).toBe(false);
  expect(await showRewardedAd(async () => { throw new Error("skipped"); })).toBe(false);
});
