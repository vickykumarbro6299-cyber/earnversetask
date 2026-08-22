import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.meImpl({ userId: context.userId });
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { name: string; mobile: string; dob: string | null; avatarUrl?: string | null }) => d,
  )
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.updateMyProfileImpl({ userId: context.userId }, data);
  });

export const getProfileStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.profileStatsImpl({ userId: context.userId });
  });

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.listTasksImpl({ userId: context.userId });
  });

export const claimTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { taskId: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.claimTaskImpl({ userId: context.userId }, data);
  });

export const submitProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { submissionId: string; proofPath: string; note: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.submitProofImpl({ userId: context.userId }, data);
  });

export const listMyTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.myTasksImpl({ userId: context.userId });
  });

export const getEarningHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.earningHistoryImpl({ userId: context.userId });
  });

export const createUserTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      title: string;
      description: string;
      link: string;
      rewardCoins: number;
      totalSlots: number;
      category?: string;
      sampleImageUrl?: string;
      allowMultiple?: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.createUserTaskImpl({ userId: context.userId }, data);
  });

export const redeemPromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.redeemPromoImpl({ userId: context.userId }, data);
  });

export const adminCreatePromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; coins: number; maxUses: number }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminCreatePromoImpl({ userId: context.userId }, data);
  });

export const adminSetPromoActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; active: boolean }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminSetPromoActiveImpl({ userId: context.userId }, data);
  });


export const createDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rupees: number; utr: string; proofPath?: string | undefined }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.createDepositImpl({ userId: context.userId }, data);
  });

export const createWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rupees: number; method: string; payoutDetail: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.createWithdrawalImpl({ userId: context.userId }, data);
  });


export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.walletImpl({ userId: context.userId });
  });

export const getProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.proofUrlImpl({ userId: context.userId }, data);
  });

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.adminDataImpl({ userId: context.userId });
  });

export const adminCreateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      title: string;
      description: string;
      link: string;
      rewardCoins: number;
      totalSlots: number;
      category?: string;
      sampleImageUrl?: string;
      allowMultiple?: boolean;
    }) => d,

  )

  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminCreateTaskImpl({ userId: context.userId }, data);
  });

export const adminSetTaskActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { taskId: string; active: boolean }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminSetTaskActiveImpl({ userId: context.userId }, data);
  });

export const adminUpdateTaskReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { taskId: string; rewardCoins: number }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminUpdateTaskRewardImpl({ userId: context.userId }, data);
  });

export const adminUpdateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      taskId: string;
      title: string;
      description: string;
      link: string;
      rewardCoins: number;
      totalSlots: number;
      sampleImageUrl: string;
      allowMultiple: boolean;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminUpdateTaskImpl({ userId: context.userId }, data);
  });

export const adminReviewSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; approve: boolean; note?: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminReviewSubmissionImpl({ userId: context.userId }, data);
  });

export const adminReviewDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; approve: boolean }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminReviewDepositImpl({ userId: context.userId }, data);
  });

export const adminReviewWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; approve: boolean; note?: string | undefined }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminReviewWithdrawalImpl({ userId: context.userId }, data);
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { upi: string; name: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminUpdateSettingsImpl({ userId: context.userId }, data);
  });

export const adminSetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; password: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminSetUserPasswordImpl({ userId: context.userId }, data);
  });

export const getReferral = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.referralImpl({ userId: context.userId });
  });


export const listMyCreatedTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.myCreatedTasksImpl({ userId: context.userId });
  });

export const cancelMyTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { taskId: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.cancelMyTaskImpl({ userId: context.userId }, data);
  });

export const adminSetUserCoins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; coins: number }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminSetUserCoinsImpl({ userId: context.userId }, data);
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminDeleteUserImpl({ userId: context.userId }, data);
  });

export const adminUserHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminUserHistoryImpl({ userId: context.userId }, data);
  });

export const cancelMyClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { submissionId: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.cancelMyClaimImpl({ userId: context.userId }, data);
  });

export const adminCancelTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { taskId: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminCancelTaskImpl({ userId: context.userId }, data);
  });

export const checkDevice = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceId: string }) => d)
  .handler(async ({ data }) => {
    const m = await import("./earn.server");
    return m.checkDeviceImpl({
      deviceId: data.deviceId,
      fingerprint: m.requestFingerprint(),
    });
  });

export const registerDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deviceId: string; userAgent?: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.registerDeviceImpl(
      { userId: context.userId },
      { ...data, fingerprint: m.requestFingerprint() },
    );
  });

export const trackDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deviceId: string; userAgent?: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.trackDeviceImpl(
      { userId: context.userId },
      { ...data, fingerprint: m.requestFingerprint() },
    );
  });


export const adminDeviceReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.adminDeviceReportImpl({ userId: context.userId });
  });

export const adminTaskDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { taskId: string }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminTaskDetailImpl({ userId: context.userId }, data);
  });


export const adminReviewTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { taskId: string; approve: boolean }) => d)
  .handler(async ({ context, data }) => {
    const m = await import("./earn.server");
    return m.adminReviewTaskImpl({ userId: context.userId }, data);
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.leaderboardImpl({ userId: context.userId });
  });

export const getDailyBonus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.dailyBonusImpl({ userId: context.userId });
  });

export const claimDailyBonus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./earn.server");
    return m.claimDailyBonusImpl({ userId: context.userId });
  });
