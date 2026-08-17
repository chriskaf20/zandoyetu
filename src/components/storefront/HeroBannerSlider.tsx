'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { HeroBanner } from '@/types/schema';

interface HeroBannerSliderProps {
  banners: HeroBanner[];
}

export function HeroBannerSlider({ banners }: HeroBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners && banners.length > 0 ? banners : [
    {
      id: 'default-1',
      title: 'Collection Été Lubumbashi 2026',
      media_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop',
      click_action_route: '/?category=all',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-2',
      title: 'Haute Couture & Créateurs Katangais',
      media_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1400&auto=format&fit=crop',
      click_action_route: '/?gender=women',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const current = activeBanners[currentIndex];

  return (
    <section className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] bg-brand-black overflow-hidden rounded-md mb-10 shadow-lg">
      {/* Background Image */}
      <div className="relative w-full h-full">
        <Image
          src={current.media_url}
          alt={current.title}
          fill
          priority
          className="object-cover object-center opacity-75 transition-opacity duration-700"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-2xl text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded text-xs font-semibold uppercase tracking-wider mb-4 w-max">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Édition Exclusive
        </div>

        <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          {current.title}
        </h1>

        <p className="text-xs sm:text-sm text-neutral-300 mt-3 line-clamp-2 max-w-md">
          Explorez les collections sélectionnées de nos boutiques partenaires à Lubumbashi avec livraison express.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <Link
            href={current.click_action_route || '/'}
            className="px-6 py-3 bg-white text-brand-black font-semibold text-xs uppercase tracking-wider rounded hover:bg-neutral-200 transition shadow"
          >
            Découvrir la Collection
          </Link>
        </div>
      </div>

      {/* Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/80 transition backdrop-blur-sm"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/80 transition backdrop-blur-sm"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
