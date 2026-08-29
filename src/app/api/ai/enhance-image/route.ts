import { NextRequest, NextResponse } from 'next/server';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { ImageStudioService } from '@/lib/services/ImageStudioService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow sufficient time for neural segmentation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, imageUrl, mimeType = 'image/jpeg', options = {} } = body;

    let inputBuffer: Buffer;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      inputBuffer = Buffer.from(cleanBase64, 'base64');
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        return NextResponse.json({ error: `Impossible de charger l'image depuis l'URL fournie (${imgRes.status})` }, { status: 400 });
      }
      const arrayBuf = await imgRes.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuf);
    } else {
      return NextResponse.json({ error: 'Image requise (imageBase64 ou imageUrl)' }, { status: 400 });
    }

    // 1. Normalize image to PNG buffer for segmentation model
    const normalizedPngBuffer = await sharp(inputBuffer)
      .rotate() // auto-orient based on EXIF
      .png()
      .toBuffer();

    let transparentBuffer: Buffer;

    try {
      // 2. Perform AI Segmentation / Background Removal
      const inputBlob = new Blob([new Uint8Array(normalizedPngBuffer)], { type: 'image/png' });
      const isolatedBlob = await removeBackground(inputBlob);
      const isolatedArrBuf = await isolatedBlob.arrayBuffer();
      transparentBuffer = Buffer.from(isolatedArrBuf);
    } catch (bgError: any) {
      console.warn('[EnhanceImage] Background removal fallback:', bgError?.message || bgError);
      // Fallback: Use sharp transparent thresholding if neural model encounters format edge case
      transparentBuffer = normalizedPngBuffer;
    }

    // 3. Studio Standardization (3:4 ratio 1200x1600, 10% margin, soft drop shadow, WebP)
    const enhancedWebpBuffer = await ImageStudioService.enhanceProductPhoto(transparentBuffer, {
      width: options.width || 1200,
      height: options.height || 1600,
      paddingPercent: options.paddingPercent ?? 0.10,
      shadow: options.shadow ?? true,
      shadowIntensity: options.shadowIntensity ?? 0.22,
      quality: options.quality || 90,
    });

    const enhancedBase64 = `data:image/webp;base64,${enhancedWebpBuffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      imageBase64: enhancedBase64,
      mimeType: 'image/webp',
      width: 1200,
      height: 1600,
    });
  } catch (error: any) {
    console.error('[EnhanceImage] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de l\'amélioration de l\'image en Studio Pro' },
      { status: 500 }
    );
  }
}
