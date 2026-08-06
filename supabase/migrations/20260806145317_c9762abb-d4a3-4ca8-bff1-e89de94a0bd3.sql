ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
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
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles(referral_code);

CREATE TABLE IF NOT EXISTS public.referral_earnings (
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

CREATE POLICY "own referral earnings read"
ON public.referral_earnings FOR SELECT TO authenticated
USING (referrer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE ref_code text; ref_user uuid;
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
  RETURN NEW;
END;
$$;