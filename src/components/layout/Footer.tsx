'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  BookOpen,
  CreditCard,
  HelpCircle,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
} from 'lucide-react';

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

function ColumnHeader({
  marker,
  label,
  icon: Icon,
}: {
  marker: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: true }>;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Icon aria-hidden className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
        <p className="font-micro uppercase tracking-[0.18em] text-[length:var(--font-size-micro)] text-fg-muted">
          {marker} / {label}
        </p>
      </div>
      <span aria-hidden="true" className="mt-4 block h-px w-full max-w-24 bg-border-strong" />
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
      <div className="w-full px-[var(--page-px)] py-16 md:py-20 lg:py-24">

        {/* Section A: masthead */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)] lg:items-end">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
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

            <p className="mt-4 inline-flex items-center gap-2 font-micro uppercase tracking-[0.18em] text-[length:var(--font-size-micro)] text-fg-muted">
              <MapPin aria-hidden className="h-3.5 w-3.5 text-accent-deep" strokeWidth={1.5} />
              Ledra 145, Nicosia · CY
            </p>
          </div>

          <div className="border-y border-border py-6 lg:border-l lg:border-y-0 lg:py-0 lg:pl-10">
            <p className="max-w-[52rem] font-display text-[length:var(--font-display-xl)] leading-[1.08] tracking-[-0.01em] text-fg">
              A catalogue, a desk, and a handwritten note in the parcel.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: ShoppingBag, label: 'Original bottles' },
                { icon: MessageCircle, label: 'Concierge replies' },
                { icon: CreditCard, label: 'Secure checkout' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 border-t border-border pt-4">
                  <Icon aria-hidden className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
                  <span className="font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg-muted">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section B: link columns */}
        <section className="mt-16 md:mt-20 lg:mt-24 border-t border-border pt-12 md:pt-16 grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* 01 / Shop */}
          <div className="flex flex-col">
            <ColumnHeader marker="01" label="Shop" icon={ShoppingBag} />
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
            <ColumnHeader marker="02" label="House" icon={Home} />
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
            <ColumnHeader marker="03" label="Help" icon={HelpCircle} />
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
            <ColumnHeader marker="04" label="Connect" icon={BookOpen} />
            <ul className="mt-6 space-y-4">
              <li>
                <span className="flex items-center gap-3">
                  <Mail aria-hidden className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
                  <FooterLink href="mailto:info@aquadorcy.com">info@aquadorcy.com</FooterLink>
                </span>
              </li>
              <li>
                <span className="flex items-center gap-3">
                  <Phone aria-hidden className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
                  <FooterLink href="tel:+35799980809">+357 99 980809</FooterLink>
                </span>
              </li>
              <li>
                <span className="flex items-center gap-3">
                  <MessageCircle aria-hidden className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
                  <FooterLink href="https://wa.me/35799980809">WhatsApp</FooterLink>
                </span>
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
