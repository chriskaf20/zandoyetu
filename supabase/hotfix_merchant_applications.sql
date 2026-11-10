-- =============================================================
-- CANDIDATURES « DEVENIR VENDEUR » : formulaire ↔ table ↔ validation admin
-- Project: Zando Yetu (dimhzfxztyvbtljdyhqq)
-- Date: 2026-11-10 — prérequis de migration_v3_01 (idempotent, rejouable)
--
-- Avant : la table n'avait ni status ni phone, exigeait une date de naissance
-- que le formulaire ne demandait pas, et acceptait les candidatures anonymes.
-- Aucune candidature n'avait jamais pu être enregistrée.
--
-- Circuit :
--   1. client connecté → INSERT (status 'pending' imposé par la RLS)
--   2. admin → admin_approve_merchant_application() : rôle vendor, boutique
--      certifiée, fiche vendors — ou admin_reject_merchant_application()
--   3. une seule candidature en attente par compte ; un refusé peut repostuler
-- =============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. Colonnes et contraintes (alignées sur le formulaire)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.merchant_applications
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Numéro WhatsApp obligatoire (repris comme téléphone de la boutique à la validation).
-- date_of_birth reste obligatoire : le formulaire la demande.
ALTER TABLE public.merchant_applications ALTER COLUMN phone SET NOT NULL;

ALTER TABLE public.merchant_applications
  DROP CONSTRAINT IF EXISTS merchant_applications_status_check,
  DROP CONSTRAINT IF EXISTS merchant_applications_phone_check,
  DROP CONSTRAINT IF EXISTS merchant_applications_dob_format_check,
  DROP CONSTRAINT IF EXISTS merchant_applications_lengths_check;
ALTER TABLE public.merchant_applications
  ADD CONSTRAINT merchant_applications_status_check
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD CONSTRAINT merchant_applications_phone_check
    CHECK (phone ~ '^\+243[89][0-9]{8}$'),
  ADD CONSTRAINT merchant_applications_dob_format_check
    CHECK (date_of_birth ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  ADD CONSTRAINT merchant_applications_lengths_check
    CHECK (char_length(full_name) BETWEEN 2 AND 120
       AND char_length(store_name) BETWEEN 2 AND 80
       AND (notes IS NULL OR char_length(notes) <= 1000));

-- Nettoyage des saisies + majorité du responsable (current_date : interdit dans un CHECK)
CREATE OR REPLACE FUNCTION public.merchant_applications_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_dob date;
BEGIN
  NEW.full_name := btrim(NEW.full_name);
  NEW.store_name := btrim(NEW.store_name);
  NEW.notes := NULLIF(btrim(NEW.notes), '');

  BEGIN
    v_dob := NEW.date_of_birth::date;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Date de naissance invalide.' USING ERRCODE = 'check_violation';
  END;
  IF v_dob > (current_date - interval '18 years')::date THEN
    RAISE EXCEPTION 'Le responsable de la boutique doit être majeur (18 ans révolus).'
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_dob < (current_date - interval '100 years')::date THEN
    RAISE EXCEPTION 'Date de naissance invalide.' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_merchant_applications_validate ON public.merchant_applications;
CREATE TRIGGER trg_merchant_applications_validate
  BEFORE INSERT OR UPDATE OF full_name, store_name, notes, date_of_birth
  ON public.merchant_applications
  FOR EACH ROW EXECUTE FUNCTION public.merchant_applications_validate();

-- Une seule candidature en attente par compte (un candidat refusé peut repostuler)
CREATE UNIQUE INDEX IF NOT EXISTS merchant_applications_one_pending_per_user
  ON public.merchant_applications (user_id) WHERE status = 'pending';
-- Lecture « ma dernière candidature » + clé étrangère indexée
CREATE INDEX IF NOT EXISTS merchant_applications_user_created_idx
  ON public.merchant_applications (user_id, created_at DESC);

-- Téléphone/WhatsApp de la boutique (renseigné à la validation)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone text;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS (identique à migration_v3_03_rls.sql)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.merchant_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to merchant_applications" ON public.merchant_applications;
DROP POLICY IF EXISTS merchant_applications_insert ON public.merchant_applications;
DROP POLICY IF EXISTS merchant_applications_select ON public.merchant_applications;
DROP POLICY IF EXISTS merchant_applications_insert_own ON public.merchant_applications;
DROP POLICY IF EXISTS merchant_applications_update_admin ON public.merchant_applications;
DROP POLICY IF EXISTS merchant_applications_delete ON public.merchant_applications;

CREATE POLICY merchant_applications_select ON public.merchant_applications
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY merchant_applications_insert_own ON public.merchant_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending');
CREATE POLICY merchant_applications_update_admin ON public.merchant_applications
  FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY merchant_applications_delete ON public.merchant_applications
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()) OR (user_id = (SELECT auth.uid()) AND status = 'pending'));

-- TRUNCATE contourne la RLS
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.merchant_applications FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Validation admin (copie conforme de migration_v3_02_functions.sql §8)
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

-- Supabase accorde EXECUTE à anon/authenticated par défaut : liste blanche explicite
REVOKE ALL ON FUNCTION public.assert_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.merchant_applications_validate() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_approve_merchant_application(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reject_merchant_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_merchant_application(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reject_merchant_application(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assert_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.merchant_applications_validate() TO service_role;

COMMIT;

-- PostgREST doit voir les nouvelles colonnes et fonctions immédiatement
NOTIFY pgrst, 'reload schema';
