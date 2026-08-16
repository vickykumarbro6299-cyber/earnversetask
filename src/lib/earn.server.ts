import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  DEPOSIT_PACKS,
  WITHDRAW_PACKS,
  CLAIM_MINUTES,
  payableAmount,
  TASK_CATEGORIES,
  CATEGORY_MIN_REWARD,
  CATEGORY_MIN_WATCH_SECONDS,
} from "./earn-constants";

export const COINS_PER_RUPEE = 100;
export const MIN_DEPOSIT_COINS = 1000;
export const MIN_WITHDRAW_COINS = 1500;
export const MIN_TASK_REWARD = 20;
export const DEPOSIT_TAX = 0.01;
export const TASK_PLATFORM_FEE = 0.06;
export const REFERRAL_RATE = 0.03;


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

/** Recalculate a task's claimed slots from real submissions (never releases finished work). */
async function recountTask(taskId: string) {
  await supabaseAdmin.rpc("recount_task_slots", { p_task_id: taskId });
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
    await recountTask(taskId);
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
  // Atomic: the database locks the task row so two users can never take the same slot.
  const { error } = await supabaseAdmin.rpc("claim_task_slot", {
    p_task_id: data.taskId,
    p_user_id: userId,
    p_minutes: CLAIM_MINUTES,
  });
  if (error) throw new Error(error.message.replace(/^.*?:\s*/, "") || "Could not claim task");
  return { ok: true };
}

/** User cancels a claimed (not yet submitted) task — the slot goes back to the pool. */
export async function cancelMyClaimImpl({ userId }: Ctx, data: { submissionId: string }) {
  const { data: sub, error } = await supabaseAdmin
    .from("submissions")
    .select("id, task_id, submitted_at, status")
    .eq("id", data.submissionId)
    .eq("user_id", userId)
    .single();
  if (error) throw new Error("Claim not found");
  if (sub.submitted_at || sub.status !== "pending")
    throw new Error("This task can no longer be cancelled");

  await supabaseAdmin.from("submissions").delete().eq("id", sub.id).eq("user_id", userId);
  await recountTask(sub.task_id);
  return { ok: true };
}




export async function submitProofImpl(
  { userId }: Ctx,
  data: { submissionId: string; proofPath: string; note: string },
) {
  const { data: sub, error: subErr } = await supabaseAdmin
    .from("submissions")
    .select("*, tasks(category)")
    .eq("id", data.submissionId)
    .eq("user_id", userId)
    .single();
  if (subErr) throw subErr;
  if (sub.submitted_at) throw new Error("Already submitted");

  const category = (sub.tasks as { category: string } | null)?.category;
  const heldSeconds = (Date.now() - new Date(sub.claimed_at).getTime()) / 1000;
  const minWatch = category ? (CATEGORY_MIN_WATCH_SECONDS[category] ?? 0) : 0;
  if (minWatch && heldSeconds < minWatch) {
    await supabaseAdmin
      .from("submissions")
      .update({
        proof_url: data.proofPath,
        note: data.note,
        submitted_at: new Date().toISOString(),
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.submissionId);
    await releaseTaskSlot(sub.task_id);
    throw new Error(
      `Failed submission — you must watch the video for at least ${
        minWatch >= 60 ? `${minWatch / 60} minutes` : `${minWatch} seconds`
      } before submitting proof`,
    );
  }

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

/** Approved task earnings + deposits/withdrawals as one chronological ledger. */
export async function earningHistoryImpl({ userId }: Ctx) {
  const [subs, deps, wds] = await Promise.all([
    supabaseAdmin
      .from("submissions")
      .select("id, reward_coins, status, reviewed_at, submitted_at, tasks(title, category)")
      .eq("user_id", userId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false }),
    supabaseAdmin
      .from("deposits")
      .select("id, coins, amount_inr, status, created_at")
      .eq("user_id", userId),
    supabaseAdmin
      .from("withdrawals")
      .select("id, coins, amount_inr, method, status, created_at, admin_note")
      .eq("user_id", userId),
  ]);

  type Entry = {
    id: string;
    kind: "task" | "deposit" | "withdrawal";
    title: string;
    coins: number;
    status: string;
    date: string;
    note: string | null;
  };

  const items: Entry[] = [
    ...(subs.data ?? []).map((s) => ({
      id: s.id,
      kind: "task" as const,
      title: (s.tasks as { title: string } | null)?.title ?? "Task",
      coins: s.status === "approved" ? s.reward_coins : 0,
      status: s.status,
      date: s.reviewed_at ?? s.submitted_at ?? new Date().toISOString(),
      note: null,
    })),
    ...(deps.data ?? []).map((d) => ({
      id: d.id,
      kind: "deposit" as const,
      title: `Deposit • ₹${d.amount_inr}`,
      coins: d.status === "approved" ? d.coins : 0,
      status: d.status,
      date: d.created_at,
      note: null,
    })),
    ...(wds.data ?? []).map((w) => ({
      id: w.id,
      kind: "withdrawal" as const,
      title: `Withdrawal • ${w.method} • ₹${w.amount_inr}`,
      coins: w.status === "rejected" ? 0 : -w.coins,
      status: w.status,
      date: w.created_at,
      note: w.admin_note ?? null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalEarned = (subs.data ?? [])
    .filter((s) => s.status === "approved")
    .reduce((n, s) => n + s.reward_coins, 0);
  const totalWithdrawn = (wds.data ?? [])
    .filter((w) => w.status === "approved")
    .reduce((n, w) => n + w.coins, 0);

  return { items, totalEarned, totalWithdrawn };
}

export async function createUserTaskImpl(
  { userId }: Ctx,
  data: {
    title: string;
    description: string;
    link: string;
    rewardCoins: number;
    totalSlots: number;
    category?: string;
    sampleImageUrl?: string;
    allowMultiple?: boolean;
  },
) {
  const category = normalizeCategory(data.category);
  const min = CATEGORY_MIN_REWARD[category] ?? MIN_TASK_REWARD;
  if (data.rewardCoins < min)
    throw new Error(`Minimum reward for this category is ${min} coins`);
  if (data.totalSlots < 1) throw new Error("At least 1 slot required");
  if (!data.sampleImageUrl) throw new Error("Sample photo is required");
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
    category,
    sample_image_url: data.sampleImageUrl,
    allow_multiple: !!data.allowMultiple,
  });
  if (error) {
    await addCoins(userId, total);
    throw error;
  }
  return { charged: total };
}


export async function createDepositImpl(
  { userId }: Ctx,
  data: { rupees: number; utr: string; proofPath?: string | undefined },
) {
  const pack = DEPOSIT_PACKS.find((p) => p.rupees === data.rupees);
  if (!pack) throw new Error("Please choose a valid coin pack");
  const amount = payableAmount(pack.rupees);
  const { error } = await supabaseAdmin.from("deposits").insert({
    user_id: userId,
    coins: pack.coins,
    amount_inr: amount,
    utr: data.utr,
    proof_url: data.proofPath ?? null,
  });
  if (error) throw error;
  return { amount, coins: pack.coins };
}

export async function createWithdrawalImpl(
  { userId }: Ctx,
  data: { rupees: number; method: string; payoutDetail: string },
) {
  const pack = WITHDRAW_PACKS.find((p) => p.rupees === data.rupees);
  if (!pack) throw new Error("Please choose a valid withdrawal amount");
  if (pack.coins < MIN_WITHDRAW_COINS)
    throw new Error(`You can withdraw after reaching ${MIN_WITHDRAW_COINS} coins`);
  const amount = Number(pack.rupees.toFixed(2));
  await addCoins(userId, -pack.coins);
  const { error } = await supabaseAdmin.from("withdrawals").insert({
    user_id: userId,
    coins: pack.coins,
    amount_inr: amount,
    method: data.method,
    payout_detail: data.payoutDetail,
  });
  if (error) {
    await addCoins(userId, pack.coins);
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
  const [users, subs, deps, wds, tasks, settings, promos] = await Promise.all([
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
    supabaseAdmin.from("promo_codes").select("*").order("created_at", { ascending: false }),
  ]);
  const map: Record<string, string> = {};
  (settings.data ?? []).forEach((s) => (map[s.key] = s.value));

  const depRows = deps.data ?? [];
  const wdRows = wds.data ?? [];
  const subRows = subs.data ?? [];
  const userRows = users.data ?? [];

  const sum = <T,>(rows: T[], pick: (r: T) => number) => rows.reduce((n, r) => n + pick(r), 0);

  const overview = {
    totalUsers: userRows.length,
    totalCoins: sum(userRows, (u) => u.coins),
    totalTasks: (tasks.data ?? []).length,
    activeTasks: (tasks.data ?? []).filter((t) => t.active).length,
    pendingProofs: subRows.filter((s) => s.status === "pending").length,
    depositApprovedInr: sum(
      depRows.filter((d) => d.status === "approved"),
      (d) => Number(d.amount_inr),
    ),
    depositPending: depRows.filter((d) => d.status === "pending").length,
    withdrawApprovedInr: sum(
      wdRows.filter((w) => w.status === "approved"),
      (w) => Number(w.amount_inr),
    ),
    withdrawPending: wdRows.filter((w) => w.status === "pending").length,
    coinsPaidOut: sum(
      subRows.filter((s) => s.status === "approved"),
      (s) => s.reward_coins,
    ),
  };

  return {
    users: userRows,
    submissions: await withUser(subRows as never[]),
    deposits: await withUser(depRows as never[]),
    withdrawals: await withUser(wdRows as never[]),
    tasks: tasks.data ?? [],
    settings: map,
    promoCodes: promos.data ?? [],
    overview,
  };
}

/* ---------------- promo codes ---------------- */

export async function adminCreatePromoImpl(
  { userId }: Ctx,
  data: { code: string; coins: number; maxUses: number },
) {
  await requireAdmin(userId);
  const code = data.code.trim().toUpperCase();
  if (code.length < 3) throw new Error("Code must be at least 3 characters");
  if (data.coins < 1) throw new Error("Coins must be at least 1");
  const { error } = await supabaseAdmin.from("promo_codes").insert({
    code,
    coins: Math.floor(data.coins),
    max_uses: Math.max(1, Math.floor(data.maxUses)),
  });
  if (error) throw new Error("This promo code already exists");
  return { ok: true };
}

export async function adminSetPromoActiveImpl(
  { userId }: Ctx,
  data: { id: string; active: boolean },
) {
  await requireAdmin(userId);
  await supabaseAdmin.from("promo_codes").update({ active: data.active }).eq("id", data.id);
  return { ok: true };
}

export async function redeemPromoImpl({ userId }: Ctx, data: { code: string }) {
  const code = data.code.trim().toUpperCase();
  const { data: promo } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!promo || !promo.active) throw new Error("Invalid promo code");
  if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now())
    throw new Error("This promo code has expired");
  if (promo.used_count >= promo.max_uses) throw new Error("This promo code is fully used");

  const { error: redErr } = await supabaseAdmin
    .from("promo_redemptions")
    .insert({ promo_id: promo.id, user_id: userId, coins: promo.coins });
  if (redErr) throw new Error("You have already used this promo code");

  await supabaseAdmin
    .from("promo_codes")
    .update({ used_count: promo.used_count + 1 })
    .eq("id", promo.id);
  await addCoins(userId, promo.coins);
  return { coins: promo.coins };
}

export async function adminCreateTaskImpl(
  { userId }: Ctx,
  data: {
    title: string;
    description: string;
    link: string;
    rewardCoins: number;
    totalSlots: number;
    category?: string;
    sampleImageUrl?: string;
    allowMultiple?: boolean;
  },
) {
  await requireAdmin(userId);
  if (!data.sampleImageUrl) throw new Error("Sample photo is required");
  const { error } = await supabaseAdmin.from("tasks").insert({
    title: data.title,
    description: data.description,
    link: data.link || null,
    reward_coins: data.rewardCoins,
    total_slots: data.totalSlots,
    created_by: userId,
    is_admin_task: true,
    category: normalizeCategory(data.category),
    sample_image_url: data.sampleImageUrl,
    allow_multiple: !!data.allowMultiple,
  });

  if (error) throw error;
  return { ok: true };

}

/** Admin: update the reward coins of any task. */
export async function adminUpdateTaskRewardImpl(
  { userId }: Ctx,
  data: { taskId: string; rewardCoins: number },
) {
  await requireAdmin(userId);
  const coins = Math.floor(data.rewardCoins);
  if (!Number.isFinite(coins) || coins < 1) throw new Error("Enter a valid coin amount");
  const { error } = await supabaseAdmin
    .from("tasks")
    .update({ reward_coins: coins })
    .eq("id", data.taskId);
  if (error) throw error;
  return { ok: true };
}

/** Admin edits an existing task (details + sample screenshots). */
export async function adminUpdateTaskImpl(
  { userId }: Ctx,
  data: {
    taskId: string;
    title: string;
    description: string;
    link: string;
    rewardCoins: number;
    totalSlots: number;
    sampleImageUrl: string;
    allowMultiple: boolean;
  },
) {
  await requireAdmin(userId);
  const { data: task } = await supabaseAdmin
    .from("tasks")
    .select("claimed_count")
    .eq("id", data.taskId)
    .maybeSingle();
  if (!task) throw new Error("Task not found");

  const title = data.title.trim();
  if (!title) throw new Error("Title is required");
  const coins = Math.floor(data.rewardCoins);
  if (!Number.isFinite(coins) || coins < 1) throw new Error("Enter a valid coin amount");
  const slots = Math.floor(data.totalSlots);
  if (!Number.isFinite(slots) || slots < 1) throw new Error("Enter valid slots");
  if (slots < task.claimed_count)
    throw new Error(`Slots cannot be less than already claimed (${task.claimed_count})`);
  if (!data.sampleImageUrl.trim()) throw new Error("At least one sample photo is required");

  const { error } = await supabaseAdmin
    .from("tasks")
    .update({
      title,
      description: data.description,
      link: data.link || null,
      reward_coins: coins,
      total_slots: slots,
      sample_image_url: data.sampleImageUrl,
      allow_multiple: data.allowMultiple,
    })
    .eq("id", data.taskId);
  if (error) throw error;
  await recountTask(data.taskId);
  return { ok: true };
}

export async function adminSetTaskActiveImpl(
  { userId }: Ctx,
  data: { taskId: string; active: boolean },
) {
  await requireAdmin(userId);
  await supabaseAdmin
    .from("tasks")
    .update({ disabled: !data.active, active: data.active })
    .eq("id", data.taskId);
  await recountTask(data.taskId);
  return { ok: true };
}

/** Admin cancels any task and refunds the creator for the slots nobody used. */
export async function adminCancelTaskImpl({ userId }: Ctx, data: { taskId: string }) {
  await requireAdmin(userId);
  await expireStaleClaims();
  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", data.taskId)
    .single();
  if (error) throw new Error("Task not found");

  const unusedSlots = Math.max(0, task.total_slots - task.claimed_count);
  const refund = task.is_admin_task || !task.created_by ? 0 : unusedSlots * task.reward_coins;

  await supabaseAdmin
    .from("tasks")
    .update({ disabled: true, active: false, total_slots: task.claimed_count })
    .eq("id", task.id);

  if (refund > 0 && task.created_by) await addCoins(task.created_by, refund);
  return { refund, unusedSlots };
}


/** Pay 10% lifetime commission to the referrer of `earnerId`. */
async function payReferralCommission(earnerId: string, earnedCoins: number) {
  if (earnedCoins <= 0) return;
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("referred_by")
    .eq("id", earnerId)
    .maybeSingle();
  const referrer = prof?.referred_by;
  if (!referrer) return;
  const bonus = Math.floor(earnedCoins * REFERRAL_RATE);
  if (bonus <= 0) return;
  await addCoins(referrer, bonus);
  await supabaseAdmin.from("referral_earnings").insert({
    referrer_id: referrer,
    referred_id: earnerId,
    coins: bonus,
    source: "task",
  });
}

/** Give the reserved slot back to the pool (recalculated from real submissions). */
async function releaseTaskSlot(taskId: string) {
  await recountTask(taskId);
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
  if (data.approve) {
    await addCoins(sub.user_id, sub.reward_coins);
    await payReferralCommission(sub.user_id, sub.reward_coins);
  } else {
    await releaseTaskSlot(sub.task_id);
  }
  await supabaseAdmin
    .from("submissions")
    .update({
      status: data.approve ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", data.id);
  return { ok: true };
}

export async function referralImpl({ userId }: Ctx) {
  const { data: me } = await supabaseAdmin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  const [{ data: invited }, { data: earnings }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, name, created_at")
      .eq("referred_by", userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("referral_earnings").select("referred_id, coins").eq("referrer_id", userId),
  ]);

  const perUser: Record<string, number> = {};
  (earnings ?? []).forEach((e) => {
    perUser[e.referred_id] = (perUser[e.referred_id] ?? 0) + e.coins;
  });

  return {
    code: me?.referral_code ?? "",
    rate: REFERRAL_RATE,
    totalCoins: (earnings ?? []).reduce((n, e) => n + e.coins, 0),
    invites: (invited ?? []).map((u) => ({
      id: u.id,
      name: u.name || "EarnVerse User",
      joinedAt: u.created_at,
      coins: perUser[u.id] ?? 0,
    })),
  };
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
  data: { id: string; approve: boolean; note?: string | undefined },
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
      admin_note: data.note?.trim() ? data.note.trim() : null,
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
  const isSample = data.path.includes("/samples/");
  const admin = isSample ? false : await isAdmin(userId);
  if (!isSample && !admin && !data.path.startsWith(`${userId}/`))
    throw new Error("Forbidden");

  const { data: signed, error } = await supabaseAdmin.storage
    .from("proofs")
    .createSignedUrl(data.path, 60 * 10);
  if (error) throw error;
  return { url: signed.signedUrl };
}

export async function adminSetUserPasswordImpl(
  { userId }: Ctx,
  data: { targetUserId: string; password: string },
) {
  await requireAdmin(userId);
  if (data.password.length < 6) throw new Error("Password must be at least 6 characters");
  const { error } = await supabaseAdmin.auth.admin.updateUserById(data.targetUserId, {
    password: data.password,
  });
  if (error) throw error;
  return { ok: true };
}

/* ---------------- creator studio ---------------- */

export async function myCreatedTasksImpl({ userId }: Ctx) {
  await expireStaleClaims();
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("created_by", userId)
    .eq("is_admin_task", false)
    .order("created_at", { ascending: false });

  const ids = (tasks ?? []).map((t) => t.id);
  const counts: Record<string, { pending: number; approved: number; rejected: number }> = {};
  if (ids.length) {
    const { data: subs } = await supabaseAdmin
      .from("submissions")
      .select("task_id, status")
      .in("task_id", ids);
    (subs ?? []).forEach((s) => {
      const c = (counts[s.task_id] ??= { pending: 0, approved: 0, rejected: 0 });
      c[s.status as "pending" | "approved" | "rejected"] += 1;
    });
  }

  return {
    items: (tasks ?? []).map((t) => ({
      ...t,
      stats: counts[t.id] ?? { pending: 0, approved: 0, rejected: 0 },
      refundable: Math.max(0, t.total_slots - t.claimed_count) * t.reward_coins,
    })),
  };
}

/** Cancel own task — refund coins for slots that were never used (platform fee is not refunded). */
export async function cancelMyTaskImpl({ userId }: Ctx, data: { taskId: string }) {
  await expireStaleClaims();
  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", data.taskId)
    .eq("created_by", userId)
    .single();
  if (error) throw new Error("Task not found");
  if (task.is_admin_task) throw new Error("This task cannot be cancelled");
  if (!task.active && task.claimed_count >= task.total_slots)
    throw new Error("This task is already finished");

  const unusedSlots = Math.max(0, task.total_slots - task.claimed_count);
  const refund = unusedSlots * task.reward_coins;

  await supabaseAdmin
    .from("tasks")
    .update({ disabled: true, active: false, total_slots: task.claimed_count })
    .eq("id", task.id);


  if (refund > 0) await addCoins(userId, refund);
  return { refund, unusedSlots };
}

/* ---------------- admin user management ---------------- */

export async function adminSetUserCoinsImpl(
  { userId }: Ctx,
  data: { targetUserId: string; coins: number },
) {
  await requireAdmin(userId);
  const coins = Math.floor(data.coins);
  if (!Number.isFinite(coins) || coins < 0) throw new Error("Enter a valid coin balance");
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ coins })
    .eq("id", data.targetUserId);
  if (error) throw error;
  return { coins };
}

export async function adminDeleteUserImpl(
  { userId }: Ctx,
  data: { targetUserId: string },
) {
  await requireAdmin(userId);
  if (data.targetUserId === userId) throw new Error("You cannot delete your own account");
  if (await isAdmin(data.targetUserId)) throw new Error("Admin accounts cannot be deleted");
  const { error } = await supabaseAdmin.auth.admin.deleteUser(data.targetUserId);
  if (error) throw error;
  return { ok: true };
}

/** Admin: read any user's earning / deposit / withdrawal ledger. */
export async function adminUserHistoryImpl(
  { userId }: Ctx,
  data: { targetUserId: string },
) {
  await requireAdmin(userId);
  return earningHistoryImpl({ userId: data.targetUserId });
}

/* ---------------- admin task detail ---------------- */

export async function adminTaskDetailImpl({ userId }: Ctx, data: { taskId: string }) {
  await requireAdmin(userId);
  const { data: task } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", data.taskId)
    .maybeSingle();
  if (!task) throw new Error("Task not found");

  const { data: creator } = task.created_by
    ? await supabaseAdmin
        .from("profiles")
        .select("id,name,email,mobile,coins")
        .eq("id", task.created_by)
        .maybeSingle()
    : { data: null };

  const { data: subs } = await supabaseAdmin
    .from("submissions")
    .select("id,status,user_id,claimed_at,submitted_at")
    .eq("task_id", data.taskId);

  const rows = subs ?? [];
  return {
    task,
    creator: creator ?? null,
    stats: {
      total: rows.length,
      pending: rows.filter((s) => s.status === "pending").length,
      approved: rows.filter((s) => s.status === "approved").length,
      rejected: rows.filter((s) => s.status === "rejected").length,
    },
  };
}

/* ---------------- device / multi-account guard ---------------- */

/** Hash of browser + network signals — survives localStorage/app-data clears. */
export function serverFingerprint(userAgent: string, ip: string) {
  const raw = `${(userAgent ?? "").trim()}|${(ip ?? "").trim()}`;
  if (!raw.replace("|", "").trim()) return "";
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `fp_${h.toString(16)}_${raw.length}`;
}

/** Reads the incoming request headers and builds the server-side device signature. */
export function requestFingerprint() {
  const ua = getRequestHeader("user-agent") ?? "";
  const ip =
    getRequestHeader("cf-connecting-ip") ??
    (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
    getRequestHeader("x-real-ip") ??
    "";
  return serverFingerprint(ua, ip);
}


/** Public check used before sign-up: has any account already been created on this device? */
export async function checkDeviceImpl(data: { deviceId: string; fingerprint?: string }) {
  const id = (data.deviceId ?? "").trim();
  const fp = (data.fingerprint ?? "").trim();

  if (id) {
    const { count, error } = await supabaseAdmin
      .from("device_accounts")
      .select("id", { count: "exact", head: true })
      .eq("device_id", id);
    if (error) throw error;
    if ((count ?? 0) > 0) return { blocked: true };
  }
  if (fp) {
    const { count, error } = await supabaseAdmin
      .from("device_accounts")
      .select("id", { count: "exact", head: true })
      .eq("fingerprint", fp);
    if (error) throw error;
    if ((count ?? 0) > 0) return { blocked: true };
  }
  return { blocked: false };
}

/**
 * Called right after sign-up. If the device already belongs to another account the
 * freshly created account is removed again and the caller gets the warning.
 */
export async function registerDeviceImpl(
  { userId }: Ctx,
  data: { deviceId: string; userAgent?: string; fingerprint?: string },
) {
  const id = (data.deviceId ?? "").trim();
  const fp = (data.fingerprint ?? "").trim();
  if (!id && !fp) return { ok: true };

  const { data: registeredUser, error } = await supabaseAdmin.rpc("register_device_account", {
    p_device_id: id,
    p_user_id: userId,
    p_user_agent: (data.userAgent ?? "").slice(0, 300),
    p_fingerprint: fp,
  });
  if (error) throw error;

  if (registeredUser && registeredUser !== userId) {
    if (!(await isAdmin(userId))) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(
        "Multiple Accounts in same device Warning — We Couldn't Create A New Account For You.",
      );
    }
    return { ok: true };
  }
  return { ok: true };
}


/** Admin: devices that carry more than one account. */
export async function adminDeviceReportImpl({ userId }: Ctx) {
  await requireAdmin(userId);
  const { data: rows, error } = await supabaseAdmin
    .from("device_accounts")
    .select("device_id, fingerprint, user_id, user_agent, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const allRows = rows ?? [];
  const parent = allRows.map((_, index) => index);
  const root = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const seen = new Map<string, number>();
  allRows.forEach((row, index) => {
    [row.device_id && `device:${row.device_id}`, row.fingerprint && `fingerprint:${row.fingerprint}`]
      .filter((key): key is string => Boolean(key))
      .forEach((key) => {
        const previous = seen.get(key);
        if (previous === undefined) seen.set(key, index);
        else parent[root(index)] = root(previous);
      });
  });
  const byDevice = new Map<number, typeof allRows>();
  allRows.forEach((row, index) => {
    const key = root(index);
    byDevice.set(key, [...(byDevice.get(key) ?? []), row]);
  });
  const flagged = [...byDevice.values()].filter(
    (list) => new Set(list.map((row) => row.user_id)).size > 1,
  );
  const ids = [...new Set(flagged.flatMap((list) => list.map((r) => r.user_id)))];
  const { data: profiles } = ids.length
    ? await supabaseAdmin.from("profiles").select("id,name,email,mobile,coins").in("id", ids)
    : { data: [] };
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));

  return {
    totalDevices: byDevice.size,
    groups: flagged.map((list) => ({
      deviceId: list[0]?.device_id || list[0]?.fingerprint || "Unknown device",
      userAgent: list[0]?.user_agent ?? "",
      accounts: list.map((r) => ({
        userId: r.user_id,
        createdAt: r.created_at,
        profile: map.get(r.user_id) ?? null,
      })),
    })),
  };
}
