import { Metadata } from 'next';
import Link from 'next/link';
import { getProductsByCategory } from '@/lib/supabase/product-service';
import LattafaContent from './LattafaContent';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Lattafa Originals Perfumes",
  description: 'Discover our original Lattafa Perfumes collection - authentic Arabian fragrances crafted with the finest ingredients. Shop online at Aquad\'or Cyprus.',
  openGraph: {
    title: "Lattafa Originals Perfumes | Aquad'or Cyprus",
    description: 'Authentic Arabian fragrances crafted with the finest ingredients. Original Lattafa Perfumes collection.',
    url: 'https://aquadorcy.com/shop/lattafa',
    images: [{ url: '/aquador.webp', width: 800, height: 600, alt: 'Lattafa Originals Perfumes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Lattafa Originals Perfumes | Aquad'or Cyprus",
    description: 'Authentic Arabian fragrances. Original Lattafa Perfumes collection.',
    images: ['/aquador.webp'],
  },
  alternates: {
    canonical: 'https://aquadorcy.com/shop/lattafa',
  },
};

export default async function LattafaPage() {
  const products = await getProductsByCategory('lattafa-original');

  if (products.length === 0) {
    return (
      <div className="pt-32 md:pt-40 lg:pt-44 pb-16 min-h-screen bg-dark text-center">
        <h1 className="text-4xl font-playfair text-black">No products found</h1>
        <p className="text-gray-400 mt-4">Lattafa Originals collection is currently empty.</p>
        <Link href="/shop" className="text-gold mt-4 inline-block">
          &larr; Back to Shop
        </Link>
      </div>
    );
  }

  return <LattafaContent products={products} />;
}
