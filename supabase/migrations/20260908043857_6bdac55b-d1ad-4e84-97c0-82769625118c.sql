CREATE TABLE public.math_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,
  a INT NOT NULL,
  b INT NOT NULL,
  correct INT NOT NULL,
  options JSONB NOT NULL,
  reward INT NOT NULL,
  answered BOOLEAN NOT NULL DEFAULT false,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX math_quizzes_user_date_idx ON public.math_quizzes (user_id, quiz_date);
GRANT ALL ON public.math_quizzes TO service_role;
ALTER TABLE public.math_quizzes ENABLE ROW LEVEL SECURITY;