DROP POLICY IF EXISTS "settings read" ON public.app_settings;
CREATE POLICY "settings read"
ON public.app_settings
FOR SELECT
TO authenticated
USING (key IN ('deposit_upi', 'deposit_name', 'maintenance_mode'));