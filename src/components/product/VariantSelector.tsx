'use client';

import React from 'react';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface VariantSelectorProps {
  sizes: string[];
  selectedSize: string;
  onSelectSize: (size: string) => void;
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  isOutOfStock?: boolean;
}

export function VariantSelector({
  sizes,
  selectedSize,
  onSelectSize,
  colors,
  selectedColor,
  onSelectColor,
  isOutOfStock = false,
}: VariantSelectorProps) {
  const { t } = useLanguageStore();

  return (
    <div className="space-y-4 my-6">
      {/* Sizes */}
      {sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-brand-black uppercase tracking-wider">
              {t('selectSize')} : <strong className="font-bold">{selectedSize}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => !isOutOfStock && onSelectSize(size)}
                disabled={isOutOfStock}
                className={`min-w-[44px] h-10 px-3 flex items-center justify-center text-xs font-bold rounded border transition ${
                  isOutOfStock
                    ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through'
                    : selectedSize === size
                    ? 'bg-brand-black text-white border-brand-black shadow-sm ring-2 ring-black/20'
                    : 'bg-white text-brand-black border-brand-border hover:border-brand-black'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-brand-black uppercase tracking-wider">
              {t('selectColor')} : <strong className="font-bold">{selectedColor}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => !isOutOfStock && onSelectColor(color)}
                disabled={isOutOfStock}
                className={`px-3 py-1.5 text-xs font-medium rounded border transition ${
                  isOutOfStock
                    ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through'
                    : selectedColor === color
                    ? 'bg-brand-black text-white border-brand-black shadow-sm font-semibold ring-2 ring-black/20'
                    : 'bg-white text-brand-black border-brand-border hover:border-brand-black'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
