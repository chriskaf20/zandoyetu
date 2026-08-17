import { supabase } from '@/lib/supabase/client';
import { Review } from '@/types/schema';

export class ReviewService {
  static async getByProduct(productId: string): Promise<Review[]> {
    const { data, error } = await (supabase
      .from('reviews')
      .select('*, users(full_name, email)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('[ReviewService] Error fetching product reviews:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      customer_id: row.customer_id,
      rating: Number(row.rating) || 5,
      comment: row.comment,
      created_at: row.created_at,
      users: row.users ? {
        full_name: row.users.full_name || 'Client Zando',
        email: row.users.email,
      } : undefined,
    }));
  }

  static async submitReview(payload: {
    product_id: string;
    customer_id: string;
    rating: number;
    comment: string;
  }): Promise<{ success: boolean; message: string }> {
    const { error } = await (supabase.from('reviews').insert({
      product_id: payload.product_id,
      customer_id: payload.customer_id,
      rating: payload.rating,
      comment: payload.comment.trim(),
    } as any) as any);

    if (error) {
      return { success: false, message: error.message || "Erreur lors de l'enregistrement de l'avis." };
    }

    return { success: true, message: 'Votre avis a été publié avec succès !' };
  }
}
