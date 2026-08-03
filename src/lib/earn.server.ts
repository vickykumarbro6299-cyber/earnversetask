import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  DEPOSIT_PACKS,
  WITHDRAW_PACKS,
  CLAIM_MINUTES,
  payableAmount,
  TASK_CATEGORIES,
} from "./earn-constants";

export const COINS_PER_RUPEE = 100;
export const MIN_DEPOSIT_COINS = 1000;
export const MIN_WITHDRAW_COINS = 1000;
export const MIN_TASK_REWARD = 50;
export const DEPOSIT_TAX = 0.01;
export const TASK_PLATFORM_FEE = 0.02;

const VALID_CATEGORIES = TASK_CATEGORIES.map((c) => c.key) as readonly string[];
const normalizeCategory = (c: string | undefined) =>
  c && VALID_CATEGORIES.includes(c) ? c : "other";

type Ctx = { userId: string };


export async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

async function requireAdmin(userId: string) {
  if (!(await isAdmin(userId))) throw new Error("Forbidden: admin only");
}

async function getCoins(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("coins")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data.coins;
}

async function addCoins(userId: string, delta: number) {
  const current = await getCoins(userId);
  const next = current + delta;
  if (next < 0) throw new Error("Not enough coins");
  const { error } = await supabaseAdmin.from("profiles").update({ coins: next }).eq("id", userId);
  if (error) throw error;
  return next;
}

/* ---------------- user side ---------------- */

export async function meImpl({ userId }: Ctx) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const { data: settings } = await supabaseAdmin.from("app_settings").select("*");
  const map: Record<string, string> = {};
  (settings ?? []).forEach((s) => (map[s.key] = s.value));
  return { profile, isAdmin: await isAdmin(userId), settings: map };
}

/** Release reservations that were not submitted within CLAIM_MINUTES. */
export async function expireStaleClaims() {
  const { data: stale } = await supabaseAdmin
    .from("submissions")
    .select("id, task_id")
    .eq("status", "pending")
    .is("submitted_at", null)
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString());

  if (!stale?.length) return;

  await supabaseAdmin
    .from("submissions")
    .delete()
    .in(
      "id",
      stale.map((s) => s.id),
    );

  for (const taskId of [...new Set(stale.map((s) => s.task_id))]) {
    const freed = stale.filter((s) => s.task_id === taskId).length;
    const { data: task } = await supabaseAdmin
      .from("tasks")
      .select("claimed_count, total_slots")
      .eq("id", taskId)
      .maybeSingle();
    if (!task) continue;
    const next = Math.max(0, task.claimed_count - freed);
    await supabaseAdmin
      .from("tasks")
      .update({ claimed_count: next, active: next < task.total_slots })
      .eq("id", taskId);
  }
}

export async function listTasksImpl({ userId }: Ctx) {
  await expireStaleClaims();
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  const { data: mine } = await supabaseAdmin
    .from("submissions")
    .select("*")
    .eq("user_id", userId);
  return { tasks: tasks ?? [], mySubmissions: mine ?? [] };
}

export async function myTasksImpl({ userId }: Ctx) {
  await expireStaleClaims();
  const { data } = await supabaseAdmin
    .from("submissions")
    .select("*, tasks(*)")
    .eq("user_id", userId)
    .order("claimed_at", { ascending: false });
  return { items: data ?? [] };
}

export async function claimTaskImpl({ userId }: Ctx, data: { taskId: string }) {
  await expireStaleClaims();
  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", data.taskId)
    .single();
  if (error) throw error;
  if (!task.active) throw new Error("Task closed");
  if (task.claimed_count >= task.total_slots) throw new Error("No slots left");
  if (task.created_by === userId) throw new Error("You cannot claim your own task");

  const { error: insErr } = await supabaseAdmin.from("submissions").insert({
    task_id: task.id,
    user_id: userId,
    reward_coins: task.reward_coins,
    expires_at: new Date(Date.now() + CLAIM_MINUTES * 60_000).toISOString(),
  });
  if (insErr) throw new Error("Already claimed");

  await supabaseAdmin
    .from("tasks")
    .update({
      claimed_count: task.claimed_count + 1,
      active: task.claimed_count + 1 < task.total_slots,
    })
    .eq("id", task.id);
  return { ok: true };
}


export async function submitProofImpl(
  { userId }: Ctx,
  data: { submissionId: string; proofPath: string; note: string },
) {
  const { error } = await supabaseAdmin
    .from("submissions")
    .update({
      proof_url: data.proofPath,
      note: data.note,
      submitted_at: new Date().toISOString(),
      status: "pending",
    })
    .eq("id", data.submissionId)
    .eq("user_id", userId);
  if (error) throw error;
  return { ok: true };
}

export async function createUserTaskImpl(
  { userId }: Ctx,
  data: {
    title: string;
    description: string;
    link: string;
    rewardCoins: number;
    totalSlots: number;
  },
) {
  if (data.rewardCoins < MIN_TASK_REWARD)
    throw new Error(`Minimum reward is ${MIN_TASK_REWARD} coins`);
  if (data.totalSlots < 1) throw new Error("At least 1 slot required");
  const base = data.rewardCoins * data.totalSlots;
  const total = Math.ceil(base * (1 + TASK_PLATFORM_FEE));
  await addCoins(userId, -total);
  const { error } = await supabaseAdmin.from("tasks").insert({
    title: data.title,
    description: data.description,
    link: data.link || null,
    reward_coins: data.rewardCoins,
    total_slots: data.totalSlots,
    created_by: userId,
    is_admin_task: false,
  });
  if (error) {
    await addCoins(userId, total);
    throw error;
  }
  return { charged: total };
}

export async function createDepositImpl(
  { userId }: Ctx,
  data: { coins: number; utr: string },
) {
  if (data.coins < MIN_DEPOSIT_COINS)
    throw new Error(`Minimum deposit is ${MIN_DEPOSIT_COINS} coins`);
  const amount = Number(((data.coins / COINS_PER_RUPEE) * (1 + DEPOSIT_TAX)).toFixed(2));
  const { error } = await supabaseAdmin
    .from("deposits")
    .insert({ user_id: userId, coins: data.coins, amount_inr: amount, utr: data.utr });
  if (error) throw error;
  return { amount };
}

export async function createWithdrawalImpl(
  { userId }: Ctx,
  data: { coins: number; method: string; payoutDetail: string },
) {
  if (data.coins < MIN_WITHDRAW_COINS)
    throw new Error(`You can withdraw after reaching ${MIN_WITHDRAW_COINS} coins`);
  const amount = Number((data.coins / COINS_PER_RUPEE).toFixed(2));
  await addCoins(userId, -data.coins);
  const { error } = await supabaseAdmin.from("withdrawals").insert({
    user_id: userId,
    coins: data.coins,
    amount_inr: amount,
    method: data.method,
    payout_detail: data.payoutDetail,
  });
  if (error) {
    await addCoins(userId, data.coins);
    throw error;
  }
  return { amount };
}

export async function walletImpl({ userId }: Ctx) {
  const { data: deposits } = await supabaseAdmin
    .from("deposits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const { data: withdrawals } = await supabaseAdmin
    .from("withdrawals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { deposits: deposits ?? [], withdrawals: withdrawals ?? [] };
}

/* ---------------- admin side ---------------- */

async function withUser<T extends { user_id: string }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (!ids.length) return rows.map((r) => ({ ...r, user: null }));
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,name,email,mobile,coins")
    .in("id", ids);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, user: map.get(r.user_id) ?? null }));
}

export async function adminDataImpl({ userId }: Ctx) {
  await requireAdmin(userId);
  const [users, subs, deps, wds, tasks, settings] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
    supabaseAdmin
      .from("submissions")
      .select("*, tasks(title, reward_coins)")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false }),
    supabaseAdmin.from("deposits").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("withdrawals").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("tasks").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("app_settings").select("*"),
  ]);
  const map: Record<string, string> = {};
  (settings.data ?? []).forEach((s) => (map[s.key] = s.value));
  return {
    users: users.data ?? [],
    submissions: await withUser((subs.data ?? []) as never[]),
    deposits: await withUser((deps.data ?? []) as never[]),
    withdrawals: await withUser((wds.data ?? []) as never[]),
    tasks: tasks.data ?? [],
    settings: map,
  };
}

export async function adminCreateTaskImpl(
  { userId }: Ctx,
  data: {
    title: string;
    description: string;
    link: string;
    rewardCoins: number;
    totalSlots: number;
  },
) {
  await requireAdmin(userId);
  const { error } = await supabaseAdmin.from("tasks").insert({
    title: data.title,
    description: data.description,
    link: data.link || null,
    reward_coins: data.rewardCoins,
    total_slots: data.totalSlots,
    created_by: userId,
    is_admin_task: true,
  });
  if (error) throw error;
  return { ok: true };
}

export async function adminSetTaskActiveImpl(
  { userId }: Ctx,
  data: { taskId: string; active: boolean },
) {
  await requireAdmin(userId);
  await supabaseAdmin.from("tasks").update({ active: data.active }).eq("id", data.taskId);
  return { ok: true };
}

export async function adminReviewSubmissionImpl(
  { userId }: Ctx,
  data: { id: string; approve: boolean },
) {
  await requireAdmin(userId);
  const { data: sub, error } = await supabaseAdmin
    .from("submissions")
    .select("*")
    .eq("id", data.id)
    .single();
  if (error) throw error;
  if (sub.status !== "pending") throw new Error("Already reviewed");
  if (data.approve) await addCoins(sub.user_id, sub.reward_coins);
  await supabaseAdmin
    .from("submissions")
    .update({
      status: data.approve ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", data.id);
  return { ok: true };
}

export async function adminReviewDepositImpl(
  { userId }: Ctx,
  data: { id: string; approve: boolean },
) {
  await requireAdmin(userId);
  const { data: dep, error } = await supabaseAdmin
    .from("deposits")
    .select("*")
    .eq("id", data.id)
    .single();
  if (error) throw error;
  if (dep.status !== "pending") throw new Error("Already reviewed");
  if (data.approve) await addCoins(dep.user_id, dep.coins);
  await supabaseAdmin
    .from("deposits")
    .update({
      status: data.approve ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", data.id);
  return { ok: true };
}

export async function adminReviewWithdrawalImpl(
  { userId }: Ctx,
  data: { id: string; approve: boolean },
) {
  await requireAdmin(userId);
  const { data: wd, error } = await supabaseAdmin
    .from("withdrawals")
    .select("*")
    .eq("id", data.id)
    .single();
  if (error) throw error;
  if (wd.status !== "pending") throw new Error("Already reviewed");
  if (!data.approve) await addCoins(wd.user_id, wd.coins);
  await supabaseAdmin
    .from("withdrawals")
    .update({
      status: data.approve ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", data.id);
  return { ok: true };
}

export async function adminUpdateSettingsImpl(
  { userId }: Ctx,
  data: { upi: string; name: string },
) {
  await requireAdmin(userId);
  await supabaseAdmin
    .from("app_settings")
    .upsert([
      { key: "deposit_upi", value: data.upi },
      { key: "deposit_name", value: data.name },
    ]);
  return { ok: true };
}

export async function proofUrlImpl({ userId }: Ctx, data: { path: string }) {
  const admin = await isAdmin(userId);
  if (!admin && !data.path.startsWith(`${userId}/`)) throw new Error("Forbidden");
  const { data: signed, error } = await supabaseAdmin.storage
    .from("proofs")
    .createSignedUrl(data.path, 60 * 10);
  if (error) throw error;
  return { url: signed.signedUrl };
}
