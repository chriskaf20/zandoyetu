/**
 * Validation des images reçues par les routes API (taille, origine).
 */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Longueur maximale d'une data URL base64 correspondant à MAX_IMAGE_BYTES */
export const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 100;

const FETCH_TIMEOUT_MS = 10_000;

const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dimhzfxztyvbtljdyhqq.supabase.co'
).host;

export class ImageInputError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export function decodeBase64Image(dataUrl: string): Buffer {
  const clean = dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  const buffer = Buffer.from(clean, 'base64');

  if (buffer.length === 0) {
    throw new ImageInputError('Image vide ou mal encodée.');
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ImageInputError('Image trop lourde (8 Mo maximum).', 413);
  }
  return buffer;
}

/**
 * Télécharge une image publique du Storage Supabase du projet.
 * Toute autre origine est refusée (protection SSRF), redirections comprises.
 */
export async function fetchProjectStorageImage(rawUrl: string): Promise<Buffer> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ImageInputError('URL d\'image invalide.');
  }

  if (
    url.protocol !== 'https:' ||
    url.host !== supabaseHost ||
    !url.pathname.startsWith('/storage/v1/object/public/')
  ) {
    throw new ImageInputError('Seules les images hébergées sur Zando Yetu peuvent être traitées.');
  }

  let res: Response;
  try {
    res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new ImageInputError('Impossible de charger l\'image (délai dépassé ou réseau).', 502);
  }

  if (!res.ok) {
    throw new ImageInputError(`Impossible de charger l'image (${res.status}).`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new ImageInputError('Le fichier distant n\'est pas une image.');
  }

  const declaredLength = Number(res.headers.get('content-length') || 0);
  if (declaredLength > MAX_IMAGE_BYTES) {
    throw new ImageInputError('Image trop lourde (8 Mo maximum).', 413);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new ImageInputError('Image trop lourde (8 Mo maximum).', 413);
  }
  return buffer;
}
