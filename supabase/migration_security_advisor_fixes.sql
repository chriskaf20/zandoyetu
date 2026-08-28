-- =============================================================
-- SECURITY ADVISOR FIXES MIGRATION
-- Project: Zando Yetu (dimhzfxztyvbtljdyhqq)
-- Date: 2026-08-28
-- Description:
--   1. Fix mutable search_path on public.is_admin()
--   2. Split platform_settings RLS into public SELECT and admin-only write
--   3. Revoke EXECUTE from anon & public on internal functions
--   4. Scope RPC endpoints to authenticated & service_role
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Fix mutable search_path on public.is_admin
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 2. Fix permissive RLS policy on platform_settings
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Public can view platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;

CREATE POLICY "Public can view platform settings"
ON public.platform_settings
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage platform settings"
ON public.platform_settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ─────────────────────────────────────────────────────────────
-- 3. Revoke EXECUTE from anon & public on sensitive internal functions
-- ─────────────────────────────────────────────────────────────

-- is_admin: Internal helper, should not be exposed to anon or public RPC
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- prevent_user_role_escalation: Trigger function only; revoke from all external roles
REVOKE EXECUTE ON FUNCTION public.prevent_user_role_escalation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_user_role_escalation() TO service_role;

-- get_user_role: Revoke public/anon access
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────
-- 4. Secure RPC endpoints that legitimately require authenticated access
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public' AND proname = 'rpc_process_checkout'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rpc_process_checkout(uuid, jsonb, jsonb, text, text, integer) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.rpc_process_checkout(uuid, jsonb, jsonb, text, text, integer) TO authenticated, service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public' AND proname = 'rpc_delete_user_account'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rpc_delete_user_account() FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.rpc_delete_user_account() TO authenticated, service_role;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- Reload PostgREST schema cache
-- ─────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
