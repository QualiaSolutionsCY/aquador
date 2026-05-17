import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Newsreader } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { CartProvider } from "@/components/cart";
import { StorefrontChromeTop, StorefrontChromeBottom } from "@/components/layout/StorefrontChrome";
import { ErrorBoundary, AbortErrorSuppressor } from "@/components/providers/ErrorBoundary";
import VisitorTracker from "@/components/VisitorTracker";
import { PageTransition } from "@/components/providers/PageTransition";
import { AnimationBudgetProvider } from "@/lib/performance/animation-budget";
import { ScrollDepthTracker } from "@/components/analytics/ScrollDepthTracker";
// v3.0 overlay primitives (Phase 3, PRIM-05 barrel).
import { TooltipProvider, Toaster } from '@/components/ui';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld';

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://aquadorcy.com'),
  title: {
    default: "Aquad'or | Luxury Perfumes & Niche Fragrances Cyprus",
    template: "%s | Aquad'or Cyprus",
  },
  description: "Where Luxury Meets Distinction. Discover our curated collection of high-end and niche perfumes, or create your own signature fragrance at Aquad'or Cyprus.",
  keywords: ["perfume", "luxury fragrance", "Cyprus", "Nicosia", "custom perfume", "niche perfume", "Aquador"],
  authors: [{ name: "Aquad'or" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Aquad'or | Luxury Perfumes & Niche Fragrances Cyprus",
    description: "Where Luxury Meets Distinction. Discover our curated collection of high-end and niche perfumes.",
    type: "website",
    locale: "en_US",
    siteName: "Aquad'or",
    url: "https://aquadorcy.com",
    images: [
      {
        url: "/aquador.webp",
        width: 800,
        height: 600,
        alt: "Aquad'or Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aquad'or | Luxury Perfumes & Niche Fragrances Cyprus",
    description: "Where Luxury Meets Distinction. Discover our curated collection of high-end and niche perfumes.",
    images: ["/aquador.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://aquadorcy.com',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Site-wide JSON-LD (M4 P2 T2, SEO-02): Organization + WebSite schemas emit
  // on every route so deep-link visitors (PDPs, blog posts, etc.) carry the
  // org context Google expects. Escape `<` to neutralize the `</script>`
  // injection vector even though the source objects are statically authored.
  const orgLd = JSON.stringify(organizationJsonLd()).replace(/</g, '\\u003c');
  const siteLd = JSON.stringify(websiteJsonLd()).replace(/</g, '\\u003c');

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://hznpuxplqgszbacxzbhv.supabase.co" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://hznpuxplqgszbacxzbhv.supabase.co" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: orgLd }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: siteLd }}
        />
      </head>
      <body
        className={`${cormorant.variable} ${newsreader.variable} ${GeistSans.variable} antialiased`}
        style={{ ['--font-micro' as unknown as string]: 'var(--font-geist-sans)' }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-gold focus:text-black focus:text-sm focus:font-medium focus:rounded"
        >
          Skip to content
        </a>
        <AbortErrorSuppressor />
        <ErrorBoundary>
          <TooltipProvider delayDuration={200}>
            <Toaster>
              <AnimationBudgetProvider>
                <CartProvider>
                  <StorefrontChromeTop />
                  <PageTransition>
                    <main id="main-content" className="min-h-screen">
                      {children}
                    </main>
                  </PageTransition>
                  <StorefrontChromeBottom />
                  <ScrollDepthTracker />
                  <VisitorTracker />
                </CartProvider>
              </AnimationBudgetProvider>
            </Toaster>
          </TooltipProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
