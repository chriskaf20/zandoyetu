'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, RotateCcw, MapPin, Phone, Mail } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

export function Footer() {
  const { t } = useLanguageStore();

  return (
    <footer className="bg-brand-black text-white mt-16 border-t border-neutral-800">
      {/* Guarantees Strip */}
      <div className="border-b border-neutral-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 rounded bg-neutral-900/50">
            <Truck className="w-8 h-8 text-white flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{t('guaranteeDelivery')}</h4>
              <p className="text-xs text-brand-gray mt-0.5">{t('footerGuaranteeDeliveryDesc')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded bg-neutral-900/50">
            <ShieldCheck className="w-8 h-8 text-brand-emerald flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{t('guaranteePayment')}</h4>
              <p className="text-xs text-brand-gray mt-0.5">{t('footerGuaranteePaymentDesc')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded bg-neutral-900/50">
            <RotateCcw className="w-8 h-8 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{t('guaranteeReturns')}</h4>
              <p className="text-xs text-brand-gray mt-0.5">{t('footerGuaranteeReturnsDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <span className="font-serif text-2xl font-bold tracking-widest text-white">ZANDO YETU</span>
          <p className="text-xs text-brand-gray leading-relaxed">
            {t('footerDescription')}
          </p>
          <div className="pt-2 text-xs text-brand-gray space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span>Lubumbashi, RDC</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-white" />
              <span>+243 970 000 000</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">{t('footerCommunesTitle')}</h4>
          <ul className="text-xs text-brand-gray space-y-2">
            <li>{t('footerCommunesList1')}</li>
            <li>{t('footerCommunesList2')}</li>
            <li>{t('footerCommunesList3')}</li>
            <li>{t('footerCommunesList4')}</li>
            <li>{t('footerCommunesList5')}</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">{t('footerCustomerServiceTitle')}</h4>
          <ul className="text-xs text-brand-gray space-y-2">
            <li><Link href="/orders" className="hover:text-white transition">{t('footerOrderTracking')}</Link></li>
            <li><Link href="/cart" className="hover:text-white transition">{t('footerMyCart')}</Link></li>
            <li><Link href="/profile" className="hover:text-white transition">{t('footerMyAccount')}</Link></li>
            <li><Link href="/login" className="hover:text-white transition">{t('footerLoginRegister')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">{t('footerPaymentTitle')}</h4>
          <p className="text-xs text-brand-gray leading-relaxed mb-3">
            {t('footerPaymentDesc')}
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-neutral-400">
            <span className="px-2 py-1 bg-neutral-900 rounded border border-neutral-800">CASH (USD/CDF)</span>
            <span className="px-2 py-1 bg-neutral-900 rounded border border-neutral-800">M-PESA</span>
            <span className="px-2 py-1 bg-neutral-900 rounded border border-neutral-800">ORANGE MONEY</span>
            <span className="px-2 py-1 bg-neutral-900 rounded border border-neutral-800">AIRTEL MONEY</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
