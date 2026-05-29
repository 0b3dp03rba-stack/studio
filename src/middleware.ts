import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v16.0 - Real Subdomain System
 * Menangani routing cerdas: user.linku.biz.id -> internal /[username]
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN FILE SISTEM DAN STATIS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. DAFTAR PATH RESERVED (Hanya boleh di domain utama)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');
  
  const protocol = req.headers.get('x-forwarded-proto') || (isLocalhost ? 'http' : 'https');

  // Deteksi Subdomain
  let subdomain = '';
  const hostParts = host.split('.');

  if (isLocalhost) {
    // bobby.localhost:9002 -> subdomain = bobby
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (isProduction) {
    // bobby.linku.biz.id (4 segmen: bobby, linku, biz, id)
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // CASE A: AKSES VIA SUBDOMAIN (Misal: budi.linku.biz.id)
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    const firstSegment = pathname.split('/')[1];
    
    // Keamanan: Jika buka /dashboard di subdomain, lempar ke domain utama
    if (reservedPaths.includes(firstSegment)) {
      const mainHost = isLocalhost ? 'localhost:9002' : 'linku.biz.id';
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // REAL REWRITE: Petakan subdomain ke folder user secara internal
    // URL di browser tetap budi.linku.biz.id, tapi server ambil data dari /[username]
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // CASE B: AKSES VIA PATH DI DOMAIN UTAMA (Misal: linku.biz.id/budi)
  // Kita paksa pindah ke Subdomain demi branding premium (Redirect 301)
  const segments = pathname.split('/');
  const targetUser = segments[1];

  if (targetUser && !reservedPaths.includes(targetUser)) {
    const mainHost = isLocalhost ? 'localhost' : 'linku.biz.id';
    const port = isLocalhost ? ':9002' : '';
    const rest = segments.slice(2).join('/');
    
    return NextResponse.redirect(
      new URL(`${protocol}://${targetUser.toLowerCase()}.${mainHost}${port}${rest ? '/' + rest : ''}`, req.url),
      301
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
