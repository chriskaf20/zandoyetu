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
import { HeroBanner3D } from './HeroBanner3D';

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
      media_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop',
      click_action_route: '/?gender=women',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-2',
      title: 'Gentlemen & Créateurs Katangais',
      media_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1400&auto=format&fit=crop',
      click_action_route: '/?gender=men',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-3',
      title: 'Streetwear & Tendances Urbaines',
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
    }, 5500);
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
    <section className="mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 3 Stacked Cards */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-3 justify-between">
          {/* Card 1: Nouveautés */}
          <Link
            href="/?category=all"
            className="group relative h-[145px] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 p-4 flex flex-col justify-between text-white shadow hover:border-neutral-600 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3" /> Nouveautés 2026
              </span>
              <h3 className="font-serif text-sm font-bold mt-1.5 leading-snug group-hover:text-amber-300 transition">
                Arrivages Quotidiens
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Plus de 200 nouveaux modèles</p>
            </div>
            <div className="relative z-10 flex items-center text-[10px] font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">
              <span>Explorer</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80"
              alt="Nouveautés"
              fill
              className="object-cover opacity-30 group-hover:scale-105 transition duration-500"
            />
          </Link>

          {/* Card 2: Livraison Express Lubumbashi */}
          <div className="relative h-[145px] rounded-lg overflow-hidden bg-gradient-to-br from-neutral-900 to-brand-black border border-neutral-800 p-4 flex flex-col justify-between text-white shadow">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                <Truck className="w-3 h-3" /> Express Lubumbashi
              </span>
              <h3 className="font-serif text-sm font-bold mt-1.5 leading-snug">
                Livraison à Domicile
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Golf, Bel-Air, Ruashi & toutes les communes
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Paiement Cash à la réception</span>
            </div>
          </div>

          {/* Card 3: Tendances Street & Wax */}
          <Link
            href="/?trending=true"
            className="group relative h-[145px] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 p-4 flex flex-col justify-between text-white shadow hover:border-neutral-600 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                <Flame className="w-3 h-3 fill-red-400" /> Tendances Katanga
              </span>
              <h3 className="font-serif text-sm font-bold mt-1.5 leading-snug group-hover:text-red-300 transition">
                Mode Urbaine & Wax
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Pièces les plus demandées</p>
            </div>
            <div className="relative z-10 flex items-center text-[10px] font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">
              <span>Voir les tendances</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop&q=80"
              alt="Tendances"
              fill
              className="object-cover opacity-30 group-hover:scale-105 transition duration-500"
            />
          </Link>
        </div>

        {/* Center Column: Interactive 3D Hero Banner */}
        <div className="lg:col-span-6 relative">
          <HeroBanner3D
            title="Haute Couture & Luxe Katanga"
            subtitle="Explorez les créations exclusives de nos boutiques partenaires de Lubumbashi en 3D temps réel."
            primaryCtaText="Acheter Maintenant"
            primaryCtaLink="/?category=robes"
            secondaryCtaText="Créateurs Katangais"
            secondaryCtaLink="/?category=createurs"
          />
        </div>

        {/* Right Column: 3 Featured Brand / Boutique Cards */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-3 justify-between">
          {/* Card 1: Boutiques Partenaires */}
          <Link
            href="/?stores=all"
            className="group relative h-[145px] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 p-4 flex flex-col justify-between text-white shadow hover:border-neutral-600 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">
                <Store className="w-3 h-3" /> Boutiques Locales
              </span>
              <h3 className="font-serif text-sm font-bold mt-1.5 leading-snug group-hover:text-sky-300 transition">
                Top Vendeurs Lubumbashi
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Boutiques vérifiées et certifiées</p>
            </div>
            <div className="relative z-10 flex items-center text-[10px] font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">
              <span>Visiter les boutiques</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&auto=format&fit=crop&q=80"
              alt="Boutiques"
              fill
              className="object-cover opacity-30 group-hover:scale-105 transition duration-500"
            />
          </Link>

          {/* Card 2: Créateurs Katangais */}
          <Link
            href="/?category=createurs"
            className="group relative h-[145px] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 p-4 flex flex-col justify-between text-white shadow hover:border-neutral-600 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                <Crown className="w-3 h-3" /> Made in DRC
              </span>
              <h3 className="font-serif text-sm font-bold mt-1.5 leading-snug group-hover:text-amber-300 transition">
                Créateurs du Katanga
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Stylisme haut de gamme sur mesure</p>
            </div>
            <div className="relative z-10 flex items-center text-[10px] font-bold uppercase tracking-wider text-neutral-300 group-hover:text-white">
              <span>Découvrir</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&auto=format&fit=crop&q=80"
              alt="Créateurs"
              fill
              className="object-cover opacity-30 group-hover:scale-105 transition duration-500"
            />
          </Link>

          {/* Card 3: Fidélité & Récompenses */}
          <Link
            href="/profile"
            className="group relative h-[145px] rounded-lg overflow-hidden bg-gradient-to-r from-amber-950/80 to-neutral-900 border border-amber-800/40 p-4 flex flex-col justify-between text-white shadow hover:border-amber-700 transition"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded">
                <Gift className="w-3 h-3" /> Programme Fidélité
              </span>
              <h3 className="font-serif text-sm font-bold mt-1.5 leading-snug text-amber-200">
                1 Point = $0.20 USD
              </h3>
              <p className="text-[11px] text-neutral-300 mt-0.5">Remise déduite sur vos commandes</p>
            </div>
            <div className="relative z-10 flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-300 group-hover:text-white">
              <span>Mon solde points</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
