'use client';

/**
 * Navbar, v3.0 token-driven rewrite.
 *
 * Surface, type, hover and active-state colors all resolve to design tokens.
 * No rgba literals, no Playfair, no legacy gold magic strings. Logo height
 * scales fluidly on the Tailwind breakpoint ladder instead of fixed pixel
 * heights that fight the editorial rhythm at most viewport widths.
 *
 * Behaviour preserved verbatim from v2:
 *   - left/right link split around a centered logo
 *   - mobile hamburger overlay with the same route list
 *   - inline search panel toggled from the navbar header
 *   - cart icon wired through the existing `CartIcon` context-aware consumer
 *
 * The structural rewrite is purely visual: every className uses a token,
 * and the same paths/handlers are exposed to the user.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { CartIcon } from '@/components/cart';
import { SearchBar } from '@/components/search';

const navLinks = [
  { label: 'Dubai Shop', href: '/shop' },
  { label: 'Lattafa Originals', href: '/shop/lattafa' },
  { label: 'Create Your Own', href: '/create-perfume' },
  { label: 'Re-Order', href: '/reorder' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const leftLinks = navLinks.slice(0, 3);
const rightLinks = navLinks.slice(3);

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const ticking = useRef(false);

  const isScrolled = scrollY > 40;

  // On the home page the hero (src/components/storefront/Hero.tsx) carries
  // its own embedded pill nav over a full-viewport video, so showing the
  // global navbar on top creates a doubled top affordance. Hide the global
  // navbar while the viewer is reading the hero, reveal it once they have
  // scrolled past ~85% of the viewport (the pill nav has scrolled out of
  // sight by then). On every other route the navbar behaves as before.
  const isHome = pathname === '/';
  const hideOverHero =
    isHome && viewportH > 0 && scrollY < viewportH * 0.85;

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    const handleResize = () => setViewportH(window.innerHeight);
    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const checkActive = (href: string) => {
    if (href === '/shop')
      return (
        pathname === '/shop' ||
        (pathname.startsWith('/shop/') &&
          pathname !== '/shop/lattafa' &&
          !pathname.startsWith('/shop/lattafa/'))
      );
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: hideOverHero ? -120 : 0,
          opacity: hideOverHero ? 0 : 1,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={hideOverHero ? 'true' : undefined}
        style={{ pointerEvents: hideOverHero ? 'none' : undefined }}
        className={`fixed left-0 right-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 border-b ${
          isScrolled
            ? 'bg-bg/95 backdrop-blur-md border-border-dark shadow-1'
            : 'bg-transparent backdrop-blur-0 border-transparent'
        }`}
      >
        <nav className="px-[var(--page-px)]">
          <div className="relative flex items-center justify-between h-14 md:h-16 lg:h-[72px]">
            {/* Left: Hamburger (mobile) + Left nav links (desktop) */}
            <div className="flex items-center h-full">
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="xl:hidden min-h-11 min-w-11 flex items-center justify-center text-fg hover:text-accent-deep transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg -ml-3"
                aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileOpen}
              >
                <div className="w-[20px] h-3.5 flex flex-col justify-between">
                  <span
                    className={`block h-px bg-current transition-all duration-500 origin-center ${
                      isMobileOpen ? 'rotate-45 translate-y-[6px]' : ''
                    }`}
                  />
                  <span
                    className={`block h-px bg-current transition-all duration-300 ${
                      isMobileOpen ? 'opacity-0 scale-x-0' : ''
                    }`}
                  />
                  <span
                    className={`block h-px bg-current transition-all duration-500 origin-center ${
                      isMobileOpen ? '-rotate-45 -translate-y-[6px]' : ''
                    }`}
                  />
                </div>
              </button>

              <div className="hidden xl:flex items-center h-full">
                {leftLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    active={checkActive(link.href)}
                  />
                ))}
              </div>
            </div>

            {/* Center: Logo */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 z-10 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
              aria-label="Aquad'or home"
            >
              <Image
                src="/aquador-tight.webp"
                alt="Aquad'or"
                width={220}
                height={215}
                className="h-12 md:h-14 lg:h-16 w-auto object-contain"
                priority
              />
            </Link>

            {/* Right: Right nav links (desktop) + icons */}
            <div className="flex items-center h-full">
              <div className="hidden xl:flex items-center h-full">
                {rightLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    active={checkActive(link.href)}
                  />
                ))}
              </div>

              <div className="hidden xl:block w-px h-5 mx-4 bg-border" />

              <button
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className="min-h-11 min-w-11 flex items-center justify-center text-fg hover:text-accent-deep transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                aria-expanded={isSearchOpen}
              >
                <AnimatePresence mode="wait">
                  {isSearchOpen ? (
                    <motion.div
                      key="x"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-[17px] h-[17px]" strokeWidth={1.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="s"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Search className="w-[17px] h-[17px]" strokeWidth={1.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <CartIcon className="text-fg" />
            </div>
          </div>
        </nav>

        {/* Search panel */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-border bg-bg-alt"
            >
              <div className="px-[var(--page-px)] py-5">
                <div className="max-w-lg mx-auto">
                  <SearchBar
                    variant="navbar"
                    placeholder="Search our collection"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 xl:hidden bg-bg"
          >
            <div className="relative h-full flex flex-col pt-20 pb-8 px-8 sm:px-12 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.06,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mb-10"
              >
                <SearchBar variant="shop" placeholder="Search fragrances" />
              </motion.div>

              <nav className="flex-1">
                <ul className="space-y-0">
                  {navLinks.map((link, i) => (
                    <motion.li
                      key={link.label}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.1 + i * 0.04,
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-4 py-3.5 border-b border-border transition-colors duration-150 ${
                          checkActive(link.href)
                            ? 'text-accent-deep'
                            : 'text-fg hover:text-accent-deep'
                        }`}
                      >
                        <span
                          className={`w-6 h-px flex-shrink-0 ${
                            checkActive(link.href) ? 'bg-accent' : 'bg-border'
                          }`}
                        />
                        <span className="font-display text-[21px] sm:text-2xl tracking-tight">
                          {link.label}
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="mt-auto pt-7 font-micro uppercase tracking-[0.35em] text-[10px] text-fg-muted"
              >
                Where luxury meets distinction
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative h-full flex items-center justify-center px-4 xl:px-5 group outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <span
        className={`font-micro uppercase tracking-[0.08em] text-[11px] xl:text-[11px] whitespace-nowrap leading-none transition-colors duration-150 ${
          active ? 'text-accent-deep' : 'text-fg group-hover:text-accent-deep'
        }`}
      >
        {label}
      </span>
      {active ? (
        <motion.span
          layoutId="navActive"
          className="absolute bottom-0 left-4 right-4 xl:left-5 xl:right-5 h-px bg-accent"
          transition={{ type: 'tween', duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : (
        <span className="absolute bottom-0 left-4 right-4 xl:left-5 xl:right-5 h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      )}
    </Link>
  );
}
