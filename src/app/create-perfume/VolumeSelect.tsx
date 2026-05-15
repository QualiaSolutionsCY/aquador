'use client';

/**
 * VolumeSelect: 50ml / 100ml radio row with hairline divider between
 * options. Prices come from calculatePrice in src/lib/perfume/pricing.ts;
 * nothing here hardcodes a number.
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioItem } from '@/components/ui/Radio';
import { calculatePrice } from '@/lib/perfume/pricing';
import type { PerfumeVolume } from '@/lib/perfume/types';

interface VolumeSelectProps {
  value: PerfumeVolume;
  onChange: (v: PerfumeVolume) => void;
  eyebrow: string;
  title: string;
  description: string;
}

const OPTIONS: Array<{
  value: PerfumeVolume;
  label: string;
  caption: string;
}> = [
  { value: '50ml', label: '50 ml', caption: 'Fifty millilitres for daily.' },
  { value: '100ml', label: '100 ml', caption: 'One hundred for the shelf.' },
];

function formatEur(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function VolumeSelect({
  value,
  onChange,
  eyebrow,
  title,
  description,
}: VolumeSelectProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      node.setAttribute('data-revealed', 'true');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-revealed="false"
      className={cn(
        'opacity-0 translate-y-4',
        'data-[revealed=true]:opacity-100 data-[revealed=true]:translate-y-0',
        'transition-all duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)]',
      )}
    >
      <header className="mb-8">
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-2">
          {eyebrow}
        </p>
        <h2 className="font-display text-[length:var(--font-h2)] text-fg mb-3">
          {title}
        </h2>
        <p className="font-body text-[length:var(--font-size-body)] text-fg-muted max-w-prose leading-relaxed">
          {description}
        </p>
      </header>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as PerfumeVolume)}
        className="border-t border-border"
      >
        {OPTIONS.map((option, index) => {
          const price = calculatePrice(option.value);
          const id = `volume-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                'flex items-center gap-4 py-6',
                index < OPTIONS.length - 1 && 'border-b border-border',
                'cursor-pointer transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
                'hover:bg-bg-alt/40',
              )}
            >
              <RadioItem id={id} value={option.value} />
              <span className="flex-1 flex items-baseline justify-between">
                <span className="flex flex-col">
                  <span className="font-display text-[length:var(--font-h3)] text-fg">
                    {option.label}
                  </span>
                  <span className="font-body text-[length:var(--font-size-body-sm)] text-fg-muted mt-1">
                    {option.caption}
                  </span>
                </span>
                <span className="font-body text-[length:var(--font-size-body-lg)] text-accent-deep">
                  {formatEur(price)}
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </section>
  );
}
