import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v23.0 - FIX IP & SYSTEM HOST DETECTION
 * Perbaikan: Mengabaikan IP (127.0.0.1) dan host internal agar tidak dianggap subdomain.
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

  const mainDomain = 'linku.biz.id';
  const hostParts = host.split(':')[0]; // Ambil domain saja tanpa port
  
  // Deteksi jika host adalah alamat IP (seperti 127.0.0.1)
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostParts);
  const isLocalhost = host.includes('localhost');
  
  // Deteksi jika kita berada di domain sistem (Workstation / Firebase Studio)
  const isSystemHost = 
    isIP ||
    isLocalhost || 
    host.includes('firebase.google.com') || 
    host.includes('web.app') || 
    host.includes('firebaseapp.com') ||
    host === mainDomain || 
    host === `www.${mainDomain}`;

  // Rute sistem yang HANYA boleh di domain utama
  const reservedPaths = [
    'dashboard', 'login', 'register', 'admin', 
    'verify-email', 'forgot-password', 'auth', 'reviews', 'u', '_domain'
  ];

  const firstSegment = pathname.split('/')[1];

  // A. JIKA AKSES RUTE RESERVED DI DOMAIN SISTEM -> BIARKAN (JANGAN DIAPA-APAIN)
  if (isSystemHost && reservedPaths.includes(firstSegment)) {
    return NextResponse.next();
  }

  // B. AKSES VIA CUSTOM DOMAIN (Bukan domain sistem kita)
  // Syarat: Bukan domain sistem kita DAN bukan subdomain dari linku.biz.id
  if (!isSystemHost && !host.endsWith(mainDomain)) {
    url.pathname = `/_domain/${host}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // C. AKSES VIA SUBDOMAIN (Contoh: budi.linku.biz.id atau budi.localhost:9002)
  let subdomain = '';
  
  // Hanya proses subdomain jika itu di main domain atau localhost (BUKAN ALAMAT IP)
  if (!isIP) {
    if (host.endsWith(mainDomain) && host !== mainDomain && host !== `www.${mainDomain}`) {
      subdomain = host.replace(`.${mainDomain}`, '').replace('www.', '');
    } else if (isLocalhost && host.split('.').length > 1 && !host.startsWith('localhost')) {
      subdomain = host.split('.')[0];
    }
  }

  const cleanSubdomain = subdomain.toLowerCase();

  // Jika terdeteksi subdomain asli (bukan www atau IP)
  if (cleanSubdomain && cleanSubdomain !== 'www' && !isIP) {
    // Keamanan: Jika buka rute reserved di subdomain, biarkan atau lempar ke domain utama
    if (reservedPaths.includes(firstSegment)) {
      return NextResponse.next(); 
    }

    // INTERNAL REWRITE: Petakan subdomain ke folder /[username] secara transparan
    url.pathname = `/${cleanSubdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // D. AKSES VIA PATH DI DOMAIN UTAMA (Contoh: linku.biz.id/budi)
  // Redirect ke Subdomain hanya berlaku di domain produksi asli
  if (host === mainDomain && firstSegment && !reservedPaths.includes(firstSegment)) {
    return NextResponse.redirect(
      new URL(`https://${firstSegment.toLowerCase()}.${mainDomain}${pathname.replace(`/${firstSegment}`, '')}`, req.url),
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
