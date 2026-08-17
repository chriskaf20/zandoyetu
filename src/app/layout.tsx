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
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'ZANDO YETU | Plateforme Mode & Marketplace de Lubumbashi',
  description: 'Achetez et vendez des vêtements, chaussures et accessoires de mode à Lubumbashi avec livraison express et paiement sécurisé à la réception.',
  keywords: ['Zando Yetu', 'Mode Lubumbashi', 'Boutique en ligne RDC', 'Vêtements Lubumbashi', 'Marketplace Katanga'],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zando Yetu',
  },
  applicationName: 'Zando Yetu',
  openGraph: {
    title: 'ZANDO YETU | Lubumbashi Fashion Hub',
    description: 'La première place de marché dédiée à la mode et aux créateurs à Lubumbashi.',
    type: 'website',
    locale: 'fr_FR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen flex flex-col justify-between">
        <Providers>
          <Navbar />
          <main className="flex-1 pb-safe md:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
