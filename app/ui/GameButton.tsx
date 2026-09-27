'use client';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Glyph, type GlyphName } from './Glyph';
import { KeyHint } from './KeyHint';
import type { BindAction } from '../lounge-keybinds';

export type GameButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type GameButtonSize = 's' | 'm' | 'l';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: GameButtonVariant;
  /** s = 36px plate (tables, rows) · m = 44px (default) · l = 52px (the one main action). All keep a ≥44px hit area. */
  size?: GameButtonSize;
  glyph?: GlyphName;
  /** A rebindable action's key, shown as a keycap after the label ("거두기 [E]"). */
  keyAction?: BindAction;
  /** A fixed key label instead ("Enter", "1"). */
  keyLabel?: string;
  /** Why it is disabled; shown as the tooltip and read after the label. */
  disabledReason?: string;
  /** Icon-only button: the label becomes the accessible name. */
  iconOnly?: boolean;
  children?: ReactNode;
};

/**
 * The one button of the game UI: a pressable wooden/paper plate.
 * Disabled buttons keep readable text (their own colour tokens, never opacity).
 */
export const GameButton = forwardRef<HTMLButtonElement, Props>(function GameButton(
  {
    variant = 'secondary',
    size = 'm',
    glyph,
    keyAction,
    keyLabel,
    disabledReason,
    iconOnly = false,
    className = '',
    type = 'button',
    title,
    children,
    ...rest
  },
  ref,
) {
  const reason = rest.disabled ? disabledReason : undefined;
  return (
    <button
      ref={ref}
      type={type}
      className={`ui-btn ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
      title={reason ?? title}
      aria-label={iconOnly && typeof children === 'string' ? children : rest['aria-label']}
      {...rest}
    >
      {glyph && <Glyph name={glyph} size={size === 's' ? 16 : 20} />}
      {iconOnly ? null : <span className="ui-btn-label">{children}</span>}
      {reason && <span className="sr-only"> · {reason}</span>}
      {(keyAction || keyLabel) && <KeyHint action={keyAction} label={keyLabel} />}
    </button>
  );
});
