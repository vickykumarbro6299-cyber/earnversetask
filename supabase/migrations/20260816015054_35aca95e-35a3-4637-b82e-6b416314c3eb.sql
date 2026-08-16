REVOKE EXECUTE ON FUNCTION public.register_device_account(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_device_account(text, uuid, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_task_slot(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_task_slot(uuid, uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.recount_task_slots(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recount_task_slots(uuid) TO service_role;