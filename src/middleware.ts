import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

/**
 * @fileOverview Linku Engine v53.0 - FINAL STABLE ROUTING
 * Memperbaiki deteksi domain sistem dan menghilangkan loop pada rute internal.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get('host') || '';
  const hostname = rawHost.toLowerCase().trim().split(':')[0];

  // 1. TAMENG ASET & API: Loloskan langsung
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. TAMENG INTERNAL REWRITE: Cegah Loop jika sudah di rute internal
  if (url.pathname.startsWith('/_view')) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  
  // 3. DAFTAR DOMAIN SISTEM (Dashboard & Preview Mode)
  // Menambahkan pengecekan untuk lingkungan pengembangan dan preview Firebase
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

    // Rute yang dilindungi di domain utama
    const reservedPaths = [
      'dashboard', 'login', 'register', 'auth', 'premium', 
      'admin', 'reviews', 'verify-email', 'forgot-password'
    ];
    
    if (!firstSegment || reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // Redirect link lama linku.biz.id/username ke username.linku.biz.id
    // HANYA jika di linku.biz.id asli (bukan localhost/preview)
    if (hostname.includes(mainDomain)) {
      const remainingPath = url.pathname.replace(`/${firstSegment}`, '');
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment}.${mainDomain}${remainingPath}${url.search}`, req.url),
        301
      );
    }
    
    return NextResponse.next();
  }

  // 4. LOGIKA SUBDOMAIN (username.linku.biz.id)
  const isSubdomain = hostname.endsWith(mainDomain) && hostname !== mainDomain;
  
  if (isSubdomain) {
    const subdomain = hostname.replace(`.${mainDomain}`, '').replace('www.', '');
    const systemSubdomains = ['admin', 'sys', 'apps', 'www'];
    
    if (systemSubdomains.includes(subdomain) || subdomain === '') {
      return NextResponse.next();
    }

    // REWRITE ke dapur internal dengan label u:
    url.pathname = `/_view/u:${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 5. LOGIKA CUSTOM DOMAIN (Premium)
  const cleanCustomDomain = hostname.replace('www.', '');
  url.pathname = `/_view/d:${cleanCustomDomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
