import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v45.0 - PRO PREVIEW & STRICT HOST
 * Menerapkan logika 'RewriteCond' versi Next.js untuk mencegah Loop dan 404 pada Dashboard.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. EXIT STRATEGY (Flag [L] - Jangan proses file sistem, api, atau folder internal)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_view') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  // Bersihkan host dari port saja (jangan hapus www untuk deteksi sistem)
  const hostOnly = host.split(':')[0].toLowerCase();
  
  // 2. RESERVED PATH PROTECTION (Rute sistem selalu boleh diakses di host mana saja tanpa rewrite)
  const reservedPaths = [
    '/dashboard', '/login', '/register', '/admin', '/u',
    '/verify-email', '/forgot-password', '/auth', '/reviews'
  ];
  
  if (reservedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 3. SYSTEM HOST DETECTION (Domain yang dianggap sebagai "Main Console")
  const systemHosts = [
    'linku.biz.id',
    'www.linku.biz.id',
    'localhost',
    '127.0.0.1',
    'web.app',
    'firebaseapp.com',
    'firebase.google.com', // KHUSUS PREVIEW STUDIO
    'cloudworkstations.dev' // KHUSUS DEV ENVIRONMENT
  ];

  const isSystemHost = systemHosts.some(sh => hostOnly === sh || hostOnly.endsWith('.' + sh));

  // A. LOGIKA DOMAIN SISTEM (linku.biz.id / preview)
  if (isSystemHost && !hostOnly.includes(mainDomain)) {
    // Jika di localhost atau domain preview tanpa subdomain kustom
    if (!hostOnly.includes('.') || hostOnly === 'localhost' || hostOnly.endsWith('firebase.google.com')) {
       return NextResponse.next();
    }
  }

  // B. LOGIKA SUBDOMAIN RESMI (user.linku.biz.id)
  if (hostOnly.endsWith('.' + mainDomain)) {
    const subdomain = hostOnly.replace('.' + mainDomain, '').replace('www.', '');
    url.pathname = `/_view/u:${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // C. LOGIKA CUSTOM DOMAIN (budi.com) - Jika bukan domain sistem dan bukan subdomain resmi
  if (!isSystemHost) {
    url.pathname = `/_view/d:${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
