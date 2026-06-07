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
    statusBarStyle: 'default',
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
    icon: 'https://picsum.photos/seed/linku-logo-32/32/32',
    apple: 'https://picsum.photos/seed/linku-logo-192/192/192',
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