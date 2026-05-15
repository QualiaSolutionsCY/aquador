import { notFound } from 'next/navigation';
import ProductEditor from '@/components/admin/ProductEditor';
import { getAdminProductById } from '@/lib/supabase/admin-service';

export const dynamic = 'force-dynamic';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const { data: product } = await getAdminProductById(id);
  if (!product) notFound();
  return <ProductEditor product={product} mode="edit" />;
}
