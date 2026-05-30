import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v41.0 - PURE SUBDOMAIN ARCHITECTURE
 * Mematikan total rute path-based. Tidak ada redirect. Hanya internal rewrite.
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
    'verify-email', 'forgot-password', 'auth', 'reviews', '_domain', '_subdomain'
  ];
  const firstSegment = pathname.split('/')[1];

  const isLocal = hostOnly.includes('localhost') || hostOnly.includes('127.0.0.1');
  const isMainDomain = hostOnly === mainDomain || hostOnly.endsWith('.web.app') || hostOnly.endsWith('.firebaseapp.com');

  // A. LOGIKA CUSTOM DOMAIN (Milik user, misal: budi.com)
  if (!isMainDomain && !isLocal && !hostOnly.endsWith(mainDomain)) {
    if (pathname.startsWith('/_domain')) return NextResponse.next();
    url.pathname = `/_domain/${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // B. LOGIKA SUBDOMAIN (user.linku.biz.id)
  if (hostOnly.endsWith(mainDomain) && hostOnly !== mainDomain) {
    const subdomain = hostOnly.replace(`.${mainDomain}`, '');
    
    // Jangan ganggu rute sistem (dashboard/admin) meskipun diakses via subdomain
    if (reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // INTERNAL REWRITE ke folder _subdomain
    url.pathname = `/_subdomain/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // C. DOMAIN UTAMA: Proteksi Folder Legacy
  // Jika user mencoba linku.biz.id/username, biarkan Next.js memproses normal 
  // (karena folder [username] sudah dimatikan di page.tsx-nya)
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
