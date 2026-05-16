import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Shipping and returns',
  description:
    "Delivery across Cyprus in one to three working days. Free shipping above thirty five euros. Returns accepted within fourteen days on unopened bottles.",
  path: '/shipping',
});

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
