import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '@/lib/services/OrderService';
import { CheckoutPayload } from '@/types/cart';

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: () => (customerId ? OrderService.getCustomerOrders(customerId) : Promise.resolve([])),
    enabled: !!customerId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => OrderService.getOrderById(id),
    enabled: !!id,
  });
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, payload }: { customerId: string; payload: CheckoutPayload }) =>
      OrderService.processCheckout(customerId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
    },
  });
}
