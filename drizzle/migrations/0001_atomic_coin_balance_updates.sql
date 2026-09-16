CREATE OR REPLACE FUNCTION public.change_user_coins(p_user_id uuid, p_delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  UPDATE public.profiles
     SET coins = coins + p_delta
   WHERE id = p_user_id
     AND coins + p_delta >= 0
  RETURNING coins INTO v_balance;

  IF v_balance IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
      RAISE EXCEPTION 'User not found';
    END IF;
    RAISE EXCEPTION 'Not enough coins';
  END IF;

  RETURN v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.change_user_coins(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.change_user_coins(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.change_user_coins(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_coins(uuid, integer) TO service_role;