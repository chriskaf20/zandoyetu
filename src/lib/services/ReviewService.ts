import { supabase } from '@/lib/supabase/client';
import { Review } from '@/types/schema';

/** Code Postgres renvoyé quand une politique RLS refuse l'insertion */
const RLS_VIOLATION = '42501';

export class ReviewService {
  static async getByProduct(productId: string): Promise<Review[]> {
    const { data, error } = await (supabase
      .from('reviews')
      .select('id, product_id, customer_id, rating, comment, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('[ReviewService] Error fetching product reviews:', error);
      return [];
    }

    const rows: any[] = data || [];
    const authorIds = [...new Set(rows.map((r) => r.customer_id).filter(Boolean))];

    // La table users est privée : noms d'auteurs via la vue public_review_authors (« Prénom I. »)
    const names = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: authors, error: authorsError } = await (supabase
        .from('public_review_authors')
        .select('id, display_name')
        .in('id', authorIds) as any);
      if (authorsError) {
        console.warn('[ReviewService] Review authors unavailable:', authorsError);
      }
      (authors || []).forEach((a: any) => names.set(a.id, a.display_name));
    }

    return rows.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      customer_id: row.customer_id,
      rating: Number(row.rating) || 5,
      comment: row.comment,
      created_at: row.created_at,
      users: {
        full_name: names.get(row.customer_id) || 'Client Zando',
        email: null,
      },
    }));
  }

  static async submitReview(payload: {
    product_id: string;
    customer_id: string;
    rating: number;
    comment: string;
  }): Promise<{ success: boolean; message: string }> {
    const rating = Math.round(Number(payload.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { success: false, message: 'La note doit être comprise entre 1 et 5 étoiles.' };
    }

    const { error } = await (supabase.from('reviews').insert({
      product_id: payload.product_id,
      customer_id: payload.customer_id,
      rating,
      comment: payload.comment.trim(),
    } as any) as any);

    if (error) {
      if (error.code === RLS_VIOLATION) {
        return {
          success: false,
          message: 'Seuls les clients ayant reçu cet article peuvent laisser un avis. Vous pourrez noter le produit dès que votre commande sera livrée.',
        };
      }
      if (error.code === '23505') {
        return { success: false, message: 'Vous avez déjà laissé un avis sur cet article.' };
      }
      console.error('[ReviewService] Error submitting review:', error);
      return { success: false, message: "Erreur lors de l'enregistrement de l'avis. Réessayez plus tard." };
    }

    return { success: true, message: 'Votre avis a été publié avec succès !' };
  }
}
