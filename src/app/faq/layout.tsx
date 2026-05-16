import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Questions',
  description:
    "Common questions from the desk: shipping across Cyprus, returns on unopened bottles, custom perfume turnaround, ingredient sourcing, payment methods, wholesale.",
  path: '/faq',
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
