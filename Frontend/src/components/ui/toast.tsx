import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** True while it plays its exit animation. */
  leaving: boolean;
}

export interface ToastApi {
  /** A green toast, e.g. "Item saved." */
  success: (message: string) => void;
  /** A red toast, e.g. the error message the API sent. */
  error: (message: string) => void;
}

/** How long a toast stays up. Errors stay longer so there's time to read them. */
const DURATION_MS: Record<ToastKind, number> = { success: 4000, error: 7000 };

/** Matches the toast-out animation in globals.css. */
const EXIT_MS = 200;

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside a ToastProvider');
  return value;
}

/** Shows toasts in the top-right corner (across the top on phones). Wrap the app in it once. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = useCallback((callback: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, ms);
    timers.current.add(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
      later(() => setToasts((current) => current.filter((toast) => toast.id !== id)), EXIT_MS);
    },
    [later],
  );

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, kind, message, leaving: false }]);
      later(() => dismiss(id), DURATION_MS[kind]);
    },
    [dismiss, later],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (message) => show('success', message), error: (message) => show('error', message) }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((toast) => (
          <ToastView key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = toast.kind === 'success' ? CircleCheck : CircleAlert;

  return (
    <div
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-lg',
        toast.kind === 'success' ? 'bg-success' : 'bg-destructive',
        toast.leaving ? 'animate-toast-out' : 'animate-toast-in',
        'motion-reduce:animate-none',
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p className="flex-1 leading-relaxed font-medium">{toast.message}</p>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="-mr-1 rounded-md p-0.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
