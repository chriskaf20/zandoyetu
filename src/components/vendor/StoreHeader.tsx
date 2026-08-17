'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Store as StoreIcon, MapPin, Users, Heart, CheckCircle2, MessageCircle } from 'lucide-react';
import { Store } from '@/types/schema';
import { useStoreFollow } from '@/hooks/useStores';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface StoreHeaderProps {
  store: Store;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t } = useLanguageStore();
  const { isFollowing, toggleFollow, isPending } = useStoreFollow(user?.id, store.id);

  const logo = store.store_logo_url || 'https://placehold.co/200x200/png?text=' + encodeURIComponent(store.store_name);

  // Vendor WhatsApp link
  const rawPhone = store.phone || '243970000000';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const whatsappMsg = encodeURIComponent(t('whatsappStoreMsg', { name: store.store_name }));
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '243' + cleanPhone.slice(1) : cleanPhone}?text=${whatsappMsg}`;

  const handleFollowClick = () => {
    if (!user) {
      router.push(`/login?redirect=/stores/${store.id}`);
      return;
    }
    toggleFollow(isFollowing);
  };

  return (
    <div className="bg-brand-lightGray border-b border-brand-border mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Store Logo */}
          <div className="relative w-24 h-24 rounded-full border-2 border-white shadow-md overflow-hidden flex-shrink-0 bg-white">
            <Image
              src={logo}
              alt={store.store_name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>

          {/* Store Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="font-serif text-2xl font-bold text-brand-black">{store.store_name}</h1>
                  <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                </div>
                {store.city && (
                  <p className="text-xs text-brand-gray flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {store.city}, Lubumbashi
                  </p>
                )}
              </div>

              {/* Action Buttons: WhatsApp & Follow */}
              <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 shadow-sm bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('whatsappStoreInquiry')}</span>
                </a>

                <button
                  type="button"
                  onClick={handleFollowClick}
                  disabled={isPending}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 shadow-sm ${
                    isFollowing
                      ? 'bg-brand-emerald text-white hover:bg-emerald-600'
                      : 'bg-brand-black text-white hover:bg-brand-charcoal'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-current' : ''}`} />
                  <span>{isFollowing ? t('unfollowStore') : t('followStore')}</span>
                </button>
              </div>
            </div>

            {store.description && (
              <p className="text-xs text-brand-gray max-w-2xl leading-relaxed mt-2">{store.description}</p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 text-xs text-brand-black font-semibold">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-gray" />
                <span>{store.follower_count || 0} {t('storeFollowers')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <StoreIcon className="w-3.5 h-3.5 text-brand-gray" />
                <span>{store.product_count || 0} {t('itemsForSale', { count: store.product_count || 0 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
