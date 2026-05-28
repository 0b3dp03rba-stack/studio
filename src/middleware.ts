
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal Linku
 * Menangani Redirect Otomatis: linku.biz.id/user -> user.linku.biz.id
 * Menangani Internal Rewrite: user.linku.biz.id -> path /user secara gaib
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Abaikan file statis, aset Next.js, dan folder sistem internal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Daftar path yang TIDAK boleh dianggap sebagai username
  const reservedPaths = [
    '/dashboard', 
    '/login', 
    '/register', 
    '/admin', 
    '/verify-email', 
    '/forgot-password', 
    '/auth', 
    '/reviews',
    '/u'
  ];
  
  const isReserved = reservedPaths.some(path => pathname.startsWith(path));

  // 3. IDENTIFIKASI LINGKUNGAN (Produksi vs Localhost)
  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');

  // 4. LOGIKA SUBDOMAIN (Deteksi apakah user sedang di subdomain)
  let subdomain = '';
  if (isLocalhost) {
    const parts = host.split('.');
    if (parts.length > 1 && !parts[0].includes('localhost')) {
      subdomain = parts[0];
    }
  } else if (isProduction) {
    // Jika host adalah user.linku.biz.id, maka subdomain adalah 'user'
    const part = host.split('.linku.biz.id')[0];
    if (part && part !== 'www' && part !== 'linku') {
      subdomain = part;
    }
  }

  // 5. LOGIKA REDIRECT (linku.biz.id/budi -> budi.linku.biz.id)
  // Hanya jalan di domain utama tanpa subdomain
  if (!subdomain && !isReserved && pathname !== '/') {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1) {
      const username = segments[0].toLowerCase();
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      
      if (isProduction || isLocalhost) {
        const baseHost = isLocalhost ? 'localhost:9002' : 'linku.biz.id';
        return NextResponse.redirect(new URL(`${protocol}://${username}.${baseHost}/`), 301);
      }
    }
  }

  // 6. LOGIKA REWRITE (Subdomain -> Internal Page)
  if (subdomain) {
    // Secara internal arahkan user.linku.biz.id ke linku.biz.id/[username]
    // User tetap melihat subdomain di address bar mereka
    url.pathname = `/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
