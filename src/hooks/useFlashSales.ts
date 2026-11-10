import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlashSaleService } from '@/lib/services/FlashSaleService';
import { FlashSale } from '@/types/schema';

export function useFlashSales() {
  return useQuery({
    queryKey: ['flash-sales'],
    queryFn: () => FlashSaleService.getActive(),
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/** Vente flash en cours par produit : source unique pour les badges et prix flash */
export function useActiveFlashMap(): Map<string, FlashSale> {
  const { data } = useFlashSales();
  return useMemo(() => {
    const now = Date.now();
    const map = new Map<string, FlashSale>();
    (data || []).forEach((sale) => {
      if (new Date(sale.end_time).getTime() > now && !map.has(sale.product_id)) {
        map.set(sale.product_id, sale);
      }
    });
    return map;
  }, [data]);
}
