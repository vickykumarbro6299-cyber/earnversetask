
ALTER TABLE public.profiles
  ADD COLUMN referral_code text,
  ADD COLUMN referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN dob date,
  ADD COLUMN avatar_url text;

ALTER TABLE public.tasks
  ADD COLUMN category text NOT NULL DEFAULT 'other',
  ADD COLUMN sample_image_url text,
  ADD COLUMN allow_multiple boolean NOT NULL DEFAULT false,
  ADD COLUMN disabled boolean NOT NULL DEFAULT false,
  ADD COLUMN approved boolean NOT NULL DEFAULT true;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_category_check
  CHECK (category = ANY (ARRAY['video'::text,'shorts'::text,'gmail'::text,'app'::text,'telegram'::text,'instagram'::text,'other'::text]));
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.submissions
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN admin_note text;
ALTER TABLE public.deposits ADD COLUMN proof_url text;
ALTER TABLE public.withdrawals ADD COLUMN admin_note text;

CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  coins integer NOT NULL,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read promo codes" ON public.promo_codes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promo_id, user_id)
);
GRANT SELECT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own redemptions read" ON public.promo_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins integer NOT NULL,
  source text NOT NULL DEFAULT 'task',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_earnings TO service_role;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referral earnings read" ON public.referral_earnings FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.device_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  user_id uuid NOT NULL,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  fingerprint text NOT NULL DEFAULT '',
  UNIQUE (device_id, user_id)
);
GRANT SELECT ON public.device_accounts TO authenticated;
GRANT ALL ON public.device_accounts TO service_role;
ALTER TABLE public.device_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read device accounts" ON public.device_accounts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX device_accounts_device_idx ON public.device_accounts (device_id);
CREATE INDEX device_accounts_fingerprint_idx ON public.device_accounts (fingerprint) WHERE fingerprint <> '';
CREATE INDEX device_accounts_device_id_idx ON public.device_accounts (device_id);

CREATE TABLE public.leaderboard_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  coins integer NOT NULL,
  earned_coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start, user_id)
);
GRANT SELECT ON public.leaderboard_payouts TO authenticated;
GRANT ALL ON public.leaderboard_payouts TO service_role;
ALTER TABLE public.leaderboard_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own leaderboard payouts read" ON public.leaderboard_payouts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.daily_bonus_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_date date NOT NULL,
  coins integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bonus_date)
);
GRANT SELECT ON public.daily_bonus_claims TO authenticated;
GRANT ALL ON public.daily_bonus_claims TO service_role;
ALTER TABLE public.daily_bonus_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily bonus read" ON public.daily_bonus_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.coin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  coins integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_ledger TO authenticated;
GRANT ALL ON public.coin_ledger TO service_role;
ALTER TABLE public.coin_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own coin ledger read" ON public.coin_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX coin_ledger_user_created_idx ON public.coin_ledger (user_id, created_at DESC);

CREATE TABLE public.spin_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spin_date date NOT NULL,
  label text NOT NULL,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.spin_results TO authenticated;
GRANT ALL ON public.spin_results TO service_role;
ALTER TABLE public.spin_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own spin results read" ON public.spin_results FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX spin_results_user_date_idx ON public.spin_results (user_id, spin_date);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON public.promo_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c text;
BEGIN
  LOOP
    c := 'EV' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = c);
  END LOOP;
  RETURN c;
END;
$$;
UPDATE public.profiles SET referral_code = public.gen_referral_code() WHERE referral_code IS NULL;
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;
CREATE UNIQUE INDEX profiles_referral_code_key ON public.profiles(referral_code);

CREATE OR REPLACE FUNCTION public.recount_task_slots(p_task_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; t public.tasks%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT count(*) INTO n FROM public.submissions
    WHERE task_id = p_task_id AND status <> 'rejected'::public.req_status;
  UPDATE public.tasks SET claimed_count = n,
    active = (NOT t.disabled) AND n < t.total_slots WHERE id = p_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_task_slot(p_task_id uuid, p_user_id uuid, p_minutes integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.tasks%ROWTYPE; n integer; v_id uuid;
BEGIN
  SELECT * INTO t FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Task not found'; END IF;
  IF t.disabled THEN RAISE EXCEPTION 'Task closed'; END IF;
  IF t.created_by = p_user_id THEN RAISE EXCEPTION 'You cannot claim your own task'; END IF;
  SELECT count(*) INTO n FROM public.submissions
    WHERE task_id = p_task_id AND status <> 'rejected'::public.req_status;
  IF n >= t.total_slots THEN RAISE EXCEPTION 'No slots left'; END IF;
  IF EXISTS (SELECT 1 FROM public.submissions WHERE task_id = p_task_id AND user_id = p_user_id
      AND status = 'pending'::public.req_status) THEN
    RAISE EXCEPTION 'You already have this task in progress';
  END IF;
  IF NOT t.allow_multiple AND EXISTS (SELECT 1 FROM public.submissions
      WHERE task_id = p_task_id AND user_id = p_user_id AND status = 'approved'::public.req_status) THEN
    RAISE EXCEPTION 'Already claimed';
  END IF;
  INSERT INTO public.submissions (task_id, user_id, reward_coins, expires_at)
    VALUES (p_task_id, p_user_id, t.reward_coins, now() + make_interval(mins => p_minutes))
    RETURNING id INTO v_id;
  UPDATE public.tasks SET claimed_count = n + 1,
    active = (NOT t.disabled) AND (n + 1) < t.total_slots WHERE id = p_task_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_device_account(
  p_device_id text, p_user_id uuid, p_user_agent text, p_fingerprint text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_device_id text := btrim(coalesce(p_device_id, ''));
  v_fingerprint text := btrim(coalesce(p_fingerprint, ''));
  v_existing_user uuid;
  v_lock_key text;
BEGIN
  IF v_device_id = '' AND v_fingerprint = '' THEN RETURN NULL; END IF;
  v_lock_key := coalesce(nullif(v_device_id, ''), v_fingerprint);
  PERFORM pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));
  SELECT da.user_id INTO v_existing_user FROM public.device_accounts da
    WHERE (v_device_id <> '' AND da.device_id = v_device_id)
       OR (v_fingerprint <> '' AND da.fingerprint = v_fingerprint)
    ORDER BY da.created_at LIMIT 1;
  IF v_existing_user IS NOT NULL AND v_existing_user <> p_user_id THEN RETURN v_existing_user; END IF;
  INSERT INTO public.device_accounts (device_id, user_id, user_agent, fingerprint)
    VALUES (coalesce(nullif(v_device_id, ''), v_fingerprint), p_user_id,
      left(coalesce(p_user_agent, ''), 300), v_fingerprint)
    ON CONFLICT (device_id, user_id) DO UPDATE SET user_agent = EXCLUDED.user_agent,
      fingerprint = EXCLUDED.fingerprint;
  RETURN p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.weekly_task_earnings(p_start timestamptz, p_end timestamptz)
RETURNS TABLE (user_id uuid, coins bigint, tasks bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, sum(s.reward_coins)::bigint AS coins, count(*)::bigint AS tasks
  FROM public.submissions s
  WHERE s.status = 'approved'::public.req_status AND s.reviewed_at >= p_start AND s.reviewed_at < p_end
  GROUP BY s.user_id HAVING sum(s.reward_coins) > 0 ORDER BY coins DESC
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_code text; ref_user uuid; bonus int; until_ts timestamptz;
BEGIN
  ref_code := upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code','')));
  IF ref_code <> '' THEN
    SELECT id INTO ref_user FROM public.profiles WHERE referral_code = ref_code LIMIT 1;
  END IF;
  INSERT INTO public.profiles (id, name, mobile, email, coins, referral_code, referred_by)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name',''),
    COALESCE(NEW.raw_user_meta_data->>'mobile',''), COALESCE(NEW.email,''),
    50, public.gen_referral_code(), ref_user);
  INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, CASE WHEN lower(COALESCE(NEW.email,'')) = 'trustmeiamjonathan12@gmail.com'
      THEN 'admin'::public.app_role ELSE 'user'::public.app_role END);
  IF ref_user IS NOT NULL THEN
    SELECT COALESCE((SELECT value FROM public.app_settings WHERE key='referral_signup_bonus_coins'),'0')::int
      INTO bonus;
    SELECT (SELECT value FROM public.app_settings WHERE key='referral_signup_bonus_until')::timestamptz
      INTO until_ts;
    IF bonus > 0 AND until_ts IS NOT NULL AND now() < until_ts THEN
      UPDATE public.profiles SET coins = coins + bonus WHERE id = ref_user;
      INSERT INTO public.referral_earnings (referrer_id, referred_id, coins, source)
        VALUES (ref_user, NEW.id, bonus, 'signup');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.gen_referral_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gen_referral_code() TO service_role;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_task_slot(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_task_slot(uuid, uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.recount_task_slots(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recount_task_slots(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.register_device_account(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_device_account(text, uuid, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.weekly_task_earnings(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_task_earnings(timestamptz, timestamptz) TO service_role;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, mobile, dob, avatar_url) ON public.profiles TO authenticated;
