'use client';

/**
 * AdminSidebar — token-driven vertical nav (Phase 2 Task 3).
 *
 * Single source for both desktop sticky sidebar (always visible at md+)
 * and the mobile Drawer body. Active route is computed via `usePathname`
 * and announced to assistive tech via `aria-current="page"`.
 *
 * Visual contract (DESIGN.md §2 / §3):
 *   - Hairline-divider rows; NO Card wrap, NO bordered rectangles.
 *   - Active item: `text-accent` glyph + label, `bg-bg-alt` row tint.
 *   - Tokens only: var(--bg), var(--bg-alt), var(--fg), var(--fg-muted),
 *     var(--accent), var(--border). No legacy gold utility, no hex, no
 *     legacy display fonts.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FileText,
  Sparkles,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Perfume Intel', href: '/admin/perfume-intel', icon: Sparkles },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  /** Called when a nav link is activated — used by the mobile Drawer to close. */
  onNavigate?: () => void;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="flex h-full flex-col bg-[var(--bg)]"
    >
      {/* Brand mark — hairline below */}
      <div className="flex h-16 items-center border-b border-[var(--border)] px-6">
        <Link
          href="/admin"
          onClick={onNavigate}
          className={cn(
            'font-micro text-[12px] uppercase tracking-[0.18em] text-[var(--fg)]',
            'outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          )}
        >
          Aquad&apos;or Admin
        </Link>
      </div>

      {/* Nav stack — hairline-divider rows */}
      <ul role="list" className="flex flex-1 flex-col overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="border-b border-[var(--border)]">
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-6 py-4',
                  'font-micro text-[12px] uppercase tracking-[0.12em]',
                  'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
                  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                  'focus-visible:ring-inset',
                  active
                    ? 'bg-[var(--bg-alt)] text-[var(--accent)]'
                    : 'text-[var(--fg-muted)] hover:bg-[var(--bg-alt)] hover:text-[var(--fg)]',
                )}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="h-4 w-4 shrink-0"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
