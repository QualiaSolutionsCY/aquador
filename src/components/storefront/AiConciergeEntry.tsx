'use client';

/**
 * AiConciergeEntry. Editorial inline trigger that opens the concierge Drawer
 * (HOME-04). Phase 2.5 Task 3 replaced the placeholder body with the actual
 * chat surface (`AiConciergeDrawer`); this file only owns the trigger button
 * and the open/close state.
 *
 * Spec: .planning/DESIGN.md §10b. Hairline-divider section, type-led layout,
 * NO Card wrapper. Explicitly NOT a chatbot widget: no MessageCircle icon, no
 * floating viewport-bottom-right bubble, no chat input box. Just an editorial
 * inline button (font-micro, uppercase, underline-on-hover) that opens a
 * standard Drawer with the concierge body.
 */

import { useState } from 'react';
import AiConciergeDrawer from '@/components/ai/AiConciergeDrawer';

export default function AiConciergeEntry() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="border-t border-border py-24 md:py-32 px-[var(--page-px)] text-center scroll-mt-24">
        <p className="mx-auto max-w-[var(--container-narrow)] font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          A perfumer reads your message and replies within a day.
        </p>
        <button
          type="button"
          data-testid="concierge-trigger"
          onClick={() => setOpen(true)}
          className="mt-8 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg underline-offset-4 hover:underline focus-visible:underline outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors duration-150"
        >
          Ask the desk
        </button>
      </section>

      <AiConciergeDrawer isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
