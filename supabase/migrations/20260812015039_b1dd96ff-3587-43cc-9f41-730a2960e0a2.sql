ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.device_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, user_id)
);

GRANT SELECT ON public.device_accounts TO authenticated;
GRANT ALL ON public.device_accounts TO service_role;

ALTER TABLE public.device_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read device accounts"
ON public.device_accounts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS device_accounts_device_idx ON public.device_accounts (device_id);

CREATE OR REPLACE FUNCTION public.recount_task_slots(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer; t public.tasks%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT count(*) INTO n FROM public.submissions
    WHERE task_id = p_task_id AND status <> 'rejected'::public.req_status;
  UPDATE public.tasks
     SET claimed_count = n,
         active = (NOT t.disabled) AND n < t.total_slots
   WHERE id = p_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_task_slot(p_task_id uuid, p_user_id uuid, p_minutes integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE t public.tasks%ROWTYPE; n integer; v_id uuid;
BEGIN
  SELECT * INTO t FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
  IF t.disabled THEN RAISE EXCEPTION 'Task closed'; END IF;
  IF t.created_by = p_user_id THEN RAISE EXCEPTION 'You cannot claim your own task'; END IF;

  SELECT count(*) INTO n FROM public.submissions
    WHERE task_id = p_task_id AND status <> 'rejected'::public.req_status;
  IF n >= t.total_slots THEN RAISE EXCEPTION 'No slots left'; END IF;

  IF EXISTS (SELECT 1 FROM public.submissions
             WHERE task_id = p_task_id AND user_id = p_user_id
               AND status = 'pending'::public.req_status) THEN
    RAISE EXCEPTION 'You already have this task in progress';
  END IF;

  IF NOT t.allow_multiple AND EXISTS (
      SELECT 1 FROM public.submissions
       WHERE task_id = p_task_id AND user_id = p_user_id
         AND status = 'approved'::public.req_status) THEN
    RAISE EXCEPTION 'Already claimed';
  END IF;

  INSERT INTO public.submissions (task_id, user_id, reward_coins, expires_at)
  VALUES (p_task_id, p_user_id, t.reward_coins, now() + make_interval(mins => p_minutes))
  RETURNING id INTO v_id;

  UPDATE public.tasks
     SET claimed_count = n + 1,
         active = (NOT t.disabled) AND (n + 1) < t.total_slots
   WHERE id = p_task_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_task_slot(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recount_task_slots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_task_slot(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.recount_task_slots(uuid) TO service_role;

UPDATE public.tasks t
   SET claimed_count = s.n,
       active = (NOT t.disabled) AND s.n < t.total_slots
  FROM (SELECT tk.id, (SELECT count(*) FROM public.submissions sb
                        WHERE sb.task_id = tk.id AND sb.status <> 'rejected'::public.req_status) AS n
          FROM public.tasks tk) s
 WHERE t.id = s.id;