/**
 * Admin / Orders / New — manual order creation entry (Phase 3 Task 2).
 *
 * Server shell wrapping the `ManualOrderForm` client island. Authentication
 * for this route is enforced by `src/middleware.ts` (admin middleware checks
 * `admin_users` membership before any /admin/* page renders).
 */

import ManualOrderForm from '@/components/admin/ManualOrderForm';

export const dynamic = 'force-dynamic';

export default function NewManualOrderPage() {
  return <ManualOrderForm />;
}
