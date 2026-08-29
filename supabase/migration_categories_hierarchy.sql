-- ============================================================================
-- Migration: Hierarchical Category System for Zando Yetu
-- ============================================================================

-- 1. Extend public.categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS icon_name TEXT,
ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured_home BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS name_fr TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS name_sw TEXT;

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON public.categories(is_featured_home);

-- 3. RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Public can view active categories"
ON public.categories
FOR SELECT
TO public
USING (true);

-- 4. Clean up old conflicting temporary categories or reset root IDs
DELETE FROM public.categories WHERE id IN (
  '11111111-1111-4111-a111-000000000001',
  '11111111-1111-4111-a111-000000000002',
  '11111111-1111-4111-a111-000000000003',
  '11111111-1111-4111-a111-000000000004',
  '11111111-1111-4111-a111-000000000005',
  '11111111-1111-4111-a111-000000000006',
  '11111111-1111-4111-a111-000000000007',
  '22222222-2222-4222-a222-000000000001',
  '22222222-2222-4222-a222-000000000002',
  '22222222-2222-4222-a222-000000000003',
  '22222222-2222-4222-a222-000000000004',
  '22222222-2222-4222-a222-000000000005',
  '22222222-2222-4222-a222-000000000011',
  '22222222-2222-4222-a222-000000000012',
  '22222222-2222-4222-a222-000000000013',
  '22222222-2222-4222-a222-000000000014',
  '22222222-2222-4222-a222-000000000021',
  '22222222-2222-4222-a222-000000000022',
  '22222222-2222-4222-a222-000000000023',
  '22222222-2222-4222-a222-000000000024',
  '22222222-2222-4222-a222-000000000041',
  '22222222-2222-4222-a222-000000000042',
  '22222222-2222-4222-a222-000000000043',
  '22222222-2222-4222-a222-000000000044',
  '22222222-2222-4222-a222-000000000051',
  '22222222-2222-4222-a222-000000000052',
  '22222222-2222-4222-a222-000000000053',
  '22222222-2222-4222-a222-000000000054',
  '22222222-2222-4222-a222-000000000061',
  '22222222-2222-4222-a222-000000000062',
  '22222222-2222-4222-a222-000000000063',
  '22222222-2222-4222-a222-000000000064'
);

-- 5. Insert 6 Standard Macro Root Universes (tier = 1, parent_id IS NULL)
INSERT INTO public.categories (id, name, name_fr, name_en, name_sw, slug, icon_name, image_url, tier, display_order, is_featured_home, parent_id)
VALUES 
  ('11111111-1111-4111-a111-000000000001', 'Mode Femme', 'Mode Femme', 'Women Fashion', 'Mavazi ya Wanawake', 'femme', 'Sparkles', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80', 1, 1, true, NULL),
  ('11111111-1111-4111-a111-000000000002', 'Mode Homme', 'Mode Homme', 'Men Fashion', 'Mavazi ya Wanaume', 'homme', 'Shirt', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80', 1, 2, true, NULL),
  ('11111111-1111-4111-a111-000000000003', 'Chaussures', 'Chaussures', 'Shoes & Footwear', 'Viatu', 'chaussures', 'Footprints', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80', 1, 3, true, NULL),
  ('11111111-1111-4111-a111-000000000004', 'Sacs & Maroquinerie', 'Sacs & Maroquinerie', 'Bags & Luggage', 'Mikoba na Mifuko', 'sacs', 'Briefcase', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&auto=format&fit=crop&q=80', 1, 4, true, NULL),
  ('11111111-1111-4111-a111-000000000005', 'Accessoires & Bijoux', 'Accessoires & Bijoux', 'Accessories & Jewelry', 'Mapambo na Saa', 'accessoires', 'Watch', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80', 1, 5, true, NULL),
  ('11111111-1111-4111-a111-000000000006', 'Beauté & Soins', 'Beauté & Soins', 'Beauty & Personal Care', 'Urembo na Manukato', 'beaute', 'Heart', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=80', 1, 6, true, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  name_en = EXCLUDED.name_en,
  name_sw = EXCLUDED.name_sw,
  slug = EXCLUDED.slug,
  icon_name = EXCLUDED.icon_name,
  image_url = EXCLUDED.image_url,
  tier = 1,
  display_order = EXCLUDED.display_order,
  is_featured_home = EXCLUDED.is_featured_home,
  parent_id = NULL;

-- 6. Subcategories under Mode Femme (tier = 2)
INSERT INTO public.categories (id, name, name_fr, name_en, name_sw, slug, icon_name, image_url, tier, display_order, is_featured_home, parent_id)
VALUES
  ('22222222-2222-4222-a222-000000000001', 'Robes & Ensembles', 'Robes & Ensembles', 'Dresses & Sets', 'Magauni', 'robes', 'Sparkles', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&auto=format&fit=crop&q=80', 2, 1, false, '11111111-1111-4111-a111-000000000001'),
  ('22222222-2222-4222-a222-000000000002', 'Hauts & Chemisiers', 'Hauts & Chemisiers', 'Tops & Blouses', 'Mashati ya Kike', 'femme-hauts', 'Shirt', 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=200&auto=format&fit=crop&q=80', 2, 2, false, '11111111-1111-4111-a111-000000000001'),
  ('22222222-2222-4222-a222-000000000003', 'Pantalons & Jupes', 'Pantalons & Jupes', 'Pants & Skirts', 'Suruali na Sketi', 'femme-bas', 'Scissors', 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=200&auto=format&fit=crop&q=80', 2, 3, false, '11111111-1111-4111-a111-000000000001'),
  ('22222222-2222-4222-a222-000000000004', 'Lingerie & Nuit', 'Lingerie & Nuit', 'Lingerie & Nightwear', 'Nguo za Ndani', 'femme-lingerie', 'Heart', 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=200&auto=format&fit=crop&q=80', 2, 4, false, '11111111-1111-4111-a111-000000000001'),
  ('22222222-2222-4222-a222-000000000005', 'Créateurs & Wax', 'Créateurs & Wax', 'African Wax & Designers', 'Vitambaa na Wax', 'femme-wax', 'Crown', 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=200&auto=format&fit=crop&q=80', 2, 5, false, '11111111-1111-4111-a111-000000000001')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  slug = EXCLUDED.slug,
  tier = 2,
  parent_id = EXCLUDED.parent_id;

-- 7. Subcategories under Mode Homme (tier = 2)
INSERT INTO public.categories (id, name, name_fr, name_en, name_sw, slug, icon_name, image_url, tier, display_order, is_featured_home, parent_id)
VALUES
  ('22222222-2222-4222-a222-000000000021', 'Chemises & Polos', 'Chemises & Polos', 'Shirts & Polos', 'Mashati na Polo', 'homme-hauts', 'Shirt', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&auto=format&fit=crop&q=80', 2, 1, false, '11111111-1111-4111-a111-000000000002'),
  ('22222222-2222-4222-a222-000000000022', 'Pantalons & Jeans', 'Pantalons & Jeans', 'Pants & Jeans', 'Suruali na Jeans', 'homme-bas', 'Scissors', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&auto=format&fit=crop&q=80', 2, 2, false, '11111111-1111-4111-a111-000000000002'),
  ('22222222-2222-4222-a222-000000000023', 'Costumes & Blazers', 'Costumes & Blazers', 'Suits & Blazers', 'Suti na Makoti', 'costumes', 'Award', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=200&auto=format&fit=crop&q=80', 2, 3, false, '11111111-1111-4111-a111-000000000002'),
  ('22222222-2222-4222-a222-000000000024', 'Streetwear & T-shirts', 'Streetwear & T-shirts', 'Streetwear & T-shirts', 'Tisheti za Kisasa', 'homme-street', 'Zap', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200&auto=format&fit=crop&q=80', 2, 4, false, '11111111-1111-4111-a111-000000000002')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  slug = EXCLUDED.slug,
  tier = 2,
  parent_id = EXCLUDED.parent_id;

-- 8. Subcategories under Chaussures (tier = 2)
INSERT INTO public.categories (id, name, name_fr, name_en, name_sw, slug, icon_name, image_url, tier, display_order, is_featured_home, parent_id)
VALUES
  ('22222222-2222-4222-a222-000000000012', 'Baskets & Sneakers', 'Baskets & Sneakers', 'Sneakers & Athletic', 'Raba na Sneakers', 'sneakers', 'Footprints', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80', 2, 1, false, '11111111-1111-4111-a111-000000000003'),
  ('22222222-2222-4222-a222-000000000013', 'Escarpins & Talons', 'Escarpins & Talons', 'Heels & Pumps', 'Viatu vya Kike vya Juu', 'talons', 'Sparkles', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&auto=format&fit=crop&q=80', 2, 2, false, '11111111-1111-4111-a111-000000000003'),
  ('22222222-2222-4222-a222-000000000011', 'Sandales & Mules', 'Sandales & Mules', 'Sandals & Slides', 'Sandali', 'sandales', 'Sun', 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=200&auto=format&fit=crop&q=80', 2, 3, false, '11111111-1111-4111-a111-000000000003'),
  ('22222222-2222-4222-a222-000000000014', 'Mocassins & Cuir', 'Mocassins & Cuir', 'Loafers & Leather', 'Mokasi za Ngozi', 'mocassins', 'Award', 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=200&auto=format&fit=crop&q=80', 2, 4, false, '11111111-1111-4111-a111-000000000003')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  slug = EXCLUDED.slug,
  tier = 2,
  parent_id = EXCLUDED.parent_id;

-- 9. Subcategories under Sacs & Maroquinerie (tier = 2)
INSERT INTO public.categories (id, name, name_fr, name_en, name_sw, slug, icon_name, image_url, tier, display_order, is_featured_home, parent_id)
VALUES
  ('22222222-2222-4222-a222-000000000041', 'Sacs à main', 'Sacs à main', 'Handbags & Totes', 'Mikoba ya Mkononi', 'sacs-a-main', 'Briefcase', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&auto=format&fit=crop&q=80', 2, 1, false, '11111111-1111-4111-a111-000000000004'),
  ('22222222-2222-4222-a222-000000000042', 'Sacs à dos', 'Sacs à dos', 'Backpacks', 'Mifuko ya Mgongoni', 'sacs-a-dos', 'Compass', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&auto=format&fit=crop&q=80', 2, 2, false, '11111111-1111-4111-a111-000000000004'),
  ('22222222-2222-4222-a222-000000000043', 'Pochettes & Soirée', 'Pochettes & Soirée', 'Clutches & Evening', 'Pochi za Sherehe', 'pochettes', 'Sparkles', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=200&auto=format&fit=crop&q=80', 2, 3, false, '11111111-1111-4111-a111-000000000004'),
  ('22222222-2222-4222-a222-000000000044', 'Portefeuilles', 'Portefeuilles', 'Wallets', 'Pochi ndogo', 'portefeuilles', 'CreditCard', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=200&auto=format&fit=crop&q=80', 2, 4, false, '11111111-1111-4111-a111-000000000004')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  slug = EXCLUDED.slug,
  tier = 2,
  parent_id = EXCLUDED.parent_id;

-- 10. Subcategories under Accessoires & Bijoux (tier = 2)
INSERT INTO public.categories (id, name, name_fr, name_en, name_sw, slug, icon_name, image_url, tier, display_order, is_featured_home, parent_id)
VALUES
  ('22222222-2222-4222-a222-000000000051', 'Montres de Luxe & Smart', 'Montres de Luxe & Smart', 'Watches & Smartwatches', 'Saa za Mkononi', 'montres', 'Watch', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200&auto=format&fit=crop&q=80', 2, 1, false, '11111111-1111-4111-a111-000000000005'),
  ('22222222-2222-4222-a222-000000000052', 'Bijoux & Colliers', 'Bijoux & Colliers', 'Jewelry & Necklaces', 'Cheni na Hereni', 'bijoux', 'Diamond', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&auto=format&fit=crop&q=80', 2, 2, false, '11111111-1111-4111-a111-000000000005'),
  ('22222222-2222-4222-a222-000000000053', 'Lunettes de Soleil', 'Lunettes de Soleil', 'Sunglasses', 'Miwani ya Jua', 'lunettes', 'Glasses', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200&auto=format&fit=crop&q=80', 2, 3, false, '11111111-1111-4111-a111-000000000005'),
  ('22222222-2222-4222-a222-000000000054', 'Ceintures en Cuir', 'Ceintures en Cuir', 'Belts', 'Mikanda ya Ngozi', 'ceintures', 'Layers', 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=200&auto=format&fit=crop&q=80', 2, 4, false, '11111111-1111-4111-a111-000000000005')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  slug = EXCLUDED.slug,
  tier = 2,
  parent_id = EXCLUDED.parent_id;

-- 11. Subcategories under Beauté & Soins (tier = 2)
INSERT INTO public.categories (id, name, name_fr, name_en, name_sw, slug, icon_name, image_url, tier, display_order, is_featured_home, parent_id)
VALUES
  ('22222222-2222-4222-a222-000000000061', 'Parfums & Brumes', 'Parfums & Brumes', 'Perfumes & Fragrances', 'Manukato', 'parfums', 'Sparkles', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&auto=format&fit=crop&q=80', 2, 1, false, '11111111-1111-4111-a111-000000000006'),
  ('22222222-2222-4222-a222-000000000062', 'Maquillage & Teint', 'Maquillage & Teint', 'Makeup & Cosmetics', 'Vipodozi', 'maquillage', 'Palette', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=200&auto=format&fit=crop&q=80', 2, 2, false, '11111111-1111-4111-a111-000000000006'),
  ('22222222-2222-4222-a222-000000000063', 'Soins Visage & Corps', 'Soins Visage & Corps', 'Skincare & Body', 'Mafuta ya Mwili', 'soins-corps', 'Heart', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80', 2, 3, false, '11111111-1111-4111-a111-000000000006'),
  ('22222222-2222-4222-a222-000000000064', 'Soins Capillaires & Perruques', 'Soins Capillaires & Perruques', 'Haircare & Wigs', 'Mafuta ya Nywele', 'cheveux', 'Scissors', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80', 2, 4, false, '11111111-1111-4111-a111-000000000006')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_fr = EXCLUDED.name_fr,
  slug = EXCLUDED.slug,
  tier = 2,
  parent_id = EXCLUDED.parent_id;
