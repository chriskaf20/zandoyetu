import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '@/lib/services/CategoryService';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoryService.getAll(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['category-tree'],
    queryFn: () => CategoryService.getTree(),
    staleTime: 1000 * 60 * 10,
  });
}
