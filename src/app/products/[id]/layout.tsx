import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Titre, description et aperçu (WhatsApp, Facebook) de la fiche produit */
export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: 'Article introuvable' };

  const supabase = await createServerSupabaseClient();
  const { data: product } = await supabase
    .from('products')
    .select('title, description, price_usd, images_urls, status')
    .eq('id', id)
    .maybeSingle();

  if (!product || product.status !== 'active') {
    return { title: 'Article introuvable', robots: { index: false } };
  }

  const price = `$${Number(product.price_usd).toFixed(2)}`;
  const description =
    (product.description || '').replace(/\s+/g, ' ').trim().slice(0, 155) ||
    `${product.title} à ${price} — livraison à Lubumbashi et Kolwezi, paiement à la livraison.`;
  const image = (product.images_urls || []).find((url: string) => url?.startsWith('https://'));

  return {
    title: `${product.title} — ${price}`,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: {
      type: 'website',
      title: `${product.title} — ${price}`,
      description,
      url: `/products/${id}`,
      images: image ? [{ url: image, width: 1200, height: 1600, alt: product.title }] : undefined,
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
