import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Suspense } from 'react';

export const viewport: Viewport = {
  themeColor: '#863bff',
};

export const metadata: Metadata = {
  title: 'Free Online Tools - JSON Formatter, CSV to Table, Text Converter & More',
  description:
    'Free online tools like JSON formatter, CSV to table converter, text formatter, and developer utilities. Fast, private, and browser-based.',
  applicationName: 'Free Tool',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Free Online Tools - JSON Formatter, CSV to Table, Text Converter & More',
    description:
      'Free online tools like JSON formatter, CSV to table converter, text formatter, and developer utilities.',
    type: 'website',
    url: 'https://www.freetool.shop/',
    siteName: 'Free Tool',
    images: [{ url: 'https://www.freetool.shop/og-image.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online Tools - JSON Formatter, CSV to Table, Text Converter & More',
    description: 'Fast, private, browser-based developer tools.',
    images: ['https://www.freetool.shop/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://www.freetool.shop/',
  },
  other: {
    'google-adsense-account': 'ca-pub-9538506658422753',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Icons */}
        <link rel="icon" type="image/webp" href="/favicon.webp" sizes="48x48" />
        <link rel="icon" type="image/webp" href="/icon-192.webp" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.webp" />

        {/* Performance: Preconnect */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Free Tool',
              url: 'https://www.freetool.shop/',
              publisher: {
                '@type': 'Organization',
                name: 'Free Tool',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://www.freetool.shop/icon-192.webp',
                },
              },
            }),
          }}
        />

        {/* Delay Analytics + Ads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function () {
                var gaScript = document.createElement('script');
                gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-0M9TCY2JGB';
                gaScript.async = true;
                document.head.appendChild(gaScript);

                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', 'G-0M9TCY2JGB');

                var adsScript = document.createElement('script');
                adsScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9538506658422753';
                adsScript.async = true;
                adsScript.crossOrigin = 'anonymous';
                document.head.appendChild(adsScript);
              });
            `,
          }}
        />
      </head>
      <body>
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#050505]" />}>
          <AppLayout>{children}</AppLayout>
        </Suspense>
      </body>
    </html>
  );
}
