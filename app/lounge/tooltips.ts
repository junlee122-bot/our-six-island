// Hover and focus tooltips for icon-only buttons (PC): one floating label in
// the top layer (a manual popover, so it also shows above open dialogs).
//
// Any button or link whose visible text is empty gets its aria-label as the
// tooltip; `data-tip` sets the text explicitly on any element. The shortcut
// comes from `data-bind` (a rebindable action, see lounge-keybinds.ts, so it
// follows 설정 → 조작) or from `aria-keyshortcuts`.
import { useEffect } from 'react';
import { bindingLabel, BIND_ACTIONS, type BindAction } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';

const CANDIDATES =
  '[data-tip], button[aria-label], a[aria-label], [role=button][aria-label], [data-bind]';
const SHOW_DELAY = 350;

/** The tooltip text and key for an element, or null when it needs none. */
export function tooltipFor(el: Element): { text: string; key: string } | null {
  const explicit = el.getAttribute('data-tip');
  const label = el.getAttribute('aria-label');
  const title = el.getAttribute('title');
  // Buttons that show their name need no tooltip (unless asked with data-tip).
  const visibleText = (el.textContent ?? '').replace(/\s+/g, '');
  const text = explicit || (!visibleText || el.hasAttribute('data-bind') ? label || title : null);
  if (!text) return null;
  const bind = el.getAttribute('data-bind');
  const key =
    bind && (BIND_ACTIONS as string[]).includes(bind)
      ? bindingLabel(getSettings().keys, bind as BindAction)
      : (el.getAttribute('aria-keyshortcuts') ?? '');
  return { text, key };
}

function place(tip: HTMLElement, target: Element) {
  const r = target.getBoundingClientRect();
  const w = tip.offsetWidth,
    h = tip.offsetHeight;
  const gap = 8;
  let top = r.top - h - gap;
  if (top < 6) top = r.bottom + gap;
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(6, Math.min(left, innerWidth - w - 6));
  tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

/** Installs the tooltip layer once for the app. */
export function useTooltips() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const tip = document.createElement('div');
    tip.className = 'l-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.setAttribute('aria-hidden', 'true');
    tip.dataset.testid = 'tooltip';
    const popover = 'showPopover' in tip;
    if (popover) tip.setAttribute('popover', 'manual');
    const textEl = document.createElement('span');
    const keyEl = document.createElement('kbd');
    tip.appendChild(textEl);
    tip.appendChild(keyEl);
    document.body.appendChild(tip);
    let timer = 0;
    /** The element under the mouse (tooltip pending or shown). */
    let current: Element | null = null;
    const hide = () => {
      clearTimeout(timer);
      current = null;
      tip.dataset.open = 'false';
      if (popover && tip.matches(':popover-open')) tip.hidePopover();
    };
    const show = (target: Element) => {
      const info = tooltipFor(target);
      if (!info || !target.isConnected) return;
      // A native title would show a second, unstyled tooltip.
      if (target.hasAttribute('title')) {
        if (!target.getAttribute('aria-label'))
          target.setAttribute('aria-label', target.getAttribute('title') ?? '');
        target.removeAttribute('title');
      }
      textEl.textContent = info.text;
      keyEl.textContent = info.key;
      keyEl.hidden = !info.key;
      if (popover) {
        // Re-show so it stacks above a dialog opened since.
        if (tip.matches(':popover-open')) tip.hidePopover();
        tip.showPopover();
      }
      tip.dataset.open = 'true';
      place(tip, target);
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const target = (e.target as Element | null)?.closest?.(CANDIDATES) ?? null;
      if (target === current) return;
      hide();
      if (!target || !tooltipFor(target)) return;
      current = target;
      timer = window.setTimeout(() => show(target), SHOW_DELAY);
    };
    const out = (e: PointerEvent) => {
      if (!current) return;
      const to = e.relatedTarget as Node | null;
      if (to && current.contains(to)) return;
      hide();
    };
    const focus = (e: FocusEvent) => {
      const target = e.target as Element | null;
      if (!target?.matches?.(':focus-visible')) return;
      const el = target.closest(CANDIDATES);
      hide();
      if (el) {
        current = el;
        show(el);
      }
    };
    document.addEventListener('pointerover', over, true);
    document.addEventListener('pointerout', out, true);
    document.addEventListener('focusin', focus, true);
    document.addEventListener('focusout', hide, true);
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('keydown', hide, true);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('blur', hide);
    return () => {
      hide();
      tip.remove();
      document.removeEventListener('pointerover', over, true);
      document.removeEventListener('pointerout', out, true);
      document.removeEventListener('focusin', focus, true);
      document.removeEventListener('focusout', hide, true);
      document.removeEventListener('pointerdown', hide, true);
      document.removeEventListener('keydown', hide, true);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('blur', hide);
    };
  }, []);
}
