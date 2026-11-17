/// <reference path="../../node_modules/bun-types/test.d.ts" />
import { describe, expect, test } from "bun:test";
import { eligibleForReferralEvent, isNewbieTitle, REFERRAL_EVENT_COINS, REFERRAL_EVENT_DURATION_MS, referralEventState } from "./referral-event";

describe("publish referral event", () => {
  const start = "2026-11-18T12:00:00Z";
  test("each event reward is 800 coins", () => expect(REFERRAL_EVENT_COINS).toBe(800));
  test("event stays pending before publish", () => expect(referralEventState(null, Date.parse(start))).toBe("pending"));
  test("window lasts exactly 24 hours and excludes its end", () => {
    expect(REFERRAL_EVENT_DURATION_MS).toBe(86400000);
    expect(referralEventState(start, Date.parse(start) + 86399999)).toBe("active");
    expect(referralEventState(start, Date.parse(start) + 86400000)).toBe("ended");
  });
  test("only the NEWBIE title qualifies", () => {
    expect(isNewbieTitle(" newbie ")).toBe(true);
    expect(isNewbieTitle("NEWBIE TASK")).toBe(false);
    expect(isNewbieTitle("Other")).toBe(false);
  });
  test("only approved tasks in the publish window qualify", () => {
    expect(eligibleForReferralEvent("NEWBIE", "approved", start, start)).toBe(true);
    expect(eligibleForReferralEvent("NEWBIE", "pending", start, start)).toBe(false);
    expect(eligibleForReferralEvent("NEWBIE", "rejected", start, start)).toBe(false);
    expect(eligibleForReferralEvent("NEWBIE", "approved", "2026-11-18T11:59:59Z", start)).toBe(false);
    expect(eligibleForReferralEvent("NEWBIE", "approved", "2026-11-19T12:00:00Z", start)).toBe(false);
  });
});