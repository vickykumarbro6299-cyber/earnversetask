ALTER TABLE public.spin_results ADD COLUMN reward_claimed boolean NOT NULL DEFAULT false;
ALTER TABLE public.math_quizzes ADD COLUMN reward_claimed boolean NOT NULL DEFAULT false;