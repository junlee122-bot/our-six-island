import test from 'node:test';
import assert from 'node:assert/strict';
import { reportFailures, UI_METRICS } from '../scripts/ui-report.mjs';

const screen = () => ({ file: 'shot.png', ...Object.fromEntries(UI_METRICS.map((k) => [k, 0])) });
const report = () => ({ views: { fhd: { screens: { growth: screen(), 'growth-research': screen() }, notes: [], errors: [] } } });
const selected = { views: ['fhd'], only: ['growth'] };

test('a targeted group includes its related screens and allows excluded screens', () => {
  assert.deepEqual(reportFailures(report(), selected), []);
  const r = report();
  delete r.views.fhd.screens['growth-research'];
  assert.ok(reportFailures(r, selected).some((x) => x.includes('growth-research: missing screen')));
});
test('missing viewports, invalid measurements and browser errors fail closed', () => {
  assert.ok(reportFailures(report(), { ...selected, views: ['s'] }).includes('s: missing viewport'));
  const r = report();
  r.views.fhd.screens.growth = { err: 'detached page' };
  r.views.fhd.notes.push('screenshot failed');
  r.views.fhd.errors.push('pageerror: broken widget');
  const failures = reportFailures(r, selected);
  assert.ok(failures.some((x) => x.includes('measurement error')));
  assert.ok(failures.some((x) => x.includes('invalid lowCount')));
  assert.ok(failures.some((x) => x.includes('screenshot failed')));
  assert.ok(failures.some((x) => x.includes('broken widget')));
});
test('full captures also require screens named only by the previous baseline', () => {
  const baseline = { views: { fhd: { screens: { 'future-screen': screen() } } } };
  assert.ok(reportFailures(report(), { views: ['fhd'], baseline }).includes('fhd/future-screen: missing screen'));
  assert.deepEqual(reportFailures(report(), { ...selected, baseline }), []);
});
test('unknown selection, missing viewport choice, small close buttons and Esc failure are rejected', () => {
  assert.ok(reportFailures(report(), { views: [], only: ['typo'] }).includes('no viewports selected'));
  assert.ok(reportFailures(report(), { ...selected, only: ['typo'] }).includes('unknown screen group: typo'));
  const r = report();
  r.views.fhd.screens.growth.dialog = { close: { w: 32, h: 44 } };
  r.views.fhd.screens.growth.escExits = false;
  assert.equal(reportFailures(r, selected).length, 2);
});

test('game groups require valid join sheets in targeted runs and the first full game baseline', () => {
  for (const game of ['blackjack', 'seotda']) {
    const r = { views: { fhd: { screens: { [`game-${game}`]: screen() } } } };
    const options = { views: ['fhd'], only: [`game-${game}`], withGames: true };
    assert.ok(reportFailures(r, options).includes(`fhd/sheet-${game}: missing screen`));
    // No previous baseline exists yet: expected game sheets still cannot vanish.
    assert.ok(reportFailures(r, { views: ['fhd'], withGames: true }).includes(`fhd/sheet-${game}: missing screen`));
    r.views.fhd.screens[`sheet-${game}`] = { ...screen(), lowCount: NaN };
    assert.ok(reportFailures(r, options).includes(`fhd/sheet-${game}: invalid lowCount`));
    assert.ok(reportFailures(r, { views: ['fhd'], withGames: true }).includes(`fhd/sheet-${game}: invalid lowCount`));
    r.views.fhd.screens[`sheet-${game}`] = screen();
    assert.deepEqual(reportFailures(r, options), []);
  }
});

test('new finance and NPC screens are required before baseline enrollment and work independently with --only', () => {
  const names = ['bank', 'bank-notes', 'bank-casino', 'bank-rob', 'npc'];
  const r = { views: { fhd: { screens: {}, notes: [], errors: [] } } };
  const oldBaseline = { views: { fhd: { screens: { room: screen() } } } };
  const full = reportFailures(r, { views: ['fhd'], baseline: oldBaseline });
  for (const name of names) {
    assert.ok(full.includes(`fhd/${name}: missing screen`), name);
    const options = { views: ['fhd'], only: [name], baseline: oldBaseline };
    assert.deepEqual(reportFailures(r, options), [`fhd/${name}: missing screen`]);
    r.views.fhd.screens[name] = { ...screen(), coveredCount: undefined };
    assert.deepEqual(reportFailures(r, options), [`fhd/${name}: invalid coveredCount`]);
    r.views.fhd.screens[name] = screen();
    assert.deepEqual(reportFailures(r, options), []);
    delete r.views.fhd.screens[name];
  }
});
