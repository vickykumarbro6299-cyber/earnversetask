import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — EarnVerse" },
      {
        name: "description",
        content:
          "How EarnVerse collects, stores and protects your name, email, mobile number, task proofs and payout details.",
      },
      { property: "og:title", content: "Privacy Policy — EarnVerse" },
      {
        property: "og:description",
        content: "Learn what data EarnVerse collects and how it is used and protected.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-brand px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/profile" className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-primary-foreground">Privacy Policy</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">Last updated: August 2026</p>

        <Section title="1. Information We Collect">
          When you create an EarnVerse account we collect your name, mobile number and email
          address. While using the app we also store your coin balance, tasks you claim or publish,
          proof screenshots you upload, promo code redemptions, referral activity, and the UPI ID or
          Google Play redeem details you provide for deposits and withdrawals.
        </Section>

        <Section title="2. How We Use Your Data">
          Your data is used only to run the platform: to verify task proofs, credit and debit coins,
          process manual deposits and withdrawals, prevent fraud and duplicate accounts, calculate
          referral commission, and contact you about your account.
        </Section>

        <Section title="3. Proof Screenshots">
          Screenshots you upload are stored in private storage. Only you and the EarnVerse admin can
          view them, and they are used solely to verify that a task was completed.
        </Section>

        <Section title="4. Sharing">
          We do not sell your data. Information is shared only where required to process a payout or
          where the law requires disclosure.
        </Section>

        <Section title="5. Security">
          Accounts are protected by password authentication and database level access rules, so one
          user cannot read another user&apos;s data. Please keep your password private.
        </Section>

        <Section title="6. Data Retention & Deletion">
          We keep your data while your account is active. You may request account deletion at any
          time through our support channel; approved payout records may be retained for accounting
          purposes.
        </Section>

        <Section title="7. Children">
          EarnVerse is not intended for users under 13 years of age.
        </Section>

        <Section title="8. Changes & Contact">
          We may update this policy from time to time. For any privacy question, contact us on our
          Telegram support channel from the Contact Us page.
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
