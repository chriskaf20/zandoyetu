export type UserRole = 'customer' | 'vendor' | 'admin' | 'driver';
export type SyncState = 'synced' | 'pending_insert' | 'pending_update' | 'pending_delete';
export type OrderStatus =
  | 'pending'
  | 'pending_payment'
  | 'awaiting_admin_clearance'
  | 'approved'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type SettlementStatus = 'escrow' | 'released' | 'paid';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  physical_address: string | null;
  full_name: string;
  gender_preference: 'women' | 'men' | 'all';
  points_balance: number;
  saved_coupons_count: number;
  status: string;
  preferred_currency: 'USD' | 'CDF';
  local_updated_at?: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  title_en: string | null;
  title_fr: string | null;
  title_sw: string | null;
  desc_en: string | null;
  desc_fr: string | null;
  desc_sw: string | null;
  category: string | null;
  delivery_time: string | null;
  delivery_fee_usd: number | null;
  delivery_fee_cdf: number | null;
  has_free_return: number;
  sizes_json: string | null;
  colors_json?: string[];
  material_info: string | null;
  security_specs: string | null;
  price_usd: number;
  price_cdf: number;
  stock_count: number;
  images_urls: string[];
  target_gender: 'men' | 'women' | 'mixte';
  status: 'active' | 'suspended' | 'archived';
  is_trending: boolean;
  compare_at_price?: number | null;
  local_updated_at?: string;
  stores?: {
    id: string;
    store_name: string;
    store_logo_url: string | null;
    city: string | null;
    phone?: string | null;
  };
}

export interface Order {
  id: string;
  customer_id: string;
  product_id: string;
  vendor_id: string;
  order_status: OrderStatus;
  total_usd: number;
  total_cdf: number;
  timestamp: string;
  shipping_address: string | null;
  commune?: string | null;
  nearest_landmark?: string | null;
  delivery_address: string | null;
  delivery_type: 'Cash on Delivery' | 'In-Store Pickup';
  payment_reference: string | null;
  points_redeemed: number;
  discount_amount_usd: number;
  quantity: number;
  delivery_fee: number;
  local_updated_at?: string;
  products?: Product;
  stores?: Store;
}

export interface PlatformSettings {
  id: number;
  exchange_rate: number;
  commission_rate: number;
  mobile_money_active: number;
  mpesa_number?: string | null;
  orange_number?: string | null;
  airtel_number?: string | null;
}

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  users?: {
    full_name: string;
    email: string | null;
  };
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  store_id: string;
  status: 'pending' | 'active' | 'rejected';
  created_by: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  vendor_id: string;
  store_name: string;
  store_logo_url: string | null;
  city: string | null;
  description: string | null;
  is_archived: boolean;
  is_verified?: boolean;
  pending_name?: string | null;
  pending_name_reason?: string | null;
  created_at: string;
  updated_at: string;
  momo_enabled: boolean;
  follower_count?: number;
  product_count?: number;
  phone?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  tier: 1 | 2 | 3;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CategoryTree {
  tier1: Category[];
  tier2ByParent: Record<string, Category[]>;
  tier3ByParent: Record<string, Category[]>;
}

export interface StoreFavorite {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  media_url: string;
  click_action_route: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface FlashSale {
  id: string;
  product_id: string;
  flash_price_usd: number;
  start_time: string;
  end_time: string;
  stock_limit: number;
  items_sold: number;
  created_at: string;
  products?: Product;
}

export interface SettlementLedgerEntry {
  id: string;
  vendor_id: string;
  order_id: string;
  gross_usd: number;
  gross_cdf: number;
  commission_usd: number;
  commission_cdf: number;
  net_usd: number;
  net_cdf: number;
  status: SettlementStatus;
  created_at: string;
  updated_at: string;
}

export interface VendorDailyRevenue {
  date: string;
  dayLabel: string;
  usd: number;
  cdf: number;
}

export interface MerchantApplication {
  id: string;
  user_id: string;
  full_name: string;
  store_name: string;
  operational_city: string;
  product_focus: string;
  fulfillment_type: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface TicketThread {
  id: string;
  customer_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    email: string | null;
    phone: string | null;
    full_name: string;
  } | null;
}

export interface TicketMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message_body: string;
  created_at: string;
}
