import { Product, Coupon } from './schema';

export interface CartItem {
  id: string; // unique item key e.g. productId-size-color
  product: Product;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
}

export interface DeliveryAddressDetails {
  commune: string;
  landmark: string;
  address: string;
  mapsLink?: string;
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
  };
  payment_method: 'Cash on Delivery' | 'In-Store Pickup';
  promo_code?: string | null;
  points_redeemed?: number;
}
