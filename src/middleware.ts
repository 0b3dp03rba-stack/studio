import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v44.0 - STRICT HOST ARCHITECTURE
 * Menerapkan logika 'RewriteCond' versi Next.js untuk mencegah Loop.
 * Memisahkan trafik Main Domain, Subdomain, dan Custom Domain secara absolut.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. EXIT STRATEGY (Flag [L] equivalent)
  // Jangan proses file sistem, api, atau folder internal viewer
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_view') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  // Bersihkan host dari port (untuk testing localhost) dan www
  const hostOnly = host.split(':')[0].toLowerCase().replace('www.', '');
  
  // Daftar rute yang HANYA boleh diakses di domain utama
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 'u',
    'verify-email', 'forgot-password', 'auth', 'reviews'
  ];
  const firstSegment = pathname.split('/')[1];

  const isLocal = hostOnly.includes('localhost') || hostOnly.includes('127.0.0.1');
  const isMainDomain = hostOnly === mainDomain || hostOnly.endsWith('.web.app') || hostOnly.endsWith('.firebaseapp.com');

  // A. LOGIKA DOMAIN UTAMA (linku.biz.id)
  if (isMainDomain || (isLocal && !hostOnly.includes('.'))) {
    // Jika user mencoba akses path yang bukan rute sistem, biarkan sistem menghandle (404 via App Router)
    // Jangan lakukan rewrite apapun di domain utama untuk path-based username
    return NextResponse.next();
  }

  // B. LOGIKA SUBDOMAIN (user.linku.biz.id)
  if (hostOnly.endsWith(mainDomain) || (isLocal && hostOnly.split('.').length > 1)) {
    const subdomain = hostOnly.replace(`.${mainDomain}`, '').replace('.localhost', '');
    
    // Jika subdomain mencoba akses rute sistem (misal: budi.linku.biz.id/dashboard)
    // Biarkan saja, atau bisa di-redirect ke domain utama jika ingin sangat ketat.
    // Tapi untuk keamanan routing internal, kita lakukan rewrite ke folder _view
    url.pathname = `/_view/u:${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // C. LOGIKA CUSTOM DOMAIN (budi.com)
  // Jika host bukan domain utama dan bukan subdomain resmi, anggap sebagai Custom Domain
  url.pathname = `/_view/d:${hostOnly}${pathname}`;
  return NextResponse.rewrite(url);
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
