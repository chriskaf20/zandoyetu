'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  Store as StoreIcon, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Users,
  Sparkles
} from 'lucide-react';
import { useWishlistStore } from '@/lib/stores/useWishlistStore';
import { useProducts } from '@/hooks/useProducts';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { ProductCard } from '@/components/storefront/ProductCard';
import { supabase } from '@/lib/supabase/client';
import { Store } from '@/types/schema';

export default function FavoritesPage() {
  const { t } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const favoriteProductIds = useWishlistStore((s) => s.favoriteProductIds);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);

  const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
  const [followedStores, setFollowedStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [unfollowingStoreId, setUnfollowingStoreId] = useState<string | null>(null);

  // Fetch all products to filter favorites
  const { data: allProducts = [], isLoading: loadingProducts } = useProducts({});
  const favoriteProducts = allProducts.filter((p) => favoriteProductIds.includes(p.id));

  // Fetch followed stores for logged-in user
  const loadFollowedStores = async () => {
    if (!user?.id) return;
    setLoadingStores(true);
    try {
      const { data, error } = await supabase
        .from('store_follows')
        .select('store_id, stores(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const storesList = (data || [])
        .map((item: any) => item.stores)
        .filter(Boolean) as Store[];

      setFollowedStores(storesList);
    } catch (err) {
      console.error('Error fetching followed stores:', err);
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadFollowedStores();
    }
  }, [user?.id]);

  const handleUnfollowStore = async (storeId: string) => {
    if (!user?.id) return;
    setUnfollowingStoreId(storeId);
    try {
      const { error } = await supabase
        .from('store_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('store_id', storeId);

      if (!error) {
        setFollowedStores((prev) => prev.filter((s) => s.id !== storeId));
      }
    } catch (err) {
      console.error('Error unfollowing store:', err);
    } finally {
      setUnfollowingStoreId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-black">Mes Favoris & Suivis</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-brand-red border border-red-200">
              {favoriteProducts.length + followedStores.length} éléments
            </span>
          </div>
          <p className="text-xs text-brand-gray mt-1">
            Retrouvez tous vos coups de cœur et les boutiques officielles de Lubumbashi auxquelles vous êtes abonné.
          </p>
        </div>

        {activeTab === 'products' && favoriteProducts.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Voulez-vous vider tous vos articles favoris ?')) {
                clearWishlist();
              }
            }}
            className="px-3.5 py-1.5 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider mes favoris</span>
          </button>
        )}
      </div>

      {/* 2 Tabs Pill Switcher */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-xs ${
            activeTab === 'products'
              ? 'bg-brand-black text-white'
              : 'bg-brand-lightGray text-neutral-600 hover:text-brand-black'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${activeTab === 'products' ? 'fill-current' : ''}`} />
          <span>Articles Favoris ({favoriteProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-xs ${
            activeTab === 'stores'
              ? 'bg-brand-black text-white'
              : 'bg-brand-lightGray text-neutral-600 hover:text-brand-black'
          }`}
        >
          <StoreIcon className="w-3.5 h-3.5" />
          <span>Boutiques Suivies ({user ? followedStores.length : 0})</span>
        </button>
      </div>

      {/* TAB 1: ARTICLES FAVORIS */}
      {activeTab === 'products' && (
        <div>
          {loadingProducts ? (
            <div className="py-24 flex flex-col items-center justify-center text-brand-gray">
              <Loader2 className="w-8 h-8 animate-spin text-brand-black mb-2" />
              <p className="text-xs font-semibold">Chargement de vos favoris...</p>
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="py-20 text-center bg-brand-offWhite rounded-2xl border border-dashed border-brand-border p-6 max-w-md mx-auto">
              <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-serif text-base font-bold text-brand-black mb-1">
                Aucun article dans vos favoris
              </h3>
              <p className="text-xs text-brand-gray mb-6">
                Cliquez sur le petit cœur sur n'importe quel article de la marketplace pour le sauvegarder ici.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm"
              >
                <span>Découvrir les Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-6">
              {favoriteProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOUTIQUES SUIVIES */}
      {activeTab === 'stores' && (
        <div>
          {!user ? (
            <div className="py-16 text-center bg-brand-offWhite rounded-2xl border border-dashed border-brand-border p-6 max-w-md mx-auto">
              <StoreIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-serif text-base font-bold text-brand-black mb-1">
                Connectez-vous pour voir vos boutiques
              </h3>
              <p className="text-xs text-brand-gray mb-6">
                Enregistrez vos créateurs et magasins favoris pour être notifié de leurs nouveaux arrivages.
              </p>
              <Link
                href="/login?redirect=/favorites"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm"
              >
                <span>Se Connecter</span>
              </Link>
            </div>
          ) : loadingStores ? (
            <div className="py-24 flex flex-col items-center justify-center text-brand-gray">
              <Loader2 className="w-8 h-8 animate-spin text-brand-black mb-2" />
              <p className="text-xs font-semibold">Chargement de vos boutiques suivies...</p>
            </div>
          ) : followedStores.length === 0 ? (
            <div className="py-20 text-center bg-brand-offWhite rounded-2xl border border-dashed border-brand-border p-6 max-w-md mx-auto">
              <StoreIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-serif text-base font-bold text-brand-black mb-1">
                Aucune boutique suivie pour le moment
              </h3>
              <p className="text-xs text-brand-gray mb-6">
                Visitez les pages des boutiques partenaires et cliquez sur "Suivre la boutique" pour ne rien manquer.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm"
              >
                <span>Explorer les Boutiques</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {followedStores.map((store) => {
                const logo = store.store_logo_url || 'https://placehold.co/200x200/png?text=' + encodeURIComponent(store.store_name);
                return (
                  <div
                    key={store.id}
                    className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-lightGray border border-brand-border flex-shrink-0">
                        <Image
                          src={logo}
                          alt={store.store_name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-brand-black truncate uppercase">
                            {store.store_name}
                          </h4>
                          {store.is_verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-brand-gray flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{store.city || 'Lubumbashi'}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-600 font-medium">
                          <span>{store.product_count || 0} Articles</span>
                          <span>•</span>
                          <span>{store.follower_count || 0} Abonnés</span>
                        </div>
                      </div>
                    </div>

                    {store.description && (
                      <p className="text-xs text-brand-gray line-clamp-2 leading-relaxed">
                        {store.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t border-brand-border">
                      <Link
                        href={`/stores/${store.id}`}
                        className="flex-1 py-2 bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition text-center"
                      >
                        Visiter la Boutique
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleUnfollowStore(store.id)}
                        disabled={unfollowingStoreId === store.id}
                        className="p-2 text-neutral-400 hover:text-brand-red bg-neutral-100 hover:bg-red-50 rounded-xl transition"
                        title="Ne plus suivre"
                      >
                        {unfollowingStoreId === store.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-brand-red" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
