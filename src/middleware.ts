
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal Linku v2.5
 * Menangani Subdomain Wildcard & Auto-Redirect
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Abaikan file statis, API, dan sistem internal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Daftar path sistem yang TIDAK boleh dijadikan username
  const reservedPaths = [
    'dashboard', 
    'login', 
    'register', 
    'admin', 
    'verify-email', 
    'forgot-password', 
    'auth', 
    'reviews',
    'u'
  ];

  // 3. IDENTIFIKASI LINGKUNGAN & SUBDOMAIN
  const isLocalhost = host.includes('localhost');
  const isProduction = host.includes('linku.biz.id');
  
  let subdomain = '';
  if (isLocalhost) {
    const parts = host.split('.');
    if (parts.length > 1 && !parts[0].includes('localhost')) subdomain = parts[0];
  } else if (isProduction) {
    const parts = host.split('.linku.biz.id');
    // Jika ada bagian sebelum .linku.biz.id dan itu bukan 'www'
    if (parts.length > 1 && parts[0] !== '' && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  }

  // 4. LOGIKA REDIRECT (linku.biz.id/user -> user.linku.biz.id)
  // Hanya jalankan jika kita berada di domain utama (tanpa subdomain)
  if (!subdomain && isProduction) {
    const firstSegment = pathname.split('/')[1];
    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const remainingPath = pathname.split('/').slice(2).join('/');
      // Redirect permanen ke subdomain
      return NextResponse.redirect(
        new URL(`https://${firstSegment.toLowerCase()}.linku.biz.id/${remainingPath}`, req.url),
        301
      );
    }
  }

  // 5. LOGIKA REWRITE (Subdomain -> Profil User)
  if (subdomain) {
    const firstSegment = pathname.split('/')[1];
    
    // Jika user mengakses rute sistem (misal dashboard) lewat subdomain,
    // arahkan kembali ke domain utama agar tidak membingungkan session.
    if (reservedPaths.includes(firstSegment)) {
      const baseDomain = isLocalhost ? 'localhost:9002' : 'linku.biz.id';
      const protocol = isLocalhost ? 'http' : 'https';
      return NextResponse.redirect(new URL(`${protocol}://${baseDomain}${pathname}`, req.url));
    }

    // Secara internal, arahkan permintaan ke folder profil /[username]
    url.pathname = `/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
