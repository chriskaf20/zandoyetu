import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CategoryService, StructuredDepartment } from '@/lib/services/CategoryService';

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

/** Univers et sous-catégories (Mega Menu, page Catégories) issus de la table categories */
export function useStructuredTaxonomy(): StructuredDepartment[] {
  const { data } = useCategories();
  return useMemo(() => CategoryService.buildStructuredTaxonomy(data || []), [data]);
}
