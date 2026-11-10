import { supabase } from '@/lib/supabase/client';

export interface DeliveryZone {
  id: string;
  city: string;
  commune: string;
  fee_usd: number;
  free_delivery_threshold_usd: number | null;
  eta_label: string | null;
  is_active: boolean;
  sort_order: number;
}

/** Frais facturés pour une zone, selon le sous-total articles (même règle que rpc_process_checkout) */
export function deliveryFeeForZone(zone: DeliveryZone | null | undefined, subtotalUsd: number): number {
  if (!zone) return 0;
  if (zone.free_delivery_threshold_usd != null && subtotalUsd >= zone.free_delivery_threshold_usd) return 0;
  return Number(zone.fee_usd) || 0;
}

export class DeliveryZoneService {
  static async getActiveZones(): Promise<DeliveryZone[]> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[DeliveryZoneService] Error fetching zones:', error);
      return [];
    }

    return (data || []).map((z: any) => ({
      ...z,
      fee_usd: Number(z.fee_usd) || 0,
      free_delivery_threshold_usd: z.free_delivery_threshold_usd != null ? Number(z.free_delivery_threshold_usd) : null,
    }));
  }
}
