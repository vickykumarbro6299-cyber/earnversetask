import { describe, expect, test } from "bun:test";
import { TELEGRAM_LINK_BOT, indianTelegramPhone, verifiedOwnContact } from "./telegram-link";
import { hashLinkToken, telegramWebhookSecret, validTelegramWebhook } from "./telegram-link.server";

describe("Telegram linking rules", () => {
  test("links accounts through the separate EarnVerse bot", () => {
    expect(TELEGRAM_LINK_BOT).toBe("EarnVerseTaskSpinWin_bot");
  });
  test("accepts an Indian +91 contact", () => {
    expect(indianTelegramPhone("+919876543210")).toBe("919876543210");
  });
  test("excludes foreign mobile numbers", () => {
    expect(indianTelegramPhone("+14155552671")).toBeNull();
    expect(indianTelegramPhone("+447911123456")).toBeNull();
    expect(indianTelegramPhone("9876543210")).toBeNull();
  });
  test("requires the sender's own Telegram contact", () => {
    expect(verifiedOwnContact(12345, { user_id: 12345, phone_number: "919876543210" })).toBe("919876543210");
    expect(verifiedOwnContact(12345, { user_id: 99999, phone_number: "919876543210" })).toBeNull();
    expect(verifiedOwnContact(12345, { phone_number: "919876543210" })).toBeNull();
  });
  test("rejects forged webhook verification", () => {
    const secret = telegramWebhookSecret("test-connection");
    expect(validTelegramWebhook(secret, secret)).toBe(true);
    expect(validTelegramWebhook("forged", secret)).toBe(false);
    expect(validTelegramWebhook("", secret)).toBe(false);
  });
  test("stores only a SHA256 token hash", () => {
    expect(hashLinkToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});