'use client';

import { CartProvider } from '@/components/cart';
import { StorefrontChromeTop, StorefrontChromeBottom } from '@/components/layout/StorefrontChrome';
import SplashScreen from '@/components/layout/SplashScreen';
import VisitorTracker from '@/components/VisitorTracker';
import { PageTransition } from '@/components/providers/PageTransition';
import { AnimationBudgetProvider } from '@/lib/performance/animation-budget';
import { ScrollDepthTracker } from '@/components/analytics/ScrollDepthTracker';

export function PublicRuntime({ children }: { children: React.ReactNode }) {
  return (
    <AnimationBudgetProvider>
      <CartProvider>
        <SplashScreen />
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
  );
}
