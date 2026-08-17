import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatPriceValue } from '@/lib/utils/currency';

interface CurrencyState {
  currency: 'USD' | 'CDF';
  exchangeRate: number;
  setCurrency: (currency: 'USD' | 'CDF') => void;
  setExchangeRate: (rate: number) => void;
  formatPrice: (amountUsd: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      exchangeRate: 2300,
      setCurrency: (currency) => set({ currency }),
      setExchangeRate: (exchangeRate) => set({ exchangeRate }),
      formatPrice: (amountUsd) => {
        const { currency, exchangeRate } = get();
        return formatPriceValue(amountUsd, currency, exchangeRate);
      },
    }),
    {
      name: 'zando-currency-storage',
    }
  )
);
