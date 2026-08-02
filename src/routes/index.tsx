import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark, Wordmark } from "@/components/brand";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "EarnVerse — Watch, Work & Earn Daily Rewards" },
      {
        name: "description",
        content:
          "EarnVerse lets you complete simple tasks, earn coins and withdraw real cash via UPI or Google Play redeem codes.",
      },
      { property: "og:title", content: "EarnVerse — Watch, Work & Earn Daily Rewards" },
      {
        property: "og:description",
        content: "EarnVerse lets you complete simple tasks, earn coins and withdraw real cash via UPI or Google Play redeem codes.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      navigate({ to: data.session ? "/tasks" : "/auth", replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [ready, navigate]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-brand px-6">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 animate-shine rounded-full bg-primary-foreground/10" />
      <div className="pointer-events-none absolute -right-20 bottom-32 h-80 w-80 animate-shine rounded-full bg-primary-foreground/10" />

      <div className="animate-pop-in">
        <div className="animate-float">
          <BrandMark className="h-56 w-56 drop-shadow-2xl" />
        </div>
      </div>

      <div className="mt-6 animate-rise" style={{ animationDelay: "0.5s" }}>
        <Wordmark className="text-6xl" />
      </div>

      <p
        className="mt-8 animate-rise text-lg font-medium text-primary-foreground/85"
        style={{ animationDelay: "0.9s" }}
      >
        Watch • Work • Earn Daily
      </p>
    </main>
  );
}
