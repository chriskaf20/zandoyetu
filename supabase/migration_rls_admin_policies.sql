-- ============================================================
-- Supabase RLS & Admin Policies Migration
-- Project: Zando Yetu (dimhzfxztyvbtljdyhqq)
-- Date: 2026-08-20
-- Description: Grant full admin privileges + scoped vendor/customer access
-- ============================================================

-- 1. Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Orders
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders"
ON public.orders FOR ALL TO authenticated
USING (
  public.is_admin()
  OR vendor_id = auth.uid()
  OR customer_id = auth.uid()
)
WITH CHECK (
  public.is_admin()
  OR vendor_id = auth.uid()
  OR customer_id = auth.uid()
);

-- ============================================================
-- 3. Products
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products"
ON public.products FOR ALL TO authenticated
USING (
  public.is_admin()
  OR vendor_id = auth.uid()
  OR status = 'active'
)
WITH CHECK (
  public.is_admin()
  OR vendor_id = auth.uid()
);

-- ============================================================
-- 4. Users
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
CREATE POLICY "Admins have full access to users"
ON public.users FOR ALL TO authenticated
USING (
  public.is_admin()
  OR id = auth.uid()
)
WITH CHECK (
  public.is_admin()
  OR id = auth.uid()
);

-- ============================================================
-- 5. Stores & Vendors
-- ============================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to stores" ON public.stores;
CREATE POLICY "Admins have full access to stores"
ON public.stores FOR ALL TO authenticated
USING (
  public.is_admin()
  OR vendor_id = auth.uid()
  OR is_archived = false
)
WITH CHECK (
  public.is_admin()
  OR vendor_id = auth.uid()
);

-- ============================================================
-- 6. Merchant Applications
-- ============================================================
ALTER TABLE public.merchant_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to merchant_applications" ON public.merchant_applications;
CREATE POLICY "Admins have full access to merchant_applications"
ON public.merchant_applications FOR ALL TO authenticated
USING (
  public.is_admin()
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin()
  OR user_id = auth.uid()
);

-- ============================================================
-- 7. Coupons
-- ============================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to coupons" ON public.coupons;
CREATE POLICY "Admins have full access to coupons"
ON public.coupons FOR ALL TO authenticated
USING (
  public.is_admin()
  OR created_by = auth.uid()
  OR status = 'active'
)
WITH CHECK (
  public.is_admin()
  OR created_by = auth.uid()
);

-- ============================================================
-- 8. Hero Banners
-- ============================================================
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to hero_banners" ON public.hero_banners;
CREATE POLICY "Admins have full access to hero_banners"
ON public.hero_banners FOR ALL TO authenticated
USING (
  public.is_admin()
  OR is_active = true
)
WITH CHECK (
  public.is_admin()
);

-- ============================================================
-- 9. Platform Settings
-- ============================================================
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to platform_settings" ON public.platform_settings;
CREATE POLICY "Admins have full access to platform_settings"
ON public.platform_settings FOR ALL TO authenticated
USING (true)
WITH CHECK (
  public.is_admin()
);

-- ============================================================
-- Done. All RLS policies applied.
-- ============================================================
