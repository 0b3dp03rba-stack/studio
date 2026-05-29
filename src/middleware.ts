import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v15.0 - Real Subdomain System
 * Menangani routing dinamis untuk mengubah budi.linku.biz.id menjadi internal request ke /budi
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN FILE STATIS, API, DAN FAVICON
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. DAFTAR PATH SISTEM (Wajib diakses via domain utama saja)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');
  
  // Deteksi protokol (http untuk lokal, https untuk prod)
  const protocol = req.headers.get('x-forwarded-proto') || (isLocalhost ? 'http' : 'https');

  // Deteksi Subdomain
  let subdomain = '';
  const hostParts = host.split('.');

  if (isLocalhost) {
    // Format: budi.localhost:9002
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (isProduction) {
    // Format: budi.linku.biz.id (4 parts: budi, linku, biz, id)
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // CASE A: PENGUNJUNG MENGGUNAKAN SUBDOMAIN (Misal: budi.linku.biz.id)
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    const firstSegment = pathname.split('/')[1];
    
    // Keamanan: Jika user mencoba akses /dashboard lewat subdomain, lempar ke domain utama
    if (reservedPaths.includes(firstSegment)) {
      const mainDomain = isLocalhost ? 'localhost:9002' : 'linku.biz.id';
      return NextResponse.redirect(new URL(`${protocol}://${mainDomain}${pathname}`, req.url));
    }

    // INTERNAL REWRITE: Sajikan profil tapi biarkan URL tetap di subdomain
    // budi.linku.biz.id/ -> internal server ke /budi
    // budi.linku.biz.id/g/123 -> internal server ke /budi/g/123
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // CASE B: PENGUNJUNG MENGGUNAKAN PATH DI DOMAIN UTAMA (Misal: linku.biz.id/budi)
  // Kita paksa pindah ke subdomain (Auto-Redirect 301) demi branding premium
  const segments = pathname.split('/');
  const targetUser = segments[1];

  if (targetUser && !reservedPaths.includes(targetUser)) {
    const mainHost = isLocalhost ? 'localhost' : 'linku.biz.id';
    const port = isLocalhost ? ':9002' : '';
    const rest = segments.slice(2).join('/');
    
    // Redirect permanen ke subdomain
    return NextResponse.redirect(
      new URL(`${protocol}://${targetUser.toLowerCase()}.${mainHost}${port}${rest ? '/' + rest : ''}`, req.url),
      301
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
