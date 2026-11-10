'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Check } from 'lucide-react';
import { Product } from '@/types/schema';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useCartStore, flashFromSale } from '@/lib/stores/useCartStore';
import { useActiveFlashMap } from '@/hooks/useFlashSales';
import { useWishlistStore } from '@/lib/stores/useWishlistStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { formatPrice, formatPriceCDF, formatPriceUSD, currency } = useCurrencyStore();
  const { t } = useLanguageStore();
  const addItem = useCartStore((s) => s.addItem);
  const { favoriteProductIds, toggleFavorite } = useWishlistStore();
  const flashSale = useActiveFlashMap().get(product.id);

  const [isAdded, setIsAdded] = useState(false);
  const isFavorite = favoriteProductIds.includes(product.id);

  const img = product.images_urls?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600';
  const isOutOfStock = product.stock_count <= 0;

  // Vente flash officielle (admin) : prix flash, barré = prix catalogue.
  // Sinon remise vendeur : barré = compare_at_price.
  const priceUsd = flashSale ? flashSale.flash_price_usd : product.price_usd;
  const strikeUsd = flashSale
    ? product.price_usd
    : product.compare_at_price && product.compare_at_price > product.price_usd
    ? product.compare_at_price
    : null;
  const flashDiscount = flashSale ? Math.round((1 - flashSale.flash_price_usd / product.price_usd) * 100) : 0;
  const vendorDiscount = !flashSale && strikeUsd ? Math.round(((strikeUsd - product.price_usd) / strikeUsd) * 100) : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem(product, undefined, undefined, 1, flashFromSale(flashSale));
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <div className="group relative flex flex-col bg-white border border-brand-border/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300">
      {/* 3:4 Portrait Image Container (Standard Shein E-Commerce Aspect Ratio) */}
      <Link href={`/products/${product.id}`} className="block relative w-full aspect-[3/4] bg-neutral-900 overflow-hidden">
        <Image
          src={img}
          alt={product.title}
          fill
          className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {flashSale && (
            <span className="bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow flex items-center gap-0.5">
              <span>⚡ FLASH -{flashDiscount}%</span>
            </span>
          )}
          {product.is_trending && (
            <span className="bg-brand-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow">
              {t('trendingNow')}
            </span>
          )}
          {vendorDiscount > 0 && (
            <span className="bg-brand-red text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
              -{vendorDiscount}%
            </span>
          )}
        </div>

        {/* Wishlist / Favorite Button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`absolute top-2 right-2 p-1.5 rounded-full z-10 backdrop-blur-sm transition ${
            isFavorite
              ? 'bg-white/90 text-brand-red shadow'
              : 'bg-black/30 text-white hover:bg-white hover:text-brand-black'
          }`}
          aria-label="Add to wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Scarcity Tag */}
        {product.stock_count > 0 && product.stock_count <= 3 && (
          <span className="absolute bottom-2 left-2 bg-amber-500/90 backdrop-blur-sm text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
            {t('onlyLeft', { x: product.stock_count })}
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-brand-black text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {product.stores && (
            <Link
              href={`/stores/${product.stores.id}`}
              className="text-[10px] uppercase font-semibold text-brand-gray tracking-wider hover:text-brand-black line-clamp-1"
            >
              {product.stores.store_name}
            </Link>
          )}

          <Link href={`/products/${product.id}`} className="block mt-1">
            <h3 className="text-xs font-semibold text-brand-black line-clamp-1 group-hover:text-brand-gray transition">
              {product.title}
            </h3>
          </Link>
        </div>

        <div className="mt-3 pt-2 border-t border-brand-border flex items-center justify-between">
          <div>
            <span className={`text-sm font-bold ${flashSale ? 'text-amber-600' : 'text-brand-black'}`}>
              {formatPrice(priceUsd)}
            </span>
            {strikeUsd && (
              <span className="block text-[10px] text-brand-gray line-through">
                {formatPrice(strikeUsd)}
              </span>
            )}
            <span className="block text-[10px] text-neutral-400 font-medium">
              {currency === 'USD' ? `≈ ${formatPriceCDF(priceUsd)}` : `≈ ${formatPriceUSD(priceUsd)}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`p-2 rounded transition flex items-center justify-center ${
              isAdded
                ? 'bg-brand-emerald text-white'
                : isOutOfStock
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-brand-black text-white hover:bg-brand-charcoal'
            }`}
            aria-label="Add to cart"
          >
            {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
