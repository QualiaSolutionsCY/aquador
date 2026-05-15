import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin Panel | Aquad\'or',
  description: 'Manage your Aquad\'or store',
};

// Admin routes are auth-gated and depend on per-request session + URL state.
// /admin/products uses useSearchParams without a Suspense boundary; the Next
// 16 prerender warns about that unless the route is opted out of static
// generation. Force-dynamic matches the actual runtime model — these pages
// are never safely cacheable across users.
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple layout - auth is handled by middleware and AdminShell client component
  return <AdminShell>{children}</AdminShell>;
}
