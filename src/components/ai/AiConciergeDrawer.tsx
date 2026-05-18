'use client';

/**
 * AiConciergeDrawer. The concierge surface (Phase 2.5 Task 3).
 *
 * An editorial inline-thread drawer that consumes the SSE stream from
 * `/api/ai-assistant`, hydrates from `sessionStorage` so the thread persists
 * across pages within the same tab, and serializes the live cart into
 * `cartContext.cartSummary` on every request so the desk can speak to what
 * the shopper has in front of them.
 *
 * Voice and layout constraints (DESIGN.md section 10b):
 *   - NO message bubbles. NO container-card wrappers. Hairline-divider stack only.
 *   - Each turn is a two-column block: role micro-label in the left column,
 *     prose in the right column, `border-t border-border` between turns.
 *   - Locked microcopy lives in `VOICE` below and is grepped by the verifier.
 *
 * Motion (DESIGN.md section 7 / 10b motion-pattern catalogue):
 *   - `streaming-token reveal`: each token wraps in a `<span>` with
 *     `animation: fade-in var(--duration-fast) var(--ease-out-quart) both`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { z } from 'zod';
import { Send } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/components/cart/CartProvider';

// Voice strings. Locked by the verifier. Edit only with planner approval.
const VOICE = {
  greeting:
    'Three perfumers handle this desk. Tell us a scent you keep coming back to, or a moment you want to bottle.',
  inputPlaceholder: 'Type to begin.',
  inputLabel: 'Your message',
  sendAriaLabel: 'Send message',
  header: "Aquad'or AI Agent",
  errorTitle: "We couldn't reach the desk. Try again.",
} as const;

const SESSION_KEY = 'aquador_concierge_thread';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

const messageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number(),
});

const threadSchema = z.array(messageSchema);

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function seedGreeting(): Message {
  return {
    id: newId(),
    role: 'assistant',
    content: VOICE.greeting,
    timestamp: Date.now(),
  };
}

/**
 * Minimal Markdown link renderer. Matches `[label](url)` and emits an anchor;
 * everything else passes through as plain text. Deliberately no heavyweight
 * markdown library. The assistant's system prompt restricts output to prose
 * plus inline links.
 */
function renderMarkdownLinks(content: string): React.ReactNode[] {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      out.push(content.slice(lastIndex, match.index));
    }
    const [, label, url] = match;
    out.push(
      <a
        key={`lnk-${key++}`}
        href={url}
        className="underline-offset-4 text-accent-deep hover:underline"
      >
        {label}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    out.push(content.slice(lastIndex));
  }
  return out;
}

export interface AiConciergeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiConciergeDrawer({ isOpen, onClose }: AiConciergeDrawerProps) {
  const { cart } = useCart();
  const { toast } = useToast();
  const inputId = useId();

  const [messages, setMessages] = useState<Message[]>(() => [seedGreeting()]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Hydrate from sessionStorage on mount (client-only). Wrap in try/catch —
  // sessionStorage throws in private-browsing modes; degrade to in-memory.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        const result = threadSchema.safeParse(parsed);
        if (result.success && result.data.length > 0) {
          setMessages(result.data as Message[]);
        }
      }
    } catch {
      // ignore. keep the seeded greeting
    }
    setHydrated(true);
  }, []);

  // Persist on every messages change AFTER hydration so we don't overwrite a
  // valid stored thread with the seeded greeting on first paint.
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    } catch {
      // ignore. private browsing
    }
  }, [messages, hydrated]);

  // Auto-scroll to the bottom as new tokens arrive or new turns append.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Focus the input when the drawer opens. The Drawer primitive (Radix
  // Dialog under the hood) traps focus and returns it to the trigger on
  // close; we just nudge the initial focus into the composer.
  useEffect(() => {
    if (!isOpen) return;
    const handle = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(handle);
  }, [isOpen]);

  // Surface fetch errors via the global toast. The error state controls
  // whether we re-toast on subsequent renders; cleared on next submit.
  useEffect(() => {
    if (error) {
      toast({ title: VOICE.errorTitle, variant: 'error' });
    }
  }, [error, toast]);

  const cartSummary = useMemo(
    () =>
      cart.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        // CartItem.price is in EUR major units (float); the API expects
        // integer cents. Round to avoid float drift.
        price_cents: Math.round(item.price * 100),
      })),
    [cart.items],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: Message = {
        id: newId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };
      const placeholder: Message = {
        id: newId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      // Snapshot the conversation including the new user turn for the API
      // call, but excluding the empty placeholder.
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMessage, placeholder]);
      setInput('');
      setError(null);
      setIsStreaming(true);

      try {
        const response = await fetch('/api/ai-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            messages: apiMessages,
            cartContext: { cartSummary },
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`AI request failed: ${response.status}`);
        }

        const reader = (response.body as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let done = false;

        while (!done) {
          const chunk = await reader.read();
          done = chunk.done;
          if (chunk.value) {
            buffer += decoder.decode(chunk.value, { stream: !done });
          }

          // Parse complete SSE frames separated by a blank line.
          let frameBreak = buffer.indexOf('\n\n');
          while (frameBreak !== -1) {
            const rawFrame = buffer.slice(0, frameBreak);
            buffer = buffer.slice(frameBreak + 2);
            frameBreak = buffer.indexOf('\n\n');

            // Each frame is one or more lines starting with `data:`. We only
            // care about the first data line.
            const dataLine = rawFrame
              .split('\n')
              .find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();

            if (payload === '[DONE]') {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(payload) as { token?: string };
              const token = parsed.token;
              if (typeof token === 'string' && token.length > 0) {
                setMessages((prev) => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last && last.id === placeholder.id) {
                    next[next.length - 1] = {
                      ...last,
                      content: last.content + token,
                    };
                  }
                  return next;
                });
              }
            } catch {
              // Drop malformed frames; the route also tolerates these.
            }
          }
        }
      } catch (err) {
        // Strip the empty placeholder on failure so the user can retry.
        setMessages((prev) =>
          prev[prev.length - 1]?.content === ''
            ? prev.slice(0, -1)
            : prev,
        );
        setError(err instanceof Error ? err.message : 'unknown');
      } finally {
        setIsStreaming(false);
      }
    },
    [cartSummary, input, isStreaming, messages],
  );

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DrawerContent
        data-testid="concierge-drawer"
        aria-label="Aquad'or AI Agent"
        className="gap-0 p-0"
      >
        <DrawerHeader className="px-8 pt-8 pb-6">
          <h2 className="font-display text-[length:var(--font-h2)] font-medium text-fg tracking-[-0.01em] leading-tight">
            {VOICE.header}
          </h2>
        </DrawerHeader>

        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto px-8"
          aria-live="polite"
          aria-busy={isStreaming || undefined}
        >
          {messages.map((message, index) => {
            const isFirst = index === 0;
            const roleLabel = message.role === 'user' ? 'You' : 'Desk';
            const isStreamingThis =
              isStreaming &&
              index === messages.length - 1 &&
              message.role === 'assistant';
            return (
              <article
                key={message.id}
                className={
                  isFirst
                    ? 'grid grid-cols-[4rem_1fr] gap-x-4 py-6'
                    : 'grid grid-cols-[4rem_1fr] gap-x-4 border-t border-border py-6'
                }
              >
                <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
                  {roleLabel}
                </p>
                <div className="font-body text-[length:var(--font-size-body)] text-fg leading-relaxed">
                  <span
                    className="animate-fade-in"
                    style={{ animationFillMode: 'both' }}
                  >
                    {renderMarkdownLinks(message.content)}
                  </span>
                  {isStreamingThis && (
                    <span
                      aria-hidden="true"
                      className="ml-1 inline-block h-[1em] w-px align-[-0.15em] bg-fg-muted animate-pulse"
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-border bg-bg px-8 py-6 flex items-end gap-3"
        >
          <div className="flex-1 flex flex-col gap-2">
            <label
              htmlFor={inputId}
              className="sr-only"
            >
              {VOICE.inputLabel}
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={VOICE.inputPlaceholder}
              autoComplete="off"
              disabled={isStreaming}
              className="w-full bg-bg border border-border-strong rounded-[8px] py-3 px-4 text-[15px] font-body text-fg placeholder:text-fg-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-shadow duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            aria-label="Send message"
            isLoading={isStreaming}
            disabled={!input.trim() || isStreaming}
          >
            <Send aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
          </Button>
        </form>

        <p className="border-t border-border bg-bg-alt px-8 py-3 font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg-muted text-center">
          Powered by{' '}
          <a
            href="https://qualiasolutions.cy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg transition-colors duration-[var(--duration-fast)] hover:text-accent-deep"
          >
            Qualia Solutions
          </a>
        </p>
      </DrawerContent>
    </Drawer>
  );
}
