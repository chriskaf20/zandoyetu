'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/types/schema';

interface CategoryRailProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export function CategoryRail({ categories, selectedCategory, onSelectCategory }: CategoryRailProps) {
  const rootCategories = categories.filter((c) => c.tier === 1);

  return (
    <div className="mb-8 border-b border-brand-border pb-4">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded text-xs font-semibold whitespace-nowrap uppercase tracking-wider transition ${
            selectedCategory === 'all'
              ? 'bg-brand-black text-white'
              : 'bg-brand-lightGray text-brand-gray hover:text-brand-black'
          }`}
        >
          Tous les Rayons
        </button>

        {rootCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.slug || cat.name.toLowerCase())}
            className={`px-4 py-2 rounded text-xs font-semibold whitespace-nowrap uppercase tracking-wider transition ${
              selectedCategory === (cat.slug || cat.name.toLowerCase())
                ? 'bg-brand-black text-white'
                : 'bg-brand-lightGray text-brand-gray hover:text-brand-black'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
