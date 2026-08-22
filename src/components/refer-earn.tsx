import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Copy, Gift, Link2, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { getReferral } from "@/lib/earn.functions";
import { CoinIcon } from "@/components/brand";

export function ReferEarn() {
  const fn = useServerFn(getReferral);
  const { data } = useQuery({ queryKey: ["referral"], queryFn: () => fn() });
  const [showList, setShowList] = useState(false);

  const code = data?.code ?? "";
  const goal = data?.taskGoal ?? 10;
  const bonus = data?.bonusCoins ?? 200;
  const link =
    code && typeof window !== "undefined" ? `${window.location.origin}/auth?ref=${code}` : "";

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const share = async () => {
    const text = `Join EarnVerse and start earning! Use my referral code ${code}\n${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "EarnVerse", text, url: link });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copy(text, "Invite link");
  };

  return (
    <section className="mt-4 rounded-2xl bg-card p-4 shadow-card">
      <h2 className="flex items-center gap-2 font-extrabold text-foreground">
        <Gift className="h-5 w-5 text-primary" /> Refer &amp; Earn
      </h2>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        Share your link and get <span className="font-bold text-foreground">{bonus} coins</span> per
        referral, plus <span className="font-bold text-foreground">3% lifetime commission</span> on
        every task your friends complete.
      </p>

      <div className="mt-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5">
        <p className="flex items-center gap-1 text-sm font-extrabold text-foreground">
          <CoinIcon className="h-4 w-4" />
          {bonus} coins per referral
        </p>
        <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
          Condition: your referral must complete {goal} tasks before the reward is credited.
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-3 py-2.5">
        <span className="flex-1 text-lg font-extrabold tracking-widest text-foreground">
          {code || "…"}
        </span>
        <button
          type="button"
          onClick={() => copy(code, "Referral code")}
          className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          <Copy className="mr-1 inline h-3.5 w-3.5" />
          Copy
        </button>
      </div>

      <div className="mt-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
        <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" /> Referral link
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-foreground">{link || "…"}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => copy(link, "Referral link")}
            className="flex-1 rounded-lg bg-secondary py-2 text-xs font-bold text-secondary-foreground"
          >
            <Copy className="mr-1 inline h-3.5 w-3.5" /> Copy link
          </button>
          <button
            type="button"
            onClick={share}
            className="flex-1 rounded-lg bg-gradient-brand py-2 text-xs font-bold text-primary-foreground"
          >
            <Share2 className="mr-1 inline h-3.5 w-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Total Referrals" value={String(data?.invites.length ?? 0)} />
        <Stat label="Referral Earnings" value={`${data?.totalCoins ?? 0}`} coin />
      </div>

      <button
        type="button"
        onClick={() => setShowList((v) => !v)}
        className="mt-4 flex w-full items-center gap-2 rounded-xl bg-secondary px-3 py-3 text-sm font-extrabold text-secondary-foreground active:scale-[0.99]"
      >
        <Users className="h-4 w-4 text-primary" />
        Check Referral List
        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-muted-foreground">
          {data?.invites.length ?? 0}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showList ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {showList &&
        (data && data.invites.length === 0 ? (
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            No referrals yet. Share your link to start earning.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {(data?.invites ?? []).map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {u.name}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      u.qualified ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {u.qualified
                      ? `Reward credited • ${u.tasksDone} tasks`
                      : `${u.tasksDone}/${goal} tasks completed`}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                  <CoinIcon className="h-4 w-4" />
                  {u.coins}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}

function Stat({ label, value, coin }: { label: string; value: string; coin?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 flex items-center gap-1 text-lg font-extrabold text-foreground">
        {coin && <CoinIcon className="h-4 w-4" />}
        {value}
      </p>
    </div>
  );
}
