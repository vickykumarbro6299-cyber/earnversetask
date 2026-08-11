import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — EarnVerse" },
      {
        name: "description",
        content:
          "EarnVerse rules for tasks, coins, deposits, withdrawals, referrals and account suspension.",
      },
      { property: "og:title", content: "Terms & Conditions — EarnVerse" },
      {
        property: "og:description",
        content: "Rules for earning coins, publishing tasks and withdrawing on EarnVerse.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-brand px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/profile" className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-primary-foreground">Terms &amp; Conditions</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">Last updated: August 2026</p>

        <Section title="1. Account">
          One account per person. Multiple or fake accounts, bot activity and self-referrals will
          lead to permanent suspension and forfeiture of the coin balance.
        </Section>

        <Section title="2. Coins">
          100 coins equal ₹1. Coins have no value outside EarnVerse and cannot be transferred
          between users. Coins credited by mistake may be reversed by the admin.
        </Section>

        <Section title="3. Tasks & Proof">
          A claimed task is reserved for you and must be completed with valid proof within the
          displayed timer. Fake, edited, duplicate or unrelated screenshots will be rejected. Video
          tasks submitted before the required watch time are automatically marked failed. Rejected
          attempts release the slot back to other users.
        </Section>

        <Section title="4. Publishing Your Own Task">
          When you publish a task, the reward coins for all slots plus the platform fee are deducted
          upfront. If you cancel the task, only coins for unused slots are refunded; the platform
          fee and coins for completed slots are not refunded.
        </Section>

        <Section title="5. Deposits">
          Deposits are processed manually through UPI. Submit the correct UTR and payment
          screenshot. Wrong, incomplete or unverifiable payments may be rejected.
        </Section>

        <Section title="6. Withdrawals">
          Withdrawals are available only in the fixed coin packs shown in the wallet, via UPI or
          Google Play redeem code. Requests are reviewed manually and are usually processed within
          24–72 hours. Coins are returned to your balance if a request is rejected.
        </Section>

        <Section title="7. Referrals">
          You earn lifetime commission on the task earnings of users who join with your referral
          code. Abuse of the referral system cancels all referral earnings.
        </Section>

        <Section title="8. Changes">
          EarnVerse may change reward rules, minimums, fees or these terms at any time. Continued
          use of the app means you accept the updated terms.
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card">
      <h2 className="font-extrabold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
