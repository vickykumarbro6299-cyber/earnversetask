import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Gift } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { ReferEarn } from "@/components/refer-earn";

export const Route = createFileRoute("/_authenticated/refer-earn")({
  head: () => ({
    meta: [
      { title: "Refer & Earn — EarnVerse" },
      {
        name: "description",
        content: "Earn 800 coins per valid referral when a NEWBIE task is approved during EarnVerse’s 24-hour event.",
      },
      { property: "og:title", content: "Refer & Earn — EarnVerse" },
      {
        property: "og:description",
        content: "Earn 800 referral coins for approved NEWBIE tasks during EarnVerse’s 24-hour event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReferEarnPage,
});

function ReferEarnPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-purple px-4 pb-6 pt-8">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            to="/tasks"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-primary-foreground">
            <Gift className="h-6 w-6" /> Refer & Earn
          </h1>
        </div>
      </div>

      <main className="mx-auto max-w-md px-4 pt-4">
        <ReferEarn />
      </main>

      <BottomNav />
    </div>
  );
}
