'use client';
import { Fragment, type ReactNode } from 'react';
import { keyLabel, type BindAction } from '../lounge-keybinds';
import { useSettings } from '../lounge-settings';

/**
 * One keycap style for the whole game. Pass a rebindable `action` (reads the
 * player's current keys from 설정 → 조작), a key `code` ("Escape"), or a plain
 * `label` ("Ctrl+Z"). Inside a button it is decorative (the button carries its
 * name and aria-keyshortcuts); in a KeyHintBar it is read (`decorative={false}`).
 */
export function KeyHint({
  action,
  code,
  label,
  className = '',
  decorative = true,
}: {
  action?: BindAction;
  code?: string;
  label?: string;
  className?: string;
  decorative?: boolean;
}) {
  const [settings] = useSettings();
  const text = label ?? keyLabel(action ? settings.keys[action] : code);
  return (
    <kbd className={`ui-key ${className}`.trim()} aria-hidden={decorative || undefined}>
      {text}
    </kbd>
  );
}

export type KeyHintItem = {
  /** Keys shown before the verb; several render as one group ("← ↑ ↓ →"). */
  keys: (BindAction | { code: string } | { label: string })[];
  /** What the key does, as a short verb phrase ("칸 고르기", "닫기"). */
  does: ReactNode;
};

/**
 * The strip of key hints at the bottom of a window: "[E] 가꾸기 · [Esc] 닫기".
 * Keycap first, then the verb (the audit's rule for description lines).
 */
export function KeyHintBar({ items, className = '', label = '키 안내' }: { items: KeyHintItem[]; className?: string; label?: string }) {
  return (
    <p className={`ui-keybar ${className}`.trim()} aria-label={label}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="ui-keybar-sep" aria-hidden="true">
              ·
            </span>
          )}
          <span className="ui-keybar-item">
            {item.keys.map((k, j) =>
              typeof k === 'string' ? (
                <KeyHint key={j} action={k} decorative={false} />
              ) : 'code' in k ? (
                <KeyHint key={j} code={k.code} decorative={false} />
              ) : (
                <KeyHint key={j} label={k.label} decorative={false} />
              ),
            )}
            <span>{item.does}</span>
          </span>
        </Fragment>
      ))}
    </p>
  );
}
