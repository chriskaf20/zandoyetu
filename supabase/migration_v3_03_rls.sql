-- =============================================================
-- MIGRATION V3 — 03 : RLS, STORAGE & PRIVILÈGES
-- Project: Zando Yetu (dimhzfxztyvbtljdyhqq)
-- Date: 2026-11-09
-- Prérequis : migration_v3_01 puis migration_v3_02
--
-- Toutes les politiques du schéma public sont supprimées puis recréées :
-- les politiques permissives se cumulent par OR, une seule politique oubliée
-- (« FOR ALL … OR status = 'active' » par exemple) suffit à rouvrir une faille.
--
-- Conventions :
--   * une politique par rôle et par commande (advisor multiple_permissive_policies) ;
--   * les politiques anon n'appellent aucune fonction (anon n'a plus EXECUTE) ;
--   * auth.uid() / is_admin() enveloppés dans (SELECT …) : évalués une fois par requête.
-- Remplace : migration_rls_admin_policies.sql, migration_public_catalog_rls.sql,
-- migration_security_hardening_v2.sql, migration_security_advisor_fixes.sql.
-- =============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 0. Page blanche
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 1. Catalogue
-- ─────────────────────────────────────────────────────────────

-- categories
CREATE POLICY categories_select_anon ON public.categories
  FOR SELECT TO anon USING (is_active);
CREATE POLICY categories_select_auth ON public.categories
  FOR SELECT TO authenticated USING (is_active OR (SELECT public.is_admin()));
CREATE POLICY categories_insert_admin ON public.categories
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY categories_update_admin ON public.categories
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY categories_delete_admin ON public.categories
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- Taxonomie héritée (lecture seule)
CREATE POLICY macro_demographics_select ON public.macro_demographics
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY parent_categories_select ON public.parent_categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY subcategories_select ON public.subcategories
  FOR SELECT TO anon, authenticated USING (true);

-- products
CREATE POLICY products_select_anon ON public.products
  FOR SELECT TO anon USING (status = 'active');
CREATE POLICY products_select_auth ON public.products
  FOR SELECT TO authenticated
  USING (
    status = 'active'
    OR vendor_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.product_id = products.id AND o.customer_id = (SELECT auth.uid())
    )
  );
CREATE POLICY products_insert ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (vendor_id = (SELECT auth.uid()) AND (SELECT public.current_user_role()) = 'vendor')
  );
CREATE POLICY products_update ON public.products
  FOR UPDATE TO authenticated
  USING (vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY products_delete ON public.products
  FOR DELETE TO authenticated
  USING (vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- stores
CREATE POLICY stores_select_anon ON public.stores
  FOR SELECT TO anon USING (is_archived = false);
CREATE POLICY stores_select_auth ON public.stores
  FOR SELECT TO authenticated
  USING (is_archived = false OR vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY stores_insert ON public.stores
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (vendor_id = (SELECT auth.uid()) AND (SELECT public.current_user_role()) = 'vendor')
  );
CREATE POLICY stores_update ON public.stores
  FOR UPDATE TO authenticated
  USING (vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY stores_delete_admin ON public.stores
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- vendors (miroir public des boutiques, géré par l'admin)
CREATE POLICY vendors_select ON public.vendors
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY vendors_insert_admin ON public.vendors
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY vendors_update_admin ON public.vendors
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY vendors_delete_admin ON public.vendors
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- flash_sales : création et prix réservés à l'admin ; ventes programmées masquées
CREATE POLICY flash_sales_select_anon ON public.flash_sales
  FOR SELECT TO anon USING (start_time <= now());
CREATE POLICY flash_sales_select_auth ON public.flash_sales
  FOR SELECT TO authenticated
  USING (
    start_time <= now()
    OR (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = flash_sales.product_id AND p.vendor_id = (SELECT auth.uid())
    )
  );
CREATE POLICY flash_sales_insert_admin ON public.flash_sales
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY flash_sales_update_admin ON public.flash_sales
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY flash_sales_delete_admin ON public.flash_sales
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- hero_banners
CREATE POLICY hero_banners_select_anon ON public.hero_banners
  FOR SELECT TO anon USING (COALESCE(is_active, true));
CREATE POLICY hero_banners_select_auth ON public.hero_banners
  FOR SELECT TO authenticated USING (COALESCE(is_active, true) OR (SELECT public.is_admin()));
CREATE POLICY hero_banners_insert_admin ON public.hero_banners
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY hero_banners_update_admin ON public.hero_banners
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY hero_banners_delete_admin ON public.hero_banners
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- reviews : avis réservés aux acheteurs ayant reçu le produit
CREATE POLICY reviews_select ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY reviews_insert_buyer ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.customer_id = (SELECT auth.uid())
        AND o.product_id = reviews.product_id
        AND o.order_status = 'completed'
    )
  );
CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE TO authenticated
  USING (customer_id = (SELECT auth.uid()))
  WITH CHECK (customer_id = (SELECT auth.uid()));
CREATE POLICY reviews_delete ON public.reviews
  FOR DELETE TO authenticated
  USING (customer_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));


-- ─────────────────────────────────────────────────────────────
-- 2. Plateforme
-- ─────────────────────────────────────────────────────────────

-- platform_settings : taux et numéros Mobile Money nécessaires au checkout
CREATE POLICY platform_settings_select ON public.platform_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY platform_settings_insert_admin ON public.platform_settings
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY platform_settings_update_admin ON public.platform_settings
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY platform_settings_delete_admin ON public.platform_settings
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- delivery_zones
CREATE POLICY delivery_zones_select_anon ON public.delivery_zones
  FOR SELECT TO anon USING (is_active);
CREATE POLICY delivery_zones_select_auth ON public.delivery_zones
  FOR SELECT TO authenticated USING (is_active OR (SELECT public.is_admin()));
CREATE POLICY delivery_zones_insert_admin ON public.delivery_zones
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY delivery_zones_update_admin ON public.delivery_zones
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY delivery_zones_delete_admin ON public.delivery_zones
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- fx_rate_history (écrit par trigger)
CREATE POLICY fx_rate_history_select_admin ON public.fx_rate_history
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

-- coupons : la liste n'est plus lisible par les clients (validation via validate_coupon)
CREATE POLICY coupons_select ON public.coupons
  FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR store_id IN (SELECT s.id FROM public.stores s WHERE s.vendor_id = (SELECT auth.uid()))
  );
CREATE POLICY coupons_insert ON public.coupons
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      created_by = (SELECT auth.uid())
      AND status = 'pending'
      AND current_uses = 0
      AND (SELECT public.current_user_role()) = 'vendor'
      AND store_id IN (SELECT s.id FROM public.stores s WHERE s.vendor_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY coupons_update_admin ON public.coupons
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY coupons_delete ON public.coupons
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()) OR (created_by = (SELECT auth.uid()) AND status = 'pending'));

-- user_coupon_usages : écrit uniquement par rpc_process_checkout
CREATE POLICY user_coupon_usages_select ON public.user_coupon_usages
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));


-- ─────────────────────────────────────────────────────────────
-- 3. Comptes
-- ─────────────────────────────────────────────────────────────

-- users : profil complet visible par son titulaire et l'admin uniquement
-- (profil vendeur public : vue public_vendor_profiles)
CREATE POLICY users_select ON public.users
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY users_insert_own ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY users_update ON public.users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY users_delete_admin ON public.users
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- merchant_applications : plus de candidature anonyme, validation par RPC admin
CREATE POLICY merchant_applications_select ON public.merchant_applications
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY merchant_applications_insert_own ON public.merchant_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending');
CREATE POLICY merchant_applications_update_admin ON public.merchant_applications
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY merchant_applications_delete ON public.merchant_applications
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()) OR (user_id = (SELECT auth.uid()) AND status = 'pending'));

-- store_favorites (compteur public : store_favorites_count())
CREATE POLICY store_favorites_select_own ON public.store_favorites
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY store_favorites_insert_own ON public.store_favorites
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY store_favorites_delete_own ON public.store_favorites
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- store_follows : qui suit qui n'est plus public
CREATE POLICY store_follows_select ON public.store_follows
  FOR SELECT TO authenticated
  USING (customer_id = (SELECT auth.uid()) OR vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY store_follows_insert_own ON public.store_follows
  FOR INSERT TO authenticated WITH CHECK (customer_id = (SELECT auth.uid()));
CREATE POLICY store_follows_delete_own ON public.store_follows
  FOR DELETE TO authenticated USING (customer_id = (SELECT auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 4. Commandes, paiements, logistique
-- ─────────────────────────────────────────────────────────────

-- orders : création via rpc_process_checkout ; vendeur = statut seul (garde trigger)
CREATE POLICY orders_select ON public.orders
  FOR SELECT TO authenticated
  USING (
    customer_id = (SELECT auth.uid())
    OR vendor_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );
CREATE POLICY orders_insert_admin ON public.orders
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY orders_update ON public.orders
  FOR UPDATE TO authenticated
  USING (vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY orders_delete_admin ON public.orders
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

CREATE POLICY order_status_history_select ON public.order_status_history
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (o.customer_id = (SELECT auth.uid()) OR o.vendor_id = (SELECT auth.uid()))
    )
  );

-- payment_transactions : le client ne peut plus valider son propre paiement
CREATE POLICY payment_transactions_select ON public.payment_transactions
  FOR SELECT TO authenticated USING (customer_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY payment_transactions_insert_admin ON public.payment_transactions
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY payment_transactions_update_admin ON public.payment_transactions
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY payment_transactions_delete_admin ON public.payment_transactions
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- settlement_ledger
CREATE POLICY settlement_ledger_select ON public.settlement_ledger
  FOR SELECT TO authenticated USING (vendor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY settlement_ledger_insert_admin ON public.settlement_ledger
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY settlement_ledger_update_admin ON public.settlement_ledger
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- delivery_trips : plus de lecture publique des courses
CREATE POLICY delivery_trips_select ON public.delivery_trips
  FOR SELECT TO authenticated
  USING (
    driver_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = delivery_trips.order_id
        AND (o.customer_id = (SELECT auth.uid()) OR o.vendor_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY delivery_trips_insert ON public.delivery_trips
  FOR INSERT TO authenticated WITH CHECK (driver_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY delivery_trips_update ON public.delivery_trips
  FOR UPDATE TO authenticated
  USING (driver_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (driver_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY delivery_trips_delete_admin ON public.delivery_trips
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

-- driver_profiles : position GPS visible du livreur, de l'admin et des parties d'une course
CREATE POLICY driver_profiles_select ON public.driver_profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.delivery_trips t
      JOIN public.orders o ON o.id = t.order_id
      WHERE t.driver_id = driver_profiles.id
        AND (o.customer_id = (SELECT auth.uid()) OR o.vendor_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY driver_profiles_insert ON public.driver_profiles
  FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY driver_profiles_update ON public.driver_profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY driver_profiles_delete_admin ON public.driver_profiles
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));


-- ─────────────────────────────────────────────────────────────
-- 5. Support
-- ─────────────────────────────────────────────────────────────

CREATE POLICY ticket_threads_select ON public.ticket_threads
  FOR SELECT TO authenticated USING (customer_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY ticket_threads_insert_own ON public.ticket_threads
  FOR INSERT TO authenticated WITH CHECK (customer_id = (SELECT auth.uid()));
CREATE POLICY ticket_threads_update ON public.ticket_threads
  FOR UPDATE TO authenticated
  USING (customer_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (customer_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY ticket_threads_delete_admin ON public.ticket_threads
  FOR DELETE TO authenticated USING ((SELECT public.is_admin()));

CREATE POLICY ticket_messages_select ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.ticket_threads t
      WHERE t.id = ticket_messages.thread_id AND t.customer_id = (SELECT auth.uid())
    )
  );
-- Un message ne peut être posté que dans son propre ticket, avec le bon rôle
CREATE POLICY ticket_messages_insert ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND (
      (sender_role = 'admin' AND (SELECT public.is_admin()))
      OR (
        sender_role IN ('customer', 'vendor')
        AND EXISTS (
          SELECT 1 FROM public.ticket_threads t
          WHERE t.id = ticket_messages.thread_id AND t.customer_id = (SELECT auth.uid())
        )
      )
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 6. Storage : bucket « products », dossier <vendor_id>/
-- ─────────────────────────────────────────────────────────────
-- Avant : tout vendeur pouvait écraser ou supprimer les images des autres.

DROP POLICY IF EXISTS "Vendor Write Access" ON storage.objects;
DROP POLICY IF EXISTS "Vendor Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Vendor Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "product_images_vendor_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_vendor_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_vendor_delete" ON storage.objects;

CREATE POLICY product_images_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'products'
    AND (
      (SELECT public.is_admin())
      OR (
        (SELECT public.current_user_role()) = 'vendor'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
      )
    )
  );
CREATE POLICY product_images_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'products'
    AND ((SELECT public.is_admin()) OR (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  )
  WITH CHECK (
    bucket_id = 'products'
    AND ((SELECT public.is_admin()) OR (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  );
CREATE POLICY product_images_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'products'
    AND ((SELECT public.is_admin()) OR (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  );


-- ─────────────────────────────────────────────────────────────
-- 7. Privilèges
-- ─────────────────────────────────────────────────────────────

-- Jamais utilisés via l'API ; TRUNCATE contourne même la RLS
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Fonctions : rien pour anon par défaut, puis liste blanche explicite
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.store_favorites_count(uuid) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_process_checkout(uuid, jsonb, jsonb, text, text, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_store(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_merchant_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_merchant_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_store_approval(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_archive_store(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(uuid, text) TO authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Vues
REVOKE ALL ON public.public_vendor_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_vendor_profiles TO anon, authenticated, service_role;

REVOKE ALL ON public.vendor_order_contacts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.vendor_order_contacts TO authenticated, service_role;
REVOKE ALL ON public.public_review_authors FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_review_authors TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
