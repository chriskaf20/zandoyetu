import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReviewService } from '@/lib/services/ReviewService';

export function useReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => ReviewService.getByProduct(productId),
    enabled: !!productId,
  });
}

export function useSubmitReviewMutation(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ReviewService.submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });
}
