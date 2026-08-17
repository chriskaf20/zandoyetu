import { useQuery } from '@tanstack/react-query';
import { ProductService } from '@/lib/services/ProductService';

export function useProducts(options?: {
  category?: string;
  gender?: 'men' | 'women' | 'mixte' | 'all';
  search?: string;
  trendingOnly?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: () => ProductService.getAll(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => ProductService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVendorProducts(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: () => ProductService.getByVendor(vendorId),
    enabled: !!vendorId,
  });
}
