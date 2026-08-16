CREATE OR REPLACE FUNCTION public.register_device_account(
  p_device_id text,
  p_user_id uuid,
  p_user_agent text,
  p_fingerprint text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device_id text := btrim(coalesce(p_device_id, ''));
  v_fingerprint text := btrim(coalesce(p_fingerprint, ''));
  v_existing_user uuid;
  v_lock_key text;
BEGIN
  IF v_device_id = '' AND v_fingerprint = '' THEN
    RETURN NULL;
  END IF;

  v_lock_key := coalesce(nullif(v_device_id, ''), v_fingerprint);
  PERFORM pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));

  SELECT da.user_id
    INTO v_existing_user
    FROM public.device_accounts da
   WHERE (v_device_id <> '' AND da.device_id = v_device_id)
      OR (v_fingerprint <> '' AND da.fingerprint = v_fingerprint)
   ORDER BY da.created_at
   LIMIT 1;

  IF v_existing_user IS NOT NULL AND v_existing_user <> p_user_id THEN
    RETURN v_existing_user;
  END IF;

  INSERT INTO public.device_accounts (device_id, user_id, user_agent, fingerprint)
  VALUES (
    coalesce(nullif(v_device_id, ''), v_fingerprint),
    p_user_id,
    left(coalesce(p_user_agent, ''), 300),
    v_fingerprint
  )
  ON CONFLICT (device_id, user_id) DO UPDATE
    SET user_agent = EXCLUDED.user_agent,
        fingerprint = EXCLUDED.fingerprint;

  RETURN p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_device_account(text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_device_account(text, uuid, text, text) TO service_role;