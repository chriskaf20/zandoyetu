import { supabase } from '@/lib/supabase/client';
import { Order } from '@/types/schema';
import { CheckoutPayload } from '@/types/cart';
import { ProductService } from './ProductService';

export class OrderService {
  static async processCheckout(
    customerId: string,
    payload: CheckoutPayload
  ): Promise<{ success: boolean; orderIds: string[]; message: string }> {
    const { data, error } = await (supabase.rpc as any)('rpc_process_checkout', {
      p_customer_id: customerId,
      p_items: payload.items,
      p_delivery_address: payload.delivery_address,
      p_payment_method: payload.payment_method,
      p_promo_code: payload.promo_code || null,
      p_points_redeemed: payload.points_redeemed || 0,
    });

    if (error) {
      console.error('[OrderService] Checkout RPC failed:', error);
      throw new Error(error.message || 'Le paiement a échoué.');
    }

    const result = data as any;
    if (!result?.success) {
      throw new Error(result?.message || 'Échec du traitement de la commande.');
    }

    return {
      success: true,
      orderIds: result.order_ids || [],
      message: result.message || 'Commande passée avec succès.',
    };
  }

  static async getCustomerOrders(customerId: string): Promise<Order[]> {
    const { data, error } = await (supabase
      .from('orders')
      .select('*, products(*)')
      .eq('customer_id', customerId)
      .order('timestamp', { ascending: false }) as any);

    if (error) {
      console.error('[OrderService] Error fetching customer orders:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      customer_id: row.customer_id,
      product_id: row.product_id,
      vendor_id: row.vendor_id,
      order_status: row.order_status,
      total_usd: Number(row.total_usd) || 0,
      total_cdf: Number(row.total_cdf) || 0,
      timestamp: row.timestamp,
      shipping_address: row.shipping_address,
      commune: row.commune,
      nearest_landmark: row.nearest_landmark,
      delivery_address: row.delivery_address,
      delivery_type: row.delivery_type,
      payment_reference: row.payment_reference,
      points_redeemed: Number(row.points_redeemed) || 0,
      discount_amount_usd: Number(row.discount_amount_usd) || 0,
      quantity: Number(row.quantity) || 1,
      delivery_fee: Number(row.delivery_fee) || 0,
      local_updated_at: row.local_updated_at,
      products: row.products ? ProductService.mapRowToProduct(row.products) : undefined,
    }));
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await (supabase
      .from('orders')
      .select('*, products(*)')
      .eq('id', orderId)
      .maybeSingle() as any);

    if (error || !data) return null;

    return {
      id: data.id,
      customer_id: data.customer_id,
      product_id: data.product_id,
      vendor_id: data.vendor_id,
      order_status: data.order_status,
      total_usd: Number(data.total_usd) || 0,
      total_cdf: Number(data.total_cdf) || 0,
      timestamp: data.timestamp,
      shipping_address: data.shipping_address,
      commune: data.commune,
      nearest_landmark: data.nearest_landmark,
      delivery_address: data.delivery_address,
      delivery_type: data.delivery_type,
      payment_reference: data.payment_reference,
      points_redeemed: Number(data.points_redeemed) || 0,
      discount_amount_usd: Number(data.discount_amount_usd) || 0,
      quantity: Number(data.quantity) || 1,
      delivery_fee: Number(data.delivery_fee) || 0,
      local_updated_at: data.local_updated_at,
      products: data.products ? ProductService.mapRowToProduct(data.products) : undefined,
    };
  }
}
