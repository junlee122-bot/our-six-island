// Keyboard routing for the walkable scenes (village, my room). Their keys are
// heard on window, so WASD keeps walking after a dialog closes and focus lands
// on body or on the button that opened it. Text fields, widgets with their own
// arrow keys, open dialogs and hidden scenes are left alone.

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
