import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

/**
 * @fileOverview Middleware Linku Engine v10.0 (Universal Subdomain & Auto-Redirect)
 * Menangani routing cerdas untuk subdomain dan memaksa redirect linku.biz.id/user ke user.linku.biz.id
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

  // 2. DAFTAR PATH SISTEM (Tidak boleh jadi subdomain)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');
  const protocol = req.headers.get('x-forwarded-proto') || (isLocalhost ? 'http' : 'https');

  // Hanya jalankan fitur Subdomain di Localhost atau Domain Produksi (Kustom Domain)
  // Untuk Workstation/Vercel App, gunakan path-based routing untuk menghindari SSL error
  const supportsSubdomain = isLocalhost || isProduction;

  let subdomain = '';
  const hostParts = host.split('.');

  if (isLocalhost) {
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (isProduction) {
    // gunxmodz.linku.biz.id -> parts = [gunxmodz, linku, biz, id] (length 4)
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // 3. LOGIKA AUTO-REDIRECT: linku.biz.id/user -> user.linku.biz.id
  if (supportsSubdomain && !cleanSubdomain) {
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const remainingPath = segments.slice(2).join('/');
      const destination = isLocalhost ? 'localhost:9002' : host;
      
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment.toLowerCase()}.${destination}${remainingPath ? '/' + remainingPath : ''}`, req.url),
        301
      );
    }
  }

  // 4. LOGIKA INTERNAL REWRITE: Subdomain -> Folder Profil
  if (supportsSubdomain && cleanSubdomain && cleanSubdomain !== 'www') {
    // Cegah akses halaman sistem lewat subdomain
    const firstSegment = pathname.split('/')[1];
    if (reservedPaths.includes(firstSegment)) {
      const mainHost = isLocalhost ? 'localhost:9002' : host.replace(`${subdomain}.`, '');
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // Arahkan secara internal ke /username/[path]
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
