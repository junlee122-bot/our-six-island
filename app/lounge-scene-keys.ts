// Keyboard routing for the walkable scenes (village, my room). Their keys are
// heard on window, so WASD keeps walking after a dialog closes and focus lands
// on body or on the button that opened it. Text fields, widgets with their own
// arrow keys, open dialogs and hidden scenes are left alone. Which key does
// what comes from the player's bindings (lounge-keybinds.ts, 설정 → 조작).
import {
  actionForCode,
  directionForCode,
  type BindAction,
} from './lounge-keybinds';
import { getSettings } from './lounge-settings';

const OWN_KEYS =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role=slider], [role=radiogroup], [role=tablist], [role=listbox], [role=menu], [role=grid]';
const PRESSABLE = 'button, a[href], summary, [role=button]';

/**
 * Who a key press on window belongs to: `'scene'` (focus on the scene or
 * body), `'button'` (a focused button: walking is fine, Enter/Space are the
 * button's), or null (not the scene's key at all).
 */
export function sceneKeyTarget(
  e: KeyboardEvent,
  host: HTMLElement,
): 'scene' | 'button' | null {
  if (e.defaultPrevented || !host.isConnected || !host.getClientRects().length)
    return null;
  if (document.querySelector('dialog[open]')) return null;
  const target = e.target instanceof Element ? e.target : null;
  if (!target || target === host) return 'scene';
  if (target.closest(OWN_KEYS)) return null;
  return target.closest(PRESSABLE) ? 'button' : 'scene';
}

/** The walkable scene on screen (village, my room, hall or casino), if any. */
export function visibleSceneHost(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  for (const el of document.querySelectorAll<HTMLElement>(
    '[data-testid=village-3d], [data-testid=bedroom-3d], [data-testid=village-simple], [data-testid=interior-3d], [data-testid=interior-simple]',
  ))
    if (el.isConnected && el.getClientRects().length) return el;
  return null;
}

/**
 * The same routing for app-wide shortcuts (I, K, M, Esc…): they apply only
 * while a walkable scene is showing, no dialog is open and focus is not in a
 * field or a widget with its own keys.
 */
export function globalKeyTarget(e: KeyboardEvent): 'scene' | 'button' | null {
  const host = visibleSceneHost();
  return host ? sceneKeyTarget(e, host) : null;
}

/** The rebindable action this key press means (arrows walk, Esc is the menu). */
export function boundAction(e: KeyboardEvent): BindAction | null {
  return actionForCode(getSettings().keys, e.code);
}

/** Walking direction for this key press under the player's bindings. */
export function boundDirection(e: KeyboardEvent) {
  return directionForCode(getSettings().keys, e.code);
}
