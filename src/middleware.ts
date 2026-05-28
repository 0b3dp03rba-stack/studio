import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal Linku v7.0 (Sistem Subdomain & Auto-Redirect)
 * Menangani Subdomain Wildcard dan memaksa redirect dari domain.com/user ke user.domain.com
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

  // 2. PATH SISTEM (Tidak boleh jadi subdomain atau memicu redirect)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  const hostParts = host.split('.');
  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');

  let subdomain = '';

  // 3. LOGIKA EKSTRAKSI SUBDOMAIN
  if (isLocalhost) {
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (isProduction) {
    // gunxmodz.linku.biz.id -> parts = [gunxmodz, linku, biz, id]
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // 4. LOGIKA AUTO-REDIRECT: linku.biz.id/user -> user.linku.biz.id
  // Hanya jika kita di domain utama TANPA subdomain
  if (!cleanSubdomain && (isProduction || isLocalhost)) {
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const remainingPath = segments.slice(2).join('/');
      const protocol = isLocalhost ? 'http' : 'https';
      // Pastikan membersihkan www jika ada
      const baseHost = host.replace(/^www\./, '');
      
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment.toLowerCase()}.${baseHost}${remainingPath ? '/' + remainingPath : ''}`, req.url),
        301
      );
    }
  }

  // 5. LOGIKA REWRITE: Subdomain -> Path Profil internal
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    // Cegah akses dashboard/login lewat subdomain (kembalikan ke root domain)
    const firstSegment = pathname.split('/')[1];
    if (reservedPaths.includes(firstSegment)) {
      const mainHost = host.replace(`${subdomain}.`, '');
      const protocol = isLocalhost ? 'http' : 'https';
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // Secara internal arahkan ke file [username]
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
