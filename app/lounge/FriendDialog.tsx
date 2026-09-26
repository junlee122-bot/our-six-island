'use client';
// Talking to an offline friend's NPC (C-3): a speech box with their portrait,
// typewriter text (instant under reduced motion), E / Space / Enter to go
// on, and small-talk choices at the end (1–4 or arrows; the first small talk
// with a friend each day adds a little friendship). Lines come from
// lounge-friend-dialog.ts (lounge-friend-lines.ts + the friend's own lines).
import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ACTORS } from '../lounge-roster';
import { AvatarView } from '../avatar-view';
import { actionForCode } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import type { DialogChoice, DialogScript } from '../lounge-friend-dialog';
import { lookFor } from './friend-looks';
import { Hearts } from './Bonds';
import './social.css';

const TYPE_MS = 28;
const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export function FriendDialog({
  script,
  hearts,
  onTalk,
  onRequest,
  onClose,
}: {
  script: DialogScript;
  hearts: number;
  /** A small-talk answer was picked (the server counts it once a day). */
  onTalk: (choice: DialogChoice, index: number) => void;
  /** "무슨 부탁인데?": open the request card. */
  onRequest: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Pages: the script, then (after a choice) the friend's reply.
  const [reply, setReply] = useState<string | null>(null);
  const pages = reply ? [reply] : [...script.pages, ...(script.question ? [script.question] : [])];
  const [page, setPage] = useState(0);
  const [typed, setTyped] = useState({ text: '', n: 0 });
  const [instant] = useState(reducedMotion);
  const text = pages[Math.min(page, pages.length - 1)] ?? '';
  const shown = typed.text === text ? typed.n : 0;
  const typing = !instant && shown < Array.from(text).length;
  const last = page >= pages.length - 1;
  const showChoices = last && !typing && !reply;

  useEffect(() => {
    const d = ref.current!;
    const opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    d.showModal();
    d.focus();
    return () => {
      d.close();
      if (!document.querySelector('dialog[open]')) opener?.focus({ preventScroll: true });
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
  useEffect(() => {
    if (showChoices) choiceRefs.current[0]?.focus();
  }, [showChoices]);

  const choose = (choice: DialogChoice, index: number) => {
    if (choice.kind === 'bye') return onClose();
    if (choice.kind === 'request') return onRequest();
    onTalk(choice, index);
    setReply(choice.reply || '그렇구나!');
    setPage(0);
  };
  const advance = () => {
    if (typing) {
      setTyped({ text, n: Array.from(text).length });
      return;
    }
    if (!last) {
      setPage((p) => p + 1);
      return;
    }
    if (reply || !script.choices.length) onClose();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.repeat && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (showChoices) {
      const n = Number(e.key);
      if (n >= 1 && n <= script.choices.length) {
        e.preventDefault();
        choose(script.choices[n - 1], n - 1);
        return;
      }
      if (actionForCode(getSettings().keys, e.code) === 'action') {
        const at = choiceRefs.current.findIndex((b) => b === document.activeElement);
        e.preventDefault();
        choose(script.choices[Math.max(0, at)], Math.max(0, at));
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const at = choiceRefs.current.findIndex((b) => b === document.activeElement);
        const next = (at + (e.key === 'ArrowDown' ? 1 : -1) + script.choices.length) % script.choices.length;
        choiceRefs.current[next]?.focus();
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
      aria-label={`${ACTORS[script.friend]}와 이야기`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={onKey}
      data-testid="friend-dialog"
    >
      <div className="l-talk-box">
        <div className="l-talk-portrait" aria-hidden="true">
          <AvatarView actor={script.friend} look={lookFor(script.friend)} portrait />
        </div>
        <div className="l-talk-main">
          <header>
            <strong>{ACTORS[script.friend]}</strong>
            <Hearts level={hearts} size={12} />
            <small className="l-talk-away">쉬는 중 · NPC</small>
          </header>
          <button
            type="button"
            className="l-talk-text"
            onClick={advance}
            aria-live="polite"
            data-testid="friend-dialog-text"
            data-typing={typing || undefined}
          >
            <span aria-hidden={typing || undefined}>{visible}</span>
            {typing && <span className="sr-only">{text}</span>}
          </button>
          {showChoices && script.choices.length > 0 ? (
            <ol className="l-talk-choices" aria-label="대답 고르기">
              {script.choices.map((c, i) => (
                <li key={i}>
                  <button
                    type="button"
                    ref={(el) => {
                      choiceRefs.current[i] = el;
                    }}
                    onClick={() => choose(c, i)}
                    data-kind={c.kind}
                    data-testid={`talk-choice-${i}`}
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
        </div>
      </div>
    </dialog>
  );
}
