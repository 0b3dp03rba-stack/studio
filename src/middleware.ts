import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v56.0 - UNIFIED ROUTING SYSTEM
 * Mengarahkan Subdomain dan Custom Domain ke satu "Dapur" (_view) dengan label u: atau d:.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get('host') || '';
  // Bersihkan hostname dari port dan spasi
  const hostname = rawHost.toLowerCase().trim().split(':')[0];

  // 1. TAMENG ASET & API: Loloskan langsung tanpa proses
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. TAMENG INTERNAL: Jika sudah di rute internal _view, hentikan agar tidak loop
  if (url.pathname.startsWith('/_view')) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  
  // 3. DAFTAR DOMAIN SISTEM (Dashboard & Firebase Studio Preview)
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

    // Redirect link LAMA linku.biz.id/username ke username.linku.biz.id (301)
    if (hostname.includes(mainDomain)) {
      const remainingPath = url.pathname.replace(`/${firstSegment}`, '');
      return NextResponse.redirect(
        new URL(`https://${firstSegment}.${mainDomain}${remainingPath}${url.search}`, req.url),
        301
      );
    }
    
    return NextResponse.next();
  }

  // 4. LOGIKA SUBDOMAIN (u:username)
  // Menangani subdomain.linku.biz.id
  const isSubdomain = hostname.endsWith(mainDomain) && hostname !== mainDomain;
  if (isSubdomain) {
    const subdomain = hostname.replace(`.${mainDomain}`, '').replace('www.', '');
    const systemSubdomains = ['admin', 'sys', 'apps', 'www'];
    
    if (systemSubdomains.includes(subdomain) || subdomain === '') {
      return NextResponse.next();
    }

    // REWRITE ke dapur tunggal dengan label u:
    url.pathname = `/_view/u:${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 5. LOGIKA CUSTOM DOMAIN (d:domain.com)
  // Semua yang bukan domain sistem dan bukan subdomain linku dianggap domain premium
  const cleanCustomDomain = hostname.replace('www.', '');
  url.pathname = `/_view/d:${cleanCustomDomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
