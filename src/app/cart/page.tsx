'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { PromoCodeBox } from '@/components/cart/PromoCodeBox';
import { FidelityPointsBox } from '@/components/cart/FidelityPointsBox';

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart,
    getSubtotalUsd,
    getDeliveryFeeUsd,
    getPromoDiscountUsd,
    getPointsDiscountUsd,
    getTotalUsd,
    deliveryType,
    setDeliveryType,
  } = useCartStore();

  const { formatPrice } = useCurrencyStore();
  const { t } = useLanguageStore();

  const subtotal = getSubtotalUsd();
  const delivery = getDeliveryFeeUsd();
  const promo = getPromoDiscountUsd();
  const points = getPointsDiscountUsd();
  const total = getTotalUsd();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-brand-border mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-brand-black">{t('cartEmpty')}</h1>
        <p className="text-xs text-brand-gray mt-2 max-w-sm mx-auto">{t('cartEmptySubtitle')}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-black text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-brand-charcoal transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('continueShopping')}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border">
        <h1 className="font-serif text-2xl font-bold text-brand-black">
          {t('cartTitle')} ({items.reduce((s, i) => s + i.quantity, 0)})
        </h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-brand-red hover:underline inline-flex items-center gap-1 font-semibold"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t('clearCart')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-brand-border rounded divide-y divide-brand-border">
            {items.map((item) => {
              const img = item.product.images_urls?.[0] || 'https://placehold.co/400x500/png?text=Zando+Yetu';

              return (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="relative w-24 h-32 flex-shrink-0 bg-brand-lightGray rounded overflow-hidden">
                    <Image
                      src={img}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/products/${item.product.id}`}>
                          <h3 className="text-sm font-bold text-brand-black hover:text-brand-gray transition">
                            {item.product.title}
                          </h3>
                        </Link>
                        <span className="text-sm font-bold text-brand-black whitespace-nowrap">
                          {formatPrice(item.product.price_usd * item.quantity)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-brand-gray mt-1">
                        {item.selected_size && <span>{t('sizeLabel')}: <strong className="text-brand-black">{item.selected_size}</strong></span>}
                        {item.selected_color && <span>{t('colorLabel')}: <strong className="text-brand-black">{item.selected_color}</strong></span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity buttons */}
                      <div className="flex items-center border border-brand-border rounded">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-brand-lightGray text-brand-gray hover:text-brand-black"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-brand-black">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-brand-lightGray text-brand-gray hover:text-brand-black"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-brand-red hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t('removeItem')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Promo & Points accordions */}
          <div className="space-y-4 pt-2">
            <PromoCodeBox />
            <FidelityPointsBox />
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <div className="p-6 bg-brand-offWhite border border-brand-border rounded">
            <h2 className="font-serif text-lg font-bold text-brand-black mb-4 pb-2 border-b border-brand-border">
              {t('orderSummary')}
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>{t('subtotal')}</span>
                <span className="font-bold text-brand-black">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>{t('deliveryFee')}</span>
                <span className="font-bold text-brand-black">
                  {delivery === 0 ? <span className="text-brand-emerald">{t('freeDeliveryThreshold')}</span> : formatPrice(delivery)}
                </span>
              </div>

              {promo > 0 && (
                <div className="flex justify-between text-brand-emerald font-semibold">
                  <span>{t('promoDiscount')}</span>
                  <span>-{formatPrice(promo)}</span>
                </div>
              )}

              {points > 0 && (
                <div className="flex justify-between text-brand-emerald font-semibold">
                  <span>{t('pointsDiscount')}</span>
                  <span>-{formatPrice(points)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-brand-border flex justify-between text-sm font-bold text-brand-black">
                <span>{t('total')}</span>
                <span className="text-base">{formatPrice(total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full mt-6 py-3.5 bg-brand-black text-white font-semibold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:bg-brand-charcoal transition shadow"
            >
              <span>{t('proceedToCheckout')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
