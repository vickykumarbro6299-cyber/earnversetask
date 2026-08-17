
INSERT INTO public.app_settings(key, value)
VALUES ('referral_signup_bonus_coins', '300'),
       ('referral_signup_bonus_until', to_char(now() + interval '24 hours', 'YYYY-MM-DD"T"HH24:MI:SSOF:00'))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE ref_code text; ref_user uuid; bonus int; until_ts timestamptz;
BEGIN
  ref_code := upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code','')));
  IF ref_code <> '' THEN
    SELECT id INTO ref_user FROM public.profiles WHERE referral_code = ref_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, name, mobile, email, coins, referral_code, referred_by)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name',''),
          COALESCE(NEW.raw_user_meta_data->>'mobile',''),
          COALESCE(NEW.email,''),
          50,
          public.gen_referral_code(),
          ref_user);

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
