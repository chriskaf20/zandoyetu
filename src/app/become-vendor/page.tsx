'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  MapPin, 
  Phone, 
  ShoppingBag, 
  Truck, 
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { MerchantApplication } from '@/types/schema';

const CITIES = [
  'Lubumbashi',
  'Kolwezi',
  'Likasi',
  'Kasumbalesa',
  'Kalemie',
  'Autre (Katanga)'
];

const PRODUCT_FOCUSES = [
  'Mode & Prêt-à-porter Femme',
  'Mode Masculine & Élégance',
  'Streetwear, Sneakers & Urbain',
  'Mode Enfants & Bébés',
  'Chaussures & Maroquinerie',
  'Bijoux, Montres & Accessoires',
  'Créations Traditionnelles & Wax',
  'Cosmétiques, Beauté & Parfums'
];

const FULFILLMENT_TYPES = [
  'Livraison Standard Zando Yetu',
  'Retrait direct en magasin physique (Pickup)',
  'Livraison Express & Pickup Combinés'
];

export default function BecomeVendorPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [existingApp, setExistingApp] = useState<MerchantApplication | null>(null);

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('Lubumbashi');
  const [productFocus, setProductFocus] = useState(PRODUCT_FOCUSES[0]);
  const [fulfillmentType, setFulfillmentType] = useState(FULFILLMENT_TYPES[0]);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<MerchantApplication | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setFullName(user.full_name || '');
    setPhone(user.phone || '');

    const checkExistingApplication = async () => {
      try {
        const { data, error } = await supabase
          .from('merchant_applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setExistingApp(data as MerchantApplication);
        }
      } catch (err) {
        console.error('Error fetching merchant application:', err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingApplication();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/become-vendor');
      return;
    }

    if (!storeName.trim() || !phone.trim() || !fullName.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        user_id: user.id,
        full_name: fullName.trim(),
        store_name: storeName.trim(),
        operational_city: city,
        product_focus: productFocus,
        fulfillment_type: fulfillmentType,
        status: 'pending',
      };

      const { data, error } = await (supabase
        .from('merchant_applications')
        .insert(payload as any)
        .select()
        .single() as any);

      if (error) throw error;

      // Optimistically update user's phone if missing
      if (!user.phone && phone.trim()) {
        await supabase
          .from('users')
          .update({ phone: phone.trim(), local_updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      setSubmittedApp(data as MerchantApplication);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setErrorMsg(err.message || 'Échec de la soumission de la candidature. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center text-brand-gray">
        <Loader2 className="w-8 h-8 animate-spin text-brand-black mb-3" />
        <p className="text-xs font-semibold">Vérification de votre compte Zando Yetu...</p>
      </div>
    );
  }

  // If not logged in, prompt to log in
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-500 mx-auto mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand-black mb-2">
          Devenez Vendeur Partenaire Officiel
        </h1>
        <p className="text-xs sm:text-sm text-brand-gray max-w-xl mx-auto mb-8 leading-relaxed">
          Exposez et vendez vos collections de vêtements, chaussures et accessoires à des milliers d'acheteurs actifs à Lubumbashi, Kolwezi et dans tout le Grand Katanga.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login?redirect=/become-vendor"
            className="w-full sm:w-auto px-8 py-3 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm"
          >
            Se Connecter pour Postuler
          </Link>
          <Link
            href="/register?redirect=/become-vendor"
            className="w-full sm:w-auto px-8 py-3 bg-brand-lightGray hover:bg-neutral-200 text-brand-black text-xs font-bold uppercase tracking-wider rounded-xl transition"
          >
            Créer un Compte
          </Link>
        </div>
      </div>
    );
  }

  // If already a vendor or admin
  if (user.role === 'vendor' || user.role === 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-brand-black mb-2">
          Vous êtes déjà un Vendeur Officiel
        </h1>
        <p className="text-xs text-brand-gray max-w-md mx-auto mb-6">
          Votre compte dispose des privilèges Marchand activés. Accédez à votre tableau de bord pour gérer votre catalogue, vos prix et vos commandes.
        </p>
        <Link
          href="/vendor/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm"
        >
          <span>Ouvrir mon Dashboard Vendeur</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // If application was just submitted or existing pending application found
  const activeApp = submittedApp || existingApp;
  if (activeApp) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-500 mx-auto mb-4">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>

          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase rounded-full tracking-wider mb-2">
            Demande en cours d'examen
          </span>

          <h1 className="font-serif text-2xl font-bold text-brand-black mb-2">
            Candidature Transmise avec Succès !
          </h1>

          <p className="text-xs text-brand-gray max-w-lg mx-auto mb-6 leading-relaxed">
            Votre demande pour la boutique <strong className="text-brand-black">"{activeApp.store_name}"</strong> a bien été transmise aux administrateurs de Zando Yetu.
          </p>

          {/* Recap Card */}
          <div className="bg-brand-lightGray rounded-xl p-4 text-left text-xs space-y-2 mb-6 border border-brand-border">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
              <span className="text-brand-gray">Enseigne Commerciale :</span>
              <strong className="text-brand-black font-bold">{activeApp.store_name}</strong>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
              <span className="text-brand-gray">Responsable :</span>
              <span className="text-brand-black font-medium">{activeApp.full_name}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
              <span className="text-brand-gray">Ville d'Opération :</span>
              <span className="text-brand-black font-medium">{activeApp.operational_city}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
              <span className="text-brand-gray">Rayon Principal :</span>
              <span className="text-brand-black font-medium">{activeApp.product_focus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-gray">Date de Soumission :</span>
              <span className="text-neutral-500 font-mono text-[11px]">
                {new Date(activeApp.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
              </span>
            </div>
          </div>

          {/* Verification steps */}
          <div className="text-left text-xs text-neutral-600 space-y-2.5 p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Votre dossier est traité sous un délai moyen de <strong>24 à 48 heures</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Dès approbation, votre rôle passera automatiquement en <strong>Vendeur</strong> avec accès complet au Dashboard.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Notre équipe peut vous contacter par WhatsApp pour valider les coordonnées de votre atelier ou boutique.</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-2.5 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase rounded-lg transition"
            >
              Retour à l'accueil
            </Link>
            <a
              href="https://wa.me/243830634340?text=Bonjour%20Zando%20Yetu,%20je%20suis%20en%20attente%20de%20validation%20de%20ma%20boutique"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-lg transition"
            >
              Support WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Application Form View
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-600 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Programme Partenaires Marchands</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-black mb-3">
          Ouvrez votre Boutique sur Zando Yetu
        </h1>
        <p className="text-xs sm:text-sm text-brand-gray leading-relaxed">
          Rejoignez le premier écosystème de mode et commerce du Katanga. Vendez à des milliers de clients locaux sans frais d'ouverture.
        </p>
      </div>

      {/* Value Proposition Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs flex items-start gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-brand-black">Visibilité Maximale</h4>
            <p className="text-[11px] text-brand-gray mt-0.5">Mise en avant auprès de milliers d'acheteurs à Lubumbashi et Kolwezi.</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs flex items-start gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-brand-black">Logistique Zando Express</h4>
            <p className="text-[11px] text-brand-gray mt-0.5">Livraisons sécurisées dans toutes les communes avec paiement cash & MoMo.</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-xs flex items-start gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-brand-black">Badge Officiel Certifié</h4>
            <p className="text-[11px] text-brand-gray mt-0.5">Garantie d'authenticité et confiance totale pour vos clients.</p>
          </div>
        </div>
      </div>

      {/* Main Application Form Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-10 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-brand-black mb-1">
          Formulaire de Candidature Marchande
        </h2>
        <p className="text-xs text-brand-gray mb-6">
          Remplissez ces informations pour permettre à notre comité d'activer votre espace vendeur.
        </p>

        {errorMsg && (
          <div className="p-3.5 mb-6 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                Nom Complet du Responsable *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Jean Mukendi"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                Nom Commercial de la Boutique *
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Élégance Lubumbashi, Katanga Glam..."
                required
                className="w-full px-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition font-semibold"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                Numéro WhatsApp Professionnel *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +243 81 234 5678"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition font-mono"
                />
                <Phone className="w-4 h-4 text-brand-gray absolute left-3 top-3" />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                Ville Principale d'Activité *
              </label>
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-brand-gray absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Product Focus */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                Rayon & Spécialité Principale *
              </label>
              <div className="relative">
                <select
                  value={productFocus}
                  onChange={(e) => setProductFocus(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  {PRODUCT_FOCUSES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <ShoppingBag className="w-4 h-4 text-brand-gray absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Fulfillment Type */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
                Mode de Distribution Prévu *
              </label>
              <div className="relative">
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  {FULFILLMENT_TYPES.map((ft) => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </select>
                <Truck className="w-4 h-4 text-brand-gray absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-black mb-1.5">
              Présentation de votre activité & Vos réseaux sociaux (Optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Décrivez brièvement vos créations, votre emplacement physique ou vos liens Instagram / Facebook..."
              className="w-full px-3.5 py-2.5 text-xs bg-brand-lightGray border border-brand-border rounded-xl focus:border-brand-black focus:bg-white focus:outline-none transition resize-none"
            />
          </div>

          {/* Trust Statement */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              En soumettant cette demande, vous acceptez de respecter la charte de qualité Zando Yetu (articles authentiques, respect des délais de livraison et service client irréprochable).
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-brand-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Envoi de votre candidature...</span>
              </>
            ) : (
              <>
                <span>Soumettre ma Candidature Marchande</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
