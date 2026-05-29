import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v17.0 - Real Subdomain & Custom Domain Logic
 * Menangani routing cerdas:
 * 1. user.linku.biz.id -> internal /[username] (Rewrite)
 * 2. linku.biz.id/user -> user.linku.biz.id (Redirect 301)
 * 3. mycustom.com -> internal /[username_owner] (Rewrite - Persiapan Premium)
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

  const isLocalhost = host.includes('localhost');
  const mainDomain = 'linku.biz.id';
  const isMainDomain = host === mainDomain || host === `www.${mainDomain}` || (isLocalhost && host === 'localhost:9002');
  
  // 2. DAFTAR PATH SISTEM (Hanya boleh di domain utama)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  // 3. DETEKSI SUBDOMAIN ATAU CUSTOM DOMAIN
  let subdomain = '';
  if (isLocalhost) {
    const hostParts = host.split('.');
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (!isMainDomain) {
    // Jika bukan domain utama, anggap sebagai subdomain atau custom domain
    const hostParts = host.split('.');
    if (hostParts.length >= 4 && host.endsWith(mainDomain)) {
      // Ini Subdomain: user.linku.biz.id
      subdomain = hostParts[0];
    } else {
      // Ini Custom Domain: budi.com (Implementasi menyusul di v18)
      // Sementara kita biarkan default dulu
      return NextResponse.next();
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // CASE A: AKSES VIA SUBDOMAIN (Misal: budi.linku.biz.id)
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    const firstSegment = pathname.split('/')[1];
    
    // Keamanan: Jika buka rute sistem di subdomain, lempar ke domain utama
    if (reservedPaths.includes(firstSegment)) {
      const protocol = isLocalhost ? 'http' : 'https';
      const mainHost = isLocalhost ? 'localhost:9002' : mainDomain;
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // INTERNAL REWRITE: Petakan subdomain ke folder /[username] secara transparan
    // browser tetap menunjukkan 'budi.linku.biz.id', server ambil isi '/budi'
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // CASE B: AKSES VIA PATH DI DOMAIN UTAMA (Misal: linku.biz.id/budi)
  // Kita paksa pindah ke Subdomain demi branding premium (Redirect 301)
  const segments = pathname.split('/');
  const targetUser = segments[1];

  if (isMainDomain && targetUser && !reservedPaths.includes(targetUser) && segments.length === 2) {
    const protocol = isLocalhost ? 'http' : 'https';
    const mainHost = isLocalhost ? 'localhost' : mainDomain;
    const port = (isLocalhost && host.includes(':')) ? `:${host.split(':')[1]}` : '';
    
    return NextResponse.redirect(
      new URL(`${protocol}://${targetUser.toLowerCase()}.${mainHost}${port}`, req.url),
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
