import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import PWAProvider from '@/components/PWAProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://linku.biz.id'),
  title: 'Linku - Premium Link Hub',
  description: 'Platform Manajemen Tautan Modern dengan Tema Neon. Tampilkan semua dunia Anda dalam satu link.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Linku',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Linku - Premium Link Hub',
    description: 'Platform Manajemen Tautan Modern dengan Tema Neon. Tampilkan semua dunia Anda dalam satu link.',
    url: 'https://linku.biz.id',
    siteName: 'Linku',
    images: [
      {
        url: 'https://picsum.photos/seed/linku-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'Linku Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linku - Premium Link Hub',
    description: 'Platform Manajemen Tautan Modern dengan Tema Neon.',
    images: ['https://picsum.photos/seed/linku-og/1200/630'],
  },
  icons: {
    icon: [
      { url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSJibGFjayIvPgogIDxwYXRoIGQ9Ik0xMiAxNkgyMCIgc3Ryb2tlPSIjZmYwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik0xNSAxMkgxMkMxMC4zNDMxIDEyIDkgMTMuMzQzMSA5IDE2QzkgMTguNjU2OSAxMC4zNDMxIDIwIDEyIDIwSDE1IiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTE3IDEySDIwQzIxLjY1NjkgMTIgMjMgMTMuMzQzMSAyMyAxNkMyMyAxOC42NTY5IDIxLjY1NjkgMjAgMjAgMjBIMTciIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+', type: 'image/svg+xml' }
    ],
    apple: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+CiAgPHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIHJ4PSI0MCIgZmlsbD0iYmxhY2siLz4KICA8cGF0aCBkPSJNNjggOTBIMTEyIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMTIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik0 Cup 8NCA2OEg2OEM1NC43NDUyIDY4IDQ0IDc4Ljc0NTIgNDQgOTBDNDQgMTAxLjI1NSA1NC43NDUyIDExMiA2OCAxMTJIODQiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSIxMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTEwMCA2OEgxMTJDMTI1LjI1NSA2OCAxMzYgNzguNzQ1MiAxMzYgOTBDMTM2IDEwMS4yNTUgMTI1LjI1NSAxMTIgMTEyIDExMkgxMDAiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSIxMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==',
  }
};

export const viewport: Viewport = {
  themeColor: '#ff0000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen pb-20">
        <FirebaseClientProvider>
          <PWAProvider>
            <AppProvider>
              {children}
              <Toaster />
            </AppProvider>
          </PWAProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
