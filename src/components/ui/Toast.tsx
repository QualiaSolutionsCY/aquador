'use client';

/**
 * Toast — v3.0 hand-rolled notification system.
 *
 * Deliberately NOT `sonner` / `react-hot-toast`: those ship hardcoded surface
 * styles that fight DESIGN.md §5 (warm bone surface, oxblood critical, no
 * untuned-black shadows).
 *
 * Public API:
 *   <Toaster>{children}</Toaster>          // wraps app shell in layout.tsx
 *   const { toast, dismiss } = useToast(); // consumed in feature code
 *   toast({ title, description?, variant?, duration? })
 *
 * Spec (DESIGN.md §5 / §6 / §7): --bg-alt surface, 1px --border, --radius-sm,
 * --shadow-2, 250ms slide-in-right / slide-out-right. Max 5 toasts; FIFO drop.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'error';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after N ms. Default 5000. Pass 0 to make sticky. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, 'duration'>> {
  id: string;
  duration: number;
}

const DEFAULT_TOAST_DURATION = 5000;
const MAX_TOASTS = 5;

type Action =
  | { type: 'ADD'; toast: ToastItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE'; id: string; patch: Partial<ToastItem> };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case 'ADD': {
      const next = [...state, action.toast];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    }
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    case 'UPDATE':
      return state.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t));
    default:
      return state;
  }
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <Toaster>');
  return ctx;
}

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    dispatch({ type: 'REMOVE', id });
  }, []);

  const toast = useCallback((opts: ToastOptions): string => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const variant: ToastVariant = opts.variant ?? 'default';
    // Error toasts without an explicit duration stay until dismissed.
    const duration = opts.duration !== undefined ? opts.duration : variant === 'error' ? 0 : DEFAULT_TOAST_DURATION;
    const item: ToastItem = { id, title: opts.title, description: opts.description ?? '', variant, duration };
    dispatch({ type: 'ADD', toast: item });
    if (duration > 0) {
      const timer = setTimeout(() => {
        timers.current.delete(id);
        dispatch({ type: 'REMOVE', id });
      }, duration);
      timers.current.set(id, timer);
    }
    return id;
  }, []);

  useEffect(() => {
    const handles = timers.current;
    return () => {
      handles.forEach((handle) => clearTimeout(handle));
      handles.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItemView key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItemView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon = item.variant === 'success' ? CheckCircle : item.variant === 'error' ? AlertCircle : null;
  const iconColor = item.variant === 'success' ? 'text-success' : item.variant === 'error' ? 'text-critical' : '';
  const role = item.variant === 'error' ? 'alert' : 'status';
  return (
    <div
      role={role}
      aria-atomic="true"
      data-state="open"
      className={cn(
        'pointer-events-auto bg-bg-alt border border-border rounded-sm shadow-2',
        'p-4 min-w-[20rem] max-w-[24rem] flex items-start gap-3',
        'data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right',
      )}
    >
      {Icon && <Icon aria-hidden="true" strokeWidth={1.5} className={cn('h-5 w-5 mt-0.5 shrink-0', iconColor)} />}
      <div className="flex-1 min-w-0">
        <p className="font-body text-[length:var(--font-size-body-sm)] font-medium text-fg leading-snug">{item.title}</p>
        {item.description && (
          <p className="mt-1 font-body text-[length:var(--font-size-body-sm)] text-fg-muted leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className={cn(
          'shrink-0 inline-flex h-8 w-8 items-center justify-center -mr-1 -mt-1',
          'rounded-sm text-fg-muted hover:text-fg transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
          'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        )}
      >
        <X aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
      </button>
    </div>
  );
}
