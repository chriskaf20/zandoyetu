import { supabase } from '@/lib/supabase/client';
import { Store } from '@/types/schema';

export class StoreService {
  static async getAll(): Promise<Store[]> {
    const { data, error } = await (supabase
      .from('stores')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('[StoreService] Error fetching stores:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      vendor_id: row.vendor_id,
      store_name: row.store_name,
      store_logo_url: row.store_logo_url,
      city: row.city,
      description: row.description,
      is_archived: row.is_archived,
      is_verified: !!row.is_verified,
      pending_name: row.pending_name || null,
      pending_name_reason: row.pending_name_reason || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      momo_enabled: !!row.momo_enabled,
    }));
  }

  static async getById(id: string): Promise<Store | null> {
    const { data, error } = await (supabase
      .from('stores')
      .select('*, users(phone)')
      .eq('id', id)
      .eq('is_archived', false)
      .maybeSingle() as any);

    if (error || !data) return null;

    const [favRes, prodRes] = await Promise.all([
      supabase.from('store_favorites').select('*', { count: 'exact', head: true }).eq('store_id', id) as any,
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('vendor_id', data.vendor_id).eq('status', 'active') as any,
    ]);

    return {
      id: data.id,
      vendor_id: data.vendor_id,
      store_name: data.store_name,
      store_logo_url: data.store_logo_url,
      city: data.city,
      description: data.description,
      is_archived: data.is_archived,
      is_verified: !!data.is_verified,
      pending_name: data.pending_name || null,
      pending_name_reason: data.pending_name_reason || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      momo_enabled: !!data.momo_enabled,
      follower_count: favRes.count || 0,
      product_count: prodRes.count || 0,
      phone: data.users?.phone || null,
    };
  }

  static async isFollowing(userId: string, storeId: string): Promise<boolean> {
    const { data } = await (supabase
      .from('store_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .maybeSingle() as any);

    return !!data;
  }

  static async toggleFollow(userId: string, storeId: string, currentlyFollowing: boolean): Promise<boolean> {
    if (currentlyFollowing) {
      await (supabase
        .from('store_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('store_id', storeId) as any);
      return false;
    } else {
      await (supabase
        .from('store_favorites')
        .insert({ user_id: userId, store_id: storeId } as any) as any);
      return true;
    }
  }
}
