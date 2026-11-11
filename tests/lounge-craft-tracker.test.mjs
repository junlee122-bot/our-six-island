import test from 'node:test';
import assert from 'node:assert/strict';
import { additionalCraftTarget, craftOutputCount, craftTargetKey, craftTargetOptions, craftTracker, outputHave, readCraftTargets } from '../app/lounge-craft-tracker.ts';
import { CROPS, emptyLife, ensureLifeMember, lifeAction, lifeView } from '../app/lounge-life.ts';
import { grantBeom, newLoungeLedger, registerWallet } from '../app/lounge-economy.ts';
import { CRAFTS, CRAFT_BY_ID, DISHES, DISH_BY_ID, ITEM_BY_ID } from '../app/lounge-items.ts';
import { NO_MODS, LEVEL_XP } from '../app/lounge-growth-data.ts';
import { FACILITY_BY_ID } from '../app/lounge-farm-sites-data.ts';

const NOW = Date.UTC(2026, 10, 11, 3);
const goal = (kind, id, quantity = 1) => ({ kind, id, quantity });
function world() {
  const member = { id: crypto.randomUUID(), actor: 0 };
  let life = ensureLifeMember(emptyLife(), member.id, member.actor);
  let ledger = registerWallet(newLoungeLedger(), 'wallet-' + member.id);
  ledger = grantBeom(ledger, 'wallet-' + member.id, 1_000_000, 'tracker-test', NOW, 'test');
  return {
    member,
    get life() { return life; },
    get ledger() { return ledger; },
    get view() { return lifeView(life, member.id, member.actor, NOW); },
    give(id, n) { (((life.ext ??= {})[member.id] ??= {}).inv ??= {})[id] = n; },
    level(skill, n) { const u = (((life.growth ??= {}).u ??= {})[member.id] ??= {}); (u.xp ??= {})[skill] = LEVEL_XP[n - 1]; u.retro = 1; },
    act(action, now = NOW) { const next = lifeAction(life, ledger, member, action, now); life = next.life; ledger = next.ledger; },
    plan(targets, view) { return craftTracker({ life: view ?? this.view, balance: ledger.accounts['wallet-' + member.id], actor: member.actor, targets, now: NOW }); },
  };
}
const material = (plan, id) => plan.targets[0].requirements.find((r) => r.id === id);
const raw = (plan, id) => plan.raw.find((r) => r.id === id);

test('save normalization rejects unknown ids, coercion and invalid quantities; three distinct valid goals survive', () => {
  const first = goal('craft', 'fertilizer', 4), second = goal('cook', 'salad', 2), third = goal('farm', 'jar');
  assert.deepEqual(readCraftTargets([null, {}, goal('craft', '__proto__'), goal('cook', 'salad', '2'),
    goal('cook', 'salad', 1.5), goal('farm', 'jar', 0), goal('farm', 'jar', 1000),
    goal('facility', 'orchardPlot', 2), goal('facility', 'beeYard'), first,
    goal('craft', 'fertilizer', 8), second, third, goal('good', 'dry-strawberry')]), [first, second, third]);
  assert.equal(craftTargetKey(first), craftTargetKey({ kind: first.kind, id: first.id }));
  assert.deepEqual(readCraftTargets(goal('cook', 'salad')), []);
  assert.equal(readCraftTargets([goal('craft', 'bait', 999)])[0].quantity, 999);
});

test('catalog targets are valid, uniquely keyed, and finished stock uses the engine output storage', () => {
  const s = world(), view = s.view;
  const options = craftTargetOptions();
  assert.equal(new Set(options.map(craftTargetKey)).size, options.length);
  for (const option of options) assert.equal(readCraftTargets([goal(option.kind, option.id)]).length, 1, option.id);
  view.me.inv = { salad: 2, jar: 3, 'furn-plant': 99, 'jar-carrot': 99 };
  view.me.furniture = { 'furn-plant': 4 };
  view.farmx.goods = [{ id: 'jar-carrot', q: 2, n: 5 }];
  view.farmSites = { sites: [{ id: 'P0', k: 'orchardPlot', t: 1, o: 0 }, { id: 'P1', k: 'orchardPlot', t: 1, o: 1 },
    { id: 'M1', k: 'machineYard', t: 0, fund: { to: 1, got: 0, mat: {}, by: [] } }], store: [], field: { till: [], p: [], giants: [] }, slots: 4, goal: {} };
  assert.equal(outputHave(view, goal('cook', 'salad')), 2);
  assert.equal(outputHave(view, goal('farm', 'jar')), 3);
  assert.equal(outputHave(view, goal('craft', 'furn-plant')), 4);
  assert.equal(outputHave(view, goal('good', 'jar-carrot')), 5);
  assert.equal(outputHave(view, goal('facility', 'orchardPlot'), 0), 1);
  assert.equal(outputHave(view, goal('facility', 'orchardPlot'), 2), 0);
  assert.equal(outputHave(view, goal('facility', 'orchardPlot')), 0);
  assert.equal(outputHave(view, goal('facility', 'machineYard'), 0), 0);
});

test('quantity means final ownership; already-owned items reduce batches without spending them', () => {
  const s = world(); s.give('fertilizer', 2); s.give('wood', 1); s.give('pinecone', 1);
  const plan = s.plan([goal('craft', 'fertilizer', 3)]), target = plan.targets[0];
  assert.deepEqual([target.owned, target.missing, target.batches, target.complete, target.ready], [2, 1, 1, false, true]);
  s.act({ kind: 'craft', recipe: 'fertilizer' });
  assert.equal(outputHave(s.view, goal('craft', 'fertilizer')), 4);
  assert.equal(s.plan([goal('craft', 'fertilizer', 3)]).targets[0].complete, true);
  assert.deepEqual(s.plan([goal('craft', 'fertilizer', 3)]).raw, []);
});

test('extra-output targets accept 998 plus one but reject 999 plus one without silently completing', () => {
  const s = world(), view = s.view, base = { kind: 'craft', id: 'fertilizer' };
  view.me.inv.fertilizer = 998;
  assert.deepEqual(additionalCraftTarget(view, base, 1), { target: { ...base, quantity: 999 }, problem: null });
  assert.deepEqual(additionalCraftTarget(view, { ...base, name: '비료', count: 2 }, 1), {
    target: { ...base, quantity: 999 }, problem: null,
  }, 'catalog option metadata never leaks into the strict action target');
  view.me.inv.fertilizer = 999;
  const over = additionalCraftTarget(view, base, 1);
  assert.equal(over.target, null);
  assert.ok(over.problem.includes('999'));
  assert.ok(over.problem.includes('현재 999개'));
  for (const invalid of [0, -1, 1.5, 1000, Infinity, NaN]) {
    assert.equal(additionalCraftTarget(view, base, invalid).target, null);
    assert.ok(additionalCraftTarget(view, base, invalid).problem);
  }
  assert.equal(additionalCraftTarget(view, { kind: 'craft', id: 'not-a-recipe' }, 1).target, null);
  assert.equal(additionalCraftTarget(view, { kind: 'facility', id: 'beeYard' }, 1).target, null);
  assert.deepEqual(additionalCraftTarget(view, { kind: 'facility', id: 'orchardPlot' }, 1, 0), {
    target: goal('facility', 'orchardPlot'), problem: null,
  });
});

test('selected batch output includes exact fertilizer/bait bonuses but never random cooking or glow-bait extras', () => {
  const s = world(), view = s.view;
  view.growth.mods = { ...NO_MODS, fertExtra: 1, baitExtra: 2, cookExtra: 1 };
  assert.equal(craftOutputCount(view, 'craft', 'fertilizer', 3), 9);
  assert.equal(craftOutputCount(view, 'craft', 'bait', 2), 10);
  assert.equal(craftOutputCount(view, 'craft', 'bait-glow', 2), 4);
  assert.equal(craftOutputCount(view, 'craft', 'fertilizer-deluxe', 2), 2);
  assert.equal(craftOutputCount(view, 'cook', 'salad', 3), 3);
  for (const invalid of [0, -1, 1.5, Infinity, NaN]) assert.equal(craftOutputCount(view, 'craft', 'fertilizer', invalid), 0);
  assert.equal(craftOutputCount(view, 'cook', 'fertilizer', 1), 0);
  assert.equal(craftOutputCount(view, 'craft', '__proto__', 1), 0);
  assert.deepEqual(additionalCraftTarget(view, { kind: 'craft', id: 'fertilizer' }, craftOutputCount(view, 'craft', 'fertilizer', 3)), {
    target: goal('craft', 'fertilizer', 9), problem: null,
  });
});

test('recursive fertilizer chain uses fixed farm cost and live discounted craft inputs', () => {
  const s = world(); s.level('farm', 8); s.level('craft', 10);
  const plan = s.plan([goal('farm', 'fertilizer-star', 2)]);
  assert.equal(material(plan, 'fertilizer-deluxe').required, 2);
  assert.equal(material(plan, 'beom').required, 3000);
  assert.equal(raw(plan, 'wood').missing, 1);
  assert.equal(raw(plan, 'pinecone').missing, 1);
  assert.equal(raw(plan, 'stone').missing, 4);
  assert.equal(raw(plan, 'gold').missing, 2);
  assert.equal(plan.targets[0].ready, false);
  for (const id of ['wood', 'pinecone', 'stone', 'gold']) s.give(id, raw(plan, id).missing);
  s.act({ kind: 'craft', recipe: 'fertilizer', n: 1 });
  s.act({ kind: 'craft', recipe: 'fertilizer-deluxe', n: 2 });
  s.act({ kind: 'farmBuild', item: 'fertilizer-star' });
  s.act({ kind: 'farmBuild', item: 'fertilizer-star' });
  assert.equal(outputHave(s.view, goal('farm', 'fertilizer-star')), 2);
  assert.equal(s.view.me.inv.fertilizer, 1, 'farm perk made three; deluxe perk used only two');
  for (const id of ['wood', 'pinecone', 'stone', 'gold']) assert.equal(s.view.me.inv[id] ?? 0, 0, id);
});

test('current engine craft discounts and furniture quality-free category order agree with the plan', () => {
  const s = world(); s.level('craft', 10);
  s.give('wood', 100); s.give('wildflower', 1); s.give('azalea', 1);
  const before = s.view, plan = s.plan([goal('craft', 'furn-plant')], before);
  assert.equal(material(plan, 'cat:flower').allocations[0].id, 'wildflower');
  s.act({ kind: 'craft', recipe: 'furn-plant' });
  assert.equal(before.me.inv.wood - s.view.me.inv.wood, material(plan, 'wood').required);
  assert.equal(s.view.me.inv.wildflower, undefined);
  assert.equal(s.view.me.inv.azalea, 1);
});

test('guaranteed fertilizer and bait bonuses apply only to their exact outputs, as in the engine', () => {
  const s = world(), view = s.view;
  view.growth.mods = { ...NO_MODS, fertExtra: 1, baitExtra: 2, baitCheap: 1, deluxeCheap: true };
  const fert = s.plan([goal('craft', 'fertilizer', 3)], view);
  const deluxe = s.plan([goal('craft', 'fertilizer-deluxe', 2)], view);
  const bait = s.plan([goal('craft', 'bait', 5)], view);
  const glow = s.plan([goal('craft', 'bait-glow', 3)], view);
  assert.equal(fert.targets[0].batches, 1);
  assert.equal(deluxe.targets[0].batches, 2);
  assert.equal(material(deluxe, 'fertilizer').required, 2);
  assert.equal(bait.targets[0].batches, 1);
  assert.equal(glow.targets[0].batches, 2);
  assert.equal(material(glow, 'cat:bug').required, 2);
});

test('multiple targets share one allocation pool, preserve existing goal stock and reuse planned batch surplus', () => {
  const s = world(); s.give('wood', 5); s.give('pinecone', 5); s.give('fertilizer', 2);
  const plan = s.plan([goal('craft', 'fertilizer-deluxe'), goal('craft', 'fertilizer', 3), goal('farm', 'scarecrow')]);
  assert.equal(plan.targets[1].owned, 2);
  assert.equal(plan.targets[0].requirements[0].allocated, 0, 'owned fertilizer reserved for its own target');
  assert.equal(plan.totals.find((r) => r.id === 'wood').allocated, 5);
  assert.equal(raw(plan, 'wood').missing, 7);
  const empty = world().plan([goal('facility', 'orchardPlot'), goal('craft', 'fertilizer-deluxe')]);
  // Orchard needs five fertilizer: three batches leave one for the deluxe recipe.
  assert.equal(empty.targets[1].requirements[0].planned, 1);
  assert.equal(raw(empty, 'pinecone').missing, 4, 'shared batch surplus is not produced twice');
});

test('private bag and communal store remain separate; shared crops never make personal cooking ready', () => {
  const s = world(), view = s.view;
  view.me.bag.produce.carrot = 1; view.me.bag.produce.tomato = 0;
  view.farmSites = { sites: [], store: [{ id: 'carrot', q: 2, n: 20 }, { id: 'tomato', q: 0, n: 20 }], field: { till: [], p: [], giants: [] }, slots: 4, goal: {} };
  const snapshot = structuredClone(view), plan = s.plan([goal('cook', 'salad', 2)], view);
  assert.deepEqual([material(plan, 'carrot').bag, material(plan, 'carrot').shared, material(plan, 'carrot').missing], [1, 20, 1]);
  assert.equal(material(plan, 'tomato').allocated, 0);
  assert.equal(plan.targets[0].ready, false);
  assert.deepEqual(view, snapshot, 'all calculations leave source data untouched');
});

test('crop quality allocation consumes the lowest eligible tier first, matching actual cooking', () => {
  const s = world(), id = s.member.id;
  s.life.bag[id].produce.carrot = 3; s.life.bag[id].produce.tomato = 2;
  const ext = ((s.life.ext ??= {})[id] ??= {});
  (ext.q1 ??= {}).carrot = 1; (ext.q2 ??= {}).carrot = 1;
  const plan = s.plan([goal('cook', 'salad', 2)]);
  assert.deepEqual(material(plan, 'carrot').allocations.map((a) => [a.quality, a.quantity]), [[0, 1], [1, 1]]);
  s.act({ kind: 'cook', recipe: 'salad', n: 2 });
  assert.equal(s.view.me.bag.produce.carrot, 1);
  assert.equal(s.view.me.quality.gold.carrot, 1);
  assert.equal(s.view.me.quality.silver.carrot ?? 0, 0);
});

test('minimum-quality ingredients exclude lower tiers and accept higher tiers exactly like takeCrop', () => {
  const recipe = DISH_BY_ID.salad, saved = recipe.needs;
  try {
    recipe.needs = [{ item: 'carrot', q: 2, n: 2 }];
    const s = world(), id = s.member.id;
    s.life.bag[id].produce.carrot = 8;
    const ext = ((s.life.ext ??= {})[id] ??= {});
    ext.q1 = { carrot: 3 }; ext.q2 = { carrot: 1 }; ext.q3 = { carrot: 1 };
    const plan = s.plan([goal('cook', 'salad')]);
    assert.deepEqual(material(plan, 'carrot').allocations.map((a) => [a.quality, a.quantity]), [[2, 1], [3, 1]]);
    assert.equal(material(plan, 'carrot').owned, 2);
    s.act({ kind: 'cook', recipe: 'salad' });
    assert.equal(s.view.me.quality.gold.carrot ?? 0, 0);
    assert.equal(s.view.me.quality.star?.carrot ?? 0, 0);
    assert.equal(s.view.me.quality.silver.carrot, 3);
    assert.equal(s.view.me.bag.produce.carrot, 6);
  } finally { recipe.needs = saved; }
});

test('every current cooking and craft recipe agrees with actual engine material consumption for two batches', () => {
  const quantity = (view, id) => CROPS.includes(id) ? view.me.bag.produce[id] : id === 'fruit' ? view.me.bag.fruit : view.me.inv[id] ?? 0;
  for (const [kind, recipes] of [['cook', DISHES], ['craft', CRAFTS]]) for (const recipe of recipes) {
    const s = world(); s.level('craft', 10); s.level('farm', 10);
    if (recipe.flag) (s.life.flags ??= []).push(recipe.flag);
    for (const need of recipe.needs) {
      if ('cat' in need) for (const item of Object.values(ITEM_BY_ID).filter((i) => i.cat === need.cat)) s.give(item.id, 1000);
      if ('item' in need) {
        if (CROPS.includes(need.item)) {
          s.life.bag[s.member.id].produce[need.item] = 1000;
          if (need.q) { const ext = ((s.life.ext ??= {})[s.member.id] ??= {}); (ext.q2 ??= {})[need.item] = 500; }
        } else if (need.item === 'fruit') s.life.bag[s.member.id].fruit = 1000;
        else s.give(need.item, 1000);
      }
    }
    const before = s.view, target = goal(kind, recipe.id, outputHave(before, goal(kind, recipe.id)) + recipe.count * 2);
    const plan = s.plan([target], before);
    assert.equal(plan.targets[0].batches, 2, recipe.id);
    assert.equal(plan.targets[0].ready, true, recipe.id);
    const consumed = new Map();
    for (const row of plan.targets[0].requirements) for (const a of row.allocations) consumed.set(a.id, (consumed.get(a.id) ?? 0) + a.quantity);
    s.act({ kind, recipe: recipe.id, n: 2 });
    const after = s.view;
    for (const [id, n] of consumed) assert.equal(quantity(before, id) - quantity(after, id), n, `${recipe.id}: ${id}`);
    assert.ok(outputHave(after, target) >= target.quantity, recipe.id);
  }
});

test('named fish and any-fish inputs follow per-batch engine order instead of falsely reserving named fish', () => {
  const s = world(); s.give('crab', 2);
  const expensive = Object.values(ITEM_BY_ID).filter((i) => i.cat === 'fish').sort((a, b) => b.sell - a.sell)[0];
  assert.ok(expensive.sell > ITEM_BY_ID.crab.sell);
  s.give(expensive.id, 2); s.life.bag[s.member.id].produce.potato = 2;
  const plan = s.plan([goal('cook', 'kkotgetang', 2)]);
  assert.equal(material(plan, 'crab').missing, 1);
  assert.equal(plan.targets[0].ready, false);
  assert.throws(() => s.act({ kind: 'cook', recipe: 'kkotgetang', n: 2 }));
});

test('known machine output is counted once, keeps its actual rolled count and exposes ETA without re-counting loaded crops', () => {
  const s = world(), id = s.member.id;
  (s.life.farmx ??= {})[id] = { mach: { 0: { k: 'dehydrator' } } };
  s.life.bag[id].produce.strawberry = 5;
  s.act({ kind: 'farmLoad', slot: 0, item: 'strawberry' });
  const view = s.view, machine = view.farmx.machines[0];
  assert.equal(view.me.bag.produce.strawberry, 0);
  const before = s.plan([goal('good', 'dry-strawberry', machine.n)], view);
  assert.equal(before.targets[0].complete, false);
  assert.equal(before.targets[0].queued, machine.n);
  assert.equal(before.targets[0].toProduce, 0);
  assert.deepEqual(before.raw, []);
  assert.equal(before.production[0].allocated, machine.n);
  assert.equal(before.production[0].remainingMs, machine.doneAt - NOW);
  const more = s.plan([goal('good', 'dry-strawberry', machine.n + 1)], view);
  assert.equal(material(more, 'strawberry').required, 5, 'only the additional batch needs fruit');
  s.act({ kind: 'farmCollect', slot: 0 }, machine.doneAt);
  const after = s.plan([goal('good', 'dry-strawberry', machine.n)]);
  assert.equal(after.targets[0].complete, true);
  assert.equal(after.targets[0].queued, 0);
});

test('large dairy is a valid alternate machine input and honey never invents a consumed flower recipe', () => {
  const s = world(), view = s.view;
  view.me.inv = { 'egg-big': 2 };
  view.farmx.machines = [{ slot: 0, kind: 'jar' }];
  const dairy = s.plan([goal('good', 'jar-egg', 2)], view);
  assert.equal(material(dairy, 'egg').allocated, 2);
  assert.equal(material(dairy, 'egg').allocations[0].id, 'egg-big');
  const honey = s.plan([goal('good', 'honey-rapeseed')], view);
  assert.deepEqual(honey.targets[0].requirements, []);
  assert.ok(honey.targets[0].warnings.some((s) => s.includes('꽃을 소모')));
  assert.equal(honey.targets[0].ready, false);
});

test('facility planning uses full actual build cost, separates an existing personal site, and respects locks', () => {
  const s = world(), view = s.view, def = FACILITY_BY_ID.machineYard;
  const plan = s.plan([goal('facility', 'machineYard')], view);
  for (const [id, n] of Object.entries(def.build.mats)) assert.equal(material(plan, id).required, n);
  assert.equal(material(plan, 'beom').required, def.build.beom);
  assert.ok(plan.targets[0].warnings.some((s) => s.includes('전체 건설 예산')));
  assert.equal(s.plan([goal('farm', 'jar')], view).targets[0].ready, false);
});

test('a future malformed recipe cycle stops with an actionable missing leaf instead of recursing forever', () => {
  // Catalog definitions are shared with the engine; restore the temporary future
  // data fault synchronously so other tests never observe the injected cycle.
  const recipe = CRAFT_BY_ID.fertilizer, saved = recipe.needs;
  try {
    recipe.needs = [{ item: 'fertilizer', n: 1 }];
    const plan = world().plan([goal('craft', 'fertilizer', 2)]);
    assert.equal(plan.raw.length, 1);
    assert.equal(plan.raw[0].id, 'fertilizer');
    assert.equal(plan.raw[0].missing, 1);
    assert.ok(plan.raw[0].warnings.some((s) => s.includes('순환')));
  } finally { recipe.needs = saved; }
});
