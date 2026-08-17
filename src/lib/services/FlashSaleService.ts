import { supabase } from '@/lib/supabase/client';
import { FlashSale } from '@/types/schema';
import { ProductService } from './ProductService';

export class FlashSaleService {
  static async getActive(): Promise<FlashSale[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('flash_sales')
      .select('*, products(*, stores(id, store_name, store_logo_url, city))')
      .lte('start_time', now)
      .gt('end_time', now)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[FlashSaleService] Error fetching active flash sales:', error);
      return [];
    }

    return (data || [])
      .filter((row: any) => (row.items_sold || 0) < (row.stock_limit || 999))
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
  }
}
