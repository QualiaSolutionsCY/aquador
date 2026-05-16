import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy',
  description:
    "How Aquad’or collects, uses, and protects your information when you shop with us. GDPR aligned for Cyprus and the EU, written in plain language.",
  path: '/privacy',
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
