'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Clock, MapPin, Loader2, ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useCustomerOrders } from '@/hooks/useOrders';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { OrderTrackingStepper } from '@/components/orders/OrderTrackingStepper';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const { data: orders = [], isLoading } = useCustomerOrders(user?.id);
  const { formatPrice } = useCurrencyStore();
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();

  // Real-time subscription for order status updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`orders-realtime-${user.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          // Invalidate query cache to trigger re-fetch on status change
          queryClient.invalidateQueries({ queryKey: ['customer-orders', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Package className="w-12 h-12 text-brand-border mx-auto mb-3" />
        <h1 className="font-serif text-2xl font-bold text-brand-black">{t('myOrders')}</h1>
        <p className="text-xs text-brand-gray mt-1">{t('ordersLoginPrompt')}</p>
        <Link href="/login?redirect=/orders" className="mt-6 inline-block px-6 py-2.5 bg-brand-black text-white text-xs font-semibold rounded-lg shadow">
          {t('profileLoginButton')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-4 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-black">{t('ordersTitle')}</h1>
          <p className="text-xs text-brand-gray mt-1">{t('ordersSubtitle')}</p>
        </div>

        <a
          href="https://wa.me/243830634340?text=Bonjour%20Zando%20Yetu,%20j'ai%20une%20question%20concernant%20mes%20commandes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Support WhatsApp (+243 830 634 340)</span>
        </a>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-brand-gray">
          <Loader2 className="w-8 h-8 animate-spin text-brand-black mb-2" />
          <p className="text-xs">{t('ordersLoading')}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center bg-brand-offWhite rounded-xl border border-dashed border-brand-border">
          <Package className="w-12 h-12 text-brand-border mx-auto mb-3" />
          <h2 className="font-semibold text-brand-black text-sm">{t('ordersEmpty')}</h2>
          <p className="text-xs text-brand-gray mt-1">{t('ordersEmptySubtitle')}</p>
          <Link href="/" className="mt-6 inline-block px-6 py-2.5 bg-brand-black text-white text-xs font-semibold rounded-lg shadow">
            {t('ordersExplore')}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const product = order.products;
            const img = product?.images_urls?.[0] || 'https://placehold.co/300x400/png?text=Commande';
            const orderCode = `CMD-${order.id.slice(0, 6).toUpperCase()}`;

            return (
              <div key={order.id} className="bg-white border border-brand-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-border gap-2 text-xs">
                  <div>
                    <span className="text-brand-gray">{t('orderNumber')} #</span>
                    <strong className="text-brand-black font-mono ml-1 font-bold">{orderCode}</strong>
                    <span className="text-neutral-400 ml-3">
                      {order.timestamp ? new Date(order.timestamp).toLocaleDateString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }) : 'Date récente'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {order.delivery_type || 'Cash on Delivery'}
                    </span>
                    <div className="font-bold text-sm sm:text-base text-brand-black">
                      {formatPrice(order.total_usd || 0)}
                    </div>
                  </div>
                </div>

                {/* Progress Stepper */}
                <OrderTrackingStepper status={order.order_status} />

                {/* Item Details */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-20 bg-brand-lightGray rounded-lg overflow-hidden flex-shrink-0 border border-brand-border">
                      <Image
                        src={img}
                        alt={product?.title || 'Article'}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-brand-black line-clamp-1">
                        {product?.title || 'Article commandé'}
                      </h4>
                      <p className="text-[11px] text-brand-gray mt-0.5">{t('orderQuantity')} : {order.quantity || 1}</p>
                      <p className="text-[11px] text-brand-gray flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-black flex-shrink-0" />
                        <span>{order.commune || 'Lubumbashi'} {order.nearest_landmark ? `• ${order.nearest_landmark}` : ''}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <a
                      href={`https://wa.me/243830634340?text=Bonjour%20Zando%20Yetu,%20je%20suis%20la%20commande%20${orderCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Suivi WhatsApp</span>
                    </a>

                    {product && (
                      <Link
                        href={`/products/${product.id}`}
                        className="px-4 py-2 border border-brand-border text-brand-black text-xs font-semibold rounded-lg hover:bg-brand-lightGray transition flex items-center gap-1"
                      >
                        <span>{t('orderViewItem')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
