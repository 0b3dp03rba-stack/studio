import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v47.0 - ULTIMATE SUBDOMAIN MIDDLEWARE
 * Mengatur transisi dari Path-based (/username) ke Subdomain-based (username.linku.biz.id).
 * Memberikan isolasi ketat antar domain sistem, subdomain, dan domain kustom.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. EXIT STRATEGY (Proteksi Loop & Flag [L])
  // Jangan proses file sistem, api, folder internal viewer, atau rute yang sudah di-rewrite
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_view') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    req.headers.has('x-nextjs-rewrite')
  ) {
    return NextResponse.next();
  }

  // --- KONFIGURASI DOMAIN ---
  const mainDomain = 'linku.biz.id';
  const hostOnly = host.split(':')[0].toLowerCase();
  
  // Jalur sistem yang tidak boleh diganggu gugat
  const reservedPaths = [
    '/dashboard', '/login', '/register', '/admin', '/u',
    '/verify-email', '/forgot-password', '/auth', '/reviews'
  ];
  
  const isMainHost = hostOnly === mainDomain || hostOnly === `www.${mainDomain}`;
  
  // Host pengembangan & preview Firebase
  const systemHosts = [
    'localhost',
    '127.0.0.1',
    'web.app',
    'firebaseapp.com',
    'firebase.google.com',
    'cloudworkstations.dev'
  ];
  const isSystemHost = systemHosts.some(sh => hostOnly === sh || hostOnly.endsWith('.' + sh));

  // 2. ATURAN REDIRECT 301 (Jalur LAMA /username -> Beranda Utama)
  // Jika diakses via linku.biz.id/[apapun] dan bukan rute sistem, buang ke home
  if (isMainHost && pathname !== '/' && !reservedPaths.some(p => pathname.startsWith(p))) {
    const rootUrl = new URL('/', `https://${mainDomain}`);
    return NextResponse.redirect(rootUrl, 301);
  }

  // 3. ATURAN INTERNAL REWRITE (Subdomain -> Folder Dapur _view)
  // Menangani username.linku.biz.id
  if (hostOnly.endsWith('.' + mainDomain)) {
    const subdomain = hostOnly.replace('.' + mainDomain, '').replace('www.', '');
    
    // Pastikan subdomain bukan 'www'
    if (subdomain && subdomain !== 'www') {
      url.pathname = `/_view/u:${subdomain}${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // 4. ATURAN CUSTOM DOMAIN (budi.com -> Folder Dapur _view)
  // Menangani domain pribadi pengguna yang diarahkan ke Linku
  if (!isMainHost && !isSystemHost && !hostOnly.endsWith('.' + mainDomain)) {
    url.pathname = `/_view/d:${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Matcher ketat untuk mengecualikan aset statis demi performa middleware
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
