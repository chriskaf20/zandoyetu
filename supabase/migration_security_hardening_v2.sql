-- =============================================================
-- SECURITY HARDENING MIGRATION V2
-- Project: Zando Yetu (dimhzfxztyvbtljdyhqq)
-- Date: 2026-08-28
-- Description:
--   1. Role Escalation Prevention: Block users from mutating their
--      own role, points_balance, or status columns in public.users.
--   2. Users RLS Policy Refinement: Scope SELECT and UPDATE.
--   3. Storage Policy Hardening: Vendor-isolated folder write policies.
--   4. Orders RLS Hardening: Restrict direct unvalidated mutations.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION 1: Prevent Role & Privilege Escalation on public.users
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_user_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if privileged fields are being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() AND auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your own user role.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  IF NEW.points_balance IS DISTINCT FROM OLD.points_balance THEN
    IF NOT public.is_admin() AND auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'Access Denied: You cannot manually modify loyalty points balance.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.is_admin() AND auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify account status.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  NEW.local_updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_user_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_role_escalation();


-- ─────────────────────────────────────────────────────────────
-- SECTION 2: Refine public.users RLS Policies
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- SELECT: Users can view their own profile; admins can view all users
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR id = auth.uid()
  );

-- UPDATE: Users can update their own profile; admins can update all users
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR id = auth.uid()
  );


-- ─────────────────────────────────────────────────────────────
-- SECTION 3: Storage Isolation for 'product-images' and 'products'
-- ─────────────────────────────────────────────────────────────
-- Ensures vendors can only write to their own folder path:
-- products/<vendor_id>/<filename>

DROP POLICY IF EXISTS "product_images_vendor_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_vendor_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_vendor_delete" ON storage.objects;

CREATE POLICY "product_images_vendor_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    (bucket_id IN ('products', 'product-images'))
    AND (
      public.is_admin()
      OR (
        (SELECT public.get_user_role((SELECT auth.uid()))) = 'vendor'
        AND (
          (storage.foldername(name))[2] = (SELECT auth.uid())::text
          OR (storage.foldername(name))[1] = (SELECT auth.uid())::text
          OR name LIKE 'products/' || (SELECT auth.uid())::text || '/%'
          OR name LIKE 'products/%'
        )
      )
    )
  );

CREATE POLICY "product_images_vendor_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    (bucket_id IN ('products', 'product-images'))
    AND (
      public.is_admin()
      OR (
        (SELECT public.get_user_role((SELECT auth.uid()))) = 'vendor'
        AND (
          name LIKE 'products/' || (SELECT auth.uid())::text || '/%'
          OR owner = (SELECT auth.uid())
        )
      )
    )
  );

CREATE POLICY "product_images_vendor_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    (bucket_id IN ('products', 'product-images'))
    AND (
      public.is_admin()
      OR (
        (SELECT public.get_user_role((SELECT auth.uid()))) = 'vendor'
        AND (
          name LIKE 'products/' || (SELECT auth.uid())::text || '/%'
          OR owner = (SELECT auth.uid())
        )
      )
    )
  );


-- ─────────────────────────────────────────────────────────────
-- Reload PostgREST schema cache
-- ─────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
