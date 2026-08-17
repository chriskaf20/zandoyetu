'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { LUBUMBASHI_REGIONS } from '@/lib/utils/lubumbashiRegions';
import { useLanguageStore } from '@/lib/stores/useLanguageStore';

interface AddressFormProps {
  commune: string;
  onCommuneChange: (commune: string) => void;
  landmark: string;
  onLandmarkChange: (landmark: string) => void;
  address: string;
  onAddressChange: (address: string) => void;
  mapsLink: string;
  onMapsLinkChange: (mapsLink: string) => void;
}

export function AddressForm({
  commune,
  onCommuneChange,
  landmark,
  onLandmarkChange,
  address,
  onAddressChange,
  mapsLink,
  onMapsLinkChange,
}: AddressFormProps) {
  const { t } = useLanguageStore();
  const currentCommuneData = LUBUMBASHI_REGIONS.find((r) => r.name === commune);

  return (
    <div className="p-5 bg-white border border-brand-border rounded space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
        <MapPin className="w-4 h-4 text-brand-black" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-black">
          {t('addressFormTitle')}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Commune */}
        <div>
          <label className="block text-[11px] font-semibold text-brand-black uppercase tracking-wider mb-1">
            {t('communeLabel')} *
          </label>
          <select
            value={commune}
            onChange={(e) => {
              onCommuneChange(e.target.value);
              onLandmarkChange('');
            }}
            className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none cursor-pointer"
            required
          >
            <option value="">{t('communePlaceholder')}</option>
            {LUBUMBASHI_REGIONS.map((reg) => (
              <option key={reg.name} value={reg.name}>
                {reg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-[11px] font-semibold text-brand-black uppercase tracking-wider mb-1">
            {t('landmarkLabel')} *
          </label>
          {currentCommuneData && currentCommuneData.landmarks.length > 0 ? (
            <select
              value={landmark}
              onChange={(e) => onLandmarkChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-brand-lightGray border border-brand-border rounded focus:border-brand-black focus:bg-white focus:outline-none cursor-pointer"
              required
            >
              <option value="">{t('landmarkPlaceholder')}</option>
              {currentCommuneData.landmarks.map((lm) => (
                <option key={lm} value={lm}>
                  {lm}
                </option>
              ))}
            </select>
          ) : (
            <input
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
        <label className="block text-[11px] font-semibold text-brand-black uppercase tracking-wider mb-1">
          {t('streetLabel')} *
        </label>
        <input
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
        <label className="block text-[11px] font-semibold text-brand-gray uppercase tracking-wider mb-1 flex items-center gap-1">
          <Navigation className="w-3 h-3" /> {t('mapsLinkLabel')}
        </label>
        <input
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
