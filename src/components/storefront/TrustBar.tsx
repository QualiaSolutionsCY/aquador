import { RotateCcw, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrustBarProps {
  variant?: 'inline' | 'compact';
  className?: string;
}

const TRUST_ITEMS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Truck, label: 'Ships in three days' },
  { icon: RotateCcw, label: 'Returns within thirty' },
  { icon: ShieldCheck, label: 'Authenticity guaranteed' },
];

/**
 * Imported by PDP in Phase 2.2, then Cart drawer and Checkout in Phase 2.4.
 */
export function TrustBar({ variant = 'inline', className }: TrustBarProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center text-fg-muted',
        isCompact ? 'gap-x-4 gap-y-2' : 'gap-x-6 gap-y-3',
        className,
      )}
    >
      {TRUST_ITEMS.map(({ icon: Icon, label }, index) => (
        <span key={label} className="contents">
          {index > 0 && (
            <span
              aria-hidden="true"
              className="hidden h-3 w-px bg-border sm:inline-block"
            />
          )}
          <span className="flex items-center gap-2 font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em]">
            <Icon
              aria-hidden="true"
              size={isCompact ? 14 : 16}
              strokeWidth={1.5}
              className="shrink-0 text-fg-muted"
            />
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}

export default TrustBar;
