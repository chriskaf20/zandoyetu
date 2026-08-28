import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API Gemini non configurée (GEMINI_API_KEY manquante)' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'Données image requises' }, { status: 400 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType as any,
          },
        },
        {
          text: `You are an expert e-commerce catalog assistant for Zando Yetu (a fashion and retail marketplace in Lubumbashi, DRC).
Analyze this product image and extract structured e-commerce product details.
Generate accurate multilingual titles and descriptions (French, English, and Swahili).
Infer target gender (women, men, or mixte), category, suitable sizes, dominant colors, material, and care instructions.
Suggest a realistic retail price in USD.`,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Default display title in French' },
            title_fr: { type: Type.STRING, description: 'French title' },
            title_en: { type: Type.STRING, description: 'English title' },
            title_sw: { type: Type.STRING, description: 'Swahili title' },
            description: { type: Type.STRING, description: 'French description' },
            desc_fr: { type: Type.STRING, description: 'French description' },
            desc_en: { type: Type.STRING, description: 'English description' },
            desc_sw: { type: Type.STRING, description: 'Swahili description' },
            category: {
              type: Type.STRING,
              description: 'Category e.g. Mode Femme, Mode Homme, Chaussures, Sacs, Accessoires',
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
      parsedData = JSON.parse(stripped);
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Gemini Product Analysis Error:', err);
    return NextResponse.json(
      { error: err.message || 'AI Analysis failed' },
      { status: 500 }
    );
  }
}
