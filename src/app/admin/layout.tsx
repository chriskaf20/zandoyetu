'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { 
  ShieldCheck, 
  Store, 
  BarChart3, 
  Settings, 
  Flame, 
  Image as ImageIcon, 
  LogOut, 
  Home, 
  Lock,
  Loader2 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
      </div>
    );
  }

  // Check admin role
  const isAdmin = user && (user.role === 'admin' || user.email?.includes('admin'));

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 text-center text-white shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-xl font-bold mb-2">Accès Restreint</h2>
          <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
            Cet espace d'administration est strictement réservé aux gestionnaires de la plateforme Zando Yetu.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition"
            >
              Se connecter avec un compte Admin
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition"
            >
              Retourner à la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-neutral-900 border-r border-neutral-800 p-4 sm:p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-neutral-800">
            <div className="w-9 h-9 bg-amber-500 text-black rounded-lg flex items-center justify-center font-bold text-sm">
              ZY
            </div>
            <div>
              <h1 className="font-serif text-sm font-bold text-white tracking-wide">
                ZANDO YETU
              </h1>
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                <span>Administration</span>
              </div>
            </div>
          </div>

          {/* User badge */}
          <div className="my-4 p-3 bg-neutral-800/60 rounded-lg border border-neutral-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-700 text-white flex items-center justify-center font-bold text-xs">
              {user.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.full_name || 'Admin'}</p>
              <p className="text-[10px] text-neutral-400 truncate">{user.email || user.phone}</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 mt-4 text-xs font-medium">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-neutral-800 text-amber-400 font-semibold transition"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tableau de Bord & Stats</span>
            </Link>

            <Link
              href="/vendor/dashboard"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
            >
              <Store className="w-4 h-4" />
              <span>Espace Vendeur</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
            >
              <Home className="w-4 h-4" />
              <span>Voir le Storefront</span>
            </Link>
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 rounded-lg transition"
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
