import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Build a perfume',
  description:
    "Build a perfume in three layers, top, heart, base, then choose fifty or one hundred millilitres. Four hours from final note to a finished bottle.",
  path: '/create-perfume',
});

export default function CreatePerfumeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
