'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Category } from '@/types/schema';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface CategoryStoryRailProps {
  categories?: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

// Fallback macro universes if database query is loading
const FALLBACK_UNIVERSES = [
  {
    id: 'femme',
    name: 'Mode Femme',
    slug: 'femme',
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200&auto=format&fit=crop&q=80',
    badge: 'HOT',
  },
  {
    id: 'homme',
    name: 'Mode Homme',
    slug: 'homme',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=80',
    badge: 'NEW',
  },
  {
    id: 'chaussures',
    name: 'Chaussures',
    slug: 'chaussures',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80',
    badge: 'TOP',
  },
  {
    id: 'sacs',
    name: 'Sacs & Maroquinerie',
    slug: 'sacs',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'accessoires',
    name: 'Accessoires & Bijoux',
    slug: 'accessoires',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'beaute',
    name: 'Beauté & Soins',
    slug: 'beaute',
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=80',
  },
];

export function CategoryStoryRail({
  categories = [],
  selectedCategory,
  onSelectCategory,
}: CategoryStoryRailProps) {
  const { t, language } = useLanguageStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (slug: string) => {
    onSelectCategory(slug);
    if (typeof window !== 'undefined') {
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Filter root categories from props or fallback to standard universes
  const rootCategories = categories.filter((c) => !c.parent_id);
  const displayList = rootCategories.length > 0 ? rootCategories : (FALLBACK_UNIVERSES as Category[]);

  return (
    <section className="relative my-3 sm:my-5 py-1">
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
        <h2 className="font-serif text-xs sm:text-sm font-bold text-brand-black uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          <span>Univers & Rayons Zando Yetu</span>
        </h2>
        <span className="text-[10px] sm:text-[11px] text-brand-gray hidden sm:inline">
          Sélectionnez un univers pour filtrer
        </span>
      </div>

      {/* Navigation Arrow Left (Desktop) */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1 z-20 w-8 h-8 rounded-full bg-white/95 border border-brand-border text-brand-black shadow-md items-center justify-center hover:bg-brand-black hover:text-white transition"
        aria-label="Rayons précédents"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Horizontal Scroll Story Rail */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-5 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth"
      >
        {/* 1. Global "Tous les Rayons" Bubble */}
        <button
          type="button"
          onClick={() => handleCategoryClick('all')}
          className="flex flex-col items-center gap-1 sm:gap-1.5 flex-shrink-0 group focus:outline-none min-w-[58px] sm:min-w-[70px]"
        >
          <div
            className={`relative w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full p-0.5 transition duration-300 ${
              selectedCategory === 'all'
                ? 'ring-2 ring-brand-black ring-offset-2 scale-105 shadow-md'
                : 'ring-1 ring-brand-border hover:ring-neutral-400 group-hover:scale-105 shadow-xs'
            }`}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden bg-brand-black text-white flex flex-col items-center justify-center">
              <span className="text-xs sm:text-sm font-black tracking-widest">ALL</span>
              <span className="text-[7px] text-amber-400 uppercase font-bold">Catalogue</span>
            </div>
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-semibold tracking-tight whitespace-nowrap text-center transition ${
              selectedCategory === 'all'
                ? 'text-brand-black font-extrabold border-b-2 border-brand-black pb-0.5'
                : 'text-neutral-700 group-hover:text-brand-black'
            }`}
          >
            Tous les Rayons
          </span>
        </button>

        {/* 2. Macro Universes Bubbles */}
        {displayList.map((item) => {
          const slug = item.slug || item.id;
          const isSelected = selectedCategory === slug;
          const img = item.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200';
          const label = language === 'en' && item.name_en
            ? item.name_en
            : language === 'sw' && item.name_sw
            ? item.name_sw
            : item.name_fr || item.name;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCategoryClick(slug)}
              className="flex flex-col items-center gap-1 sm:gap-1.5 flex-shrink-0 group focus:outline-none min-w-[58px] sm:min-w-[70px]"
            >
              {/* Circular Story Bubble */}
              <div
                className={`relative w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full p-0.5 transition duration-300 ${
                  isSelected
                    ? 'ring-2 ring-brand-black ring-offset-2 scale-105 shadow-md'
                    : 'ring-1 ring-brand-border hover:ring-amber-500 group-hover:scale-105 shadow-xs'
                }`}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden bg-brand-lightGray">
                  <Image
                    src={img}
                    alt={label}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-500"
                    sizes="80px"
                  />
                  {(item as any).badge && (
                    <div className="absolute top-0 right-0 bg-brand-black/90 backdrop-blur-xs text-white text-[7px] sm:text-[8px] font-extrabold px-1 py-0.5 rounded-full">
                      {(item as any).badge}
                    </div>
                  )}
                </div>
              </div>

              {/* Title Label */}
              <span
                className={`text-[10px] sm:text-[11px] font-semibold tracking-tight whitespace-nowrap text-center max-w-[85px] truncate transition ${
                  isSelected
                    ? 'text-brand-black font-extrabold border-b-2 border-brand-black pb-0.5'
                    : 'text-neutral-700 group-hover:text-brand-black'
                }`}
                title={label}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation Arrow Right (Desktop) */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1 z-20 w-8 h-8 rounded-full bg-white/95 border border-brand-border text-brand-black shadow-md items-center justify-center hover:bg-brand-black hover:text-white transition"
        aria-label="Rayons suivants"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </section>
  );
}
