import type { Metadata } from 'next';
import { vazir } from './fonts';
import './globals.css';
import { Toaster } from 'sonner';
import Script from 'next/script';
import AiChatbot from './components/AiChatbot';
import VisitTracker from './components/VisitTracker';

export const metadata: Metadata = {
  metadataBase: new URL('https://ehsansalehi.ir'),
  title: {
    default: 'احسان صالحی رباطی | متخصص IT با ۱۶ سال تجربه',
    template: '%s | احسان صالحی رباطی',
  },
  description:
    'احسان صالحی رباطی، متخصص IT با ۱۶ سال تجربه در زمینه شبکه، امنیت، توسعه وب و هوش مصنوعی. ارائه خدمات مشاوره، طراحی سایت و اتوماسیون.',
  keywords: [
    'احسان صالحی رباطی',
    'متخصص IT',
    'شبکه',
    'امنیت',
    'توسعه وب',
    'هوش مصنوعی',
    'وردپرس',
    'Next.js',
    'فول استک',
    'مشاوره فناوری اطلاعات',
    'اصفهان',
  ],
  authors: [{ name: 'احسان صالحی رباطی', url: 'https://ehsansalehi.ir' }],
  creator: 'احسان صالحی رباطی',
  publisher: 'احسان صالحی رباطی',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: 'https://ehsansalehi.ir',
    siteName: 'احسان صالحی رباطی',
    title: 'احسان صالحی رباطی | متخصص IT با ۱۶ سال تجربه',
    description: 'متخصص IT، توسعه‌دهنده فول استک، معمار شبکه و مشاور فناوری اطلاعات با ۱۶ سال تجربه',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'احسان صالحی رباطی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'احسان صالحی رباطی | متخصص IT با ۱۶ سال تجربه',
    description: 'متخصص IT، توسعه‌دهنده فول استک، معمار شبکه و مشاور فناوری اطلاعات',
    images: ['/images/og-image.jpg'],
    creator: '@ehsansalehi',
  },
  alternates: {
    canonical: 'https://ehsansalehi.ir',
  },
  verification: {
    google: 'BnEji84Y7nkC_yw_bKqvxl5F7OTziQjuM2E0utc3XNc',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

        {/* متا تگ تأیید گوگل سرچ کنسول */}
        <meta name="google-site-verification" content="BnEji84Y7nkC_yw_bKqvxl5F7OTziQjuM2E0utc3XNc" />

        {/* متا تگ تأیید فیسبوک */}
        <meta name="facebook-domain-verification" content="7edxl1xqt2d8sc3zurcms3hbqfkfju" />

        {/* ====== Statsfa Website Analytics ====== */}
        <Script
          data-host="https://statsfa.com"
          data-dnt="false"
          src="https://statsfa.com/js/script.js"
          id="ZwSg9rf6GA"
          async
          strategy="afterInteractive"
        />
        {/* ====== پایان Statsfa ====== */}
      </head>
      <body className="font-vazir antialiased bg-[#0a0a0a] text-white">
        <VisitTracker />
        {children}
        <AiChatbot />
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}
