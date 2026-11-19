ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_task_id_user_id_key;
CREATE INDEX IF NOT EXISTS submissions_task_user_idx ON public.submissions(task_id, user_id);