-- =============================================================
-- MIGRATION V3 — 01 : SCHÉMA, INTÉGRITÉ & RÉPARATION DES DONNÉES
-- Project: Zando Yetu (dimhzfxztyvbtljdyhqq)
-- Date: 2026-11-09
-- Ordre d'exécution : hotfix_merchant_applications (appliqué) → 01_schema_integrity
--                     → 02_functions → 03_rls
--
--   1. Colonnes manquantes appelées par l'application
--      (stores.phone, coupons.current_uses…)
--   2. Commandes : statut 'shipped', moyen de paiement, snapshots prix/taux
--   3. Contraintes d'intégrité (prix, stock, ventes flash, taux)
--   4. Nouvelles tables : delivery_zones, fx_rate_history, order_status_history
--   5. products.category_id (clé étrangère vers categories)
--   6. Réparations : catégories héritées, profils manquants, index dupliqués
-- =============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. Colonnes manquantes
-- ─────────────────────────────────────────────────────────────

-- Téléphone/WhatsApp de la boutique (envoyé par le profil vendeur)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone text;

-- Candidatures vendeur : voir hotfix_merchant_applications.sql (appliqué en production
-- le 2026-11-10 ; date de naissance obligatoire, demandée par le formulaire)

-- Coupons : le trigger increment_coupon_usage met à jour current_uses (colonne absente
-- jusqu'ici : tout checkout avec code promo échouait). store_id NULL = coupon plateforme.
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS current_uses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_uses integer;
ALTER TABLE public.coupons ALTER COLUMN store_id DROP NOT NULL;
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_max_uses_check;
ALTER TABLE public.coupons
  ADD CONSTRAINT coupons_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0);

-- Paiements : 'awaiting_admin_clearance' (24 caractères) ne tenait pas dans varchar(20)
ALTER TABLE public.payment_transactions ALTER COLUMN status TYPE varchar(32);
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_status_check;
ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_status_check
  CHECK (status IN ('pending', 'awaiting_admin_clearance', 'confirmed', 'rejected', 'failed'));
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_provider_check;
ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_provider_check CHECK (provider IN ('mpesa', 'airtel', 'orange'));

-- Support : le formulaire envoie un sujet (colonne absente : création de ticket impossible)
ALTER TABLE public.ticket_threads ADD COLUMN IF NOT EXISTS subject text;

-- ─────────────────────────────────────────────────────────────
-- 2. Commandes
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash_on_delivery',
  ADD COLUMN IF NOT EXISTS unit_price_usd numeric(12,2),
  ADD COLUMN IF NOT EXISTS fx_rate numeric(12,4),
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS maps_link text,
  ADD COLUMN IF NOT EXISTS selected_size text,
  ADD COLUMN IF NOT EXISTS selected_color text,
  ADD COLUMN IF NOT EXISTS flash_sale_id uuid REFERENCES public.flash_sales(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS checkout_group_id uuid;

UPDATE public.orders
   SET payment_method = 'pay_at_store'
 WHERE delivery_type = 'In-Store Pickup' AND payment_method = 'cash_on_delivery';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cash_on_delivery', 'pay_at_store', 'mobile_money'));

-- 'shipped' est utilisé par le tableau de bord vendeur mais était refusé par la contrainte
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('pending', 'pending_payment', 'awaiting_admin_clearance', 'approved',
                          'processing', 'shipped', 'completed', 'cancelled'));

-- 'Home Delivery' : livraison payée par Mobile Money (rien à encaisser à la porte)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_type_check
  CHECK (delivery_type IN ('Cash on Delivery', 'In-Store Pickup', 'Home Delivery'));

-- ─────────────────────────────────────────────────────────────
-- 3. Contraintes d'intégrité
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_price_usd_check;
ALTER TABLE public.products ADD CONSTRAINT products_price_usd_check CHECK (price_usd > 0);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_stock_count_check;
ALTER TABLE public.products ADD CONSTRAINT products_stock_count_check CHECK (stock_count >= 0);

-- Un prix barré doit être supérieur au prix de vente
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_compare_at_price_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_compare_at_price_check
  CHECK (compare_at_price IS NULL OR compare_at_price > price_usd);

ALTER TABLE public.flash_sales DROP CONSTRAINT IF EXISTS flash_sales_window_check;
ALTER TABLE public.flash_sales ADD CONSTRAINT flash_sales_window_check CHECK (end_time > start_time);
ALTER TABLE public.flash_sales DROP CONSTRAINT IF EXISTS flash_sales_values_check;
ALTER TABLE public.flash_sales
  ADD CONSTRAINT flash_sales_values_check
  CHECK (flash_price_usd > 0 AND stock_limit > 0 AND COALESCE(items_sold, 0) >= 0);

ALTER TABLE public.platform_settings DROP CONSTRAINT IF EXISTS platform_settings_rates_check;
ALTER TABLE public.platform_settings
  ADD CONSTRAINT platform_settings_rates_check
  CHECK (exchange_rate > 0 AND commission_rate >= 0 AND commission_rate < 100);

-- ─────────────────────────────────────────────────────────────
-- 4. Nouvelles tables
-- ─────────────────────────────────────────────────────────────

-- Frais de livraison par commune (éditables depuis l'admin)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  commune text NOT NULL,
  fee_usd numeric(10,2) NOT NULL CHECK (fee_usd >= 0),
  free_delivery_threshold_usd numeric(10,2)
    CHECK (free_delivery_threshold_usd IS NULL OR free_delivery_threshold_usd > 0),
  eta_label text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, commune)
);

-- Valeurs initiales : 5 $ (offert dès 50 $) = comportement actuel du panier.
-- Kolwezi : valeur par défaut à ajuster par l'admin.
INSERT INTO public.delivery_zones (city, commune, fee_usd, free_delivery_threshold_usd, eta_label, sort_order)
VALUES
  ('Lubumbashi', 'Lubumbashi', 5.00, 200.00, '24h - 48h', 1),
  ('Lubumbashi', 'Kampemba',   5.00, 200.00, '24h - 48h', 2),
  ('Lubumbashi', 'Kenya',      5.00, 200.00, '24h - 48h', 3),
  ('Lubumbashi', 'Kamalondo',  5.00, 200.00, '24h - 48h', 4),
  ('Lubumbashi', 'Katuba',     5.00, 200.00, '24h - 48h', 5),
  ('Lubumbashi', 'Ruashi',     5.00, 200.00, '24h - 48h', 6),
  ('Lubumbashi', 'Annexe',     5.00, 200.00, '24h - 48h', 7),
  ('Kolwezi',    'Dilala',    10.00, NULL,  '2 - 4 jours', 8),
  ('Kolwezi',    'Manika',    10.00, NULL,  '2 - 4 jours', 9)
ON CONFLICT (city, commune) DO NOTHING;

-- Historique du taux USD/CDF (alimenté par trigger)
CREATE TABLE IF NOT EXISTS public.fx_rate_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rate numeric(12,4) NOT NULL CHECK (rate > 0),
  previous_rate numeric(12,4),
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.fx_rate_history (rate, previous_rate)
SELECT exchange_rate, NULL FROM public.platform_settings
WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM public.fx_rate_history);

-- Journal des changements de statut des commandes (arbitrage, litiges)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history (order_id, changed_at);

-- ─────────────────────────────────────────────────────────────
-- 5. Catégories : une seule source de vérité
-- ─────────────────────────────────────────────────────────────

-- L'ancienne arborescence anglaise (Curve, Men, Women…) restait active et passait
-- devant les 6 univers dans le Story Rail. Désactivée, pas supprimée.
WITH RECURSIVE legacy AS (
  SELECT id FROM public.categories
  WHERE parent_id IS NULL AND slug IN ('curve', 'home-living', 'kids-baby', 'men', 'women')
  UNION ALL
  SELECT c.id FROM public.categories c JOIN legacy l ON c.parent_id = l.id
)
UPDATE public.categories
   SET is_active = false, is_featured_home = false
 WHERE id IN (SELECT id FROM legacy);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Rattachement des produits existants (texte libre -> catégorie active)
UPDATE public.products p
   SET category_id = m.id
  FROM (
    SELECT DISTINCT ON (p2.id) p2.id AS product_id, c.id
    FROM public.products p2
    JOIN public.categories c
      ON c.is_active
     AND (
          lower(c.name) = lower(p2.category)
       OR lower(c.slug) = lower(p2.category)
       OR lower(c.name) LIKE lower(p2.category) || ' %'
       OR (lower(p2.category) = 'shoes' AND c.slug = 'chaussures')
     )
    WHERE p2.category IS NOT NULL AND p2.category_id IS NULL
    ORDER BY p2.id, c.tier DESC
  ) m
 WHERE p.id = m.product_id;

-- ─────────────────────────────────────────────────────────────
-- 6. Réparations & index
-- ─────────────────────────────────────────────────────────────

-- Comptes Auth sans profil public.users (fetchProfile renvoyait null)
INSERT INTO public.users (id, email, phone, role, points_balance, saved_coupons_count, status, local_updated_at, full_name)
SELECT au.id, COALESCE(au.email, ''), COALESCE(au.phone, ''), 'customer', 0, 0, 'active', now(),
       COALESCE(au.raw_user_meta_data->>'full_name', '')
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);

-- Index dupliqués signalés par l'advisor
DROP INDEX IF EXISTS public.idx_categories_parent_id;
DROP INDEX IF EXISTS public.idx_categories_slug;

CREATE INDEX IF NOT EXISTS idx_products_status_updated ON public.products (status, local_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_trending ON public.products (local_updated_at DESC) WHERE is_trending AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_orders_customer_ts ON public.orders (customer_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_ts ON public.orders (vendor_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_group ON public.orders (checkout_group_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_window ON public.flash_sales (end_time, start_time);
CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON public.coupons (store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons (created_by);
CREATE INDEX IF NOT EXISTS idx_user_coupon_usages_user ON public.user_coupon_usages (user_id);

-- Recherche plein texte tolérante (ILIKE '%…%')
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON public.products USING gin (title extensions.gin_trgm_ops);

COMMIT;
