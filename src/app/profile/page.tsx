'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Phone, MapPin, Sparkles, LogOut, Check, Save, Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { useCartStore } from '@/lib/stores/useCartStore';
import { supabase } from '@/lib/supabase/client';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, setUser } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const { t } = useLanguageStore();
  const clearCart = useCartStore((s) => s.clearCart);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.physical_address || '');
  const [genderPreference, setGenderPreference] = useState<'all' | 'women' | 'men'>(user?.gender_preference || 'all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Account Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <User className="w-12 h-12 text-brand-border mx-auto mb-3" />
        <h1 className="font-serif text-2xl font-bold text-brand-black">{t('myAccount')}</h1>
        <p className="text-xs text-brand-gray mt-1">{t('profileLoginPrompt')}</p>
        <Link href="/login?redirect=/profile" className="mt-6 inline-block px-6 py-2.5 bg-brand-black text-white text-xs font-semibold rounded">
          {t('profileLoginButton')}
        </Link>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await (supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          physical_address: address.trim() || null,
          gender_preference: genderPreference,
          local_updated_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id) as any);

      if (!error) {
        setUser({
          ...user,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          physical_address: address.trim() || null,
          gender_preference: genderPreference,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving profile:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmWord = t('deleteAccountConfirmWord');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== confirmWord.toUpperCase()) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await (supabase.rpc as any)('rpc_delete_user_account', {
        p_user_id: user.id,
      });

      if (error) {
        setDeleteError(error.message || 'Deletion failed.');
        setIsDeleting(false);
        return;
      }

      // Full session clearance
      clearCart();
      await signOut();
      setShowDeleteModal(false);
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-4 border-b border-brand-border flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-black">{t('profileTitle')}</h1>
          <p className="text-xs text-brand-gray mt-1">{t('profileSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            signOut();
            router.push('/');
          }}
          className="px-4 py-2 text-xs font-semibold text-brand-red bg-red-50 hover:bg-red-100 rounded flex items-center gap-1.5 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('signOut')}</span>
        </button>
      </div>

      {/* Loyalty Points Banner */}
      <div className="mb-8 p-6 bg-gradient-to-r from-neutral-900 to-brand-black text-white rounded shadow flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-black rounded-full">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{t('loyaltyPointsTitle')}</h3>
            <p className="text-xs text-neutral-400">{t('loyaltyPointsSubtitle')}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-amber-400">{user.points_balance || 0} pts</span>
          <p className="text-[11px] text-neutral-400">{t('loyaltyPointsEquiv', { value: formatPrice((user.points_balance || 0) * 0.20) })}</p>
        </div>
      </div>

      {/* Vendor Status & Onboarding Callout */}
      {user.role === 'vendor' || user.role === 'admin' ? (
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Compte Vendeur Officiel (Créateur & Shop)</span>
            <p className="text-xs text-amber-800 mt-0.5">Gérez vos articles, vos commandes et l'enseigne de votre boutique.</p>
          </div>
          <Link
            href="/vendor/dashboard"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded transition shadow-sm"
          >
            Accéder au Dashboard
          </Link>
        </div>
      ) : (
        <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2 py-0.5 bg-amber-500 text-black text-[9px] font-bold uppercase rounded mb-1">
              Opportunité Créateurs & Boutiques
            </span>
            <h3 className="font-serif text-sm font-bold text-neutral-900">Devenir Vendeur sur Zando Yetu</h3>
            <p className="text-xs text-neutral-600 mt-0.5 max-w-md">
              Vendez vos vêtements, créations locales et accessoires aux milliers de clients de Lubumbashi et Kolwezi.
            </p>
          </div>
          <Link
            href="/become-vendor"
            className="px-4 py-2.5 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded whitespace-nowrap transition shadow-sm"
          >
            Postuler comme Vendeur &rarr;
          </Link>
        </div>
      )}

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="bg-white border border-brand-border rounded p-6 space-y-4 shadow-sm">
        {saveSuccess && (
          <div className="p-3 bg-green-50 text-green-700 rounded text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{t('saveSuccess')}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-black mb-1">
            {t('fullName')}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-black mb-1">
            {t('emailLabel')}
          </label>
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="w-full px-3 py-2 text-xs bg-neutral-100 border border-brand-border rounded text-brand-gray cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-black mb-1">
            {t('phoneLabel')}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('phonePlaceholder')}
            className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-black mb-1.5">
            Rayon & Préférence Vestimentaire
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'all', label: 'Tous les Rayons' },
              { key: 'women', label: 'Mode Femme' },
              { key: 'men', label: 'Mode Homme' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setGenderPreference(opt.key as any)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition text-center ${
                  genderPreference === opt.key
                    ? 'bg-brand-black text-white border-brand-black shadow-xs'
                    : 'bg-brand-lightGray text-neutral-600 border-brand-border hover:border-neutral-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-black mb-1">
            {t('defaultAddressLabel')}
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('defaultAddressPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-brand-black text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-brand-charcoal transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? t('saving') : t('saveButton')}</span>
        </button>
      </form>

      {/* Danger Zone: Delete Account */}
      <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-brand-red" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-red">Zone Danger</h3>
        </div>
        <p className="text-xs text-neutral-600 mb-4">
          {t('deleteAccountWarning', { confirmWord })}
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-brand-red hover:bg-red-700 rounded flex items-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t('deleteAccount')}</span>
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl p-6 z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-100 text-brand-red rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-brand-black">{t('deleteAccount')}</h2>
              </div>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 text-brand-gray hover:text-brand-black transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Warning */}
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 mb-4 leading-relaxed">
              {t('deleteAccountWarning', { confirmWord })}
            </div>

            {/* Confirm Input */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-black mb-1">
                {t('deleteAccountConfirmPlaceholder')}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={confirmWord}
                className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-red focus:bg-white focus:outline-none uppercase font-mono tracking-widest"
                disabled={isDeleting}
                autoFocus
              />
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-xs font-semibold border border-brand-border rounded hover:bg-brand-lightGray transition disabled:opacity-50"
              >
                {t('deleteAccountCancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== confirmWord.toUpperCase()}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-brand-red hover:bg-red-700 rounded transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('deleteAccountProcessing')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('deleteAccount')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
