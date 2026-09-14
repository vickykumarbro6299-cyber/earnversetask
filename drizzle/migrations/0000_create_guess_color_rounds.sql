CREATE TABLE public.guess_color_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  round_date date NOT NULL,
  target_color text NOT NULL,
  options jsonb NOT NULL,
  reward integer NOT NULL DEFAULT 10,
  answered boolean NOT NULL DEFAULT false,
  is_correct boolean,
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.guess_color_rounds TO service_role;

ALTER TABLE public.guess_color_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to guess color rounds"
ON public.guess_color_rounds
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX guess_color_rounds_user_date_idx
ON public.guess_color_rounds (user_id, round_date);