'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, Smartphone, Banknote, Info } from 'lucide-react';
import { useCartStore, cartUnitPriceUsd } from '@/lib/stores/useCartStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { useCheckoutMutation } from '@/hooks/useOrders';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useActiveFlashMap, useFlashSales } from '@/hooks/useFlashSales';
import { AddressForm } from '@/components/cart/AddressForm';
import { PromoCodeBox } from '@/components/cart/PromoCodeBox';
import { FidelityPointsBox } from '@/components/cart/FidelityPointsBox';
import { ProductService } from '@/lib/services/ProductService';
import { CheckoutPayload, CheckoutPaymentMethod, CheckoutResult } from '@/types/cart';
import { MobileMoneyProvider } from '@/types/schema';

type PaymentChoice = 'cash' | 'mobile_money';

const MOMO_PROVIDERS: Array<{ id: MobileMoneyProvider; label: string; settingKey: 'mpesa_number' | 'airtel_number' | 'orange_number' }> = [
  { id: 'mpesa', label: 'M-Pesa', settingKey: 'mpesa_number' },
  { id: 'airtel', label: 'Airtel Money', settingKey: 'airtel_number' },
  { id: 'orange', label: 'Orange Money', settingKey: 'orange_number' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    items,
    activeCoupon,
    pointsToRedeem,
    deliveryType,
    setDeliveryType,
    deliveryZone,
    setDeliveryZone,
    clearCart,
    syncWithCatalog,
    getSubtotalUsd,
    getDeliveryFeeUsd,
    getPromoDiscountUsd,
    getPointsUsed,
    getPointsDiscountUsd,
    getTotalUsd,
  } = useCartStore();

  const { data: settings } = usePlatformSettings();
  const { data: zones = [], isLoading: zonesLoading } = useDeliveryZones();
  const activeFlash = useActiveFlashMap();
  const { isFetched: flashLoaded } = useFlashSales();
  const { formatPrice, formatPriceCDF, formatPriceUSD, currency } = useCurrencyStore();
  const { t } = useLanguageStore();
  const { mutateAsync: processCheckout, isPending } = useCheckoutMutation();

  // Address states
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [mapsLink, setMapsLink] = useState('');

  // Payment states
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('cash');
  const [momoProvider, setMomoProvider] = useState<MobileMoneyProvider>('mpesa');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoReference, setMomoReference] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<CheckoutResult | null>(null);
  const syncedRef = useRef(false);

  const momoAvailable = (settings?.mobile_money_active ?? 0) === 1;
  const isPickup = deliveryType === 'In-Store Pickup';

  // Autofill address & payer phone from user profile
  useEffect(() => {
    if (user?.physical_address && !address) setAddress(user.physical_address);
    if (user?.phone && !momoPhone) setMomoPhone(user.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Le panier conserve des instantanés : prix, stock et ventes flash sont rafraîchis
  // depuis le serveur avant paiement pour que le total affiché soit celui facturé.
  useEffect(() => {
    if (syncedRef.current || items.length === 0 || !flashLoaded) return;
    syncedRef.current = true;
    ProductService.getByIds(Array.from(new Set(items.map((i) => i.product.id)))).then((fresh) => {
      if (fresh.length === 0) return;
      const { removed, changed } = syncWithCatalog(fresh, activeFlash);
      if (removed > 0 || changed > 0) {
        setSyncNotice(
          `Votre panier a été mis à jour (${[
            removed > 0 ? `${removed} article(s) indisponible(s) retiré(s)` : '',
            changed > 0 ? `${changed} prix ou quantité ajusté(s)` : '',
          ].filter(Boolean).join(', ')}).`
        );
      }
    });
  }, [items, activeFlash, flashLoaded, syncWithCatalog]);

  // Zone mémorisée mais désactivée entre-temps
  useEffect(() => {
    if (!zonesLoading && deliveryZone && !zones.some((z) => z.id === deliveryZone.id)) {
      setDeliveryZone(null);
    }
  }, [zones, zonesLoading, deliveryZone, setDeliveryZone]);

  const subtotal = getSubtotalUsd();
  const delivery = getDeliveryFeeUsd();
  const promo = getPromoDiscountUsd();
  const points = getPointsDiscountUsd();
  const total = getTotalUsd();

  const selectedProvider = MOMO_PROVIDERS.find((p) => p.id === momoProvider)!;
  const merchantNumber = settings?.[selectedProvider.settingKey] || null;

  if (items.length === 0 && !successResult) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-black">{t('cartEmpty')}</h1>
        <Link href="/" className="mt-4 inline-block px-6 py-2.5 bg-brand-black text-white text-xs font-semibold rounded">
          {t('backToShop')}
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (!isPickup && (!deliveryZone || !landmark || !address.trim())) {
      setErrorMessage(t('addressRequired'));
      return;
    }

    if (paymentChoice === 'mobile_money' && (!momoPhone.trim() || !momoReference.trim())) {
      setErrorMessage('Indiquez le numéro qui a payé et la référence de la transaction Mobile Money.');
      return;
    }

    const paymentMethod: CheckoutPaymentMethod =
      paymentChoice === 'mobile_money' ? 'Mobile Money' : deliveryType;

    const payload: CheckoutPayload = {
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        size: item.selected_size,
        color: item.selected_color,
      })),
      delivery_address: isPickup
        ? { address: null, commune: null, nearest_landmark: null }
        : {
            address: address.trim(),
            commune: deliveryZone?.commune || null,
            zone_id: deliveryZone?.id || null,
            nearest_landmark: landmark || null,
            maps_link: mapsLink.trim() || null,
          },
      payment_method: paymentMethod,
      promo_code: activeCoupon?.code || null,
      points_redeemed: getPointsUsed(),
      payment_details:
        paymentChoice === 'mobile_money'
          ? {
              provider: momoProvider,
              phone: momoPhone.trim(),
              reference: momoReference.trim(),
              fulfillment: isPickup ? 'pickup' : 'delivery',
            }
          : null,
    };

    try {
      // L'usage du code promo est enregistré par rpc_process_checkout
      const result = await processCheckout({ customerId: user.id, payload });
      if (result.success) {
        clearCart();
        setSuccessResult(result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('checkoutError'));
    }
  };

  if (successResult) {
    const isMomo = successResult.paymentStatus === 'awaiting_admin_clearance';
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand-black">{t('orderSuccessTitle')}</h1>
        <p className="text-xs text-brand-gray mt-2 leading-relaxed">
          {isMomo ? successResult.message : t('orderSuccessMessage')}
        </p>

        <div className="my-6 p-4 bg-brand-lightGray rounded text-xs text-left space-y-1">
          {successResult.totalUsd != null && (
            <p className="flex justify-between font-bold text-brand-black">
              <span>{t('total')}</span>
              <span>
                {formatPriceUSD(successResult.totalUsd)} · {Math.round(successResult.totalCdf || 0).toLocaleString('fr-FR')} FC
              </span>
            </p>
          )}
          <p className="font-bold text-brand-black pt-2">{t('orderCreatedIds')}</p>
          {successResult.orderIds.map((id) => (
            <p key={id} className="font-mono text-neutral-600 truncate">{id}</p>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/orders"
            className="w-full sm:w-auto px-6 py-3 bg-brand-black text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-brand-charcoal transition"
          >
            {t('trackOrders')}
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-white border border-brand-border text-brand-black text-xs font-semibold uppercase tracking-wider rounded hover:bg-brand-lightGray transition"
          >
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/cart" className="inline-flex items-center gap-1 text-xs text-brand-gray hover:text-brand-black">
          <ArrowLeft className="w-4 h-4" /> {t('backToCart')}
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-black mt-2">
          {t('checkoutTitle')}
        </h1>
      </div>

      {errorMessage && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {syncNotice && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Delivery, Address & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Delivery Method Toggle */}
          <div className="p-5 bg-white border border-brand-border rounded space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">
              1. {t('deliveryMethod')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ['Cash on Delivery', 'Livraison à domicile', 'Lubumbashi et Kolwezi, frais selon la commune.'],
                ['In-Store Pickup', t('inStorePickup'), t('inStorePickupDesc')],
              ] as const).map(([value, label, desc]) => (
                <label
                  key={value}
                  className={`p-4 rounded border flex items-start gap-3 cursor-pointer transition ${
                    deliveryType === value
                      ? 'border-brand-black bg-brand-lightGray/80 ring-1 ring-black'
                      : 'border-brand-border hover:border-neutral-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={deliveryType === value}
                    onChange={() => setDeliveryType(value)}
                    className="mt-1 accent-brand-black"
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-black">{label}</p>
                    <p className="text-[11px] text-brand-gray mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Delivery Address */}
          {!isPickup && (
            <AddressForm
              zones={zones}
              zoneId={deliveryZone?.id || ''}
              onZoneChange={setDeliveryZone}
              landmark={landmark}
              onLandmarkChange={setLandmark}
              address={address}
              onAddressChange={setAddress}
              mapsLink={mapsLink}
              onMapsLinkChange={setMapsLink}
            />
          )}

          {/* 3. Payment */}
          <div className="p-5 bg-white border border-brand-border rounded space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">
              {isPickup ? '2' : '3'}. Paiement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded border flex items-start gap-3 cursor-pointer transition ${
                  paymentChoice === 'cash' ? 'border-brand-black bg-brand-lightGray/80 ring-1 ring-black' : 'border-brand-border hover:border-neutral-400'
                }`}
              >
                <input type="radio" name="paymentChoice" checked={paymentChoice === 'cash'} onChange={() => setPaymentChoice('cash')} className="mt-1 accent-brand-black" />
                <div>
                  <p className="text-xs font-bold text-brand-black flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" /> {isPickup ? 'Payer au retrait' : t('cashOnDelivery')}
                  </p>
                  <p className="text-[11px] text-brand-gray mt-0.5">En USD ou en CDF, à la remise du colis.</p>
                </div>
              </label>

              <label
                className={`p-4 rounded border flex items-start gap-3 transition ${
                  !momoAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${paymentChoice === 'mobile_money' ? 'border-brand-black bg-brand-lightGray/80 ring-1 ring-black' : 'border-brand-border hover:border-neutral-400'}`}
              >
                <input
                  type="radio"
                  name="paymentChoice"
                  disabled={!momoAvailable}
                  checked={paymentChoice === 'mobile_money'}
                  onChange={() => setPaymentChoice('mobile_money')}
                  className="mt-1 accent-brand-black"
                />
                <div>
                  <p className="text-xs font-bold text-brand-black flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Mobile Money
                  </p>
                  <p className="text-[11px] text-brand-gray mt-0.5">
                    {momoAvailable ? 'M-Pesa, Airtel Money ou Orange Money.' : 'Momentanément indisponible.'}
                  </p>
                </div>
              </label>
            </div>

            {paymentChoice === 'mobile_money' && (
              <div className="mt-2 p-4 bg-brand-offWhite border border-brand-border rounded space-y-3">
                <div className="flex flex-wrap gap-2">
                  {MOMO_PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMomoProvider(p.id)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
                        momoProvider === p.id ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-brand-black border-brand-border'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <ol className="text-[11px] text-neutral-700 space-y-1 list-decimal list-inside">
                  <li>
                    Envoyez <strong>{formatPriceUSD(total)}</strong> (≈ {formatPriceCDF(total)}) au numéro{' '}
                    <strong className="font-mono">{merchantNumber || '—'}</strong> ({selectedProvider.label}).
                  </li>
                  <li>Saisissez ci-dessous le numéro qui a payé et la référence reçue par SMS.</li>
                  <li>Votre commande est confirmée dès vérification du paiement par Zando Yetu.</li>
                </ol>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="momo-phone" className="block text-[11px] font-semibold text-brand-black uppercase tracking-wider mb-1">
                      Numéro payeur *
                    </label>
                    <input
                      id="momo-phone"
                      type="tel"
                      inputMode="tel"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="+243 8x xxx xxxx"
                      className="w-full px-3 py-2 text-xs bg-white border border-brand-border rounded focus:border-brand-black focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="momo-ref" className="block text-[11px] font-semibold text-brand-black uppercase tracking-wider mb-1">
                      Référence de transaction *
                    </label>
                    <input
                      id="momo-ref"
                      type="text"
                      value={momoReference}
                      onChange={(e) => setMomoReference(e.target.value.toUpperCase())}
                      placeholder="Ex : MP241109.1234.A56789"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-brand-border rounded focus:border-brand-black focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Promo Code & Loyalty Points */}
          <div className="space-y-4">
            <PromoCodeBox />
            <FidelityPointsBox />
          </div>

          {!user && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              {t('loginToCheckout')}{' '}
              <Link href="/login?redirect=/checkout" className="font-bold underline">
                {t('loginToCheckoutLink')}
              </Link>.
            </div>
          )}
        </div>

        {/* Right Col: Order Summary & Confirm */}
        <div className="space-y-4">
          <div className="p-6 bg-brand-offWhite border border-brand-border rounded sticky top-24">
            <h2 className="font-serif text-lg font-bold text-brand-black mb-4 pb-2 border-b border-brand-border">
              {t('orderSummaryTitle')}
            </h2>

            <div className="space-y-2.5 text-xs pb-4 border-b border-brand-border">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-neutral-600">
                  <span className="truncate pr-2">
                    {item.quantity}x {item.product.title}
                    {item.flash && <span className="ml-1 text-amber-600 font-bold">⚡</span>}
                  </span>
                  <span className="font-bold text-brand-black whitespace-nowrap">
                    {formatPrice(cartUnitPriceUsd(item) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-xs py-4 border-b border-brand-border">
              <div className="flex justify-between text-neutral-600">
                <span>{t('subtotal')}</span>
                <span className="font-bold text-brand-black">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>{t('deliveryFee')}</span>
                <span className="font-bold text-brand-black">
                  {isPickup || deliveryZone ? (
                    delivery === 0 ? <span className="text-brand-emerald">{t('freeDelivery')}</span> : formatPrice(delivery)
                  ) : (
                    <span className="text-brand-gray font-normal">Choisissez la commune</span>
                  )}
                </span>
              </div>

              {promo > 0 && (
                <div className="flex justify-between text-brand-emerald font-semibold">
                  <span>{t('promoDiscount')}</span>
                  <span>-{formatPrice(promo)}</span>
                </div>
              )}

              {points > 0 && (
                <div className="flex justify-between text-brand-emerald font-semibold">
                  <span>{t('pointsDiscount')}</span>
                  <span>-{formatPrice(points)}</span>
                </div>
              )}
            </div>

            <div className="py-4 flex justify-between items-baseline">
              <div>
                <span className="text-xs uppercase font-bold text-brand-black">{t('total')}</span>
                <span className="block text-[11px] text-neutral-500 font-medium">
                  {currency === 'USD' ? `≈ ${formatPriceCDF(total)}` : `≈ ${formatPriceUSD(total)}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-brand-black">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-brand-black text-white font-semibold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:bg-brand-charcoal transition disabled:opacity-50 shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('processing')}</span>
                </>
              ) : (
                <span>{t('completeOrder')}</span>
              )}
            </button>

            <p className="text-[10px] text-brand-gray text-center mt-3">
              {t('secureTransaction')}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
