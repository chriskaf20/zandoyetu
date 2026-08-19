'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useWishlistStore } from '@/lib/stores/useWishlistStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cartCount = useCartStore((s) => s.getItemCount());
  const setCartDrawerOpen = useCartStore((s) => s.setCartDrawerOpen);
  const favoriteCount = useWishlistStore((s) => s.favoriteProductIds.length);
  const user = useAuthStore((s) => s.user);
  const { t } = useLanguageStore();

  const isWishlist = searchParams?.get('wishlist') === 'true';
  const isCategories = searchParams?.get('category') === 'all';

  const items = [
    { 
      id: 'home', 
      href: '/', 
      label: t('navHome'), 
      icon: Home, 
      isActive: pathname === '/' && !isWishlist && !isCategories 
    },
    { 
      id: 'categories', 
      href: '/categories', 
      label: t('categories'), 
      icon: Grid, 
      isActive: pathname === '/categories' 
    },
    { 
      id: 'wishlist', 
      href: '/?wishlist=true', 
      label: t('wishlistTitle') || 'Favoris', 
      icon: Heart, 
      badge: favoriteCount,
      isActive: isWishlist 
    },
    { 
      id: 'cart', 
      href: '#cart', 
      label: t('navCart'), 
      icon: ShoppingBag, 
      badge: cartCount, 
      isDrawer: true 
    },
    { 
      id: 'profile', 
      href: user ? '/profile' : '/login', 
      label: t('navProfile'), 
      icon: User, 
      isActive: pathname === '/profile' || pathname === '/login' 
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border px-2 py-1 flex items-center justify-around shadow-2xl safe-area-inset-bottom">
      {items.map((item) => {
        const Icon = item.icon;

        if (item.isDrawer) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative min-w-[56px] min-h-[48px] flex flex-col items-center justify-center gap-1 text-brand-black active:scale-95 transition"
              aria-label="Ouvrir le panier"
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-brand-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`min-w-[56px] min-h-[48px] flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
              item.isActive
                ? 'text-brand-black font-bold'
                : 'text-neutral-500 hover:text-brand-black'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${item.id === 'wishlist' && item.badge ? 'text-brand-red fill-current' : ''}`} />
              {item.badge != null && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-brand-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight truncate max-w-[60px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  return (
    <Suspense fallback={null}>
      <MobileNavContent />
    </Suspense>
  );
}
