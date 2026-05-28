
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware untuk menangani sistem subdomain dinamis.
 * Mengubah [username].linku.biz.id menjadi rute internal /[username].
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Daftar host utama yang diabaikan (tidak dianggap sebagai username)
  const mainDomains = [
    'linku.biz.id',
    'www.linku.biz.id',
    'localhost:9002',
    'admin.linku.biz.id'
  ];

  // Cek apakah host saat ini adalah domain utama atau workspace development
  const isMainDomain = mainDomains.some(domain => hostname === domain || hostname.includes('cloudworkstations.dev'));

  if (!isMainDomain && hostname.endsWith('.linku.biz.id')) {
    // Ambil bagian pertama dari hostname (username)
    const subdomain = hostname.split('.')[0].toLowerCase();

    // Abaikan jika ini file statis, aset Next.js, atau rute API
    if (
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/api') ||
      url.pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Jangan lakukan rewrite untuk halaman sistem (Dashboard, Login, dll)
    const reservedPaths = ['/dashboard', '/login', '/register', '/admin', '/verify-email', '/forgot-password', '/auth', '/reviews'];
    const isReserved = reservedPaths.some(path => url.pathname.startsWith(path));

    if (!isReserved) {
      // Rewrite secara internal: budi.linku.biz.id -> /budi
      url.pathname = `/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (public files)
     * 4. all root files inside public (e.g. /favicon.ico)
     */
    '/((?!api|_next|static|[\\w-]+\\.\\w+).*)',
  ],
};
