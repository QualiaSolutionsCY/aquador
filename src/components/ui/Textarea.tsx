'use client';

/**
 * Textarea — v3.0 token-driven primitive.
 *
 * Same surface contract as Input (DESIGN §5):
 *   - 1px border `--border-strong`, 8px radius, body font (Newsreader).
 *   - 12px vertical padding, 16px horizontal, text 15px.
 *   - Visible label above (placeholder-only banned).
 *   - Focus + error states wired identically to Input.
 *   - `resize-y` so users can grow the field; default `rows={4}`.
 */

import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Required visible label rendered above the textarea. */
  label: string;
  /** Error message rendered below; wires aria-invalid + aria-describedby. */
  error?: string;
  /** Helper text rendered below when no error is present. */
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, label, error, hint, id, rows = 4, disabled, ...rest },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={textareaId}
          className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
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
            'resize-y min-h-24',
            className,
          )}
          {...rest}
        />
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
  },
);
