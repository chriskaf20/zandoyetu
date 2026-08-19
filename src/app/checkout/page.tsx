'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Truck, Store, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { useCheckoutMutation } from '@/hooks/useOrders';
import { AddressForm } from '@/components/cart/AddressForm';
import { PromoCodeBox } from '@/components/cart/PromoCodeBox';
import { FidelityPointsBox } from '@/components/cart/FidelityPointsBox';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    items, 
    activeCoupon, 
    pointsToRedeem, 
    deliveryType, 
    setDeliveryType,
    clearCart,
    getSubtotalUsd,
    getDeliveryFeeUsd,
    getPromoDiscountUsd,
    getPointsDiscountUsd,
    getTotalUsd,
  } = useCartStore();

  const { formatPrice } = useCurrencyStore();
  const { t } = useLanguageStore();
  const { mutateAsync: processCheckout, isPending } = useCheckoutMutation();

  // Address states
  const [commune, setCommune] = useState('');
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ orderIds: string[] } | null>(null);

  // Autofill address from user profile
  React.useEffect(() => {
    if (user?.physical_address && !address) {
      setAddress(user.physical_address);
    }
  }, [user]);

  const subtotal = getSubtotalUsd();
  const delivery = getDeliveryFeeUsd();
  const promo = getPromoDiscountUsd();
  const points = getPointsDiscountUsd();
  const total = getTotalUsd();

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

    if (deliveryType === 'Cash on Delivery') {
      if (!commune || !landmark || !address.trim()) {
        setErrorMessage(t('addressRequired'));
        return;
      }
    }

    const payload = {
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        size: item.selected_size,
        color: item.selected_color,
      })),
      delivery_address: {
        address: address.trim() || 'In-Store Pickup',
        commune: commune || null,
        nearest_landmark: landmark || null,
      },
      payment_method: deliveryType,
      promo_code: activeCoupon?.code || null,
      points_redeemed: pointsToRedeem,
    };

    try {
      const result = await processCheckout({
        customerId: user.id,
        payload,
      });

      if (result.success) {
        clearCart();
        setSuccessResult({ orderIds: result.orderIds });
      }
    } catch (err: any) {
      setErrorMessage(err.message || t('checkoutError'));
    }
  };

  if (successResult) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand-black">{t('orderSuccessTitle')}</h1>
        <p className="text-xs text-brand-gray mt-2 leading-relaxed">{t('orderSuccessMessage')}</p>

        <div className="my-6 p-4 bg-brand-lightGray rounded text-xs text-left space-y-1">
          <p className="font-bold text-brand-black">{t('orderCreatedIds')}</p>
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Delivery & Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Method Toggle */}
          <div className="p-5 bg-white border border-brand-border rounded space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">
              1. {t('deliveryMethod')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setDeliveryType('Cash on Delivery')}
                className={`p-4 rounded border flex items-start gap-3 cursor-pointer transition ${
                  deliveryType === 'Cash on Delivery'
                    ? 'border-brand-black bg-brand-lightGray/80 ring-1 ring-black'
                    : 'border-brand-border hover:border-neutral-400'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === 'Cash on Delivery'}
                  onChange={() => setDeliveryType('Cash on Delivery')}
                  className="mt-1 accent-brand-black"
                />
                <div>
                  <p className="text-xs font-bold text-brand-black">{t('cashOnDelivery')}</p>
                  <p className="text-[11px] text-brand-gray mt-0.5">{t('cashOnDeliveryDesc')}</p>
                </div>
              </label>

              <label
                onClick={() => setDeliveryType('In-Store Pickup')}
                className={`p-4 rounded border flex items-start gap-3 cursor-pointer transition ${
                  deliveryType === 'In-Store Pickup'
                    ? 'border-brand-black bg-brand-lightGray/80 ring-1 ring-black'
                    : 'border-brand-border hover:border-neutral-400'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === 'In-Store Pickup'}
                  onChange={() => setDeliveryType('In-Store Pickup')}
                  className="mt-1 accent-brand-black"
                />
                <div>
                  <p className="text-xs font-bold text-brand-black">{t('inStorePickup')}</p>
                  <p className="text-[11px] text-brand-gray mt-0.5">{t('inStorePickupDesc')}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Delivery Address Form (when Cash on Delivery is selected) */}
          {deliveryType === 'Cash on Delivery' && (
            <AddressForm
              commune={commune}
              onCommuneChange={setCommune}
              landmark={landmark}
              onLandmarkChange={setLandmark}
              address={address}
              onAddressChange={setAddress}
              mapsLink={mapsLink}
              onMapsLinkChange={setMapsLink}
            />
          )}

          {/* Promo Code & Loyalty Points — now available at checkout step */}
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
                  <span className="truncate pr-2">{item.quantity}x {item.product.title}</span>
                  <span className="font-bold text-brand-black whitespace-nowrap">
                    {formatPrice(item.product.price_usd * item.quantity)}
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
                  {delivery === 0 ? <span className="text-brand-emerald">{t('freeDelivery')}</span> : formatPrice(delivery)}
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
              <span className="text-xs uppercase font-bold text-brand-black">{t('total')}</span>
              <span className="text-lg font-bold text-brand-black">{formatPrice(total)}</span>
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
