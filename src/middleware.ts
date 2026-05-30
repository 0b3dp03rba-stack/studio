
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v59.0 - PRODUCTION STABLE ROUTING
 * Menangani Subdomain, Custom Domain, dan Redirect Jalur Lama.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get('host') || '';
  const hostname = rawHost.toLowerCase().trim().split(':')[0];

  // 1. BYPASS: Loloskan aset statis, API, dan rute internal Next.js
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/unified') || // Tameng Anti-Loop internal
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  
  // 2. DETEKSI DOMAIN SISTEM (Dashboard & Preview Studio)
  const isSystemHost = 
    hostname === mainDomain || 
    hostname === `www.${mainDomain}` ||
    hostname === 'localhost' ||
    hostname.includes('firebaseapp.com') ||
    hostname.includes('web.app') ||
    hostname.includes('cloudworkstations.dev') ||
    hostname.includes('firebase.google.com');

  if (isSystemHost) {
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];

    // Rute yang dilindungi (Dashboard/Auth)
    const reservedPaths = [
      'dashboard', 'login', 'register', 'auth', 'premium', 
      'admin', 'reviews', 'verify-email', 'forgot-password'
    ];
    
    // Jika akses root atau rute sistem, biarkan normal
    if (!firstSegment || reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    /**
     * MODE PREVIEW/LOCAL: Izinkan path-based access /username
     */
    if (hostname !== mainDomain && hostname !== `www.${mainDomain}`) {
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

  // 3. LOGIKA SUBDOMAIN (u:username)
  const isSubdomain = hostname.endsWith(mainDomain) && hostname !== mainDomain;
  if (isSubdomain) {
    const subdomain = hostname.replace(`.${mainDomain}`, '').replace('www.', '');
    const systemSubdomains = ['admin', 'sys', 'apps', 'www'];
    
    if (systemSubdomains.includes(subdomain) || subdomain === '') {
      return NextResponse.next();
    }

    // Rewrite internal ke dapur unified dengan label u:
    url.pathname = `/unified/u:${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 4. LOGIKA CUSTOM DOMAIN (d:domain.com)
  const cleanCustomDomain = hostname.replace('www.', '');
  url.pathname = `/unified/d:${cleanCustomDomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
