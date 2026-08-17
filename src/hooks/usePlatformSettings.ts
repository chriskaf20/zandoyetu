import { useQuery } from '@tanstack/react-query';
import { PlatformSettingsService } from '@/lib/services/PlatformSettingsService';
import { useCurrencyStore } from '@/lib/stores/useCurrencyStore';
import { useEffect } from 'react';

export function usePlatformSettings() {
  const setExchangeRate = useCurrencyStore((s) => s.setExchangeRate);

  const query = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => PlatformSettingsService.getSettings(),
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    if (query.data?.exchange_rate) {
      setExchangeRate(query.data.exchange_rate);
    }
  }, [query.data, setExchangeRate]);

  return query;
}
