'use client';

/**
 * Input — v3.0 token-driven primitive.
 *
 * Spec source: .planning/DESIGN.md §5 (Input).
 *   - 1px border `--border-strong`, 8px radius, body font (Newsreader).
 *   - 12px vertical padding (py-3), 16px horizontal (px-4), text 15px.
 *   - Visible label above (placeholder-only banned by DESIGN §10).
 *   - Focus shows 2px `--accent` ring offset 2px from `--bg`.
 *   - Error state ring `--critical` plus aria-invalid + aria-describedby wiring.
 *   - 7 states: default · hover · focus-visible · active · disabled · loading · error.
 */

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Required visible label rendered above the input. */
  label: string;
  /** Error message rendered below the input; wires aria-invalid + aria-describedby. */
  error?: string;
  /** Helper text rendered below the input when no error is present. */
  hint?: string;
  /** Optional icon rendered inside the input on the leading edge. */
  leadingIcon?: ReactNode;
  /** Optional icon rendered inside the input on the trailing edge. */
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    label,
    error,
    hint,
    leadingIcon,
    trailingIcon,
    id,
    disabled,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 inline-flex shrink-0 text-fg-muted"
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full bg-bg border border-border-strong rounded-[8px] py-3 px-4 text-[15px] font-body text-fg',
            'placeholder:text-fg-muted/60',
            'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            'transition-shadow duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-critical aria-[invalid=true]:border-critical',
            leadingIcon && 'pl-10',
            trailingIcon && 'pr-10',
            className,
          )}
          {...rest}
        />
        {trailingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 inline-flex shrink-0 text-fg-muted"
          >
            {trailingIcon}
          </span>
        )}
      </div>
      {error ? (
        <p id={errorId} className="text-[12px] text-critical mt-1 font-micro">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12px] text-fg-muted mt-1 font-micro">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
