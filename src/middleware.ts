
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal untuk Multi-Subdomain.
 * Mendukung: linku.biz.id, *.vercel.app, *.cloudworkstations.dev, dan localhost.
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

  // 3. Deteksi Subdomain secara Dinamis
  let subdomain = '';

  if (hostname.includes('localhost')) {
    // Localhost: user.localhost:9002 -> subdomain: user
    const parts = hostname.split('.');
    if (parts.length > 1 && !parts[0].includes('localhost')) {
      subdomain = parts[0];
    }
  } else {
    // Domain Publik (linku.biz.id, vercel.app, cloudworkstations.dev)
    const rootDomains = ['linku.biz.id', 'vercel.app', 'cloudworkstations.dev'];
    
    for (const root of rootDomains) {
      if (hostname.endsWith(`.${root}`)) {
        // Ambil teks sebelum root domain
        const prefix = hostname.replace(`.${root}`, '');
        const parts = prefix.split('.');
        
        // Kasus linku.biz.id: budi.linku.biz.id (parts: ["budi"])
        if (root === 'linku.biz.id' && parts.length === 1) {
          subdomain = parts[0];
        } 
        // Kasus Vercel/Workstation: budi.my-app.vercel.app (parts: ["budi", "my-app"])
        else if (parts.length > 1) {
          subdomain = parts[0];
        }
        break;
      }
    }
  }

  // 4. Proses Rewrite jika subdomain valid (bukan www, admin, dll)
  const systemSubdomains = ['www', 'api', 'admin', 'mail', 'auth', 'support'];
  if (subdomain && !systemSubdomains.includes(subdomain.toLowerCase())) {
    // Secara internal arahkan ke halaman profile /[username]
    url.pathname = `/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware pada semua path kecuali yang dikecualikan di atas
     */
    '/((?!api|_next|static|[\\w-]+\\.\\w+).*)',
  ],
};
