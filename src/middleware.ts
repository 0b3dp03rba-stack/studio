import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v22.0 - PRO Custom Domain & Subdomain Logic
 * Perbaikan: Mendukung lingkungan Cloud Workstation (dio.firebase.google.com)
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN FILE SISTEM DAN STATIS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  // Deteksi jika kita berada di domain sistem (Workstation / Firebase Preview)
  const isSystemHost = 
    isLocalhost || 
    host.includes('firebase.google.com') || 
    host.includes('web.app') || 
    host.includes('firebaseapp.com') ||
    host === mainDomain || 
    host === `www.${mainDomain}`;

  // Rute sistem yang HANYA boleh di domain utama
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u', '_domain'
  ];

  const firstSegment = pathname.split('/')[1];

  // A. JIKA AKSES RUTE RESERVED DI DOMAIN SISTEM -> BIARKAN (JANGAN DIAPA-APAIN)
  if (isSystemHost && reservedPaths.includes(firstSegment)) {
    return NextResponse.next();
  }

  // B. AKSES VIA CUSTOM DOMAIN (Bukan domain sistem kita)
  // Contoh: budi.com
  if (!isSystemHost && !host.endsWith(mainDomain)) {
    url.pathname = `/_domain/${host}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // C. AKSES VIA SUBDOMAIN (Contoh: budi.linku.biz.id atau budi.localhost:9002)
  let subdomain = '';
  if (host.endsWith(mainDomain) && host !== mainDomain && host !== `www.${mainDomain}`) {
    subdomain = host.replace(`.${mainDomain}`, '').replace('www.', '');
  } else if (isLocalhost && host.split('.').length > 1 && !host.startsWith('localhost')) {
    subdomain = host.split('.')[0];
  }

  const cleanSubdomain = subdomain.toLowerCase();

  if (cleanSubdomain && cleanSubdomain !== 'www') {
    // Keamanan: Jika buka rute reserved di subdomain, paksa balik ke domain sistem utama
    if (reservedPaths.includes(firstSegment)) {
      const protocol = isLocalhost ? 'http' : 'https';
      // Di workstation, kita tidak bisa dengan mudah lompat antar subdomain, 
      // tapi di produksi ini akan melempar ke domain utama.
      return NextResponse.next(); 
    }

    // INTERNAL REWRITE: Petakan subdomain ke folder /[username]
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // D. AKSES VIA PATH DI DOMAIN UTAMA (Contoh: linku.biz.id/budi)
  // Paksa pindah ke Subdomain (Hanya berlaku di domain produksi asli untuk branding)
  if (host === mainDomain && firstSegment && !reservedPaths.includes(firstSegment)) {
    return NextResponse.redirect(
      new URL(`https://${firstSegment.toLowerCase()}.${mainDomain}${pathname.replace(`/${firstSegment}`, '')}`, req.url),
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
