'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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

  return open ? <AiConciergeDrawer isOpen={open} onClose={() => setOpen(false)} /> : null;
}
