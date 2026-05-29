import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v20.0 - PRO Custom Domain & Subdomain Logic
 * Menangani routing untuk:
 * 1. user.linku.biz.id -> internal /[username]
 * 2. linku.biz.id/user -> redirect ke user.linku.biz.id
 * 3. customdomain.com -> internal /_custom/[host] (Untuk pencarian profil via domain)
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. ABAIKAN FILE SISTEM DAN STATIS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const isLocalhost = host.includes('localhost');
  const mainDomain = 'linku.biz.id';
  const isMainDomain = host === mainDomain || host === `www.${mainDomain}` || (isLocalhost && (host === 'localhost:9002' || host === '127.0.0.1:9002'));
  
  // Rute sistem yang HANYA boleh di domain utama
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u'
  ];

  // CASE A: AKSES VIA CUSTOM DOMAIN (Bukan linku.biz.id dan bukan localhost murni)
  // Contoh: budi.com atau www.tokosaya.id
  if (!isMainDomain && !host.endsWith(mainDomain) && !host.endsWith('localhost:9002')) {
    // Kita arahkan ke rute internal khusus untuk lookup domain
    // Format internal: /_custom/[domain_name]
    url.pathname = `/_domain/${host}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // CASE B: AKSES VIA SUBDOMAIN (Contoh: budi.linku.biz.id)
  let subdomain = '';
  if (isLocalhost) {
    const hostParts = host.split('.');
    if (hostParts.length > 1 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }
  } else if (!isMainDomain && host.endsWith(mainDomain)) {
    const hostParts = host.split('.');
    // budi.linku.biz.id punya 4 bagian (budi, linku, biz, id)
    if (hostParts.length >= 4) {
      subdomain = hostParts[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  if (cleanSubdomain && cleanSubdomain !== 'www') {
    const firstSegment = pathname.split('/')[1];
    
    // Keamanan: Jika buka rute sistem di subdomain, lempar ke domain utama
    if (reservedPaths.includes(firstSegment)) {
      const protocol = isLocalhost ? 'http' : 'https';
      const mainHost = isLocalhost ? 'localhost:9002' : mainDomain;
      return NextResponse.redirect(new URL(`${protocol}://${mainHost}${pathname}`, req.url));
    }

    // INTERNAL REWRITE: Petakan subdomain ke folder /[username]
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // CASE C: AKSES VIA PATH DI DOMAIN UTAMA (Contoh: linku.biz.id/budi)
  // Kita paksa pindah ke Subdomain demi branding premium (Redirect 301)
  const segments = pathname.split('/');
  const targetUser = segments[1];

  if (isMainDomain && targetUser && !reservedPaths.includes(targetUser) && segments.length === 2) {
    const protocol = isLocalhost ? 'http' : 'https';
    const mainHost = isLocalhost ? 'localhost' : mainDomain;
    const port = (isLocalhost && host.includes(':')) ? `:${host.split(':')[1]}` : '';
    
    return NextResponse.redirect(
      new URL(`${protocol}://${targetUser.toLowerCase()}.${mainHost}${port}`, req.url),
      301
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
