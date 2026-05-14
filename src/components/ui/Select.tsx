'use client';

/**
 * Select — v3.0 token-driven primitive wrapping @radix-ui/react-select.
 *
 * Spec source: .planning/DESIGN.md §5 (Input surface contract reused for trigger).
 *   - Trigger styled like Input: border-border-strong, rounded-[8px], py-3/px-4.
 *   - Content portal: bg-bg-alt, border-border, shadow-2, rounded-sm.
 *   - Item highlighted: bg-bg. Selected: bg-accent/12.
 *   - Icons: ChevronDown (trigger), Check (selected item), stroke 1.5 lucide.
 *   - Radix handles keyboard navigation per ARIA defaults.
 *
 * Public API: re-exports Root / Group / Value / Trigger / Content / Item / Label
 * / Separator as a `Select` namespace plus `SelectItem` as a top-level named
 * export for ergonomic destructuring at call sites.
 */

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const Root = SelectPrimitive.Root;
const Group = SelectPrimitive.Group;
const Value = SelectPrimitive.Value;

const Trigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...rest }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex w-full items-center justify-between gap-2',
        'bg-bg border border-border-strong rounded-[8px] py-3 px-4 text-[15px] font-body text-fg',
        'placeholder:text-fg-muted/60',
        'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'transition-shadow duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'data-[placeholder]:text-fg-muted/60',
        'aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-critical aria-[invalid=true]:border-critical',
        className,
      )}
      {...rest}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.5}
          className="h-4 w-4 text-fg-muted shrink-0"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

const ScrollUpButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(function SelectScrollUpButton({ className, ...rest }, ref) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn(
        'flex cursor-default items-center justify-center py-1 text-fg-muted',
        className,
      )}
      {...rest}
    >
      <ChevronUp aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  );
});

const ScrollDownButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(function SelectScrollDownButton({ className, ...rest }, ref) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn(
        'flex cursor-default items-center justify-center py-1 text-fg-muted',
        className,
      )}
      {...rest}
    >
      <ChevronDown aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  );
});

const Content = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent(
  { className, children, position = 'popper', ...rest },
  ref,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          'relative z-50 min-w-[8rem] overflow-hidden',
          'bg-bg-alt border border-border rounded-sm shadow-2',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className,
        )}
        {...rest}
      >
        <ScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <ScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

const Label = forwardRef<
  ElementRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...rest }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        'px-4 py-2 font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted',
        className,
      )}
      {...rest}
    />
  );
});

const Item = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...rest }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center',
        'px-4 py-2 pr-8 text-[14px] font-body text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
        'data-[highlighted]:bg-bg',
        'data-[state=checked]:bg-accent/12',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-3 inline-flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check
            aria-hidden="true"
            strokeWidth={1.5}
            className="h-4 w-4 text-accent"
          />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
});

const Separator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...rest }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...rest}
    />
  );
});

export const Select = {
  Root,
  Group,
  Value,
  Trigger,
  Content,
  Label,
  Item,
  Separator,
};

export const SelectItem = Item;
export const SelectTrigger = Trigger;
export const SelectContent = Content;
export const SelectValue = Value;
export const SelectRoot = Root;
export const SelectGroup = Group;
export const SelectLabel = Label;
export const SelectSeparator = Separator;
