
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

  // 3. LOGIKA REDIRECT (Path -> Subdomain)
  // Jika user mengakses linku.biz.id/username, kita paksa redirect ke username.linku.biz.id
  if (!isReserved && pathname !== '/') {
    const segments = pathname.split('/').filter(Boolean);
    
    // Pastikan ini adalah path username (hanya 1 segment, misal: /budi)
    if (segments.length === 1) {
      const username = segments[0];
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

      // Hanya lakukan redirect pada domain produksi atau localhost
      if (hostname === 'linku.biz.id' || hostname === 'localhost:9002') {
        const targetHost = hostname === 'localhost:9002' ? `${username}.localhost:9002` : `${username}.linku.biz.id`;
        return NextResponse.redirect(new URL(`${protocol}://${targetHost}/`), 301);
      }
    }
  }

  // 4. LOGIKA REWRITE (Subdomain -> Internal Page)
  let subdomain = '';

  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && !parts[0].includes('localhost')) {
      subdomain = parts[0];
    }
  } else if (hostname.endsWith('.linku.biz.id')) {
    const part = hostname.replace('.linku.biz.id', '');
    if (part && part !== 'www' && part !== 'linku') {
      subdomain = part;
    }
  }

  // Jika terdeteksi subdomain, lakukan rewrite internal ke /[username]
  if (subdomain) {
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
