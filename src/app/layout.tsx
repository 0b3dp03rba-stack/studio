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
      { url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSJibGFjayIvPgogIDxwYXRoIGQ9Ik0xNC41IDE5LjVDMTYuMTU2OSAyMS4xNTY5IDE4Ljg0MzEgMjEuMTU2OSAyMC41IDE5LjVMMjMuNSAxNi41QzI1LjE1NjkgMTQuODQzMSAyNS4xNTY5IDEyLjE1NjkgMjMuNSAxMC41QzIxLjg0MzEgOC44NDMxNSAxOS4xNTY5IDguODQzMTUgMTcuNSAxMC41TDE1Ljc4IDEyLjIxIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTE3LjUgMTIuNUMxNS44NDMxIDEwLjg0MzEgMTMuMTU2OSAxMC44NDMxIDExLjUgMTIuNUw4LjUgMTUuNUM2Ljg0MzE1IDE3LjE1NjkgNi44NDMxNSAxOS44NDMxIDguNSAyMS41QzEwLjE1NjkgMjMuMTU2OSAxMi44NDMxIDIzLjE1NjkgMTQuNSAyMS41TDE2LjIxIDE5Ljc5IiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==', type: 'image/svg+xml' }
    ],
    apple: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+CiAgPHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIHJ4PSI0MCIgZmlsbD0iYmxhY2siLz4KICA8cGF0aCBkPSJNOTIuNSA5Ny41QzEwNC45MjYgMTA5LjkyNiAxMjUuMDc0IDEwOS45MjYgMTM3LjUgOTcuNUwxNTcuNSA3Ny41QzE2OS45MjYgNjUuMDczOSAxNjkuOTI2IDQ0LjkyNjEgMTU3LjUgMzIuNUMxNDUuMDc0IDIwLjA3MzkgMTI0LjkyNiAyMC4wNzM5IDExMi41IDMyLjVMMTA0LjY1IDQwLjM1IiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMTQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik04Ny41IDgyLjVDNzUuMDczOSA3MC4wNzM5IDU0LjkyNjEgNzAuMDczOSA0Mi41IDgyLjVMMjIuNSAxMDIuNUMxMC4wNzM5IDExNC45MjYgMTAuMDczOSAxMzUuMDc0IDIyLjUgMTQ3LjVDMzQuOTI2MSAxNTkuOTI2IDU1LjA3MzkgMTU5LjkyNiA2Ny41IDE0Ny41TDc1LjM1IDEzOS42NSIgc3Ryb2tlPSIjZmYwMDAwIiBzdHJva2Utd2lkdGg9IjE0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+',
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
