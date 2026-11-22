import { supabase } from '@/lib/supabase/client';
import { withVendorEmbedFallback } from '@/lib/supabase/vendorProfiles';
import { Product } from '@/types/schema';
import { CategoryService } from './CategoryService';

export const DEFAULT_PAGE_SIZE = 48;

/** Valeur entre guillemets pour un filtre PostgREST (virgules, parenthèses, &) */
function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Terme de recherche sans caractères de syntaxe PostgREST/LIKE */
function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[%_*,()"'\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

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
        // public_vendor_profiles : full_name = nom de la boutique, store_id = lien /stores/[id]
        id: row.users.store_id || row.users.id,
        store_name: row.users.full_name || 'Boutique Zando',
        store_logo_url: row.users.store_logo_url || null,
        city: row.users.city || 'Lubumbashi',
        phone: row.users.phone || null,
        is_verified: !!row.users.is_verified,
      } : undefined,
    };
  }

  /**
   * Filtre PostgREST d'une catégorie : la catégorie et toutes ses descendantes
   * (category_id), plus le texte libre des anciens produits non rattachés.
   */
  private static async categoryFilter(slug: string): Promise<string | null> {
    const all = await CategoryService.getAll();
    const root = all.find((c) => (c.slug || '').toLowerCase() === slug);
    if (!root) return null;

    const ids = new Set<string>([root.id]);
    let frontier = [root.id];
    while (frontier.length > 0) {
      const children = all.filter((c) => c.parent_id && frontier.includes(c.parent_id)).map((c) => c.id);
      children.forEach((id) => ids.add(id));
      frontier = children;
    }

    const names = all.filter((c) => ids.has(c.id)).map((c) => c.name);
    return [
      `category_id.in.(${Array.from(ids).join(',')})`,
      ...names.map((name) => `category.ilike.${quotePostgrestValue(name)}`),
    ].join(',');
  }

  static async getAll(options?: {
    category?: string;
    gender?: 'men' | 'women' | 'mixte' | 'all';
    search?: string;
    trendingOnly?: boolean;
    limit?: number;
  }): Promise<Product[]> {
    const cat = options?.category?.toLowerCase().trim();
    const isTrendingCategory = cat === 'tendances';
    const categoryFilter = cat && cat !== 'all' && !isTrendingCategory ? await this.categoryFilter(cat) : null;
    const gender = options?.gender && ['men', 'women', 'mixte'].includes(options.gender) ? options.gender : null;
    const search = options?.search ? sanitizeSearchTerm(options.search) : '';

    if (cat && cat !== 'all' && !isTrendingCategory && !categoryFilter) {
      return []; // catégorie inconnue ou désactivée
    }

    const { data, error } = await withVendorEmbedFallback<any[]>((vendorEmbed) => {
      let query: any = supabase
        .from('products')
        .select(vendorEmbed ? `*, ${vendorEmbed}` : '*')
        .eq('status', 'active');

      if (categoryFilter) {
        query = query.or(categoryFilter);
      }

      if (gender) {
        query = query.in('target_gender', [gender, 'mixte']);
      }

      if (options?.trendingOnly || isTrendingCategory) {
        query = query.eq('is_trending', true);
      }

      if (search) {
        const s = quotePostgrestValue(`%${search}%`);
        query = query.or(`title.ilike.${s},description.ilike.${s},title_fr.ilike.${s},title_en.ilike.${s},title_sw.ilike.${s}`);
      }

      query = query.order('local_updated_at', { ascending: false }).limit(options?.limit || DEFAULT_PAGE_SIZE);

      return query;
    });

    if (error) {
      console.error('[ProductService] Error fetching products:', error);
      return [];
    }

    return (data || []).map(this.mapRowToProduct);
  }

  /** Données fraîches pour resynchroniser le panier (prix, stock, statut) */
  static async getByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const { data, error } = await withVendorEmbedFallback<any[]>((vendorEmbed) =>
      supabase
        .from('products')
        .select(vendorEmbed ? `*, ${vendorEmbed}` : '*')
        .in('id', ids) as any
    );
    if (error) {
      console.error('[ProductService] Error fetching products by ids:', error);
      return [];
    }
    return (data || []).map(this.mapRowToProduct);
  }

  static async getById(id: string): Promise<Product | null> {
    const { data, error } = await withVendorEmbedFallback<any>((vendorEmbed) =>
      supabase
        .from('products')
        .select(vendorEmbed ? `*, ${vendorEmbed}` : '*')
        .eq('id', id)
        .maybeSingle() as any
    );

    if (error) {
      console.error('[ProductService] Error fetching product by id:', error);
      return null;
    }
    if (!data) return null;

    return this.mapRowToProduct(data);
  }

  static async getByVendor(vendorId: string): Promise<Product[]> {
    const { data, error } = await withVendorEmbedFallback<any[]>((vendorEmbed) =>
      supabase
        .from('products')
        .select(vendorEmbed ? `*, ${vendorEmbed}` : '*')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .order('local_updated_at', { ascending: false }) as any
    );

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
    const { data, error } = await withVendorEmbedFallback<any[]>((vendorEmbed) =>
      supabase
        .from('products')
        .select(vendorEmbed ? `*, ${vendorEmbed}` : '*')
        .eq('status', 'active')
        .eq('is_trending', true)
        .order('local_updated_at', { ascending: false })
        .limit(limit) as any
    );

    if (error) {
      console.error('[ProductService] Error fetching trending products:', error);
      return [];
    }

    return (data || []).map(this.mapRowToProduct);
  }
}
