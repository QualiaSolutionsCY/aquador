'use client';

/**
 * AdminTopBar — token-driven chrome (Phase 2 Task 3).
 *
 * Replaces the pre-M1 AdminNavBar + AdminHeader pair with a single
 * operator-direct bar: hamburger (mobile only) on the left, current
 * section title in the centre-left, signed-in email + sign-out button
 * on the right.
 *
 * Tokens only — no legacy gold utility, no hex, no legacy display fonts.
 */

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';

const SECTION_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/orders': 'Orders',
  '/admin/customers': 'Customers',
  '/admin/blog': 'Blog',
  '/admin/settings': 'Settings',
};

function resolveSectionTitle(pathname: string): string {
  if (SECTION_TITLES[pathname]) return SECTION_TITLES[pathname];
  // Match the deepest registered prefix so /admin/products/new → "Products".
  const match = Object.keys(SECTION_TITLES)
    .filter((href) => href !== '/admin' && pathname.startsWith(href + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return match ? SECTION_TITLES[match] : 'Admin';
}

interface AdminTopBarProps {
  userEmail: string | null;
  onMobileMenuOpen: () => void;
}

export default function AdminTopBar({
  userEmail,
  onMobileMenuOpen,
}: AdminTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const sectionTitle = useMemo(
    () => resolveSectionTitle(pathname),
    [pathname],
  );

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border)] bg-[var(--bg)] px-4 md:px-6"
      data-admin-topbar
    >
      <div className="md:hidden">
        <IconButton
          aria-label="Open navigation"
          variant="ghost"
          size="md"
          icon={<Menu strokeWidth={1.5} />}
          onClick={onMobileMenuOpen}
        />
      </div>

      <h1 className="font-display text-[length:var(--font-h4,1.25rem)] font-medium leading-tight text-[var(--fg)]">
        {sectionTitle}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        {userEmail ? (
          <span
            className="hidden font-micro text-[12px] uppercase tracking-[0.08em] text-[var(--fg-muted)] sm:inline"
            title={userEmail}
          >
            {userEmail}
          </span>
        ) : (
          <div
            aria-hidden="true"
            className="hidden h-4 w-32 animate-pulse rounded-sm bg-bg-alt sm:inline-block"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<LogOut strokeWidth={1.5} className="h-4 w-4" />}
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
