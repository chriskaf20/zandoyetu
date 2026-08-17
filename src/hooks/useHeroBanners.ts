import { useQuery } from '@tanstack/react-query';
import { HeroBannerService } from '@/lib/services/HeroBannerService';

export function useHeroBanners() {
  return useQuery({
    queryKey: ['hero-banners'],
    queryFn: () => HeroBannerService.getActive(),
    staleTime: 1000 * 60 * 10,
  });
}
