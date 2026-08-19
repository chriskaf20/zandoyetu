'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Search, 
  ArrowRight,
  Shirt, 
  ShoppingBag, 
  Heart, 
  Baby, 
  Home as HomeIcon, 
  Glasses,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { CategoryService, StructuredDepartment } from '@/lib/services/CategoryService';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

const DEPARTMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  femmes: Shirt,
  hommes: Shirt,
  chaussures: Sparkles,
  accessoires: Glasses,
  beaute: Heart,
  enfants: Baby,
  maison: HomeIcon,
};

function CategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDept = searchParams.get('dept') || 'femmes';
  const { t } = useLanguageStore();

  const departments: StructuredDepartment[] = CategoryService.getStructuredTaxonomy();
  const [activeDeptSlug, setActiveDeptSlug] = useState<string>(initialDept);
  const [searchQuery, setSearchQuery] = useState('');

  const activeDepartment = departments.find((d) => d.slug === activeDeptSlug) || departments[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-offWhite pb-20 md:pb-12">
      {/* Top Search & Filter Bar (Mobile & Desktop) */}
      <div className="bg-white border-b border-brand-border sticky top-14 sm:top-20 z-30 px-4 py-2.5 sm:py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une catégorie, marque ou article..."
              className="w-full pl-9 pr-20 py-2 text-xs bg-brand-lightGray border border-transparent rounded-full focus:border-brand-black focus:bg-white focus:outline-none transition"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray" />
            <button
              type="submit"
              className="absolute right-1 top-1 px-3 py-1 bg-brand-black text-white text-[11px] font-semibold rounded-full hover:bg-neutral-800 transition"
            >
              Chercher
            </button>
          </form>

          <Link
            href="/?trending=true"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-amber-100 transition whitespace-nowrap"
          >
            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>Ventes Flash 🔥</span>
          </Link>
        </div>
      </div>

      {/* MOBILE VIEW: DUAL-COLUMN SPLIT EXPLORER (< md) */}
      <div className="md:hidden flex h-[calc(100vh-112px)] overflow-hidden bg-white">
        {/* Left Sticky Navigation Rail (w-28) */}
        <aside className="w-24 sm:w-28 bg-neutral-50 border-r border-brand-border overflow-y-auto no-scrollbar flex-shrink-0">
          <div className="py-2 space-y-1">
            {departments.map((dept) => {
              const Icon = DEPARTMENT_ICONS[dept.slug] || ShoppingBag;
              const isActive = dept.slug === activeDeptSlug;

              return (
                <button
                  key={dept.slug}
                  type="button"
                  onClick={() => setActiveDeptSlug(dept.slug)}
                  className={`w-full py-3.5 px-2 flex flex-col items-center justify-center gap-1.5 transition text-center relative ${
                    isActive
                      ? 'bg-white text-brand-black font-bold shadow-xs'
                      : 'text-neutral-500 hover:text-brand-black hover:bg-neutral-100/70'
                  }`}
                >
                  {/* Active Gold Left Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-amber-500 rounded-r" />
                  )}

                  <div className={`relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border transition ${
                    isActive ? 'border-brand-black shadow-sm ring-1 ring-amber-400' : 'border-neutral-200 bg-white'
                  }`}>
                    <Image
                      src={dept.image_url}
                      alt={dept.name}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>

                  <span className="text-[10px] leading-tight font-semibold tracking-tight max-w-[80px]">
                    {dept.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Content Panel (flex-1) */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white space-y-4 no-scrollbar">
          {/* Active Department Header Banner */}
          {activeDepartment.promoBanner && (
            <Link
              href={`/?category=${activeDepartment.slug}`}
              className="block relative h-28 rounded-lg overflow-hidden shadow-sm group"
            >
              <Image
                src={activeDepartment.promoBanner.image}
                alt={activeDepartment.promoBanner.title}
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 flex flex-col justify-end text-white">
                <span className="inline-block px-1.5 py-0.5 bg-amber-500 text-black text-[8px] font-bold uppercase rounded w-fit mb-0.5">
                  Rayon Vedette
                </span>
                <h3 className="font-serif text-xs font-bold leading-tight line-clamp-1">
                  {activeDepartment.promoBanner.title}
                </h3>
                <p className="text-[10px] text-neutral-200 line-clamp-1">
                  {activeDepartment.promoBanner.subtitle}
                </p>
              </div>
            </Link>
          )}

          {/* Department Main Title & "Voir Tout" Action */}
          <div className="flex items-center justify-between pb-1 border-b border-brand-border">
            <h2 className="font-serif text-sm font-bold text-brand-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeDepartment.name}</span>
            </h2>

            <Link
              href={`/?category=${activeDepartment.slug}`}
              className="text-[11px] font-semibold text-brand-black hover:underline inline-flex items-center gap-0.5"
            >
              <span>Tout voir</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Subgroups Visual Cards Grid */}
          <div className="grid grid-cols-1 gap-3">
            {activeDepartment.subgroups.map((sub) => (
              <div
                key={sub.id}
                className="bg-brand-offWhite border border-brand-border rounded-lg p-2.5 transition hover:border-neutral-400 shadow-2xs"
              >
                {/* Subgroup Header Card */}
                <Link
                  href={`/?category=${sub.slug}`}
                  className="flex items-center gap-2.5 group mb-2"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-brand-border shadow-xs">
                    <Image
                      src={sub.image_url}
                      alt={sub.name}
                      fill
                      className="object-cover group-hover:scale-110 transition duration-300"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-brand-black uppercase tracking-tight truncate group-hover:text-brand-charcoal">
                      {sub.name}
                    </h4>
                    <span className="text-[10px] font-medium text-brand-gray flex items-center gap-1">
                      Explorer le rayon <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </Link>

                {/* Subgroup Pill Filter Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-200/80">
                  {sub.items.map((item) => (
                    <Link
                      key={item}
                      href={`/?search=${encodeURIComponent(item)}`}
                      className="text-[10px] font-medium text-neutral-700 bg-white hover:bg-brand-black hover:text-white px-2.5 py-1 rounded-full border border-neutral-200 shadow-2xs transition"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* DESKTOP VIEW: EXPANDED DIRECTORY GRID (>= md) */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
              <Compass className="w-4 h-4" />
              <span>Annuaire Officiel • Lubumbashi</span>
            </div>
            <h1 className="font-serif text-2xl lg:text-3xl font-bold text-brand-black tracking-tight">
              Tous les Rayons & Collections Zando Yetu
            </h1>
            <p className="text-xs text-brand-gray mt-1">
              Explorez toutes les catégories, créateurs et sous-groupes de mode disponibles au Katanga.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 bg-brand-black text-white text-xs font-semibold rounded-full hover:bg-neutral-800 transition"
            >
              Retour à l'Accueil
            </Link>
          </div>
        </div>

        {/* Department Directory Sections */}
        <div className="space-y-10">
          {departments.map((dept) => {
            const Icon = DEPARTMENT_ICONS[dept.slug] || ShoppingBag;

            return (
              <section key={dept.slug} className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
                {/* Department Section Header */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-brand-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-black text-white flex items-center justify-center shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-bold text-brand-black tracking-tight">
                        {dept.name}
                      </h2>
                      <p className="text-xs text-brand-gray">
                        {dept.subgroups.length} sous-groupes de collections
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/?category=${dept.slug}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-brand-offWhite border border-brand-border text-brand-black text-xs font-bold uppercase tracking-wider rounded-full hover:bg-brand-black hover:text-white transition"
                  >
                    <span>Voir tout le rayon</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Subgroups Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {dept.subgroups.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-brand-offWhite rounded-lg border border-brand-border p-4 flex flex-col justify-between hover:border-neutral-400 transition group shadow-xs"
                    >
                      <div>
                        <Link href={`/?category=${sub.slug}`} className="block mb-3">
                          <div className="relative w-full h-32 rounded-md overflow-hidden mb-2 bg-neutral-200">
                            <Image
                              src={sub.image_url}
                              alt={sub.name}
                              fill
                              className="object-cover group-hover:scale-105 transition duration-500"
                              sizes="240px"
                            />
                          </div>
                          <h3 className="text-xs font-bold uppercase tracking-tight text-brand-black group-hover:text-brand-charcoal transition">
                            {sub.name}
                          </h3>
                        </Link>

                        {/* Subgroup items pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {sub.items.map((item) => (
                            <Link
                              key={item}
                              href={`/?search=${encodeURIComponent(item)}`}
                              className="text-[10px] text-neutral-700 bg-white hover:bg-brand-black hover:text-white px-2 py-0.5 rounded border border-neutral-200 transition"
                            >
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={`/?category=${sub.slug}`}
                        className="text-[11px] font-bold text-brand-black hover:underline inline-flex items-center gap-1 mt-2 pt-2 border-t border-neutral-200"
                      >
                        <span>Parcourir</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-brand-black border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
