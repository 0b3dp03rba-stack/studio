import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v37.0 - ULTIMATE REDIRECT LOOP FIX
 * Menggunakan logika deteksi host yang lebih ketat untuk mencegah ERR_TOO_MANY_REDIRECTS.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN FILE SISTEM, API, DAN STATIS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  const hostOnly = host.split(':')[0].toLowerCase(); // Ambil domain saja tanpa port
  
  // Deteksi rute sistem yang tidak boleh dipetakan ke subdomain
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u', '_domain'
  ];
  const firstSegment = pathname.split('/')[1];

  // A. DETEKSI DOMAIN SISTEM (Localhost, Vercel, Firebase, atau linku.biz.id)
  const isSystemHost = 
    hostOnly === mainDomain || 
    hostOnly === `www.${mainDomain}` ||
    hostOnly.endsWith('.web.app') ||
    hostOnly.endsWith('.firebaseapp.com') ||
    hostOnly.includes('localhost') ||
    hostOnly.includes('127.0.0.1');

  // B. LOGIKA CUSTOM DOMAIN (Bukan domain kita, bukan subdomain kita)
  // Syarat: Bukan system host DAN tidak mengandung mainDomain
  if (!isSystemHost && !hostOnly.endsWith(mainDomain)) {
    // Hindari double rewrite jika sudah berada di rute internal
    if (pathname.startsWith('/_domain')) {
      return NextResponse.next();
    }
    url.pathname = `/_domain/${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // C. LOGIKA SUBDOMAIN (Contoh: budi.linku.biz.id)
  if (hostOnly.endsWith(mainDomain) && hostOnly !== mainDomain && hostOnly !== `www.${mainDomain}`) {
    const subdomain = hostOnly.replace(`.${mainDomain}`, '').replace('www.', '');
    
    // Keamanan: Jika buka rute sistem di subdomain, biarkan apa adanya (next)
    if (reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // PENTING: Mencegah Loop. Jika pathname sudah diawali dengan username, jangan rewrite lagi.
    if (pathname.startsWith(`/${subdomain}`)) {
      return NextResponse.next();
    }

    // INTERNAL REWRITE: Petakan ke folder /[username] secara transparan
    url.pathname = `/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // D. LOGIKA REDIRECT PATH KE SUBDOMAIN (linku.biz.id/budi -> budi.linku.biz.id)
  // Hanya berlaku di domain produksi utama untuk user profile
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
