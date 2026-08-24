import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "./earn.functions";

/** True once a Supabase session is confirmed present in this browser. */
function useHasSession() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setHasSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return hasSession;
}

export function useMe() {
  const fn = useServerFn(getMe);
  const hasSession = useHasSession();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fn(),
    enabled: hasSession === true,
    retry: false,
  });
}


export function useRefreshAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["me"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["admin-proofs"] });
    qc.invalidateQueries({ queryKey: ["referral"] });
    qc.invalidateQueries({ queryKey: ["profile-stats"] });
    qc.invalidateQueries({ queryKey: ["creator-tasks"] });

  };
}
