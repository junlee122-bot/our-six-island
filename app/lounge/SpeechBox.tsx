'use client';
// The box for talking to someone where they stand. A resting friend's NPC
// (FriendDialog.tsx) and the village residents (NpcTalkDialog.tsx) both use
// it, so the two cannot drift apart. Docked at the bottom centre over the
// scene (the world stays visible): portrait on the left, name and hearts on
// top with a small status on the right, typewriter text (instant under
// reduced motion), E / Space / Enter to go on, and numbered choices after
// the last page (number keys or arrows, E picks). Esc closes and focus goes
// back to what opened it. Styles: speech-box.css.
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { MessageCircle } from '../ui/icons';
import { actionForCode } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import { Hearts } from './Hearts';
import { restoreFocus } from './Modal';
import './speech-box.css';

const TYPE_MS = 28;
const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export type SpeechChoice = {
  label: ReactNode;
  /** data-kind: 'bye' is drawn quieter, 'request' with an orange edge. */
  kind?: string;
  /** Listed but not pickable (today's talk is done, they are out of reach…). */
  disabled?: boolean;
  testId?: string;
};

export function SpeechBox({
  label,
  testId,
  textTestId,
  portrait,
  name,
  hearts,
  level,
  status,
  pages,
  page,
  choices,
  choicesLabel = '대답 고르기',
  focusChoice,
  note,
  onChoose,
  onNext,
  onClose,
  onKeys,
  children,
}: {
  /** The dialog's name for screen readers ("민서와 이야기"). */
  label: string;
  testId?: string;
  textTestId?: string;
  portrait: ReactNode;
  name: string;
  /** Hearts shown, 0–10. */
  hearts: number;
  /** A small word after the hearts ("인사하는 사이"). */
  level?: string;
  /** Small status on the right ("쉬는 중 · NPC"). */
  status: string;
  pages: readonly string[];
  page: number;
  /** Offered once the last page has typed out. */
  choices?: readonly SpeechChoice[];
  choicesLabel?: string;
  /** The choice that gets focus when they appear (default: the first one that can be picked). */
  focusChoice?: number;
  /** A short line under the choices or the picker (why something cannot be picked now). */
  note?: string;
  onChoose?: (index: number) => void;
  /** E / Space / Enter (or a click on the text) once the page has typed out and no choices are shown. */
  onNext: () => void;
  onClose: () => void;
  /** Keys for `children` (an item picker); return true when handled. */
  onKeys?: (e: KeyboardEvent<HTMLDialogElement>) => boolean;
  /** Shown instead of the choices and the key hint (an item picker). */
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [typed, setTyped] = useState({ text: '', n: 0 });
  const [instant] = useState(reducedMotion);
  const text = pages[Math.min(page, pages.length - 1)] ?? '';
  const shown = typed.text === text ? typed.n : 0;
  const typing = !instant && shown < Array.from(text).length;
  const last = page >= pages.length - 1;
  const inset = children !== undefined && children !== null && children !== false;
  const list = choices ?? [];
  const showChoices = !inset && last && !typing && list.length > 0;
  const pickable = (i: number) => i >= 0 && i < list.length && !list[i].disabled;
  const firstPickable = Math.max(0, list.findIndex((c) => !c.disabled));
  const focused = () => choiceRefs.current.findIndex((b) => !!b && b === document.activeElement);

  useEffect(() => {
    const d = ref.current!;
    const opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    d.showModal();
    d.focus();
    return () => {
      d.close();
      restoreFocus(opener);
    };
  }, []);
  // Typewriter.
  useEffect(() => {
    if (instant) return;
    const total = Array.from(text).length;
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setTyped((t) => (t.text === text && t.n >= n ? t : { text, n }));
      if (n >= total) clearInterval(timer);
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [text, instant]);
  // The choices take focus when they appear (only then: a later re-render,
  // e.g. a choice turning unavailable, must not move the cursor).
  const want = focusChoice !== undefined && pickable(focusChoice) ? focusChoice : firstPickable;
  const wasShown = useRef(false);
  useEffect(() => {
    if (showChoices && !wasShown.current) choiceRefs.current[want]?.focus();
    wasShown.current = showChoices;
  }, [showChoices, want]);
  // A focused button that went away (a picker closing) leaves focus on the
  // page; keep it in the box so the keys still work.
  useEffect(() => {
    const d = ref.current;
    if (d?.open && document.activeElement === document.body) d.focus({ preventScroll: true });
  });

  const pick = (i: number) => {
    if (pickable(i)) onChoose?.(i);
  };
  /** The next choice that can be picked from `from`, wrapping around (-1: none). */
  const step = (from: number, dir: 1 | -1) => {
    const n = list.length;
    for (let k = 1; k <= n; k++) {
      const i = (((from + dir * k) % n) + n) % n;
      if (pickable(i)) return i;
    }
    return -1;
  };
  const advance = () => {
    if (typing) {
      setTyped({ text, n: Array.from(text).length });
      return;
    }
    if (!showChoices && !inset) onNext();
  };
  const onKey = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.repeat && !e.key.startsWith('Arrow')) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (inset) {
      onKeys?.(e);
      return;
    }
    if (showChoices) {
      const n = Number(e.key);
      if (n >= 1 && n <= list.length) {
        e.preventDefault();
        pick(n - 1);
        return;
      }
      if (actionForCode(getSettings().keys, e.code) === 'action') {
        const at = focused();
        e.preventDefault();
        pick(at >= 0 ? at : want);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = step(focused(), e.key === 'ArrowDown' ? 1 : -1);
        if (next >= 0) choiceRefs.current[next]?.focus();
      }
      return;
    }
    const bound = actionForCode(getSettings().keys, e.code);
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter' || bound === 'action') {
      e.preventDefault();
      advance();
    }
  };
  const visible = instant ? text : Array.from(text).slice(0, shown).join('');
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the dialog owns its keys (advance / choose).
    <dialog
      ref={ref}
      tabIndex={-1}
      className="l-talk"
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={onKey}
      data-testid={testId}
    >
      <div className="l-talk-box">
        <div className="l-talk-portrait" aria-hidden="true">
          {portrait}
        </div>
        <div className="l-talk-main">
          <header>
            <strong>{name}</strong>
            <Hearts level={hearts} size={12} />
            {level && <small className="l-talk-level">{level}</small>}
            <small className="l-talk-away">{status}</small>
          </header>
          <button type="button" className="l-talk-text" onClick={advance} aria-live="polite" data-testid={textTestId} data-typing={typing || undefined}>
            <span aria-hidden={typing || undefined}>{visible}</span>
            {typing && <span className="sr-only">{text}</span>}
          </button>
          {inset ? (
            children
          ) : showChoices ? (
            <ol className="l-talk-choices" aria-label={choicesLabel}>
              {list.map((c, i) => (
                <li key={i}>
                  <button
                    type="button"
                    ref={(el) => {
                      choiceRefs.current[i] = el;
                    }}
                    onClick={() => pick(i)}
                    aria-disabled={c.disabled || undefined}
                    data-kind={c.kind}
                    data-testid={c.testId}
                  >
                    <kbd>{i + 1}</kbd> {c.label}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="l-talk-hint">
              <MessageCircle size={13} aria-hidden="true" /> {typing ? 'E·Space로 바로 보기' : last ? 'E·Space로 닫기' : `E·Space로 다음 (${page + 1}/${pages.length})`}
            </p>
          )}
          {note && (showChoices || inset) && <output className="l-talk-note">{note}</output>}
        </div>
      </div>
    </dialog>
  );
}
