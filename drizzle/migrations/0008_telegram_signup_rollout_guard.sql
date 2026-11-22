CREATE OR REPLACE FUNCTION public.verify_telegram_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE verified_phone text;
BEGIN
 IF COALESCE(NEW.raw_user_meta_data->>'telegram_link_token','') = '' AND NOT EXISTS(SELECT 1 FROM public.app_settings WHERE key='telegram_signup_required' AND value='true') THEN RETURN NEW; END IF;
 PERFORM public.consume_telegram_link(COALESCE(NEW.raw_user_meta_data->>'telegram_link_token',''),NEW.id,true);
 SELECT right(phone,10) INTO verified_phone FROM public.telegram_identities WHERE user_id=NEW.id;
 NEW.raw_user_meta_data := jsonb_set(COALESCE(NEW.raw_user_meta_data,'{}'::jsonb),'{mobile}',to_jsonb(verified_phone));
 NEW.raw_user_meta_data := NEW.raw_user_meta_data - 'telegram_link_token';
 RETURN NEW;
END;
$$;
CREATE TRIGGER verify_earnverse_telegram_signup BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.verify_telegram_signup();
REVOKE ALL ON FUNCTION public.verify_telegram_signup() FROM PUBLIC, anon, authenticated;