'use client';

import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Clock } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface TrustGuardProps {
  deliveryTime?: string | null;
  hasFreeReturn?: number;
}

export function TrustGuard({ deliveryTime, hasFreeReturn }: TrustGuardProps) {
  const { t } = useLanguageStore();

  return (
    <div className="border border-brand-border rounded p-4 bg-brand-offWhite/60 space-y-3 my-6">
      <div className="flex items-start gap-3">
        <Truck className="w-5 h-5 text-brand-black flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-brand-black">Livraison Rapide à Lubumbashi</p>
          <p className="text-brand-gray mt-0.5">{deliveryTime || '24h à 48h selon la commune'}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-emerald flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-brand-black">Paiement Sécurisé à la Livraison</p>
          <p className="text-brand-gray mt-0.5">Payez en Cash (USD/CDF) ou par Mobile Money lors de la réception.</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <RotateCcw className="w-5 h-5 text-brand-black flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-brand-black">Vérification sur Place</p>
          <p className="text-brand-gray mt-0.5">
            {hasFreeReturn === 1 ? 'Essayez et vérifiez votre article avant de payer le livreur.' : 'Inspection du colis autorisée à la réception.'}
          </p>
        </div>
      </div>
    </div>
  );
}
