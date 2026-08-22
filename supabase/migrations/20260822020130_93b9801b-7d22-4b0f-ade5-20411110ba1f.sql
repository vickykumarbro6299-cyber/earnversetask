CREATE TABLE public.leaderboard_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start date NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  coins integer NOT NULL,
  earned_coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_start, user_id)
);
GRANT SELECT ON public.leaderboard_payouts TO authenticated;
GRANT ALL ON public.leaderboard_payouts TO service_role;
ALTER TABLE public.leaderboard_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own leaderboard payouts read" ON public.leaderboard_payouts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));