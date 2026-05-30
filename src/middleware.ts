import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v48.0 - FINAL SUBDOMAIN ARCHITECTURE
 * 1. linku.biz.id -> Aplikasi Utama / Dashboard
 * 2. linku.biz.id/username -> Redirect 301 ke username.linku.biz.id
 * 3. username.linku.biz.id -> Internal Rewrite ke /_view/u:username
 * 4. customdomain.com -> Internal Rewrite ke /_view/d:customdomain.com
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // --- 1. ANTI-LOOP SHIELD (TAMENG UTAMA) ---
  // Jika rute sudah masuk ke folder internal _view, atau sudah hasil rewrite, berhentikan proses.
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
  const isMainHost = hostOnly === mainDomain || hostOnly === `www.${mainDomain}`;
  
  // Rute Sistem yang tidak boleh di-redirect atau di-rewrite
  const reservedPaths = [
    '/dashboard', '/login', '/register', '/admin', '/u',
    '/verify-email', '/forgot-password', '/auth', '/reviews'
  ];

  // --- 2. LOGIKA DOMAIN UTAMA (linku.biz.id) ---
  if (isMainHost) {
    // Cek apakah user mencoba mengakses sub-path (misal: /budi)
    const pathSegments = pathname.split('/').filter(Boolean);
    
    if (pathSegments.length > 0 && !reservedPaths.some(p => pathname.startsWith(p))) {
      const username = pathSegments[0];
      const remainingPath = pathname.replace(`/${username}`, '') || '';
      
      // Redirect 301 ke Subdomain
      // Gunakan protocol yang sesuai (http untuk localhost dev, https untuk prod)
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const targetBase = hostOnly.includes('localhost') ? 'localhost' : mainDomain;
      
      const redirectUrl = `${protocol}://${username}.${targetBase}${remainingPath}`;
      return NextResponse.redirect(new URL(redirectUrl), 301);
    }
    
    return NextResponse.next();
  }

  // --- 3. LOGIKA SUBDOMAIN (username.linku.biz.id) ---
  if (hostOnly.endsWith('.' + mainDomain)) {
    const subdomain = hostOnly.replace('.' + mainDomain, '').replace('www.', '');
    
    if (subdomain && subdomain !== 'www') {
      // Internal Rewrite ke folder _view dengan prefix u: (user)
      url.pathname = `/_view/u:${subdomain}${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // --- 4. LOGIKA CUSTOM DOMAIN (budi.com) ---
  // Daftar host sistem yang harus diabaikan dari rewrite custom domain
  const systemHosts = [
    'localhost', '127.0.0.1', 'web.app', 'firebaseapp.com', 
    'firebase.google.com', 'cloudworkstations.dev'
  ];
  const isSystemHost = systemHosts.some(sh => hostOnly === sh || hostOnly.endsWith('.' + sh));

  if (!isMainHost && !isSystemHost && !hostOnly.endsWith('.' + mainDomain)) {
    // Internal Rewrite ke folder _view dengan prefix d: (domain)
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
