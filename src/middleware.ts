import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v40.0 - TOTAL SUBDOMAIN ARCHITECTURE
 * Mematikan total rute path-based dan mewajibkan akses via subdomain.
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
  const isLocal = hostOnly.includes('localhost') || hostOnly.includes('127.0.0.1');
  const isMainDomain = hostOnly === mainDomain || hostOnly.endsWith('.web.app') || hostOnly.endsWith('.firebaseapp.com');

  // B. LOGIKA CUSTOM DOMAIN (Milik user, misal: budi.com)
  if (!isMainDomain && !isLocal && !hostOnly.endsWith(mainDomain)) {
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

    // INTERNAL REWRITE ke folder rahasia _subdomain (TIDAK AKAN LOOP)
    url.pathname = `/_subdomain/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // D. LOGIKA REDIRECT (linku.biz.id/username -> username.linku.biz.id)
  // Hanya berlaku di domain utama jika segmen pertama bukan reserved path
  if ((hostOnly === mainDomain || isLocal) && firstSegment && !reservedPaths.includes(firstSegment)) {
    // PROTEKSI: Jangan redirect jika rute sudah di-rewrite internal
    if (pathname.startsWith('/_subdomain') || pathname.startsWith('/_domain')) {
      return NextResponse.next();
    }

    const newHost = `${firstSegment}.${mainDomain}`;
    const newPath = pathname.replace(`/${firstSegment}`, '') || '/';
    const redirectUrl = isLocal 
      ? `${url.protocol}//${host.replace('localhost', `${firstSegment}.localhost`)}${newPath}`
      : `${url.protocol}//${newHost}${newPath}`;

    return NextResponse.redirect(new URL(redirectUrl, req.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
