'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { formatPrice } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/Section';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { fadeInUp } from '@/lib/animations/scroll-animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Product } from '@/types';

const FALLBACK_IMAGE = '/placeholder-product.svg';

interface FeaturedProductsProps {
  products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], ['20px', '-20px']);

  return (
    <section ref={sectionRef} className="section-lg bg-gold-ambient">
      <div className="container-wide">
        <motion.div style={{ y: reducedMotion ? 0 : headerY }}>
          <SectionHeader
            title="Featured Collections"
            subtitle="Discover our most beloved fragrances, crafted with the finest ingredients from around the world."
            eyebrow="Our Selection"
          />
        </motion.div>

        {/* Products grid — wider spacing, more breathing room */}
        <AnimatedSection variant="stagger" staggerDelay={0.08}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={fadeInUp}
              >
                <Link href={`/products/${product.id}`} className="group block">
                  {/* Image — generous proportions */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ede8] mb-4">
                    <Image
                      src={product.image || FALLBACK_IMAGE}
                      alt={product.name}
                      fill
                      className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />

                    {/* Sale badge */}
                    {product.sale_price && (
                      <div className="absolute top-3 left-3 bg-gold text-black text-[9px] uppercase tracking-[0.12em] px-2.5 py-1 font-medium">
                        Sale
                      </div>
                    )}

                    {/* Hover reveal overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

                    {/* Subtle bottom gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Content — clean typographic hierarchy */}
                  <div className="space-y-1.5">
                    {product.brand && (
                      <p className="eyebrow text-gold/60 text-[9px]">{product.brand}</p>
                    )}
                    <h3 className="font-playfair text-sm md:text-[15px] text-gray-900 group-hover:text-gold-dark transition-colors duration-300 line-clamp-1 leading-snug">
                      {product.name}
                    </h3>

                    {/* Price + size in one clean row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`font-playfair text-sm md:text-base ${product.sale_price ? 'text-gold-dark' : 'text-gray-800'}`}>
                          {formatPrice(product.sale_price ?? product.price)}
                        </span>
                        {product.sale_price && (
                          <span className="text-[11px] text-gray-400 line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      {product.size && (
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                          {product.size}
                        </span>
                      )}
                    </div>

                    {/* Animated gold underline on hover */}
                    <div className="h-px bg-gold/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gold/60 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* View all — more editorial link style */}
        <motion.div
          className="mt-16 md:mt-20 flex flex-col sm:flex-row items-center justify-between gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent hidden sm:block" />
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 text-black hover:text-gold transition-colors duration-300 text-[11px] uppercase tracking-[0.22em] group flex-shrink-0"
          >
            View All Products
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/20 to-transparent hidden sm:block" />
        </motion.div>
      </div>
    </section>
  );
}
