import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  DEPOSIT_PACKS,
  WITHDRAW_PACKS,
  CLAIM_MINUTES,
  payableAmount,
  TASK_CATEGORIES,
  CATEGORY_MIN_REWARD,
  VIDEO_MIN_WATCH_SECONDS,
} from "./earn-constants";

export const COINS_PER_RUPEE = 100;
export const MIN_DEPOSIT_COINS = 1000;
export const MIN_WITHDRAW_COINS = 1500;
export const MIN_TASK_REWARD = 20;
export const DEPOSIT_TAX = 0.01;
export const TASK_PLATFORM_FEE = 0.13;

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

  const { data: existing } = await supabaseAdmin
    .from("submissions")
    .select("id, submitted_at, status")
    .eq("task_id", task.id)
    .eq("user_id", userId);

  if (existing?.length) {
    const open = existing.some((s) => !s.submitted_at || s.status === "pending");
    if (open) throw new Error("You already have this task in progress");
    if (!task.allow_multiple) throw new Error("Already claimed");
  }

  const { error: insErr } = await supabaseAdmin.from("submissions").insert({
    task_id: task.id,
    user_id: userId,
    reward_coins: task.reward_coins,
    expires_at: new Date(Date.now() + CLAIM_MINUTES * 60_000).toISOString(),
  });
  if (insErr) throw new Error("Could not claim task");

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
  if (category === "video" && heldSeconds < VIDEO_MIN_WATCH_SECONDS) {
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
    throw new Error(
      "Failed submission — you must watch the video for at least 2 minutes before submitting proof",
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
  const admin = await isAdmin(userId);
  if (!admin && !data.path.startsWith(`${userId}/`)) throw new Error("Forbidden");
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
