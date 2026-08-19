'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const safeImages = images && images.length > 0 ? images : ['https://placehold.co/600x750/png?text=Zando+Yetu'];
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Touch Swipe Handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedIndex < safeImages.length - 1) {
      setSelectedIndex((prev) => prev + 1);
    }
    if (isRightSwipe && selectedIndex > 0) {
      setSelectedIndex((prev) => prev - 1);
    }
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails (Desktop side list / Mobile bottom strip) */}
      {safeImages.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[500px] no-scrollbar">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition duration-200 ${
                idx === selectedIndex ? 'border-brand-black shadow-md scale-105' : 'border-transparent opacity-65 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${title} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Active Image Container with Touch Swipe & 4:5 Aspect Ratio */}
      <div 
        className="relative flex-1 aspect-[4/5] bg-brand-lightGray rounded-xl overflow-hidden shadow-sm select-none group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={safeImages[selectedIndex]}
          alt={title}
          fill
          priority
          className="object-cover object-center transition-all duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Previous Image Arrow */}
        {safeImages.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-brand-border text-brand-black flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-black hover:text-white"
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Next Image Arrow */}
        {safeImages.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-brand-border text-brand-black flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-black hover:text-white"
            aria-label="Image suivante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Image Counter Badge */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold rounded-full shadow-sm flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{selectedIndex + 1} / {safeImages.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageGallery;
