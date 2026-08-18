'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Category } from '@/types/schema';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface CategoryStoryRailProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

const ORDERED_STORY_CATEGORIES = [
  {
    name: 'Tous les Rayons',
    slug: 'all',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=180&auto=format&fit=crop&q=80',
    badge: 'ALL',
  },
  {
    name: 'Robes & Ensembles',
    slug: 'robes',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=180&auto=format&fit=crop&q=80',
    badge: 'HOT',
  },
  {
    name: 'Chaussures',
    slug: 'chaussures',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=180&auto=format&fit=crop&q=80',
    badge: 'TOP',
  },
  {
    name: 'Mode Femme',
    slug: 'femmes',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=180&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mode Homme',
    slug: 'hommes',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=180&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tendances Katanga',
    slug: 'tendances',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=180&auto=format&fit=crop&q=80',
    badge: 'L’SHI',
  },
  {
    name: 'Sacs & Bijoux',
    slug: 'accessoires',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=180&auto=format&fit=crop&q=80',
  },
  {
    name: 'Beauté & Soins',
    slug: 'beaute',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=180&auto=format&fit=crop&q=80',
  },
  {
    name: 'Enfants & Bébés',
    slug: 'enfants',
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=180&auto=format&fit=crop&q=80',
  },
];

export function CategoryStoryRail({
  selectedCategory,
  onSelectCategory,
}: CategoryStoryRailProps) {
  const { t } = useLanguageStore();
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

  return (
    <section className="relative my-6 sm:my-8 py-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-serif text-xs sm:text-sm font-bold text-brand-black uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Rayons & Collections Tendances Lubumbashi</span>
        </h2>
        <span className="text-[11px] text-brand-gray hidden sm:inline">
          Glissez pour filtrer le catalogue
        </span>
      </div>

      {/* Navigation Arrow Left */}
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
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
      >
        {ORDERED_STORY_CATEGORIES.map((item) => {
          const isSelected = selectedCategory === item.slug;

          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => handleCategoryClick(item.slug)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group focus:outline-none min-w-[64px]"
            >
              {/* Circular Story Bubble */}
              <div
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 transition duration-300 ${
                  isSelected
                    ? 'ring-2 ring-brand-black ring-offset-2 scale-105 shadow-md'
                    : 'ring-1 ring-brand-border hover:ring-amber-500 group-hover:scale-105 shadow-sm'
                }`}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden bg-brand-lightGray">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-500"
                    sizes="80px"
                  />
                  {item.badge && (
                    <div className="absolute top-0 right-0 bg-brand-black/80 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </div>
                  )}
                </div>
              </div>

              {/* Title Label */}
              <span
                className={`text-[11px] font-semibold tracking-wide whitespace-nowrap text-center transition ${
                  isSelected
                    ? 'text-brand-black font-bold border-b border-brand-black pb-0.5'
                    : 'text-neutral-700 group-hover:text-brand-black'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation Arrow Right */}
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
