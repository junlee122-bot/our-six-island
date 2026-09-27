'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import { Glyph } from './Glyph';

/**
 * The five window skins (UI audit §3.5). Venue colours come from the
 * surrounding [data-venue] (tokens.css), so a `journal` in the tavern is oak.
 *   journal  walnut binding + cream page + taped title — info windows
 *   sign     small wooden plaque — HUD labels, action signs
 *   note     taped paper slip (Gaegu) — news, letters, checklists, toasts
 *   felt     felt + oxblood rail — casino game surfaces
 *   hanji    hanji + lacquer frame — hall game surfaces
 */
export type PanelVariant = 'journal' | 'sign' | 'note' | 'felt' | 'hanji';

export function Panel({
  variant = 'journal',
  title,
  titleId,
  actions,
  footer,
  className = '',
  children,
  as: Tag = 'section',
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  variant?: PanelVariant;
  /** Taped title (journal/note) or plaque text (sign). */
  title?: ReactNode;
  titleId?: string;
  /** Right side of the title row (e.g. a close button). */
  actions?: ReactNode;
  /** Pinned under the page, outside its scroll (usually a KeyHintBar). */
  footer?: ReactNode;
  as?: 'section' | 'div' | 'aside';
}) {
  return (
    <Tag
      className={`ui-panel ${className}`.trim()}
      data-panel={variant}
      // Felt and hanji are venue surfaces: they bring their venue's tokens along.
      data-venue={variant === 'felt' ? 'casino' : variant === 'hanji' ? 'hall' : undefined}
      aria-labelledby={title && titleId ? titleId : undefined}
      {...rest}
    >
      {(title || actions) && (
        <header className="ui-panel-head">
          {title && (
            <h2 className="ui-panel-title" id={titleId}>
              {title}
            </h2>
          )}
          {actions}
        </header>
      )}
      <div className="ui-panel-page">{children}</div>
      {footer && <footer className="ui-panel-foot">{footer}</footer>}
    </Tag>
  );
}

/** The 44×44 × button every window and side panel uses. */
export function CloseButton({ onClick, label = '닫기', className = '' }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button type="button" className={`l-icon ui-close ${className}`.trim()} onClick={onClick} aria-label={label} title={`${label} (Esc)`}>
      <Glyph name="close" size={20} />
    </button>
  );
}
