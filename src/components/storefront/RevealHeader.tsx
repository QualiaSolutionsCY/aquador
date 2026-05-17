'use client';

/**
 * RevealHeader. Shared editorial header cascade used by the homepage sections
 * (NotesStory, BrandStory, JournalTeaser, FeaturedGrid).
 *
 * The cascade renders the canonical §10b opener (hairline rule + h2 + optional
 * body line) and animates them in sequence when the header scrolls into view:
 *
 *   1. rule  — scale-x from 0 to 1 over 0.6s (origin left)
 *   2. h2    — fade in + translate-up over 0.9s
 *   3. body  — fade in + translate-up over 0.9s with 0.2s delay
 *
 * One-shot per element (viewport `once: true`, `amount: 0.4`). Reduced-motion
 * users get an immediate static layout because framer-motion respects
 * `prefers-reduced-motion` via `useReducedMotion` and tokens.css §7 zeroes any
 * residual transition.
 *
 * Title sizing varies between sections (some use --font-h1, others
 * --font-display-2xl), so the caller passes `titleClassName` rather than
 * locking a single scale here.
 */

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

export interface RevealHeaderProps {
  /** Renders inside <h2>. Pass a string or a fragment with <br/> + <span> for italics. */
  title: ReactNode;
  /** Optional supporting body line below the title. */
  body?: ReactNode;
  /**
   * Tailwind classes for the <h2>. Defaults to the section H1 scale.
   * Passed in by sections that need display-2xl instead.
   */
  titleClassName?: string;
  /** Width clamp for the body paragraph. */
  bodyClassName?: string;
  /** Additional classes on the wrapping div (e.g. max-width). */
  className?: string;
  /**
   * When true, the title drifts upward at 0.7x scroll speed for a subtle
   * editorial parallax. Used by FeaturedGrid so the heading "leaves the
   * stage" as the grid below scrolls past at 1x. Reduced motion zeros it.
   */
  parallax?: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function RevealHeader({
  title,
  body,
  titleClassName = 'mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-h1)]',
  bodyClassName = 'mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed',
  className = '',
  parallax = false,
}: RevealHeaderProps) {
  const reducedMotion = useReducedMotion();
  const ruleInitial = reducedMotion ? { scaleX: 1 } : { scaleX: 0 };
  const titleInitial = reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 };
  const bodyInitial = reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 };

  const rootRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', 'end start'],
  });
  // Drift the heading upward by up to 60px across the scroll window. Effect
  // only applied when `parallax` is set AND the user hasn't asked for reduced
  // motion. The transform is gated on the inline style below so non-parallax
  // callers pay zero cost.
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const titleStyle = parallax && !reducedMotion ? { y: parallaxY } : undefined;

  return (
    <div ref={rootRef} className={className}>
      <motion.span
        aria-hidden="true"
        initial={ruleInitial}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ transformOrigin: 'left center' }}
        className="block h-px w-12 bg-border-strong"
      />
      <motion.div style={titleStyle} className="will-change-transform">
        <motion.h2
          initial={titleInitial}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          className={titleClassName}
        >
          {title}
        </motion.h2>
      </motion.div>
      {body ? (
        <motion.p
          initial={bodyInitial}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          className={bodyClassName}
        >
          {body}
        </motion.p>
      ) : null}
    </div>
  );
}
