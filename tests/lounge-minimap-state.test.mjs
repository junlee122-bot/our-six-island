import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const { MINIMAP_OPEN_KEY, minimapOpen, setMinimapOpen, toggleMinimap } = await import('../app/lounge-minimap-state.ts');

test('the minimap starts folded and an open map is saved until the player folds it again', () => {
  assert.equal(minimapOpen(), false);
  setMinimapOpen(true);
  assert.equal(store.get(MINIMAP_OPEN_KEY), '1');
  assert.equal(minimapOpen(), true);
  setMinimapOpen(false);
  assert.equal(store.get(MINIMAP_OPEN_KEY), '0');
  assert.equal(minimapOpen(), false);
});

test('M toggles the shared map both ways', () => {
  setMinimapOpen(false);
  toggleMinimap();
  assert.equal(minimapOpen(), true);
  toggleMinimap();
  assert.equal(minimapOpen(), false);
  assert.equal(store.get(MINIMAP_OPEN_KEY), '0');
});

test('hub and district maps share the saved choice instead of a fresh open state per mount', () => {
  for (const file of ['app/lounge-village.tsx', 'app/lounge/DistrictMinimap.tsx']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /useMinimapOpen\(\)/, file);
    assert.doesNotMatch(src, /\[(miniOpen|open), set(MiniOpen|Open)\] = useState\(true\)/, file);
  }
});
