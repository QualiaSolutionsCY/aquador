import { notFound } from 'next/navigation';
import CustomerDetail from '@/components/admin/CustomerDetail';
import {
  getAdminCustomerById,
  getCustomerCohorts,
  getCustomerOrderHistory,
} from '@/lib/supabase/admin-service';

export const dynamic = 'force-dynamic';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const [{ data: customer }, { data: orders }, cohorts] = await Promise.all([
    getAdminCustomerById(id),
    getCustomerOrderHistory(id),
    getCustomerCohorts(id),
  ]);

  if (!customer) {
    notFound();
  }

  return <CustomerDetail customer={customer} orders={orders} cohorts={cohorts} />;
}
