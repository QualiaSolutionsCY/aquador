'use client';

/**
 * Tabs — v3.0 horizontal tab primitive.
 *
 * Wraps `@radix-ui/react-tabs` (roving-tab-index, arrow-key nav, ARIA
 * `tablist` semantics — all free).
 *
 * Compound exports:
 *   Tabs, TabsList, TabsTrigger, TabsContent
 *
 * Compose pattern:
 *   <Tabs defaultValue="overview">
 *     <TabsList>
 *       <TabsTrigger value="overview">Overview</TabsTrigger>
 *       <TabsTrigger value="reviews">Reviews</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="overview">…</TabsContent>
 *     <TabsContent value="reviews">…</TabsContent>
 *   </Tabs>
 *
 * Spec (DESIGN.md §3 / §5):
 *   - TabsList: inline-flex, gap-1, border-b border-border
 *   - TabsTrigger: micro Geist 13px UPPERCASE tracking-0.05em
 *   - Active state: text-fg + 2px border-bottom accent (overhangs list border via -mb-px)
 *   - Idle: text-fg-muted; hover: text-fg
 */

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 border-b border-border',
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        // Layout — overhang the list's bottom border by 1px so the active
        // 2px underline reads as continuous with the list rule.
        'inline-flex items-center justify-center -mb-px',
        'px-4 py-2',
        // Micro typography (§3) — Geist UPPERCASE 13px tracking 0.05em.
        'font-micro text-[13px] uppercase tracking-[0.05em] font-medium',
        // Default state.
        'text-fg-muted border-b-2 border-transparent',
        // Hover — pull the label toward fg even before activation.
        'hover:text-fg',
        // Active state — Radix sets data-state="active".
        'data-[state=active]:text-fg data-[state=active]:border-accent',
        // Motion — CSS transition only (no spring physics, §7 ban).
        'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
        // Focus ring.
        'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        // Disabled.
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // No selection of label text on rapid tab clicks.
        'select-none whitespace-nowrap',
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-6',
        'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm',
        className,
      )}
      {...props}
    />
  );
});
