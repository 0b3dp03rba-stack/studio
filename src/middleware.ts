import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v38.0 - FINAL REDIRECT LOOP RESOLUTION
 * Menggunakan pengecekan host yang lebih presisi dan mencegah re-processing pada rute internal.
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
  // Hapus 'www.' dan port untuk standarisasi pengecekan
  const hostOnly = host.split(':')[0].toLowerCase().replace('www.', '');
  
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u', '_domain'
  ];
  const firstSegment = pathname.split('/')[1];

  // A. IDENTIFIKASI SISTEM HOST
  const isSystemHost = 
    hostOnly === mainDomain || 
    hostOnly.endsWith('.web.app') ||
    hostOnly.endsWith('.firebaseapp.com') ||
    hostOnly.includes('localhost') ||
    hostOnly.includes('127.0.0.1');

  // B. LOGIKA CUSTOM DOMAIN (Domain murni milik user, misal: budi.com)
  if (!isSystemHost && !hostOnly.endsWith(mainDomain)) {
    // Cegah loop: Jika rute sudah diawali /_domain, jangan rewrite lagi
    if (pathname.startsWith('/_domain')) {
      return NextResponse.next();
    }
    url.pathname = `/_domain/${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // C. LOGIKA SUBDOMAIN (Contoh: budi.linku.biz.id)
  if (hostOnly.endsWith(mainDomain) && hostOnly !== mainDomain) {
    const subdomain = hostOnly.replace(`.${mainDomain}`, '');
    
    // Jika user mengakses rute sistem (dashboard/login) di subdomain, biarkan saja (jangan rewrite)
    if (reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // PENTING: Mencegah Loop. 
    // Jika Next.js melakukan internal rewrite, pathname mungkin sudah berubah.
    // Kita cek apakah segment pertama sudah cocok dengan subdomain.
    if (firstSegment === subdomain) {
      return NextResponse.next();
    }

    // INTERNAL REWRITE: Petakan ke /[username] secara transparan
    url.pathname = `/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // D. LOGIKA REDIRECT linku.biz.id/budi -> budi.linku.biz.id
  // Hanya berlaku di domain utama untuk user profile path
  if (hostOnly === mainDomain && firstSegment && !reservedPaths.includes(firstSegment)) {
    return NextResponse.redirect(
      new URL(`https://${firstSegment}.${mainDomain}${pathname.replace(`/${firstSegment}`, '')}`, req.url),
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
