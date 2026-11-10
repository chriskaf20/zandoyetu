import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dimhzfxztyvbtljdyhqq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbWh6Znh6dHl2YnRsamR5aHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTk0ODUsImV4cCI6MjA5NjEzNTQ4NX0.VvZawR2MC8eiOmfILTDd1iW1bJEnNpWsqAWrAskyQvc';

/** Espaces protégés et rôles autorisés (la RLS reste la protection des données) */
const PROTECTED_AREAS: { prefix: string; roles: string[] }[] = [
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/vendor', roles: ['vendor', 'admin'] },
];

function matchesArea(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const area = PROTECTED_AREAS.find((a) => matchesArea(pathname, a.prefix));
  if (!area) return supabaseResponse;

  // Redirection qui conserve les cookies de session éventuellement rafraîchis
  const redirectTo = (target: URL) => {
    const response = NextResponse.redirect(target);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return redirectTo(loginUrl);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !area.roles.includes(profile.role) || profile.status === 'suspended') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = profile?.role === 'customer' && area.prefix === '/vendor' ? '/become-vendor' : '/';
    homeUrl.search = '';
    return redirectTo(homeUrl);
  }

  return supabaseResponse;
}
