'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const HEARTBEAT_INTERVAL = 120_000; // 2 minutes

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('aq_sid');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('aq_sid', id);
  }
  return id;
}

export function useVisitorHeartbeat() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    function sendHeartbeat() {
      const payload = JSON.stringify({
        sessionId,
        page: pathnameRef.current,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/heartbeat', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/heartbeat', {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {});
      }
    }

    // Send immediately on mount
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
