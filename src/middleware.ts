import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Linku Engine v12.0
 * Fitur:
 * 1. Subdomain Rewrite: budi.linku.biz.id -> internal server ke /budi
 * 2. Auto-Redirect: linku.biz.id/budi -> browser dipaksa ke budi.linku.biz.id
 * 3. Localhost Support: budi.localhost:9002 -> internal server ke /budi
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN FILE STATIS DAN API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. DAFTAR PATH SISTEM (Tidak boleh dianggap sebagai username)
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
    // Format: username.localhost:9002
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (isProduction) {
    // Format: username.linku.biz.id
    // linku.biz.id biasanya punya 3 parts, budi.linku.biz.id punya 4 parts
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // 3. LOGIKA INTERNAL REWRITE (Jika pengunjung datang lewat subdomain)
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    const firstSegment = pathname.split('/')[1];
    
    // Proteksi: Jika mencoba akses path sistem lewat subdomain (misal budi.linku.biz.id/dashboard)
    // Lempar balik ke domain utama (linku.biz.id/dashboard) agar session tetap aman
    if (reservedPaths.includes(firstSegment)) {
      const mainHost = isLocalhost ? 'localhost:9002' : 'linku.biz.id';
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // REWRITE: Tampilkan profil user tapi URL tetap di subdomain
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // 4. LOGIKA AUTO-REDIRECT (Hanya di Produksi/Localhost)
  // Jika pengunjung mengetik domain.com/gunxmodz -> paksa ke gunxmodz.domain.com
  if (!cleanSubdomain || cleanSubdomain === 'www') {
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const mainHost = isLocalhost ? 'localhost' : 'linku.biz.id';
      const port = isLocalhost ? ':9002' : '';
      const remainingPath = segments.slice(2).join('/');
      
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment.toLowerCase()}.${mainHost}${port}${remainingPath ? '/' + remainingPath : ''}`, req.url),
        301 // Permanent Redirect untuk SEO
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
