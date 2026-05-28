
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal untuk Multi-Subdomain & Path Fallback.
 * Cerdas membedakan kapan harus menggunakan subdomain (Produksi/Localhost) 
 * dan kapan harus menggunakan path (Development/Workstation) untuk menghindari error SSL.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // 1. Abaikan file statis, aset Next.js, dan API
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Daftar path yang dipesan untuk sistem (Dashboard & Auth)
  const reservedPaths = [
    '/dashboard', 
    '/login', 
    '/register', 
    '/admin', 
    '/verify-email', 
    '/forgot-password', 
    '/auth', 
    '/reviews'
  ];
  
  if (reservedPaths.some(path => url.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 3. Logika Deteksi Subdomain Terbatas
  // Kami hanya mengaktifkan rewrite subdomain pada domain yang mendukung Wildcard SSL
  let subdomain = '';

  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && !parts[0].includes('localhost')) {
      subdomain = parts[0];
    }
  } else if (hostname === 'linku.biz.id' || hostname.endsWith('.linku.biz.id')) {
    // Hanya proses jika ini adalah subdomain murni dari linku.biz.id
    const parts = hostname.replace('.linku.biz.id', '').split('.');
    if (parts.length === 1 && parts[0] !== 'www' && parts[0] !== 'linku') {
      subdomain = parts[0];
    }
  }

  // 4. Proses Rewrite jika subdomain valid
  if (subdomain) {
    url.pathname = `/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Jika bukan subdomain, biarkan Next.js menangani rute normal (termasuk /[username])
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|static|[\\w-]+\\.\\w+).*)',
  ],
};
