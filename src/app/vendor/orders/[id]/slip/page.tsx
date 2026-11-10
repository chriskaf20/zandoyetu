'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin, MessageCircle, Phone, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { VendorService } from '@/lib/services/VendorService';
import { DEFAULT_EXCHANGE_RATE } from '@/lib/utils/currency';
import type { Order, Store } from '@/types/schema';

type SlipLine = Order & { products?: { id: string; title: string } | null };

interface CustomerContact {
  full_name: string | null;
  phone: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: 'Paiement à la livraison (cash)',
  pay_at_store: 'Paiement au retrait en boutique',
  mobile_money: 'Mobile Money',
};

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatCdf(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FC`;
}

/** Montant unitaire d'une ligne, y compris pour les commandes antérieures au snapshot de prix */
function unitPrice(line: SlipLine) {
  if (line.unit_price_usd) return Number(line.unit_price_usd);
  const qty = line.quantity || 1;
  return (Number(line.total_usd) - Number(line.delivery_fee || 0) + Number(line.discount_amount_usd || 0)) / qty;
}

export default function PackingSlipPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const user = useAuthStore((s) => s.user);

  const [lines, setLines] = useState<SlipLine[]>([]);
  const [contact, setContact] = useState<CustomerContact | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !orderId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // RLS : un vendeur ne lit que ses propres lignes de commande
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*, products(id, title)')
          .eq('id', orderId)
          .maybeSingle();

        if (orderError) throw orderError;
        if (!order) throw new Error('Commande introuvable ou non autorisée.');

        // Toutes les lignes du même panier pour cette boutique
        let group: SlipLine[] = [order as SlipLine];
        if (order.checkout_group_id) {
          const { data: siblings } = await supabase
            .from('orders')
            .select('*, products(id, title)')
            .eq('checkout_group_id', order.checkout_group_id)
            .eq('vendor_id', order.vendor_id)
            .order('timestamp', { ascending: true });
          if (siblings && siblings.length > 0) group = siblings as SlipLine[];
        }

        const [{ data: contactRow }, vendorStore] = await Promise.all([
          supabase.from('vendor_order_contacts').select('full_name, phone').eq('order_id', orderId).maybeSingle(),
          VendorService.getStoreByVendor(order.vendor_id),
        ]);

        if (cancelled) return;
        setLines(group.map((l) => ({ ...l, products: Array.isArray(l.products) ? l.products[0] : l.products })));
        setContact(contactRow || null);
        setStore(vendorStore);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Impossible de charger la commande.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, orderId]);

  const summary = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + unitPrice(l) * (l.quantity || 1), 0);
    const discount = lines.reduce((sum, l) => sum + Number(l.discount_amount_usd || 0), 0);
    const delivery = lines.reduce((sum, l) => sum + Number(l.delivery_fee || 0), 0);
    const totalUsd = lines.reduce((sum, l) => sum + Number(l.total_usd || 0), 0);
    const totalCdf = lines.reduce(
      (sum, l) => sum + (Number(l.total_cdf) > 0 ? Number(l.total_cdf) : Number(l.total_usd) * Number(l.fx_rate || DEFAULT_EXCHANGE_RATE)),
      0
    );
    return { subtotal, discount, delivery, totalUsd, totalCdf };
  }, [lines]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-black" />
      </div>
    );
  }

  if (error || lines.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-brand-red font-semibold">{error || 'Commande introuvable.'}</p>
        <Link href="/vendor/dashboard" className="text-xs font-semibold underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const first = lines[0];
  const reference = (first.checkout_group_id || first.id).slice(0, 8).toUpperCase();
  const isPickup = first.delivery_type === 'In-Store Pickup';
  const isPrepaid = first.payment_method === 'mobile_money';
  const amountToCollectUsd = isPrepaid ? 0 : summary.totalUsd;
  const amountToCollectCdf = isPrepaid ? 0 : summary.totalCdf;
  const orderDate = new Date(first.timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

  const whatsappText = [
    `Zando Yetu — Commande ${reference}`,
    store?.store_name ? `Boutique : ${store.store_name}` : null,
    `Client : ${contact?.full_name || '—'}${contact?.phone ? ` (${contact.phone})` : ''}`,
    isPickup ? 'Retrait en boutique' : `Livraison : ${[first.commune, first.city].filter(Boolean).join(', ')}`,
    !isPickup && first.nearest_landmark ? `Repère : ${first.nearest_landmark}` : null,
    !isPickup && first.delivery_address ? `Adresse : ${first.delivery_address}` : null,
    first.maps_link ? `Carte : ${first.maps_link}` : null,
    ...lines.map((l) => `• ${l.quantity || 1} × ${l.products?.title || 'Article'}${l.selected_size ? ` (${l.selected_size})` : ''}`),
    isPrepaid
      ? 'Déjà payé par Mobile Money — rien à encaisser'
      : `À encaisser : ${formatUsd(amountToCollectUsd)} ≈ ${formatCdf(amountToCollectCdf)}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #packing-slip, #packing-slip * { visibility: visible; }
          #packing-slip { position: absolute; inset: 0 auto auto 0; width: 100%; border: none; box-shadow: none; }
          .slip-no-print { display: none !important; }
        }
      `}</style>

      <div className="slip-no-print flex flex-wrap items-center gap-2 mb-4">
        <Link
          href="/vendor/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-brand-border hover:bg-brand-lightGray"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Tableau de bord
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide rounded bg-brand-black text-white hover:bg-brand-charcoal"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimer
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Envoyer au livreur
        </a>
        {contact?.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-brand-border hover:bg-brand-lightGray"
          >
            <Phone className="w-3.5 h-3.5" /> Appeler le client
          </a>
        )}
      </div>

      <div id="packing-slip" className="bg-white border border-brand-border rounded-xl p-5 sm:p-6 text-brand-black text-xs space-y-5">
        <header className="flex items-start justify-between gap-4 pb-4 border-b border-brand-border">
          <div>
            <p className="font-serif text-lg font-bold tracking-wide">ZANDO YETU</p>
            <p className="font-semibold">{store?.store_name || 'Boutique'}</p>
            {(store?.phone || store?.city) && (
              <p className="text-brand-gray">{[store?.phone, store?.city].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gray">Bon de livraison</p>
            <p className="text-base font-black font-mono">#{reference}</p>
            <p className="text-brand-gray">{orderDate}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray mb-1">Client</p>
            <p className="font-semibold text-sm">{contact?.full_name || '—'}</p>
            {contact?.phone && <p className="font-mono">{contact.phone}</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-gray mb-1">
              {isPickup ? 'Retrait' : 'Livraison'}
            </p>
            {isPickup ? (
              <p className="font-semibold">Retrait en boutique</p>
            ) : (
              <>
                <p className="font-semibold">{[first.commune, first.city].filter(Boolean).join(', ') || '—'}</p>
                {first.nearest_landmark && <p>Repère : {first.nearest_landmark}</p>}
                {first.delivery_address && first.delivery_address !== 'Retrait en boutique' && (
                  <p className="text-brand-gray break-words">{first.delivery_address}</p>
                )}
                {first.maps_link && (
                  <a href={first.maps_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline break-all">
                    <MapPin className="w-3 h-3" /> Position GPS
                  </a>
                )}
              </>
            )}
          </div>
        </section>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-[10px] uppercase tracking-wide text-brand-gray">
              <th className="text-left py-1.5 font-bold">Article</th>
              <th className="text-center py-1.5 font-bold w-12">Qté</th>
              <th className="text-right py-1.5 font-bold w-20">P.U.</th>
              <th className="text-right py-1.5 font-bold w-20">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const unit = unitPrice(l);
              const qty = l.quantity || 1;
              const variant = [l.selected_size, l.selected_color].filter(Boolean).join(' / ');
              return (
                <tr key={l.id} className="border-b border-neutral-100 align-top">
                  <td className="py-2">
                    <p className="font-semibold">{l.products?.title || 'Article'}</p>
                    {variant && <p className="text-brand-gray">{variant}</p>}
                  </td>
                  <td className="py-2 text-center font-semibold">{qty}</td>
                  <td className="py-2 text-right">{formatUsd(unit)}</td>
                  <td className="py-2 text-right font-semibold">{formatUsd(unit * qty)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <section className="ml-auto w-full sm:w-72 space-y-1">
          <div className="flex justify-between"><span>Sous-total</span><span>{formatUsd(summary.subtotal)}</span></div>
          {summary.discount > 0 && (
            <div className="flex justify-between text-emerald-700"><span>Remises (code / points)</span><span>-{formatUsd(summary.discount)}</span></div>
          )}
          {!isPickup && (
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>{summary.delivery > 0 ? formatUsd(summary.delivery) : 'Offerte'}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-1 border-t border-brand-border">
            <span>Total commande</span><span>{formatUsd(summary.totalUsd)}</span>
          </div>
          <p className="text-[10px] text-brand-gray">{PAYMENT_LABELS[first.payment_method || ''] || first.delivery_type}</p>
        </section>

        <section className={`rounded-lg p-4 text-center border-2 ${isPrepaid ? 'border-emerald-600 bg-emerald-50' : 'border-brand-black bg-brand-offWhite'}`}>
          {isPrepaid ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest">Déjà payé par Mobile Money</p>
              <p className="text-lg font-black">Rien à encaisser</p>
              {first.payment_reference && <p className="font-mono text-[10px]">Réf. {first.payment_reference}</p>}
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest">Montant à encaisser</p>
              <p className="text-2xl font-black">{formatUsd(amountToCollectUsd)}</p>
              <p className="text-sm font-bold">≈ {formatCdf(amountToCollectCdf)}</p>
              <p className="text-[10px] text-brand-gray mt-1">
                Taux appliqué à la commande : 1 $ = {Number(first.fx_rate || DEFAULT_EXCHANGE_RATE).toLocaleString('fr-FR')} FC
              </p>
            </>
          )}
        </section>

        <footer className="grid grid-cols-2 gap-6 pt-6">
          <div className="border-t border-dashed border-neutral-400 pt-1 text-[10px] text-brand-gray">Signature du livreur</div>
          <div className="border-t border-dashed border-neutral-400 pt-1 text-[10px] text-brand-gray">Signature du client</div>
        </footer>
      </div>
    </div>
  );
}
