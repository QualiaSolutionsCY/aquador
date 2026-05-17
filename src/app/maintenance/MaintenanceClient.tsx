'use client';

/**
 * MaintenanceClient — editorial "Opening 18 May 2026" lock screen.
 *
 * The whole site sits behind this curtain while the v3.0 redesign lands.
 * Middleware redirects every storefront route here unless the request
 * carries the `aq_access=1` cookie. The cookie is set by entering the
 * operator access code below; admin routes bypass entirely.
 *
 * Voice (Aquad'or, M2+):
 *   - "Opening" + the live opening date, set in the brand display serif.
 *   - Restraint over hype: one line of copy, one CTA (Instagram), one
 *     small footer with the unlock affordance.
 *   - No em-dashes, no emoji, no card containers — hairline rules only.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';

const ACCESS_CODE = '516278';

/** Opening date — 18 May 2026 per operator direction (2026-05-17). */
const OPENING = new Date('2026-05-18T00:00:00+02:00');

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function formatOpening(date: Date): { dayMonth: string; year: string } {
  // 18 May · 2026
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  const year = String(date.getFullYear());
  return { dayMonth: `${day} ${month}`, year };
}

function useCountdown(target: Date) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, done: diff === 0 };
}

export default function MaintenanceClient() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { dayMonth, year } = formatOpening(OPENING);
  const countdown = useCountdown(OPENING);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === ACCESS_CODE) {
      setCookie('aq_access', '1', 30);
      router.push('/');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (showLogin) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg px-6">
        <div className="w-full max-w-sm">
          <p className="text-center font-micro uppercase tracking-[0.32em] text-[10px] text-fg-muted">
            Operator access
          </p>
          <h2 className="mt-4 text-center font-display text-fg leading-tight tracking-tight text-[length:var(--font-h2)]">
            Enter the code
          </h2>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              aria-label="Access code"
              aria-invalid={error || undefined}
              className={`w-full bg-bg border rounded-[8px] px-5 py-3 text-center text-[18px] tracking-[0.3em] font-body text-fg placeholder:text-fg-muted/40 outline-none transition-shadow duration-[var(--duration-fast)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                error
                  ? 'border-critical text-critical focus-visible:ring-critical'
                  : 'border-border-strong focus-visible:ring-accent'
              }`}
              autoFocus
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center bg-fg px-6 py-3 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-bg transition-opacity duration-[var(--duration-fast)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Enter
            </button>
          </form>
          <button
            type="button"
            onClick={() => setShowLogin(false)}
            className="mx-auto mt-8 block min-h-[36px] font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg-muted underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:text-fg hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto bg-bg">
      {/* Soft bottle backdrop — kept very faint so the type leads the eye. */}
      <Image
        src="/images/aquadour1.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        className="pointer-events-none select-none object-cover opacity-[0.07]"
      />

      {/* Top eyebrow */}
      <header className="relative z-10 flex items-center justify-between px-[var(--page-px)] pt-8 sm:pt-10">
        <p className="font-micro uppercase tracking-[0.32em] text-[10px] sm:text-[11px] text-fg-muted">
          Aquad&apos;or, Nicosia
        </p>
        <p className="font-micro uppercase tracking-[0.32em] text-[10px] sm:text-[11px] text-fg-muted">
          MMXXVI
        </p>
      </header>

      {/* Main composition */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-[var(--page-px)] py-12 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-micro uppercase tracking-[0.32em] text-[11px] sm:text-[12px] text-fg-muted"
        >
          The desk is being redrawn
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 font-display text-fg leading-[0.95] tracking-[-0.03em] text-[length:var(--font-display-2xl)] sm:text-[length:var(--font-display-3xl)]"
        >
          Opening
          <br />
          <span className="italic text-accent-deep">{dayMonth}</span>
          <span aria-hidden="true" className="text-accent">.</span>
        </motion.h1>

        <motion.span
          aria-hidden="true"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 80, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 block h-px bg-accent"
        />

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 max-w-prose font-body text-[length:var(--font-size-body)] sm:text-[length:var(--font-size-body-lg)] text-fg-muted leading-relaxed"
        >
          A new editorial of the Aquad&apos;or storefront is being finished.
          One hundred fragrances, the Dubai shop, Lattafa originals and the
          create your own studio return on {dayMonth}&nbsp;{year}.
        </motion.p>

        {/* Countdown */}
        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="mt-12 grid grid-cols-4 gap-x-6 gap-y-2 sm:gap-x-10"
          aria-label={`Time remaining until ${dayMonth} ${year}`}
        >
          {[
            { value: countdown.days, label: 'Days' },
            { value: countdown.hours, label: 'Hours' },
            { value: countdown.minutes, label: 'Min' },
            { value: countdown.seconds, label: 'Sec' },
          ].map((unit) => (
            <div key={unit.label} className="flex flex-col items-center">
              <dd className="font-display text-fg leading-none tracking-[-0.02em] text-[length:var(--font-h1)] sm:text-[length:var(--font-display-xl)] tabular-nums">
                {String(unit.value).padStart(2, '0')}
              </dd>
              <dt className="mt-2 font-micro uppercase tracking-[0.18em] text-[10px] text-fg-muted">
                {unit.label}
              </dt>
            </div>
          ))}
        </motion.dl>

        <motion.a
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          href="https://www.instagram.com/aquadorfragrances/"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-12 inline-flex items-center gap-3 rounded-full bg-fg px-6 py-3 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-bg transition-[gap,opacity] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:gap-4 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Follow on Instagram
        </motion.a>
      </main>

      {/* Footer hairline + small affordances */}
      <footer className="relative z-10 border-t border-border px-[var(--page-px)] py-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="font-micro uppercase tracking-[0.18em] text-[10px] sm:text-[11px] text-fg-muted">
            Where luxury meets distinction
          </p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="min-h-[36px] font-micro uppercase tracking-[0.18em] text-[10px] sm:text-[11px] text-fg-muted underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:text-fg hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Operator access
            </button>
            <p className="font-micro uppercase tracking-[0.18em] text-[10px] sm:text-[11px] text-fg-muted">
              By{' '}
              <a
                href="https://qualiasolutions.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-deep transition-opacity duration-[var(--duration-fast)] hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Qualia Solutions
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
