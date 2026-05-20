'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Editorial 3-section footer.
 *
 * Section A: masthead (logo, tagline, location caption)
 * Section B: four numbered link columns (Shop, House, Help, Connect)
 * Section C: bottom bar (copyright, legal, payment marks)
 *
 * Hairline-stack pattern per DESIGN.md §10b. No em-dashes, no emojis,
 * no exclamations. Tokens only.
 */

type NavLink = { label: string; href: string };

const shopLinks: NavLink[] = [
  { label: 'Dubai Shop', href: '/shop' },
  { label: 'Lattafa Originals', href: '/shop/lattafa' },
  { label: 'Niche', href: '/shop/niche' },
  { label: 'Essence Oils', href: '/shop?category=essence-oil' },
  { label: 'Create Your Own', href: '/create-perfume' },
];

const houseLinks: NavLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Journal', href: '/blog' },
  { label: 'Re-Order', href: '/reorder' },
  { label: 'Concierge', href: '/contact' },
];

const helpLinks: NavLink[] = [
  { label: 'Contact', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns', href: '/shipping#returns' },
  { label: 'FAQ', href: '/faq' },
];

const legalLinks: NavLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Sitemap', href: '/sitemap.xml' },
];

const paymentMarks = ['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'];

const linkClass =
  'group relative inline-flex items-baseline text-fg transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep';

const linkUnderline =
  'relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-0 after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-100';

function ColumnHeader({ marker, label }: { marker: string; label: string }) {
  return (
    <div>
      <p className="font-micro uppercase tracking-[0.18em] text-[length:var(--font-size-micro)] text-fg-muted">
        {marker} / {label}
      </p>
      <span aria-hidden="true" className="mt-4 block h-px w-8 bg-border-strong" />
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = /^(mailto:|tel:|https?:)/.test(href);
  const className = `${linkClass} font-body text-[length:var(--font-size-body)]`;
  if (isExternal) {
    return (
      <a href={href} className={className}>
        <span className={linkUnderline}>{children}</span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      <span className={linkUnderline}>{children}</span>
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const visibleShopLinks = pathname.startsWith('/products/')
    ? shopLinks.filter((link) => link.href !== '/create-perfume')
    : shopLinks;

  return (
    <footer className="bg-bg-alt border-t border-border">
      <div className="mx-auto max-w-[var(--container-wide)] px-[var(--page-px)] py-16 md:py-20 lg:py-24">

        {/* Section A: masthead */}
        <section className="flex flex-col items-center text-center">
          <Link href="/" className="inline-block" aria-label="Aquad'or, home">
            <Image
              src="/aquador.webp"
              alt="Aquad'or"
              width={480}
              height={144}
              priority={false}
              className="h-20 md:h-24 lg:h-28 w-auto object-contain"
            />
          </Link>

          <span aria-hidden="true" className="mt-8 block h-px w-12 bg-accent" />

          <p className="mt-6 font-display italic text-[length:var(--font-size-h3)] text-fg leading-snug">
            Perfume, curated in Nicosia.
          </p>

          <p className="mt-4 font-micro uppercase tracking-[0.18em] text-[length:var(--font-size-micro)] text-fg-muted">
            Ledra 145, Nicosia · CY
          </p>
        </section>

        {/* Section B: link columns */}
        <section className="mt-16 md:mt-20 lg:mt-24 border-t border-border pt-12 md:pt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">

          {/* 01 / Shop */}
          <div className="flex flex-col">
            <ColumnHeader marker="01" label="Shop" />
            <ul className="mt-6 space-y-4">
              {visibleShopLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* 02 / House */}
          <div className="flex flex-col">
            <ColumnHeader marker="02" label="House" />
            <ul className="mt-6 space-y-4">
              {houseLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* 03 / Help */}
          <div className="flex flex-col">
            <ColumnHeader marker="03" label="Help" />
            <ul className="mt-6 space-y-4">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* 04 / Connect */}
          <div className="flex flex-col">
            <ColumnHeader marker="04" label="Connect" />
            <ul className="mt-6 space-y-4">
              <li>
                <FooterLink href="mailto:info@aquadorcy.com">info@aquadorcy.com</FooterLink>
              </li>
              <li>
                <FooterLink href="tel:+35799980809">+357 99 980809</FooterLink>
              </li>
              <li>
                <FooterLink href="https://wa.me/35799980809">WhatsApp</FooterLink>
              </li>
              <li className="font-body text-[length:var(--font-size-body)] text-fg-muted">
                Mon to Sat, 10:00 to 20:00
              </li>
            </ul>
          </div>
        </section>

        {/* Section C: bottom bar */}
        <section className="mt-16 md:mt-20 border-t border-border pt-8 flex flex-col md:flex-row md:items-baseline md:justify-between gap-6 md:gap-8">

          {/* Left, copyright + powered by */}
          <div className="text-center md:text-left">
            <p className="font-micro uppercase tracking-[0.1em] text-[length:var(--font-size-micro)] text-fg-muted">
              © {year} Aquad&apos;or. All rights reserved.
            </p>
            <p className="mt-2 font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg-muted">
              Powered by{' '}
              <a
                href="https://qualiasolutions.cy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep"
              >
                Qualia Solutions
              </a>
            </p>
          </div>

          {/* Center, legal links */}
          <nav
            aria-label="Legal"
            className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 font-micro uppercase tracking-[0.1em] text-[length:var(--font-size-micro)] text-fg-muted"
          >
            {legalLinks.map((link, idx) => (
              <span key={link.href} className="flex items-center gap-4">
                <Link
                  href={link.href}
                  className="text-fg-muted hover:text-accent-deep transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]"
                >
                  {link.label}
                </Link>
                {idx < legalLinks.length - 1 && (
                  <span aria-hidden="true" className="text-fg-muted/60">·</span>
                )}
              </span>
            ))}
          </nav>

          {/* Right, payment marks */}
          <p className="font-micro uppercase tracking-[0.1em] text-[length:var(--font-size-micro)] text-fg-muted text-center md:text-right">
            {paymentMarks.join(' · ')}
          </p>
        </section>
      </div>
    </footer>
  );
}
