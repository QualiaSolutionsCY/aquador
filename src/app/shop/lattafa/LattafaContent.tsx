'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/search';
import { formatPrice } from '@/lib/utils';

const AnimatedShaderBackground = dynamic(
  () => import('@/components/ui/animated-shader-background'),
  { ssr: false }
);
import type { Product, ProductGender } from '@/types';

interface LattafaContentProps {
  products: Product[];
}

type GenderFilter = 'all' | ProductGender;

const genderTabs: { key: GenderFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unisex', label: 'Unisex' },
  { key: 'men', label: 'Men' },
  { key: 'women', label: 'Women' },
];

export default function LattafaContent({ products }: LattafaContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by gender
    if (genderFilter !== 'all') {
      filtered = filtered.filter((product) => product.gender === genderFilter);
    }

    // Filter by search
    if (searchQuery.trim().length >= 2) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description.toLowerCase().includes(lowercaseQuery)
      );
    }

    return filtered;
  }, [products, searchQuery, genderFilter]);

  // Count products per gender for tab badges
  const genderCounts = useMemo(() => {
    return {
      all: products.length,
      unisex: products.filter((p) => p.gender === 'unisex').length,
      men: products.filter((p) => p.gender === 'men').length,
      women: products.filter((p) => p.gender === 'women').length,
    };
  }, [products]);

  return (
    <div className="pt-20 md:pt-24 pb-16 md:pb-20 bg-gold-ambient min-h-screen">
      {/* Hero — compact */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <AnimatedShaderBackground />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark/70 to-dark" />
        </div>
        <div className="container-wide text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/shop"
              className="inline-flex items-center text-gold/50 hover:text-gold mb-4 text-[10px] uppercase tracking-[0.2em] transition-colors"
            >
              &larr; Back to Collections
            </Link>
            <h1 className="text-5xl md:text-6xl font-playfair text-gradient-gold mb-4">
              Lattafa Originals
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Original Lattafa Perfumes — authentic Arabian fragrances crafted with the finest ingredients
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gender Category Tabs */}
      <section className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="inline-flex bg-dark-light/50 backdrop-blur-sm rounded-full p-1.5 border border-gold/20">
            {genderTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setGenderFilter(tab.key)}
                className={`relative px-6 py-2.5 text-sm font-medium uppercase tracking-wider transition-all duration-300 rounded-full ${
                  genderFilter === tab.key
                    ? 'bg-gold text-dark shadow-lg shadow-gold/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 text-xs ${
                    genderFilter === tab.key ? 'text-dark/70' : 'text-gray-500'
                  }`}
                >
                  ({genderCounts[tab.key]})
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Search Bar */}
      <section className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-xl mx-auto"
        >
          <SearchBar
            variant="shop"
            placeholder="Search Lattafa fragrances..."
            onSearch={handleSearch}
          />
        </motion.div>

        {(searchQuery.length >= 2 || genderFilter !== 'all') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-4"
          >
            <p className="text-sm text-gray-400">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              {genderFilter !== 'all' && ` in ${genderFilter}`}
              {searchQuery.length >= 2 && ` for "${searchQuery}"`}
            </p>
            {(searchQuery.length >= 2 || genderFilter !== 'all') && (
              <button
                onClick={() => {
                  clearSearch();
                  setGenderFilter('all');
                }}
                className="text-sm text-gold hover:text-gold/80 transition-colors"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        )}
      </section>

      {/* Products Grid */}
      <section className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
            >
              <Link
                href={`/products/${product.id}`}
                className="group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className={`object-cover transition-transform duration-700 group-hover:scale-110 ${product.in_stock === false ? 'opacity-60' : ''}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Sale Badge */}
                  {product.sale_price && product.sale_price < product.price && product.in_stock !== false && (
                    <span className="absolute top-4 left-4 bg-gold text-black text-[10px] uppercase tracking-wider px-3 py-1.5 font-medium">
                      Sale
                    </span>
                  )}
                  {/* Coming Soon Badge */}
                  {product.in_stock === false && (
                    <span className="absolute top-4 left-4 bg-gray-800 text-white text-[10px] uppercase tracking-wider px-3 py-1.5 font-medium">
                      Coming Soon
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-playfair text-gray-900 group-hover:text-gold-dark transition-colors mb-1">
                    {product.name}
                  </h3>
                  {product.brand && (
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      {product.brand}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-gold-dark">
                        {formatPrice(product.sale_price || product.price)}
                      </span>
                      {product.sale_price && product.sale_price < product.price && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{product.size}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">
              {searchQuery.length >= 2 || genderFilter !== 'all'
                ? `No products found${genderFilter !== 'all' ? ` in ${genderFilter}` : ''}${searchQuery.length >= 2 ? ` for "${searchQuery}"` : ''}.`
                : 'No products found in Lattafa collection.'}
            </p>
            {(searchQuery.length >= 2 || genderFilter !== 'all') ? (
              <button
                onClick={() => {
                  clearSearch();
                  setGenderFilter('all');
                }}
                className="text-gold hover:text-gold/80 transition-colors"
              >
                Clear filters
              </button>
            ) : (
              <Link href="/shop" className="text-gold">
                Browse all products
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
