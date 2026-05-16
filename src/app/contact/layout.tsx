import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact',
  description:
    "Write us about a fragrance, a custom blend, or a visit to the Ledra 145 boutique in Nicosia. Replies within one working day, in English, Greek, or Arabic.",
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
