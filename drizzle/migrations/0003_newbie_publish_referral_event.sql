CREATE TABLE public.referral_events (
  key text PRIMARY KEY,
  published_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  delivery_id text NOT NULL
);
GRANT SELECT ON public.referral_events TO authenticated;
GRANT ALL ON public.referral_events TO service_role;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in event read" ON public.referral_events FOR SELECT TO authenticated USING (true);
CREATE TABLE public.referral_event_rewards (
  event_key text NOT NULL REFERENCES public.referral_events(key),
  referred_id uuid NOT NULL,
  referrer_id uuid NOT NULL,
  submission_id uuid NOT NULL,
  coins integer NOT NULL DEFAULT 800,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_key, referred_id)
);
GRANT SELECT ON public.referral_event_rewards TO authenticated;
GRANT ALL ON public.referral_event_rewards TO service_role;
ALTER TABLE public.referral_event_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own event rewards read" ON public.referral_event_rewards FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE FUNCTION public.start_newbie_referral_event(p_published_at timestamptz, p_delivery_id text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.referral_events(key, published_at, ends_at, delivery_id)
  VALUES ('newbie_800_v1', p_published_at, p_published_at + interval '24 hours', p_delivery_id)
  ON CONFLICT (key) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.start_newbie_referral_event(timestamptz,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_newbie_referral_event(timestamptz,text) TO service_role;
CREATE FUNCTION public.pay_newbie_referral_event(p_submission_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; e record; r uuid; inserted_count integer;
BEGIN
  SELECT * INTO e FROM public.referral_events WHERE key = 'newbie_800_v1';
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT submissions.*, tasks.title INTO s FROM public.submissions JOIN public.tasks ON tasks.id = submissions.task_id WHERE submissions.id = p_submission_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF s.status <> 'approved' OR upper(trim(s.title)) <> 'NEWBIE' OR s.reviewed_at IS NULL OR s.reviewed_at < e.published_at OR s.reviewed_at >= e.ends_at THEN RETURN false; END IF;
  SELECT referred_by INTO r FROM public.profiles WHERE id = s.user_id;
  IF r IS NULL OR r = s.user_id THEN RETURN false; END IF;
  INSERT INTO public.referral_event_rewards(event_key,referred_id,referrer_id,submission_id,coins)
  VALUES ('newbie_800_v1',s.user_id,r,s.id,800) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN RETURN false; END IF;
  UPDATE public.profiles SET coins = coins + 800 WHERE id = r;
  IF NOT FOUND THEN RAISE EXCEPTION 'Referrer profile missing'; END IF;
  INSERT INTO public.referral_earnings(referrer_id,referred_id,coins,source) VALUES (r,s.user_id,800,'newbie_800_v1');
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.pay_newbie_referral_event(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_newbie_referral_event(uuid) TO service_role;