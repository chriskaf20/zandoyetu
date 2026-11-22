"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ClothingRailHero from "@/components/ui/product-rail-gallery";
import type { RailGarment } from "@/components/ui/product-rail-gallery";
import type { Product } from "@/types/schema";
import { useCurrencyStore } from "@/lib/stores/useCurrencyStore";
import { useLanguageStore } from "@/lib/stores/useLanguageStore";
import { useRailProducts } from "@/hooks/useProducts";

const LABELS = {
  fr: { front: "Devant", back: "Dos", close: "Fermer", show: "Voir", view: "Voir l'article" },
  en: { front: "Front", back: "Back", close: "Close", show: "Show", view: "View item" },
  sw: { front: "Mbele", back: "Nyuma", close: "Funga", show: "Ona", view: "Tazama bidhaa" },
} as const;

function parseSizes(sizesJson: string | null): string[] {
  if (!sizesJson) return [];
  try {
    const sizes = JSON.parse(sizesJson);
    return Array.isArray(sizes) ? sizes.map(String) : [];
  } catch {
    return [];
  }
}

export function productToRailGarment(product: Product, language: string, formatPrice: (usd: number) => string): RailGarment | null {
  const rail = product.rail_images;
  if (!rail?.front) return null;
  const localized = product as unknown as Record<string, string | null>;
  const sizes = parseSizes(product.sizes_json);
  return {
    id: product.id,
    name: localized[`title_${language}`] || product.title,
    description: (localized[`desc_${language}`] || product.description || "").slice(0, 160) || undefined,
    image: rail.front,
    backImage: rail.back || undefined,
    tag: formatPrice(product.price_usd),
    details: [
      sizes.length ? sizes.slice(0, 4).join(" · ") : null,
      product.material_info ? product.material_info.slice(0, 40) : null,
      product.stores?.store_name ?? null,
    ].filter((d): d is string => !!d),
  };
}

interface FashionRailProps {
  /** Filtre catégorie (slug) ; tout le catalogue sinon. */
  category?: string;
  /** Sous-catégorie exacte (page produit : articles similaires). */
  categoryId?: string | null;
  /** Article tourné de face à l'ouverture (page produit). */
  activeProductId?: string;
  eyebrow?: string;
  heading?: string;
  caption?: string;
  limit?: number;
  autoplay?: boolean;
  className?: string;
}

export function FashionRail({
  category,
  categoryId,
  activeProductId,
  eyebrow = "Nouvelle saison · Le portant Zando Yetu",
  heading = "Faites glisser les cintres, découvrez chaque pièce.",
  caption = "Survolez le portant, déplacez un cintre, ouvrez une pièce pour voir le dos.",
  limit = 12,
  autoplay = true,
  className = "my-6",
}: FashionRailProps) {
  const { data: products = [] } = useRailProducts({ category, categoryId, limit });
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  useCurrencyStore((s) => s.currency);
  const language = useLanguageStore((s) => s.language);
  const labels = LABELS[language as keyof typeof LABELS] ?? LABELS.fr;

  const items = useMemo(
    () => products.map((p) => productToRailGarment(p, language, formatPrice)).filter((g): g is RailGarment => !!g),
    [products, language, formatPrice]
  );

  const activeIndex = activeProductId ? items.findIndex((i) => i.id === activeProductId) : -1;

  if (items.length < 2) return null;

  return (
    <ClothingRailHero
      key={`${activeProductId ?? "rail"}-${items.length}`}
      items={items}
      hanger="wood"
      autoplay={autoplay && activeIndex < 0}
      initialActive={activeIndex >= 0 ? activeIndex : null}
      eyebrow={eyebrow}
      heading={heading}
      caption={caption}
      labels={labels}
      className={className}
      detailAction={(item) => (
        <Link
          href={`/products/${item.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {labels.view}
          <ArrowRight className="size-4" />
        </Link>
      )}
      action={
        <Link
          href={category ? `/?category=${encodeURIComponent(category)}` : "/categories"}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm outline-none transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          Voir la collection
          <ArrowRight className="size-4" />
        </Link>
      }
    />
  );
}
