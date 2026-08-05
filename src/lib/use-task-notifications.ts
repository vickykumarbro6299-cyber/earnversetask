import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MESSAGE = "New Task Added 🎉";

/** Live subscription: fires a device notification whenever a new task is published. */
export function useTaskNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => undefined);
    }

    const channel = supabase
      .channel("tasks-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => {
          const task = payload.new as { title?: string; active?: boolean };
          if (task.active === false) return;
          qc.invalidateQueries({ queryKey: ["tasks"] });
          toast.success(MESSAGE, { description: task.title ?? "" });
          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(MESSAGE, { body: task.title ?? "Open EarnVerse to claim it." });
            }
          } catch {
            /* notifications unsupported */
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}
