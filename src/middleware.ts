
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v63.0 - ENTERPRISE ROUTING
 * Menangani Subdomain, Custom Domain, dan Pencegahan Loop Jalur Internal.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get('host') || '';
  
  // 1. Standarisasi Hostname: Bersihkan www dan port
  const hostname = rawHost.toLowerCase().trim().replace(/^www\./, '').split(':')[0];

  // 2. BYPASS: Loloskan aset statis, API, dan rute internal
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/unified') || // Anti-Loop Guard
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  
  // 3. DETEKSI DOMAIN SISTEM (Dashboard & Preview Studio)
  const isSystemHost = 
    hostname === mainDomain || 
    hostname === 'localhost' ||
    hostname.includes('firebaseapp.com') ||
    hostname.includes('web.app') ||
    hostname.includes('cloudworkstations.dev') ||
    hostname.includes('firebase.google.com');

  const pathSegments = url.pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];

  // Rute yang dilindungi (Dashboard/Auth)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'auth', 'premium', 
    'admin', 'reviews', 'verify-email', 'forgot-password'
  ];

  if (isSystemHost) {
    // Jika akses root atau rute sistem, biarkan normal
    if (!firstSegment || reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    /**
     * MODE PREVIEW/LOCAL: Izinkan path-based access /username
     */
    if (hostname !== mainDomain) {
       url.pathname = `/unified/u:${firstSegment}${url.pathname.replace(`/${firstSegment}`, '') || '/'}`;
       return NextResponse.rewrite(url);
    }

    /**
     * MODE PRODUKSI: Redirect linku.biz.id/username ke username.linku.biz.id
     */
    const remainingPath = url.pathname.replace(`/${firstSegment}`, '') || '/';
    return NextResponse.redirect(
      new URL(`https://${firstSegment}.${mainDomain}${remainingPath}${url.search}`, req.url),
      301
    );
  }

  // 4. LOGIKA SUBDOMAIN (u:username)
  const isSubdomain = hostname.endsWith(mainDomain) && hostname !== mainDomain;
  if (isSubdomain) {
    const subdomain = hostname.replace(`.${mainDomain}`, '');
    const systemSubdomains = ['admin', 'sys', 'apps', 'www'];
    
    if (systemSubdomains.includes(subdomain)) {
      return NextResponse.next();
    }

    // Rewrite internal ke dapur unified dengan label u:
    url.pathname = `/unified/u:${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 5. LOGIKA CUSTOM DOMAIN PREMIUM (d:domain.com)
  // Jika sampai sini, berarti host bukan milik sistem & bukan subdomain linku
  url.pathname = `/unified/d:${hostname}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
