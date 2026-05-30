import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v43.0 - UNIFIED INTERNAL VIEW ARCHITECTURE
 * Menggunakan folder internal _view untuk melayani Subdomain & Custom Domain.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. SKIP UNTUK FILE SISTEM, API, & ASSETS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  const hostOnly = host.split(':')[0].toLowerCase().replace('www.', '');
  
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 'u',
    'verify-email', 'forgot-password', 'auth', 'reviews', '_view'
  ];
  const firstSegment = pathname.split('/')[1];

  const isLocal = hostOnly.includes('localhost') || hostOnly.includes('127.0.0.1');
  const isMainDomain = hostOnly === mainDomain || hostOnly.endsWith('.web.app') || hostOnly.endsWith('.firebaseapp.com');

  // A. LOGIKA CUSTOM DOMAIN (Misal: budi.com)
  if (!isMainDomain && !isLocal && !hostOnly.endsWith(mainDomain)) {
    // Rewrite internal ke folder _view dengan prefix d:
    url.pathname = `/_view/d:${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // B. LOGIKA SUBDOMAIN (user.linku.biz.id)
  if (hostOnly.endsWith(mainDomain) && hostOnly !== mainDomain) {
    const subdomain = hostOnly.replace(`.${mainDomain}`, '');
    
    // Abaikan rute sistem
    if (reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // Rewrite internal ke folder _view dengan prefix u:
    url.pathname = `/_view/u:${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
