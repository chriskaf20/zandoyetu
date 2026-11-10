import { NextResponse } from 'next/server';

/**
 * Limiteur à fenêtre glissante, en mémoire.
 * Best-effort : en serverless chaque instance a son propre compteur.
 * Pour une limite globale stricte, remplacer par Redis (Upstash) ou une table Supabase.
 */
const buckets = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 5000;

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, hits] of buckets) {
      if (hits.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  const recent = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
    return NextResponse.json(
      { error: `Trop de requêtes. Réessayez dans ${Math.ceil(retryAfterSec / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    );
  }

  recent.push(now);
  buckets.set(key, recent);
  return null;
}
