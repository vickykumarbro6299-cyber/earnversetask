ALTER TABLE public.device_accounts ADD COLUMN IF NOT EXISTS fingerprint text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS device_accounts_fingerprint_idx ON public.device_accounts (fingerprint) WHERE fingerprint <> '';
CREATE INDEX IF NOT EXISTS device_accounts_device_id_idx ON public.device_accounts (device_id);