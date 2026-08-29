-- Migration: Public RLS Policies for Storefront Catalog
-- Ensures non-authenticated (anonymous) visitors can freely browse products, stores, categories, banners & sales

-- 1. Helper Functions Execution Grants (Essential for RLS evaluation by anon)
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO public, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO public, anon, authenticated, service_role;

-- 2. Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "products_select" ON public.products;

CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO public
USING (true);

-- 3. Stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores;
DROP POLICY IF EXISTS "stores_select" ON public.stores;

CREATE POLICY "Public can view active stores"
ON public.stores
FOR SELECT
TO public
USING (true);

-- 4. Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "categories_select" ON public.categories;

CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
TO public
USING (true);

-- 5. Hero Banners
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view hero banners" ON public.hero_banners;
DROP POLICY IF EXISTS "hero_banners_select" ON public.hero_banners;

CREATE POLICY "Public can view hero banners"
ON public.hero_banners
FOR SELECT
TO public
USING (true);

-- 6. Flash Sales
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view flash sales" ON public.flash_sales;
DROP POLICY IF EXISTS "flash_sales_select" ON public.flash_sales;

CREATE POLICY "Public can view flash sales"
ON public.flash_sales
FOR SELECT
TO public
USING (true);

-- 7. Public Vendor Profiles (Allows anonymous visitors to see vendor full_name / phone)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;

CREATE POLICY "Users can read own profile, vendors are public"
ON public.users
FOR SELECT
TO public
USING (
  id = auth.uid() 
  OR is_admin() 
  OR role = 'vendor'
);
