
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
    'localhost:9002',
    'www.linku.biz.id',
    'admin.linku.biz.id' // Jika ingin admin punya subdomain sendiri nanti
  ];

  // Cek apakah host saat ini adalah domain utama
  const isMainDomain = mainDomains.some(domain => hostname === domain);

  if (!isMainDomain && hostname.endsWith('.linku.biz.id')) {
    // Ambil bagian pertama dari hostname (username)
    const subdomain = hostname.split('.')[0].toLowerCase();

    // Pastikan bukan favicon atau file statis lainnya
    if (
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/api') ||
      url.pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Rewrite secara internal: budi.linku.biz.id/g/folder -> /budi/g/folder
    url.pathname = `/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
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
