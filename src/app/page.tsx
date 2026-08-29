'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useHeroBanners } from '@/hooks/useHeroBanners';
import { useFlashSales } from '@/hooks/useFlashSales';
import { useStores } from '@/hooks/useStores';
import { useWishlistStore } from '@/lib/stores/useWishlistStore';
import { HeroComposite } from '@/components/storefront/HeroComposite';
import { CategoryStoryRail } from '@/components/storefront/CategoryStoryRail';
import { PromoDealsGrid } from '@/components/storefront/PromoDealsGrid';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { FloatingAuthBanner } from '@/components/storefront/FloatingAuthBanner';
import { ScrollToTopButton } from '@/components/storefront/ScrollToTopButton';
import { Loader2, Heart, Search, X } from 'lucide-react';
import Link from 'next/link';

function HomeContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || undefined;
  const isWishlistView = searchParams.get('wishlist') === 'true';
  const categoryParam = searchParams.get('category') || undefined;
  const genderParam = searchParams.get('gender') as 'women' | 'men' | undefined;

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'women' | 'men'>(genderParam || 'all');

  const { data: banners = [] } = useHeroBanners();
  const { data: categories = [] } = useCategories();
  const { data: flashSales = [] } = useFlashSales();
  const { data: stores = [] } = useStores();
  const favoriteProductIds = useWishlistStore((s) => s.favoriteProductIds);

  const { data: allProducts = [], isLoading: isLoadingProducts } = useProducts({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    gender: genderFilter !== 'all' ? genderFilter : undefined,
    search,
  });

  // Filter isolated trending products
  const trendingProducts = allProducts.filter((p) => p.is_trending);

  // If in wishlist view, filter to favorite products
  const products = isWishlistView
    ? allProducts.filter((p) => favoriteProductIds.includes(p.id))
    : allProducts;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Wishlist Active Filter Banner */}
      {isWishlistView && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-800">
            <Heart className="w-4 h-4 text-brand-red fill-current" />
            <span>Mes Articles Favoris ({products.length})</span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-neutral-600 hover:text-brand-black flex items-center gap-1"
          >
            <span>Voir tout le catalogue</span>
            <X className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Active Search Results Banner */}
      {search && (
        <div className="mb-6 p-4 bg-brand-lightGray rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-gray" />
            <p>
              Résultats de recherche pour : <strong className="text-brand-black">"{search}"</strong>
            </p>
          </div>
          <Link href="/" className="text-xs font-semibold text-brand-black hover:underline">
            Effacer la recherche
          </Link>
        </div>
      )}

      {/* Hero Composite Section (only on default view without search or wishlist) */}
      {!search && !isWishlistView && (
        <>
          <HeroComposite banners={banners} />
          <CategoryStoryRail
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <PromoDealsGrid 
            flashSales={flashSales} 
            trendingProducts={trendingProducts} 
            topStores={stores} 
          />
        </>
      )}

      {/* Main High-Density Product Grid with Theme Tabs */}
      {isLoadingProducts ? (
        <div className="py-24 flex flex-col items-center justify-center text-brand-gray">
          <Loader2 className="w-8 h-8 animate-spin text-brand-black mb-2" />
          <p className="text-xs font-semibold">Chargement des collections Zando Yetu...</p>
        </div>
      ) : (
        <ProductGrid
          products={products}
          genderFilter={genderFilter}
          onGenderFilterChange={setGenderFilter}
        />
      )}

      {/* Floating Utilities */}
      <FloatingAuthBanner />
      <ScrollToTopButton />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-black" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
