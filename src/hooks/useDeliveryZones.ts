import { useQuery } from '@tanstack/react-query';
import { DeliveryZoneService } from '@/lib/services/DeliveryZoneService';

export function useDeliveryZones() {
  return useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => DeliveryZoneService.getActiveZones(),
    staleTime: 1000 * 60 * 30,
  });
}
