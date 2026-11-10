import { supabase } from '@/lib/supabase/client';
import { Category, CategoryTree } from '@/types/schema';

export interface StructuredSubgroup {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  items: string[];
}

export interface StructuredDepartment {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
  subgroups: StructuredSubgroup[];
  promoBanner?: {
    title: string;
    subtitle: string;
    image: string;
    link: string;
  };
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80';

/** Habillage éditorial des univers (la structure vient de la table categories) */
const PROMO_BANNERS: Record<string, StructuredDepartment['promoBanner']> = {
  femme: {
    title: 'Nouvelle Saison Femme',
    subtitle: 'Robes, ensembles & créateurs wax',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&auto=format&fit=crop&q=80',
    link: '/?category=femme',
  },
  homme: {
    title: 'Gentlemen Katanga',
    subtitle: 'Élégance masculine garantie',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80',
    link: '/?category=homme',
  },
  chaussures: {
    title: 'Shoe Palace Lubumbashi',
    subtitle: 'Toutes les pointures disponibles',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&auto=format&fit=crop&q=80',
    link: '/?category=chaussures',
  },
  sacs: {
    title: 'Maroquinerie & Luxe',
    subtitle: 'Les finitions parfaites pour votre tenue',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop&q=80',
    link: '/?category=sacs',
  },
  accessoires: {
    title: 'Bijoux & Montres',
    subtitle: 'La touche finale de votre style',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
    link: '/?category=accessoires',
  },
  beaute: {
    title: 'Éclat & Beauté',
    subtitle: 'Parfums, maquillage & soins authentiques',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
    link: '/?category=beaute',
  },
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { at: number; data: Category[] } | null = null;

function byDisplayOrder(a: Category, b: Category) {
  return (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name);
}

export class CategoryService {
  /**
   * Flat list of active categories (single source of truth for the taxonomy)
   */
  static async getAll(): Promise<Category[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('[CategoryService] Error fetching categories:', error);
        return [];
      }

      const categories: Category[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        name_fr: row.name_fr || row.name,
        name_en: row.name_en || row.name,
        name_sw: row.name_sw || row.name,
        slug: row.slug || row.id,
        parent_id: row.parent_id,
        tier: row.tier as 1 | 2 | 3,
        image_url: row.image_url,
        icon_name: row.icon_name,
        display_order: row.display_order ?? row.sort_order ?? 0,
        sort_order: row.sort_order ?? row.display_order ?? 0,
        is_featured_home: row.is_featured_home ?? true,
        is_active: row.is_active ?? true,
        created_at: row.created_at,
      }));

      cache = { at: Date.now(), data: categories };
      return categories;
    } catch (err) {
      console.error('[CategoryService] Unexpected error in getAll:', err);
      return [];
    }
  }

  /**
   * Fetch only root macro-universes (parent_id is null)
   */
  static async getRootCategories(): Promise<Category[]> {
    const all = await this.getAll();
    return all.filter((c) => !c.parent_id).sort(byDisplayOrder);
  }

  /**
   * Get complete hierarchical tree in a single query
   */
  static async getTree(): Promise<CategoryTree> {
    return this.buildTree(await this.getAll());
  }

  static buildTree(all: Category[]): CategoryTree {
    const byParent: Record<string, Category[]> = {};
    all.forEach((cat) => {
      if (cat.parent_id) {
        (byParent[cat.parent_id] ||= []).push(cat);
      }
    });
    Object.values(byParent).forEach((list) => list.sort(byDisplayOrder));

    const roots = all
      .filter((c) => !c.parent_id)
      .sort(byDisplayOrder)
      .map((root) => ({ ...root, subcategories: byParent[root.id] || [] }));

    const tier2ByParent: Record<string, Category[]> = {};
    const tier3ByParent: Record<string, Category[]> = {};
    all.forEach((cat) => {
      if (!cat.parent_id) return;
      const target = cat.tier === 3 ? tier3ByParent : tier2ByParent;
      (target[cat.parent_id] ||= []).push(cat);
    });

    return { tier1: roots, tier2ByParent, tier3ByParent, roots };
  }

  /**
   * Departments for the Mega Menu & categories page, built from the database tree
   */
  static buildStructuredTaxonomy(all: Category[]): StructuredDepartment[] {
    const tree = this.buildTree(all);
    return tree.roots.map((root) => ({
      id: root.id,
      name: root.name_fr || root.name,
      slug: root.slug || root.id,
      image_url: root.image_url || FALLBACK_IMAGE,
      sort_order: root.display_order ?? 0,
      subgroups: (root.subcategories || []).map((sub) => ({
        id: sub.id,
        name: sub.name_fr || sub.name,
        slug: sub.slug || sub.id,
        image_url: sub.image_url || root.image_url || FALLBACK_IMAGE,
        items: (tree.tier3ByParent[sub.id] || []).map((leaf) => leaf.name_fr || leaf.name),
      })),
      promoBanner: PROMO_BANNERS[root.slug || ''],
    }));
  }
}
