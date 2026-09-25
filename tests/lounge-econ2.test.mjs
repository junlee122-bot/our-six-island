// ECON-2 economy pass: 마을 공사 2차, 주간 축제 기금, 집 확장, 이번 주 명품 가구
// and 새로고침, premium dyes, demand-curve helpers, relief by wealth, ledger
// flow totals, high-roller / VIP stakes and old-save migration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LifeError,
  emptyLife,
  ensureLifeMember,
  lifeAction,
  lifeView,
  readLife,
} from '../app/lounge-life.ts';
import {
  PLUS_REJECT,
  festivalSouvenir,
  lifeWealth,
  luxuryStock,
  shopStock,
  weekOfDay,
  weekResetAt,
} from '../app/lounge-life-plus.ts';
import {
  FESTIVAL_GOAL,
  FESTIVAL_SOUVENIR_MIN,
  FURNITURE,
  HOUSE_TIERS,
  LUXURY_PER_WEEK,
  PROJECTS,
  SHOP_REROLL_MAX,
  VILLAGE_FLAGS,
  shopRerollPrice,
} from '../app/lounge-items.ts';
import {
  DAILY_GRANT,
  DAILY_RELIEF,
  INITIAL_BEOM,
  LEDGER_FLOW_DAYS,
  flowBucket,
  grantBeom,
  kstDay,
  newLoungeLedger,
  registerWallet,
  spendBeom,
  validateLedger,
} from '../app/lounge-economy.ts';
import { economyReport, formatEconomyReport } from '../app/lounge-economy-report.ts';
import { stakeLock, TABLE_STAKES, HIGH_STAKE_BALANCE, VIP_STAKE_BALANCE } from '../app/lounge-games.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { accountSave, lifeUnlocksOf, ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { defaultBedroom, lockedRoomStyle, readBedroomStrict } from '../app/lounge-bedroom-data.ts';
import { catalogEntry } from '../app/lounge-bedroom-catalog.ts';
import { FURNITURE_ART } from '../app/lounge-furniture-art.ts';
import { freshLounge } from '../app/lounge-look.ts';
import { newBlackjack } from '../app/lounge-blackjack.ts';

const uuid = () => crypto.randomUUID();
const DAY = 86_400_000;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
const T0 = kst(2026, 9, 24); // Thursday

function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(
    balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0),
    Object.keys(ledger.accounts).length * INITIAL_BEOM,
  );
}
function world(n = 2) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    invariant(s.ledger);
    return r;
  };
  s.fails = (m, action, now, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  s.fund = (m, amount) => {
    s.ledger = grantBeom(s.ledger, 'wallet-' + m.id, amount, 'test-' + uuid(), T0, 'test');
  };
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  return s;
}

test('마을 공사: shared 범 projects need their bundle flag, fill up, set a flag and give plaques', () => {
  const s = world(2),
    [a, b] = s.members,
    lights = PROJECTS.find((p) => p.id === 'bridge-lights');
  // Every project flag is a known village flag.
  for (const p of PROJECTS) assert.ok(VILLAGE_FLAGS[p.flag], p.flag);
  s.fund(a, 1_000_000);
  s.fund(b, 1_000_000);
  assert.equal(s.view(a, T0).projects.find((p) => p.id === 'bridge-lights').open, false);
  s.fails(a, { kind: 'project', project: 'bridge-lights', n: 10_000 }, T0, PLUS_REJECT.projectLocked);
  s.fails(a, { kind: 'project', project: 'nope', n: 10_000 }, T0, PLUS_REJECT.project);
  s.life.flags = ['bridge'];
  s.fails(a, { kind: 'project', project: 'bridge-lights', n: 999 }, T0, PLUS_REJECT.give);
  const given = () => s.ledger.entries.filter((e) => e.reason === 'project').map((e) => e.amount);
  s.act(a, { kind: 'project', project: 'bridge-lights', n: 400_000 }, T0);
  assert.deepEqual(given(), [400_000]);
  // B gives more than is left: only the rest is taken.
  s.act(b, { kind: 'project', project: 'bridge-lights', n: 900_000 }, T0 + 1);
  assert.deepEqual(given(), [400_000, lights.cost - 400_000]);
  const v = s.view(a, T0 + 2);
  const p = v.projects.find((x) => x.id === 'bridge-lights');
  assert.equal(p.done, true);
  assert.deepEqual(p.by, { 0: 400_000, 1: lights.cost - 400_000 });
  assert.ok(v.flags.includes('lights'));
  assert.equal(v.me.furniture['furn-project-plaque'], 1);
  assert.equal(s.view(b, T0 + 2).me.furniture['furn-project-plaque'], 1);
  s.fails(a, { kind: 'project', project: 'bridge-lights', n: 10_000 }, T0 + 3, PLUS_REJECT.projectDone);
  // No 범 comes back from a project (a pure sink; only the one-time 'bundle-1' achievement).
  assert.deepEqual(
    s.ledger.entries.filter((e) => e.type === 'grant' && e.reason !== 'test').map((e) => e.reason),
    ['ach', 'ach'],
  );
  // VIP needs no bundle; greenhouse wing speeds up new crops.
  assert.equal(s.view(a, T0).projects.find((x) => x.id === 'casino-vip').open, true);
  s.life.flags.push('greenhouse', 'greenhouse2');
  s.act(a, { kind: 'plant', plot: 0, crop: 'carrot' }, T0 + 4);
  assert.equal(s.life.farms[a.id][0].speed, 10);
});

test('주간 마을 축제 기금: resets every Monday; helpers above the minimum get the souvenir', () => {
  const s = world(3),
    [a, b, c] = s.members;
  for (const m of s.members) s.fund(m, 500_000);
  const week = weekOfDay(kstDay(T0));
  assert.equal(weekResetAt(week), kst(2026, 9, 28, 0));
  assert.equal(s.view(a, T0).festival.goal, FESTIVAL_GOAL);
  s.act(a, { kind: 'festival', n: FESTIVAL_SOUVENIR_MIN - 1_000 }, T0);
  s.act(b, { kind: 'festival', n: FESTIVAL_SOUVENIR_MIN }, T0 + 1);
  s.act(c, { kind: 'festival', n: FESTIVAL_GOAL }, T0 + 2);
  const v = s.view(a, T0 + 3);
  assert.equal(v.festival.done, true);
  assert.equal(v.festival.got, FESTIVAL_GOAL);
  const souvenir = festivalSouvenir(week);
  assert.equal(v.festival.souvenir, souvenir);
  assert.equal(v.me.furniture[souvenir], undefined); // gave less than the minimum
  assert.equal(s.view(b, T0 + 3).me.furniture[souvenir], 1);
  assert.equal(s.view(c, T0 + 3).me.furniture[souvenir], 1);
  s.fails(a, { kind: 'festival', n: 10_000 }, T0 + 4, PLUS_REJECT.festivalDone);
  // Next Monday: a fresh fund and the next souvenir.
  const monday = kst(2026, 9, 28, 9);
  const next = s.view(a, monday).festival;
  assert.equal(next.got, 0);
  assert.equal(next.done, false);
  assert.notEqual(next.souvenir, souvenir);
  s.act(a, { kind: 'festival', n: 10_000 }, monday);
  assert.equal(s.life.festival.week, week + 1);
  assert.deepEqual(s.life.festival.by, { 0: 10_000 });
});

test('집 확장: tiers in order with rising cost; styles unlock for the room save', () => {
  const s = world(1),
    [m] = s.members;
  for (let i = 1; i < HOUSE_TIERS.length; i++) assert.ok(HOUSE_TIERS[i].price > HOUSE_TIERS[i - 1].price);
  s.fails(m, { kind: 'upgradeHouse' }, T0, '잔액이 부족해요.');
  s.fund(m, 4_000_000);
  s.act(m, { kind: 'upgradeHouse' }, T0);
  assert.equal(s.view(m, T0).me.house, 1);
  assert.equal(s.ledger.entries.at(-1).reason, 'house-1');
  assert.deepEqual(s.view(m, T0).houses, { 0: 1 });
  assert.ok(lifeUnlocksOf(s.life, m.id).includes('house-1'));
  // Room save: a premium wall needs the tier; the default room stays free.
  const actor = 0,
    room = { ...defaultBedroom(actor), wall: 'gold' },
    save = { ...freshLounge(actor), bedroom: room };
  assert.throws(() => accountSave(save, actor, undefined, { strict: true, unlocks: [] }));
  assert.equal(accountSave(save, actor, undefined, { strict: true, unlocks: lifeUnlocksOf(s.life, m.id) }).bedroom.wall, 'gold');
  assert.deepEqual(lockedRoomStyle({ wall: 'velvet', floor: 'marble' }, ['house-1']), ['velvet', 'marble']);
  // A style the stored room already had stays allowed.
  assert.deepEqual(lockedRoomStyle({ wall: 'gold', floor: 'oak' }, [], { wall: 'gold', floor: 'oak' }), []);
  assert.equal(readBedroomStrict({ ...room, floor: 'ebony' }, actor).floor, 'ebony');
  for (let t = 2; t <= 4; t++) s.act(m, { kind: 'upgradeHouse' }, T0 + t);
  assert.equal(s.view(m, T0).me.house, 4);
  s.fails(m, { kind: 'upgradeHouse' }, T0 + 9, PLUS_REJECT.houseMax);
  assert.equal(ACCOUNT_IDS.length, 7);
});

test('이번 주 명품 가구: weekly rotation, one copy per friend per week; 새로고침 fee doubles', () => {
  const s = world(1),
    [m] = s.members;
  s.fund(m, 3_000_000);
  const luxury = FURNITURE.filter((f) => f.luxury);
  assert.ok(luxury.length >= 8);
  for (const f of FURNITURE) {
    assert.ok(catalogEntry(f.ref), f.ref);
    assert.match(FURNITURE_ART[f.ref] ?? '', /^data:image\/svg\+xml/, f.ref);
  }
  const stock = shopStock(s.life, T0, m.id);
  assert.equal(stock.luxury.length, LUXURY_PER_WEEK);
  // Luxury is never in the daily rotation; the same week keeps the same pieces.
  assert.ok(!stock.items.some((i) => FURNITURE.find((f) => f.ref === i.ref)?.luxury));
  assert.deepEqual(shopStock(s.life, T0 + DAY, m.id).luxury, stock.luxury);
  assert.notDeepEqual(luxuryStock(s.life, T0 + 7 * DAY).map((f) => f.ref), stock.luxury.map((i) => i.ref));
  const pick = stock.luxury[0];
  s.fails(m, { kind: 'buyFurniture', ref: pick.ref, n: 2 }, T0, PLUS_REJECT.luxuryOne);
  const before = s.balance(m);
  s.act(m, { kind: 'buyFurniture', ref: pick.ref, n: 1 }, T0);
  assert.equal(before - s.balance(m), pick.price);
  assert.equal(s.ledger.entries.at(-1).reason, 'furn-premium');
  assert.deepEqual(s.view(m, T0).shop.luxuryBought, [pick.ref]);
  s.fails(m, { kind: 'buyFurniture', ref: pick.ref, n: 1 }, T0 + 1, PLUS_REJECT.luxuryBought);
  // The festival stage project adds one more piece a week.
  assert.equal(luxuryStock({ ...s.life, flags: ['festival'] }, T0).length, LUXURY_PER_WEEK + 1);
  // Reroll: my rotation changes, the price doubles, at most SHOP_REROLL_MAX a day.
  const first = s.view(m, T0).shop;
  assert.equal(first.rerollPrice, shopRerollPrice(0));
  s.act(m, { kind: 'rerollShop' }, T0);
  const second = s.view(m, T0).shop;
  assert.equal(second.rerolls, 1);
  assert.equal(second.rerollPrice, shopRerollPrice(1));
  assert.notDeepEqual(second.items.map((i) => i.ref), first.items.map((i) => i.ref));
  // What I rerolled into is what I can buy (and the old stock is gone for me).
  const fresh = second.items.find((i) => !first.items.some((f) => f.ref === i.ref) && !i.limited);
  if (fresh) s.act(m, { kind: 'buyFurniture', ref: fresh.ref }, T0);
  for (let i = 1; i < SHOP_REROLL_MAX; i++) s.act(m, { kind: 'rerollShop' }, T0 + i);
  s.fails(m, { kind: 'rerollShop' }, T0 + 9, PLUS_REJECT.rerollMax);
  // A new KST day resets the rerolls.
  assert.equal(s.view(m, T0 + DAY).shop.rerolls, 0);
  // Other friends keep the shared rotation.
  assert.deepEqual(shopStock(s.life, T0).items.map((i) => i.ref), first.items.map((i) => i.ref));
});

test('relief counts bag wealth; daily flow totals survive the 200-entry window', () => {
  const s = world(1),
    [m] = s.members;
  s.life.bag[m.id].produce.strawberry = 10;
  assert.equal(lifeWealth(s.life, m.id) >= 45_000, true);
  let l = s.ledger;
  l = spendBeom(l, 'wallet-' + m.id, INITIAL_BEOM - 2_000, 'x-1', T0, 'furn');
  // Many small grants: entries keep 200, flows keep every one.
  for (let i = 0; i < 260; i++) l = grantBeom(l, 'wallet-' + m.id, 10, `g-${i}`, T0 + i, 'sell-fish');
  assert.equal(l.entries.length, 200);
  const g = l.flows.total.g;
  assert.equal(g['sell-fish'], 2_600);
  assert.equal(Object.values(l.flows.total.g).reduce((a, b) => a + b, 0), l.granted - l.flows.base.granted);
  assert.equal(l.flows.total.s.furn, INITIAL_BEOM - 2_000);
  assert.equal(l.flows.days.at(-1).d, kstDay(T0));
  const r = economyReport({ state: { ledger: l, life: s.life }, now: T0 + DAY });
  assert.equal(r.entries.complete, false);
  assert.equal(r.flows.complete, true);
  assert.equal(r.flows.sources[0].amount, 2_600);
  assert.match(formatEconomyReport(r), /일별 집계/);
  // Buckets stay few; days are bounded.
  assert.equal(flowBucket('grant', 'sell-strawberry'), 'sell-strawberry');
  assert.equal(flowBucket('spend', 'buy-seed-carrot'), 'seeds');
  assert.equal(flowBucket('spend', 'house-3'), 'house');
  for (let d = 0; d < LEDGER_FLOW_DAYS + 5; d++) l = grantBeom(l, 'wallet-' + m.id, 1, `d-${d}`, T0 + d * DAY, 'daily');
  assert.equal(l.flows.days.length, LEDGER_FLOW_DAYS);
  // A tampered flows object is rejected like any other corrupt ledger field.
  const bad = structuredClone(l);
  bad.flows.total.g['sell-fish'] = -1;
  assert.throws(() => validateLedger(bad));
  assert.equal(DAILY_RELIEF > DAILY_GRANT, true);
});

test('old saves: a pre-ECON-2 world reads unchanged and the ledger adds flows lazily', () => {
  const s = world(2),
    [a] = s.members;
  s.act(a, { kind: 'pick', tree: 'tree-1' }, T0);
  const old = JSON.parse(JSON.stringify(s.life));
  // No new keys appear just by reading an old world.
  assert.deepEqual(readLife(old), readLife(JSON.parse(JSON.stringify(old))));
  assert.equal(readLife(old).projects, undefined);
  assert.equal(readLife(old).festival, undefined);
  // Bounded readers: unknown projects/flags/refs are dropped, amounts clamped.
  const hostile = readLife({
    ...old,
    projects: { 'bridge-lights': { got: 9e15, by: { 0: 5, 9: 5 } }, fake: { got: 1 } },
    festival: { week: 3, got: -5, by: { 1: 10 } },
    flags: ['vip', 'nope', 'lights'],
    ext: { [a.id]: { house: 7, lux: { w: 1, refs: ['furn-chair', 'furn-aquarium'] }, dem: { strawberry: 3, rocket: 2 }, day: 1 } },
  });
  assert.deepEqual(Object.keys(hostile.projects), ['bridge-lights']);
  assert.equal(hostile.projects['bridge-lights'].got, PROJECTS.find((p) => p.id === 'bridge-lights').cost);
  assert.deepEqual(hostile.projects['bridge-lights'].by, { 0: 5 });
  assert.equal(hostile.festival.got, 0);
  assert.deepEqual(hostile.flags, ['vip', 'lights']);
  assert.equal(hostile.ext[a.id].house, undefined);
  assert.deepEqual(hostile.ext[a.id].lux.refs, ['furn-aquarium']);
  assert.deepEqual(hostile.ext[a.id].dem, { strawberry: 3 });
  // Old ledgers (no flows) validate, and the first grant starts the counters.
  const ledger = structuredClone(s.ledger);
  delete ledger.flows;
  validateLedger(ledger);
  const next = grantBeom(ledger, 'wallet-' + a.id, 500, 'late', T0 + 1, 'daily');
  assert.equal(next.flows.base.granted, ledger.granted ?? 0);
  assert.equal(next.flows.total.g.daily, 500);
  invariant(next);
});

test('stake tiers: 50,000 opens with the wallet, 100,000 also needs the VIP project', () => {
  assert.deepEqual([...TABLE_STAKES], [1000, 5000, 10000, 20000, 50000, 100000]);
  assert.equal(stakeLock(20_000, 0), null);
  assert.match(stakeLock(50_000, HIGH_STAKE_BALANCE - 1), /250,000/);
  assert.equal(stakeLock(50_000, HIGH_STAKE_BALANCE), null);
  assert.match(stakeLock(100_000, 10_000_000), /VIP/);
  assert.match(stakeLock(100_000, VIP_STAKE_BALANCE - 1, ['vip']), /500,000/);
  assert.equal(stakeLock(100_000, VIP_STAKE_BALANCE, ['vip']), null);
  // The blackjack engine accepts the new tiers.
  assert.equal(newBlackjack('bj-vip', 2, 100_000).stake, 100_000);
  assert.throws(() => newBlackjack('bj-x', 2, 200_000));
});

// ---- cloud engine: relief with bag wealth and the VIP gate through a room
const member = (actor) => ({
  id: uuid(),
  actor,
  username: ACCOUNT_IDS[actor],
  connection: uuid(),
  sequence: 0,
  epoch: 0,
  code: '',
});
function harness() {
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = T0;
  return {
    get world() {
      return state;
    },
    set world(v) {
      state = v;
    },
    async run(p, op, extra = {}) {
      const command = {
          op,
          connection: p.connection,
          ...(p.code ? { code: p.code } : {}),
          ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}),
          ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
          ...extra,
        },
        result = cloudTransition(state, p, command, await commandHash(command), now);
      state = result.state;
      p.epoch = result.response.epoch;
      if (result.response.code) p.code = result.response.code;
      invariant(state.ledger);
      return result.response;
    },
    advance(ms) {
      now += ms;
    },
  };
}

test('cloud: VIP stakes need the project; relief sees the bag; old commands still work', async () => {
  const h = harness(),
    a = member(0),
    b = member(1);
  await h.run(a, 'open');
  b.code = a.code;
  await h.run(b, 'join');
  let r = await h.run(a, 'action', { action: { kind: 'invite', game: 'chess', players: [b.id], stake: 50_000 } });
  assert.equal(r.ok, false);
  assert.match(r.error, /250,000/);
  const w = h.world;
  w.ledger = grantBeom(w.ledger, 'wallet-' + a.id, 900_000, 'test-rich', T0, 'test');
  h.world = w;
  r = await h.run(a, 'action', { action: { kind: 'invite', game: 'chess', players: [b.id], stake: 100_000 } });
  assert.equal(r.ok, false);
  assert.match(r.error, /VIP/);
  const w2 = h.world;
  w2.life.flags = ['vip'];
  h.world = w2;
  r = await h.run(a, 'action', { action: { kind: 'invite', game: 'chess', players: [b.id], stake: 100_000 } });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.packet.invites.at(-1).stake, 100_000);
  // An old client's plain sell (no quality) still works and is priced by demand.
  const w3 = h.world;
  w3.life.bag[b.id].produce.pumpkin = 3;
  h.world = w3;
  r = await h.run(b, 'action', { action: { kind: 'sell', crop: 'pumpkin', n: 3 } });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.life.me.demand.pumpkin, 3);
  // Relief: broke in 범 but holding goods → the normal 3,000.
  const w4 = h.world;
  const bw = 'wallet-' + b.id;
  w4.ledger = spendBeom(w4.ledger, bw, w4.ledger.accounts[bw] - 1_000, 'test-burn', T0, 'furn');
  w4.life.bag[b.id].produce.watermelon = 5;
  h.world = w4;
  h.advance(DAY);
  r = await h.run(b, 'wallet');
  assert.equal(r.wallet.daily.amount, DAILY_GRANT);
  r = await h.run(b, 'action', { action: { kind: 'daily' } });
  assert.equal(r.ok, true, r.error);
  assert.equal(h.world.ledger.entries.at(-1).reason, 'daily');
  // Without goods, the next day is a flat relief.
  const w5 = h.world;
  w5.life.bag[b.id].produce.watermelon = 0;
  w5.life.bag[b.id].seeds.carrot = 0;
  w5.life.bag[b.id].seeds.tomato = 0;
  h.world = w5;
  h.advance(DAY);
  r = await h.run(b, 'action', { action: { kind: 'daily' } });
  assert.equal(r.ok, true, r.error);
  assert.equal(h.world.ledger.entries.at(-1).reason, 'daily-relief');
  assert.equal(h.world.ledger.entries.at(-1).amount, DAILY_RELIEF);
});
