'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

const AiConciergeDrawer = dynamic(() => import('@/components/ai/AiConciergeDrawer'), {
  ssr: false,
});

export const OPEN_CONCIERGE_EVENT = 'aquador:open-concierge';

export function openAiConcierge() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_CONCIERGE_EVENT));
}

export default function AiConciergeWidget() {
  const [open, setOpen] = useState(false);

  const openDrawer = useCallback(() => setOpen(true), []);

  useEffect(() => {
    window.addEventListener(OPEN_CONCIERGE_EVENT, openDrawer);
    return () => window.removeEventListener(OPEN_CONCIERGE_EVENT, openDrawer);
  }, [openDrawer]);

  return (
    <>
      <div
        className={`fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[var(--page-px)] z-[60] transition-opacity duration-[var(--duration-fast)] ${
          open ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-testid="concierge-widget-trigger"
              aria-label="Open Aquad'or AI Agent"
              aria-expanded={open}
              onClick={openDrawer}
              className="group flex h-12 w-12 items-center justify-center border border-border-strong bg-fg text-bg shadow-2 transition-[background-color,color,transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:h-14 md:w-14"
            >
              <MessageCircle
                aria-hidden="true"
                strokeWidth={1.5}
                className="h-5 w-5 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:scale-105"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Talk to the agent</TooltipContent>
        </Tooltip>
      </div>

      {open ? <AiConciergeDrawer isOpen={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
