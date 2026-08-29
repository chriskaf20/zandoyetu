import { supabase } from '@/lib/supabase/client';
import { FlashSale } from '@/types/schema';
import { ProductService } from './ProductService';

export class FlashSaleService {
  /**
   * Fetch active flash sales where start_time <= now and end_time > now
   * and items_sold < stock_limit.
   * Maps nested products using ProductService.mapRowToProduct().
   */
  static async getActive(): Promise<FlashSale[]> {
    return this.getActiveWithProducts();
  }

  /**
   * Fetch active flash sales with full mapped product data
   */
  static async getActiveWithProducts(): Promise<FlashSale[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*, products(*, users:vendor_id(id, full_name, phone))')
        .lte('start_time', now)
        .gt('end_time', now)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FlashSaleService] Error fetching active flash sales:', error);
        return [];
      }

      return (data || [])
        .filter((row: any) => row.products && (row.items_sold || 0) < (row.stock_limit || 999))
        .map((row: any) => ({
          id: row.id,
          product_id: row.product_id,
          flash_price_usd: Number(row.flash_price_usd) || 0,
          start_time: row.start_time,
          end_time: row.end_time,
          stock_limit: Number(row.stock_limit) || 0,
          items_sold: Number(row.items_sold) || 0,
          created_at: row.created_at,
          products: row.products ? ProductService.mapRowToProduct(row.products) : undefined,
        }));
    } catch (err) {
      console.error('[FlashSaleService] Unexpected error in getActiveWithProducts:', err);
      return [];
    }
  }

  /**
   * Get all flash sales (including past/upcoming) for administrative view
   */
  static async getAll(): Promise<FlashSale[]> {
    try {
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*, products(*, users:vendor_id(id, full_name, phone))')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FlashSaleService] Error fetching all flash sales:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        product_id: row.product_id,
        flash_price_usd: Number(row.flash_price_usd) || 0,
        start_time: row.start_time,
        end_time: row.end_time,
        stock_limit: Number(row.stock_limit) || 0,
        items_sold: Number(row.items_sold) || 0,
        created_at: row.created_at,
        products: row.products ? ProductService.mapRowToProduct(row.products) : undefined,
      }));
    } catch (err) {
      console.error('[FlashSaleService] Unexpected error in getAll:', err);
      return [];
    }
  }
}
