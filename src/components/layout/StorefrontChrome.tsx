'use client';

/**
 * StorefrontChrome.
 *
 * Mounts the public-site chrome — Navbar, Footer, CartDrawer, CookieConsent —
 * but suppresses it on /admin routes where the storefront nav is intrusive
 * (AdminShell owns its own sidebar + topbar).
 *
 * Splits into Top (Navbar) and Bottom (Footer + CartDrawer + CookieConsent)
 * so the host layout can mount the right piece in the right slot of the
 * page (Navbar above main, the rest below).
 */

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { CartDrawer } from '@/components/cart';
import CookieConsent from '@/components/ui/CookieConsent';

function isAdminRoute(pathname: string | null): boolean {
  return !!pathname && pathname.startsWith('/admin');
}

function isMaintenanceRoute(pathname: string | null): boolean {
  return pathname === '/maintenance';
}

function shouldSuppressChrome(pathname: string | null): boolean {
  return isAdminRoute(pathname) || isMaintenanceRoute(pathname);
}

export function StorefrontChromeTop() {
  const pathname = usePathname();
  if (shouldSuppressChrome(pathname)) return null;
  return <Navbar />;
}

export function StorefrontChromeBottom() {
  const pathname = usePathname();
  if (shouldSuppressChrome(pathname)) return null;
  return (
    <>
      <Footer />
      <CartDrawer />
      <CookieConsent />
    </>
  );
}
