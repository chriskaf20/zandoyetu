-- =============================================================
-- MIGRATION V3 — 04 : RENDU « PORTANT » DES PRODUITS
-- Project: Zando Yetu (dimhzfxztyvbtljdyhqq)
-- Date: 2026-11-22
--
-- products.rail_images : détourages transparents (canevas 800×1141, ratio du portant)
--   { "front": url, "back": url?, "source": url de la photo d'origine }
-- =============================================================

BEGIN;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rail_images jsonb;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_rail_images_shape;
ALTER TABLE public.products ADD CONSTRAINT products_rail_images_shape CHECK (
  rail_images IS NULL
  OR (jsonb_typeof(rail_images) = 'object' AND jsonb_typeof(rail_images -> 'front') = 'string')
);

CREATE INDEX IF NOT EXISTS products_rail_ready_idx
  ON public.products (local_updated_at DESC)
  WHERE rail_images IS NOT NULL AND status = 'active';

COMMIT;
