'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, Gift } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

export function FloatingAuthBanner() {
  const user = useAuthStore((s) => s.user);
  const { t } = useLanguageStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (user || isDismissed) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-brand-black text-white p-3.5 sm:p-4 rounded-xl shadow-2xl border border-neutral-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-black rounded-lg flex-shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-neutral-100 leading-snug line-clamp-2">
              {t('guestBannerText')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/register"
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-bold uppercase tracking-wider rounded-lg transition shadow-sm"
          >
            {t('guestBannerBtn')}
          </Link>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-neutral-400 hover:text-white transition"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
