'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Check, CircleAlert, Info } from 'lucide-react';
import { playCue } from './feedback';

export type ToastKind = 'success' | 'error' | 'info';
export type ToastState = { id: number; kind: ToastKind; text: string } | null;
export type Notify = (text: string, kind?: ToastKind) => void;

export function useToast(): [ToastState, Notify] {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const notify = useCallback<Notify>((text, kind = 'success') => {
    if (!text) return;
    // A fresh id re-announces repeated identical messages.
    setToast({ id: ++seq.current, kind, text });
    if (kind === 'error') playCue('error');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setToast(null),
      kind === 'error' ? 6000 : 4000,
    );
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return [toast, notify];
}

export function Toast({ toast }: { toast: ToastState }) {
  const ref = useRef<HTMLDivElement>(null);
  // A manual popover sits in the top layer, so toasts stay visible above open dialogs.
  useLayoutEffect(() => {
    const el = ref.current as
      | (HTMLDivElement & { showPopover?: () => void })
      | null;
    try {
      el?.showPopover?.();
    } catch {}
  }, [toast?.id]);
  if (!toast) return null;
  const Icon =
    toast.kind === 'error' ? CircleAlert : toast.kind === 'info' ? Info : Check;
  return (
    <div
      key={toast.id}
      ref={ref}
      popover="manual"
      className={'l-toast is-' + toast.kind}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
    >
      <Icon size={16} aria-hidden="true" />
      <span>{toast.text}</span>
    </div>
  );
}
