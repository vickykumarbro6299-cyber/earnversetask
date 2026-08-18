import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MESSAGE = "New Task Added 🎉";
const SEEN_KEY = "ev-last-task-seen";

async function getRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

/** Fires a real device notification (mobile pop-up) for a new task. */
export async function fireTaskNotification(title: string) {
  const body = title || "Open EarnVerse to claim it.";
  toast.success(MESSAGE, { description: body });

  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const options: NotificationOptions = {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "earnverse-task",
    ...({ vibrate: [200, 100, 200], renotify: true } as Record<string, unknown>),
  };

  try {
    const reg = await getRegistration();
    if (reg) {
      // Required on Android/mobile browsers — `new Notification()` throws there.
      await reg.showNotification(MESSAGE, options);
      return;
    }
    new Notification(MESSAGE, options);
  } catch {
    /* notifications unsupported on this device */
  }
}

/** Ask the user for notification permission (must be called from a click). */
export async function enableTaskNotifications() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    toast.error("Your browser does not support notifications");
    return false;
  }
  await getRegistration();
  const perm =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission().catch(() => "denied");
  if (perm === "granted") {
    void fireTaskNotification("Notifications are on — you'll get alerts for new tasks.");
    return true;
  }
  toast.error("Notifications blocked. Enable them in your browser settings.");
  return false;
}

export function useNotificationPermission() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);
  const request = useCallback(async () => {
    const ok = await enableTaskNotifications();
    if (typeof window !== "undefined" && "Notification" in window)
      setPerm(Notification.permission);
    return ok;
  }, []);
  return { perm, request };
}

/** Live subscription + polling fallback: notifies whenever a new task is published. */
export function useTaskNotifications() {
  const qc = useQueryClient();
  const seen = useRef<string | null>(null);
  const announced = useRef<Set<string>>(new Set());


  useEffect(() => {
    if (typeof window === "undefined") return;
    void getRegistration();

    seen.current = window.localStorage.getItem(SEEN_KEY);
    let cancelled = false;

    const announce = (createdAt: string, title: string, id: string) => {
      if (seen.current && createdAt <= seen.current) return;
      seen.current = createdAt;
      window.localStorage.setItem(SEEN_KEY, createdAt);
      if (!id) return;
      qc.invalidateQueries({ queryKey: ["tasks"] });
      void fireTaskNotification(title);
    };

    const channel = supabase
      .channel("tasks-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => {
          const t = payload.new as {
            id?: string;
            title?: string;
            active?: boolean;
            approved?: boolean;
            created_at?: string;
          };
          if (t.active === false || t.approved === false) return;
          announce(t.created_at ?? new Date().toISOString(), t.title ?? "", t.id ?? "x");
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => {
          const t = payload.new as {
            id?: string;
            title?: string;
            active?: boolean;
            approved?: boolean;
            claimed_count?: number;
          };
          // A reviewed task going live: still untouched by any user.
          if (!t.active || !t.approved || (t.claimed_count ?? 0) > 0) return;
          const id = t.id ?? "";
          if (!id || announced.current.has(id)) return;
          announced.current.add(id);
          qc.invalidateQueries({ queryKey: ["tasks"] });
          void fireTaskNotification(t.title ?? "");
        },
      )

      .subscribe();

    // Fallback for devices/networks where the websocket does not connect.
    const poll = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, created_at")
        .eq("active", true)
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(1);
      const t = data?.[0];
      if (cancelled || !t) return;
      if (!seen.current) {
        seen.current = t.created_at;
        window.localStorage.setItem(SEEN_KEY, t.created_at);
        return;
      }
      announce(t.created_at, t.title, t.id);
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}
