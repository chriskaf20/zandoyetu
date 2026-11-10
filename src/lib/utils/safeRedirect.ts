/**
 * N'autorise que les chemins internes (« /checkout ») comme cible de redirection :
 * bloque « https://… », « //evil.com » et « /\evil.com » (open redirect).
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return fallback;
  }
  return raw;
}
