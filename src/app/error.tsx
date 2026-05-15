'use client';

/**
 * Root error boundary, v3.0 editorial direct.
 *
 * Surface: full-bleed `bg-bg`, narrow centered column, hairline at top.
 * Voice: editorial-direct (PRODUCT.md §brand). No em-dashes, no hyphens
 * functioning as dashes. Sentry capture preserved from v2.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="border-t border-border" />
      <div className="mx-auto flex min-h-[calc(100vh-1px)] max-w-[var(--container-narrow)] flex-col items-center justify-center px-[var(--page-px)] py-24 text-center">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          Error
        </p>
        <h1 className="mt-6 font-display text-[length:var(--font-display-2xl)] leading-tight tracking-tight text-fg">
          Something stalled.
        </h1>
        <p className="mt-6 font-body text-[length:var(--font-size-body-lg)] leading-relaxed text-fg-muted">
          The desk lost its footing. Reset and try again. We&apos;ll be back to
          where you were.
        </p>
        {error.digest && (
          <p className="mt-4 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            Ref {error.digest}
          </p>
        )}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Button variant="primary" size="md" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted hover:text-fg underline-offset-4 hover:underline outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors duration-150"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
