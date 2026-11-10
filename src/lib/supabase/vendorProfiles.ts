import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Profil vendeur public (nom, téléphone) via la vue public_vendor_profiles :
 * la table users n'est plus lisible par les visiteurs
 * (cf. supabase/migration_v3_02_functions.sql).
 * Alias `users` conservé pour ProductService.mapRowToProduct.
 */
export const VENDOR_PROFILE_EMBED =
  'users:public_vendor_profiles(id, full_name, phone, store_id, store_logo_url, city, is_verified)';

type QueryResult<T> = { data: T | null; error: PostgrestError | null };

/**
 * Exécute la requête avec l'embed du profil vendeur, puis la rejoue sans
 * embed si PostgREST ne connaît pas encore la vue (PGRST200), pour que le
 * catalogue reste disponible tant que la migration v3 n'est pas appliquée.
 */
export async function withVendorEmbedFallback<T>(
  run: (vendorEmbed: string | null) => PromiseLike<QueryResult<T>>
): Promise<QueryResult<T>> {
  const result = await run(VENDOR_PROFILE_EMBED);
  if (result.error?.code !== 'PGRST200') return result;

  console.warn('[vendorProfiles] public_vendor_profiles unavailable, retrying without vendor embed');
  return run(null);
}
