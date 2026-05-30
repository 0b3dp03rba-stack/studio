import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

/**
 * @fileOverview Linku Engine v51.0 - FINAL STABLE ARCHITECTURE
 * Mengatasi ERR_TOO_MANY_REDIRECTS dengan isolasi rute yang sangat ketat.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // 1. Ambil Hostname asli dan bersihkan dari port atau spasi
  const rawHost = req.headers.get('host') || '';
  const hostname = rawHost.toLowerCase().trim().split(':')[0];

  // 2. TAMENG UTAMA: Loloskan langsung semua file aset statis, internal Next.js, dan API
  if (
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.') ||
    req.headers.has('x-nextjs-rewrite')
  ) {
    return NextResponse.next();
  }

  // 3. TAMENG REWRITE: Jika rute internal sudah mengarah ke /_view, segera HENTIKAN proses agar tidak loop
  if (url.pathname.startsWith('/_view')) {
    return NextResponse.next();
  }

  const mainDomain = 'linku.biz.id';
  
  // 4. LOGIKA DETEKSI DOMAIN UTAMA (Dashboard & Landing Page)
  const isMainDomain = hostname === mainDomain || hostname === `www.${mainDomain}`;

  if (isMainDomain) {
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];

    // Daftar rute internal dashboard/sistem yang tidak boleh di-redirect
    const reservedPaths = [
      'dashboard', 'login', 'register', 'auth', 'premium', 
      'admin', 'reviews', 'verify-email', 'forgot-password'
    ];
    
    if (!firstSegment || reservedPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // Redirect link lama linku.biz.id/username ke username.linku.biz.id (301 Permanent)
    const remainingPath = url.pathname.replace(`/${firstSegment}`, '');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    return NextResponse.redirect(
      new URL(`${protocol}://${firstSegment}.${mainDomain}${remainingPath}${url.search}`, req.url),
      301
    );
  }

  // 5. LOGIKA DETEKSI SUBDOMAIN (username.linku.biz.id)
  const isSubdomain = !isMainDomain && hostname.endsWith(mainDomain);
  
  if (isSubdomain) {
    // Ambil teks subdomain murni (hapus linku.biz.id dan www.)
    const subdomain = hostname.replace(`.${mainDomain}`, '').replace('www.', '');

    // Lewati jika ini subdomain sistem (admin, sys, dll)
    const systemSubdomains = ['admin', 'sys', 'apps', 'www'];
    if (systemSubdomains.includes(subdomain) || subdomain === '') {
      return NextResponse.next();
    }

    // Rewrite internal ke folder /_view/u:[username]
    // Kita tambahkan prefix 'u:' agar ProfileClient tahu ini pencarian berdasarkan username
    url.pathname = `/_view/u:${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 6. LOGIKA CUSTOM DOMAIN PREMIUM (domainuser.com)
  if (!isMainDomain && !isSubdomain) {
    const cleanCustomDomain = hostname.replace('www.', '');
    
    // Rewrite internal ke folder /_view/d:[custom_domain]
    // Kita tambahkan prefix 'd:' agar ProfileClient tahu ini pencarian berdasarkan customDomain
    url.pathname = `/_view/d:${cleanCustomDomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Matcher ketat: Kecualikan file statis, aset, dan favicon demi performa.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
