'use client';
import type { ReactNode } from 'react';
import { Glyph, type GlyphName } from './Glyph';

/**
 * "Nothing here yet" that still says what to do next: a glyph, one line of
 * what is missing, a hint (where / when / how), and at most one action.
 */
export function EmptyState({
  glyph,
  title,
  hint,
  action,
  children,
  className = '',
}: {
  glyph: GlyphName;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  /** Extra content under the hint (e.g. a small shelf of suggestions). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`ui-empty ${className}`.trim()}>
      <span className="ui-empty-glyph">
        <Glyph name={glyph} size={36} />
      </span>
      <p className="ui-empty-title">{title}</p>
      {hint && <p className="ui-empty-hint">{hint}</p>}
      {children}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}
