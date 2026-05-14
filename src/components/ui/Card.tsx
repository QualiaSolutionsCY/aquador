'use client';

/**
 * Card — v3.0 display surface primitive (Phase 3 Task 2, PRIM-02).
 *
 * Compound API:
 *   <Card>                 surface — bg-bg-alt, rounded-sm, p-6, no border by default
 *     <CardHeader>         flex flex-col gap-1 pb-4
 *       <CardTitle>        h3 — display font, 18px, tight tracking
 *       <CardDescription>  p  — body font, 14px, fg-muted
 *     </CardHeader>
 *     <CardContent>        flex flex-col gap-4
 *     <CardFooter>         flex items-center justify-between pt-4 with top border
 *   </Card>
 *
 * Pass `interactive` on Card to lift it on hover with --shadow-1. Editorial
 * restraint: no border in the resting state, no scale, no glow ring.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, the card lifts on hover with --shadow-1 and shows pointer cursor. */
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-bg-alt rounded-sm p-6',
        interactive &&
          'hover:shadow-1 transition-shadow duration-150 cursor-pointer',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1 pb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-fg text-[18px] font-display tracking-tight',
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-fg-muted text-[14px] font-body', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between pt-4 border-t border-border',
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
