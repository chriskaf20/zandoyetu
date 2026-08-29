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
  Check,
  Sparkles
} from 'lucide-react';
import { Product } from '@/types/schema';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useStores } from '@/hooks/useStores';

interface PromoDealsGridProps {
  products: Product[];
}

export function PromoDealsGrid({ products }: PromoDealsGridProps) {
  const { formatPrice, formatPriceCDF } = useCurrencyStore();
  const addItem = useCartStore((s) => s.addItem);
  const { data: stores = [] } = useStores();

  const [addedId, setAddedId] = useState<string | null>(null);

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

  const handleAddToCart = (e: React.MouseEvent, p: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  // 1. Flash Deals: Strictly products with discounts
  const dealProducts = products.filter(
    (p) => p.compare_at_price && p.compare_at_price > p.price_usd
  ).slice(0, 4);

  // 2. Trending: Strictly products marked is_trending
  const trendProducts = products.filter((p) => p.is_trending).slice(0, 4);

  // 3. Top Stores: Active stores only
  const topStores = stores.filter((s) => !s.is_archived && (s.is_verified || s.store_name)).slice(0, 2);

  // If none of the sections have items, don't render empty placeholders
  const hasDeals = dealProducts.length > 0;
  const hasTrends = trendProducts.length > 0;
  const hasStores = topStores.length > 0;

  if (!hasDeals && !hasTrends && !hasStores) {
    return null;
  }

  return (
    <section className="my-6 sm:my-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Block 1: Ventes Flash (Render only if deals exist) */}
        {hasDeals && (
          <div className="bg-gradient-to-br from-red-950 via-neutral-900 to-black text-white p-4 sm:p-5 rounded-2xl border border-red-900/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-600 rounded-full text-white">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xs sm:text-sm font-bold tracking-wide text-white">
                      Ventes Flash du Jour
                    </h3>
                    <p className="text-[10px] text-red-300">Offres à durée limitée</p>
                  </div>
                </div>

                {/* Countdown badge */}
                <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {String(timeLeft.hours).padStart(2, '0')}:
                    {String(timeLeft.minutes).padStart(2, '0')}:
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Horizontal Swipeable Slider on Mobile */}
              <div className="flex sm:flex-col gap-2.5 mt-3 overflow-x-auto sm:overflow-x-visible no-scrollbar pb-1 sm:pb-0 snap-x">
                {dealProducts.map((p) => {
                  const img = p.images_urls?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200';
                  const discount = p.compare_at_price
                    ? Math.round(((p.compare_at_price - p.price_usd) / p.compare_at_price) * 100)
                    : 0;

                  return (
                    <div
                      key={p.id}
                      className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2.5 transition min-w-[240px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink"
                    >
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                        <Image src={img} alt={p.title} fill className="object-cover" sizes="48px" />
                        {discount > 0 && (
                          <span className="absolute top-0 left-0 bg-red-600 text-white text-[8px] font-extrabold px-1 rounded-br">
                            -{discount}%
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${p.id}`} className="block">
                          <h4 className="text-xs font-semibold text-white truncate hover:text-red-300 transition">
                            {p.title}
                          </h4>
                        </Link>
                        <div className="mt-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-black text-amber-400">
                              {formatPrice(p.price_usd)}
                            </span>
                            {p.compare_at_price && (
                              <span className="text-[10px] text-neutral-400 line-through">
                                {formatPrice(p.compare_at_price)}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-neutral-400 font-mono">
                            ≈ {formatPriceCDF(p.price_usd)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, p)}
                        className={`p-2 rounded-lg transition shadow-xs flex-shrink-0 ${
                          addedId === p.id ? 'bg-emerald-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                        aria-label="Ajouter au panier"
                      >
                        {addedId === p.id ? <Check className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/?category=all"
              className="mt-3 pt-2.5 border-t border-red-900/40 text-[11px] font-semibold text-red-300 hover:text-white flex items-center justify-between"
            >
              <span>Voir toutes les promotions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Block 2: Tendances du Moment (Render only if trending products exist) */}
        {hasTrends && (
          <div className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-neutral-900 rounded-full text-white">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xs sm:text-sm font-bold text-neutral-900">
                      Tendances du Moment
                    </h3>
                    <p className="text-[10px] text-neutral-500">Sélection vedette Katanga</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-extrabold uppercase rounded-full">
                  Populaire
                </span>
              </div>

              {/* Horizontal Slider on mobile */}
              <div className="flex sm:flex-col gap-2.5 mt-3 overflow-x-auto sm:overflow-x-visible no-scrollbar pb-1 sm:pb-0 snap-x">
                {trendProducts.map((p) => {
                  const img = p.images_urls?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200';

                  return (
                    <div
                      key={p.id}
                      className="p-2 bg-white border border-neutral-200 rounded-xl flex items-center gap-2.5 shadow-2xs hover:border-neutral-400 transition min-w-[240px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink"
                    >
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                        <Image src={img} alt={p.title} fill className="object-cover" sizes="48px" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${p.id}`} className="block">
                          <h4 className="text-xs font-semibold text-neutral-900 truncate hover:text-neutral-600 transition">
                            {p.title}
                          </h4>
                        </Link>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xs font-bold text-neutral-900">{formatPrice(p.price_usd)}</span>
                          <span className="text-[9px] text-neutral-400">≈ {formatPriceCDF(p.price_usd)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, p)}
                        className={`p-2 rounded-lg transition shadow-xs flex-shrink-0 ${
                          addedId === p.id ? 'bg-emerald-600 text-white' : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                        }`}
                        aria-label="Ajouter au panier"
                      >
                        {addedId === p.id ? <Check className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/?trending=true"
              className="mt-3 pt-2.5 border-t border-neutral-200 text-[11px] font-semibold text-neutral-900 hover:underline flex items-center justify-between"
            >
              <span>Explorer les tendances</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Block 3: Top Vendeurs (Render only if stores exist) */}
        {hasStores && (
          <div className="bg-gradient-to-br from-neutral-900 to-black text-white p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 rounded-full text-black">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xs sm:text-sm font-bold text-white">
                      Top Vendeurs Lubumbashi
                    </h3>
                    <p className="text-[10px] text-neutral-400">Boutiques certifiées & créateurs</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase rounded-full">
                  Certifiés
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {topStores.map((st) => (
                  <div key={st.id} className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        {st.store_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1">
                          {st.store_name}
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </h4>
                        <p className="text-[9px] text-neutral-400">
                          {st.city || 'Lubumbashi'} • 4.9 ★
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/stores/${st.id}`}
                      className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-white text-black rounded-lg hover:bg-neutral-200 transition"
                    >
                      Visiter
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
              <span className="text-[10px] text-neutral-400">Paiement à la livraison</span>
              <Link href="/orders" className="text-amber-400 hover:underline font-semibold text-[11px]">
                Suivre mes commandes →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
