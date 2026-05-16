import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'About',
  description:
    "Aquad’or is a Nicosia perfume house curating niche, women, men, and Lattafa originals for the Levant. A curated table, not a sales floor.",
  path: '/about',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
