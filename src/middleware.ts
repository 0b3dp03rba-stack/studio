import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v50.0 - FINAL UNIFIED ARCHITECTURE
 * 1. linku.biz.id -> Dashboard & Main Site
 * 2. www.any.com -> Cleaned to any.com
 * 3. linku.biz.id/user -> 301 Redirect ke user.linku.biz.id
 * 4. user.linku.biz.id -> Internal Rewrite ke /_view/u:user
 * 5. customdomain.com -> Internal Rewrite ke /_view/d:customdomain.com
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get('host') || '';
  
  // 1. STANDARISASI HOSTNAME: Bersihkan 'www.' dan Port (untuk dev)
  const host = rawHost.replace(/^www\./, '').split(':')[0].toLowerCase();
  
  const mainDomain = 'linku.biz.id';
  const isMainDomain = host === mainDomain;

  // 2. TAMENG UTAMA: Loloskan file statis, API, dan Next.js internal
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.') ||
    req.headers.has('x-nextjs-rewrite')
  ) {
    return NextResponse.next();
  }

  // 3. TAMENG LOOP: Jika request sudah di dalam dapur internal _view, loloskan
  if (url.pathname.startsWith('/_view')) {
    return NextResponse.next();
  }

  // 4. DAFTAR HOST SISTEM (Abaikan rewrite untuk domain preview/internal dev)
  const systemHosts = [
    'localhost', '127.0.0.1', 'web.app', 'firebaseapp.com', 
    'firebase.google.com', 'cloudworkstations.dev'
  ];
  const isSystemHost = systemHosts.some(sh => host === sh || host.endsWith('.' + sh));

  // 5. LOGIKA DOMAIN UTAMA (Dashboard & Redirect)
  if (isMainDomain || isSystemHost) {
    const reservedPaths = [
      'dashboard', 'login', 'register', 'admin', 'u',
      'verify-email', 'forgot-password', 'auth', 'reviews'
    ];

    const pathSegments = url.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];

    // Jika mengakses root atau rute sistem, biarkan lewat
    if (!firstSegment || reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // Jika mengakses link profil LAMA (linku.biz.id/username), Redirect ke Subdomain
    if (isMainDomain) {
      const remainingPath = url.pathname.replace(`/${firstSegment}`, '');
      const protocol = rawHost.includes('localhost') ? 'http' : 'https';
      
      const redirectUrl = `${protocol}://${firstSegment}.${mainDomain}${remainingPath}${url.search}`;
      return NextResponse.redirect(new URL(redirectUrl), 301);
    }
    
    return NextResponse.next();
  }

  // 6. LOGIKA SUBDOMAIN BAWAAN (username.linku.biz.id)
  const isSubdomain = host.endsWith('.' + mainDomain);
  if (isSubdomain) {
    const subdomain = host.replace(`.${mainDomain}`, '');
    
    // Abaikan jika subdomain sistem
    const systemSubdomains = ['admin', 'sys', 'apps', 'www'];
    if (systemSubdomains.includes(subdomain)) {
      return NextResponse.next();
    }

    // Rewrite ke Unified Viewer dengan label User (u:)
    url.pathname = `/_view/u:${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 7. LOGIKA CUSTOM DOMAIN PREMIUM (domainuser.com)
  // Jika host bukan sistem, bukan domain utama, dan bukan subdomain bawaan
  if (!isMainDomain && !isSystemHost && !isSubdomain) {
    // Rewrite ke Unified Viewer dengan label Domain (d:)
    url.pathname = `/_view/d:${host}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Matcher ketat: Kecualikan file statis, aset, dan favicon demi performa.
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
