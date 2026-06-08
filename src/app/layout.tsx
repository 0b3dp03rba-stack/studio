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
    description: 'Platform Manajemen Tautan Modern dengan Tema Neon.',
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
      { url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSJibGFjayIvPgogIDxwYXRoIGQ9Ik0xNCAxNkgxOE0xNCAxMkgxMkM5Ljc5MDg2IDEyIDggMTMuNzkwOSA4IDE2QzggMTguMjA5MSA5Ljc5MDg2IDIwIDEyIDIwSDE0TTE4IDEySDIwQzIyLjIwOTEgMTIgMjQgMTMuNzkwOSAyNCAxNkMyNCAxOC4yMDkxIDIyLjIwOTEgMjAgMjAgMjBIMTgiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+', type: 'image/svg+xml' }
    ],
    apple: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+CiAgPHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIHJ4PSI0MCIgZmlsbD0iYmxhY2siLz4KICA8cGF0aCBkPSJNOTAgOTBIOTEwTTkwIDY4SDc0QzU3LjQzMTUgNjggNDQgODEuNDMxNSA0NCA5OEM0NCAxMTQuNTY5IDU3LjQzMTUgMTI4IDc0IDEyOEg5ME0xMTAgNjhIMTI2QzE0Mi41NjkgNjggMTU2IDgxLjQzMTUgMTU2IDk4QzE1NiAxMTQuNTY5IDE0Mi41NjkgMTI4IDEyNiAxMjhIMTEwIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMTYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=',
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
      <body className="font-body antialiased min-h-screen pb-20 bg-black">
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
