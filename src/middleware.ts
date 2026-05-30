import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @fileOverview Linku Engine v46.0 - PRO ANTI-LOOP MIDDLEWARE
 * Mengimplementasikan logika 'RewriteCond' versi Next.js untuk mencegah Loop.
 * Menangani transisi dari Path-based (/username) ke Subdomain-based (username.linku.biz.id).
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. EXIT STRATEGY (Flag [L])
  // Jangan proses file sistem, api, atau folder internal viewer agar tidak terjadi loop
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_view') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // --- KONFIGURASI DOMAIN ---
  const mainDomain = 'linku.biz.id'; // <--- SESUAIKAN DOMAIN UTAMA ANDA DI SINI
  const hostOnly = host.split(':')[0].toLowerCase();
  
  // 2. PROTEKSI RUTE RESERVED (Halaman Sistem)
  const reservedPaths = [
    '/dashboard', '/login', '/register', '/admin', '/u',
    '/verify-email', '/forgot-password', '/auth', '/reviews'
  ];
  
  if (reservedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 3. DETEKSI TIPE HOST
  const isMainHost = hostOnly === mainDomain || hostOnly === `www.${mainDomain}`;
  
  // Host yang dianggap sebagai "Sistem Internal" (Lokal/Preview)
  const systemHosts = [
    'localhost',
    '127.0.0.1',
    'web.app',
    'firebaseapp.com',
    'firebase.google.com',
    'cloudworkstations.dev'
  ];
  const isSystemHost = systemHosts.some(sh => hostOnly === sh || hostOnly.endsWith('.' + sh));

  // 4. ATURAN REDIRECT 301 (Domain LAMA / Path -> Subdomain BARU)
  // Aturan ini HANYA berjalan jika hostname adalah domain utama dan bukan halaman beranda '/'
  if (isMainHost && pathname !== '/') {
    const segments = pathname.split('/');
    const usernameCandidate = segments[1];
    
    // Pastikan rute yang diakses bukan rute sistem sebelum melakukan redirect
    if (usernameCandidate && !reservedPaths.includes('/' + usernameCandidate)) {
      // Ambil sisa path setelah username (misal: /g/abc)
      const remainingPath = '/' + segments.slice(2).join('/');
      const redirectUrl = new URL(url.toString());
      
      // Ubah hostname ke format subdomain baru
      redirectUrl.hostname = `${usernameCandidate}.${mainDomain}`;
      redirectUrl.pathname = remainingPath;
      
      // Kembalikan Redirect Permanen (301)
      return NextResponse.redirect(redirectUrl, 301);
    }
  }

  // 5. ATURAN INTERNAL REWRITE (Subdomain -> Folder _view)
  // Subdomain BARU kebal dari aturan redirect di atas karena hostname-nya sudah berubah
  if (hostOnly.endsWith('.' + mainDomain)) {
    const subdomain = hostOnly.replace('.' + mainDomain, '').replace('www.', '');
    
    // Cegah rewrite jika subdomain adalah 'www'
    if (subdomain && subdomain !== 'www') {
      url.pathname = `/_view/u:${subdomain}${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // 6. ATURAN CUSTOM DOMAIN (budi.com -> Folder _view)
  // Jika bukan main host, bukan system host, dan bukan subdomain resmi, anggap Custom Domain
  if (!isMainHost && !isSystemHost && !hostOnly.endsWith('.' + mainDomain)) {
    url.pathname = `/_view/d:${hostOnly}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Matcher ini mengecualikan rute statis dan API agar middleware berjalan ringan.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
