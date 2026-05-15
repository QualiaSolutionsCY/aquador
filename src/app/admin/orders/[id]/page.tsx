/**
 * Admin / Orders / [id] — unified order detail (Phase 3 Task 2).
 *
 * Server component. Fetches the order + customer in parallel from
 * `admin-service.ts`. Renders the `OrderDetail` client component which owns
 * the editable surface (status mutation, fulfillment notes autosave).
 *
 * Routes that resolve to a missing order return Next.js's `notFound()`.
 */

import { notFound } from 'next/navigation';
import { getAdminOrderById, getAdminCustomers } from '@/lib/supabase/admin-service';
import OrderDetail from '@/components/admin/OrderDetail';
import type { Customer } from '@/lib/supabase/types';

interface PageProps {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { data: order } = await getAdminOrderById(params.id);
  if (!order) {
    notFound();
  }

  // Look up the customer record by email (orders.customer_email is the only
  // link back to the customers table — see admin-service.ts:667).
  let customer: Customer | null = null;
  if (order.customer_email) {
    const { data: matches } = await getAdminCustomers({
      search: order.customer_email,
      limit: 1,
    });
    customer = matches.find((c) => c.email === order.customer_email) ?? null;
  }

  return <OrderDetail order={order} customer={customer} />;
}
