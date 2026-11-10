'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { landmarksForCommune } from '@/lib/utils/lubumbashiRegions';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { DeliveryZone } from '@/lib/services/DeliveryZoneService';

interface AddressFormProps {
  zones: DeliveryZone[];
  zoneId: string;
  onZoneChange: (zone: DeliveryZone | null) => void;
  landmark: string;
  onLandmarkChange: (landmark: string) => void;
  address: string;
  onAddressChange: (address: string) => void;
  mapsLink: string;
  onMapsLinkChange: (mapsLink: string) => void;
}

export function AddressForm({
  zones,
  zoneId,
  onZoneChange,
  landmark,
  onLandmarkChange,
  address,
  onAddressChange,
  mapsLink,
  onMapsLinkChange,
}: AddressFormProps) {
  const { t } = useLanguageStore();
  const { formatPrice } = useCurrencyStore();
  const currentZone = zones.find((z) => z.id === zoneId) || null;
  const landmarks = currentZone ? landmarksForCommune(currentZone.commune) : [];
  const cities = Array.from(new Set(zones.map((z) => z.city)));

  const zoneLabel = (z: DeliveryZone) => {
    const fee = Number(z.fee_usd) === 0 ? 'livraison offerte' : formatPrice(Number(z.fee_usd));
    return `${z.commune} — ${fee}${z.eta_label ? ` · ${z.eta_label}` : ''}`;
  };

  return (
    <div className="p-5 bg-white border border-brand-border rounded space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
        <MapPin className="w-4 h-4 text-brand-black" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">
          {t('addressFormTitle')}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Commune (zone de livraison) */}
        <div>
          <label htmlFor="delivery-zone" className="block text-[11px] font-semibold text-brand-black uppercase tracking-wider mb-1">
            {t('communeLabel')} *
          </label>
          <select
            id="delivery-zone"
            value={zoneId}
            onChange={(e) => {
              onZoneChange(zones.find((z) => z.id === e.target.value) || null);
              onLandmarkChange('');
            }}
            className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none cursor-pointer"
            required
          >
            <option value="">{t('communePlaceholder')}</option>
            {cities.map((city) => (
              <optgroup key={city} label={city}>
                {zones
                  .filter((z) => z.city === city)
                  .map((z) => (
                    <option key={z.id} value={z.id}>
                      {zoneLabel(z)}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {currentZone?.free_delivery_threshold_usd != null && (
            <p className="text-[10px] text-brand-gray mt-1">
              Livraison offerte dès {formatPrice(currentZone.free_delivery_threshold_usd)} d&apos;achats.
            </p>
          )}
        </div>

        {/* Landmark */}
        <div>
          <label htmlFor="delivery-landmark" className="block text-[11px] font-semibold text-brand-black uppercase tracking-wider mb-1">
            {t('landmarkLabel')} *
          </label>
          {landmarks.length > 0 ? (
            <select
              id="delivery-landmark"
              value={landmark}
              onChange={(e) => onLandmarkChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none cursor-pointer"
              required
            >
              <option value="">{t('landmarkPlaceholder')}</option>
              {landmarks.map((lm) => (
                <option key={lm} value={lm}>
                  {lm}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="delivery-landmark"
              type="text"
              value={landmark}
              onChange={(e) => onLandmarkChange(e.target.value)}
              placeholder={t('landmarkInputPlaceholder')}
              className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
              required
            />
          )}
        </div>
      </div>

      {/* Specific House/Street */}
      <div>
        <label htmlFor="delivery-address" className="block text-[11px] font-semibold text-brand-black uppercase tracking-wider mb-1">
          {t('streetLabel')} *
        </label>
        <input
          id="delivery-address"
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t('streetPlaceholder')}
          className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
          required
        />
      </div>

      {/* Google Maps link */}
      <div>
        <label htmlFor="delivery-maps" className="block text-[11px] font-semibold text-brand-gray uppercase tracking-wider mb-1 flex items-center gap-1">
          <Navigation className="w-3 h-3" /> {t('mapsLinkLabel')}
        </label>
        <input
          id="delivery-maps"
          type="url"
          value={mapsLink}
          onChange={(e) => onMapsLinkChange(e.target.value)}
          placeholder={t('mapsLinkPlaceholder')}
          className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none"
        />
      </div>
    </div>
  );
}
