export const TELEGRAM_LINK_BOT = "EarnVerseTaskSpinWin_bot";

export function indianTelegramPhone(phone: string): string | null {
  const digits = phone.replace(/^\+/, "");
  return /^91[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function verifiedOwnContact(senderId: number, contact: { user_id?: number | undefined; phone_number: string }): string | null {
  if (!Number.isSafeInteger(senderId) || senderId <= 0 || contact.user_id !== senderId) return null;
  return indianTelegramPhone(contact.phone_number);
}

export type TelegramVerification = { token: string; telegramId: string; mobile: string };