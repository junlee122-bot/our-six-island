import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { DEFAULT_KEYBINDS, hotbarIndexForCode } from '../app/lounge-keybinds.ts';

// Exercise the real hook's registered listener without a browser, cloud calls,
// or food from a production account. Parse its declaration so unrelated HUD
// rendering and styles do not need to load in Node.
const source = await readFile(new URL('../app/lounge/LifeHud.tsx', import.meta.url), 'utf8');
const file = ts.createSourceFile('LifeHud.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const hook = file.statements.find((s) => ts.isFunctionDeclaration(s) && s.name?.text === 'useHotbarKeys');
assert.ok(hook, 'useHotbarKeys is present');
const { outputText } = ts.transpileModule(hook.getText(file), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
});

function setup({ enabled = true, keys = DEFAULT_KEYBINDS } = {}) {
  const listeners = new Map(), cleanups = [], used = [];
  const state = {
    selected: 0,
    slots: ['can', 'rod', 'dish-soup', '', '', '', '', '', ''],
    setSelected(i) { state.selected = i; },
  };
  let blocked = false, typing = false;
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    useRef: (value) => ({ current: value }),
    useEffect: (effect) => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); },
    getSettings: () => ({ keys }),
    hotbarIndexForCode,
    globalKeyTarget: () => !typing,
    document: { querySelector: () => blocked },
    window: {
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); },
    },
  });
  exports.useHotbarKeys(state, enabled, (item) => used.push(item));
  return {
    state, used, listeners,
    press: (overrides = {}) => listeners.get('keydown')?.({
      code: 'Digit3', repeat: false, defaultPrevented: false,
      ctrlKey: false, metaKey: false, altKey: false, ...overrides,
    }),
    block: (value) => { blocked = value; },
    type: (value) => { typing = value; },
    cleanup: () => cleanups.forEach((fn) => fn()),
  };
}

test('holding a number selects the dish without consuming it; a fresh second press uses it', () => {
  const h = setup();
  h.press();
  assert.equal(h.state.selected, 2);
  for (let n = 0; n < 12; n++) h.press({ repeat: true });
  assert.deepEqual(h.used, []);
  h.press();
  assert.deepEqual(h.used, ['dish-soup']);
  h.press({ repeat: true });
  assert.deepEqual(h.used, ['dish-soup']);
  h.cleanup();
  assert.equal(h.listeners.size, 0);
});

test('repeats cannot consume a dish that was already selected', () => {
  const h = setup();
  h.state.selected = 2;
  h.press({ repeat: true });
  assert.deepEqual(h.used, []);
  h.press();
  assert.deepEqual(h.used, ['dish-soup']);
});

test('custom slot keys keep the same deliberate second-press behavior', () => {
  const h = setup({ keys: { ...DEFAULT_KEYBINDS, hotbar3: 'KeyQ' } });
  h.press();
  assert.equal(h.state.selected, 0);
  h.press({ code: 'KeyQ' });
  h.press({ code: 'KeyQ', repeat: true });
  assert.deepEqual(h.used, []);
  h.press({ code: 'KeyQ' });
  assert.deepEqual(h.used, ['dish-soup']);
});

test('typing, dialogs, modifiers, handled events and disabled hotbars ignore slot input', () => {
  const h = setup();
  for (const key of ['ctrlKey', 'metaKey', 'altKey', 'defaultPrevented']) h.press({ [key]: true });
  h.block(true); h.press(); h.block(false);
  h.type(true); h.press();
  assert.equal(h.state.selected, 0);
  assert.deepEqual(h.used, []);
  const disabled = setup({ enabled: false });
  assert.equal(disabled.listeners.size, 0);
});
