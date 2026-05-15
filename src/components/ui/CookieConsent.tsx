'use client';

/**
 * CookieConsent, v3.0 editorial hairline strip.
 *
 * Replaces the v2.0 rounded card with gold halo. Surface is a fixed-bottom
 * full-width band on `bg-bg-alt` with a single `border-t border-border`
 * hairline. No rounded corners on the wrapper, no Card primitive, no gold
 * backgrounds, no Playfair. Voice is editorial-direct (PRODUCT.md §brand).
 *
 * Persistence: localStorage key `aquador_cookies_v3`. The v2 key
 * (`aquador_cookie_consent`) is deliberately retired (different schema), so
 * users who previously accepted re-confirm under the new wording.
 *
 * A11y: not a modal, focus is not trapped. Escape dismisses the strip.
 * Button focus-visible rings come from the Button primitive.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

const COOKIE_CONSENT_KEY = 'aquador_cookies_v3';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        const timer = window.setTimeout(() => setIsVisible(true), 1200);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // localStorage may throw in private mode; fail closed (don't show).
    }
  }, []);

  const dismiss = useCallback((value: 'accepted' | 'dismissed') => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {
      // ignore quota / disabled storage
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss('dismissed');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, dismiss]);

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg-alt border-t border-border py-4 px-[var(--page-px)]"
    >
      <div className="mx-auto flex max-w-[var(--container-wide)] flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex-1">
          <p className="font-body text-fg text-[length:var(--font-size-body-sm)] leading-relaxed">
            <span className="font-medium text-fg">This site uses cookies.</span>{' '}
            <span className="text-fg-muted">
              Performance and analytics only. Nothing leaves the desk.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted hover:text-fg underline-offset-4 hover:underline outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-alt transition-colors duration-150"
          >
            Read the policy
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => dismiss('accepted')}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
