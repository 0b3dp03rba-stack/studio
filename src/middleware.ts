
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Middleware Universal Linku v3.0 (Anti-Dongo Edition)
 * Menangani Subdomain Wildcard, Auto-Redirect, dan Multi-Environment.
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN INTERNAL & FILE STATIS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. PATH SISTEM (Tidak boleh jadi subdomain/username)
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  // 3. LOGIKA EKSTRAKSI SUBDOMAIN
  // Mendukung: budi.linku.biz.id, budi.localhost:9002, budi.vercel.app
  let subdomain = '';
  const hostParts = host.split('.');

  // Jika di localhost (contoh: budi.localhost:9002)
  if (host.includes('localhost')) {
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } 
  // Jika di domain utama atau vercel (contoh: budi.linku.biz.id)
  else {
    // Kami mengambil bagian pertama jika host memiliki lebih dari 2 bagian (misal: budi.linku.biz.id)
    // atau jika itu adalah wildcard vercel (budi.linkuu.vercel.app)
    if (hostParts.length >= 3) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // 4. LOGIKA REDIRECT (Domain Utama /username -> Subdomain)
  // Hanya jika sedang di domain utama (linku.biz.id) tanpa subdomain
  if (!cleanSubdomain && (host.includes('linku.biz.id') || host.includes('vercel.app'))) {
    const firstSegment = pathname.split('/')[1];
    if (firstSegment && !reservedPaths.includes(firstSegment)) {
      const remainingPath = pathname.split('/').slice(2).join('/');
      // Redirect ke subdomain (pake protocol yang sesuai)
      const protocol = host.includes('localhost') ? 'http' : 'https';
      return NextResponse.redirect(
        new URL(`${protocol}://${firstSegment.toLowerCase()}.${host}${remainingPath ? '/' + remainingPath : ''}`, req.url)
      );
    }
  }

  // 5. LOGIKA REWRITE (Subdomain -> Folder /[username])
  if (cleanSubdomain && cleanSubdomain !== 'www') {
    // Jika user mencoba akses /dashboard lewat subdomain, kembalikan ke domain utama
    const firstSegment = pathname.split('/')[1];
    if (reservedPaths.includes(firstSegment)) {
      // Hilangkan subdomain dari host
      const mainHost = host.replace(`${subdomain}.`, '');
      const protocol = host.includes('localhost') ? 'http' : 'https';
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // Secara internal, arahkan ke rute profil
    // Contoh: budi.linku.biz.id/ -> /budi/
    // Contoh: budi.linku.biz.id/g/folderid -> /budi/g/folderid
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
