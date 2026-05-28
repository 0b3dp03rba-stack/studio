import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Linku Engine v8.0 (Final Subdomain & Auto-Redirect)
 * Menangani routing internal untuk subdomain dan memaksa redirect linku.biz.id/user ke user.linku.biz.id
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

  // 2. DAFTAR PATH SISTEM (Tidak boleh jadi subdomain atau kena redirect)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  const hostParts = host.split('.');
  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');

  let subdomain = '';

  // 3. LOGIKA DETEKSI SUBDOMAIN
  if (isLocalhost) {
    // bobby.localhost:9002 -> hostParts = [bobby, localhost:9002]
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else {
    // budi.linku.biz.id -> parts = [budi, linku, biz, id] (length 4)
    // budi.customdomain.com -> parts = [budi, customdomain, com] (length 3)
    // Kita ambil bagian pertama jika total bagian > 2 (untuk domain .com) atau > 3 (untuk .biz.id)
    const minParts = host.includes('.biz.id') ? 4 : 3;
    if (hostParts.length >= minParts) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // 4. LOGIKA AUTO-REDIRECT: linku.biz.id/user -> user.linku.biz.id
  // Hanya berjalan jika kita di domain utama TANPA subdomain
  if (!cleanSubdomain) {
    const segments = pathname.split('/');
    const firstSegment = segments[1];

    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const remainingPath = segments.slice(2).join('/');
      const protocol = req.headers.get('x-forwarded-proto') || (isLocalhost ? 'http' : 'https');
      
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment.toLowerCase()}.${host}${remainingPath ? '/' + remainingPath : ''}`, req.url),
        301
      );
    }
  }

  // 5. LOGIKA INTERNAL REWRITE: Subdomain -> Folder Profil
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    // Cegah akses halaman sistem lewat subdomain (pindahkan ke root domain)
    const firstSegment = pathname.split('/')[1];
    if (reservedPaths.includes(firstSegment)) {
      const mainHost = host.replace(`${subdomain}.`, '');
      const protocol = req.headers.get('x-forwarded-proto') || (isLocalhost ? 'http' : 'https');
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
