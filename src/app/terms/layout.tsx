import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms',
  description:
    "The terms that govern your use of aquadorcy.com and any order placed with Aquad’or. Cyprus law, plain reading, fair limits, no theatre.",
  path: '/terms',
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
