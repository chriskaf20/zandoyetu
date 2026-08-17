import { supabase } from '@/lib/supabase/client';
import { HeroBanner } from '@/types/schema';

export class HeroBannerService {
  static async getActive(): Promise<HeroBanner[]> {
    const { data, error } = await (supabase
      .from('hero_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }) as any);

    if (error) {
      console.error('[HeroBannerService] Error fetching hero banners:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      media_url: row.media_url,
      click_action_route: row.click_action_route,
      sort_order: row.sort_order ?? 0,
      is_active: row.is_active ?? true,
      created_at: row.created_at,
    }));
  }
}
