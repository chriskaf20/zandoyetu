'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Flame, 
  Clock, 
  TrendingUp, 
  Store, 
  ArrowRight, 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles,
  Percent
} from 'lucide-react';
import { Product } from '@/types/schema';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

import { useStores } from '@/hooks/useStores';

interface PromoDealsGridProps {
  products: Product[];
}

export function PromoDealsGrid({ products }: PromoDealsGridProps) {
  const { formatPrice } = useCurrencyStore();
  const { t } = useLanguageStore();
  const addItem = useCartStore((s) => s.addItem);
  const { data: stores = [] } = useStores();

  // Dynamic countdown timer for Flash deals
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts = products.slice(0, 2);
  const trendProducts = products.slice(2, 4);

  // Top verified sellers (either marked is_verified or top listed)
  const topStores = stores.filter((s) => s.is_verified || !s.is_archived).slice(0, 2);

  return (
    <section className="my-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block 1: Ventes Flash & Bonnes Affaires */}
        <div className="bg-gradient-to-br from-red-950 via-neutral-900 to-black text-white p-5 rounded-lg border border-red-900/50 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-600 rounded-full text-white">
                  <Flame className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold tracking-wide text-white">
                    Ventes Flash du Jour
                  </h3>
                  <p className="text-[10px] text-red-300">Jusqu'à -50% de réduction</p>
                </div>
              </div>

              {/* Countdown badge */}
              <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded text-[11px] font-mono font-bold text-amber-400 border border-amber-500/30">
                <Clock className="w-3 h-3" />
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Deal Items */}
            <div className="space-y-3 mt-4">
              {dealProducts.map((p) => {
                const img = p.images_urls?.[0] || 'https://placehold.co/200x250/png?text=Flash';
                const discount = p.compare_at_price
                  ? Math.round(((p.compare_at_price - p.price_usd) / p.compare_at_price) * 100)
                  : 35;

                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center gap-3 transition"
                  >
                    <div className="relative w-14 h-16 rounded overflow-hidden flex-shrink-0 bg-neutral-800">
                      <Image src={img} alt={p.title} fill className="object-cover" sizes="56px" />
                      <span className="absolute top-0 left-0 bg-red-600 text-white text-[8px] font-bold px-1 rounded-br">
                        -{discount}%
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${p.id}`} className="block">
                        <h4 className="text-xs font-semibold text-white truncate hover:text-red-300 transition">
                          {p.title}
                        </h4>
                      </Link>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold text-amber-400">{formatPrice(p.price_usd)}</span>
                        {p.compare_at_price && (
                          <span className="text-[10px] text-neutral-400 line-through">
                            {formatPrice(p.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addItem(p)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition shadow flex-shrink-0"
                      aria-label="Add deal to cart"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/?trending=true"
            className="mt-4 pt-3 border-t border-red-900/40 text-xs font-semibold text-red-300 hover:text-white flex items-center justify-between"
          >
            <span>Voir toutes les offres flash</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Block 2: Tendances du Moment Katanga */}
        <div className="bg-brand-offWhite p-5 rounded-lg border border-brand-border shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-black rounded-full text-white">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-brand-black">
                    Tendances du Moment
                  </h3>
                  <p className="text-[10px] text-brand-gray">Les plus vendus à Lubumbashi</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-brand-black text-white text-[9px] font-bold uppercase rounded">
                Top 2026
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {trendProducts.map((p) => {
                const img = p.images_urls?.[0] || 'https://placehold.co/200x250/png?text=Tendance';

                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-white border border-brand-border rounded flex items-center gap-3 shadow-sm hover:border-neutral-400 transition"
                  >
                    <div className="relative w-14 h-16 rounded overflow-hidden flex-shrink-0 bg-brand-lightGray">
                      <Image src={img} alt={p.title} fill className="object-cover" sizes="56px" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${p.id}`} className="block">
                        <h4 className="text-xs font-semibold text-brand-black truncate hover:text-brand-gray transition">
                          {p.title}
                        </h4>
                      </Link>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold text-brand-black">{formatPrice(p.price_usd)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addItem(p)}
                      className="p-2 bg-brand-black hover:bg-brand-charcoal text-white rounded transition shadow flex-shrink-0"
                      aria-label="Add trending item to cart"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/?trending=true"
            className="mt-4 pt-3 border-t border-brand-border text-xs font-semibold text-brand-black hover:underline flex items-center justify-between"
          >
            <span>Explorer la sélection tendance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Block 3: Top Vendeurs Lubumbashi (Consolidated & Verified) */}
        <div className="bg-gradient-to-br from-neutral-900 to-brand-black text-white p-5 rounded-lg border border-neutral-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500 rounded-full text-black">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-white">
                    Top Vendeurs Lubumbashi
                  </h3>
                  <p className="text-[10px] text-neutral-400">Boutiques certifiées & créateurs locaux</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase rounded">
                Certifiés
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {topStores.length > 0 ? (
                topStores.map((st) => (
                  <div key={st.id} className="p-3 bg-white/5 border border-white/10 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        {st.store_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1">
                          {st.store_name}
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </h4>
                        <p className="text-[10px] text-neutral-400">
                          {st.city || 'Lubumbashi Centre'} • 4.9 ★
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/stores/${st.id}`}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white text-black rounded hover:bg-neutral-200 transition"
                    >
                      Visiter
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-white/5 border border-white/10 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      ZY
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1">
                        Boutique Officielle Zando
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </h4>
                      <p className="text-[10px] text-neutral-400">Lubumbashi • 5.0 ★</p>
                    </div>
                  </div>
                  <Link
                    href="/?stores=all"
                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white text-black rounded hover:bg-neutral-200 transition"
                  >
                    Visiter
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
            <span className="text-[11px] text-neutral-400">Paiement à la livraison garanti</span>
            <Link href="/orders" className="text-amber-400 hover:underline font-semibold text-xs">
              Suivre mes commandes →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
