CREATE TABLE public.coin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  coins integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_ledger TO authenticated;
GRANT ALL ON public.coin_ledger TO service_role;
ALTER TABLE public.coin_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own coin ledger read" ON public.coin_ledger FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX coin_ledger_user_created_idx ON public.coin_ledger (user_id, created_at DESC);