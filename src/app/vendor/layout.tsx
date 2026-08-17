'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { 
  Store, 
  Package, 
  ShoppingBag, 
  LogOut, 
  Home, 
  Lock,
  Loader2,
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
      </div>
    );
  }

  // Check vendor or admin role
  const isVendorOrAdmin = user && (user.role === 'vendor' || user.role === 'admin' || user.email?.includes('admin'));

  if (!user || !isVendorOrAdmin) {
    return (
      <div className="min-h-screen bg-brand-offWhite flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-brand-border rounded-xl p-6 sm:p-8 text-center text-brand-black shadow-xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-xl font-bold mb-2">Espace Vendeurs Zando Yetu</h2>
          <p className="text-xs text-brand-gray mb-6 leading-relaxed">
            Vous devez être connecté avec un compte boutique/vendeur certifié pour accéder au gestionnaire d'articles et de commandes.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-2.5 bg-brand-black hover:bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow"
            >
              Se connecter à mon compte Vendeur
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 bg-brand-lightGray hover:bg-neutral-200 text-brand-black text-xs font-semibold rounded-lg transition"
            >
              Retourner à la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-offWhite text-brand-black flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-brand-border p-4 sm:p-6 flex flex-col justify-between flex-shrink-0 shadow-sm">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-brand-border">
            <div className="w-9 h-9 bg-brand-black text-white rounded-lg flex items-center justify-center font-bold text-sm">
              ZY
            </div>
            <div>
              <h1 className="font-serif text-sm font-bold text-brand-black tracking-wide">
                ZANDO YETU
              </h1>
              <div className="flex items-center gap-1 text-[10px] text-brand-gray font-semibold uppercase tracking-wider">
                <Store className="w-3 h-3 text-amber-500" />
                <span>Portail Vendeur</span>
              </div>
            </div>
          </div>

          {/* User badge */}
          <div className="my-4 p-3 bg-brand-lightGray rounded-lg border border-brand-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-black text-white flex items-center justify-center font-bold text-xs">
              {user.full_name?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-brand-black truncate">{user.full_name || 'Boutique'}</p>
              <p className="text-[10px] text-brand-gray truncate">{user.email || user.phone}</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 mt-4 text-xs font-medium">
            <Link
              href="/vendor/dashboard"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-black text-white font-semibold transition shadow-sm"
            >
              <Package className="w-4 h-4" />
              <span>Articles, Stock & Profil</span>
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-brand-black hover:bg-brand-lightGray transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Administration Globale</span>
              </Link>
            )}

            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-brand-gray hover:bg-brand-lightGray hover:text-brand-black transition"
            >
              <Home className="w-4 h-4" />
              <span>Voir le Storefront</span>
            </Link>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-brand-border">
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-brand-red hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
