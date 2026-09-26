// Rebindable PC keys for the walkable scenes (village, my room).
//
// Bindings are physical key codes (KeyboardEvent.code), so WASD and the
// letter shortcuts keep working while a Korean IME is on. Pure module: the
// settings store (lounge-settings.ts) persists the table, the scenes and
// lounge-game.tsx read it through `bindingFor` / `actionForCode`.

import { particle, type JosaPair } from './lounge-text.ts';

export type BindAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'action'
  | 'inventory'
  | 'collection'
  | 'bonds'
  | 'tasks'
  | 'map'
  | 'board'
  | 'help'
  | 'menu'
  | 'hotbar1'
  | 'hotbar2'
  | 'hotbar3'
  | 'hotbar4'
  | 'hotbar5'
  | 'hotbar6'
  | 'hotbar7'
  | 'hotbar8'
  | 'hotbar9';

export type Keybinds = Record<BindAction, string>;

export const DEFAULT_KEYBINDS: Readonly<Keybinds> = Object.freeze({
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  action: 'KeyE',
  inventory: 'KeyI',
  collection: 'KeyK',
  bonds: 'KeyL',
  tasks: 'KeyJ',
  map: 'KeyM',
  board: 'KeyB',
  help: 'F1',
  menu: 'Escape',
  hotbar1: 'Digit1',
  hotbar2: 'Digit2',
  hotbar3: 'Digit3',
  hotbar4: 'Digit4',
  hotbar5: 'Digit5',
  hotbar6: 'Digit6',
  hotbar7: 'Digit7',
  hotbar8: 'Digit8',
  hotbar9: 'Digit9',
});

export const BIND_ACTIONS = Object.keys(DEFAULT_KEYBINDS) as BindAction[];

/** Groups and Korean names for the 조작 settings tab and the controls help. */
export const BIND_GROUPS: readonly {
  title: string;
  actions: readonly { action: BindAction; label: string }[];
}[] = [
  {
    title: '걷기',
    actions: [
      { action: 'up', label: '위로 걷기' },
      { action: 'left', label: '왼쪽으로 걷기' },
      { action: 'down', label: '아래로 걷기' },
      { action: 'right', label: '오른쪽으로 걷기' },
      { action: 'action', label: '행동 (들어가기·심기·말 걸기)' },
    ],
  },
  {
    title: '창 열기',
    actions: [
      { action: 'inventory', label: '가방' },
      { action: 'collection', label: '도감' },
      { action: 'bonds', label: '친구 사이' },
      { action: 'tasks', label: '오늘의 부탁' },
      { action: 'map', label: '마을 안내' },
      { action: 'board', label: '마을 게시판 가기' },
      { action: 'help', label: '조작 안내' },
      { action: 'menu', label: '메뉴' },
    ],
  },
  {
    title: '핫바',
    actions: Array.from({ length: 9 }, (_, i) => ({
      action: `hotbar${i + 1}` as BindAction,
      label: `핫바 ${i + 1}번 칸`,
    })),
  },
];

export const BIND_LABEL: Readonly<Record<BindAction, string>> = Object.fromEntries(
  BIND_GROUPS.flatMap((g) => g.actions.map((a) => [a.action, a.label])),
) as Record<BindAction, string>;

/**
 * Keys that can never be bound: modifiers (Shift is 달리기), Tab and Enter
 * (focus and buttons), Space, F11 (전체 화면) and keys the OS or webview keeps.
 */
const RESERVED = new Set([
  'Tab',
  'Enter',
  'NumpadEnter',
  'Space',
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'CapsLock',
  'ContextMenu',
  'F5',
  'F11',
  'F12',
  'PrintScreen',
  'Lang1',
  'Lang2',
  'HangulMode',
  'Hanja',
]);
/** Arrow keys always walk too (fixed second binding), so they are taken. */
export const ARROW_KEYS: Readonly<Record<string, 'up' | 'down' | 'left' | 'right'>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const CODE_SHAPE = /^(Key[A-Z]|Digit[0-9]|Numpad[0-9A-Za-z]+|F([1-9]|1[0-9]|2[0-4])|Escape|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Arrow(Up|Down|Left|Right)|IntlBackslash|IntlRo|IntlYen)$/;

/**
 * Whether a key code may be bound (to `action`, when given). Esc always opens
 * the menu and closes dialogs, so it can only belong to 'menu'.
 */
export function bindableCode(code: string, action?: BindAction): boolean {
  if (code === 'Escape') return action === undefined || action === 'menu';
  return CODE_SHAPE.test(code) && !RESERVED.has(code) && !(code in ARROW_KEYS);
}

/** Label for an action's keys, with the fixed extras ("W · ↑", "Esc"). */
export function bindingLabel(binds: Keybinds, action: BindAction): string {
  const main = binds[action] ? keyLabel(binds[action]) : '';
  const arrow = Object.entries(ARROW_KEYS).find(([, a]) => a === action)?.[0];
  const extra = arrow ? keyLabel(arrow) : action === 'menu' && binds.menu !== 'Escape' ? 'Esc' : '';
  return [main, extra].filter(Boolean).join(' · ') || '없음';
}

/** Short label for a key code, as printed on a key cap ("E", "1", "Esc", "F1"). */
export function keyLabel(code: string | null | undefined): string {
  if (!code) return '없음';
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad[0-9]$/.test(code)) return '숫자판 ' + code.slice(6);
  const named: Record<string, string> = {
    Escape: 'Esc',
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  };
  return named[code] ?? code;
}

// How a key's label is read aloud in Korean, for picking 은/는, 을/를, (으)로.
const LETTER_READING = '에이 비 씨 디 이 에프 지 에이치 아이 제이 케이 엘 엠 엔 오 피 큐 알 에스 티 유 브이 더블유 엑스 와이 제트'.split(' ');
const KEY_READING: Record<string, string> = {
  Esc: '이스케이프', Space: '스페이스', Enter: '엔터', Tab: '탭', Shift: '시프트',
  Backspace: '백스페이스', Delete: '딜리트', Insert: '인서트', Home: '홈', End: '엔드',
  PageUp: '페이지업', PageDown: '페이지다운', CapsLock: '캡스 락', Control: '컨트롤',
  ControlLeft: '컨트롤', ControlRight: '컨트롤', AltLeft: '알트', AltRight: '알트',
  ShiftLeft: '시프트', ShiftRight: '시프트', MetaLeft: '윈도', MetaRight: '윈도',
  ContextMenu: '메뉴', '↑': '위', '↓': '아래', '←': '왼쪽', '→': '오른쪽',
};
/**
 * A key name with the right particle: keyJosa('KeyL', '은/는') → 'L은',
 * keyJosa('Space', '은/는') → 'Space는', keyJosa('Tab', '으로/로') → 'Tab으로'.
 * Symbols with no clear reading become '` 키는' (always correct).
 */
export function keyJosa(code: string, pair: JosaPair): string {
  const label = keyLabel(code);
  let reading = KEY_READING[label] ?? KEY_READING[code];
  if (!reading && /^[A-Z]$/.test(label)) reading = LETTER_READING[label.charCodeAt(0) - 65];
  if (!reading && /^(F\d{1,2}|숫자판 \d|\d)$/.test(label)) reading = label.replace(/^숫자판 /, '');
  if (!reading) return `${label} 키${particle('키', pair)}`;
  return label + particle(reading, pair);
}

/**
 * Reads a stored table: unknown actions are dropped, invalid or duplicate
 * codes fall back to the default (or to nothing when the default is taken).
 */
export function readKeybinds(value: unknown): Keybinds {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const out = { ...DEFAULT_KEYBINDS } as Keybinds;
  const used = new Map<string, BindAction>();
  // Stored choices first, in table order, so a valid custom key wins over a default.
  for (const action of BIND_ACTIONS) {
    const code = raw[action];
    if (
      typeof code === 'string' &&
      (code === '' || (bindableCode(code, action) && !used.has(code)))
    ) {
      out[action] = code;
      if (code) used.set(code, action);
    } else out[action] = '';
  }
  for (const action of BIND_ACTIONS) {
    if (out[action] || raw[action] === '') continue;
    const fallback = DEFAULT_KEYBINDS[action];
    if (!used.has(fallback)) {
      out[action] = fallback;
      used.set(fallback, action);
    }
  }
  return out;
}

/** Actions that share a key (a valid table has none). */
export function keybindConflicts(binds: Keybinds): [BindAction, BindAction][] {
  const seen = new Map<string, BindAction>();
  const out: [BindAction, BindAction][] = [];
  for (const action of BIND_ACTIONS) {
    const code = binds[action];
    if (!code) continue;
    const other = seen.get(code);
    if (other) out.push([other, action]);
    else seen.set(code, action);
  }
  return out;
}

export type RebindResult =
  | { ok: true; binds: Keybinds; swapped: BindAction | null }
  | { ok: false; reason: 'reserved' };

/**
 * Binds `code` to `action`. When another action already uses it, the two
 * trade keys (so nothing is ever bound twice) and `swapped` names the other one.
 */
export function rebind(binds: Keybinds, action: BindAction, code: string): RebindResult {
  if (!bindableCode(code, action)) return { ok: false, reason: 'reserved' };
  const current = binds[action];
  if (current === code) return { ok: true, binds, swapped: null };
  const other = BIND_ACTIONS.find((a) => a !== action && binds[a] === code) ?? null;
  const next = { ...binds, [action]: code };
  // Esc stays the menu's: the menu gives it up only for nothing.
  if (other) next[other] = current === 'Escape' ? '' : current;
  return { ok: true, binds: next, swapped: other };
}

/** The action a key code triggers (arrow keys walk), or null. */
export function actionForCode(binds: Keybinds, code: string): BindAction | null {
  if (code in ARROW_KEYS) return ARROW_KEYS[code];
  if (code === 'Escape') return 'menu';
  for (const action of BIND_ACTIONS) if (binds[action] === code) return action;
  return null;
}

/** Walking direction for a key code under these bindings. */
export function directionForCode(
  binds: Keybinds,
  code: string,
): 'up' | 'down' | 'left' | 'right' | null {
  const action = actionForCode(binds, code);
  return action === 'up' || action === 'down' || action === 'left' || action === 'right'
    ? action
    : null;
}

/** Hotbar slot index (0–8) for a key code, or -1. */
export function hotbarIndexForCode(binds: Keybinds, code: string): number {
  const action = actionForCode(binds, code);
  return action?.startsWith('hotbar') ? Number(action.slice(6)) - 1 : -1;
}
