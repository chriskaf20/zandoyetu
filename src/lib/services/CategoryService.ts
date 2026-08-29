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

// Curated taxonomy standards for Lubumbashi Marketplace
export const DEFAULT_TAXONOMY: StructuredDepartment[] = [
  {
    id: 'dept-women',
    name: 'Mode Femme',
    slug: 'femmes',
    sort_order: 1,
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80',
    subgroups: [
      {
        id: 'sub-robes',
        name: 'Robes & Ensembles',
        slug: 'robes',
        image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&auto=format&fit=crop&q=80',
        items: ['Robes de soirée', 'Robes de cérémonie', 'Robes d’été', 'Ensembles 2 pièces'],
      },
      {
        id: 'sub-hauts-femme',
        name: 'Hauts & Chemisiers',
        slug: 'hauts',
        image_url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=200&auto=format&fit=crop&q=80',
        items: ['T-shirts tendance', 'Chemisiers chics', 'Tops wax', 'Bodys'],
      },
      {
        id: 'sub-bas-femme',
        name: 'Bas & Jeans',
        slug: 'femme-bas',
        image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=200&auto=format&fit=crop&q=80',
        items: ['Jeans taille haute', 'Pantalons tailleur', 'Jupes plissées', 'Shorts'],
      },
      {
        id: 'sub-lingerie',
        name: 'Lingerie & Nuit',
        slug: 'lingerie',
        image_url: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=200&auto=format&fit=crop&q=80',
        items: ['Ensembles dentelle', 'Nuisettes en satin', 'Pyjamas confort', 'Peignoirs'],
      },
    ],
    promoBanner: {
      title: 'Nouvelle Saison Femme',
      subtitle: 'Jusqu’à -40% sur les robes & ensembles',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&auto=format&fit=crop&q=80',
      link: '/?gender=women',
    },
  },
  {
    id: 'dept-men',
    name: 'Mode Homme',
    slug: 'hommes',
    sort_order: 2,
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80',
    subgroups: [
      {
        id: 'sub-hauts-homme',
        name: 'Hauts, T-shirts & Polos',
        slug: 'homme-hauts',
        image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&auto=format&fit=crop&q=80',
        items: ['Chemises slim fit', 'Polos élégants', 'Chemises en lin', 'T-shirts street'],
      },
      {
        id: 'sub-bas-homme',
        name: 'Pantalons & Jeans',
        slug: 'homme-bas',
        image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&auto=format&fit=crop&q=80',
        items: ['Jeans denim brut', 'Chinos coton', 'Pantalons cargo', 'Shorts habillés'],
      },
      {
        id: 'sub-costumes',
        name: 'Costumes & Blazers',
        slug: 'costumes',
        image_url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=200&auto=format&fit=crop&q=80',
        items: ['Costumes 3 pièces', 'Vestes de smoking', 'Pantalons costume', 'Nœuds & Cravates'],
      },
    ],
    promoBanner: {
      title: 'Gentlemen Katanga',
      subtitle: 'Élégance masculine garantie',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80',
      link: '/?gender=men',
    },
  },
  {
    id: 'dept-shoes',
    name: 'Chaussures',
    slug: 'chaussures',
    sort_order: 3,
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&auto=format&fit=crop&q=80',
    subgroups: [
      {
        id: 'sub-sandales',
        name: 'Sandales & Mules',
        slug: 'sandales',
        image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&auto=format&fit=crop&q=80',
        items: ['Sandales cuir', 'Mules plates', 'Claquettes mode', 'Spartiates'],
      },
      {
        id: 'sub-sneakers',
        name: 'Baskets & Sneakers',
        slug: 'sneakers',
        image_url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=200&auto=format&fit=crop&q=80',
        items: ['Sneakers urbaines', 'Baskets running', 'High-tops', 'Slip-on'],
      },
      {
        id: 'sub-talons',
        name: 'Talons & Escarpins',
        slug: 'talons',
        image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&auto=format&fit=crop&q=80',
        items: ['Talons aiguilles', 'Talons blocs', 'Escarpins vernis', 'Sandales à talons'],
      },
      {
        id: 'sub-ville-mocassins',
        name: 'Chaussures de Ville & Mocassins',
        slug: 'mocassins',
        image_url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=200&auto=format&fit=crop&q=80',
        items: ['Mocassins italiens', 'Derbies', 'Richelieus', 'Loafers cuir'],
      },
    ],
    promoBanner: {
      title: 'Shoe Palace Lubumbashi',
      subtitle: 'Toutes les pointures disponibles',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&auto=format&fit=crop&q=80',
      link: '/?category=chaussures',
    },
  },
  {
    id: 'dept-bags-acc',
    name: 'Sacs & Accessoires',
    slug: 'accessoires',
    sort_order: 4,
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&auto=format&fit=crop&q=80',
    subgroups: [
      {
        id: 'sub-sacs',
        name: 'Sacs à Main & Pochettes',
        slug: 'sacs',
        image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=80',
        items: ['Sacs cabas', 'Pochettes de soirée', 'Sacs bandoulière', 'Sacs à dos'],
      },
      {
        id: 'sub-bijoux',
        name: 'Bijoux & Montres',
        slug: 'bijoux',
        image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=80',
        items: ['Colliers & Pendentifs', 'Boucles d’oreilles', 'Bracelets', 'Montres élégantes'],
      },
      {
        id: 'sub-ceintures-lunettes',
        name: 'Ceintures & Lunettes',
        slug: 'lunettes',
        image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200&auto=format&fit=crop&q=80',
        items: ['Lunettes de soleil', 'Ceintures cuir', 'Casquettes', 'Chapeaux'],
      },
    ],
    promoBanner: {
      title: 'Maroquinerie & Luxe',
      subtitle: 'Les finitions parfaites pour votre tenue',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop&q=80',
      link: '/?category=accessoires',
    },
  },
  {
    id: 'dept-beauty',
    name: 'Beauté & Soins',
    slug: 'beaute',
    sort_order: 5,
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
    subgroups: [
      {
        id: 'sub-parfums',
        name: 'Parfums & Eaux de Toilette',
        slug: 'parfums',
        image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&auto=format&fit=crop&q=80',
        items: ['Parfums femme', 'Parfums homme', 'Brumes parfumées', 'Coffrets'],
      },
      {
        id: 'sub-maquillage',
        name: 'Maquillage & Teint',
        slug: 'maquillage',
        image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
        items: ['Fonds de teint', 'Rouges à lèvres', 'Palettes yeux', 'Pinceaux'],
      },
      {
        id: 'sub-soins-corps',
        name: 'Soins de la Peau & Corps',
        slug: 'soins',
        image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80',
        items: ['Laits hydratants', 'Sérums visage', 'Gommages', 'Soins capillaires'],
      },
    ],
    promoBanner: {
      title: 'Éclat & Beauté',
      subtitle: 'Produits certifiés et authentiques',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
      link: '/?category=beaute',
    },
  },
  {
    id: 'dept-kids',
    name: 'Enfants & Bébés',
    slug: 'enfants',
    sort_order: 6,
    image_url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=300&auto=format&fit=crop&q=80',
    subgroups: [
      {
        id: 'sub-filles',
        name: 'Filles',
        slug: 'filles',
        image_url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=200&auto=format&fit=crop&q=80',
        items: ['Robes enfant', 'Ensembles fleuris', 'Chaussures fillette', 'Accessoires'],
      },
      {
        id: 'sub-garcons',
        name: 'Garçons',
        slug: 'garcons',
        image_url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=200&auto=format&fit=crop&q=80',
        items: ['Polos junior', 'Bermudas', 'Baskets enfant', 'Chemises'],
      },
      {
        id: 'sub-bebes',
        name: 'Bébés & Naissance',
        slug: 'bebes',
        image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&auto=format&fit=crop&q=80',
        items: ['Grenouillères', 'Ensembles coton', 'Chaussons', 'Bavoirs & Cadeaux'],
      },
    ],
    promoBanner: {
      title: 'Univers Enfants',
      subtitle: 'Confort et style pour vos petits',
      image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=400&auto=format&fit=crop&q=80',
      link: '/?category=enfants',
    },
  },
  {
    id: 'dept-home',
    name: 'Maison & Déco',
    slug: 'maison',
    sort_order: 7,
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=80',
    subgroups: [
      {
        id: 'sub-linge',
        name: 'Linge de Maison',
        slug: 'linge-maison',
        image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&auto=format&fit=crop&q=80',
        items: ['Draps & Parures de lit', 'Serviettes de bain', 'Plaids', 'Coussins'],
      },
      {
        id: 'sub-deco-art',
        name: 'Décoration Katangaise',
        slug: 'deco-katanga',
        image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&auto=format&fit=crop&q=80',
        items: ['Tableaux d’art', 'Vases & Sculptures', 'Bougies parfumées', 'Tapis'],
      },
    ],
    promoBanner: {
      title: 'Intérieurs Élégants',
      subtitle: 'Embellissez votre maison à Lubumbashi',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&auto=format&fit=crop&q=80',
      link: '/?category=maison',
    },
  },
];

export class CategoryService {
  /**
   * Fetch flat list of all active categories from Supabase
   */
  static async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('[CategoryService] Error fetching categories:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
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
    return all.filter((c) => !c.parent_id);
  }

  /**
   * Get complete hierarchical tree in a single query
   */
  static async getTree(): Promise<CategoryTree> {
    const all = await this.getAll();
    const tier1: Category[] = [];
    const tier2ByParent: Record<string, Category[]> = {};
    const tier3ByParent: Record<string, Category[]> = {};

    // Group children by parent_id
    all.forEach((cat) => {
      if (!cat.parent_id || cat.tier === 1) {
        tier1.push({ ...cat, subcategories: [] });
      } else {
        if (!tier2ByParent[cat.parent_id]) {
          tier2ByParent[cat.parent_id] = [];
        }
        tier2ByParent[cat.parent_id].push(cat);
      }
    });

    // Populate subcategories array onto roots
    const roots = tier1.map((root) => ({
      ...root,
      subcategories: tier2ByParent[root.id] || [],
    }));

    return { tier1: roots, tier2ByParent, tier3ByParent, roots };
  }

  /**
   * Get structured department groups for Mega Menu & Story Rail
   */
  static getStructuredTaxonomy(): StructuredDepartment[] {
    return DEFAULT_TAXONOMY;
  }
}
