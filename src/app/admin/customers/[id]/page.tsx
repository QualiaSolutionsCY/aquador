import 'server-only';

/**
 * /admin/customers/[id] — Server Component (Phase 3 Task 3, ADMIN-06).
 *
 * Rewrites the legacy client-side page that had a known stub bug
 * (`.eq('customer_email', '')` placeholder filter that never resolved
 * to real orders). Pulls everything in parallel via admin-service +
 * a direct service-role read for the new `customer_cohorts` table
 * (added in 20260515082534_customer_cohorts.sql). Renders the
 * presentational client component `<CustomerDetail>`.
 *
 * The cohort fetch lives here (not in admin-service) so that the
 * service stays untouched in this wave per the orchestrator wave
 * guard. service_role is justified: admin operator needs to read
 * every cohort regardless of viewer RLS context — same justification
 * pattern as every other admin-service read.
 */

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getAdminCustomerById,
  getCustomerOrderHistory,
} from '@/lib/supabase/admin-service';
import { CustomerDetail } from '@/components/admin/CustomerDetail';

interface CohortRow {
  cohort: string;
  created_at: string;
}

async function getCustomerCohorts(customerId: string): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    // customer_cohorts not in generated Database types yet — cast.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('customer_cohorts')
      .select('cohort, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return (data as CohortRow[]).map((r) => r.cohort);
  } catch {
    return [];
  }
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [customerRes, ordersRes, cohorts] = await Promise.all([
    getAdminCustomerById(id),
    getCustomerOrderHistory(id),
    getCustomerCohorts(id),
  ]);

  const customer = customerRes.data;
  if (!customer) {
    notFound();
  }

  return (
    <CustomerDetail
      customer={customer}
      orders={ordersRes.data ?? []}
      cohorts={cohorts}
    />
  );
}
