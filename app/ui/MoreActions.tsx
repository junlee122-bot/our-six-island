'use client';
import type { ReactNode } from 'react';

/**
 * "더 보기" (D10): a big window shows one main action; everything else folds
 * under this native disclosure (<details>/<summary>: Enter/Space toggle, the
 * open state is read out). The summary keeps a 44px hit area.
 */
export function MoreActions({
  label = '더 보기',
  hint,
  open,
  className = '',
  children,
  'data-testid': testId,
}: {
  label?: ReactNode;
  /** Short note after the label ("3개"), muted. */
  hint?: ReactNode;
  /** Start open (e.g. when the main action has nothing to do). */
  open?: boolean;
  className?: string;
  children: ReactNode;
  'data-testid'?: string;
}) {
  return (
    <details className={`ui-more ${className}`.trim()} open={open} data-testid={testId}>
      <summary>
        <span>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </summary>
      <div className="ui-more-body">{children}</div>
    </details>
  );
}
