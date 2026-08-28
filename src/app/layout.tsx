import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { CartDrawer } from '@/components/layout/CartDrawer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Zando Yetu - Marketplace',
  description: 'La première place de marché dédiée à la mode et aux créateurs à Lubumbashi, RDC.',
  keywords: ['Zando Yetu', 'Mode Lubumbashi', 'Boutique en ligne RDC', 'Vêtements Lubumbashi', 'Marketplace Katanga'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zando Yetu',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/icon-192.png',
  },
  applicationName: 'Zando Yetu',
  openGraph: {
    title: 'ZANDO YETU | Lubumbashi Fashion Hub',
    description: 'La première place de marché dédiée à la mode et aux créateurs à Lubumbashi.',
    type: 'website',
    locale: 'fr_CD',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} overflow-x-hidden w-full max-w-[100vw]`}>
      <body className="min-h-screen flex flex-col justify-between overflow-x-hidden w-full max-w-[100vw] bg-white text-brand-black antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1 pb-safe md:pb-0 overflow-x-hidden w-full max-w-[100vw]">{children}</main>
          <Footer />
          <MobileNav />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
