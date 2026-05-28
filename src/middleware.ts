
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal Linku v4.0 (Final Boss Edition)
 * Menangani Subdomain Wildcard, Auto-Redirect, dan Multi-Environment (Vercel/Local).
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

  // Deteksi lingkungan
  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');

  if (isLocalhost) {
    // Contoh: budi.localhost:9002 -> hostParts = ["budi", "localhost:9002"]
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (isProduction) {
    // Contoh: budi.linku.biz.id -> hostParts = ["budi", "linku", "biz", "id"]
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // 4. LOGIKA REDIRECT (Domain Utama /username -> Subdomain)
  // Hanya berlaku jika kita di domain utama (linku.biz.id) TANPA subdomain
  if (!cleanSubdomain && (isProduction || isLocalhost)) {
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const remainingPath = segments.slice(2).join('/');
      const protocol = isLocalhost ? 'http' : 'https';
      
      // Bersihkan hostname dari www jika ada
      const cleanHost = host.replace(/^www\./, '');
      
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment.toLowerCase()}.${cleanHost}${remainingPath ? '/' + remainingPath : ''}`, req.url),
        301 // Permanent Redirect untuk SEO
      );
    }
  }

  // 5. LOGIKA REWRITE (Subdomain -> Path Profil /[username])
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    // Jika user mencoba akses path sistem lewat subdomain, kembalikan ke domain utama
    // Misal: budi.linku.biz.id/dashboard -> linku.biz.id/dashboard
    const firstSegment = pathname.split('/')[1];
    if (reservedPaths.includes(firstSegment)) {
      const mainHost = host.replace(`${subdomain}.`, '');
      const protocol = isLocalhost ? 'http' : 'https';
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // Secara internal, arahkan ke rute profil
    // budi.linku.biz.id/ -> /budi/
    // budi.linku.biz.id/g/xyz -> /budi/g/xyz
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
