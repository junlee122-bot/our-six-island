// 우리 농장 F3 (handover/design/design-our-farm.md §3-5, §10, §11): the generic
// facility sites (data table, building, shared funding, demolishing), the
// shared greenhouse (the bundle 여름 수확 opens it; only its tiles ignore the
// season), the machine yard (4 → 8 → 12 slots), the orchard plot and the
// personal greenhouse (farm levels), the 공동 밭 with its store and the
// 마을 대형 작물 goal, the daily hook, and the bounded read.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CROP_INFO, LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView, packLife, readLife } from '../app/lounge-life.ts';
import { INITIAL_BEOM, grantBeom, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { dayStart, hash32, rainsOn, seasonOfDay } from '../app/lounge-calendar.ts';
import { LEVEL_XP, LEVEL_PERKS } from '../app/lounge-growth-data.ts';
import {
  COMMON_GIANT_CHANCE,
  COMMON_GOAL_GIANTS,
  FACILITIES,
  FACILITY_BY_ID,
  GREENHOUSE_PER_FRIEND,
  ORCHARD_PLOT_DAYS,
  ORCHARD_PLOT_HOLD,
  PERSONAL_SITE_IDS,
  SHARED_SITE_IDS,
  SITE_TILES,
  commonBedTiles,
  facilitiesFor,
  slotsAt,
  unlockBlock,
} from '../app/lounge-farm-sites-data.ts';
import { SITE_REJECT, farmSitesView, readFarmCommons, seasonKey, workSlots } from '../app/lounge-farm-sites.ts';
import { FARM_COMMON, FARM_SITES, FARM_STORE, personalSite } from '../app/lounge-farm-sites-layout.ts';
import { FARM_COLLIDERS, FARM_D, FARM_EXIT, FARM_FIELDS, FARM_PAVING, FARM_W, FARM_YARD } from '../app/lounge-farm-layout.ts';
import { REGIONS, regionWalk } from '../app/lounge-areas.ts';
import { farmReach } from '../app/lounge-farm-view.ts';
import { districtMinimap } from '../app/lounge-district-minimap.ts';
import { SAPLINGS } from '../app/lounge-stage3-data.ts';
import { BUNDLES } from '../app/lounge-items.ts';

const uuid = () => crypto.randomUUID();
const MIN = 60_000,
  HOUR = 3_600_000,
  DAY = 86_400_000;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
// 2026-10-12 (Mon) … 10-18 (Sun) is a summer week; 10-19 starts autumn.
const SUMMER = kst(2026, 10, 13, 10);
const AUTUMN = kst(2026, 10, 20, 10);

function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
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
      message,
    );
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  s.fund = (m, amount) => {
    s.ledger = grantBeom(s.ledger, 'wallet-' + m.id, amount, 'test-' + uuid(), SUMMER, 'test');
  };
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  s.inv = (m, item) => s.life.ext?.[m.id]?.inv?.[item] ?? 0;
  s.seeds = (m, crop, n) => {
    s.life.bag[m.id].seeds[crop] = n;
  };
  s.level = (m, skill, lv) => {
    const u = (((s.life.growth ??= {}).u ??= {})[m.id] ??= {});
    (u.xp ??= {})[skill] = LEVEL_XP[lv - 1];
  };
  s.mats = (m, mats) => {
    for (const [id, n] of Object.entries(mats)) s.give(m, id, n);
  };
  /** Funds a shared build or tier to the end by `m` (범 and every material). */
  s.fundAll = (m, site, now) => {
    const rec = s.life.farm.sites[site],
      def = FACILITY_BY_ID[rec.kind],
      cost = rec.fund.to === 1 ? def.build : def.upgrades.find((u) => u.tier === rec.fund.to);
    s.fund(m, cost.beom);
    s.mats(m, cost.mats);
    for (const id of Object.keys(cost.mats)) s.act(m, { kind: 'siteGive', site, item: id, n: cost.mats[id] }, now);
    s.act(m, { kind: 'siteGive', site, beom: cost.beom - rec.fund.got }, now);
  };
  return s;
}

// ------------------------------------------------------------ the site list and the map
test('sites: two large, four medium and six small shared sites, one small personal site per friend', () => {
  const count = (size) => FARM_SITES.filter((s) => s.actor === undefined && s.size === size).length;
  assert.deepEqual([count('large'), count('medium'), count('small')], [2, 4, 6]);
  assert.deepEqual(FARM_SITES.filter((s) => s.actor === undefined).map((s) => s.id), [...SHARED_SITE_IDS]);
  assert.deepEqual(FARM_SITES.filter((s) => s.actor !== undefined).map((s) => s.id), [...PERSONAL_SITE_IDS]);
  for (const s of FARM_SITES) assert.deepEqual([s.w, s.d], [SITE_TILES[s.size].cols, SITE_TILES[s.size].rows], s.id);
  for (let a = 0; a < 7; a++) {
    const p = personalSite(a),
      f = FARM_FIELDS.find((x) => x.actor === a);
    // Right under the friend's own field, across the lane.
    assert.ok(p.z - p.d / 2 > f.z0 + f.d, `P${a} below the field`);
    assert.ok(Math.abs(p.x - (f.x0 + f.w / 2)) <= 5, `P${a} under its field`);
  }
});

test('sites: inside the farm, apart from each other, the fields, the yard, the road and every wall', () => {
  const rects = [
    ...FARM_SITES.map((s) => ({ id: s.id, ...s })),
    { id: 'common', ...FARM_COMMON },
    { id: 'yard', ...FARM_YARD },
    ...FARM_FIELDS.map((f) => ({ id: 'field-' + f.actor, x: f.x0 + f.w / 2, z: f.z0 + f.d / 2, w: f.w, d: f.d })),
    // The 농장 길 from the lane down to the exit (farmToVillage walks it).
    ...FARM_PAVING.filter((p) => p.tone === 'road').map((p, i) => ({ id: 'road-' + i, ...p })),
  ];
  const overlap = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i],
        b = rects[j];
      // The yard and the road paving meet by design.
      if (a.id === 'yard' && b.id.startsWith('road')) continue;
      if (a.id.startsWith('road') && b.id.startsWith('road')) continue;
      assert.ok(!overlap(a, b), `${a.id} overlaps ${b.id}`);
    }
  for (const s of [...FARM_SITES, FARM_COMMON]) {
    assert.ok(Math.abs(s.x) + s.w / 2 <= FARM_W / 2 - 1 && Math.abs(s.z) + s.d / 2 <= FARM_D / 2 - 1, `${s.id ?? 'common'} inside`);
    for (const c of FARM_COLLIDERS) {
      const r = c.shape === 'circle' ? c.r : 0;
      const w = c.shape === 'box' ? c.w : 0,
        d = c.shape === 'box' ? c.d : 0;
      const hit = Math.abs(c.x - s.x) < (s.w + w) / 2 + r && Math.abs(c.z - s.z) < (s.d + d) / 2 + r;
      assert.ok(!hit, `${s.id ?? 'common'} hits a wall at ${c.x},${c.z}`);
    }
  }
  // Every site's middle and the store's front are walkable and reachable from the road in.
  const w = regionWalk('farm'),
    start = REGIONS.farm.arrive.village;
  for (const p of [...FARM_SITES.map((s) => ({ x: s.x, z: s.z, id: s.id })), { ...FARM_STORE.front, id: 'store' }, { x: FARM_COMMON.x, z: FARM_COMMON.z, id: 'common' }]) {
    assert.ok(w.canWalk(p), `${p.id} walkable`);
    const end = w.path(start, p).at(-1);
    assert.ok(end && Math.hypot(end.x - p.x, end.z - p.z) < 0.05, `${p.id} reachable`);
  }
  // The south road stays clear: (0, 30) walks straight to the exit.
  const route = w.path({ x: 0, z: 30 }, FARM_EXIT.stand);
  assert.ok(route.length && Math.hypot(route.at(-1).x - FARM_EXIT.stand.x, route.at(-1).z - FARM_EXIT.stand.z) < 0.05);
  // The minimap draws the sites and pins the shared field.
  assert.ok(districtMinimap('farm', 1).places.some((p) => p.id === 'common'));
});

test('E on the farm: empty sites build, a friend\'s site is theirs, the shared field and store open', () => {
  const life = { me: { farm: [], plots: 24, waterFriend: [] }, actors: {}, farmsPublic: {}, houses: {} };
  const reach = (p) => farmReach(p, life, 3, 0);
  const L1 = FARM_SITES.find((s) => s.id === 'L1');
  assert.deepEqual(reach(L1)[0].touch, { kind: 'site', id: 'L1' });
  assert.equal(reach(L1)[0].label, '빈 큰 부지 · 시설 짓기');
  assert.equal(reach(personalSite(3))[0].label, '내 부지 · 시설 짓기');
  const friend = reach(personalSite(1))[0];
  assert.equal(friend.label, '강재의 부지 · 비어 있어요');
  assert.equal(friend.disabled, true);
  assert.deepEqual(reach(FARM_COMMON)[0].touch, { kind: 'common' });
  assert.deepEqual(reach(FARM_STORE.front)[0].touch, { kind: 'store' });
  // With a greenhouse standing, its name.
  life.farmSites = { sites: [{ id: 'L1', k: 'greenhouse', t: 1 }], field: { till: [], p: [], giants: [] }, store: [], goal: { n: 0, need: 2, by: [], crop: '' }, slots: 4 };
  assert.equal(reach(L1)[0].label, '공용 온실 돌보기');
});

// ------------------------------------------------------------ the facility table
test('FacilityDef table: the F3 four are live, later ones are data hooks; sizes fit their sites', () => {
  assert.deepEqual(FACILITIES.filter((f) => f.live).map((f) => f.id), ['greenhouse', 'machineYard', 'orchardPlot', 'greenhouseMini']);
  for (const id of ['barn', 'coop', 'fishPond', 'beeYard', 'mushroomCave', 'seedLab']) {
    const f = FACILITY_BY_ID[id];
    assert.ok(f && !f.live && f.daily, id);
    assert.match(unlockBlock(f, { flags: ['ranch'], level: () => 10 }), /준비 중/);
  }
  assert.deepEqual(FACILITY_BY_ID.greenhouse.unlock, { flag: 'greenhouse' });
  assert.deepEqual(FACILITY_BY_ID.machineYard.unlock, {});
  assert.deepEqual(FACILITY_BY_ID.machineYard.slots, [4, 8, 12]);
  assert.deepEqual(FACILITY_BY_ID.orchardPlot.unlock, { skill: 'farm', level: 4 });
  assert.deepEqual(FACILITY_BY_ID.greenhouseMini.unlock, { skill: 'farm', level: 7 });
  assert.equal(slotsAt(FACILITY_BY_ID.greenhouse, 1), 24);
  assert.equal(slotsAt(FACILITY_BY_ID.greenhouseMini, 1), 12);
  assert.equal(FACILITY_BY_ID.fishPond.unlock.skill, 'fish');
  assert.equal(FACILITY_BY_ID.fishPond.unlock.level, 5);
  // Large sites take the greenhouse (and later the barn); personal sites personal facilities.
  assert.ok(facilitiesFor('L1').some((f) => f.id === 'greenhouse'));
  assert.ok(!facilitiesFor('L1').some((f) => f.owner === 'personal'));
  assert.deepEqual(facilitiesFor('P0').map((f) => f.id), ['orchardPlot', 'greenhouseMini', 'fishPond', 'seedLab']);
  // The level perks say what Lv4 and Lv7 open.
  const farm = LEVEL_PERKS.farm;
  assert.match(farm.find((p) => p.level === 4).text, /과일나무 자리/);
  assert.match(farm.find((p) => p.level === 7).text, /개인 온실/);
});

// ------------------------------------------------------------ personal facilities
test('personal sites: only their owner builds; farm Lv4 opens the orchard; paid alone; demolish refunds half the materials', () => {
  const s = world(2),
    [a, b] = s.members;
  const t = SUMMER;
  s.fails(a, { kind: 'siteBuild', site: 'P0', facility: 'orchardPlot' }, t, '농사 Lv4부터 지을 수 있어요.');
  s.level(a, 'farm', 4);
  s.fails(a, { kind: 'siteBuild', site: 'P1', facility: 'orchardPlot' }, t, SITE_REJECT.notMine);
  s.fails(a, { kind: 'siteBuild', site: 'P0', facility: 'greenhouse' }, t, SITE_REJECT.facility);
  s.fails(a, { kind: 'siteBuild', site: 'P0', facility: 'orchardPlot' }, t, '가방에 그만큼 없어요.');
  const cost = FACILITY_BY_ID.orchardPlot.build;
  s.mats(a, cost.mats);
  const before = s.balance(a);
  s.act(a, { kind: 'siteBuild', site: 'P0', facility: 'orchardPlot' }, t);
  assert.equal(s.balance(a), before - cost.beom);
  assert.deepEqual(s.life.farm.sites.P0, { kind: 'orchardPlot', tier: 1, owner: a.id, state: {}, paid: { 0: { ...cost.mats } } });
  for (const id of Object.keys(cost.mats)) assert.equal(s.inv(a, id), 0);
  s.fails(a, { kind: 'siteBuild', site: 'P0', facility: 'orchardPlot' }, t, SITE_REJECT.taken);
  // A friend cannot demolish or use it.
  s.fails(b, { kind: 'siteDemolish', site: 'P0' }, t, SITE_REJECT.notMine);
  s.fails(b, { kind: 'siteTree', site: 'P0', slot: 0, tree: 'peach' }, t, SITE_REJECT.notMine);
  s.act(a, { kind: 'siteDemolish', site: 'P0' }, t + MIN);
  assert.equal(s.life.farm.sites, undefined);
  for (const [id, n] of Object.entries(cost.mats)) assert.equal(s.inv(a, id), Math.floor(n / 2), id);
  // 범 stays spent.
  assert.equal(s.balance(a), before - cost.beom);
  // Lv7: the personal greenhouse, 12 tiles that ignore the season.
  s.level(a, 'farm', 7);
  const mini = FACILITY_BY_ID.greenhouseMini.build;
  s.fund(a, mini.beom);
  s.mats(a, mini.mats);
  s.act(a, { kind: 'siteBuild', site: 'P0', facility: 'greenhouseMini' }, t + 2 * MIN);
  s.seeds(a, 'insam', 20);
  s.act(a, { kind: 'sitePlant', site: 'P0', tile: -1, crop: 'insam' }, t + 3 * MIN);
  assert.equal(Object.keys(s.life.farm.sites.P0.state.plots).length, 12);
  assert.equal(s.life.bag[a.id].seeds.insam, 8);
  s.fails(b, { kind: 'siteWater', site: 'P0', tile: -1 }, t + 4 * MIN, SITE_REJECT.notMine);
  s.act(a, { kind: 'siteWater', site: 'P0', tile: -1 }, t + 4 * MIN);
  s.fails(a, { kind: 'siteDemolish', site: 'P0' }, t + 5 * MIN, SITE_REJECT.growing);
  // Ginseng is an autumn/winter crop: in summer it grows here and never withers.
  const ready = s.view(a, t + 5 * MIN).farmSites.sites.find((x) => x.id === 'P0').p[0].at;
  s.act(a, { kind: 'siteHarvest', site: 'P0', tile: -1 }, ready + MIN);
  assert.equal(s.life.bag[a.id].produce.insam, 12);
  assert.equal(s.life.farm.sites.P0.state.plots, undefined);
});

test('orchard plot: three saplings bear their season\'s fruit daily from 28 days after planting (daily hook)', () => {
  const s = world(1),
    [a] = s.members;
  s.level(a, 'farm', 4);
  s.mats(a, FACILITY_BY_ID.orchardPlot.build.mats);
  s.act(a, { kind: 'siteBuild', site: 'P0', facility: 'orchardPlot' }, SUMMER);
  s.act(a, { kind: 'siteTree', site: 'P0', slot: 0, tree: 'peach' }, SUMMER);
  s.act(a, { kind: 'siteTree', site: 'P0', slot: 1, tree: 'apple' }, SUMMER);
  s.fails(a, { kind: 'siteTree', site: 'P0', slot: 1, tree: 'pear' }, SUMMER, SITE_REJECT.treeBusy);
  s.fails(a, { kind: 'siteTree', site: 'P0', slot: 3, tree: 'pear' }, SUMMER, SITE_REJECT.tile);
  assert.equal(s.balance(a), INITIAL_BEOM - FACILITY_BY_ID.orchardPlot.build.beom - SAPLINGS.peach.price - SAPLINGS.apple.price);
  const d0 = kstDay(SUMMER);
  // Find the first day ≥ 28 days later in summer (peach's season).
  let d = d0 + ORCHARD_PLOT_DAYS;
  while (seasonOfDay(d) !== 'summer') d++;
  // The day before it grew: nothing yet.
  s.act(a, { kind: 'status', text: '' }, dayStart(d0 + ORCHARD_PLOT_DAYS - 1) + HOUR);
  s.fails(a, { kind: 'siteFruit', site: 'P0' }, dayStart(d0 + ORCHARD_PLOT_DAYS - 1) + HOUR, SITE_REJECT.noFruit);
  s.act(a, { kind: 'status', text: '' }, dayStart(d) + HOUR);
  const v = s.view(a, dayStart(d) + HOUR).farmSites.sites.find((x) => x.id === 'P0');
  assert.equal(v.tr.find((t) => t.s === 0).n, 1);
  // Apple is an autumn tree: nothing in summer.
  assert.equal(v.tr.find((t) => t.s === 1).n, 0);
  // A view projects days not yet settled (and never writes).
  const later = dayStart(d + 5) + HOUR;
  const n5 = s.view(a, later).farmSites.sites.find((x) => x.id === 'P0').tr.find((t) => t.s === 0).n;
  assert.equal(n5, seasonOfDay(d + 1) === 'summer' ? ORCHARD_PLOT_HOLD : n5);
  assert.equal(s.life.farm.sites.P0.state.trees[0].n, 1);
  s.act(a, { kind: 'siteFruit', site: 'P0' }, dayStart(d) + 2 * HOUR);
  assert.equal(s.inv(a, 'peach'), 1);
  assert.equal(s.life.farm.sites.P0.state.trees[0].n, undefined);
  s.act(a, { kind: 'siteTree', site: 'P0', slot: 1, clear: true }, dayStart(d) + 3 * HOUR);
  assert.equal(s.life.farm.sites.P0.state.trees[1], undefined);
});

// ------------------------------------------------------------ the shared greenhouse
test('여름 수확 opens the shared greenhouse: funded together; inside only, the season is ignored; 4 tiles each + shared', () => {
  const s = world(3),
    [a, b, c] = s.members;
  // A dry autumn day (rain would water the beds for us).
  let t = AUTUMN;
  while (rainsOn(kstDay(t)) || rainsOn(kstDay(t) + 1)) t += DAY;
  assert.equal(seasonOfDay(kstDay(t)), 'autumn');
  s.fails(a, { kind: 'siteBuild', site: 'L1', facility: 'greenhouse' }, t, '꾸러미 “여름 수확 꾸러미” 완성 뒤에 지을 수 있어요.');
  s.life.flags = ['greenhouse'];
  // My own field keeps the season (the bundle no longer lifts it village-wide).
  s.seeds(a, 'watermelon', 20);
  s.fails(a, { kind: 'plant', plot: 0, crop: 'watermelon' }, t, '지금은 수박 철이 아니라 심을 수 없어요.');
  s.act(a, { kind: 'siteBuild', site: 'L1', facility: 'greenhouse' }, t);
  assert.equal(s.life.farm.sites.L1.tier, 0);
  s.fails(b, { kind: 'siteBuild', site: 'L2', facility: 'greenhouse' }, t, SITE_REJECT.one);
  s.fails(a, { kind: 'sitePlant', site: 'L1', tile: 0, crop: 'watermelon' }, t, SITE_REJECT.building);
  // Two friends give: 범 (≥ 1,000) and materials.
  s.fails(b, { kind: 'siteGive', site: 'L1', beom: 500 }, t, SITE_REJECT.give);
  s.act(b, { kind: 'siteGive', site: 'L1', beom: 50_000 }, t);
  s.give(b, 'wood', 30);
  s.act(b, { kind: 'siteGive', site: 'L1', item: 'wood', n: 30 }, t);
  s.fails(b, { kind: 'siteGive', site: 'L1', item: 'iron', n: 1 }, t, SITE_REJECT.giveItem);
  // Nobody can drop a plan once something was given.
  s.fails(a, { kind: 'siteDemolish', site: 'L1' }, t, SITE_REJECT.funded);
  s.fundAll(a, 'L1', t + MIN);
  const gh = s.life.farm.sites.L1;
  assert.equal(gh.tier, 1);
  assert.equal(gh.fund, undefined);
  assert.deepEqual(gh.paid[1], { wood: 30 });
  assert.ok(s.life.news.at(-1).lines.some((l) => l.text.includes('공용 온실 완공')));
  // Inside: watermelon in autumn. Four tiles of my own, then only shared.
  s.act(a, { kind: 'sitePlant', site: 'L1', tile: -1, crop: 'watermelon' }, t + 2 * MIN);
  const mine = Object.values(s.life.farm.sites.L1.state.plots).filter((p) => p.o === 0);
  assert.equal(mine.length, GREENHOUSE_PER_FRIEND);
  s.fails(a, { kind: 'sitePlant', site: 'L1', tile: 10, crop: 'watermelon' }, t + 2 * MIN, SITE_REJECT.myTiles);
  s.act(a, { kind: 'sitePlant', site: 'L1', tile: 10, crop: 'watermelon', shared: true }, t + 2 * MIN);
  assert.equal(s.life.farm.sites.L1.state.plots[10].o, undefined);
  s.seeds(b, 'carrot', 4);
  s.act(b, { kind: 'sitePlant', site: 'L1', tile: -1, crop: 'carrot' }, t + 3 * MIN);
  s.fails(b, { kind: 'sitePlant', site: 'L1', tile: 0, crop: 'carrot' }, t + 3 * MIN, SITE_REJECT.tileBusy);
  // Anyone waters any tile.
  s.act(c, { kind: 'siteWater', site: 'L1', tile: -1 }, t + 4 * MIN);
  // 우리 농장 F2: wet soil until the next 06:00 KST.
  assert.ok(Object.values(s.life.farm.sites.L1.state.plots).every((p) => p.wetUntil > t + 4 * MIN));
  // Keep them wet until ripe (보습 흙), so the crops' ripe times are known.
  for (const p of Object.values(s.life.farm.sites.L1.state.plots)) p.rs = 1;
  const ready = Math.max(...s.view(a, t + 5 * MIN).farmSites.sites.find((x) => x.id === 'L1').p.map((p) => p.at ?? 0));
  // Friends harvest only their own tiles and the shared ones; mine go to my bag, shared to the store.
  s.fails(b, { kind: 'siteHarvest', site: 'L1', tile: 0 }, ready + MIN, SITE_REJECT.notYours);
  s.act(b, { kind: 'siteHarvest', site: 'L1', tile: -1 }, ready + MIN);
  assert.equal(s.life.bag[b.id].produce.carrot, 4);
  assert.equal(Object.values(s.life.farm.store).reduce((x, y) => x + y, 0), 1);
  s.act(a, { kind: 'siteHarvest', site: 'L1', tile: -1 }, ready + 2 * MIN);
  assert.equal(s.life.bag[a.id].produce.watermelon, 4);
  // Everything came out: nothing in the greenhouse withered in the wrong season.
  assert.equal(s.life.farm.sites.L1.state.plots, undefined);
  // Village requests may ask for off-season crops once it stands (same check as the old flag).
  assert.ok(s.view(a, ready + 3 * MIN).farmSites.sites.some((x) => x.k === 'greenhouse' && x.t === 1));
});

test('crops planted under the old village greenhouse never wither (nobody loses a crop to F3)', () => {
  const s = world(1),
    [a] = s.members;
  s.life.flags = ['greenhouse'];
  // Planted in autumn before this world moved to F3 (a summer crop: the old rule allowed it).
  s.life.farms[a.id][0] = { crop: 'watermelon', plantedAt: AUTUMN - DAY, wateredAt: null };
  s.life.farms[a.id][1] = { crop: 'watermelon', plantedAt: AUTUMN - DAY, wateredAt: null };
  s.act(a, { kind: 'status', text: '' }, AUTUMN);
  assert.equal(s.life.farm.gm, AUTUMN);
  // Days later it is still there (ripe) and harvests.
  assert.equal(s.life.farms[a.id][0].crop, 'watermelon');
  s.act(a, { kind: 'status', text: '' }, AUTUMN + 2 * DAY);
  assert.equal(s.life.farms[a.id][0].crop, 'watermelon');
  s.act(a, { kind: 'harvest', plot: -1 }, AUTUMN + 2 * DAY);
  assert.equal(s.life.bag[a.id].produce.watermelon, 2);
});

// ------------------------------------------------------------ the machine yard
test('machine yard: open from the start; 4 slots, then 8 and 12 by shared upgrades; demolish waits for the extra machines', () => {
  const s = world(2),
    [a, b] = s.members;
  const t = SUMMER;
  assert.equal(workSlots(s.life), 4);
  s.give(a, 'keg', 2);
  s.fails(a, { kind: 'farmPlace', item: 'keg', slot: 4 }, t, '작업 마당 자리를 확인해 주세요.');
  s.act(a, { kind: 'siteBuild', site: 'M1', facility: 'machineYard' }, t);
  s.fundAll(b, 'M1', t);
  assert.equal(workSlots(s.life), 4);
  s.fails(b, { kind: 'siteUpgrade', site: 'M9' }, t, SITE_REJECT.site);
  s.act(b, { kind: 'siteUpgrade', site: 'M1' }, t);
  assert.equal(s.life.farm.sites.M1.fund.to, 2);
  s.fails(a, { kind: 'siteUpgrade', site: 'M1' }, t, SITE_REJECT.upgrading);
  s.fundAll(a, 'M1', t + MIN);
  assert.equal(s.life.farm.sites.M1.tier, 2);
  assert.equal(workSlots(s.life), 8);
  s.act(a, { kind: 'farmPlace', item: 'keg', slot: 7 }, t + 2 * MIN);
  s.fails(a, { kind: 'farmPlace', item: 'keg', slot: 8 }, t + 2 * MIN, '작업 마당 자리를 확인해 주세요.');
  assert.equal(s.view(a, t + 2 * MIN).farmSites.slots, 8);
  s.fails(b, { kind: 'siteDemolish', site: 'M1' }, t + 3 * MIN, SITE_REJECT.machines);
  s.act(a, { kind: 'farmPickup', slot: 7 }, t + 3 * MIN);
  s.act(b, { kind: 'siteUpgrade', site: 'M1' }, t + 3 * MIN);
  s.fundAll(b, 'M1', t + 4 * MIN);
  assert.equal(workSlots(s.life), 12);
  s.fails(b, { kind: 'siteUpgrade', site: 'M1' }, t + 4 * MIN, SITE_REJECT.maxTier);
  // Demolish: each payer gets half of the materials they gave back.
  const wood = { a: s.inv(a, 'wood'), b: s.inv(b, 'wood') };
  s.act(a, { kind: 'siteDemolish', site: 'M1' }, t + 5 * MIN);
  const paidA = FACILITY_BY_ID.machineYard.upgrades[0].mats.wood,
    paidB = FACILITY_BY_ID.machineYard.build.mats.wood + FACILITY_BY_ID.machineYard.upgrades[1].mats.wood;
  assert.equal(s.inv(a, 'wood') - wood.a, Math.floor(paidA / 2));
  assert.equal(s.inv(b, 'wood') - wood.b, Math.floor(paidB / 2));
  assert.equal(workSlots(s.life), 4);
});

// ------------------------------------------------------------ the 공동 밭
test('공동 밭: anyone tills, plants (in season), waters and harvests; the harvest goes to the shared store', () => {
  const s = world(2),
    [a, b] = s.members;
  const t = SUMMER;
  s.seeds(a, 'carrot', 10);
  s.fails(a, { kind: 'commonPlant', tile: 0, crop: 'carrot' }, t, SITE_REJECT.untilled);
  s.act(b, { kind: 'commonTill', tile: 0 }, t);
  s.fails(b, { kind: 'commonTill', tile: 0 }, t, SITE_REJECT.tilled);
  s.act(a, { kind: 'commonTill', tile: -1 }, t);
  assert.equal(s.life.farm.till.length, 36);
  s.seeds(a, 'insam', 1);
  s.fails(a, { kind: 'commonPlant', tile: 1, crop: 'insam' }, t, '지금은 인삼 철이 아니라 심을 수 없어요.');
  s.act(a, { kind: 'commonPlant', tile: -1, crop: 'carrot' }, t);
  assert.equal(Object.keys(s.life.farm.field).length, 10);
  s.act(b, { kind: 'commonWater', tile: -1 }, t + MIN);
  s.fails(b, { kind: 'commonWater', tile: -1 }, t + MIN, '물을 줄 작물이 없어요.');
  const ready = Math.max(...s.view(a, t + MIN).farmSites.field.p.map((p) => p.at ?? 0));
  s.fails(b, { kind: 'commonHarvest', tile: 0 }, t + 2 * MIN, '아직 다 자라지 않았어요.');
  s.act(b, { kind: 'commonHarvest', tile: -1 }, ready + MIN);
  const store = s.view(a, ready + MIN).farmSites.store;
  assert.equal(store.reduce((x, y) => x + y.n, 0), 10);
  assert.ok(store.every((x) => x.id === 'carrot'));
  // Neither harvester's bag got the carrots; the tiles stay tilled.
  assert.equal(s.life.bag[b.id].produce.carrot, 0);
  assert.equal(s.life.farm.till.length, 36);
  assert.deepEqual(s.view(a, ready + MIN).farmSites.goal.by, [0, 1]);
  // The store fills bundle crop slots and the festival fund (no 범 changes hands).
  const bundle = BUNDLES.find((x) => x.id === 'summer-harvest');
  const spent = s.ledger.spent;
  s.life.farm.store = { 'tomato@1': 6, 'tomato@2': 6, tomato: 3 };
  s.act(a, { kind: 'contribute', bundle: bundle.id, slot: 0, n: 10, from: 'store' }, ready + 2 * MIN);
  // The slot asks for 은별 or better: the six 은별 first, then four 금별; the plain ones stay.
  assert.deepEqual(s.life.farm.store, { 'tomato@2': 2, tomato: 3 });
  assert.equal(s.life.bundles[bundle.id].got[0], 10);
  s.fails(a, { kind: 'contribute', bundle: bundle.id, slot: 4, n: 1, from: 'store' }, ready + 2 * MIN);
  s.act(b, { kind: 'festival', n: 3, item: 'tomato' }, ready + 3 * MIN);
  assert.equal(s.life.festival.got, 3 * CROP_INFO.tomato.sell);
  assert.deepEqual(s.life.farm.store, { 'tomato@2': 2 });
  s.fails(b, { kind: 'festival', n: 3, item: 'tomato' }, ready + 3 * MIN, '가방에 그만큼 없어요.');
  // Nothing was spent (an achievement for the first gift may still pay out).
  assert.equal(s.ledger.spent, spent);
});

test('마을 대형 작물: giant beds grow more often in the shared field; two this season reach the goal', () => {
  const s = world(2),
    [a, b] = s.members;
  // Find two plant times in summer whose beds 0 and 1 roll giant.
  const giantAt = (bed, from) => {
    let t = from;
    while (hash32(`cgiant:${bed}:${t}`) % 100 >= COMMON_GIANT_CHANCE) t += 1_000;
    return t;
  };
  const t1 = giantAt(0, SUMMER),
    t2 = giantAt(1, t1 + 1_000);
  assert.ok(seasonKey(kstDay(t2 + DAY)) === seasonKey(kstDay(SUMMER)), 'same season');
  s.act(a, { kind: 'commonTill', tile: -1 }, SUMMER);
  s.seeds(a, 'watermelon', 6);
  s.seeds(b, 'watermelon', 6);
  for (const tile of commonBedTiles(0)) s.act(a, { kind: 'commonPlant', tile, crop: 'watermelon' }, t1);
  for (const tile of commonBedTiles(1)) s.act(b, { kind: 'commonPlant', tile, crop: 'watermelon' }, t2);
  // 우리 농장 F2: crops grow only in wet soil; 보습 흙 keeps the beds wet until ripe.
  for (const p of Object.values(s.life.farm.field)) if (p.crop) p.rs = 1;
  const ready = Math.max(...s.view(a, t2).farmSites.field.p.map((p) => p.at ?? 0)) + MIN;
  const v = s.view(a, ready);
  assert.deepEqual(v.farmSites.field.giants, [0, 1]);
  // One click reaps the whole bed, twice each.
  s.act(a, { kind: 'commonHarvest', tile: 0 }, ready);
  assert.equal(Object.values(s.life.farm.store).reduce((x, y) => x + y, 0), 12);
  assert.equal(s.life.farm.goal.n, 1);
  assert.equal(s.life.farm.goal.done, undefined);
  s.act(b, { kind: 'commonHarvest', tile: -1 }, ready + MIN);
  assert.equal(s.life.farm.goal.n, COMMON_GOAL_GIANTS);
  assert.equal(s.life.farm.goal.done, ready + MIN);
  for (const m of [a, b]) assert.equal(s.life.ext[m.id].furn['furn-project-plaque'], 1);
  assert.ok(s.life.memories.some((x) => x.text.includes('마을 대형 작물')));
  // Next season the goal starts over.
  let next = ready + DAY;
  while (seasonKey(kstDay(next)) === s.life.farm.goal.k) next += DAY;
  assert.equal(s.view(a, next).farmSites.goal.n, 0);
});

// ------------------------------------------------------------ storage
test('farm.sites: bounded read — wrong kinds, owners, sizes, tiers and funds are dropped; round trip is stable', () => {
  const uid = uuid();
  const bad = {
    sites: {
      L1: { kind: 'greenhouse', tier: 9, owner: 'shared', state: { plots: { 0: { crop: 'carrot', plantedAt: 5, wateredAt: null, o: 3 }, 30: { crop: 'carrot', plantedAt: 5, wateredAt: null } } } },
      L2: { kind: 'orchardPlot', tier: 1, owner: 'shared', state: {} },
      M1: { kind: 'machineYard', tier: 0, owner: 'shared', state: {}, fund: { to: 1, got: 9e9, mat: { wood: 999, gold: 3 }, by: { 2: 1, 9: 1 } } },
      M2: { kind: 'machineYard', tier: 0, owner: 'shared', state: {} },
      P0: { kind: 'orchardPlot', tier: 1, owner: uid, state: { trees: { 0: { f: 'peach', at: 9, n: 50 }, 5: { f: 'peach', at: 9 }, 1: { f: 'banana', at: 9 } } }, paid: { 0: { wood: 40, gem: 9 }, 8: { wood: 1 } } },
      P1: { kind: 'orchardPlot', tier: 1, owner: 'shared', state: {} },
      S1: { kind: 'barn', tier: 1, owner: 'shared', state: {} },
      Z9: { kind: 'greenhouse', tier: 1, owner: 'shared', state: {} },
    },
    field: { 0: { crop: 'carrot', plantedAt: 1, wateredAt: null }, 99: { crop: 'carrot', plantedAt: 1, wateredAt: null } },
    till: [0, 0, 1, 40, -1, 'x'],
    store: { carrot: 5, 'carrot@2': 1e9, 'keg-grape': 3, nope: 1 },
    goal: { k: 3, n: 500, by: [1, 1, 9, 0] },
    d: 20_000,
    gm: 7,
    junk: 1,
  };
  const { farm } = readFarmCommons(bad);
  assert.deepEqual(Object.keys(farm.sites), ['L1', 'M1', 'P0']);
  assert.equal(farm.sites.L1.tier, 1);
  assert.deepEqual(Object.keys(farm.sites.L1.state.plots), ['0']);
  assert.equal(farm.sites.L1.state.plots[0].o, 3);
  assert.deepEqual(farm.sites.M1.fund, { to: 1, got: FACILITY_BY_ID.machineYard.build.beom, mat: { wood: 60 }, by: { 2: 1 } });
  assert.deepEqual(farm.sites.P0.state.trees, { 0: { f: 'peach', at: 9, n: ORCHARD_PLOT_HOLD } });
  assert.deepEqual(farm.sites.P0.paid, { 0: { wood: 40 } });
  assert.deepEqual(Object.keys(farm.field), ['0']);
  assert.deepEqual(farm.till, [0, 1]);
  assert.deepEqual(farm.store, { carrot: 5, 'carrot@2': 99_999 });
  assert.deepEqual(farm.goal, { k: 3, n: 99, by: [0, 1] });
  assert.equal(farm.junk, undefined);
  // Reading its own output (and through readLife / packLife) changes nothing.
  assert.deepEqual(readFarmCommons(JSON.parse(JSON.stringify(farm))).farm, farm);
  const life = readLife({ farm: bad });
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(packLife(life)))), life);
  // Older worlds: nothing.
  assert.deepEqual(readFarmCommons(undefined), {});
  assert.equal(readLife({}).farm, undefined);
});

test('views: no farmSites until the farm has something; then one compact copy for everyone', () => {
  const s = world(2),
    [a, b] = s.members;
  s.act(a, { kind: 'status', text: '' }, SUMMER);
  // The first settle only marks the day (and when the world moved to F3).
  assert.deepEqual(Object.keys(s.life.farm).sort(), ['d', 'gm']);
  assert.equal(s.view(a, SUMMER).farmSites, undefined);
  s.act(a, { kind: 'siteBuild', site: 'M1', facility: 'machineYard' }, SUMMER);
  s.act(a, { kind: 'commonTill', tile: -1 }, SUMMER);
  const va = s.view(a, SUMMER).farmSites,
    vb = s.view(b, SUMMER).farmSites;
  assert.deepEqual(va, vb);
  assert.deepEqual(va.sites, [{ id: 'M1', k: 'machineYard', t: 0, fund: { to: 1, got: 0, mat: {}, by: [] } }]);
  assert.ok(JSON.stringify(farmSitesView(s.life, SUMMER)).length < 1_200);
});
