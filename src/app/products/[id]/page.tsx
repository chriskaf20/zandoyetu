'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Heart, Check, Store as StoreIcon, Loader2, MessageCircle } from 'lucide-react';
import { useProduct } from '@/hooks/useProducts';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useWishlistStore } from '@/lib/stores/useWishlistStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { ImageGallery } from '@/components/product/ImageGallery';
import { VariantSelector } from '@/components/product/VariantSelector';
import { TrustGuard } from '@/components/product/TrustGuard';
import { ReviewSection } from '@/components/product/ReviewSection';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const { formatPrice } = useCurrencyStore();
  const addItem = useCartStore((s) => s.addItem);
  const isFavorite = useWishlistStore((s) => s.isFavorite(id));
  const toggleFavorite = useWishlistStore((s) => s.toggleFavorite);
  const { t } = useLanguageStore();

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isAdded, setIsAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-brand-gray">
        <Loader2 className="w-8 h-8 animate-spin text-brand-black mb-2" />
        <p className="text-xs">Chargement des détails de l'article...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="font-serif text-xl font-bold text-brand-black">{t('productNotFound')}</h2>
        <p className="text-xs text-brand-gray mt-2">{t('productNotFoundDesc')}</p>
        <Link href="/" className="mt-6 inline-block px-6 py-2.5 bg-brand-black text-white text-xs font-semibold rounded">
          {t('backToShop')}
        </Link>
      </div>
    );
  }

  // Parse sizes
  let parsedSizes: string[] = [];
  if (product.sizes_json) {
    try {
      parsedSizes = JSON.parse(product.sizes_json);
    } catch {}
  }
  if (parsedSizes.length === 0) {
    parsedSizes = ['Unique'];
  }

  const activeSize = selectedSize || parsedSizes[0];
  const activeColor = selectedColor || (product.colors_json?.[0] || 'Standard');
  const isOutOfStock = product.stock_count <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, activeSize, activeColor);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, activeSize, activeColor);
    router.push('/checkout');
  };

  // Vendor WhatsApp URL
  const rawPhone = product.stores?.phone || '243970000000';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const productUrl = typeof window !== 'undefined' ? window.location.href : `https://zandoyetu.com/products/${product.id}`;
  const whatsappMsg = encodeURIComponent(
    t('whatsappProductMsg', {
      title: product.title,
      price: formatPrice(product.price_usd),
      link: productUrl,
    })
  );
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '243' + cleanPhone.slice(1) : cleanPhone}?text=${whatsappMsg}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb / Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs text-brand-gray hover:text-brand-black transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('viewCatalog')}</span>
      </button>

      {/* Main Grid: Gallery & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Gallery */}
        <div className="relative">
          <ImageGallery images={product.images_urls} title={product.title} />
        </div>

        {/* Right: Product Actions & Info */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Vendor / Store Info & Wishlist Toggle */}
            <div className="flex items-center justify-between mb-2">
              {product.stores ? (
                <Link
                  href={`/stores/${product.stores.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gray hover:text-brand-black"
                >
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>{product.stores.store_name} ({product.stores.city || 'Lubumbashi'})</span>
                </Link>
              ) : <div />}

              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                className={`p-2 rounded-full border transition flex items-center gap-1.5 text-xs ${
                  isFavorite
                    ? 'border-brand-red text-brand-red bg-red-50'
                    : 'border-brand-border text-brand-gray hover:text-brand-black hover:border-brand-black'
                }`}
                title={isFavorite ? t('wishlistRemoved') : t('wishlistAdded')}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-black">
              {product.title}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 my-4">
              <span className="text-2xl font-bold text-brand-black">
                {formatPrice(product.price_usd)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price_usd && (
                <span className="text-sm text-brand-gray line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
              {product.stock_count > 0 && product.stock_count <= 3 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {t('scarcityWarning', { count: product.stock_count })}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-xs text-neutral-600 leading-relaxed my-4 border-y border-brand-border py-4">
                {product.description}
              </p>
            )}

            {/* Variants */}
            <VariantSelector
              sizes={parsedSizes}
              selectedSize={activeSize}
              onSelectSize={setSelectedSize}
              colors={product.colors_json || []}
              selectedColor={activeColor}
              onSelectColor={setSelectedColor}
              isOutOfStock={isOutOfStock}
            />

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-3.5 px-6 font-semibold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition shadow ${
                  isAdded
                    ? 'bg-brand-emerald text-white'
                    : isOutOfStock
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-brand-black text-white hover:bg-brand-charcoal'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('addedToCart')}</span>
                  </>
                ) : isOutOfStock ? (
                  <span>{t('outOfStock')}</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t('addToCart')}</span>
                  </>
                )}
              </button>

              {!isOutOfStock && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3 px-6 bg-white border border-brand-border text-brand-black hover:bg-brand-lightGray font-semibold text-xs uppercase tracking-wider rounded transition"
                >
                  {t('buyNow')}
                </button>
              )}

              {/* Direct WhatsApp Vendor Inquiry */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider rounded transition flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t('whatsappInquiry')}</span>
              </a>
            </div>

            {/* Trust Guard Guarantees */}
            <TrustGuard deliveryTime={product.delivery_time} hasFreeReturn={product.has_free_return} />
          </div>
        </div>
      </div>

      {/* Review Section */}
      <ReviewSection productId={product.id} />
    </div>
  );
}
