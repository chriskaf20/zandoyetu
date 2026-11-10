import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type VendorGuardResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

const ALLOWED_ROLES = ['vendor', 'admin'];

/**
 * Vérifie la session Supabase (cookies) et le rôle vendeur/admin
 * avant d'exécuter une route API coûteuse (IA, traitement d'image).
 */
export async function requireVendor(): Promise<VendorGuardResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentification requise.' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !ALLOWED_ROLES.includes(profile.role) || profile.status === 'suspended') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Accès réservé aux vendeurs Zando Yetu.' }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
