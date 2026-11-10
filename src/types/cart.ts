import { Product, MobileMoneyProvider } from './schema';

export interface CartFlashPrice {
  flash_sale_id: string;
  price_usd: number;
  end_time: string;
}

export interface CartItem {
  id: string; // unique item key e.g. productId-size-color
  product: Product;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
  /** Prix flash connu à l'ajout ; le prix facturé est recalculé par rpc_process_checkout */
  flash?: CartFlashPrice | null;
}

export interface DeliveryAddressDetails {
  commune: string;
  landmark: string;
  address: string;
  mapsLink?: string;
}

export type CheckoutPaymentMethod = 'Cash on Delivery' | 'In-Store Pickup' | 'Mobile Money';

export interface MobileMoneyDetails {
  provider: MobileMoneyProvider;
  phone: string;
  reference: string;
  fulfillment: 'delivery' | 'pickup';
}

export interface CheckoutPayload {
  items: Array<{
    product_id: string;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  delivery_address: {
    address: string | null;
    commune: string | null;
    nearest_landmark: string | null;
    zone_id?: string | null;
    maps_link?: string | null;
  };
  payment_method: CheckoutPaymentMethod;
  promo_code?: string | null;
  points_redeemed?: number;
  payment_details?: MobileMoneyDetails | null;
}

export interface CheckoutResult {
  success: boolean;
  orderIds: string[];
  checkoutGroupId?: string;
  totalUsd?: number;
  totalCdf?: number;
  deliveryFeeUsd?: number;
  paymentStatus?: string;
  message: string;
}
