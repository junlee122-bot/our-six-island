// 잠긴 레벨 보상 정리 (design-improvements-2026-10-07 G3): no level perk waits
// on a later region any more (`soon`), each opened perk has a real effect the
// engines read, and the 치즈 장인 갈래 opens with 축산 가공품 (달걀 → 옹기
// 마요네즈, 우유 → 숙성통 치즈).
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_PERKS, LEVEL_XP, NO_MODS, PROFESSIONS, PROF_BY_ID, SKILLS } from '../app/lounge-growth-data.ts';
import { TALENT_BY_ID, talentsOf } from '../app/lounge-growth-talents.ts';
import { growthMods, mineCanGo } from '../app/lounge-growth.ts';
import { LifeError, QUALITY_MULT, emptyLife, ensureLifeMember, lifeAction, readLife } from '../app/lounge-life.ts';
import { INITIAL_BEOM, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { MACHINE_BY_ID, RANCH_ARTISAN_GOODS, isGoodId, isRanchGoodId, productOf } from '../app/lounge-farm-data.ts';
import { FARM_REJECT, goodsById, stockName } from '../app/lounge-farm.ts';
import { demandSoft, sellBonus } from '../app/lounge-life-plus.ts';
import { mineStops } from '../app/lounge-mine.ts';
import { potMax } from '../app/lounge-fish-engine.ts';
import { STAGE3_ITEMS } from '../app/lounge-stage3-data.ts';
import { tillAll } from './farm-test-help.mjs';

const uuid = () => crypto.randomUUID();
const HOUR = 3_600_000,
  DAY = 86_400_000;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
const T = kst(2026, 10, 13, 10);

function world(n = 1) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  tillAll(life);
  life.flags = ['district-ranch', 'ranch'];
  const s = { members, ledger, life };
  s.act = (m, action, now = T) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    validateLedger(s.ledger);
    const total = Object.values(s.ledger.accounts).reduce((a, b) => a + b, 0) + (s.ledger.houseBalance ?? 0) - (s.ledger.granted ?? 0);
    assert.equal(total, Object.keys(s.ledger.accounts).length * INITIAL_BEOM);
    return r;
  };
  s.fails = (m, action, message, now = T) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.give = (m, item, k) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + k;
  };
  s.inv = (m, item) => s.life.ext?.[m.id]?.inv?.[item] ?? 0;
  s.user = (m) => (((s.life.growth ??= {}).u ??= {})[m.id] ??= {});
  s.level = (m, skill, lv) => {
    (s.user(m).xp ??= {})[skill] = LEVEL_XP[lv - 1];
  };
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  return s;
}
/** A jar in slot 0 and a keg in slot 1. */
function machines(s, m) {
  s.give(m, 'stone', 20);
  s.give(m, 'wood', 40);
  s.give(m, 'iron', 2);
  s.level(m, 'farm', 4);
  s.level(m, 'craft', 4);
  s.act(m, { kind: 'farmBuild', item: 'jar' });
  s.act(m, { kind: 'farmBuild', item: 'keg' });
  s.act(m, { kind: 'farmPlace', item: 'jar', slot: 0 });
  s.act(m, { kind: 'farmPlace', item: 'keg', slot: 1 });
}

// ------------------------------------------------------------ level perks
test('level perks: nine per skill, none waits on a later region, every mod is a real GrowthMods field', () => {
  for (const skill of SKILLS) {
    const perks = LEVEL_PERKS[skill];
    assert.deepEqual(perks.map((p) => p.level), [2, 3, 4, 5, 6, 7, 8, 9, 10], skill);
    for (const p of perks) {
      assert.equal(p.soon, undefined, `${skill} Lv${p.level}`);
      for (const k of Object.keys(p.mods ?? {})) assert.ok(Object.hasOwn(NO_MODS, k), `${skill} Lv${p.level}: ${k}`);
    }
  }
  // 낚시 Lv6's 통발 한 개 더 is the engine's own pot limit.
  assert.match(LEVEL_PERKS.fish.find((p) => p.level === 6).text, /통발/);
  assert.equal(potMax(6), potMax(5) + 1);
});

test('opened perks add their mods at their level', () => {
  const s = world(1),
    [m] = s.members;
  const before = growthMods(s.life, m.id);
  for (const skill of SKILLS) s.level(m, skill, 10);
  const after = growthMods(s.life, m.id);
  assert.equal(after.trapExtra - before.trapExtra, 0.1);
  assert.ok(Math.abs(after.legend - 0.1) < 1e-9);
  assert.ok(Math.abs(after.fruitFast - 0.1) < 1e-9);
  assert.ok(Math.abs(after.bugExtra - 0.1) < 1e-9);
  assert.equal(after.yeongjiPts, 10);
  assert.ok(Math.abs(after.fossil - 0.2) < 1e-9);
  assert.ok(Math.abs(after.gemSell - 0.1) < 1e-9);
  assert.equal(after.ladderEarly, 1);
  assert.equal(after.liftDeep, true);
  assert.ok(Math.abs(after.machineFast - 0.05) < 1e-9);
  assert.ok(Math.abs(after.buffLong - 0.1) < 1e-9);
  assert.ok(Math.abs(after.furnCheap - 0.1) < 1e-9);
  assert.ok(Math.abs(after.machineDouble - 0.05) < 1e-9);
  assert.equal(after.ranchStar, 5);
  assert.ok(Math.abs(after.hayKeep - 0.1) < 1e-9);
  // One level short: the Lv9 ones are not there yet.
  for (const skill of SKILLS) s.level(m, skill, 8);
  assert.equal(growthMods(s.life, m.id).liftDeep, false);
  assert.equal(growthMods(s.life, m.id).yeongjiPts, 0);
});

test('광업 Lv9: the lift also stops at my deepest floor', () => {
  assert.deepEqual(mineStops({ deep: 13, pickaxe: 5 }, false, 0, true).map((x) => x.floor), [1, 5, 10, 13]);
  assert.deepEqual(mineStops({ deep: 15, pickaxe: 5 }, false, 0, true).map((x) => x.floor), [1, 5, 10, 15]);
  assert.deepEqual(mineStops({ deep: 13, pickaxe: 5 }, false, 1, true).map((x) => x.floor), [1, 5, 6, 10, 11, 13]);
  assert.deepEqual(mineStops({ deep: 13, pickaxe: 5 }).map((x) => x.floor), [1, 5, 10]);
  const s = world(1),
    [m] = s.members;
  s.life.growth = { r: { trail: { doneAt: T - DAY }, lift: { doneAt: T - DAY } } };
  Object.assign(s.user(m), { tools: { pickaxe: 5 }, mine: { at: 0, deep: 13 } });
  s.level(m, 'mine', 8);
  assert.ok(mineCanGo(s.life, m.id, 13, T));
  assert.equal(mineCanGo(s.life, m.id, 10, T), null);
  s.level(m, 'mine', 9);
  assert.equal(mineCanGo(s.life, m.id, 13, T), null);
  assert.ok(mineCanGo(s.life, m.id, 12, T));
});

// ------------------------------------------------------------ 치즈 장인
test('치즈 장인 갈래 is open: choosable, its talents pickable, its mods real', () => {
  for (const p of PROFESSIONS) assert.equal(p.lock, undefined, p.id);
  for (const t of talentsOf('ranch').filter((t) => t.branch === 'ranch-b')) {
    assert.equal(t.lock, undefined, t.id);
    assert.ok(Object.keys(t.mods ?? {}).length, t.id);
  }
  const s = world(1),
    [m] = s.members;
  s.level(m, 'ranch', 10);
  s.act(m, { kind: 'chooseProf', skill: 'ranch', prof: 'ranch-b' });
  s.act(m, { kind: 'pickTalent', skill: 'ranch', talent: 'ranch-t1' });
  s.act(m, { kind: 'pickTalent', skill: 'ranch', talent: 'ranch-t2' });
  s.act(m, { kind: 'pickTalent', skill: 'ranch', talent: 'ranch-b-t1' });
  s.act(m, { kind: 'pickTalent', skill: 'ranch', talent: 'ranch-b-t2' });
  s.act(m, { kind: 'chooseProf', skill: 'ranch', prof: 'ranch-b2' });
  const mods = growthMods(s.life, m.id);
  assert.ok(Math.abs(mods.ranchArtisan - 0.35) < 1e-9);
  assert.equal(mods.ranchStar, 5 + 10);
  assert.equal(mods.demandRanch, 1);
  // The bonus is for 치즈·마요네즈 only, on top of 포장의 달인's artisan share.
  const sell = { cropSell: 0, starSell: 0, fishSell: 0, dishSell: 0, artisanSell: 0.05, ranchArtisan: mods.ranchArtisan };
  assert.ok(Math.abs(sellBonus(sell, 'jar-egg') - 0.4) < 1e-9);
  assert.ok(Math.abs(sellBonus(sell, 'keg-milk') - 0.4) < 1e-9);
  assert.equal(sellBonus(sell, 'jar-cabbage'), 0.05);
  assert.equal(demandSoft(mods, 'keg-milk'), 1);
  assert.equal(demandSoft(mods, 'egg'), 1);
  assert.equal(demandSoft(mods, 'jar-cabbage'), 0);
  assert.equal(PROF_BY_ID['ranch-b1'].mods.ranchFast, 0.25);
  assert.equal(TALENT_BY_ID['ranch-b-t1'].mods.ranchStar, 10);
});

test('축산 가공품: 달걀 → 옹기 마요네즈, 우유 → 숙성통 치즈, priced like the other jar / keg goods', () => {
  assert.deepEqual([...RANCH_ARTISAN_GOODS], ['jar-egg', 'keg-milk']);
  const g = goodsById();
  assert.equal(g['jar-egg'].name, '마요네즈');
  assert.equal(g['jar-egg'].base, 2 * STAGE3_ITEMS.egg.sell + 50);
  assert.equal(g['keg-milk'].name, '치즈');
  assert.equal(g['keg-milk'].base, Math.round(2.25 * STAGE3_ITEMS.milk.sell));
  assert.equal(stockName('keg-milk'), '치즈');
  assert.equal(stockName('egg-big'), STAGE3_ITEMS['egg-big'].name);
  for (const id of ['jar-egg', 'keg-milk']) assert.ok(isGoodId(id) && isRanchGoodId(id), id);
  assert.equal(isRanchGoodId('jar-cabbage'), false);
  assert.equal(productOf('jar', 'egg-big'), 'jar-egg');
  assert.equal(productOf('keg', 'milk-big'), 'keg-milk');
  for (const [machine, item] of [['keg', 'egg'], ['jar', 'milk'], ['dehydrator', 'egg'], ['dehydrator', 'milk'], ['jar', 'wool'], ['keg', 'constructor']])
    assert.equal(productOf(machine, item), null, `${machine} ${item}`);
  assert.equal(isGoodId('keg-egg'), false);
  assert.equal(isGoodId('jar-milk'), false);
});

test('축산 가공품 in the machines: big products make 은별, 숙성 장인 is faster, 치즈 장인 sells for more', () => {
  const s = world(1),
    [m] = s.members;
  machines(s, m);
  s.give(m, 'egg', 1);
  s.give(m, 'milk-big', 1);
  s.give(m, 'wool', 1);
  s.fails(m, { kind: 'farmLoad', slot: 0, item: 'wool' }, FARM_REJECT.machineInput);
  s.fails(m, { kind: 'farmLoad', slot: 0, item: 'milk-big' }, FARM_REJECT.machineInput);
  s.act(m, { kind: 'farmLoad', slot: 0, item: 'egg' });
  s.act(m, { kind: 'farmLoad', slot: 1, item: 'milk-big' });
  assert.equal(s.inv(m, 'egg'), 0);
  assert.equal(s.inv(m, 'milk-big'), 0);
  s.act(m, { kind: 'farmCollect', slot: -1 }, T + MACHINE_BY_ID.keg.ms);
  assert.deepEqual(s.life.farmx[m.id].goods, { 'jar-egg': 1, 'keg-milk@1': 1 });
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(s.life))).farmx[m.id].goods, { 'jar-egg': 1, 'keg-milk@1': 1 });
  // Without the 갈래, 마요네즈 sells at its plain price.
  let b = s.balance(m);
  s.act(m, { kind: 'sellGoods', item: 'jar-egg', q: 0, n: 1, at: 'coop' }, T + MACHINE_BY_ID.keg.ms);
  const plain = s.balance(m) - b;
  assert.equal(plain, goodsById()['jar-egg'].base);
  // 치즈 장인 + 숙성 장인: +20% and a quarter of the keg time off.
  s.level(m, 'ranch', 10);
  s.act(m, { kind: 'chooseProf', skill: 'ranch', prof: 'ranch-b' }, T + DAY);
  s.act(m, { kind: 'chooseProf', skill: 'ranch', prof: 'ranch-b1' }, T + DAY);
  s.give(m, 'milk', 1);
  s.give(m, 'egg', 1);
  s.act(m, { kind: 'farmLoad', slot: 1, item: 'milk' }, T + DAY);
  s.act(m, { kind: 'farmLoad', slot: 0, item: 'egg' }, T + DAY);
  assert.equal(s.life.farmx[m.id].mach[1].done, T + DAY + Math.round(MACHINE_BY_ID.keg.ms * 0.75));
  assert.equal(s.life.farmx[m.id].mach[0].done, T + DAY + Math.round(MACHINE_BY_ID.jar.ms * 0.75));
  // 목축 Lv4 may lift the 마요네즈 one star (a 5%p roll), so sell the star it came out at.
  const q = s.life.farmx[m.id].mach[0].q ?? 0;
  s.act(m, { kind: 'farmCollect', slot: -1 }, T + 2 * DAY);
  b = s.balance(m);
  s.act(m, { kind: 'sellGoods', item: 'jar-egg', q, n: 1, at: 'coop' }, T + 2 * DAY);
  assert.equal(s.balance(m) - b, Math.round(Math.round(goodsById()['jar-egg'].base * QUALITY_MULT[q]) * 1.2));
});

test('장인 손맛: a ranch good sometimes comes out one star better, never past 금별', () => {
  const s = world(1),
    [m] = s.members;
  machines(s, m);
  s.level(m, 'ranch', 10);
  s.act(m, { kind: 'chooseProf', skill: 'ranch', prof: 'ranch-b' });
  s.act(m, { kind: 'pickTalent', skill: 'ranch', talent: 'ranch-t1' });
  s.act(m, { kind: 'pickTalent', skill: 'ranch', talent: 'ranch-t2' });
  s.act(m, { kind: 'pickTalent', skill: 'ranch', talent: 'ranch-b-t1' });
  const seen = new Set();
  for (let i = 0; i < 80; i++) {
    const at = T + i * DAY;
    s.give(m, i % 2 ? 'egg-big' : 'egg', 1);
    s.act(m, { kind: 'farmLoad', slot: 0, item: i % 2 ? 'egg-big' : 'egg' }, at);
    s.act(m, { kind: 'farmCollect', slot: 0 }, at + 20 * HOUR);
  }
  for (const key of Object.keys(s.life.farmx[m.id].goods)) seen.add(key);
  assert.ok(seen.has('jar-egg'));
  assert.ok(seen.has('jar-egg@1'));
  assert.ok(seen.has('jar-egg@2'));
  assert.ok(![...seen].some((k) => k.endsWith('@3')));
});
