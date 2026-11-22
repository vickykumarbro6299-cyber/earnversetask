import { afterEach, describe, expect, test } from "bun:test";
import { randomBytes, randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashLinkToken } from "./telegram-link.server";

const ready = Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"] && process.env["SUPABASE_URL"]);
const users: string[] = [];
const hashes: string[] = [];
const suite = ready ? describe : describe.skip;

async function session(options: { telegramId?: number; device?: string; phone?: string; expired?: boolean; owner?: string } = {}) {
  const user = options.owner ?? randomUUID();
  const token = randomBytes(24).toString("hex");
  const hash = hashLinkToken(token);
  users.push(user);
  hashes.push(hash);
  const id = options.telegramId ?? 800000000000 + Math.floor(Math.random() * 1000000000);
  const phone = options.phone ?? `919${String(Math.floor(Math.random() * 1000000000)).padStart(9, "0")}`;
  const { error } = await supabaseAdmin.from("telegram_link_sessions").insert({ token_hash: hash, owner_id: user, device_id: options.device ?? `test_${randomUUID()}`, telegram_id: id, phone, verified_at: new Date().toISOString(), expires_at: new Date(Date.now() + (options.expired ? -60000 : 60000)).toISOString() });
  if (error) throw new Error(error.message);
  return { user, token, id, phone };
}

async function consume(s: { user: string; token: string }) {
  return supabaseAdmin.rpc("consume_telegram_link", { p_token: s.token, p_user_id: s.user, p_signup: false });
}

afterEach(async () => {
  if (!ready) return;
  if (users.length) {
    const { error } = await supabaseAdmin.from("telegram_identities").delete().in("user_id", users);
    if (error) throw error;
  }
  if (hashes.length) {
    const { error } = await supabaseAdmin.from("telegram_link_sessions").delete().in("token_hash", hashes);
    if (error) throw error;
  }
  users.length = 0;
  hashes.length = 0;
});

suite("atomic Telegram account linking", () => {
  test("one Telegram ID links to exactly one account", async () => {
    const first = await session();
    expect((await consume(first)).error).toBeNull();
    const second = await session({ telegramId: first.id });
    expect((await consume(second)).error?.message).toContain("already linked");
    const { data } = await supabaseAdmin.from("telegram_identities").select("user_id").eq("telegram_id", first.id);
    expect(data?.map((row) => row.user_id)).toEqual([first.user]);
  });
  test("the same device cannot link a second account", async () => {
    const device = `test_${randomUUID()}`;
    expect((await consume(await session({ device }))).error).toBeNull();
    expect((await consume(await session({ device }))).error?.message).toContain("already linked");
  });
  test("the same Indian phone cannot link a second account", async () => {
    const first = await session();
    expect((await consume(first)).error).toBeNull();
    expect((await consume(await session({ phone: first.phone }))).error?.message).toContain("already linked");
  });
  test("foreign numbers cannot be linked even through direct payout-independent calls", async () => {
    expect((await consume(await session({ phone: "14155552671" }))).error?.message).toContain("Indian");
  });
  test("verification is single-use and cannot be replayed", async () => {
    const value = await session();
    expect((await consume(value)).error).toBeNull();
    expect((await consume(value)).error?.message).toContain("already used");
  });
  test("expired verification cannot link an account", async () => {
    expect((await consume(await session({ expired: true }))).error?.message).toContain("expired");
  });
  test("a user cannot consume another user's verification", async () => {
    const value = await session();
    expect((await consume({ ...value, user: randomUUID() })).error?.message).toContain("another account");
  });
});