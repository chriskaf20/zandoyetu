'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronDown, 
  ChevronRight, 
  Flame, 
  Shirt, 
  ShoppingBag, 
  Grid,
  Sparkles,
  Heart,
  Baby,
  Home as HomeIcon,
  Glasses
} from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { CategoryService, StructuredDepartment } from '@/lib/services/CategoryService';

const DEPARTMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  femmes: Shirt,
  hommes: Shirt,
  chaussures: Sparkles,
  accessoires: Glasses,
  beaute: Heart,
  enfants: Baby,
  maison: HomeIcon,
};

export function MegaMenu() {
  const { t } = useLanguageStore();
  const departments: StructuredDepartment[] = CategoryService.getStructuredTaxonomy();
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeDepartmentSlug, setActiveDepartmentSlug] = useState<string>('femmes');
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(slug);
    setActiveDepartmentSlug(slug);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 200);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setActiveMenu(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const selectedDepartment = departments.find((d) => d.slug === activeDepartmentSlug) || departments[0];

  const handleCategoryLinkClick = () => {
    setActiveMenu(null);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const catalogEl = document.getElementById('catalog-section');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <div 
      ref={menuRef} 
      className="relative bg-white border-b border-brand-border"
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 text-xs font-semibold gap-2">
          {/* Main Rayon Trigger */}
          <button
            type="button"
            onMouseEnter={() => handleMouseEnter('femmes')}
            onClick={() => setActiveMenu(activeMenu ? null : 'femmes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition whitespace-nowrap uppercase tracking-wider ${
              activeMenu ? 'bg-brand-black text-white' : 'text-brand-black hover:bg-brand-lightGray'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{t('allRayons')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Clean Top Department Nav Links (7 departments) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {departments.map((dept) => (
              <button
                key={dept.slug}
                type="button"
                onMouseEnter={() => handleMouseEnter(dept.slug)}
                onClick={() => handleMouseEnter(dept.slug)}
                className={`px-2.5 py-1.5 rounded transition uppercase tracking-wider whitespace-nowrap text-[11px] sm:text-xs ${
                  activeMenu === dept.slug
                    ? 'text-brand-black font-bold border-b-2 border-brand-black'
                    : 'text-neutral-600 hover:text-brand-black'
                }`}
              >
                {dept.name}
              </button>
            ))}

            {/* Flash Deals Highlight Link */}
            <Link
              href="/?trending=true"
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-bold uppercase tracking-wider whitespace-nowrap hover:bg-amber-100 transition text-[11px] sm:text-xs ml-1"
            >
              <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
              <span>{t('flashSales')}</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Mega Menu Dropdown Panel */}
      {activeMenu && (
        <div 
          className="absolute left-0 right-0 top-full z-50 bg-white border-b border-brand-border shadow-2xl animate-in fade-in-50 slide-in-from-top-1 duration-150"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column: Department List */}
              <div className="col-span-3 border-r border-brand-border pr-4 space-y-1">
                <p className="text-[10px] uppercase font-bold text-brand-gray tracking-widest px-3 mb-2">
                  Tous les Départements
                </p>
                {departments.map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept.slug] || ShoppingBag;
                  const isSelected = selectedDepartment.slug === dept.slug;

                  return (
                    <button
                      key={dept.slug}
                      type="button"
                      onMouseEnter={() => setActiveDepartmentSlug(dept.slug)}
                      onClick={() => setActiveDepartmentSlug(dept.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-semibold transition text-left ${
                        isSelected
                          ? 'bg-brand-black text-white shadow-sm'
                          : 'text-brand-black hover:bg-brand-lightGray'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{dept.name}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-brand-gray'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Center Column: Grouped Subcategories Visual Grid */}
              <div className="col-span-6 px-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-brand-black">
                    {selectedDepartment.name} — Collections & Tendances
                  </h3>
                  <Link
                    href={`/?category=${selectedDepartment.slug}`}
                    onClick={handleCategoryLinkClick}
                    className="text-xs font-semibold text-brand-black hover:underline inline-flex items-center gap-1"
                  >
                    <span>Voir tout le rayon</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedDepartment.subgroups.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-brand-offWhite border border-brand-border rounded hover:border-neutral-400 transition"
                    >
                      <Link
                        href={`/?category=${sub.slug}`}
                        onClick={handleCategoryLinkClick}
                        className="group flex items-center gap-3 mb-2"
                      >
                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-brand-border shadow-sm">
                          <Image
                            src={sub.image_url}
                            alt={sub.name}
                            fill
                            className="object-cover group-hover:scale-110 transition duration-300"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-brand-black group-hover:text-brand-charcoal transition uppercase tracking-tight truncate">
                            {sub.name}
                          </h4>
                          <span className="text-[10px] text-brand-gray group-hover:underline">Explorer &rarr;</span>
                        </div>
                      </Link>

                      {/* Clickable sub-item pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-neutral-200">
                        {sub.items.map((item) => (
                          <Link
                            key={item}
                            href={`/?search=${encodeURIComponent(item)}`}
                            onClick={handleCategoryLinkClick}
                            className="text-[10px] text-neutral-600 bg-white hover:bg-brand-black hover:text-white px-2 py-0.5 rounded border border-neutral-200 transition"
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Promotional Card Banner */}
              {selectedDepartment.promoBanner && (
                <div className="col-span-3 pl-2">
                  <Link
                    href={selectedDepartment.promoBanner.link}
                    onClick={handleCategoryLinkClick}
                    className="group block relative h-full min-h-[260px] rounded-md overflow-hidden shadow-md"
                  >
                    <Image
                      src={selectedDepartment.promoBanner.image}
                      alt={selectedDepartment.promoBanner.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                      sizes="300px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="inline-block px-2 py-0.5 bg-amber-500 text-black text-[9px] font-bold uppercase rounded mb-1.5">
                        Lubumbashi Spotlight
                      </span>
                      <h4 className="font-serif text-sm font-bold leading-snug">
                        {selectedDepartment.promoBanner.title}
                      </h4>
                      <p className="text-[11px] text-neutral-200 mt-0.5">
                        {selectedDepartment.promoBanner.subtitle}
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
