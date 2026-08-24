import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — EarnVerse" },
      {
        name: "description",
        content:
          "EarnVerse refund and cancellation policy: deposits are non-refundable and platform fees on published tasks are non-refundable.",
      },
      { property: "og:title", content: "Refund & Cancellation Policy — EarnVerse" },
      {
        property: "og:description",
        content: "Deposits and platform fees on EarnVerse are non-refundable. Read the full policy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-brand px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/profile" className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-primary-foreground">
            Refund &amp; Cancellation Policy
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">Last updated: August 2026</p>

        <Section title="1. Deposits Are Non-Refundable">
          All coin deposits made through UPI are final. Once coins are credited to your EarnVerse
          wallet, the paid amount cannot be refunded, reversed or converted back to money outside
          the withdrawal options provided in the app.
        </Section>

        <Section title="2. Platform Fee Is Non-Refundable">
          The platform fee charged while publishing a task is non-refundable in every case —
          including when you cancel the task, when the task is rejected during review, or when the
          task expires with unused slots.
        </Section>

        <Section title="3. Task Cancellation">
          You may cancel your published task any time from Creator Studio. Coins reserved for unused
          slots are returned to your wallet. Coins for slots that are already completed or approved,
          and the platform fee, are not returned.
        </Section>

        <Section title="4. Claim Cancellation">
          If you cancel a claimed task or the timer expires before you submit proof, the slot is
          released back to other users and no coins are charged or credited to you.
        </Section>

        <Section title="5. Rejected Proofs">
          If a submitted proof is rejected, no coins are credited for that attempt. The task
          publisher&apos;s slot is released back so another user can complete it.
        </Section>

        <Section title="6. Withdrawals">
          Withdrawal requests can be cancelled only while they are still pending. If a request is
          rejected by the admin, the coins are returned to your balance. Approved and paid
          withdrawals cannot be reversed.
        </Section>

        <Section title="7. Wrong or Failed Payments">
          Deposits submitted with an incorrect UTR, an unreadable screenshot, or a payment that
          cannot be verified may be rejected and no coins will be credited. For genuine payment
          issues, contact us on our Telegram support channel with the payment proof.
        </Section>

        <Section title="8. Contact">
          For any refund or cancellation question, reach us through the Contact Us page on our
          Telegram support channel.
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
