CREATE TABLE public.spin_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spin_date date NOT NULL,
  label text NOT NULL,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.spin_results TO authenticated;
GRANT ALL ON public.spin_results TO service_role;

ALTER TABLE public.spin_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own spin results read" ON public.spin_results
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX spin_results_user_date_idx ON public.spin_results (user_id, spin_date);