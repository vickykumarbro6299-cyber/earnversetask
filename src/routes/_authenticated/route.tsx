import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/brand";
import { useMe } from "@/lib/use-earn";
import { useTaskNotifications } from "@/lib/use-task-notifications";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  useTaskNotifications();
  const me = useMe();

  if (me.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </main>
    );
  }

  const maintenanceMode = me.data?.settings?.["maintenance_mode"] === "true";
  if (maintenanceMode && !me.data?.isAdmin) return <MaintenanceScreen />;

  return <Outlet />;
}

function MaintenanceScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <BrandMark className="mx-auto h-28 w-28" />
        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wrench className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-foreground">We’ll be back soon</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          EarnVerse is under maintenance right now. Please check back after some time.
        </p>
      </div>
    </main>
  );
}
