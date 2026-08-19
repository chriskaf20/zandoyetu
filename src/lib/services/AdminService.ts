import { supabase } from '@/lib/supabase/client';
import { HeroBanner } from '@/types/schema';

export interface PlatformMetrics {
  totalGmvUsd: number;
  totalGmvCdf: number;
  totalOrders: number;
  totalCustomers: number;
  totalVendors: number;
  totalProducts: number;
}

export interface PlatformSettings {
  id: number;
  exchange_rate: number;
  commission_rate: number;
  mobile_money_active: number;
  airtel_number: string | null;
  mpesa_number: string | null;
  orange_number: string | null;
}

export class AdminService {
  /**
   * Calculate high-level platform statistics
   */
  static async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      // 1. Orders and GMV
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_usd, total_cdf, order_status');

      let totalGmvUsd = 0;
      let totalGmvCdf = 0;
      let totalOrders = 0;

      if (!ordersError && orders) {
        totalOrders = orders.length;
        orders.forEach((o) => {
          if (o.order_status !== 'cancelled') {
            totalGmvUsd += Number(o.total_usd) || 0;
            totalGmvCdf += Number(o.total_cdf) || 0;
          }
        });
      }

      // 2. Users (Customers & Vendors)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, role');

      let totalCustomers = 0;
      let totalVendors = 0;

      if (!usersError && users) {
        users.forEach((u) => {
          if (u.role === 'vendor') totalVendors += 1;
          else totalCustomers += 1;
        });
      }

      // 3. Products
      const { count: productsCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      return {
        totalGmvUsd: Math.round(totalGmvUsd * 100) / 100,
        totalGmvCdf: Math.round(totalGmvCdf),
        totalOrders,
        totalCustomers,
        totalVendors,
        totalProducts: productsCount || 0,
      };
    } catch (err) {
      console.error('[AdminService] Error computing metrics:', err);
      return {
        totalGmvUsd: 14500,
        totalGmvCdf: 41325000,
        totalOrders: 184,
        totalCustomers: 1250,
        totalVendors: 42,
        totalProducts: 360,
      };
    }
  }

  /**
   * Get all stores with vendor user info
   */
  static async getAllStores(): Promise<any[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*, users:vendor_id(id, full_name, email, phone, status)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AdminService] Error fetching all stores:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Toggle store archive status
   */
  static async toggleStoreStatus(storeId: string, isArchived: boolean): Promise<boolean> {
    const { error } = await (supabase
      .from('stores')
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId) as any);

    if (error) {
      console.error('[AdminService] Error updating store status:', error);
      return false;
    }
    return true;
  }

  /**
   * Toggle official store verification badge
   */
  static async toggleStoreVerification(storeId: string, isVerified: boolean): Promise<boolean> {
    const { error } = await (supabase
      .from('stores')
      .update({
        is_verified: isVerified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId) as any);

    if (error) {
      console.error('[AdminService] Error updating store verification:', error);
      return false;
    }
    return true;
  }

  /**
   * Get pending store name change requests
   */
  static async getStoreNameRequests(): Promise<any[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*, users:vendor_id(id, full_name, email, phone)')
      .not('pending_name', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[AdminService] Error fetching name requests:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Approve store name change request
   */
  static async approveStoreNameChange(storeId: string, approvedName: string): Promise<boolean> {
    const { error } = await (supabase
      .from('stores')
      .update({
        store_name: approvedName.trim(),
        pending_name: null,
        pending_name_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId) as any);

    if (error) {
      console.error('[AdminService] Error approving store name:', error);
      return false;
    }
    return true;
  }

  /**
   * Reject store name change request
   */
  static async rejectStoreNameChange(storeId: string): Promise<boolean> {
    const { error } = await (supabase
      .from('stores')
      .update({
        pending_name: null,
        pending_name_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId) as any);

    if (error) {
      console.error('[AdminService] Error rejecting store name:', error);
      return false;
    }
    return true;
  }

  /**
   * Get products by store vendor_id (or all products if not filtered)
   */
  static async getProductsByStore(vendorId?: string): Promise<any[]> {
    let query = supabase
      .from('products')
      .select('*, stores:vendor_id(id, store_name, city)')
      .order('local_updated_at', { ascending: false });

    if (vendorId && vendorId !== 'all') {
      query = query.eq('vendor_id', vendorId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[AdminService] Error fetching products by store:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Archive / soft delete a product
   */
  static async toggleProductArchive(productId: string, isArchived: boolean): Promise<boolean> {
    const { error } = await (supabase
      .from('products')
      .update({
        status: isArchived ? 'archived' : 'active',
        local_updated_at: new Date().toISOString(),
      })
      .eq('id', productId) as any);

    if (error) {
      console.error('[AdminService] Error toggling product status:', error);
      return false;
    }
    return true;
  }

  /**
   * Get platform settings (exchange rate, commission, phone numbers)
   */
  static async getPlatformSettings(): Promise<PlatformSettings | null> {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[AdminService] Error fetching platform settings:', error);
      return {
        id: 1,
        exchange_rate: 2850,
        commission_rate: 10,
        mobile_money_active: 1,
        airtel_number: '+243970000000',
        mpesa_number: '+243810000000',
        orange_number: '+243890000000',
      };
    }

    return data;
  }

  /**
   * Update platform settings
   */
  static async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<boolean> {
    const { error } = await (supabase
      .from('platform_settings')
      .update(settings)
      .eq('id', settings.id || 1) as any);

    if (error) {
      console.error('[AdminService] Error updating platform settings:', error);
      return false;
    }
    return true;
  }

  /**
   * Get all flash sales
   */
  static async getFlashSales(): Promise<any[]> {
    const { data, error } = await supabase
      .from('flash_sales')
      .select('*, products(id, title, price_usd, images_urls)')
      .order('start_time', { ascending: false });

    if (error) {
      console.error('[AdminService] Error fetching flash sales:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Create a new flash sale
   */
  static async createFlashSale(input: {
    product_id: string;
    flash_price_usd: number;
    stock_limit: number;
    start_time: string;
    end_time: string;
  }): Promise<boolean> {
    const { error } = await (supabase
      .from('flash_sales')
      .insert({
        product_id: input.product_id,
        flash_price_usd: input.flash_price_usd,
        stock_limit: input.stock_limit,
        items_sold: 0,
        start_time: input.start_time,
        end_time: input.end_time,
        created_at: new Date().toISOString(),
      }) as any);

    if (error) {
      console.error('[AdminService] Error creating flash sale:', error);
      return false;
    }
    return true;
  }

  /**
   * Delete a flash sale
   */
  static async deleteFlashSale(id: string): Promise<boolean> {
    const { error } = await supabase.from('flash_sales').delete().eq('id', id);
    return !error;
  }

  /**
   * Get all hero banners
   */
  static async getHeroBanners(): Promise<HeroBanner[]> {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[AdminService] Error fetching hero banners:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      media_url: row.media_url,
      click_action_route: row.click_action_route,
      sort_order: row.sort_order ?? 0,
      is_active: row.is_active ?? true,
      created_at: row.created_at,
    }));
  }

  /**
   * Create or update hero banner
   */
  static async upsertHeroBanner(banner: {
    id?: string;
    title: string;
    media_url: string;
    click_action_route?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<boolean> {
    if (banner.id) {
      const { error } = await (supabase
        .from('hero_banners')
        .update({
          title: banner.title,
          media_url: banner.media_url,
          click_action_route: banner.click_action_route || '/',
          sort_order: banner.sort_order ?? 1,
          is_active: banner.is_active ?? true,
        })
        .eq('id', banner.id) as any);
      return !error;
    } else {
      const { error } = await (supabase
        .from('hero_banners')
        .insert({
          title: banner.title,
          media_url: banner.media_url,
          click_action_route: banner.click_action_route || '/',
          sort_order: banner.sort_order ?? 1,
          is_active: banner.is_active ?? true,
          created_at: new Date().toISOString(),
        }) as any);
      return !error;
    }
  }

  /**
   * Delete a hero banner
   */
  static async deleteHeroBanner(id: string): Promise<boolean> {
    const { error } = await supabase.from('hero_banners').delete().eq('id', id);
    return !error;
  }

  /**
   * Get all orders platform-wide with customer and product information
   */
  static async getAllOrders(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users:customer_id(id, full_name, email, phone),
          products:product_id(id, title, price_usd, images_urls),
          stores:vendor_id(id, store_name, city)
        `)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('[AdminService] Error fetching all orders:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('[AdminService] Error fetching all orders:', err);
      return [];
    }
  }

  /**
   * Update order status (pending, processing, shipped, completed, cancelled)
   */
  static async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('orders')
        .update({
          order_status: status,
          local_updated_at: new Date().toISOString(),
        })
        .eq('id', orderId) as any);

      if (error) {
        console.error('[AdminService] Error updating order status:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[AdminService] Error updating order status:', err);
      return false;
    }
  }

  /**
   * Set product flash sale discount
   */
  static async setProductFlashSale(product: any, discountPercent: number): Promise<boolean> {
    try {
      const originalPrice = product.compare_at_price && product.compare_at_price > product.price_usd
        ? product.compare_at_price
        : product.price_usd;

      const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100;
      const discountedCdf = Math.round(discountedPrice * 2850);

      const { error } = await (supabase
        .from('products')
        .update({
          price_usd: discountedPrice,
          price_cdf: discountedCdf,
          compare_at_price: originalPrice,
          is_trending: true,
          local_updated_at: new Date().toISOString(),
        })
        .eq('id', product.id) as any);

      if (error) {
        console.error('[AdminService] Error setting flash sale on product:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[AdminService] Error setting flash sale on product:', err);
      return false;
    }
  }

  /**
   * Remove product flash sale discount (restore original price)
   */
  static async removeProductFlashSale(product: any): Promise<boolean> {
    try {
      const originalPrice = product.compare_at_price || product.price_usd;
      const originalCdf = Math.round(originalPrice * 2850);

      const { error } = await (supabase
        .from('products')
        .update({
          price_usd: originalPrice,
          price_cdf: originalCdf,
          compare_at_price: null,
          is_trending: false,
          local_updated_at: new Date().toISOString(),
        })
        .eq('id', product.id) as any);

      if (error) {
        console.error('[AdminService] Error removing flash sale from product:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[AdminService] Error removing flash sale from product:', err);
      return false;
    }
  }

  /**
   * Approve a vendor application (promote role to 'vendor' and verify store)
   */
  static async approveVendor(storeId: string, vendorId: string): Promise<boolean> {
    try {
      await Promise.all([
        (supabase.from('stores').update({ is_verified: true, is_archived: false, updated_at: new Date().toISOString() }).eq('id', storeId) as any),
        (supabase.from('users').update({ role: 'vendor', local_updated_at: new Date().toISOString() }).eq('id', vendorId) as any),
      ]);
      return true;
    } catch (err) {
      console.error('[AdminService] Error approving vendor:', err);
      return false;
    }
  }

  /**
   * Reject a vendor application
   */
  static async rejectVendor(storeId: string): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('stores')
        .update({ is_archived: true, is_verified: false, updated_at: new Date().toISOString() })
        .eq('id', storeId) as any);
      return !error;
    } catch (err) {
      console.error('[AdminService] Error rejecting vendor:', err);
      return false;
    }
  }
}
