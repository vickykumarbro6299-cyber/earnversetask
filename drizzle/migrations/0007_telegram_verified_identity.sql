CREATE TABLE public.telegram_link_sessions (
 token_hash text PRIMARY KEY, owner_id uuid, device_id text NOT NULL,
 telegram_id bigint, phone text, verified_at timestamptz, consumed_at timestamptz,
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_link_sessions TO service_role;
ALTER TABLE public.telegram_link_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX telegram_session_sender_idx ON public.telegram_link_sessions(telegram_id, created_at DESC);
CREATE TABLE public.telegram_identities (
 user_id uuid PRIMARY KEY, telegram_id bigint NOT NULL UNIQUE CHECK (telegram_id > 0),
 phone text NOT NULL UNIQUE CHECK (phone ~ '^91[6-9][0-9]{9}$'),
 device_id text NOT NULL UNIQUE CHECK (length(device_id) > 0), linked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.telegram_identities TO authenticated;
GRANT ALL ON public.telegram_identities TO service_role;
ALTER TABLE public.telegram_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own Telegram identity" ON public.telegram_identities FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.consume_telegram_link(p_token text, p_user_id uuid, p_signup boolean DEFAULT false) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.telegram_link_sessions;
BEGIN
 SELECT * INTO s FROM public.telegram_link_sessions WHERE token_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex') FOR UPDATE;
 IF s.token_hash IS NULL OR s.expires_at <= now() OR s.verified_at IS NULL OR s.consumed_at IS NOT NULL THEN
  RAISE EXCEPTION 'Link Telegram again: verification is missing, expired or already used';
 END IF;
 IF (p_signup AND s.owner_id IS NOT NULL) OR (NOT p_signup AND s.owner_id IS DISTINCT FROM p_user_id) THEN RAISE EXCEPTION 'Telegram verification belongs to another account'; END IF;
 IF s.telegram_id IS NULL OR s.phone IS NULL OR s.phone !~ '^91[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'Only verified Indian Telegram numbers are allowed'; END IF;
 IF p_signup AND EXISTS (SELECT 1 FROM public.device_accounts WHERE device_id = s.device_id AND user_id <> p_user_id) THEN RAISE EXCEPTION 'An account already exists on this device'; END IF;
 INSERT INTO public.telegram_identities(user_id,telegram_id,phone,device_id) VALUES(p_user_id,s.telegram_id,s.phone,s.device_id);
 UPDATE public.telegram_link_sessions SET consumed_at=now() WHERE token_hash=s.token_hash;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Telegram ID, mobile number or device is already linked to an account';
END;
$$;
REVOKE ALL ON FUNCTION public.consume_telegram_link(text,uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_telegram_link(text,uuid,boolean) TO service_role;
CREATE FUNCTION public.verify_telegram_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 PERFORM public.consume_telegram_link(COALESCE(NEW.raw_user_meta_data->>'telegram_link_token',''),NEW.id,true);
 SELECT right(phone,10) INTO NEW.raw_user_meta_data FROM public.telegram_identities WHERE false;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.verify_telegram_signup() FROM PUBLIC, anon, authenticated;