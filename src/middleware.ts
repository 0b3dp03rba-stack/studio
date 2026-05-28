
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal Linku v5.0 (Final Boss)
 * Menangani Subdomain Wildcard, Auto-Redirect, dan Multi-Environment.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN INTERNAL & FILE STATIS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. PATH SISTEM (Tidak boleh jadi subdomain/username)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  // 3. LOGIKA EKSTRAKSI SUBDOMAIN
  let subdomain = '';
  const hostParts = host.split('.');

  // Deteksi lingkungan (Hanya aktifkan subdomain rewrite di domain utama atau localhost)
  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');

  if (isLocalhost) {
    // tes.localhost:9002 -> hostParts = ["tes", "localhost:9002"]
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (isProduction) {
    // tes.linku.biz.id -> hostParts = ["tes", "linku", "biz", "id"]
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // 4. LOGIKA REDIRECT: linku.biz.id/user -> user.linku.biz.id
  // Hanya berlaku jika kita di domain utama TANPA subdomain
  if (!cleanSubdomain && (isProduction || isLocalhost)) {
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const remainingPath = segments.slice(2).join('/');
      const protocol = isLocalhost ? 'http' : 'https';
      const cleanHost = host.replace(/^www\./, '');
      
      // Redirect permanen ke subdomain
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment.toLowerCase()}.${cleanHost}${remainingPath ? '/' + remainingPath : ''}`, req.url),
        301
      );
    }
  }

  // 5. LOGIKA REWRITE: Subdomain -> Path Profil internal
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    // Jika user mencoba akses path sistem lewat subdomain, kembalikan ke domain utama
    const firstSegment = pathname.split('/')[1];
    if (reservedPaths.includes(firstSegment)) {
      const mainHost = host.replace(`${subdomain}.`, '');
      const protocol = isLocalhost ? 'http' : 'https';
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // Secara internal, arahkan ke rute profil /[username]
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
