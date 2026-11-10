import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { requireVendor } from '@/lib/server/requireVendor';
import { consumeRateLimit } from '@/lib/server/rateLimit';
import { MAX_BASE64_LENGTH } from '@/lib/server/imageInput';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_TIMEOUT_MS = 45_000;

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const bodySchema = z.object({
  imageBase64: z.string().min(1).max(MAX_BASE64_LENGTH, 'Image trop lourde (8 Mo maximum).'),
  mimeType: z
    .enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'], {
      errorMap: () => ({ message: 'Format non supporté. Utilisez une photo JPEG, PNG ou WebP.' }),
    })
    .default('image/jpeg'),
});

interface AiTaxonomy {
  universes: { slug: string; name: string; subs: string[] }[];
}

/** Repli si la table categories est inaccessible : mêmes univers que la base */
const FALLBACK_TAXONOMY: AiTaxonomy = {
  universes: [
    { slug: 'femme', name: 'Mode Femme', subs: ['Robes & Ensembles', 'Hauts & Chemisiers', 'Pantalons & Jupes', 'Lingerie & Nuit', 'Créateurs & Wax'] },
    { slug: 'homme', name: 'Mode Homme', subs: ['Chemises & Polos', 'Pantalons & Jeans', 'Costumes & Blazers', 'Streetwear & T-shirts'] },
    { slug: 'chaussures', name: 'Chaussures', subs: ['Baskets & Sneakers', 'Escarpins & Talons', 'Sandales & Mules', 'Mocassins & Cuir'] },
    { slug: 'sacs', name: 'Sacs & Maroquinerie', subs: ['Sacs à main', 'Sacs à dos', 'Pochettes & Soirée', 'Portefeuilles'] },
    { slug: 'accessoires', name: 'Accessoires & Bijoux', subs: ['Montres de Luxe & Smart', 'Bijoux & Colliers', 'Lunettes de Soleil', 'Ceintures en Cuir'] },
    { slug: 'beaute', name: 'Beauté & Soins', subs: ['Parfums & Brumes', 'Maquillage & Teint', 'Soins Visage & Corps', 'Soins Capillaires & Perruques'] },
  ],
};

const TAXONOMY_TTL_MS = 10 * 60 * 1000;
let taxonomyCache: { at: number; value: AiTaxonomy } | null = null;

/** Univers et sous-catégories actifs : l'IA ne peut répondre qu'avec ces valeurs */
async function loadAiTaxonomy(): Promise<AiTaxonomy> {
  if (taxonomyCache && Date.now() - taxonomyCache.at < TAXONOMY_TTL_MS) return taxonomyCache.value;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error || !data?.length) throw error || new Error('empty categories');

    const childrenOf = new Map<string, typeof data>();
    data.forEach((c) => {
      if (!c.parent_id) return;
      childrenOf.set(c.parent_id, [...(childrenOf.get(c.parent_id) || []), c]);
    });

    const universes = data
      .filter((c) => !c.parent_id && c.slug)
      .map((root) => {
        const subs: string[] = [];
        (childrenOf.get(root.id) || []).forEach((child) => {
          subs.push(child.name);
          (childrenOf.get(child.id) || []).forEach((leaf) => subs.push(leaf.name));
        });
        return { slug: root.slug as string, name: root.name, subs: [...new Set(subs)] };
      })
      .filter((u) => u.subs.length > 0);

    if (universes.length === 0) throw new Error('no universes');
    const value = { universes };
    taxonomyCache = { at: Date.now(), value };
    return value;
  } catch (err) {
    console.warn('[AnalyzeProduct] Taxonomy unavailable, using fallback:', err);
    return FALLBACK_TAXONOMY;
  }
}

/** Traduit les erreurs Gemini en messages actionnables, sans exposer de détail interne */
function toAiErrorResponse(error: unknown): NextResponse {
  const err = error as { status?: unknown; name?: string };
  const status = typeof err?.status === 'number' ? err.status : undefined;

  if (err?.name === 'AbortError' || err?.name === 'TimeoutError') {
    return NextResponse.json(
      { error: 'L\'analyse IA a pris trop de temps. Réessayez avec une photo plus légère.' },
      { status: 504 }
    );
  }
  if (status === 429) {
    return NextResponse.json(
      { error: 'Quota d\'analyse IA atteint. Réessayez dans quelques minutes.' },
      { status: 429 }
    );
  }
  if (status === 400) {
    return NextResponse.json(
      { error: 'Image non exploitable par l\'IA. Essayez une photo plus nette du produit.' },
      { status: 422 }
    );
  }
  if (status === 401 || status === 403 || status === 404) {
    // Clé invalide/révoquée ou modèle introuvable (voir GEMINI_MODEL)
    console.error(`[AnalyzeProduct] Gemini configuration error (${status}) for model ${GEMINI_MODEL}`);
    return NextResponse.json(
      { error: 'Service d\'analyse IA momentanément indisponible.' },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { error: 'Analyse IA indisponible pour le moment. Réessayez plus tard.' },
    { status: 502 }
  );
}

export async function POST(req: NextRequest) {
  const guard = await requireVendor();
  if (!guard.ok) return guard.response;

  const limited = consumeRateLimit(`analyze-product:${guard.userId}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (limited) return limited;

  if (!process.env.GEMINI_API_KEY) {
    console.error('[AnalyzeProduct] GEMINI_API_KEY is not configured');
    return NextResponse.json({ error: 'Service d\'analyse IA non configuré.' }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Requête invalide.' },
      { status: 400 }
    );
  }
  const { imageBase64, mimeType } = parsed.data;
  const taxonomy = await loadAiTaxonomy();
  const universeSlugs = taxonomy.universes.map((u) => u.slug);
  const categoryNames = [...new Set(taxonomy.universes.flatMap((u) => u.subs))];
  const taxonomyPrompt = taxonomy.universes
    .map((u) => `- ${u.slug} (${u.name}) : ${u.subs.join(' | ')}`)
    .join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        },
        {
          text: `You are an expert e-commerce catalog assistant for Zando Yetu, a fashion and retail marketplace in Lubumbashi and Kolwezi (Haut-Katanga / Lualaba, DR Congo).
Analyze this product image and extract structured e-commerce product details.

Languages:
- French (default, used on the storefront): natural, commercial, concise.
- English: neutral international English.
- Swahili: write in Congolese Swahili as spoken in Lubumbashi and the Katanga region (Kiswahili cha Kongo / Kingwana), not Tanzanian or Kenyan standard Swahili. Keep common French loanwords used locally (e.g. "robe", "sac", "taille") when they are what shoppers actually say.

Classification — you MUST pick values from this exact list:
${taxonomyPrompt}
"universe_slug" is the slug before the parenthesis, "category" is one of the subcategory names listed for that universe, copied exactly.

Also infer the target gender (women, men or mixte), suitable sizes, dominant colors in French, material and care instructions.
Suggest a realistic retail price in USD for the Lubumbashi market (imported ready-to-wear sold in local boutiques), not a European or US price.`,
        },
      ],
      config: {
        abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Default display title in French' },
            title_fr: { type: Type.STRING, description: 'French title' },
            title_en: { type: Type.STRING, description: 'English title' },
            title_sw: { type: Type.STRING, description: 'Congolese (Katanga) Swahili title' },
            description: { type: Type.STRING, description: 'French description' },
            desc_fr: { type: Type.STRING, description: 'French description' },
            desc_en: { type: Type.STRING, description: 'English description' },
            desc_sw: { type: Type.STRING, description: 'Congolese (Katanga) Swahili description' },
            universe_slug: {
              type: Type.STRING,
              enum: universeSlugs,
              description: 'Primary root universe slug',
            },
            category: {
              type: Type.STRING,
              enum: categoryNames,
              description: 'Exact subcategory name from the provided list',
            },
            target_gender: { type: Type.STRING, enum: ['women', 'men', 'mixte'] },
            suggested_price_usd: { type: Type.NUMBER, description: 'Suggested market price in USD' },
            sizes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of detected sizes (e.g. ["S", "M", "L"] or ["40", "41", "42"])',
            },
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of detected colors in French (e.g. ["Noir", "Blanc"])',
            },
            material_info: { type: Type.STRING, description: 'Material information (e.g. Cuir, Coton)' },
            security_specs: { type: Type.STRING, description: 'Care / wash instructions' },
          },
          required: [
            'title',
            'title_fr',
            'title_en',
            'title_sw',
            'description',
            'desc_fr',
            'universe_slug',
            'category',
            'target_gender',
            'sizes',
            'colors',
          ],
        },
      },
    });

    const rawText = response.text || '{}';
    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Strip possible markdown fences from model response
      const stripped = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      try {
        parsedData = JSON.parse(stripped);
      } catch {
        console.error('[AnalyzeProduct] Unparseable Gemini response:', rawText.slice(0, 500));
        return NextResponse.json(
          { error: 'Réponse IA illisible. Relancez l\'analyse.' },
          { status: 502 }
        );
      }
    }

    // Garde-fou : une valeur hors taxonomie n'est jamais renvoyée au formulaire
    if (typeof parsedData.universe_slug !== 'string' || !universeSlugs.includes(parsedData.universe_slug)) {
      delete parsedData.universe_slug;
    }
    if (typeof parsedData.category !== 'string' || !categoryNames.includes(parsedData.category)) {
      delete parsedData.category;
    }
    const price = Number(parsedData.suggested_price_usd);
    if (!Number.isFinite(price) || price <= 0 || price > 5000) {
      delete parsedData.suggested_price_usd;
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    console.error('[AnalyzeProduct] Gemini error:', error);
    return toAiErrorResponse(error);
  }
}
