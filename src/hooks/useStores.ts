import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StoreService } from '@/lib/services/StoreService';

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => StoreService.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: ['store', id],
    queryFn: () => StoreService.getById(id),
    enabled: !!id,
  });
}

export function useStoreFollow(userId: string | undefined, storeId: string) {
  const queryClient = useQueryClient();

  const { data: isFollowing = false, isLoading } = useQuery({
    queryKey: ['store-follow', userId, storeId],
    queryFn: () => (userId ? StoreService.isFollowing(userId, storeId) : Promise.resolve(false)),
    enabled: !!userId && !!storeId,
  });

  const mutation = useMutation({
    mutationFn: (currentlyFollowing: boolean) => {
      if (!userId) throw new Error('Veuillez vous connecter pour suivre cette boutique.');
      return StoreService.toggleFollow(userId, storeId, currentlyFollowing);
    },
    onSuccess: (newStatus) => {
      queryClient.setQueryData(['store-follow', userId, storeId], newStatus);
      queryClient.invalidateQueries({ queryKey: ['store', storeId] });
    },
  });

  return { isFollowing, isLoading, toggleFollow: mutation.mutate, isPending: mutation.isPending };
}
