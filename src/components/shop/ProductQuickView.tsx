/**
 * ProductQuickView Component
 *
 * Overlay that appears on product card hover (desktop) or tap (mobile).
 * Reveals product details progressively without leaving the grid.
 *
 * Design: Absolute-positioned overlay with tokenized scrim and accents
 * Interaction: Hover to reveal (desktop), tap to reveal (mobile)
 * Performance: GPU-accelerated animations, respects reduced motion
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { hoverRevealVariants, staggerContainerVariants, staggerItemVariants } from '@/lib/animations/discovery-animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Product } from '@/lib/supabase/types';

interface ProductQuickViewProps {
  product: Product;
  isVisible: boolean;
  onClose?: () => void;
}

/**
 * Extract fragrance notes from product tags
 * Tags like "note-rose", "note-vanilla" become "Rose", "Vanilla"
 */
function extractFragranceNotes(tags: string[] | null): string[] {
  if (!tags) return [];

  return tags
    .filter(tag => tag.startsWith('note-'))
    .map(tag => {
      const note = tag.replace('note-', '');
      return note.charAt(0).toUpperCase() + note.slice(1);
    })
    .slice(0, 5); // Limit to 5 notes for compact display
}

/**
 * ProductQuickView
 *
 * Overlay component that reveals product information on hover/tap.
 * Positioned absolutely over the product card's image area.
 */
export function ProductQuickView({ product, isVisible, onClose }: ProductQuickViewProps) {
  const reducedMotion = useReducedMotion();

  const fragranceNotes = extractFragranceNotes(product.tags);
  const hasNotes = fragranceNotes.length > 0;

  // Strip HTML tags and truncate description to first 80 characters
  const plainDescription = product.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  const truncatedDescription = plainDescription.length > 80
    ? plainDescription.slice(0, 80) + '...'
    : plainDescription;

  // If reduced motion, show/hide instantly without animation
  const variants = reducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : hoverRevealVariants;

  const containerVariants = reducedMotion
    ? { hidden: {}, visible: {} }
    : staggerContainerVariants;

  const itemVariants = reducedMotion
    ? { hidden: {}, visible: {} }
    : staggerItemVariants;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end overflow-hidden"
          onMouseLeave={onClose}
        >
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-[linear-gradient(to_top,var(--scrim),transparent)]" />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 p-3 md:p-4 space-y-2"
          >
            {/* Product Description */}
            <motion.p
              variants={itemVariants}
              className="line-clamp-2 text-[11px] leading-relaxed text-bg"
            >
              {truncatedDescription}
            </motion.p>

            {/* Fragrance Notes */}
            {hasNotes && (
              <motion.div variants={itemVariants} className="flex flex-wrap gap-1.5">
                {fragranceNotes.map((note) => (
                  <span
                    key={note}
                    className="border border-bg/35 bg-bg/10 px-2 py-0.5 font-micro text-[9px] uppercase tracking-[0.08em] text-bg"
                  >
                    {note}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Quick View Button */}
            <motion.div variants={itemVariants}>
              <span
                aria-hidden="true"
                className="inline-block border border-bg/50 px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] text-bg md:text-[11px]"
              >
                Open perfume
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
