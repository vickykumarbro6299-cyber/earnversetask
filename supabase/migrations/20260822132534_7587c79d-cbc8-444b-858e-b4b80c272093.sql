CREATE INDEX IF NOT EXISTS submissions_status_reviewed_at_idx
  ON public.submissions (status, reviewed_at);

CREATE OR REPLACE FUNCTION public.weekly_task_earnings(p_start timestamptz, p_end timestamptz)
RETURNS TABLE (user_id uuid, coins bigint, tasks bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.user_id, sum(s.reward_coins)::bigint AS coins, count(*)::bigint AS tasks
  FROM public.submissions s
  WHERE s.status = 'approved'::public.req_status
    AND s.reviewed_at >= p_start
    AND s.reviewed_at < p_end
  GROUP BY s.user_id
  HAVING sum(s.reward_coins) > 0
  ORDER BY coins DESC
$$;

GRANT EXECUTE ON FUNCTION public.weekly_task_earnings(timestamptz, timestamptz) TO authenticated, service_role;