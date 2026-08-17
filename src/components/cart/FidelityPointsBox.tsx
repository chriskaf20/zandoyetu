'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

export function FidelityPointsBox() {
  const user = useAuthStore((s) => s.user);
  const { pointsToRedeem, setPointsToRedeem, getPointsDiscountUsd } = useCartStore();
  const { formatPrice } = useCurrencyStore();
  const { t } = useLanguageStore();

  if (!user || user.points_balance <= 0) return null;

  const maxPoints = user.points_balance;
  const discountUsd = getPointsDiscountUsd();

  return (
    <div className="p-4 bg-white border border-brand-border rounded">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">{t('fidelityTitle')}</h3>
        </div>
        <span className="text-xs font-bold text-brand-black">{t('fidelityAvailable', { count: maxPoints })}</span>
      </div>

      <p className="text-[11px] text-brand-gray mb-3">
        {t('fidelityRate')}
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max={maxPoints}
            step="1"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(Number(e.target.value))}
            className="flex-1 accent-brand-black cursor-pointer"
          />
          <span className="text-xs font-bold w-12 text-right">{pointsToRedeem} pts</span>
        </div>

        {pointsToRedeem > 0 && (
          <p className="text-xs font-semibold text-brand-emerald">
            {t('fidelityDiscount', { amount: formatPrice(discountUsd) })}
          </p>
        )}
      </div>
    </div>
  );
}
