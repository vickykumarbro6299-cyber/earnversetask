ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;