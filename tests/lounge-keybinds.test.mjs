// PC key bindings (설정 → 조작): defaults, conflicts, rebinding and the
// stored-table reader (migration from missing / broken / older tables).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BIND_ACTIONS,
  BIND_GROUPS,
  DEFAULT_KEYBINDS,
  actionForCode,
  bindableCode,
  bindingLabel,
  directionForCode,
  hotbarIndexForCode,
  keyLabel,
  keybindConflicts,
  readKeybinds,
  rebind,
} from '../app/lounge-keybinds.ts';

test('defaults are the usual PC keys and have no conflicts', () => {
  assert.equal(DEFAULT_KEYBINDS.up, 'KeyW');
  assert.equal(DEFAULT_KEYBINDS.action, 'KeyE');
  assert.equal(DEFAULT_KEYBINDS.inventory, 'KeyI');
  assert.equal(DEFAULT_KEYBINDS.collection, 'KeyK');
  assert.equal(DEFAULT_KEYBINDS.bonds, 'KeyL');
  assert.equal(DEFAULT_KEYBINDS.map, 'KeyM');
  assert.equal(DEFAULT_KEYBINDS.help, 'F1');
  assert.equal(DEFAULT_KEYBINDS.menu, 'Escape');
  assert.equal(DEFAULT_KEYBINDS.hotbar1, 'Digit1');
  assert.equal(DEFAULT_KEYBINDS.hotbar9, 'Digit9');
  assert.deepEqual(keybindConflicts({ ...DEFAULT_KEYBINDS }), []);
  // Every action has a Korean label in the settings table.
  const listed = BIND_GROUPS.flatMap((g) => g.actions.map((a) => a.action));
  assert.deepEqual([...listed].sort(), [...BIND_ACTIONS].sort());
  assert.ok(Object.isFrozen(DEFAULT_KEYBINDS));
});

test('conflicts are reported pairwise', () => {
  const binds = { ...DEFAULT_KEYBINDS, map: 'KeyI' };
  assert.deepEqual(keybindConflicts(binds), [['inventory', 'map']]);
});

test('rebinding to a free key moves only that action', () => {
  const r = rebind({ ...DEFAULT_KEYBINDS }, 'inventory', 'KeyP');
  assert.equal(r.ok, true);
  assert.equal(r.binds.inventory, 'KeyP');
  assert.equal(r.swapped, null);
  assert.deepEqual(keybindConflicts(r.binds), []);
  assert.equal(actionForCode(r.binds, 'KeyP'), 'inventory');
  assert.equal(actionForCode(r.binds, 'KeyI'), null);
});

test('rebinding to a used key swaps the two actions (never a duplicate)', () => {
  const r = rebind({ ...DEFAULT_KEYBINDS }, 'inventory', 'KeyM');
  assert.equal(r.ok, true);
  assert.equal(r.binds.inventory, 'KeyM');
  assert.equal(r.binds.map, 'KeyI');
  assert.equal(r.swapped, 'map');
  assert.deepEqual(keybindConflicts(r.binds), []);
  // Moving keys can take a hotbar digit too.
  const up = rebind({ ...DEFAULT_KEYBINDS }, 'up', 'Digit1');
  assert.equal(up.binds.hotbar1, 'KeyW');
  assert.equal(hotbarIndexForCode(up.binds, 'KeyW'), 0);
  assert.equal(directionForCode(up.binds, 'Digit1'), 'up');
});

test('reserved keys are refused and Esc belongs to the menu only', () => {
  for (const code of ['Tab', 'Enter', 'Space', 'ShiftLeft', 'ControlLeft', 'F11', 'ArrowUp', 'MetaLeft', 'Unidentified', ''])
    assert.equal(rebind({ ...DEFAULT_KEYBINDS }, 'inventory', code).ok, false, code);
  assert.equal(bindableCode('Escape', 'inventory'), false);
  assert.equal(bindableCode('Escape', 'menu'), true);
  // Menu moves to P: Esc still opens it (fixed), and nothing else gets Esc.
  const r = rebind({ ...DEFAULT_KEYBINDS }, 'menu', 'KeyP');
  assert.equal(r.ok, true);
  assert.equal(actionForCode(r.binds, 'KeyP'), 'menu');
  assert.equal(actionForCode(r.binds, 'Escape'), 'menu');
  assert.equal(bindingLabel(r.binds, 'menu'), 'P · Esc');
  // Taking a key the menu uses leaves the menu with only Esc, not the key.
  const back = rebind(r.binds, 'inventory', 'KeyP');
  assert.equal(back.binds.inventory, 'KeyP');
  assert.equal(back.binds.menu, 'KeyI');
  const fromEsc = rebind({ ...DEFAULT_KEYBINDS }, 'help', 'F2');
  assert.equal(fromEsc.binds.menu, 'Escape');
});

test('arrow keys always walk, bound keys follow the table', () => {
  const binds = { ...DEFAULT_KEYBINDS, up: 'KeyZ' };
  assert.equal(directionForCode(binds, 'ArrowUp'), 'up');
  assert.equal(directionForCode(binds, 'KeyZ'), 'up');
  assert.equal(directionForCode(binds, 'KeyW'), null);
  assert.equal(bindingLabel(binds, 'up'), 'Z · ↑');
  assert.equal(hotbarIndexForCode(binds, 'Digit5'), 4);
  assert.equal(hotbarIndexForCode(binds, 'KeyQ'), -1);
});

test('key labels read like key caps', () => {
  assert.equal(keyLabel('KeyE'), 'E');
  assert.equal(keyLabel('Digit3'), '3');
  assert.equal(keyLabel('Escape'), 'Esc');
  assert.equal(keyLabel('F1'), 'F1');
  assert.equal(keyLabel('Slash'), '/');
  assert.equal(keyLabel(''), '없음');
});

test('stored tables: missing, broken, duplicate and unknown entries fall back safely', () => {
  // Nothing stored (older settings without keys) -> defaults.
  assert.deepEqual(readKeybinds(undefined), { ...DEFAULT_KEYBINDS });
  assert.deepEqual(readKeybinds('KeyE'), { ...DEFAULT_KEYBINDS });
  assert.deepEqual(readKeybinds([1, 2]), { ...DEFAULT_KEYBINDS });
  // A custom key survives; its old default is free for nobody else.
  const custom = readKeybinds({ inventory: 'KeyP', extra: 'KeyQ' });
  assert.equal(custom.inventory, 'KeyP');
  assert.equal('extra' in custom, false);
  // Invalid codes fall back to the default.
  assert.equal(readKeybinds({ action: 'Tab' }).action, 'KeyE');
  assert.equal(readKeybinds({ action: 42 }).action, 'KeyE');
  // A duplicate (hand-edited storage) keeps the first and frees the second.
  const dup = readKeybinds({ inventory: 'KeyM', map: 'KeyM' });
  assert.equal(dup.inventory, 'KeyM');
  assert.equal(dup.map, '');
  assert.deepEqual(keybindConflicts(dup), []);
  // A custom key that is another action's default: that action gets nothing
  // rather than a duplicate.
  const taken = readKeybinds({ help: 'KeyI' });
  assert.equal(taken.help, 'KeyI');
  assert.equal(taken.inventory, '');
  assert.deepEqual(keybindConflicts(taken), []);
  // An explicitly unbound action stays unbound.
  assert.equal(readKeybinds({ board: '' }).board, '');
  // Esc stored for another action is refused.
  assert.equal(readKeybinds({ inventory: 'Escape' }).inventory, 'KeyI');
});
