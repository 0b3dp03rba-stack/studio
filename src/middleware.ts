
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal untuk Multi-Subdomain & Auto-Redirect.
 * Menangani:
 * 1. Internal Rewrite: user.linku.biz.id -> /user (tanpa ubah URL)
 * 2. Auto Redirect: linku.biz.id/user -> user.linku.biz.id (memaksa format subdomain)
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Abaikan file statis, aset Next.js, favicon, dan API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Daftar path sistem yang tidak boleh dianggap sebagai username
  const reservedPaths = [
    '/dashboard', 
    '/login', 
    '/register', 
    '/admin', 
    '/verify-email', 
    '/forgot-password', 
    '/auth', 
    '/reviews',
    '/u' // Fallback path untuk profile
  ];
  
  const isReserved = reservedPaths.some(path => pathname.startsWith(path));

  // 3. DETEKSI SUBDOMAIN
  let subdomain = '';
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && !parts[0].includes('localhost')) {
      subdomain = parts[0];
    }
  } else if (hostname.includes('.linku.biz.id')) {
    // Deteksi subdomain di domain produksi
    const part = hostname.split('.linku.biz.id')[0];
    if (part && part !== 'www' && part !== 'linku') {
      subdomain = part;
    }
  }

  // 4. LOGIKA REDIRECT (Path -> Subdomain)
  // Hanya jalankan redirect jika user mengakses domain utama tanpa subdomain
  if (!subdomain && !isReserved && pathname !== '/') {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1) {
      const username = segments[0].toLowerCase();
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      
      // Jika di produksi atau localhost, paksa pindah ke subdomain
      if (hostname.includes('linku.biz.id') || hostname.includes('localhost')) {
        const baseHost = hostname.includes('localhost') ? 'localhost:9002' : 'linku.biz.id';
        return NextResponse.redirect(new URL(`${protocol}://${username}.${baseHost}/`), 301);
      }
    }
  }

  // 5. LOGIKA REWRITE (Subdomain -> Internal Page)
  if (subdomain) {
    // Arahkan gunxmodz.linku.biz.id/apapun ke /gunxmodz/apapun secara internal
    url.pathname = `/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|static|[\\w-]+\\.\\w+).*)',
  ],
};
