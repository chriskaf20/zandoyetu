'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Clock, ShoppingCart } from 'lucide-react';
import { FlashSale } from '@/types/schema';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useCartStore } from '@/lib/stores/useCartStore';

interface FlashSaleRailProps {
  sales: FlashSale[];
}

export function FlashSaleRail({ sales }: FlashSaleRailProps) {
  const { formatPrice } = useCurrencyStore();
  const addItem = useCartStore((s) => s.addItem);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  const activeSales = sales.filter((s) => s.products);

  useEffect(() => {
    if (activeSales.length === 0) return;

    const targetTime = new Date(activeSales[0].end_time).getTime();

    const updateCountdown = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeSales]);

  if (activeSales.length === 0) return null;

  return (
    <section className="mb-12 bg-gradient-to-r from-neutral-900 via-brand-black to-neutral-900 text-white rounded-lg p-6 shadow-xl">
      {/* Header with Urgency Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500 text-black rounded font-bold">
            <Zap className="w-5 h-5 fill-current animate-bounce" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wide uppercase">Ventes Flash Lubumbashi</h2>
            <p className="text-xs text-neutral-400">Offres exceptionnelles à durée et stocks limités</p>
          </div>
        </div>

        {timeLeft && (
          <div className="flex items-center gap-2 bg-neutral-800 px-4 py-2 rounded font-mono text-xs">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-neutral-400">FIN DANS :</span>
            <span className="font-bold text-amber-400">
              {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        )}
      </div>

      {/* Products Horizontal Scroll / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
        {activeSales.slice(0, 4).map((sale) => {
          const product = sale.products!;
          const img = product.images_urls?.[0] || 'https://placehold.co/400x500/png?text=Flash+Sale';
          const discountPercent = Math.round(
            ((product.price_usd - sale.flash_price_usd) / product.price_usd) * 100
          );
          const progress = Math.min(100, Math.round((sale.items_sold / sale.stock_limit) * 100));

          return (
            <div key={sale.id} className="bg-neutral-800/80 rounded p-3 flex flex-col justify-between group">
              <Link href={`/products/${product.id}`} className="block relative w-full aspect-[4/5] rounded overflow-hidden mb-3">
                <Image
                  src={img}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <span className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  -{discountPercent}%
                </span>
              </Link>

              <div>
                <h3 className="text-xs font-semibold text-neutral-200 line-clamp-1 group-hover:text-white">
                  {product.title}
                </h3>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm font-bold text-amber-400">
                    {formatPrice(sale.flash_price_usd)}
                  </span>
                  <span className="text-[11px] text-neutral-500 line-through">
                    {formatPrice(product.price_usd)}
                  </span>
                </div>

                {/* Stock Progress Bar */}
                <div className="mt-2.5 space-y-1">
                  <div className="w-full bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[10px] text-neutral-400 flex justify-between">
                    <span>{sale.items_sold} vendus</span>
                    <span>Stock: {sale.stock_limit}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => addItem({ ...product, price_usd: sale.flash_price_usd })}
                  className="w-full mt-3 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
