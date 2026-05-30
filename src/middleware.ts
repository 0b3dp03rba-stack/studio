import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v52.0 - UNIFIED ROUTE RESOLUTION
 * Mengatasi 404 dengan isolasi rute internal yang bersih.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // 1. Ambil Hostname asli dan bersihkan
  const rawHost = req.headers.get('host') || '';
  const hostname = rawHost.toLowerCase().trim().split(':')[0];

  // 2. TAMENG UTAMA: Loloskan aset statis, API, dan rute internal Next.js
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. TAMENG LOOP: Jika sudah di rute internal _view, jangan diproses lagi
  if (url.pathname.startsWith('/_view')) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  
  // 4. LOGIKA DOMAIN UTAMA (Dashboard & Landing Page)
  const isMainDomain = hostname === mainDomain || hostname === `www.${mainDomain}`;

  if (isMainDomain) {
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];

    // Daftar rute sistem yang dilindungi
    const reservedPaths = [
      'dashboard', 'login', 'register', 'auth', 'premium', 
      'admin', 'reviews', 'verify-email', 'forgot-password'
    ];
    
    if (!firstSegment || reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // Redirect link lama linku.biz.id/username ke username.linku.biz.id
    const remainingPath = url.pathname.replace(`/${firstSegment}`, '');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    return NextResponse.redirect(
      new URL(`${protocol}://${firstSegment}.${mainDomain}${remainingPath}${url.search}`, req.url),
      301
    );
  }

  // 5. LOGIKA SUBDOMAIN & CUSTOM DOMAIN (Melayani Halaman Publik)
  const isSubdomain = !isMainDomain && hostname.endsWith(mainDomain);
  
  if (isSubdomain) {
    const subdomain = hostname.replace(`.${mainDomain}`, '').replace('www.', '');
    const systemSubdomains = ['admin', 'sys', 'apps', 'www'];
    
    if (systemSubdomains.includes(subdomain) || subdomain === '') {
      return NextResponse.next();
    }

    // Rewrite ke dapur internal dengan label u:
    url.pathname = `/_view/u:${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 6. LOGIKA CUSTOM DOMAIN PREMIUM
  if (!isMainDomain && !isSubdomain) {
    const cleanCustomDomain = hostname.replace('www.', '');
    
    // Rewrite ke dapur internal dengan label d:
    url.pathname = `/_view/d:${cleanCustomDomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
