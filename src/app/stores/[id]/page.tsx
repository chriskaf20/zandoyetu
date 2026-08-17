'use client';

import React, { use } from 'react';
import { useStore } from '@/hooks/useStores';
import { useVendorProducts } from '@/hooks/useProducts';
import { StoreHeader } from '@/components/vendor/StoreHeader';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Loader2 } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import Link from 'next/link';

export default function VendorStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguageStore();
  const { data: store, isLoading: isLoadingStore } = useStore(id);
  const { data: products = [], isLoading: isLoadingProducts } = useVendorProducts(store?.vendor_id || '');

  if (isLoadingStore) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-brand-gray">
        <Loader2 className="w-8 h-8 animate-spin text-brand-black mb-2" />
        <p className="text-xs">Chargement de la boutique...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="font-serif text-xl font-bold text-brand-black">{t('storeNotFound')}</h2>
        <p className="text-xs text-brand-gray mt-2">{t('storeNotFoundDesc')}</p>
        <Link href="/" className="mt-6 inline-block px-6 py-2.5 bg-brand-black text-white text-xs font-semibold rounded">
          {t('backToShop')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <StoreHeader store={store} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-brand-black">
            {t('itemsForSale', { count: products.length })}
          </h2>
        </div>

        {isLoadingProducts ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-black" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center bg-brand-offWhite rounded border border-dashed border-brand-border">
            <p className="text-sm font-semibold text-brand-black">{t('noItemsInStore')}</p>
            <p className="text-xs text-brand-gray mt-1">{t('noItemsInStoreDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={{ ...product, stores: store }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
