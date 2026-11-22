import sharp, { OverlayOptions } from 'sharp';

export interface StudioEnhanceOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  paddingPercent?: number;
  quality?: number;
  shadow?: boolean;
  shadowIntensity?: number;
}

export class ImageStudioService {
  /**
   * Enhances a transparent product photo into a high-end 3:4 studio asset.
   * - Trims excess empty transparent bounds
   * - Centers and scales subject to fit 3:4 canvas with 10% safety margin
   * - Renders a realistic soft base contact drop-shadow
   * - Encodes to ultra-clean optimized WebP
   */
  static async enhanceProductPhoto(
    transparentPngBuffer: Buffer,
    options: StudioEnhanceOptions = {}
  ): Promise<Buffer> {
    const canvasWidth = options.width || 1200;
    const canvasHeight = options.height || 1600; // 3:4 ratio standard for fashion & e-commerce
    const paddingPercent = options.paddingPercent ?? 0.10;
    const quality = options.quality || 90;
    const shadow = options.shadow ?? true;
    const shadowIntensity = options.shadowIntensity ?? 0.22;

    // 1. Trim empty transparent edges to isolate true product bounding box
    const trimmedSubject = await sharp(transparentPngBuffer)
      .trim()
      .png()
      .toBuffer({ resolveWithObject: true });

    const trimmedWidth = trimmedSubject.info.width;
    const trimmedHeight = trimmedSubject.info.height;

    // 2. Compute max bounded dimensions (80% of canvas with 10% margins)
    const maxAvailableWidth = Math.round(canvasWidth * (1 - paddingPercent * 2));
    const maxAvailableHeight = Math.round(canvasHeight * (1 - paddingPercent * 2));

    // Calculate scale factor preserving aspect ratio
    const scaleFactor = Math.min(
      maxAvailableWidth / trimmedWidth,
      maxAvailableHeight / trimmedHeight,
      1.5 // prevent over-upscaling blurry artifacts
    );

    const targetSubjectWidth = Math.max(1, Math.round(trimmedWidth * scaleFactor));
    const targetSubjectHeight = Math.max(1, Math.round(trimmedHeight * scaleFactor));

    // 3. Resize trimmed subject with Lanczos3 resampling
    const resizedSubjectBuffer = await sharp(trimmedSubject.data)
      .resize(targetSubjectWidth, targetSubjectHeight, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false,
      })
      .png()
      .toBuffer();

    // 4. Compute centered position
    const posX = Math.round((canvasWidth - targetSubjectWidth) / 2);
    const posY = Math.round((canvasHeight - targetSubjectHeight) / 2);

    // 5. Generate Studio Background Canvas (Clean luminous gradient)
    const bgSvg = `
      <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="studioGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FCFCFD" />
            <stop offset="60%" stop-color="#F7F8FA" />
            <stop offset="100%" stop-color="#EEF0F3" />
          </linearGradient>
        </defs>
        <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#studioGrad)" />
      </svg>
    `;

    const compositeLayers: OverlayOptions[] = [];

    // 6. Generate Soft Base Contact Shadow if enabled
    if (shadow) {
      const shadowWidth = Math.round(targetSubjectWidth * 0.85);
      const shadowHeight = Math.max(18, Math.round(targetSubjectHeight * 0.08));
      const shadowX = Math.round((canvasWidth - shadowWidth) / 2);
      const shadowY = Math.min(
        canvasHeight - shadowHeight - 10,
        posY + targetSubjectHeight - Math.round(shadowHeight * 0.35)
      );

      const shadowSvg = `
        <svg width="${shadowWidth}" height="${shadowHeight}" viewBox="0 0 ${shadowWidth} ${shadowHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="dropShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#0F172A" stop-opacity="${shadowIntensity}" />
              <stop offset="40%" stop-color="#1E293B" stop-opacity="${shadowIntensity * 0.6}" />
              <stop offset="75%" stop-color="#334155" stop-opacity="${shadowIntensity * 0.2}" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="${shadowWidth / 2}" cy="${shadowHeight / 2}" rx="${shadowWidth / 2}" ry="${shadowHeight / 2}" fill="url(#dropShadow)" />
        </svg>
      `;

      compositeLayers.push({
        input: Buffer.from(shadowSvg),
        top: shadowY,
        left: shadowX,
      });
    }

    // 7. Add Centered Subject Layer
    compositeLayers.push({
      input: resizedSubjectBuffer,
      top: posY,
      left: posX,
    });

    // 8. Composite everything onto the background and output high-quality WebP
    const finalEnhancedBuffer = await sharp(Buffer.from(bgSvg))
      .composite(compositeLayers)
      .webp({
        quality,
        effort: 6,
        smartSubsample: true,
      })
      .toBuffer();

    return finalEnhancedBuffer;
  }
}
