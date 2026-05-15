'use client';

/**
 * Admin error boundary, v3.0 editorial admin-direct.
 *
 * Hairline-stack inside the admin shell. No box, no rounded card, no
 * gold-on-black. Voice is admin-direct: terse, operator-facing.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'admin-error',
      message: 'Admin Error',
      level: 'error',
      data: { error, digest: error.digest },
    });
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="bg-bg">
      <div className="border-t border-border" />
      <div className="mx-auto max-w-[var(--container-full)] px-[var(--page-px)] py-16 md:py-24">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          Admin error
        </p>
        <h1 className="mt-4 font-display text-[length:var(--font-h1)] leading-tight tracking-tight text-fg">
          The admin had a problem.
        </h1>
        <p className="mt-4 font-body text-[length:var(--font-size-body)] leading-relaxed text-fg-muted">
          Reload, or check the runbook.
        </p>

        <div className="mt-6 border-t border-border pt-6">
          <p className="font-body text-[length:var(--font-size-body-sm)] text-fg">
            {error.message || 'Unknown error.'}
          </p>
          {error.digest && (
            <p className="mt-2 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              Ref {error.digest}
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button variant="primary" size="md" onClick={() => reset()}>
            Try again
          </Button>
          <Link
            href="/admin"
            className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted hover:text-fg underline-offset-4 hover:underline outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors duration-150"
          >
            Back to admin
          </Link>
        </div>
      </div>
    </div>
  );
}
