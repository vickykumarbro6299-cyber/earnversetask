REVOKE ALL ON FUNCTION public.gen_referral_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gen_referral_code() TO service_role;