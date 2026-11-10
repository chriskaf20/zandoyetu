import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Titre, description et aperçu (WhatsApp, Facebook) de la page boutique */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: 'Boutique introuvable' };

  const supabase = await createServerSupabaseClient();
  const { data: store } = await supabase
    .from('stores')
    .select('store_name, description, city, store_logo_url, is_archived')
    .eq('id', id)
    .maybeSingle();

  if (!store || store.is_archived) {
    return { title: 'Boutique introuvable', robots: { index: false } };
  }

  const city = store.city || 'Lubumbashi';
  const description =
    (store.description || '').replace(/\s+/g, ' ').trim().slice(0, 155) ||
    `Découvrez la boutique ${store.store_name} à ${city} sur Zando Yetu.`;
  const logo = store.store_logo_url?.startsWith('https://') ? store.store_logo_url : undefined;

  return {
    title: `${store.store_name} — ${city}`,
    description,
    alternates: { canonical: `/stores/${id}` },
    openGraph: {
      type: 'website',
      title: `${store.store_name} — Boutique à ${city}`,
      description,
      url: `/stores/${id}`,
      images: logo ? [{ url: logo, alt: store.store_name }] : undefined,
    },
  };
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
