import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Send, ChevronRight } from "lucide-react";
import { TELEGRAM_CHANNEL } from "@/lib/earn-constants";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — EarnVerse Support" },
      {
        name: "description",
        content:
          "Reach the EarnVerse support team on Telegram for task, deposit and withdrawal help.",
      },
      { property: "og:title", content: "Contact Us — EarnVerse Support" },
      { property: "og:description", content: "Get EarnVerse support on Telegram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-brand px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/profile" className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold text-primary-foreground">Contact Us</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-sm text-muted-foreground">
          Need help with a task, deposit or withdrawal? Message us on Telegram — support replies
          fastest there.
        </p>

        <a
          href={TELEGRAM_CHANNEL}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#229ED9]">
            <Send className="h-6 w-6 -rotate-12 text-white" />
          </span>
          <span className="min-w-0">
            <span className="block font-extrabold text-foreground">Telegram Support</span>
            <span className="block text-sm text-muted-foreground">@EarnVerseTask</span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </a>

        <p className="mt-4 text-xs text-muted-foreground">
          Support hours: 10 AM – 10 PM IST. Please include your registered email when you message.
        </p>
      </main>
    </div>
  );
}
