'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

export function CartDrawer() {
  const { 
    items, 
    isCartDrawerOpen, 
    setCartDrawerOpen, 
    removeItem, 
    updateQuantity, 
    getSubtotalUsd 
  } = useCartStore();

  const { formatPrice } = useCurrencyStore();
  const { t } = useLanguageStore();

  if (!isCartDrawerOpen) return null;

  const subtotal = getSubtotalUsd();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-black" />
              <h2 className="text-base font-bold uppercase tracking-wider text-brand-black">
                {t('cartTitle')} ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCartDrawerOpen(false)}
              className="p-1.5 text-brand-gray hover:text-brand-black transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-brand-border">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <ShoppingBag className="w-12 h-12 text-brand-border mb-3" />
                <h3 className="font-semibold text-brand-black text-sm">{t('cartEmpty')}</h3>
                <p className="text-xs text-brand-gray mt-1 max-w-xs">{t('cartEmptySubtitle')}</p>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="mt-6 px-4 py-2 text-xs font-semibold bg-brand-black text-white rounded hover:bg-brand-charcoal transition"
                >
                  {t('continueShopping')}
                </button>
              </div>
            ) : (
              items.map((item) => {
                const img = item.product.images_urls?.[0] || 'https://placehold.co/400x500/png?text=Zando+Yetu';

                return (
                  <div key={item.id} className="py-4 flex gap-4">
                    <div className="relative w-20 h-24 flex-shrink-0 bg-brand-lightGray rounded overflow-hidden">
                      <Image
                        src={img}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-brand-black line-clamp-1">
                          {item.product.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-brand-gray mt-1">
                          {item.selected_size && <span>{t('sizeLabel')}: <strong className="text-brand-black">{item.selected_size}</strong></span>}
                          {item.selected_color && <span>{t('colorLabel')}: <strong className="text-brand-black">{item.selected_color}</strong></span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-brand-border rounded">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-brand-lightGray text-brand-gray hover:text-brand-black"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-brand-black">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-brand-lightGray text-brand-gray hover:text-brand-black"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-brand-black">
                            {formatPrice(item.product.price_usd * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-[10px] text-brand-red hover:underline mt-0.5 inline-flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" /> {t('removeItem')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Checkout CTA */}
          {items.length > 0 && (
            <div className="p-6 border-t border-brand-border bg-brand-offWhite">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-brand-gray font-medium">{t('subtotal')}</span>
                <span className="font-bold text-base text-brand-black">{formatPrice(subtotal)}</span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full py-3 bg-brand-black text-white font-semibold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:bg-brand-charcoal transition"
                >
                  <span>{t('proceedToCheckout')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full py-2.5 bg-white border border-brand-border text-brand-black font-semibold text-xs uppercase tracking-wider rounded flex items-center justify-center hover:bg-brand-lightGray transition"
                >
                  {t('viewFullCart')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
