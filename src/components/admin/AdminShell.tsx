'use client';

/**
 * AdminShell — token-driven coordinator (Phase 2 Task 3).
 *
 * Sole composition for the admin chrome:
 *   - Desktop (md+): sticky left sidebar + sticky top bar + scrollable main.
 *   - Mobile (<md):  sidebar collapses into a Drawer triggered by a hamburger
 *                    in the top bar.
 *
 * Auth gating is enforced upstream by `src/middleware.ts` (Task 1). The shell
 * itself only renders chrome + the signed-in user's email; it never blocks
 * an unauthenticated route.
 */

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/Drawer';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Resolve the signed-in user's email for the top-bar display.
  useEffect(() => {
    mountedRef.current = true;
    if (isLoginPage) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (mountedRef.current) setUserEmail(data.user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mountedRef.current) setUserEmail(session?.user?.email ?? null);
      },
    );
    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div
      data-admin-shell
      className="flex min-h-screen bg-[var(--bg)] text-[var(--fg)]"
    >
      {/* Desktop sidebar — sticky, hairline-right against content. */}
      <aside
        aria-label="Admin sidebar"
        className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--border)] md:block"
      >
        <AdminSidebar />
      </aside>

      {/* Mobile drawer — same nav, anchored via Drawer primitive. */}
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent
          className="left-0 right-auto w-72 max-w-[80vw] p-0"
          hideCloseButton
        >
          <DrawerTitle className="sr-only">Admin navigation</DrawerTitle>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </DrawerContent>
      </Drawer>

      {/* Right column — top bar + scrollable content. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          userEmail={userEmail}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden bg-[var(--bg)] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
