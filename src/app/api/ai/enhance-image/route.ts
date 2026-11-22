import { NextRequest, NextResponse } from 'next/server';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { z } from 'zod';
import { ImageStudioService } from '@/lib/services/ImageStudioService';
import { requireVendor } from '@/lib/server/requireVendor';
import { consumeRateLimit } from '@/lib/server/rateLimit';
import {
  MAX_BASE64_LENGTH,
  ImageInputError,
  decodeBase64Image,
  fetchProjectStorageImage,
} from '@/lib/server/imageInput';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow sufficient time for neural segmentation

// Canevas Studio fixe (3:4), non pilotable par le client
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1600;
// Le sujet final tient dans 960x1280 : inutile de segmenter plus grand
const SEGMENTATION_MAX_SIDE = 2000;
const MAX_INPUT_PIXELS = 40_000_000;

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const bodySchema = z
  .object({
    imageBase64: z.string().min(1).max(MAX_BASE64_LENGTH).optional(),
    imageUrl: z.string().url().max(2048).optional(),
    options: z
      .object({
        paddingPercent: z.number().min(0).max(0.25).optional(),
        shadow: z.boolean().optional(),
        shadowIntensity: z.number().min(0).max(0.5).optional(),
        quality: z.number().int().min(60).max(95).optional(),
      })
      .default({}),
  })
  .refine((body) => Boolean(body.imageBase64) !== Boolean(body.imageUrl), {
    message: 'Fournir soit imageBase64, soit imageUrl.',
  });

export async function POST(req: NextRequest) {
  const guard = await requireVendor();
  if (!guard.ok) return guard.response;

  const limited = consumeRateLimit(`enhance-image:${guard.userId}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Requête invalide.' },
      { status: 400 }
    );
  }
  const { imageBase64, imageUrl, options } = parsed.data;

  let normalizedPngBuffer: Buffer;
  try {
    const inputBuffer = imageBase64
      ? decodeBase64Image(imageBase64)
      : await fetchProjectStorageImage(imageUrl!);

    // 1. Normalize image to PNG buffer for segmentation model
    normalizedPngBuffer = await sharp(inputBuffer, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate() // auto-orient based on EXIF
      .resize({
        width: SEGMENTATION_MAX_SIDE,
        height: SEGMENTATION_MAX_SIDE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
  } catch (error) {
    if (error instanceof ImageInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.warn('[EnhanceImage] Unreadable input image:', error);
    return NextResponse.json(
      { error: 'Image illisible. Formats acceptés : JPEG, PNG, WebP.' },
      { status: 422 }
    );
  }

  try {
    let transparentBuffer: Buffer;
    let segmented = true;

    try {
      // 2. Perform AI Segmentation / Background Removal
      const inputBlob = new Blob([new Uint8Array(normalizedPngBuffer)], { type: 'image/png' });
      const isolatedBlob = await removeBackground(inputBlob);
      transparentBuffer = Buffer.from(await isolatedBlob.arrayBuffer());
    } catch (bgError: unknown) {
      console.warn('[EnhanceImage] Background removal failed, keeping original background:', bgError);
      transparentBuffer = normalizedPngBuffer;
      segmented = false;
    }

    // 3. Studio Standardization (3:4 ratio 1200x1600, 10% margin, soft drop shadow, WebP)
    const enhancedWebpBuffer = await ImageStudioService.enhanceProductPhoto(transparentBuffer, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      paddingPercent: options.paddingPercent ?? 0.10,
      shadow: options.shadow ?? true,
      shadowIntensity: options.shadowIntensity ?? 0.22,
      quality: options.quality ?? 90,
    });

    return NextResponse.json({
      success: true,
      imageBase64: `data:image/webp;base64,${enhancedWebpBuffer.toString('base64')}`,
      mimeType: 'image/webp',
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      segmented,
    });
  } catch (error: unknown) {
    console.error('[EnhanceImage] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'amélioration de l\'image en Studio Pro.' },
      { status: 500 }
    );
  }
}
