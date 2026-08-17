'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { Loader2, AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const { t } = useLanguageStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage('Identifiants incorrects ou compte introuvable.');
        return;
      }

      if (data?.user) {
        await fetchProfile(data.user.id);
        router.push(redirect);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur de connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full p-8 bg-white border border-brand-border rounded shadow-card space-y-6">
        <div className="text-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-brand-black">
            ZANDO YETU
          </Link>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-black mt-2">
            {t('loginTitle')}
          </h2>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-black mb-1">
              {t('email')} *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@domaine.com"
              className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-black mb-1">
              {t('password')} *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-black text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-brand-charcoal transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Se Connecter'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-brand-border">
          <Link
            href={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-xs text-brand-gray hover:text-brand-black font-semibold transition"
          >
            {t('needAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-black" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
