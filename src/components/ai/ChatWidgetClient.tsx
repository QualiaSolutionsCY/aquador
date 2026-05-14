'use client';

import dynamic from 'next/dynamic';

/**
 * Client-side wrapper that lazily loads the ChatWidget without SSR.
 *
 * Next 16 disallows `dynamic(..., { ssr: false })` from Server Components, so
 * this 'use client' boundary owns the `ssr: false` option on behalf of
 * `src/app/layout.tsx` (which remains a Server Component).
 */
const ChatWidget = dynamic(() => import('@/components/ai/ChatWidget'), {
  ssr: false,
});

export default function ChatWidgetClient() {
  return <ChatWidget />;
}
