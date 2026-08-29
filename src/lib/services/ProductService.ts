import { supabase } from '@/lib/supabase/client';
import { Product } from '@/types/schema';

export class ProductService {
  static mapRowToProduct(row: any): Product {
    let images: string[] = [];
    if (Array.isArray(row.images_urls)) {
      images = row.images_urls;
    } else if (typeof row.images_urls === 'string') {
      try {
        images = JSON.parse(row.images_urls);
      } catch {
        images = [row.images_urls];
      }
    }

    let colors: string[] = [];
    if (Array.isArray(row.colors_json)) {
      colors = row.colors_json;
    } else if (typeof row.colors_json === 'string') {
      try {
        colors = JSON.parse(row.colors_json);
      } catch {
        colors = [];
      }
    }

    return {
      id: row.id,
      vendor_id: row.vendor_id,
      title: row.title,
      description: row.description,
      title_en: row.title_en,
      title_fr: row.title_fr,
      title_sw: row.title_sw,
      desc_en: row.desc_en,
      desc_fr: row.desc_fr,
      desc_sw: row.desc_sw,
      category: row.category,
      delivery_time: row.delivery_time,
      delivery_fee_usd: row.delivery_fee_usd != null ? Number(row.delivery_fee_usd) : null,
      delivery_fee_cdf: row.delivery_fee_cdf != null ? Number(row.delivery_fee_cdf) : null,
      has_free_return: row.has_free_return ?? 1,
      sizes_json: row.sizes_json ? (typeof row.sizes_json === 'string' ? row.sizes_json : JSON.stringify(row.sizes_json)) : null,
      colors_json: colors,
      material_info: row.material_info,
      security_specs: row.security_specs,
      price_usd: Number(row.price_usd) || 0,
      price_cdf: Number(row.price_cdf) || 0,
      stock_count: Number(row.stock_count) || 0,
      images_urls: images,
      target_gender: (row.target_gender as 'men' | 'women' | 'mixte') || 'mixte',
      status: (row.status as 'active' | 'suspended' | 'archived') || 'active',
      is_trending: !!row.is_trending,
      compare_at_price: row.compare_at_price != null ? Number(row.compare_at_price) : null,
      local_updated_at: row.local_updated_at,
      stores: row.stores ? {
        id: row.stores.id,
        store_name: row.stores.store_name,
        store_logo_url: row.stores.store_logo_url,
        city: row.stores.city,
        phone: row.stores.users?.phone || null,
      } : row.users ? {
        id: row.users.id,
        store_name: row.users.full_name || 'Boutique Zando',
        store_logo_url: null,
        city: 'Lubumbashi',
        phone: row.users.phone || null,
      } : undefined,
    };
  }

  static async getAll(options?: {
    category?: string;
    gender?: 'men' | 'women' | 'mixte' | 'all';
    search?: string;
    trendingOnly?: boolean;
    limit?: number;
  }): Promise<Product[]> {
    let query: any = supabase
      .from('products')
      .select('*, users:vendor_id(id, full_name, phone)')
      .eq('status', 'active');

    if (options?.category && options.category !== 'all') {
      const cat = options.category.toLowerCase().trim();
      if (cat === 'robes') {
        query = query.or(`category.ilike.%robe%,category.ilike.%dress%,title.ilike.%robe%,description.ilike.%robe%`);
      } else if (cat === 'chaussures' || cat === 'shoes') {
        query = query.or(`category.ilike.%chaussure%,category.ilike.%shoe%,category.ilike.%sneaker%,category.ilike.%mocassin%,category.ilike.%sandale%,title.ilike.%mocassin%,title.ilike.%chaussure%`);
      } else if (cat === 'accessoires' || cat === 'sacs') {
        query = query.or(`category.ilike.%sac%,category.ilike.%accessoire%,category.ilike.%bag%,category.ilike.%bijoux%`);
      } else if (cat === 'femmes' || cat === 'femme') {
        query = query.or(`target_gender.eq.women,target_gender.eq.mixte`);
      } else if (cat === 'hommes' || cat === 'homme') {
        query = query.or(`target_gender.eq.men,target_gender.eq.mixte`);
      } else if (cat === 'tendances') {
        query = query.eq('is_trending', true);
      } else {
        query = query.or(`category.ilike.%${cat}%,title.ilike.%${cat}%`);
      }
    }

    if (options?.gender && options.gender !== 'all') {
      query = query.or(`target_gender.eq.${options.gender},target_gender.eq.mixte`);
    }

    if (options?.trendingOnly) {
      query = query.eq('is_trending', true);
    }

    if (options?.search && options.search.trim()) {
      const s = `%${options.search.trim()}%`;
      query = query.or(`title.ilike.${s},description.ilike.${s},title_fr.ilike.${s},title_en.ilike.${s},title_sw.ilike.${s}`);
    }

    query = query.order('local_updated_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[ProductService] Error fetching products:', error);
      return [];
    }

    return (data || []).map(this.mapRowToProduct);
  }

  static async getById(id: string): Promise<Product | null> {
    const { data, error } = await (supabase
      .from('products')
      .select('*, users:vendor_id(id, full_name, phone)')
      .eq('id', id)
      .maybeSingle() as any);

    if (error) {
      console.error('[ProductService] Error fetching product by id:', error);
      return null;
    }
    if (!data) return null;

    return this.mapRowToProduct(data);
  }

  static async getByVendor(vendorId: string): Promise<Product[]> {
    const { data, error } = await (supabase
      .from('products')
      .select('*, users:vendor_id(id, full_name, phone)')
      .eq('vendor_id', vendorId)
      .eq('status', 'active')
      .order('local_updated_at', { ascending: false }) as any);

    if (error) {
      console.error('[ProductService] Error fetching vendor products:', error);
      return [];
    }

    return (data || []).map(this.mapRowToProduct);
  }

  /**
   * Strictly fetch trending products (is_trending = true AND status = 'active').
   * Returns an empty array if none are marked trending.
   */
  static async getTrendingProducts(limit = 10): Promise<Product[]> {
    const { data, error } = await (supabase
      .from('products')
      .select('*, users:vendor_id(id, full_name, phone)')
      .eq('status', 'active')
      .eq('is_trending', true)
      .order('local_updated_at', { ascending: false })
      .limit(limit) as any);

    if (error) {
      console.error('[ProductService] Error fetching trending products:', error);
      return [];
    }

    return (data || []).map(this.mapRowToProduct);
  }
}
