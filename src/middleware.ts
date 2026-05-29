import { NextResponse } from 'next/request';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v39.0 - SUBDOMAIN ARCHITECTURE
 * Memisahkan rute publik (redirect) dan rute subdomain (render).
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. SKIP UNTUK FILE SISTEM & API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  // Standarisasi host (lowercase, hapus www)
  const hostOnly = host.split(':')[0].toLowerCase().replace('www.', '');
  
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 'u',
    'verify-email', 'forgot-password', 'auth', 'reviews', '_domain', '_subdomain'
  ];
  const firstSegment = pathname.split('/')[1];

  // A. IDENTIFIKASI SISTEM HOST
  const isSystemHost = 
    hostOnly === mainDomain || 
    hostOnly.endsWith('.web.app') ||
    hostOnly.endsWith('.firebaseapp.com') ||
    hostOnly.includes('localhost') ||
    hostOnly.includes('127.0.0.1');

  // B. LOGIKA CUSTOM DOMAIN (Domain luar milik user, misal: budi.com)
  if (!isSystemHost && !hostOnly.endsWith(mainDomain)) {
    if (pathname.startsWith('/_domain')) return NextResponse.next();
    url.pathname = `/_domain/${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // C. LOGIKA SUBDOMAIN (user.linku.biz.id)
  if (hostOnly.endsWith(mainDomain) && hostOnly !== mainDomain) {
    const subdomain = hostOnly.replace(`.${mainDomain}`, '');
    
    // Jangan rewrite jika user mau akses dashboard/admin via subdomain (biarkan normal)
    if (reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // INTERNAL REWRITE ke folder rahasia _subdomain
    url.pathname = `/_subdomain/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // D. LOGIKA REDIRECT (linku.biz.id/username -> username.linku.biz.id)
  // Hanya berlaku di domain utama
  if (hostOnly === mainDomain && firstSegment && !reservedPaths.includes(firstSegment)) {
    // 301 Redirect ke subdomain untuk SEO dan UX yang lebih baik
    const newHost = `${firstSegment}.${mainDomain}`;
    const newPath = pathname.replace(`/${firstSegment}`, '') || '/';
    return NextResponse.redirect(
      new URL(`${url.protocol}//${newHost}${newPath}`, req.url),
      301
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
