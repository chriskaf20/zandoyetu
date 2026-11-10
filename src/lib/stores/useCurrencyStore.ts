import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_EXCHANGE_RATE, formatPriceValue, formatPriceCDF, formatPriceUSD } from '@/lib/utils/currency';

interface CurrencyState {
  currency: 'USD' | 'CDF';
  exchangeRate: number;
  setCurrency: (currency: 'USD' | 'CDF') => void;
  setExchangeRate: (rate: number) => void;
  formatPrice: (amountUsd: number) => string;
  formatPriceCDF: (amountUsd: number) => string;
  formatPriceUSD: (amountUsd: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      exchangeRate: DEFAULT_EXCHANGE_RATE,
      setCurrency: (currency) => set({ currency }),
      setExchangeRate: (exchangeRate) => set({ exchangeRate: exchangeRate || DEFAULT_EXCHANGE_RATE }),
      formatPrice: (amountUsd) => {
        const { currency, exchangeRate } = get();
        return formatPriceValue(amountUsd, currency, exchangeRate);
      },
      formatPriceCDF: (amountUsd) => {
        const { exchangeRate } = get();
        return formatPriceCDF(amountUsd, exchangeRate);
      },
      formatPriceUSD: (amountUsd) => {
        return formatPriceUSD(amountUsd);
      },
    }),
    {
      name: 'zando-currency-storage',
    }
  )
);
