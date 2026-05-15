'use client';

/**
 * AiConciergeEntry. Editorial inline trigger that opens the concierge Drawer
 * (HOME-04). Phase 2.5 will replace the placeholder body with the actual chat
 * surface; this task ships the substrate so the link works.
 *
 * Spec: .planning/DESIGN.md §10b. Hairline-divider section, type-led layout,
 * NO Card wrapper. Explicitly NOT a chatbot widget: no MessageCircle icon, no
 * floating viewport-bottom-right bubble, no chat input box. Just an editorial
 * inline button (font-micro, uppercase, underline-on-hover) that opens a
 * standard Drawer with the locked placeholder body.
 *
 * Voice constants locked in phase-1-plan.md and grepped by the verifier.
 */

import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/Drawer';

export default function AiConciergeEntry() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)] text-center">
        <p className="mx-auto max-w-[var(--container-narrow)] font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          A perfumer reads your message and replies within a day.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-8 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg underline-offset-4 hover:underline focus-visible:underline outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors duration-150"
        >
          Ask the desk
        </button>
      </section>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>The desk is open.</DrawerTitle>
            <DrawerDescription>
              Three perfumers staff the desk. Tell us a scent you keep coming
              back to, or a moment you want to bottle. The full reply surface
              arrives with Phase 2.5; the substrate ships now so the link
              works.
            </DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </>
  );
}
