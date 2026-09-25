'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, TriangleAlert } from 'lucide-react';

/** The walkable scene on screen (village or room), if any. */
const SCENES = '[data-testid=village-3d], [data-testid=bedroom-3d]';

/**
 * After a dialog closes: focus its opener if it is still on screen, else the
 * visible scene. Never steals focus from another dialog that is now open.
 */
function restoreFocus(opener: HTMLElement | null) {
  if (document.querySelector('dialog[open]')) return;
  const active = document.activeElement;
  // Something else already took focus (e.g. the next screen's own field).
  if (active instanceof HTMLElement && active !== document.body) return;
  const visible = (e: Element | null): e is HTMLElement =>
    e instanceof HTMLElement && e.isConnected && e.getClientRects().length > 0;
  const target = visible(opener)
    ? opener
    : [...document.querySelectorAll(SCENES)].find(visible);
  target?.focus({ preventScroll: true });
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
  closable = true,
  className = '',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** When false the close button is hidden (e.g. while a recovery code must be saved). */
  closable?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    // Whatever had focus before (a dock button, the 3D scene…) gets it back on
    // close, so WASD walks again without clicking the scene first.
    const opener =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : null;
    d.showModal();
    // Focus the dialog itself so touch users don't see a focus ring on "닫기".
    d.focus();
    return () => {
      d.close();
      restoreFocus(opener);
    };
  }, []);
  const close = () => {
    if (closable) onClose();
  };
  return (
    // Native dialog handles Escape; its click handler only dismisses the backdrop.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      tabIndex={-1}
      className={'l-modal ' + (wide ? 'wide ' : '') + className}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
        }
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          close();
      }}
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        {closable && (
          <button className="l-icon" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        )}
      </header>
      {children}
    </dialog>
  );
}

/** Short text with an optional "자세히" toggle for the long version. */
export function Details({
  summary,
  children,
}: {
  summary: ReactNode;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="l-details">
      <p className="l-modal-intro">
        {summary}
        {children && (
          <>
            {' '}
            <button
              type="button"
              className="l-more"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? '접기' : '자세히'}
            </button>
          </>
        )}
      </p>
      {open && children && <div className="l-help-text">{children}</div>}
    </div>
  );
}

/** Confirmation for actions with consequences; `danger` styles the confirm button red. */
export function ConfirmModal({
  title,
  body,
  consequences = [],
  confirmLabel,
  busyLabel,
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string;
  body: ReactNode;
  consequences?: string[];
  confirmLabel: string;
  busyLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Resolve false (or throw) to keep the dialog open. */
  onConfirm: () => Promise<boolean | void> | boolean | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={title}
      onClose={() => !busy && onClose()}
      className="l-confirm"
    >
      <div className="l-modal-intro">{body}</div>
      {consequences.length > 0 && (
        <ul className="l-consequences">
          {consequences.map((c) => (
            <li key={c}>
              <TriangleAlert size={16} aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>
      )}
      <div className="l-modal-actions">
        <button
          className="l-secondary"
          disabled={busy}
          onClick={onClose}
          autoFocus
        >
          {cancelLabel}
        </button>
        <button
          className={danger ? 'l-danger' : 'l-primary'}
          disabled={busy}
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            try {
              if ((await onConfirm()) !== false) onClose();
            } catch {
              // The caller reports errors through a toast.
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? (busyLabel ?? '처리 중…') : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
