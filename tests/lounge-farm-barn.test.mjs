// 우리 농장 F4 (handover/design/design-our-farm.md §4, §10-3, §11-5): the
// farm barn and coop open with V5 목장 울타리; my animals may move in from
// 닐라's ranch; care works the same there; every day (the site hook, and my
// own share at 하루 마감) the animals make 거름; 퇴비 turns it into 비료; the
// 사일로 cuts my field's grass into 건초. 닭장 증축 needs 목축 Lv3, 축사 2층 Lv7.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { INITIAL_BEOM, grantBeom, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { dayStart, gameTimeOnDay } from '../app/lounge-calendar.ts';
import { LEVEL_XP, RESEARCH } from '../app/lounge-growth-data.ts';
import { FACILITY_BY_ID, slotsAt, unlockBlock } from '../app/lounge-farm-sites-data.ts';
import { SITE_REJECT, siteBuildBlock } from '../app/lounge-farm-sites.ts';
import { BARN_REJECT, MANURE_PER_ANIMAL, MANURE_PER_FERT } from '../app/lounge-farm-barn-data.ts';
import { farmRoom, grassTiles } from '../app/lounge-farm-barn.ts';
import { openTiles } from '../app/lounge-farm-data.ts';
import { COOP_ROOM } from '../app/lounge-stage3-data.ts';
import { STAGE3_REJECT } from '../app/lounge-stage3.ts';

const uuid = () => crypto.randomUUID();
const DAY = 86_400_000;
const D = kstDay(Date.UTC(2026, 9, 14, 3));
const noon = (d) => dayStart(d) + 12 * 3_600_000;
const night = (d, slot = 12) => gameTimeOnDay(d, 22, 0, slot);

function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}
function world(n = 2, flags = ['district-ranch', 'ranch']) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    ledger = grantBeom(ledger, 'wallet-' + m.id, 1_000_000, 'test-' + m.id, noon(D) - DAY, 'test');
    life = ensureLifeMember(life, m.id, m.actor);
  }
  life.flags = [...flags];
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
      message,
    );
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  s.inv = (m, item) => s.life.ext?.[m.id]?.inv?.[item] ?? 0;
  /** A built barn / coop placed directly (the funding flow has its own test). */
  s.build = (site, kind, tier = 1) => {
    ((s.life.farm ??= {}).sites ??= {})[site] = { kind, tier, owner: 'shared', state: {} };
    s.life.farm.d ??= D;
  };
  return s;
}

test('V5 목장 울타리 is live and opens the barn (large) and the coop (medium)', () => {
  assert.ok(RESEARCH.find((r) => r.id === 'ranch').live);
  for (const id of ['barn', 'coop']) {
    const f = FACILITY_BY_ID[id];
    assert.ok(f.live && f.owner === 'shared' && f.daily === id);
    assert.equal(unlockBlock(f, { flags: ['ranch'], level: () => 1 }), null);
    assert.match(unlockBlock(f, { flags: [], level: () => 10 }), /목장 울타리/);
  }
  assert.equal(FACILITY_BY_ID.barn.size, 'large');
  assert.equal(FACILITY_BY_ID.coop.size, 'medium');
  assert.deepEqual([slotsAt(FACILITY_BY_ID.barn, 1), slotsAt(FACILITY_BY_ID.barn, 2)], [4, 8]);
  assert.deepEqual(FACILITY_BY_ID.coop.upgrades[0].need, { skill: 'ranch', level: 3 });
  assert.deepEqual(FACILITY_BY_ID.barn.upgrades[0].need, { skill: 'ranch', level: 7 });
  const s = world(1, []);
  const [m] = s.members;
  assert.match(siteBuildBlock(s.life, m.id, 0, 'L2', 'barn'), /목장 울타리/);
  s.life.flags = ['ranch'];
  assert.equal(siteBuildBlock(s.life, m.id, 0, 'L2', 'barn'), null);
  assert.equal(siteBuildBlock(s.life, m.id, 0, 'M2', 'coop'), null);
});

test('friends fund the coop together; 닭장 증축 waits for 목축 Lv3', () => {
  const s = world(2);
  const [a, b] = s.members;
  const t = noon(D);
  s.act(a, { kind: 'siteBuild', site: 'M2', facility: 'coop' }, t);
  s.give(b, 'wood', 150);
  s.give(b, 'stone', 50);
  s.act(a, { kind: 'siteGive', site: 'M2', beom: 60_000 }, t + 1000);
  s.act(b, { kind: 'siteGive', site: 'M2', beom: 60_000 }, t + 2000);
  s.act(b, { kind: 'siteGive', site: 'M2', item: 'wood', n: 150 }, t + 3000);
  s.act(b, { kind: 'siteGive', site: 'M2', item: 'stone', n: 50 }, t + 4000);
  assert.equal(s.life.farm.sites.M2.tier, 1);
  assert.equal(farmRoom(s.life, 'coop'), COOP_ROOM);
  s.fails(a, { kind: 'siteUpgrade', site: 'M2' }, t + 5000, '목축 Lv3부터 넓힐 수 있어요.');
  ((s.life.growth ??= {}).u ??= {})[a.id] = { xp: { ranch: LEVEL_XP[2] } };
  s.act(a, { kind: 'siteUpgrade', site: 'M2' }, t + 6000);
  assert.equal(s.life.farm.sites.M2.fund.to, 2);
});

test('animals move to the farm and back; care there is the same; the farm has its own room', () => {
  const s = world(1);
  const [m] = s.members;
  const t = noon(D);
  s.act(m, { kind: 'animalBuy', animal: 'chicken' }, t);
  s.act(m, { kind: 'animalBuy', animal: 'cow' }, t + 1000);
  s.fails(m, { kind: 'barnMove', i: 0, to: 'farm' }, t + 2000, BARN_REJECT.noCoop);
  s.build('M1', 'coop');
  s.build('L2', 'barn');
  s.act(m, { kind: 'barnMove', i: 0, to: 'farm' }, t + 3000);
  s.act(m, { kind: 'barnMove', i: 1, to: 'farm' }, t + 4000);
  s.fails(m, { kind: 'barnMove', i: 1, to: 'farm' }, t + 5000, BARN_REJECT.there);
  // The ranch room is free again: four more hens fit there.
  for (let i = 0; i < COOP_ROOM; i++) s.act(m, { kind: 'animalBuy', animal: 'chicken' }, t + 6000 + i);
  s.fails(m, { kind: 'animalCare' }, t + 7000, STAGE3_REJECT.hay);
  s.give(m, 'hay', 10);
  s.act(m, { kind: 'barnCare' }, t + 8000);
  assert.equal(s.inv(m, 'egg'), 1, 'the farm hen laid');
  assert.equal(s.inv(m, 'hay'), 8, 'two farm animals ate');
  s.fails(m, { kind: 'barnCare' }, t + 9000, STAGE3_REJECT.cared);
  s.act(m, { kind: 'animalCare' }, t + 10_000);
  assert.equal(s.inv(m, 'hay'), 8 - COOP_ROOM, 'the ranch hens only at the ranch');
  // Back to the ranch: no room there now.
  s.fails(m, { kind: 'barnMove', i: 0, to: 'ranch' }, t + 11_000, BARN_REJECT.ranchFull);
  const view = lifeView(s.life, m.id, m.actor, t + 12_000);
  assert.deepEqual(view.barn.room.coop, { max: 4, used: 1 });
  assert.equal(view.stage3.animals.filter((a) => a.farm).length, 2);
  // The barn with animals in it cannot come down.
  s.fails(m, { kind: 'siteDemolish', site: 'L2' }, t + 13_000, SITE_REJECT.animals);
  const back = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(back.ext[m.id].s3.a, s.life.ext[m.id].s3.a);
});

test('the loop: 거름 every day (and at 하루 마감), 퇴비 into 비료, the 사일로 cuts grass into 건초', () => {
  const s = world(2);
  const [a, b] = s.members;
  const t = noon(D);
  s.build('L2', 'barn');
  s.build('M1', 'coop');
  s.act(a, { kind: 'animalBuy', animal: 'cow' }, t);
  s.act(a, { kind: 'animalBuy', animal: 'chicken' }, t + 1000);
  s.act(a, { kind: 'barnMove', i: 0, to: 'farm' }, t + 2000);
  s.act(a, { kind: 'barnMove', i: 1, to: 'farm' }, t + 3000);
  s.fails(a, { kind: 'manureTake' }, t + 4000, BARN_REJECT.noManure);
  // Two days later (any friend's action settles the farm): one 거름 an animal a day.
  s.act(b, { kind: 'status', text: '' }, noon(D + 2));
  assert.equal(s.life.farm.sites.L2.state.mn[a.actor], 2 * MANURE_PER_ANIMAL);
  assert.equal(s.life.farm.sites.M1.state.mn[a.actor], 2 * MANURE_PER_ANIMAL);
  // 하루 마감 adds my own share once more.
  s.act(a, { kind: 'endDay' }, night(D + 2));
  assert.equal(s.life.myday[a.id].r.manure, 2);
  assert.equal(s.life.farm.sites.L2.state.mn[a.actor], 3);
  assert.equal(s.life.farm.sites.L2.state.mn[b.actor], undefined, 'b has no animals there');
  s.act(a, { kind: 'manureTake' }, night(D + 2) + 1000);
  assert.equal(s.inv(a, 'manure'), 6);
  assert.equal(lifeView(s.life, a.id, a.actor, night(D + 2) + 1500).barn.manure, 0);
  s.fails(a, { kind: 'compost', n: 4 }, night(D + 2) + 2000, BARN_REJECT.manure);
  s.act(a, { kind: 'compost', n: 3 }, night(D + 2) + 3000);
  assert.equal(s.inv(a, 'manure'), 6 - 3 * MANURE_PER_FERT);
  assert.equal(s.inv(a, 'fertilizer'), 3);
  // The 사일로: every grass tile of my field (untilled) once a 나의 하루.
  const grass = grassTiles(s.life, a.id, night(D + 2) + 4000).length;
  assert.equal(grass, openTiles(24).length, 'a fresh field is all grass');
  s.act(a, { kind: 'till', plot: openTiles(24)[0] }, night(D + 2) + 4500);
  s.act(a, { kind: 'siloCut', tile: -1 }, night(D + 2) + 5000);
  assert.equal(s.inv(a, 'hay'), grass - 1);
  s.fails(a, { kind: 'siloCut', tile: openTiles(24)[1] }, night(D + 2) + 6000, BARN_REJECT.cut);
  s.fails(a, { kind: 'siloCut', tile: openTiles(24)[0] }, night(D + 2) + 6000, BARN_REJECT.noGrass);
  // The grass grows back on my next day (하루 마감 counts).
  s.act(a, { kind: 'endDay' }, night(D + 2) + 7000);
  s.act(a, { kind: 'siloCut', tile: openTiles(24)[1] }, night(D + 2) + 8000);
  assert.equal(s.inv(a, 'hay'), grass);
  // The hay feeds the animals: the loop closes.
  s.act(a, { kind: 'barnCare' }, night(D + 2) + 9000);
  assert.equal(s.inv(a, 'hay'), grass - 2);
  const back = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(back.farm, s.life.farm);
});
