CREATE TABLE public.daily_bonus_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bonus_date date not null,
  coins integer not null default 50,
  created_at timestamptz not null default now(),
  unique (user_id, bonus_date)
);
GRANT SELECT ON public.daily_bonus_claims TO authenticated;
GRANT ALL ON public.daily_bonus_claims TO service_role;
ALTER TABLE public.daily_bonus_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily bonus read" ON public.daily_bonus_claims FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));