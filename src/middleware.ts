import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v49.0 - FINAL UNIFIED ARCHITECTURE
 * 1. linku.biz.id -> Dashboard & Main Site
 * 2. linku.biz.id/user -> 301 Redirect ke user.linku.biz.id
 * 3. user.linku.biz.id -> Rewrite ke /_view/u:user
 * 4. customdomain.com -> Rewrite ke /_view/d:customdomain.com
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // --- 1. THE ULTIMATE SHIELD (ANTI-LOOP) ---
  // Jika rute sudah masuk dapur internal, api, atau aset sistem, biarkan lewat.
  if (
    pathname.startsWith('/_view') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    req.headers.has('x-nextjs-rewrite')
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  const hostOnly = host.split(':')[0].toLowerCase();

  // Daftar host sistem yang kebal terhadap rewrite profil publik
  const systemHosts = [
    'localhost', '127.0.0.1', 'web.app', 'firebaseapp.com', 
    'firebase.google.com', 'cloudworkstations.dev'
  ];
  
  const isSystemHost = systemHosts.some(sh => hostOnly === sh || hostOnly.endsWith('.' + sh));
  const isExactMainHost = hostOnly === mainDomain || hostOnly === `www.${mainDomain}`;

  // --- 2. JALUR DOMAIN UTAMA (Dashboard & Redirect) ---
  if (isExactMainHost) {
    const reservedPaths = [
      '/dashboard', '/login', '/register', '/admin', '/u',
      '/verify-email', '/forgot-password', '/auth', '/reviews'
    ];

    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Jika user mengakses path-based lama (linku.biz.id/budi), paksa redirect ke subdomain
    if (pathSegments.length > 0 && !reservedPaths.some(p => pathname.startsWith(p))) {
      const username = pathSegments[0];
      const remainingPath = pathname.replace(`/${username}`, '') || '';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      
      const redirectUrl = `${protocol}://${username}.${mainDomain}${remainingPath}`;
      return NextResponse.redirect(new URL(redirectUrl), 301);
    }
    
    return NextResponse.next();
  }

  // --- 3. JALUR SUBDOMAIN (user.linku.biz.id) ---
  if (hostOnly.endsWith('.' + mainDomain)) {
    const subdomain = hostOnly.replace('.' + mainDomain, '').replace('www.', '');
    if (subdomain && subdomain !== 'www') {
      url.pathname = `/_view/u:${subdomain}${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // --- 4. JALUR CUSTOM DOMAIN (PREMIUM) ---
  // Jika host bukan sistem dan bukan domain utama, otomatis dianggap sebagai domain kustom
  if (!isExactMainHost && !isSystemHost) {
    url.pathname = `/_view/d:${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Matcher ketat: Kecualikan file statis, aset, dan favicon demi performa.
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.).*)',
  ],
};
