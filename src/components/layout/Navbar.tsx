'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Menu, 
  X, 
  Truck, 
  Heart,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useLanguageStore, Language } from '@/lib/stores/useLanguageStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useWishlistStore } from '@/lib/stores/useWishlistStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { MegaMenu } from './MegaMenu';

export function Navbar() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguageStore();
  const { currency, setCurrency } = useCurrencyStore();
  const { getItemCount, setCartDrawerOpen } = useCartStore();
  const favoriteCount = useWishlistStore((s) => s.favoriteProductIds.length);
  const { user, signOut } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cartCount = getItemCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top Announcement Bar with iOS Safe-Area Notch Padding */}
      <div 
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 6px)' }}
        className="bg-brand-black text-white text-xs pb-2 px-4 text-center font-medium tracking-wide flex items-center justify-between"
      >
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Plateforme Officielle Mode & Marketplace du Katanga</span>
        </div>

        <div className="flex items-center justify-center gap-2 mx-auto sm:mx-0">
          <Truck className="w-3.5 h-3.5 text-brand-emerald animate-pulse" />
          <span className="font-semibold">{t('freeShippingBanner')}</span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[11px]">
          <Link href="/orders" className="text-neutral-300 hover:text-white transition">
            {t('trackOrders')}
          </Link>
          <Link href="/profile" className="text-neutral-300 hover:text-white transition">
            {t('myAccount')}
          </Link>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4 sm:gap-8">
            {/* Brand Logo */}
            <Link href="/" className="flex flex-col items-start flex-shrink-0 group">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-brand-black group-hover:opacity-80 transition">
                ZANDO YETU
              </span>
              <span className="text-[9px] uppercase tracking-widest text-brand-gray font-semibold -mt-1">
                Lubumbashi High Fashion
              </span>
            </Link>

            {/* Elongated Central Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative">
              <div className="relative w-full flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-24 py-2.5 text-xs bg-brand-lightGray border border-transparent rounded-full focus:border-brand-black focus:bg-white focus:outline-none transition shadow-inner"
                />
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray" />
                <button
                  type="submit"
                  className="absolute right-1 px-4 py-1.5 bg-brand-black text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-brand-charcoal transition"
                >
                  Chercher
                </button>
              </div>
            </form>

            {/* Action Buttons, Wishlist, Cart & Switchers */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Currency Selector (USD / CDF) - Hidden on mobile, available in Mobile Menu Drawer */}
              <div className="hidden md:flex items-center text-xs font-semibold bg-brand-lightGray rounded-full p-0.5 border border-brand-border">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-0.5 rounded-full text-[11px] transition ${
                    currency === 'USD'
                      ? 'bg-white text-brand-black shadow-sm font-bold'
                      : 'text-brand-gray hover:text-brand-black'
                  }`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('CDF')}
                  className={`px-2 py-0.5 rounded-full text-[11px] transition ${
                    currency === 'CDF'
                      ? 'bg-white text-brand-black shadow-sm font-bold'
                      : 'text-brand-gray hover:text-brand-black'
                  }`}
                >
                  CDF
                </button>
              </div>

              {/* Language Selector (FR / EN / SW) - Hidden on mobile, available in Mobile Menu Drawer */}
              <div className="hidden md:flex items-center">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="text-xs font-semibold bg-brand-lightGray border border-brand-border rounded-full py-1 px-2.5 focus:outline-none cursor-pointer"
                >
                  <option value="fr">FR</option>
                  <option value="en">EN</option>
                  <option value="sw">SW</option>
                </select>
              </div>

              {/* Wishlist Favorites Button */}
              <Link
                href="/favorites"
                className="relative p-2 text-brand-black hover:opacity-75 transition hidden sm:inline-flex"
                aria-label="Wishlist"
                title={t('wishlistTitle')}
              >
                <Heart className={`w-5 h-5 ${favoriteCount > 0 ? 'text-brand-red fill-current' : ''}`} />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2 text-brand-black hover:opacity-75 transition"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Account / Profile Dropdown */}
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 p-1 text-sm font-medium hover:opacity-80 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-black text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {(user.full_name?.[0] || user.email?.[0] || 'Z').toUpperCase()}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-brand-gray hidden sm:block" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-brand-border shadow-xl rounded-xl py-1.5 z-50 animate-in fade-in">
                      <div className="px-4 py-2 border-b border-brand-border text-xs">
                        <p className="font-semibold text-brand-black truncate">{user.full_name || 'Client'}</p>
                        <p className="text-brand-gray truncate">{user.email || user.phone}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-black hover:bg-brand-lightGray transition"
                      >
                        {t('myAccount')}
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-black hover:bg-brand-lightGray transition"
                      >
                        {t('myOrders')}
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-black hover:bg-brand-lightGray transition"
                      >
                        ❤️ Mes Favoris & Boutiques
                      </Link>
                      <Link
                        href="/support"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-black hover:bg-brand-lightGray transition"
                      >
                        🎧 Centre d'Assistance & Tickets
                      </Link>

                      {/* Become a vendor link if customer */}
                      {user.role === 'customer' && (
                        <Link
                          href="/become-vendor"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition border-y border-amber-200/50"
                        >
                          ✨ Devenir Vendeur
                        </Link>
                      )}

                      {/* Vendor Portal Link */}
                      {(user.role === 'vendor' || user.role === 'admin' || user.email?.includes('admin')) && (
                        <Link
                          href="/vendor/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition border-y border-amber-200/50"
                        >
                          🏪 Espace Vendeur
                        </Link>
                      )}

                      {/* Admin Portal Link */}
                      {(user.role === 'admin' || user.email?.includes('admin')) && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition"
                        >
                          🛡️ Administration
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-brand-red hover:bg-red-50 transition flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('signOut')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold bg-brand-black text-white rounded-full hover:bg-brand-charcoal transition shadow-sm"
                >
                  <User className="w-3.5 h-3.5 mr-1" />
                  <span>{t('loginButton')}</span>
                </Link>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-brand-black"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 text-xs bg-brand-lightGray border border-transparent rounded-full focus:border-brand-black focus:bg-white focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-gray" />
            </form>
          </div>
        </div>
      </div>

      {/* Horizontal Category Mega Menu */}
      <MegaMenu />

      {/* Mobile Menu Overlay / Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-brand-border px-4 py-5 space-y-4 animate-in slide-in-from-top-2 shadow-xl">
          {/* Navigation Links */}
          <div className="space-y-2 border-b border-brand-border pb-4">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-bold text-brand-black"
            >
              {t('allProducts')}
            </Link>
            <Link
              href="/categories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-semibold text-neutral-900 hover:text-brand-black flex items-center justify-between"
            >
              <span>{t('allRayons')} (Annuaire)</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">7 Rayons</span>
            </Link>
            <Link
              href="/?gender=women"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 text-sm text-neutral-700 hover:text-brand-black"
            >
              {t('megaMenuWomen')}
            </Link>
            <Link
              href="/?gender=men"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 text-sm text-neutral-700 hover:text-brand-black"
            >
              {t('megaMenuMen')}
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 text-sm text-neutral-700 hover:text-brand-black"
            >
              {t('myOrders')}
            </Link>
            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 text-sm text-neutral-700 hover:text-brand-black"
            >
              {t('cartTitle')} ({cartCount})
            </Link>
            <Link
              href="/favorites"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 text-sm text-neutral-700 hover:text-brand-black"
            >
              {t('wishlistTitle')} ({favoriteCount})
            </Link>
            <Link
              href="/support"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 text-sm text-neutral-700 hover:text-brand-black"
            >
              🎧 Centre d'Assistance & Support
            </Link>

            {user && (user.role === 'vendor' || user.role === 'admin' || user.email?.includes('admin')) ? (
              <Link
                href="/vendor/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-amber-800 bg-amber-50 px-3 rounded"
              >
                🏪 Espace Vendeur (Créateur & Shop)
              </Link>
            ) : (
              <Link
                href="/become-vendor"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-amber-800 bg-amber-50/80 hover:bg-amber-100 px-3 rounded border border-amber-200 transition flex items-center justify-between"
              >
                <span>🏪 Devenir Vendeur (Créateur & Shop)</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">Postuler</span>
              </Link>
            )}

            {user && (user.role === 'admin' || user.email?.includes('admin')) && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-neutral-900 bg-neutral-100 px-3 rounded"
              >
                🛡️ Administration
              </Link>
            )}

            {/* Global WhatsApp Customer Support */}
            <a
              href="https://wa.me/243830634340?text=Bonjour%20Zando%20Yetu,%20j'ai%20besoin%20d'assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 px-3 rounded border border-emerald-200 transition flex items-center justify-between"
            >
              <span>💬 Service Client WhatsApp</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">+243 830 634 340</span>
            </a>
          </div>

          {/* Dedicated "Préférences & Devise" Section */}
          <div className="bg-brand-offWhite p-3.5 rounded-lg border border-brand-border space-y-3">
            <p className="text-[10px] uppercase font-bold text-brand-gray tracking-wider">
              Préférences & Devise
            </p>

            {/* Currency Selector (USD / CDF) */}
            <div>
              <label className="block text-[11px] font-semibold text-brand-black mb-1.5">
                Devise d'affichage
              </label>
              <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-md border border-brand-border">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-1.5 text-xs font-bold rounded transition ${
                    currency === 'USD'
                      ? 'bg-brand-black text-white shadow-sm'
                      : 'text-brand-gray hover:text-brand-black'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('CDF')}
                  className={`py-1.5 text-xs font-bold rounded transition ${
                    currency === 'CDF'
                      ? 'bg-brand-black text-white shadow-sm'
                      : 'text-brand-gray hover:text-brand-black'
                  }`}
                >
                  CDF (FC)
                </button>
              </div>
            </div>

            {/* Language Selector (FR / EN / SW) */}
            <div>
              <label className="block text-[11px] font-semibold text-brand-black mb-1.5">
                Langue / Lugha
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded border transition ${
                    language === 'fr'
                      ? 'bg-brand-black text-white border-brand-black shadow-sm font-bold'
                      : 'bg-white text-neutral-700 border-brand-border hover:bg-neutral-100'
                  }`}
                >
                  Français
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded border transition ${
                    language === 'en'
                      ? 'bg-brand-black text-white border-brand-black shadow-sm font-bold'
                      : 'bg-white text-neutral-700 border-brand-border hover:bg-neutral-100'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('sw')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded border transition ${
                    language === 'sw'
                      ? 'bg-brand-black text-white border-brand-black shadow-sm font-bold'
                      : 'bg-white text-neutral-700 border-brand-border hover:bg-neutral-100'
                  }`}
                >
                  Kiswahili
                </button>
              </div>
            </div>
          </div>

          {/* User Auth Action */}
          {!user ? (
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 text-xs font-bold uppercase tracking-wider bg-brand-black text-white rounded hover:bg-brand-charcoal transition"
            >
              {t('loginRegisterMobile')}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                signOut();
              }}
              className="w-full py-2 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
            >
              {t('signOut')}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
