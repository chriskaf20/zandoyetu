import { supabase } from '@/lib/supabase/client';
import { PlatformSettings } from '@/types/schema';
import { DEFAULT_EXCHANGE_RATE } from '@/lib/utils/currency';

export class PlatformSettingsService {
  static async getSettings(): Promise<PlatformSettings | null> {
    const { data, error } = await (supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle() as any);

    if (error || !data) return null;

    return {
      id: data.id,
      exchange_rate: Number(data.exchange_rate) || DEFAULT_EXCHANGE_RATE,
      commission_rate: Number(data.commission_rate) || 10,
      mobile_money_active: data.mobile_money_active ?? 1,
      mpesa_number: data.mpesa_number,
      orange_number: data.orange_number,
      airtel_number: data.airtel_number,
    };
  }
}
