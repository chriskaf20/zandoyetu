import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Ni fichiers statiques, ni manifeste / service worker PWA (accessibles sans session)
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
