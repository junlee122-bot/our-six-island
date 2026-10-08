'use client';
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Glyph, type GlyphName } from './Glyph';
import { uiClick } from '../lounge/feedback';

export type TabItem<T extends string> = { id: T; label: ReactNode; glyph?: GlyphName; badge?: ReactNode };

/**
 * Paper tabs (rounded on top only). Keyboard: ←/→ (and Home/End) move between
 * tabs like any tablist; with `numberKeys`, 1–9 pick a tab from anywhere in the
 * surrounding dialog (the growth journal's page turning, generalised). Number
 * keys are ignored while typing in a field.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  numberKeys = false,
  idBase,
  className = '',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  numberKeys?: boolean;
  /** Prefix for tab / panel ids; pair with tabPanelProps(idBase, id). */
  idBase?: string;
  className?: string;
}) {
  const auto = useId();
  const base = idBase ?? auto;
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ items, onChange });
  useLayoutEffect(() => {
    latest.current = { items, onChange };
  });
  useEffect(() => {
    if (!numberKeys) return;
    const scope: HTMLElement | Document = ref.current?.closest('dialog') ?? document;
    const onKey = (e: Event) => {
      const k = e as KeyboardEvent;
      if (k.altKey || k.ctrlKey || k.metaKey || k.defaultPrevented) return;
      const t = k.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const n = /^Digit([1-9])$/.exec(k.code)?.[1];
      const item = n ? latest.current.items[Number(n) - 1] : undefined;
      if (!item) return;
      k.preventDefault();
      latest.current.onChange(item.id);
    };
    scope.addEventListener('keydown', onKey);
    return () => scope.removeEventListener('keydown', onKey);
  }, [numberKeys]);
  const move = (dir: number | 'home' | 'end') => {
    const i = items.findIndex((t) => t.id === value);
    const next = dir === 'home' ? 0 : dir === 'end' ? items.length - 1 : (i + dir + items.length) % items.length;
    onChange(items[next].id);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();
  };
  return (
    <div ref={ref} className={`ui-tabs ${className}`.trim()} role="tablist" aria-label={label}>
      {items.map((t, i) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`${base}-tab-${t.id}`}
          aria-controls={`${base}-panel-${t.id}`}
          aria-selected={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          className="ui-tab"
          onClick={() => {
            if (t.id !== value) uiClick();
            onChange(t.id);
          }}
          onKeyDown={(e) => {
            const dir = ({ ArrowRight: 1, ArrowLeft: -1, Home: 'home', End: 'end' } as const)[e.key as 'Home'];
            if (dir === undefined) return;
            e.preventDefault();
            e.stopPropagation();
            move(dir);
          }}
        >
          {t.glyph && <Glyph name={t.glyph} size={18} />}
          <span>{t.label}</span>
          {t.badge}
          {numberKeys && i < 9 && (
            <kbd className="ui-key" aria-hidden="true">
              {i + 1}
            </kbd>
          )}
        </button>
      ))}
    </div>
  );
}

/** Props for the panel a tab controls. */
export const tabPanelProps = (idBase: string, id: string) => ({
  role: 'tabpanel' as const,
  id: `${idBase}-panel-${id}`,
  'aria-labelledby': `${idBase}-tab-${id}`,
});
