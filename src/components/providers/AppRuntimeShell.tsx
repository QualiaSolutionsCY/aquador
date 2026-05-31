'use client';

import { usePathname } from 'next/navigation';
import { PublicRuntime } from '@/components/providers/PublicRuntime';

function isAdminRoute(pathname: string | null): boolean {
  return !!pathname && pathname.startsWith('/admin');
}

function isMaintenanceRoute(pathname: string | null): boolean {
  return pathname === '/maintenance';
}

export function AppRuntimeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAdminRoute(pathname) || isMaintenanceRoute(pathname)) {
    return <>{children}</>;
  }

  return <PublicRuntime>{children}</PublicRuntime>;
}
