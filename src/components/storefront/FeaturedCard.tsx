'use client';

/**
 * FeaturedCard. Per-card client leaf for FeaturedGrid (POLISH-08, M4 P1 T3).
 *
 * Extracted from FeaturedGrid so the section wrapper can stream as an RSC.
 * Bundles FadeUp (IntersectionObserver) + HoverCrossfade (group-hover image
 * swap) around a single ProductCard tile. The card-level animation lives
 * here; the section header + grid container stay server-rendered.
 *
 * Spec source: .planning/DESIGN.md §10b. No Card wrapper, no raw hex,
 * tokens-only motion via --duration-base + --ease-out-quart.
 */

import Image from 'next/image';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Product } from '@/lib/supabase/types';
import FadeUp from './FadeUp';

export interface FeaturedCardProps {
  product: Product;
  index: number;
}

function HoverCrossfade({
  primary,
  secondary,
  alt,
}: {
  primary: string;
  secondary: string;
  alt: string;
}) {
  // Absolute overlay that fades in over ProductCard's primary image on group
  // hover. ProductCard's outer <Link> carries the `group` class.
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:opacity-100"
    >
      <Image
        src={secondary}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        className="object-cover"
      />
      <span className="sr-only">{primary}</span>
    </div>
  );
}

export default function FeaturedCard({ product, index }: FeaturedCardProps) {
  const secondary = product.images?.[0];
  const showCrossfade = !!secondary && secondary !== product.image;

  return (
    <FadeUp delay={Math.min(index * 60, 540)}>
      <li className="group relative list-none transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-1">
        <div className="relative">
          <ProductCard product={product} priority={index < 4} variant="compact" />
          {showCrossfade && (
            <HoverCrossfade
              primary={product.image}
              secondary={secondary}
              alt={product.name}
            />
          )}
        </div>
      </li>
    </FadeUp>
  );
}
