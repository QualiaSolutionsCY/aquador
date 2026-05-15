'use client';

/**
 * FadeUp. Shared IntersectionObserver wrapper for editorial fade-up reveals.
 *
 * Spec: .planning/DESIGN.md §10b Motion rule 10. One-shot (disconnects on
 * first intersection). opacity 0 to 1, translate-y 4 to 0. Uses motion tokens
 * (--duration-base, --ease-out-quart). prefers-reduced-motion is zeroed
 * globally by tokens.css §7.
 *
 * Used by Hero, NotesStory, BrandStory, JournalTeaser to wrap title blocks
 * and supporting copy so the homepage feels alive without slop.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface FadeUpProps {
  children: ReactNode;
  className?: string;
  /** Optional milliseconds of stagger delay before the reveal kicks in. */
  delay?: number;
}

export default function FadeUp({ children, className = '', delay = 0 }: FadeUpProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
}
