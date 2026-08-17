'use client';

import React, { useState } from 'react';
import { Product } from '@/types/schema';
import { ProductCard } from './ProductCard';
import { Sparkles, Flame, DollarSign, ArrowUpDown } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface ProductGridProps {
  products: Product[];
  genderFilter: 'all' | 'women' | 'men';
  onGenderFilterChange: (gender: 'all' | 'women' | 'men') => void;
}

export type ThemeTab = 'all' | 'bestsellers' | 'women' | 'men' | 'trending' | 'under20';

export function ProductGrid({ products, genderFilter, onGenderFilterChange }: ProductGridProps) {
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<ThemeTab>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'trending'>('featured');

  // Handle Tab Switch
  const handleTabChange = (tab: ThemeTab) => {
    setActiveTab(tab);
    if (tab === 'women') {
      onGenderFilterChange('women');
    } else if (tab === 'men') {
      onGenderFilterChange('men');
    } else {
      onGenderFilterChange('all');
    }
  };

  // Filter based on activeTab
  const filtered = products.filter((p) => {
    if (activeTab === 'women') {
      return p.target_gender === 'women' || p.target_gender === 'mixte';
    }
    if (activeTab === 'men') {
      return p.target_gender === 'men' || p.target_gender === 'mixte';
    }
    if (activeTab === 'trending' || activeTab === 'bestsellers') {
      return p.is_trending || (p.compare_at_price && p.compare_at_price > p.price_usd);
    }
    if (activeTab === 'under20') {
      return p.price_usd <= 20;
    }
    return true;
  });

  // Sort filtered list
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price_usd - b.price_usd;
    if (sortBy === 'price-desc') return b.price_usd - a.price_usd;
    if (sortBy === 'trending') return (b.is_trending ? 1 : 0) - (a.is_trending ? 1 : 0);
    return 0;
  });

  const tabs: { id: ThemeTab; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'Tous les Articles' },
    { id: 'bestsellers', label: t('bestSellers'), icon: Sparkles },
    { id: 'women', label: t('megaMenuWomen') },
    { id: 'men', label: t('megaMenuMen') },
    { id: 'trending', label: t('trendsTitle'), icon: Flame },
    { id: 'under20', label: t('under20') },
  ];

  return (
    <section className="my-8">
      {/* Themed Filter Tabs & Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-border">
        {/* Horizontal Theme Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-full uppercase tracking-wider transition whitespace-nowrap flex items-center gap-1.5 shadow-sm ${
                  isActive
                    ? 'bg-brand-black text-white'
                    : 'bg-brand-lightGray text-brand-gray hover:text-brand-black hover:bg-neutral-200'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-amber-400" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Count & Sort Dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
          <span className="text-xs text-brand-gray whitespace-nowrap">
            <strong className="text-brand-black">{sorted.length}</strong> articles trouvés
          </span>

          <div className="flex items-center gap-1.5 bg-white border border-brand-border rounded-full px-2.5 py-1 shadow-sm">
            <ArrowUpDown className="w-3 h-3 text-brand-gray" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium bg-transparent border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value="featured">Sélection Vedette</option>
              <option value="trending">Tendances</option>
              <option value="price-asc">Prix : Moins cher</option>
              <option value="price-desc">Prix : Plus cher</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Cards Grid (4:5 High-Density Aspect Ratio) */}
      {sorted.length === 0 ? (
        <div className="py-20 text-center bg-brand-offWhite rounded-lg border border-dashed border-brand-border">
          <p className="text-sm font-semibold text-brand-black">Aucun article trouvé pour cet onglet</p>
          <p className="text-xs text-brand-gray mt-1">Sélectionnez un autre onglet ou explorez nos autres catégories.</p>
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className="mt-4 px-4 py-2 bg-brand-black text-white text-xs font-semibold rounded"
          >
            Afficher tous les articles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
