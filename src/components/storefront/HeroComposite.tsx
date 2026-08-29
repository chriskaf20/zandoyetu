'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Truck, 
  Flame, 
  Store, 
  Crown, 
  Gift,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { HeroBanner } from '@/types/schema';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface HeroCompositeProps {
  banners?: HeroBanner[];
}

export function HeroComposite({ banners }: HeroCompositeProps) {
  const { t } = useLanguageStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners && banners.length > 0 ? banners : [
    {
      id: 'default-1',
      title: 'Collection Haute Couture Lubumbashi 2026',
      subtitle: 'Robes de soirée, ensembles chic & créateurs exclusifs',
      media_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop',
      click_action_route: '/?gender=women',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-2',
      title: 'Gentlemen & Créateurs Katangais',
      subtitle: 'Costumes, chaussures cuir & élégance masculine',
      media_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1400&auto=format&fit=crop',
      click_action_route: '/?gender=men',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-3',
      title: 'Streetwear & Tendances Urbaines',
      subtitle: 'Sneakers, hoodies & nouveautés du moment',
      media_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1400&auto=format&fit=crop',
      click_action_route: '/?trending=true',
      sort_order: 3,
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

  const current = activeBanners[currentIndex] || activeBanners[0];

  return (
    <section className="mb-6 sm:mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column (Desktop Only): 3 Stacked Quick Links */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-3 justify-between">
          {/* Card 1: Nouveautés */}
          <Link
            href="/?category=all"
            className="group relative h-[105px] xl:h-[110px] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 p-3.5 flex flex-col justify-between text-white shadow-xs hover:border-neutral-600 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                <Sparkles className="w-2.5 h-2.5" /> Nouveautés
              </span>
              <h3 className="font-serif text-xs font-bold mt-1 leading-snug group-hover:text-amber-300 transition line-clamp-1">
                Arrivages Quotidiens
              </h3>
            </div>
            <div className="relative z-10 flex items-center text-[9px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white">
              <span>Explorer</span>
              <ArrowRight className="w-2.5 h-2.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80"
              alt="Nouveautés"
              fill
              className="object-cover opacity-25 group-hover:scale-105 transition duration-500"
            />
          </Link>

          {/* Card 2: Livraison Express */}
          <div className="relative h-[105px] xl:h-[110px] rounded-xl overflow-hidden bg-gradient-to-br from-neutral-900 to-black border border-neutral-800 p-3.5 flex flex-col justify-between text-white shadow-xs">
            <div>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                <Truck className="w-2.5 h-2.5" /> Express Lubumbashi
              </span>
              <h3 className="font-serif text-xs font-bold mt-1 leading-snug">
                Livraison à Domicile
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              <span>Cash à la réception</span>
            </div>
          </div>

          {/* Card 3: Tendances Katanga */}
          <Link
            href="/?trending=true"
            className="group relative h-[105px] xl:h-[110px] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 p-3.5 flex flex-col justify-between text-white shadow-xs hover:border-neutral-600 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                <Flame className="w-2.5 h-2.5 fill-red-400" /> Tendances
              </span>
              <h3 className="font-serif text-xs font-bold mt-1 leading-snug group-hover:text-red-300 transition line-clamp-1">
                Mode Urbaine & Wax
              </h3>
            </div>
            <div className="relative z-10 flex items-center text-[9px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white">
              <span>Voir tendances</span>
              <ArrowRight className="w-2.5 h-2.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop&q=80"
              alt="Tendances"
              fill
              className="object-cover opacity-25 group-hover:scale-105 transition duration-500"
            />
          </Link>
        </div>

        {/* Center Column: Dynamic Compact Hero Carousel (Mobile Optimized max-h-48 to md:max-h-80) */}
        <div className="col-span-1 lg:col-span-6 relative h-44 sm:h-56 md:h-72 lg:h-[340px] rounded-2xl overflow-hidden shadow-md group">
          {activeBanners.map((banner, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={banner.id || index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Background Image */}
                <Image
                  src={banner.media_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop'}
                  alt={banner.title}
                  fill
                  priority={index === 0}
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {/* Dark Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-4 sm:p-6 lg:p-8 flex flex-col justify-end text-white">
                  <div className="max-w-md">
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full mb-1.5 sm:mb-2 backdrop-blur-xs">
                      <Sparkles className="w-3 h-3" /> Zando Yetu 2026
                    </span>
                    <h2 className="font-serif text-base sm:text-xl lg:text-2xl font-bold leading-tight line-clamp-2 text-white drop-shadow-md">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-[11px] sm:text-xs text-neutral-200 mt-1 line-clamp-1 font-medium hidden xs:block">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="mt-2.5 sm:mt-4 flex items-center gap-2">
                      <Link
                        href={banner.click_action_route || '/?category=all'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white text-black hover:bg-neutral-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95"
                      >
                        <span>Acheter maintenant</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Carousel Arrows (Hover on desktop, subtle on mobile) */}
          {activeBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous Banner"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next Banner"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-2 right-4 z-20 flex items-center gap-1.5">
                {activeBanners.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column (Desktop Only): 3 Featured Brand / Loyalty Cards */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-3 justify-between">
          {/* Card 1: Boutiques */}
          <Link
            href="/?stores=all"
            className="group relative h-[105px] xl:h-[110px] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 p-3.5 flex flex-col justify-between text-white shadow-xs hover:border-neutral-600 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded">
                <Store className="w-2.5 h-2.5" /> Boutiques
              </span>
              <h3 className="font-serif text-xs font-bold mt-1 leading-snug group-hover:text-sky-300 transition line-clamp-1">
                Top Vendeurs Lubumbashi
              </h3>
            </div>
            <div className="relative z-10 flex items-center text-[9px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white">
              <span>Visiter</span>
              <ArrowRight className="w-2.5 h-2.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&auto=format&fit=crop&q=80"
              alt="Boutiques"
              fill
              className="object-cover opacity-25 group-hover:scale-105 transition duration-500"
            />
          </Link>

          {/* Card 2: Créateurs */}
          <Link
            href="/?category=createurs"
            className="group relative h-[105px] xl:h-[110px] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 p-3.5 flex flex-col justify-between text-white shadow-xs hover:border-neutral-600 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                <Crown className="w-2.5 h-2.5" /> Made in DRC
              </span>
              <h3 className="font-serif text-xs font-bold mt-1 leading-snug group-hover:text-amber-300 transition line-clamp-1">
                Créateurs Katangais
              </h3>
            </div>
            <div className="relative z-10 flex items-center text-[9px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white">
              <span>Découvrir</span>
              <ArrowRight className="w-2.5 h-2.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&auto=format&fit=crop&q=80"
              alt="Créateurs"
              fill
              className="object-cover opacity-25 group-hover:scale-105 transition duration-500"
            />
          </Link>

          {/* Card 3: Fidélité */}
          <Link
            href="/profile"
            className="group relative h-[105px] xl:h-[110px] rounded-xl overflow-hidden bg-gradient-to-r from-amber-950/80 to-neutral-900 border border-amber-800/40 p-3.5 flex flex-col justify-between text-white shadow-xs hover:border-amber-700 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded">
                <Gift className="w-2.5 h-2.5" /> Fidélité
              </span>
              <h3 className="font-serif text-xs font-bold mt-1 leading-snug text-amber-200">
                1 Point = $0.20 USD
              </h3>
            </div>
            <div className="relative z-10 flex items-center text-[9px] font-bold uppercase tracking-wider text-amber-300 group-hover:text-white">
              <span>Mon solde</span>
              <ArrowRight className="w-2.5 h-2.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
