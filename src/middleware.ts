import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Linku Engine v11.0 (Universal Subdomain & Auto-Redirect)
 * Menangani routing cerdas:
 * 1. Rewrite: subdomain.domain.com -> /subdomain (User Profile)
 * 2. Redirect: domain.com/user -> user.domain.com (Branding)
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN INTERNAL, API, DAN FILE STATIS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
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

  // Fitur Subdomain hanya aktif di Localhost dan Domain Produksi (Kustom)
  // Lingkungan Workstation/Vercel-Preview akan tetap pakai path-based untuk hindari SSL Error
  const supportsSubdomain = isLocalhost || isProduction;

  let subdomain = '';
  const hostParts = host.split('.');

  if (isLocalhost) {
    // user.localhost:9002 -> parts: ['user', 'localhost:9002']
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (isProduction) {
    // user.linku.biz.id -> parts: ['user', 'linku', 'biz', 'id'] (length 4)
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // 3. LOGIKA INTERNAL REWRITE (Subdomain -> Profile)
  // Jika pengunjung datang lewat subdomain (misal: budi.linku.biz.id)
  if (supportsSubdomain && cleanSubdomain && cleanSubdomain !== 'www') {
    // Jika mereka mencoba akses path sistem lewat subdomain (misal: budi.linku.biz.id/dashboard)
    // Kita arahkan balik ke domain utama agar tidak membingungkan
    const firstSegment = pathname.split('/')[1];
    if (reservedPaths.includes(firstSegment)) {
      const mainHost = isLocalhost ? 'localhost:9002' : 'linku.biz.id';
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // INI DIA: Tampilkan isi folder /[username] tapi URL di browser tetap subdomain
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // 4. LOGIKA AUTO-REDIRECT (domain.com/user -> user.domain.com)
  // Jika pengunjung datang lewat domain utama tapi mengetik path username
  if (supportsSubdomain && !cleanSubdomain) {
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const remainingPath = segments.slice(2).join('/');
      const destinationHost = isLocalhost ? 'localhost:9002' : 'linku.biz.id';
      
      // Redirect permanen ke format subdomain yang mewah
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment.toLowerCase()}.${destinationHost}${remainingPath ? '/' + remainingPath : ''}`, req.url),
        301
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
