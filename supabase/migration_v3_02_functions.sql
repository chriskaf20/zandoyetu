-- =============================================================
-- MIGRATION V3 — 02 : FONCTIONS, TRIGGERS, RPC & VUES
-- Project: Zando Yetu (dimhzfxztyvbtljdyhqq)
-- Date: 2026-11-09
-- Prérequis : migration_v3_01_schema_integrity.sql
--
-- Les gardes (guard_*) sont SECURITY INVOKER : current_user y vaut le rôle
-- réel de l'appelant. Elles ne restreignent que les appels directs des
-- clients (anon | authenticated) ; les RPC SECURITY DEFINER, service_role
-- et le SQL editor passent.
-- =============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. Helpers RLS
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Ancienne fonction d'inscription non branchée : recopiait le rôle des métadonnées
DROP FUNCTION IF EXISTS public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. Gardes anti-escalade
-- ─────────────────────────────────────────────────────────────

-- Réécrit en SECURITY INVOKER : l'ancienne version testait auth.role(), qui reste
-- 'authenticated' dans une RPC SECURITY DEFINER, et faisait donc échouer toute
-- commande utilisant des points de fidélité.
CREATE OR REPLACE FUNCTION public.prevent_user_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NOT public.is_admin() THEN
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Accès refusé : vous ne pouvez pas modifier votre rôle.'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
      IF NEW.points_balance IS DISTINCT FROM OLD.points_balance THEN
        RAISE EXCEPTION 'Accès refusé : le solde de points ne peut pas être modifié manuellement.'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Accès refusé : vous ne pouvez pas modifier le statut du compte.'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
  END IF;

  NEW.local_updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Un profil créé par le client lui-même (politique users_insert) est toujours 'customer'
CREATE OR REPLACE FUNCTION public.guard_user_insert_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NOT public.is_admin() THEN
      NEW.role := 'customer';
      NEW.points_balance := 0;
      NEW.status := 'active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_insert_role ON public.users;
CREATE TRIGGER trg_guard_user_insert_role
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_insert_role();


-- ─────────────────────────────────────────────────────────────
-- 3. Gardes métier : produits, boutiques, commandes, ventes flash
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_product_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_trending := false;
    IF NEW.status IS NULL OR NEW.status NOT IN ('active', 'archived') THEN
      NEW.status := 'active';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.is_trending IS DISTINCT FROM OLD.is_trending THEN
    RAISE EXCEPTION 'Accès refusé : la mise en tendance est réservée à l''administration.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'suspended' THEN
      RAISE EXCEPTION 'Accès refusé : cet article a été suspendu par l''administration.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.status NOT IN ('active', 'archived') THEN
      RAISE EXCEPTION 'Statut d''article non autorisé : %', NEW.status
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Empêche de gonfler la réduction affichée pendant une vente flash
  IF NEW.price_usd > OLD.price_usd AND EXISTS (
    SELECT 1 FROM public.flash_sales fs
    WHERE fs.product_id = OLD.id AND fs.start_time <= now() AND fs.end_time > now()
  ) THEN
    RAISE EXCEPTION 'Le prix ne peut pas être augmenté pendant une vente flash.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_product_privileged_columns ON public.products;
CREATE TRIGGER trg_guard_product_privileged_columns
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_privileged_columns();

CREATE OR REPLACE FUNCTION public.guard_store_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := false;
    NEW.is_archived := false;
    NEW.pending_name := NULL;
    RETURN NEW;
  END IF;

  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.is_archived IS DISTINCT FROM OLD.is_archived THEN
    RAISE EXCEPTION 'Accès refusé : la certification et l''archivage sont gérés par l''administration.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.store_name IS DISTINCT FROM OLD.store_name THEN
    RAISE EXCEPTION 'Le changement de nom passe par une demande validée par l''administration.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_store_privileged_columns ON public.stores;
CREATE TRIGGER trg_guard_store_privileged_columns
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.guard_store_privileged_columns();

-- Appel direct d'un vendeur : statut seul, transitions du tableau de bord vendeur
CREATE OR REPLACE FUNCTION public.guard_order_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - 'order_status' - 'local_updated_at')
     IS DISTINCT FROM (to_jsonb(OLD) - 'order_status' - 'local_updated_at') THEN
    RAISE EXCEPTION 'Accès refusé : seul le statut de la commande peut être modifié.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.order_status IS DISTINCT FROM OLD.order_status AND NOT (
       (OLD.order_status = 'approved'   AND NEW.order_status = 'processing')
    OR (OLD.order_status = 'processing' AND NEW.order_status = 'shipped')
    OR (OLD.order_status = 'shipped'    AND NEW.order_status = 'completed')
  ) THEN
    RAISE EXCEPTION 'Transition de statut non autorisée : % -> %', OLD.order_status, NEW.order_status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Préfixe 00 : s'exécute avant les autres triggers et ne voit que les changements du client
DROP TRIGGER IF EXISTS trg_00_guard_order_updates ON public.orders;
CREATE TRIGGER trg_00_guard_order_updates
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_updates();

-- Règles des ventes flash, valables quel que soit l'appelant
CREATE OR REPLACE FUNCTION public.guard_flash_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_price double precision;
  v_stock integer;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.product_id = OLD.product_id
     AND NEW.flash_price_usd = OLD.flash_price_usd
     AND NEW.stock_limit = OLD.stock_limit
     AND NEW.start_time = OLD.start_time
     AND NEW.end_time = OLD.end_time THEN
    RETURN NEW; -- incrément de items_sold par le checkout
  END IF;

  SELECT price_usd, stock_count INTO v_price, v_stock
    FROM public.products WHERE id = NEW.product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable pour la vente flash.' USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.flash_price_usd >= v_price THEN
    RAISE EXCEPTION 'Le prix flash (% $) doit être inférieur au prix normal (% $).', NEW.flash_price_usd, v_price
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.stock_limit > v_stock + COALESCE(NEW.items_sold, 0) THEN
    RAISE EXCEPTION 'Le stock flash (%) dépasse le stock disponible (%).', NEW.stock_limit, v_stock
      USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.flash_sales f
    WHERE f.product_id = NEW.product_id
      AND f.id <> NEW.id
      AND tstzrange(f.start_time, f.end_time) && tstzrange(NEW.start_time, NEW.end_time)
  ) THEN
    RAISE EXCEPTION 'Une autre vente flash couvre déjà cette période pour ce produit.'
      USING ERRCODE = 'exclusion_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_flash_sale ON public.flash_sales;
CREATE TRIGGER trg_guard_flash_sale
  BEFORE INSERT OR UPDATE ON public.flash_sales
  FOR EACH ROW EXECUTE FUNCTION public.guard_flash_sale();


-- ─────────────────────────────────────────────────────────────
-- 4. Taux de change : invariant CDF + historique
-- ─────────────────────────────────────────────────────────────

-- price_cdf est toujours dérivé de price_usd (le vendeur ne peut plus le fixer)
CREATE OR REPLACE FUNCTION public.trg_set_product_cdf_price_on_upsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fx_rate double precision;
BEGIN
  SELECT exchange_rate INTO v_fx_rate FROM public.platform_settings WHERE id = 1;
  IF v_fx_rate IS NULL OR v_fx_rate <= 0 THEN
    v_fx_rate := 2300;
  END IF;

  NEW.price_cdf := ROUND(NEW.price_usd * v_fx_rate);
  NEW.delivery_fee_cdf := CASE
    WHEN NEW.delivery_fee_usd IS NULL THEN NULL
    ELSE ROUND(NEW.delivery_fee_usd * v_fx_rate)
  END;

  RETURN NEW;
END;
$$;

-- Ne touche plus local_updated_at : le fil d'accueil (trié sur cette colonne)
-- n'est plus mélangé à chaque changement de taux.
CREATE OR REPLACE FUNCTION public.trg_sync_product_cdf_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.exchange_rate IS DISTINCT FROM OLD.exchange_rate THEN
    UPDATE public.products
       SET price_cdf = ROUND(price_usd * NEW.exchange_rate),
           delivery_fee_cdf = CASE
             WHEN delivery_fee_usd IS NULL THEN NULL
             ELSE ROUND(delivery_fee_usd * NEW.exchange_rate)
           END;

    INSERT INTO public.fx_rate_history (rate, previous_rate, changed_by)
    VALUES (NEW.exchange_rate, OLD.exchange_rate, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 5. Commandes : stock, coupons, journal des statuts
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_order_stock_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validation : déduction du stock
  IF NEW.order_status = 'approved' AND OLD.order_status IS DISTINCT FROM 'approved' THEN
    IF (SELECT stock_count FROM public.products WHERE id = NEW.product_id) < NEW.quantity THEN
      RAISE EXCEPTION 'Stock insuffisant pour valider la commande (produit %, demandé %).',
        NEW.product_id, NEW.quantity
        USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.products
       SET stock_count = stock_count - NEW.quantity,
           local_updated_at = timezone('utc'::text, now())
     WHERE id = NEW.product_id;

  -- Annulation après validation : restitution du stock
  ELSIF NEW.order_status = 'cancelled'
        AND OLD.order_status IN ('approved', 'processing', 'shipped') THEN
    UPDATE public.products
       SET stock_count = stock_count + NEW.quantity,
           local_updated_at = timezone('utc'::text, now())
     WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.coupons
     SET current_uses = current_uses + 1
   WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.order_status, auth.uid());
  ELSIF NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.order_status, NEW.order_status, auth.uid());
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status_change ON public.orders;
CREATE TRIGGER trg_log_order_status_change
  AFTER INSERT OR UPDATE OF order_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();


-- ─────────────────────────────────────────────────────────────
-- 6. Checkout
-- ─────────────────────────────────────────────────────────────
-- Corrige : client imposé par auth.uid(), remise points réellement appliquée,
-- frais de livraison par commune, stock flash vérifié avec la quantité,
-- coupons plateforme, limites d'utilisation, taille/couleur et snapshots
-- prix/taux enregistrés, Mobile Money (paiement manuel validé par l'admin).

DROP FUNCTION IF EXISTS public.rpc_process_checkout(uuid, jsonb, jsonb, text, text, integer);

CREATE OR REPLACE FUNCTION public.rpc_process_checkout(
  p_customer_id uuid,
  p_items jsonb,
  p_delivery_address jsonb,
  p_payment_method text DEFAULT 'Cash on Delivery',
  p_promo_code text DEFAULT NULL,
  p_points_redeemed integer DEFAULT 0,
  p_payment_details jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c_point_value CONSTANT numeric := 0.20;

  v_uid uuid := auth.uid();
  v_customer_status text;
  v_points_balance integer;
  v_points_requested integer := GREATEST(COALESCE(p_points_redeemed, 0), 0);
  v_points_used integer := 0;
  v_points_discount numeric(12,2) := 0;

  v_rate numeric;
  v_momo_active integer;

  v_is_pickup boolean;
  v_is_momo boolean;
  v_payment_method text;
  v_delivery_type text;
  v_initial_status text;
  v_momo_provider text;
  v_momo_phone text;
  v_momo_reference text;

  v_coupon public.coupons%ROWTYPE;
  v_coupon_vendor uuid;
  v_coupon_applied boolean := false;

  v_zone public.delivery_zones%ROWTYPE;
  v_address text;
  v_commune text;
  v_landmark text;
  v_maps_link text;
  v_delivery_fee numeric(12,2) := 0;

  v_group_id uuid := gen_random_uuid();
  v_item jsonb;
  v_line jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_requested jsonb := '{}'::jsonb;
  v_line_count integer;
  v_idx integer;

  v_product record;
  v_flash record;
  v_product_id uuid;
  v_quantity integer;
  v_unit numeric(12,2);
  v_line_subtotal numeric(12,2);
  v_line_coupon numeric(12,2);
  v_line_points numeric(12,2);
  v_points_left numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_coupon_total numeric(12,2) := 0;
  v_after_coupon numeric(12,2);
  v_line_total numeric(12,2);
  v_grand_total numeric(12,2) := 0;

  v_order_id uuid;
  v_order_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  -- 1. Identité : on ne commande que pour soi-même
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Connectez-vous pour passer commande.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_customer_id IS DISTINCT FROM v_uid AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : commande pour un autre compte.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT status, COALESCE(points_balance, 0) INTO v_customer_status, v_points_balance
    FROM public.users WHERE id = p_customer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil client introuvable.' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF v_customer_status = 'suspended' THEN
    RAISE EXCEPTION 'Ce compte est suspendu. Contactez le support Zando Yetu.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Le panier est vide.' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT exchange_rate, mobile_money_active INTO v_rate, v_momo_active
    FROM public.platform_settings WHERE id = 1;
  v_rate := COALESCE(NULLIF(v_rate, 0), 2300);

  -- 2. Moyen de paiement & mode de remise
  p_payment_method := COALESCE(p_payment_method, 'Cash on Delivery');
  v_is_momo := p_payment_method = 'Mobile Money';
  IF p_payment_method NOT IN ('Cash on Delivery', 'In-Store Pickup', 'Mobile Money') THEN
    RAISE EXCEPTION 'Moyen de paiement inconnu : %', p_payment_method USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_is_momo THEN
    IF COALESCE(v_momo_active, 0) <> 1 THEN
      RAISE EXCEPTION 'Le paiement Mobile Money est momentanément indisponible.' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    v_momo_provider := lower(COALESCE(p_payment_details->>'provider', ''));
    v_momo_phone := NULLIF(trim(COALESCE(p_payment_details->>'phone', '')), '');
    v_momo_reference := NULLIF(trim(COALESCE(p_payment_details->>'reference', '')), '');
    IF v_momo_provider NOT IN ('mpesa', 'airtel', 'orange') THEN
      RAISE EXCEPTION 'Choisissez M-Pesa, Airtel Money ou Orange Money.' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF v_momo_phone IS NULL OR v_momo_reference IS NULL THEN
      RAISE EXCEPTION 'Numéro payeur et référence de transaction Mobile Money requis.' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    v_is_pickup := COALESCE(p_payment_details->>'fulfillment', 'delivery') = 'pickup';
    v_payment_method := 'mobile_money';
    v_delivery_type := CASE WHEN v_is_pickup THEN 'In-Store Pickup' ELSE 'Home Delivery' END;
    v_initial_status := 'awaiting_admin_clearance';
  ELSE
    v_is_pickup := p_payment_method = 'In-Store Pickup';
    v_payment_method := CASE WHEN v_is_pickup THEN 'pay_at_store' ELSE 'cash_on_delivery' END;
    v_delivery_type := p_payment_method;
    v_initial_status := 'pending';
  END IF;

  -- 3. Adresse & zone de livraison
  v_address := NULLIF(trim(COALESCE(p_delivery_address->>'address', p_delivery_address->>'shipping_address', '')), '');
  v_commune := NULLIF(trim(COALESCE(p_delivery_address->>'commune', '')), '');
  v_landmark := NULLIF(trim(COALESCE(p_delivery_address->>'nearest_landmark', '')), '');
  v_maps_link := NULLIF(trim(COALESCE(p_delivery_address->>'maps_link', '')), '');
  IF v_maps_link IS NOT NULL AND v_maps_link !~* '^https://' THEN
    v_maps_link := NULL;
  END IF;

  IF NOT v_is_pickup THEN
    IF (p_delivery_address->>'zone_id') IS NOT NULL THEN
      SELECT * INTO v_zone FROM public.delivery_zones
       WHERE id = (p_delivery_address->>'zone_id')::uuid AND is_active;
    ELSIF v_commune IS NOT NULL THEN
      -- Compatibilité : anciens clients envoyant « Dilala (Kolwezi) »
      SELECT * INTO v_zone FROM public.delivery_zones
       WHERE is_active
         AND (lower(commune) = lower(v_commune) OR lower(commune || ' (' || city || ')') = lower(v_commune))
       ORDER BY sort_order LIMIT 1;
    END IF;

    IF v_zone.id IS NULL THEN
      RAISE EXCEPTION 'Commune non desservie pour la livraison. Choisissez une commune de la liste.'
        USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF v_address IS NULL OR v_landmark IS NULL THEN
      RAISE EXCEPTION 'Adresse et point de repère requis pour la livraison.' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    v_commune := v_zone.commune;
  END IF;

  -- 4. Code promo
  IF p_promo_code IS NOT NULL AND trim(p_promo_code) <> '' THEN
    SELECT * INTO v_coupon FROM public.coupons
     WHERE code = upper(trim(p_promo_code)) AND status = 'active'
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Code promo « % » invalide ou inactif.', p_promo_code USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'Le code promo « % » est épuisé.', v_coupon.code USING ERRCODE = 'check_violation';
    END IF;
    IF EXISTS (SELECT 1 FROM public.user_coupon_usages WHERE coupon_id = v_coupon.id AND user_id = p_customer_id) THEN
      RAISE EXCEPTION 'Vous avez déjà utilisé le code promo « % ».', v_coupon.code USING ERRCODE = 'check_violation';
    END IF;
    IF v_coupon.store_id IS NOT NULL THEN
      SELECT vendor_id INTO v_coupon_vendor FROM public.stores WHERE id = v_coupon.store_id;
    END IF;
  END IF;

  -- 5. Lignes : prix serveur (flash inclus), stock, remise coupon
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

    IF v_product_id IS NULL OR v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Article invalide dans le panier.' USING ERRCODE = 'invalid_parameter_value';
    END IF;

    SELECT id, vendor_id, title, price_usd, stock_count, status INTO v_product
      FROM public.products WHERE id = v_product_id FOR UPDATE;
    IF NOT FOUND OR v_product.status <> 'active' THEN
      RAISE EXCEPTION 'Un article du panier n''est plus disponible.' USING ERRCODE = 'invalid_parameter_value';
    END IF;

    v_requested := jsonb_set(
      v_requested, ARRAY[v_product_id::text],
      to_jsonb(COALESCE((v_requested->>v_product_id::text)::integer, 0) + v_quantity)
    );
    IF v_product.stock_count < (v_requested->>v_product_id::text)::integer THEN
      RAISE EXCEPTION 'Stock insuffisant pour « % » (disponible : %).', v_product.title, v_product.stock_count
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT id, flash_price_usd, stock_limit - COALESCE(items_sold, 0) AS remaining INTO v_flash
      FROM public.flash_sales
     WHERE product_id = v_product_id
       AND start_time <= now() AND end_time > now()
       AND COALESCE(items_sold, 0) < stock_limit
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE;

    IF v_flash.id IS NOT NULL THEN
      IF v_quantity > v_flash.remaining THEN
        RAISE EXCEPTION 'Vente flash « % » : il ne reste que % article(s) à ce prix.', v_product.title, v_flash.remaining
          USING ERRCODE = 'check_violation';
      END IF;
      v_unit := ROUND(v_flash.flash_price_usd::numeric, 2);
      UPDATE public.flash_sales SET items_sold = COALESCE(items_sold, 0) + v_quantity WHERE id = v_flash.id;
    ELSE
      v_unit := ROUND(v_product.price_usd::numeric, 2);
    END IF;

    v_line_subtotal := ROUND(v_unit * v_quantity, 2);
    v_line_coupon := 0;
    IF v_coupon.id IS NOT NULL AND (v_coupon.store_id IS NULL OR v_product.vendor_id = v_coupon_vendor) THEN
      v_line_coupon := ROUND(v_line_subtotal * v_coupon.discount_percent / 100.0, 2);
      v_coupon_applied := true;
    END IF;

    v_subtotal := v_subtotal + v_line_subtotal;
    v_coupon_total := v_coupon_total + v_line_coupon;

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product_id,
      'vendor_id', v_product.vendor_id,
      'quantity', v_quantity,
      'unit', v_unit,
      'subtotal', v_line_subtotal,
      'coupon', v_line_coupon,
      'flash_sale_id', v_flash.id,
      'size', NULLIF(v_item->>'size', ''),
      'color', NULLIF(v_item->>'color', '')
    );
  END LOOP;

  IF v_coupon.id IS NOT NULL AND NOT v_coupon_applied THEN
    RAISE EXCEPTION 'Le code promo « % » ne s''applique à aucun article du panier.', v_coupon.code
      USING ERRCODE = 'check_violation';
  END IF;

  v_after_coupon := v_subtotal - v_coupon_total;

  -- 6. Points de fidélité : plafonnés au montant restant
  IF v_points_requested > 0 THEN
    IF v_points_balance < v_points_requested THEN
      RAISE EXCEPTION 'Solde de points insuffisant (disponible : %).', v_points_balance USING ERRCODE = 'check_violation';
    END IF;
    v_points_used := LEAST(v_points_requested, FLOOR(v_after_coupon / c_point_value)::integer);
    v_points_discount := ROUND(v_points_used * c_point_value, 2);
  END IF;

  -- 7. Frais de livraison (une fois par commande, sur la première ligne)
  IF NOT v_is_pickup THEN
    v_delivery_fee := CASE
      WHEN v_zone.free_delivery_threshold_usd IS NOT NULL AND v_subtotal >= v_zone.free_delivery_threshold_usd THEN 0
      ELSE v_zone.fee_usd
    END;
  END IF;

  -- 8. Création des lignes de commande
  v_line_count := jsonb_array_length(v_lines);
  v_points_left := v_points_discount;
  v_idx := 0;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines)
  LOOP
    v_idx := v_idx + 1;
    IF v_idx = v_line_count THEN
      v_line_points := v_points_left;
    ELSIF v_after_coupon > 0 THEN
      v_line_points := ROUND(
        v_points_discount * ((v_line->>'subtotal')::numeric - (v_line->>'coupon')::numeric) / v_after_coupon, 2
      );
    ELSE
      v_line_points := 0;
    END IF;
    v_points_left := v_points_left - v_line_points;

    v_line_total := GREATEST(0,
      (v_line->>'subtotal')::numeric - (v_line->>'coupon')::numeric - v_line_points);
    v_grand_total := v_grand_total + v_line_total;

    INSERT INTO public.orders (
      customer_id, product_id, vendor_id, order_status,
      total_usd, total_cdf, "timestamp",
      shipping_address, delivery_address, commune, city, nearest_landmark, maps_link,
      delivery_type, payment_method, payment_reference,
      points_redeemed, discount_amount_usd, quantity, delivery_fee,
      unit_price_usd, fx_rate, selected_size, selected_color, flash_sale_id, checkout_group_id,
      local_updated_at
    ) VALUES (
      p_customer_id, (v_line->>'product_id')::uuid, (v_line->>'vendor_id')::uuid, v_initial_status,
      v_line_total, ROUND(v_line_total * v_rate), now(),
      COALESCE(v_address, 'Retrait en boutique'), COALESCE(v_address, 'Retrait en boutique'),
      v_commune, v_zone.city, v_landmark, v_maps_link,
      v_delivery_type, v_payment_method, v_momo_reference,
      CASE WHEN v_idx = 1 THEN v_points_used ELSE 0 END,
      (v_line->>'coupon')::numeric + v_line_points,
      (v_line->>'quantity')::integer,
      CASE WHEN v_idx = 1 THEN v_delivery_fee ELSE 0 END,
      (v_line->>'unit')::numeric, v_rate, v_line->>'size', v_line->>'color',
      NULLIF(v_line->>'flash_sale_id', '')::uuid, v_group_id,
      now()
    )
    RETURNING id INTO v_order_id;

    v_order_ids := array_append(v_order_ids, v_order_id);
  END LOOP;

  -- 9. Points, coupon, paiement Mobile Money
  IF v_points_used > 0 THEN
    UPDATE public.users
       SET points_balance = points_balance - v_points_used
     WHERE id = p_customer_id;
  END IF;

  IF v_coupon.id IS NOT NULL THEN
    INSERT INTO public.user_coupon_usages (coupon_id, user_id, used_at)
    VALUES (v_coupon.id, p_customer_id, now());
  END IF;

  IF v_is_momo THEN
    INSERT INTO public.payment_transactions (
      customer_id, provider, phone_number, amount_usd, amount_cdf, currency,
      status, order_ids, provider_reference
    ) VALUES (
      p_customer_id, v_momo_provider, v_momo_phone,
      v_grand_total + v_delivery_fee, ROUND((v_grand_total + v_delivery_fee) * v_rate), 'USD',
      'awaiting_admin_clearance', v_order_ids, v_momo_reference
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_ids', to_jsonb(v_order_ids),
    'checkout_group_id', v_group_id,
    'subtotal_usd', v_subtotal,
    'discount_usd', v_coupon_total + v_points_discount,
    'points_used', v_points_used,
    'delivery_fee_usd', v_delivery_fee,
    'total_usd', v_grand_total + v_delivery_fee,
    'total_cdf', ROUND((v_grand_total + v_delivery_fee) * v_rate),
    'payment_status', CASE WHEN v_is_momo THEN 'awaiting_admin_clearance' ELSE 'pending' END,
    'message', CASE
      WHEN v_is_momo THEN 'Commande enregistrée : votre paiement Mobile Money est en cours de vérification.'
      ELSE 'Commande passée avec succès.'
    END
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 7. RPC publiques
-- ─────────────────────────────────────────────────────────────

-- Validation d'un code promo sans exposer la liste des codes
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_vendor uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Connectez-vous pour utiliser un code promo.');
  END IF;

  SELECT * INTO v_coupon FROM public.coupons
   WHERE code = upper(trim(COALESCE(p_code, ''))) AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Code promo invalide ou expiré.');
  END IF;
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Ce code promo est épuisé.');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_coupon_usages WHERE coupon_id = v_coupon.id AND user_id = auth.uid()) THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Vous avez déjà utilisé ce code promo.');
  END IF;

  IF v_coupon.store_id IS NOT NULL THEN
    SELECT vendor_id INTO v_vendor FROM public.stores WHERE id = v_coupon.store_id;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'id', v_coupon.id,
    'code', v_coupon.code,
    'discount_percent', v_coupon.discount_percent,
    'store_id', v_coupon.store_id,
    'vendor_id', v_vendor,
    'status', v_coupon.status,
    'created_by', v_coupon.created_by,
    'created_at', v_coupon.created_at
  );
END;
$$;

-- Nombre d'abonnés d'une boutique (store_favorites n'est lisible que par son auteur)
CREATE OR REPLACE FUNCTION public.store_favorites_count(p_store_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::integer FROM public.store_favorites WHERE store_id = p_store_id;
$$;


-- ─────────────────────────────────────────────────────────────
-- 8. RPC d'administration (transactionnelles)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.assert_admin()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès réservé à l''administration.' USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_merchant_application(p_application_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_app public.merchant_applications%ROWTYPE;
  v_store_id uuid;
BEGIN
  PERFORM public.assert_admin();

  SELECT * INTO v_app FROM public.merchant_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND OR v_app.user_id IS NULL THEN
    RAISE EXCEPTION 'Candidature introuvable ou sans compte associé.' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_app.status <> 'pending' THEN
    RAISE EXCEPTION 'Cette candidature a déjà été traitée.' USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.users
     SET role = 'vendor', status = 'active',
         phone = COALESCE(NULLIF(phone, ''), v_app.phone)
   WHERE id = v_app.user_id;

  SELECT id INTO v_store_id FROM public.stores WHERE vendor_id = v_app.user_id ORDER BY created_at LIMIT 1;
  IF v_store_id IS NULL THEN
    INSERT INTO public.stores (vendor_id, store_name, city, description, phone, is_archived, momo_enabled, is_verified)
    VALUES (v_app.user_id, v_app.store_name, v_app.operational_city, v_app.product_focus, v_app.phone, false, true, true)
    RETURNING id INTO v_store_id;
  ELSE
    UPDATE public.stores
       SET store_name = v_app.store_name, city = v_app.operational_city,
           description = COALESCE(NULLIF(description, ''), v_app.product_focus),
           phone = COALESCE(phone, v_app.phone),
           is_archived = false, is_verified = true
     WHERE id = v_store_id;
  END IF;

  -- settlement_ledger et store_follows référencent vendors
  INSERT INTO public.vendors (id, store_name, city, description)
  VALUES (v_app.user_id, v_app.store_name, v_app.operational_city, v_app.product_focus)
  ON CONFLICT (id) DO UPDATE SET store_name = EXCLUDED.store_name, city = EXCLUDED.city;

  UPDATE public.merchant_applications
     SET status = 'approved', reviewed_at = now()
   WHERE id = p_application_id;

  RETURN v_store_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_merchant_application(p_application_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.assert_admin();
  UPDATE public.merchant_applications
     SET status = 'rejected', reviewed_at = now()
   WHERE id = p_application_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidature introuvable ou déjà traitée.' USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_store_approval(p_store_id uuid, p_approved boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vendor uuid;
BEGIN
  PERFORM public.assert_admin();
  SELECT vendor_id INTO v_vendor FROM public.stores WHERE id = p_store_id FOR UPDATE;
  IF v_vendor IS NULL THEN
    RAISE EXCEPTION 'Boutique introuvable.' USING ERRCODE = 'no_data_found';
  END IF;

  IF p_approved THEN
    UPDATE public.stores SET is_verified = true, is_archived = false WHERE id = p_store_id;
    UPDATE public.users SET role = 'vendor' WHERE id = v_vendor AND role = 'customer';
  ELSE
    UPDATE public.stores SET is_verified = false, is_archived = true WHERE id = p_store_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_archive_store(p_store_id uuid, p_demote_vendor boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vendor uuid;
BEGIN
  PERFORM public.assert_admin();
  SELECT vendor_id INTO v_vendor FROM public.stores WHERE id = p_store_id FOR UPDATE;
  IF v_vendor IS NULL THEN
    RAISE EXCEPTION 'Boutique introuvable.' USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE public.stores SET is_archived = true WHERE id = p_store_id;
  UPDATE public.products SET status = 'suspended' WHERE vendor_id = v_vendor AND status = 'active';
  IF p_demote_vendor THEN
    UPDATE public.users SET role = 'customer' WHERE id = v_vendor AND role = 'vendor';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_payment(p_transaction_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_txn public.payment_transactions%ROWTYPE;
  v_count integer;
BEGIN
  PERFORM public.assert_admin();
  SELECT * INTO v_txn FROM public.payment_transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction introuvable.' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_txn.status NOT IN ('pending', 'awaiting_admin_clearance') THEN
    RAISE EXCEPTION 'Transaction déjà traitée (%).', v_txn.status USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.payment_transactions SET status = 'confirmed', updated_at = now() WHERE id = p_transaction_id;

  UPDATE public.orders
     SET order_status = 'approved', local_updated_at = now()
   WHERE id = ANY (v_txn.order_ids)
     AND order_status IN ('pending', 'pending_payment', 'awaiting_admin_clearance');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_payment(p_transaction_id uuid, p_reason text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_txn public.payment_transactions%ROWTYPE;
  v_count integer;
BEGIN
  PERFORM public.assert_admin();
  SELECT * INTO v_txn FROM public.payment_transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction introuvable.' USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE public.payment_transactions
     SET status = 'rejected', failure_reason = p_reason, updated_at = now()
   WHERE id = p_transaction_id;

  UPDATE public.orders
     SET order_status = 'cancelled', local_updated_at = now()
   WHERE id = ANY (v_txn.order_ids)
     AND order_status IN ('pending', 'pending_payment', 'awaiting_admin_clearance');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 9. Vues exécutées avec les droits du propriétaire
-- ─────────────────────────────────────────────────────────────

-- Profil vendeur public : nom de boutique et téléphone, sans email/adresse/points
CREATE OR REPLACE VIEW public.public_vendor_profiles
WITH (security_invoker = false) AS
SELECT
  u.id,
  COALESCE(NULLIF(s.store_name, ''), NULLIF(u.full_name, ''), 'Boutique Zando') AS full_name,
  COALESCE(NULLIF(s.phone, ''), NULLIF(u.phone, '')) AS phone,
  s.id AS store_id,
  s.store_logo_url,
  s.city,
  COALESCE(s.is_verified, false) AS is_verified
FROM public.users u
LEFT JOIN LATERAL (
  SELECT st.id, st.store_name, st.phone, st.store_logo_url, st.city, st.is_verified
  FROM public.stores st
  WHERE st.vendor_id = u.id AND st.is_archived = false
  ORDER BY st.created_at
  LIMIT 1
) s ON true
WHERE u.role = 'vendor';

-- Contact client des commandes d'un vendeur (livraison, bon de livraison)
CREATE OR REPLACE VIEW public.vendor_order_contacts
WITH (security_invoker = false) AS
SELECT
  o.id AS order_id,
  o.vendor_id,
  o.customer_id,
  NULLIF(u.full_name, '') AS full_name,
  NULLIF(u.phone, '') AS phone
FROM public.orders o
JOIN public.users u ON u.id = o.customer_id
WHERE o.vendor_id = auth.uid() OR public.is_admin();

-- Auteur d'un avis : « Prénom I. » uniquement (ni email ni nom complet)
CREATE OR REPLACE VIEW public.public_review_authors
WITH (security_invoker = false) AS
SELECT
  u.id,
  COALESCE(n.p[1] || COALESCE(' ' || upper(left(n.p[2], 1)) || '.', ''), 'Client Zando') AS display_name
FROM public.users u
CROSS JOIN LATERAL (
  SELECT regexp_split_to_array(NULLIF(trim(u.full_name), ''), '\s+') AS p
) n
WHERE EXISTS (SELECT 1 FROM public.reviews r WHERE r.customer_id = u.id);

COMMIT;
