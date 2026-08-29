'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Flame, 
  Clock, 
  TrendingUp, 
  Store as StoreIcon, 
  ArrowRight, 
  ShoppingBag, 
  CheckCircle2, 
  Check,
  Zap
} from 'lucide-react';
import { Product, FlashSale, Store } from '@/types/schema';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useCartStore } from '@/lib/stores/useCartStore';

interface PromoDealsGridProps {
  flashSales?: FlashSale[];
  trendingProducts?: Product[];
  topStores?: Store[];
}

export function PromoDealsGrid({
  flashSales = [],
  trendingProducts = [],
  topStores = [],
}: PromoDealsGridProps) {
  const { formatPrice, formatPriceCDF } = useCurrencyStore();
  const addItem = useCartStore((s) => s.addItem);

  const [addedId, setAddedId] = useState<string | null>(null);

  // Dynamic countdown timer based on the earliest ending flash sale (or fallback 4h timer)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 4,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Find the closest ending flash sale
    const activeEnds = flashSales
      .map((s) => new Date(s.end_time).getTime())
      .filter((t) => t > Date.now())
      .sort((a, b) => a - b);

    const targetEnd = activeEnds.length > 0 ? activeEnds[0] : Date.now() + 4 * 3600 * 1000;

    const updateTimer = () => {
      const diff = Math.max(0, targetEnd - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [flashSales]);

  const handleAddToCart = (e: React.MouseEvent, p: Product, flashPriceUsd?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If flash price provided, add with flash discounted price
    const productToAdd = flashPriceUsd
      ? { ...p, price_usd: flashPriceUsd, price_cdf: Math.round(flashPriceUsd * 2850), compare_at_price: p.price_usd }
      : p;

    addItem(productToAdd);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  // Filter valid active flash sales that have mapped products
  const validFlashSales = flashSales.filter((s) => s.products && s.products.status === 'active').slice(0, 4);

  // Filter valid trending products
  const validTrends = trendingProducts.filter((p) => p.is_trending && p.status === 'active').slice(0, 4);

  // Filter valid top stores
  const validStores = topStores.filter((s) => !s.is_archived && (s.is_verified || s.store_name)).slice(0, 2);

  const hasFlash = validFlashSales.length > 0;
  const hasTrends = validTrends.length > 0;
  const hasStores = validStores.length > 0;

  if (!hasFlash && !hasTrends && !hasStores) {
    return null;
  }

  return (
    <section className="my-6 sm:my-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* ════════════════════════════════════════════════════════════════
            BLOCK 1: VENTES FLASH (Exclusivement de la table flash_sales)
        ════════════════════════════════════════════════════════════════ */}
        {hasFlash && (
          <div className="bg-gradient-to-br from-red-950 via-neutral-900 to-black text-white p-4 sm:p-5 rounded-2xl border border-red-900/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-red-900/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-600 rounded-full text-white animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xs sm:text-sm font-bold tracking-wide text-white flex items-center gap-1.5">
                      <span>Ventes Flash</span>
                      <span className="bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded">
                        OFFICIEL
                      </span>
                    </h3>
                    <p className="text-[10px] text-red-300">Offres limitées dans le temps & stocks</p>
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
                {validFlashSales.map((sale) => {
                  const p = sale.products!;
                  const img = p.images_urls?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200';
                  const regularPrice = p.price_usd;
                  const flashPrice = sale.flash_price_usd;
                  const discount = regularPrice > flashPrice 
                    ? Math.round(((regularPrice - flashPrice) / regularPrice) * 100)
                    : 0;

                  const soldPercent = sale.stock_limit > 0 
                    ? Math.min(100, Math.round(((sale.items_sold || 0) / sale.stock_limit) * 100))
                    : 0;

                  return (
                    <div
                      key={sale.id}
                      className="p-2.5 bg-white/5 hover:bg-white/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 transition min-w-[250px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink"
                    >
                      <div className="relative w-14 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 border border-red-500/30">
                        <Image src={img} alt={p.title} fill className="object-cover" sizes="56px" />
                        <span className="absolute top-0 left-0 bg-red-600 text-white text-[8px] font-black px-1 py-0.5 rounded-br flex items-center gap-0.5">
                          <Zap className="w-2 h-2 fill-white" />
                          {discount > 0 ? `-${discount}%` : 'FLASH'}
                        </span>
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
                              {formatPrice(flashPrice)}
                            </span>
                            {regularPrice > flashPrice && (
                              <span className="text-[10px] text-neutral-400 line-through">
                                {formatPrice(regularPrice)}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-neutral-400 font-mono">
                            ≈ {formatPriceCDF(flashPrice)}
                          </p>
                        </div>

                        {/* Stock Progress Bar */}
                        {sale.stock_limit > 0 && (
                          <div className="mt-1.5">
                            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all"
                                style={{ width: `${soldPercent}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-neutral-400 mt-0.5 block font-medium">
                              {sale.items_sold || 0}/{sale.stock_limit} vendus
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, p, flashPrice)}
                        className={`p-2 rounded-lg transition shadow-xs flex-shrink-0 ${
                          addedId === p.id ? 'bg-emerald-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                        aria-label="Ajouter au prix flash"
                      >
                        {addedId === p.id ? <Check className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-red-900/40 text-[11px] font-semibold text-red-300 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] text-neutral-300">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                Prix exclusifs réservés au catalogue flash
              </span>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            BLOCK 2: TENDANCES DU MOMENT (Exclusivement is_trending === true)
        ════════════════════════════════════════════════════════════════ */}
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
                    <p className="text-[10px] text-neutral-500">Sélection vedette Lubumbashi</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-extrabold uppercase rounded-full">
                  Populaire
                </span>
              </div>

              {/* Horizontal Slider on mobile */}
              <div className="flex sm:flex-col gap-2.5 mt-3 overflow-x-auto sm:overflow-x-visible no-scrollbar pb-1 sm:pb-0 snap-x">
                {validTrends.map((p) => {
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
                          <span className="text-[9px] text-neutral-400 font-mono">≈ {formatPriceCDF(p.price_usd)}</span>
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
              <span>Explorer toutes les tendances</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            BLOCK 3: TOP VENDEURS LUBUMBASHI (Boutiques vérifiées)
        ════════════════════════════════════════════════════════════════ */}
        {hasStores && (
          <div className="bg-gradient-to-br from-neutral-900 to-black text-white p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 rounded-full text-black">
                    <StoreIcon className="w-3.5 h-3.5" />
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
                {validStores.map((st) => (
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
