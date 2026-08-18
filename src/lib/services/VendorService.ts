import { supabase } from '@/lib/supabase/client';
import { Product, Store, Order } from '@/types/schema';
import { ProductService } from './ProductService';

export interface CreateProductInput {
  title: string;
  description?: string;
  category: string;
  price_usd: number;
  price_cdf?: number;
  compare_at_price?: number;
  stock_count: number;
  target_gender: 'women' | 'men' | 'mixte';
  images_urls: string[];
  sizes: string[];
  colors: string[];
}

export class VendorService {
  /**
   * Get store profile for a vendor
   */
  static async getStoreByVendor(vendorId: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('vendor_id', vendorId)
      .maybeSingle();

    if (error) {
      console.error('[VendorService] Error getting store:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      vendor_id: data.vendor_id,
      store_name: data.store_name,
      description: data.description,
      store_logo_url: data.store_logo_url,
      city: data.city,
      momo_enabled: data.momo_enabled,
      is_archived: data.is_archived,
      is_verified: !!data.is_verified,
      pending_name: data.pending_name || null,
      pending_name_reason: data.pending_name_reason || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Submit store name change request for admin approval
   */
  static async requestStoreNameChange(
    storeId: string,
    proposedName: string,
    reason?: string
  ): Promise<boolean> {
    const { error } = await (supabase
      .from('stores')
      .update({
        pending_name: proposedName.trim(),
        pending_name_reason: reason?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId) as any);

    if (error) {
      console.error('[VendorService] Error requesting store name change:', error);
      throw error;
    }
    return true;
  }

  /**
   * Archive / soft delete product
   */
  static async archiveProduct(productId: string): Promise<boolean> {
    const { error } = await (supabase
      .from('products')
      .update({
        status: 'archived',
        local_updated_at: new Date().toISOString(),
      })
      .eq('id', productId) as any);

    if (error) {
      console.error('[VendorService] Error archiving product:', error);
      throw error;
    }
    return true;
  }

  /**
   * Upsert or update store profile
   */
  static async updateStore(
    vendorId: string,
    updates: {
      store_name: string;
      description?: string;
      city?: string;
      store_logo_url?: string;
      momo_enabled?: boolean;
    }
  ): Promise<Store | null> {
    const now = new Date().toISOString();
    const existing = await this.getStoreByVendor(vendorId);

    if (existing) {
      const { data, error } = await (supabase
        .from('stores')
        .update({
          store_name: updates.store_name,
          description: updates.description || null,
          city: updates.city || 'Lubumbashi',
          store_logo_url: updates.store_logo_url || null,
          momo_enabled: updates.momo_enabled ?? true,
          updated_at: now,
        })
        .eq('vendor_id', vendorId)
        .select('*')
        .single() as any);

      if (error) {
        console.error('[VendorService] Error updating store:', error);
        throw error;
      }
      return data;
    } else {
      const { data, error } = await (supabase
        .from('stores')
        .insert({
          vendor_id: vendorId,
          store_name: updates.store_name,
          description: updates.description || null,
          city: updates.city || 'Lubumbashi',
          store_logo_url: updates.store_logo_url || null,
          momo_enabled: updates.momo_enabled ?? true,
          is_archived: false,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single() as any);

      if (error) {
        console.error('[VendorService] Error inserting store:', error);
        throw error;
      }
      return data;
    }
  }

  /**
   * Get all products belonging to a vendor
   */
  static async getVendorProducts(vendorId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('local_updated_at', { ascending: false });

    if (error) {
      console.error('[VendorService] Error fetching vendor products:', error);
      return [];
    }

    return (data || []).map((row) => ProductService.mapRowToProduct(row));
  }

  /**
   * Create a new product
   */
  static async createProduct(vendorId: string, input: CreateProductInput): Promise<Product> {
    const now = new Date().toISOString();
    const exchangeRate = 2850;
    const priceCdf = input.price_cdf || Math.round(input.price_usd * exchangeRate);

    const { data, error } = await (supabase
      .from('products')
      .insert({
        vendor_id: vendorId,
        title: input.title,
        description: input.description || null,
        category: input.category,
        price_usd: input.price_usd,
        price_cdf: priceCdf,
        compare_at_price: input.compare_at_price || null,
        stock_count: input.stock_count,
        target_gender: input.target_gender,
        images_urls: input.images_urls,
        sizes_json: input.sizes.length > 0 ? JSON.stringify(input.sizes) : null,
        colors_json: input.colors,
        status: 'active',
        is_trending: false,
        local_updated_at: now,
      })
      .select('*')
      .single() as any);

    if (error) {
      console.error('[VendorService] Error creating product:', error);
      throw error;
    }

    return ProductService.mapRowToProduct(data);
  }

  /**
   * Update an existing product
   */
  static async updateProduct(
    productId: string,
    vendorId: string,
    input: Partial<CreateProductInput> & { status?: string; is_trending?: boolean }
  ): Promise<Product> {
    const now = new Date().toISOString();
    const updates: any = {
      local_updated_at: now,
    };

    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.category !== undefined) updates.category = input.category;
    if (input.price_usd !== undefined) {
      updates.price_usd = input.price_usd;
      updates.price_cdf = input.price_cdf || Math.round(input.price_usd * 2850);
    }
    if (input.compare_at_price !== undefined) updates.compare_at_price = input.compare_at_price;
    if (input.stock_count !== undefined) updates.stock_count = input.stock_count;
    if (input.target_gender !== undefined) updates.target_gender = input.target_gender;
    if (input.images_urls !== undefined) updates.images_urls = input.images_urls;
    if (input.sizes !== undefined) updates.sizes_json = JSON.stringify(input.sizes);
    if (input.colors !== undefined) updates.colors_json = input.colors;
    if (input.status !== undefined) updates.status = input.status;
    if (input.is_trending !== undefined) updates.is_trending = input.is_trending;

    const { data, error } = await (supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('vendor_id', vendorId)
      .select('*')
      .single() as any);

    if (error) {
      console.error('[VendorService] Error updating product:', error);
      throw error;
    }

    return ProductService.mapRowToProduct(data);
  }

  /**
   * Delete / archive a product
   */
  static async deleteProduct(productId: string, vendorId: string): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('vendor_id', vendorId);

    if (error) {
      console.error('[VendorService] Error deleting product:', error);
      return false;
    }
    return true;
  }

  /**
   * Get vendor-specific orders
   */
  static async getVendorOrders(vendorId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, products(title, images_urls, price_usd), users:customer_id(full_name, phone, email)')
      .eq('vendor_id', vendorId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[VendorService] Error fetching vendor orders:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const { error } = await (supabase
      .from('orders')
      .update({
        order_status: status,
        local_updated_at: new Date().toISOString(),
      })
      .eq('id', orderId) as any);

    if (error) {
      console.error('[VendorService] Error updating order status:', error);
      return false;
    }
    return true;
  }

  /**
   * Upload image to Supabase storage
   */
  static async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.warn('[VendorService] Storage bucket upload failed, using data URL fallback:', uploadError);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  }
}
