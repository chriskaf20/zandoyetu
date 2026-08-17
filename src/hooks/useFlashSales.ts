import { useQuery } from '@tanstack/react-query';
import { FlashSaleService } from '@/lib/services/FlashSaleService';

export function useFlashSales() {
  return useQuery({
    queryKey: ['flash-sales'],
    queryFn: () => FlashSaleService.getActive(),
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}
