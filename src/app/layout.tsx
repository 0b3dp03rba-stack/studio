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
      { url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSJibGFjayIvPgogIDxwYXRoIGQ9Ik0xOCAxMkwyMiA4QzIzLjEwNDYgNi44OTU0MyAyNC44OTU0IDYuODk1NDMgMjYgOEwyOCAxMEMyOS4xMDQ2IDExLjEwNDYgMjkuMTA0NiAxMi44OTU0IDI4IDE0TDI0IDE4IiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTE0IDIwTDEwIDI0QzguODk1NDMgMjUuMTA0NiA3LjEwNDU3IDI1LjEwNDYgNiAyNEw0IDIyQzIuODk1NDMgMjAuODk1NCAyLjg5NTQzIDE5LjEwNDYgNCAxOEw4IDE0IiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTExIDE3TDIxIDExIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==', type: 'image/svg+xml' }
    ],
    apple: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+CiAgPHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIHJ4PSI0MCIgZmlsbD0iYmxhY2siLz4KICA8cGF0aCBkPSJNOTAgNjBMMTEwIDQwQzExNS41MjMgMzQuNDc3MiAxMjQuNDc3IDM0LjQ3NzIgMTMwIDQwTDE0MCA1MEMxNDUuNTIzIDU1LjUyMjggMTQ1LjUyMyA2NC40NzczIDE0MCA3MEwxMjAgOTAiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSIxNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTcwIDExMEw1MCAxMzBDNDQuNDc3MiAxMzUuNTIzIDM1LjUyMjggMTM1LjUyMyAzMCAxMzBMMjAgMTIwQzE0LjQ3NzIgMTE0LjQ3NyAxNC40NzcyIDEwNS41MjMgMjAgMTAwTDQwIDgwIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMTQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik01NSA5NUwxMjUgNjUiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSIxNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==',
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
