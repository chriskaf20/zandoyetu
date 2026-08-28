-- =============================================================================
-- Migration: Automatic CDF Price Recalculation on Exchange Rate Change
-- Target: public.platform_settings & public.products
-- =============================================================================

-- 1. Trigger Function: Sync All Product CDF Prices when platform FX changes
CREATE OR REPLACE FUNCTION public.trg_sync_product_cdf_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.exchange_rate IS DISTINCT FROM OLD.exchange_rate THEN
    UPDATE public.products
    SET price_cdf = ROUND(price_usd * NEW.exchange_rate),
        delivery_fee_cdf = ROUND(COALESCE(delivery_fee_usd, 0) * NEW.exchange_rate),
        local_updated_at = NOW()
    WHERE price_usd IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Attach Trigger on platform_settings
DROP TRIGGER IF EXISTS trg_sync_cdf_prices_on_fx_change ON public.platform_settings;
CREATE TRIGGER trg_sync_cdf_prices_on_fx_change
AFTER UPDATE OF exchange_rate ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_product_cdf_prices();

-- 3. Trigger Function: Auto-calculate CDF prices on individual Product INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.trg_set_product_cdf_price_on_upsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fx_rate double precision;
BEGIN
  SELECT exchange_rate INTO v_fx_rate FROM public.platform_settings LIMIT 1;
  IF v_fx_rate IS NULL OR v_fx_rate <= 0 THEN
    v_fx_rate := 2850;
  END IF;

  -- Compute price_cdf if missing or if price_usd changed
  IF NEW.price_usd IS NOT NULL AND (
    NEW.price_cdf IS NULL 
    OR NEW.price_cdf = 0 
    OR (TG_OP = 'UPDATE' AND NEW.price_usd IS DISTINCT FROM OLD.price_usd)
  ) THEN
    NEW.price_cdf := ROUND(NEW.price_usd * v_fx_rate);
  END IF;

  -- Compute delivery_fee_cdf if missing or changed
  IF NEW.delivery_fee_usd IS NOT NULL AND (
    NEW.delivery_fee_cdf IS NULL 
    OR (TG_OP = 'UPDATE' AND NEW.delivery_fee_usd IS DISTINCT FROM OLD.delivery_fee_usd)
  ) THEN
    NEW.delivery_fee_cdf := ROUND(NEW.delivery_fee_usd * v_fx_rate);
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach Trigger on products
DROP TRIGGER IF EXISTS trg_auto_calc_product_cdf_on_upsert ON public.products;
CREATE TRIGGER trg_auto_calc_product_cdf_on_upsert
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_product_cdf_price_on_upsert();

-- 5. One-time synchronization of all existing products with the current exchange rate
UPDATE public.products
SET price_cdf = ROUND(price_usd * COALESCE((SELECT exchange_rate FROM public.platform_settings LIMIT 1), 2850)),
    delivery_fee_cdf = ROUND(COALESCE(delivery_fee_usd, 0) * COALESCE((SELECT exchange_rate FROM public.platform_settings LIMIT 1), 2850))
WHERE price_usd IS NOT NULL;
