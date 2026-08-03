ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_category_check CHECK (category IN ('video','gmail','app','other'));
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS proof_url text;