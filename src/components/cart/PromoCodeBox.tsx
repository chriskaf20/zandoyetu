'use client';

import React, { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

export function PromoCodeBox() {
  const { activeCoupon, applyCoupon, removeCoupon } = useCartStore();
  const { t } = useLanguageStore();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setMessage(null);
    const res = await applyCoupon(code);
    setIsLoading(false);
    setMessage({ text: res.message, isError: !res.success });
    if (res.success) setCode('');
  };

  return (
    <div className="p-4 bg-white border border-brand-border rounded">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-brand-black" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">{t('promoCodeTitle')}</h3>
      </div>

      {activeCoupon ? (
        <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-800">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>{t('promoCodeActive', { code: activeCoupon.code, percent: activeCoupon.discount_percent })}</span>
          </div>
          <button
            type="button"
            onClick={removeCoupon}
            className="p-1 hover:text-red-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('promoCodeExample')}
            className="flex-1 px-3 py-2 text-xs uppercase font-medium bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="px-4 py-2 bg-brand-black text-white text-xs font-semibold rounded hover:bg-brand-charcoal transition disabled:opacity-50"
          >
            {isLoading ? '...' : t('applyPromo')}
          </button>
        </form>
      )}

      {message && (
        <p className={`text-[11px] mt-2 ${message.isError ? 'text-brand-red' : 'text-brand-emerald'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
