'use client';

import React from 'react';
import { Check, Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { OrderStatus } from '@/types/schema';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

export function OrderTrackingStepper({ status }: { status: OrderStatus }) {
  const { t } = useLanguageStore();

  const MILESTONES = [
    { key: 'validation', label: t('stepValidation') },
    { key: 'preparation', label: t('stepPreparation') },
    { key: 'delivery', label: t('stepDelivery') },
    { key: 'delivered', label: t('stepDelivered') },
  ];

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-semibold">
        <XCircle className="w-4 h-4" />
        <span>{t('orderCancelled')}</span>
      </div>
    );
  }

  let activeIndex = 0;
  if (status === 'pending' || status === 'pending_payment' || status === 'awaiting_admin_clearance') {
    activeIndex = 0;
  } else if (status === 'approved' || status === 'processing') {
    activeIndex = 1;
  } else if (status === 'shipped') {
    activeIndex = 2;
  } else if (status === 'completed') {
    activeIndex = 3;
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-brand-black -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(activeIndex / (MILESTONES.length - 1)) * 100}%` }}
        />

        {MILESTONES.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  isDone
                    ? 'bg-brand-black text-white'
                    : isCurrent
                    ? 'bg-white border-2 border-brand-black text-brand-black ring-4 ring-black/10'
                    : 'bg-white border border-neutral-300 text-neutral-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wider ${
                isCurrent || isDone ? 'text-brand-black font-bold' : 'text-neutral-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
