CREATE OR REPLACE FUNCTION public.award_referral_milestone(p_earner_id uuid, p_task_goal integer, p_bonus_coins integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('referral-milestone:' || p_earner_id::text, 0));

  SELECT referred_by INTO v_referrer
    FROM public.profiles
   WHERE id = p_earner_id;

  IF v_referrer IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.referral_earnings
     WHERE referrer_id = v_referrer
       AND referred_id = p_earner_id
       AND source = 'milestone'
  ) THEN
    RETURN false;
  END IF;

  IF (SELECT count(*) FROM public.submissions
       WHERE user_id = p_earner_id AND status = 'approved'::public.req_status) < p_task_goal THEN
    RETURN false;
  END IF;

  INSERT INTO public.referral_earnings (referrer_id, referred_id, coins, source)
  VALUES (v_referrer, p_earner_id, p_bonus_coins, 'milestone');

  UPDATE public.profiles
     SET coins = coins + p_bonus_coins
   WHERE id = v_referrer;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.award_referral_milestone(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_referral_milestone(uuid, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.award_referral_milestone(uuid, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.award_referral_milestone(uuid, integer, integer) TO service_role;