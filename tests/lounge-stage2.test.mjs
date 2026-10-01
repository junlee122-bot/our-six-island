// 마을 확장 2단계: ② 항구 and ③ 언덕 (maps, flag unlocks and their migration),
// the residents' evenings and the hillside commute, the town actions (dawn
// auction, 농협 weekly prices, bakery, stalls, reading club) with the ledger
// invariant, the district counters, and the eight stage-2 residents.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPC_IDS, NPCS, STAGE2_NPCS, WALKING_NPCS, NPC_BONDS } from '../app/lounge-npc-data.ts';
import { NIGHT_NPCS, NPC_PLACES, NPC_WALK_SPEED, npcCanStand, npcSpot, npcTimeline, kstDayStart } from '../app/lounge-npc-schedule.ts';
import { NPC_LINES, allNpcLines, npcBanter } from '../app/lounge-npc-dialog.ts';
import { DISTRICTS, districtOpen, districtGoalText } from '../app/lounge-districts.ts';
import { closeResidents, districtsView, museumFishSpecies, settleDistrictUnlocks } from '../app/lounge-district-unlocks.ts';
import { REGIONS, regionWalk, regionToNetwork, nearestExit } from '../app/lounge-areas.ts';
import { AREAS, AREA_DEFAULTS, chatScope } from '../app/lounge-games.ts';
import { HARBOR_SPOTS, HARBOR_SPOTS_NPC, HARBOR_BUILDINGS, HARBOR_AUCTION, HARBOR_BOARD } from '../app/lounge-harbor-layout.ts';
import { HILL_HOUSES, HILL_YOUTH, HILL_LIBRARY, HILLSIDE_SPOTS, HILL_GARDEN_BEDS } from '../app/lounge-hillside-layout.ts';
import { districtCounters } from '../app/lounge-district-counters.ts';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay } from '../app/lounge-economy.ts';
import { FISH, ITEM_BY_ID, SPOT_INFO } from '../app/lounge-items.ts';
import {
  AUCTION_PREMIUM_CAP,
  AUCTION_UNITS_MAX,
  BAKERY_MENU,
  BAKERY_PER_DAY,
  COOP_BONUS_CAP,
  READING_XP,
  STALL_PER_DAY,
  coopWeekCrops,
  stallGoods,
} from '../app/lounge-town.ts';
import { townActionArea } from '../app/lounge-town-data.ts';
import { weekOfDay } from '../app/lounge-life-plus.ts';
import { NEW_CROP_IDS } from '../app/lounge-farm-data.ts';
const isNewCrop = (c) => NEW_CROP_IDS.includes(c);
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const DAY = 86_400_000,
  HOUR = 3_600_000;
const T0 = Date.UTC(2026, 9, 1, 3); // 12:00 KST, Thursday 2026-10-01
const DAY0 = kstDay(T0);
/** KST day `d` (from DAY0) at hh:mm. */
const at = (d, h, m = 0) => kstDayStart(DAY0 + d) + h * HOUR + m * 60_000;
/** The next KST day at or after DAY0 with this weekday (0 = Sunday). */
const dayWith = (weekday) => {
  for (let d = 0; d < 7; d++) if (new Date(kstDayStart(DAY0 + d) + 9 * HOUR).getUTCDay() === weekday) return d;
};

function world(n = 1, flags = []) {
  const members = Array.from({ length: n }, (_, i) => ({ id: `2222222${i}-1111-4111-8111-111111111111`, actor: i }));
  let life = emptyLife();
  let ledger = newLoungeLedger();
  for (const m of members) {
    life = ensureLifeMember(life, m.id, m.actor);
    ledger = registerWallet(ledger, `wallet-${m.id}`);
  }
  life.flags = [...flags];
  life.ext = Object.fromEntries(members.map((m) => [m.id, { inv: {} }]));
  return {
    members,
    get life() {
      return life;
    },
    get ledger() {
      return ledger;
    },
    act(member, action, now = T0) {
      const r = lifeAction(life, ledger, member, action, now);
      life = r.life;
      ledger = r.ledger;
      validateLedger(ledger);
      const total = Object.values(ledger.accounts).reduce((a, b) => a + b, 0) + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0);
      assert.equal(total, Object.keys(ledger.accounts).length * 100_000, 'ledger invariant');
      return lifeView(life, member.id, member.actor, now);
    },
  };
}
const wallet = (s, m) => s.ledger.accounts[`wallet-${m.id}`];

// ---------------------------------------------------------------- maps
test('harbor and hillside are separate areas with walkable spots, counters and exits back to the hub', () => {
  for (const area of ['harbor', 'hillside']) {
    assert.ok(AREAS.includes(area));
    assert.equal(chatScope(area), 'village');
    const r = REGIONS[area];
    assert.deepEqual([r.bounds.w, r.bounds.d], [DISTRICTS[area].size.w, DISTRICTS[area].size.d]);
    const w = regionWalk(area);
    const arrive = r.arrive.village;
    assert.ok(w.canWalk(arrive), `${area} arrival walkable`);
    const net = regionToNetwork(area, arrive);
    assert.ok(Math.abs(net.x - AREA_DEFAULTS[area].x) < 0.6 && Math.abs(net.y - AREA_DEFAULTS[area].y) < 0.6, `${area} default spawn`);
    assert.equal(nearestExit(area, r.exits[0].stand)?.to, 'village');
    for (const weekday of [0, 3])
      for (const c of districtCounters(area, weekday)) {
        assert.ok(w.canWalk(c), `${area} ${c.a.label} walkable`);
        const end = w.path(arrive, c).at(-1);
        assert.ok(end && Math.hypot(end.x - c.x, end.z - c.z) < 0.8, `${area} ${c.a.label} reachable`);
      }
  }
  // 시장 거리's shop doors, board, Sunday stalls and signpost are walkable and reachable too.
  const mw = regionWalk('market');
  for (const weekday of [0, 1])
    for (const c of districtCounters('market', weekday)) {
      assert.ok(mw.canWalk(c), `market ${c.a.label} walkable`);
      const end = mw.path(REGIONS.market.arrive.village, c).at(-1);
      assert.ok(end && Math.hypot(end.x - c.x, end.z - c.z) < 0.8, `market ${c.a.label} reachable`);
    }
  // Fishing and crab-pot spots are the fishing engine's own, behind the harbor flag.
  for (const s of HARBOR_SPOTS) {
    assert.ok(SPOT_INFO[s.spot], s.spot);
    assert.equal(SPOT_INFO[s.spot].flag, 'district-harbor');
  }
  assert.ok(HARBOR_SPOTS.some((s) => s.pot) && HARBOR_SPOTS.some((s) => !s.pot));
  for (const spot of ['breakwater', 'pier']) assert.ok(FISH.filter((f) => f.spots.includes(spot)).length >= 8, `${spot} has fish`);
  const w = regionWalk('harbor');
  for (const [id, p] of Object.entries(HARBOR_SPOTS_NPC)) assert.ok(w.canWalk(p), `harbor npc spot ${id}`);
  assert.ok(HARBOR_BUILDINGS.length === 2 && HARBOR_AUCTION && HARBOR_BOARD);
  // One labelled house per hillside resident, the library, the youth rooms and 츠나데's garden.
  const hw = regionWalk('hillside');
  const owners = new Set(HILL_HOUSES.map((h) => h.npc));
  for (const id of ['nasera', 'frieren', 'thresh', 'janna', 'sinjjajang', 'volibas', 'lux', 'bocchi', 'tsunade']) assert.ok(owners.has(id), `${id} has a house`);
  assert.deepEqual([...HILL_YOUTH.npcs], ['himmel', 'yanineko']);
  assert.ok(hw.canWalk(HILL_LIBRARY.door));
  for (const [id, p] of Object.entries(HILLSIDE_SPOTS)) assert.ok(hw.canWalk(p), `hill spot ${id}`);
  assert.ok(HILL_GARDEN_BEDS.every((b) => isNewCrop(b.crop)), 'garden crops drawn with the farm 3D stages');
});

// ---------------------------------------------------------------- unlocks
test('harbor opens on the 12th fish species in the museum; the flag stays and old worlds migrate', () => {
  const s = world(1);
  const [a] = s.members;
  const fish = FISH.filter((f) => f.weight > 1).slice(0, 12).map((f) => f.id);
  assert.equal(districtOpen('harbor', { flags: s.life.flags }), false);
  // Eleven species already in an old save (no flag, no district data at all).
  s.life.museum = Object.fromEntries(fish.slice(0, 11).map((id) => [id, { actor: 0, at: T0 - DAY }]));
  const old = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.equal(museumFishSpecies(old), 11);
  let v = lifeView(old, a.id, a.actor, T0);
  assert.deepEqual(v.districts.goals.harbor, { have: 11, need: 12, open: false });
  assert.equal(districtGoalText('harbor', { fishSpecies: 11 }), '박물관 물고기 11/12종');
  // The 12th donation records the district as a village flag with news.
  s.life.ext[a.id].inv[fish[11]] = 1;
  v = s.act(a, { kind: 'donate', item: fish[11] });
  assert.ok(s.life.flags.includes('district-harbor'));
  assert.ok(v.districts.open.includes('harbor'));
  assert.ok(districtOpen('harbor', { flags: s.life.flags }));
  // Once recorded it never closes, whatever the numbers do later.
  s.life.museum = {};
  const reloaded = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.ok(districtsView(reloaded).goals.harbor.open);
  // A world whose numbers already qualify (an old save) opens on its next action.
  const t = world(1);
  t.life.museum = Object.fromEntries(fish.map((id) => [id, { actor: 0, at: T0 - DAY }]));
  assert.equal(districtOpen('harbor', { flags: t.life.flags }), false);
  t.life.bag[t.members[0].id].seeds.carrot = 1;
  t.act(t.members[0], { kind: 'plant', plot: 0, crop: 'carrot' });
  assert.ok(t.life.flags.includes('district-harbor'));
});

test('hillside opens when some friend is 친한 사이 with three 시장 거리 residents (the 이사 event)', () => {
  const s = world(2);
  const [a, b] = s.members;
  const rel = (m, npc, points) => ((s.life.ext[m.id].npcRelations ??= {})[npc] = { points, day: 0 });
  rel(a, 'nasera', 25);
  rel(b, 'frieren', 20);
  rel(a, 'thresh', 19);
  assert.deepEqual(closeResidents(s.life).sort(), ['frieren', 'nasera']);
  assert.equal(settleDistrictUnlocks(s.life, T0).length, 0);
  // Any friend counts: b reaching 20 with 쓰레쉬 makes three.
  rel(b, 'thresh', 20);
  // Stage-2 residents do not count toward the move.
  rel(a, 'lux', 99);
  assert.deepEqual(settleDistrictUnlocks(s.life, T0), ['hillside']);
  assert.ok(s.life.flags.includes('district-hillside'));
  assert.equal(districtsView(s.life).goals.hillside.have, 3);
  assert.ok(s.life.news.some((d) => d.lines.some((l) => l.key === 'district:hillside')));
  assert.deepEqual(settleDistrictUnlocks(s.life, T0 + 1), [], 'the move happens once');
});

test('the server refuses the harbor and the hillside until their flags are set', async () => {
  let w = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const p = { id: crypto.randomUUID(), actor: 0, username: ACCOUNT_IDS[0], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' };
  const run = async (op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}), ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
    const r = cloudTransition(w, p, command, await commandHash(command), T0);
    w = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    return r.response;
  };
  await run('wallet');
  await run('open', { code: 'BEMTADUVLY' });
  for (const area of ['harbor', 'hillside']) {
    const r = await run('action', { action: { kind: 'area', area } });
    assert.ok(r.error, `${area} refused before its flag`);
    assert.match(r.error, /열려요|열리지/);
  }
  w.life.flags = ['district-harbor'];
  const ok = await run('action', { action: { kind: 'area', area: 'harbor', x: 5, y: 25 } });
  assert.ok(!ok.error, ok.error);
  // The first walk in is remembered for the 친구에게 가기 signpost.
  const uid = Object.keys(w.life.actors).find((k) => w.life.actors[k] === 0);
  assert.deepEqual(w.life.ext[uid].town.seen, ['harbor']);
  // Town actions check the real area: the reading club is up the hillside.
  assert.equal(townActionArea({ kind: 'readingClub', skill: 'farm' }), 'hillside');
  assert.equal(townActionArea({ kind: 'stallBuy', stall: 'stall-harbor' }), 'harbor');
  const club = await run('action', { action: { kind: 'readingClub', skill: 'farm' } });
  assert.match(club.error ?? '', /언덕 주택가에 가서/);
});

// ---------------------------------------------------------------- evenings and the commute
// 가게 실내: the shop rooms are walk areas too.
const VISIBLE_AREAS = ['village', 'market', 'tavern', 'harbor', 'hillside', 'bakery', 'coop', 'general', 'fishmarket'];
const POSTS = /^(casino|lounge|bank|salon|tavern)\./;
const seenAt = (id, now, world) => {
  const s = npcSpot(id, now, world);
  if (s.visible) return true;
  // Indoor posts are drawn by their own scenes; counter shops are met at their doors.
  return POSTS.test(s.place ?? '') || s.area === 'realty' || s.area === 'furniture';
};
for (const hill of [false, true])
  test(`every resident is out and visible at 22:00 and 00:30 KST, and asleep at 03:00 (hill ${hill ? 'open' : 'closed'})`, () => {
    const world = { hill };
    for (let d = 0; d < 14; d++)
      for (const id of NPC_IDS) {
        assert.ok(seenAt(id, at(d, 22), world), `${id} day ${d} 22:00 (${npcSpot(id, at(d, 22), world).label})`);
        assert.ok(seenAt(id, at(d, 24, 30), world), `${id} day ${d} 00:30 (${npcSpot(id, at(d, 24, 30), world).label})`);
      }
    for (let d = 0; d < 7; d++)
      for (const id of NIGHT_NPCS) {
        const s = npcSpot(id, at(d, 3), world);
        assert.equal(s.visible, false, `${id} sleeps at 03:00`);
        assert.equal(s.activity, 'sleep');
      }
  });

test('once 언덕 is open residents go home to their own hillside house; paths stay walkable with no teleports', () => {
  const world = { hill: true };
  const homeOf = { nasera: 'hl.in-nasera', frieren: 'hl.in-frieren', thresh: 'hl.in-thresh', janna: 'hl.in-janna', sinjjajang: 'hl.in-sinjjajang', volibas: 'hl.in-volibas', lux: 'hl.in-lux', bocchi: 'hl.in-bocchi', tsunade: 'hl.in-tsunade', himmel: 'hl.in-youth', yanineko: 'hl.in-youth-2' };
  for (const [id, place] of Object.entries(homeOf)) {
    const s = npcSpot(id, at(2, 3), world);
    assert.equal(s.place, place, `${id} sleeps at home`);
    assert.equal(s.area, 'hillside');
    assert.equal(npcSpot(id, at(2, 3), { hill: false }).area, 'home', `${id} before the move`);
  }
  const portalEnds = new Set(['v.market-gate', 'm.gate', 'v.tavern-door', 't.door', 'v.home-gate', 'home', 'library', 'v.harbor-gate', 'hb.gate', 'hl.gate', 'away', 'v.realty-door', 'realty-in', 'v.furniture-door', 'furniture-in',
    'm.bakery', 'bakery.door', 'm.coop', 'coop.door', 'm.general', 'general.door', 'hb.fishmarket', 'fishmarket.door']);
  for (let d = 0; d < 14; d++)
    for (const id of NPC_IDS) {
      const ev = npcTimeline(id, DAY0 + d, world);
      assert.equal(ev[0].place, npcTimeline(id, DAY0 + d - 1, world).at(-1).place, `${id} continuous at midnight`);
      for (let i = 1; i < ev.length; i++) {
        const a = ev[i - 1],
          b = ev[i];
        assert.equal(a.t1, b.t0);
        if (b.k === 'hide') assert.ok(portalEnds.has(b.at) && portalEnds.has(b.to), `${id} hides only at exits (${b.at} → ${b.to})`);
      }
      let prev = null;
      for (let m = 0; m < 1440; m += 2) {
        const s = npcSpot(id, kstDayStart(DAY0 + d) + m * 60_000 + 11_000, world);
        if (s.visible) {
          assert.ok(VISIBLE_AREAS.includes(s.area));
          assert.ok(npcCanStand(s.area, s), `${id} day ${d} ${m} ${s.area} (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`);
          if (prev && prev.visible && prev.area === s.area) assert.ok(Math.hypot(prev.x - s.x, prev.z - s.z) <= NPC_WALK_SPEED * 120 + 0.01, `${id} jumped at ${m}`);
        }
        prev = s;
      }
    }
});

test('evening seats never put two residents on the same spot', () => {
  for (const hill of [false, true])
    for (let d = 0; d < 7; d++)
      for (let m = 20 * 60; m < 25 * 60; m += 10) {
        const now = kstDayStart(DAY0 + d) + m * 60_000;
        const standing = NIGHT_NPCS.map((id) => npcSpot(id, now, { hill })).filter((s) => s.visible && !s.walking);
        for (let i = 0; i < standing.length; i++)
          for (let j = i + 1; j < standing.length; j++)
            if (standing[i].area === standing[j].area)
              assert.ok(Math.hypot(standing[i].x - standing[j].x, standing[i].z - standing[j].z) > 0.8, `${standing[i].id} / ${standing[j].id} day ${d} ${m}`);
      }
});

// ---------------------------------------------------------------- stage-2 residents
test('stage-2 schedules follow their cards', () => {
  const sun = dayWith(0),
    mon = dayWith(1),
    tue = dayWith(2),
    wed = dayWith(3);
  // 마키마: Sunday market stall, Wednesday/Saturday harbor, otherwise away by day.
  assert.equal(npcSpot('makima', at(sun, 12)).place, 'm.stall-sw');
  assert.equal(npcSpot('makima', at(wed, 12)).place, 'hb.quay-2');
  assert.equal(npcSpot('makima', at(mon, 12)).area, 'away');
  // 봇치 plays the tavern stage on show nights (Tue/Fri).
  assert.equal(npcSpot('bocchi', at(tue, 21)).place, 't.stage');
  // 힘멜 opens the bakery in the morning; 럭스 runs the dawn auction; 가붕 keeps the light.
  // 힘멜 helps behind the bakery's counter (가게 실내).
  assert.equal(npcSpot('himmel', at(mon, 8, 30)).place, 'bakery.helper');
  assert.equal(npcSpot('lux', at(mon, 9)).place, 'fishmarket.owner');
  assert.equal(npcSpot('lux', at(mon, 6)).place, 'hb.auction');
  assert.equal(npcSpot('gabung', at(mon, 23)).place, 'hb.lighthouse-door');
  // 베아트리스 hosts the Wednesday reading club with 나세라 once the hillside is open.
  assert.equal(npcSpot('nasera', at(wed, 20), { hill: true }).place, 'hl.library-club');
  assert.equal(npcSpot('beatrice', at(wed, 20), { hill: true }).place, 'hl.library-steps');
  // 츠나데 tends her garden in the morning; 야니네코 is still asleep.
  assert.equal(npcSpot('tsunade', at(mon, 7), { hill: true }).place, 'hl.garden-w');
  assert.equal(npcSpot('yanineko', at(mon, 9)).activity, 'sleep');
});

test('stage-2 residents: sprites, gift tastes, relations, 80+ lines each and banter pairs', () => {
  assert.equal(STAGE2_NPCS.length, 8);
  for (const id of STAGE2_NPCS) {
    const n = NPCS[id];
    assert.equal(n.art.kind, 'image', `${id} has a sprite`);
    assert.ok(n.art.portrait, `${id} has a portrait`);
    assert.notEqual(n.hasSprite, false);
    for (const g of [...n.gifts.loved, ...n.gifts.liked, ...n.gifts.disliked])
      assert.ok(g.startsWith('kind:') || g === 'crop' || g === 'fruit' || ITEM_BY_ID[g], `${id} gift ${g}`);
    const lines = allNpcLines(id);
    assert.ok(lines.length >= 80, `${id} ${lines.length} lines`);
    for (const l of lines) {
      assert.ok(!/\p{Extended_Pictographic}/u.test(l), `${id} emoji: ${l}`);
      assert.ok(!/[A-Za-z]{3,}/.test(l.replace(/\{\w+\}/g, '')), `${id} English: ${l}`);
    }
    assert.ok(NPC_LINES[id]);
  }
  // Their voices.
  const all = (id) => allNpcLines(id).join('\n');
  assert.match(all('beatrice'), /인 거야/);
  assert.match(all('makima'), /계약/);
  assert.match(all('makima'), /예, 아니면 멍/);
  assert.match(all('makima'), /\{me\} (씨|군)/);
  assert.match(all('yanineko'), /담배/);
  // Relationship pairs from the stage-2 design have bonds and banter.
  for (const [a, b] of [['lux', 'janna'], ['gabung', 'janna'], ['beatrice', 'nasera'], ['makima', 'thresh'], ['bocchi', 'himmel'], ['himmel', 'frieren'], ['yanineko', 'janna'], ['tsunade', 'nasera'], ['makima', 'volibas'], ['sinjjajang', 'gabung']]) {
    assert.ok(NPC_BONDS.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)), `${a}-${b} bond`);
    assert.ok(npcBanter(a, b, 'k'), `${a}-${b} banter`);
  }
  assert.equal(WALKING_NPCS.length, 6);
});

// ---------------------------------------------------------------- town actions
test('dawn auction: 06–07 KST only, harbor flag, capped premium through the ledger', () => {
  const s = world(1, ['district-harbor']);
  const [a] = s.members;
  const fish = FISH.find((f) => f.sell >= 1_000 && f.weight > 1);
  s.life.ext[a.id].inv[fish.id] = 30;
  const dawn = at(1, 6, 30);
  assert.throws(() => s.act(a, { kind: 'auctionSell', item: fish.id, n: 1 }, at(1, 8)), /6시부터 7시/);
  const before = wallet(s, a);
  const v = s.act(a, { kind: 'auctionSell', item: fish.id, n: AUCTION_UNITS_MAX }, dawn);
  const gained = wallet(s, a) - before;
  assert.ok(gained > 0);
  assert.ok(v.town.auction.premiumLeft < AUCTION_PREMIUM_CAP);
  assert.ok(s.life.ext[a.id].town.auc <= AUCTION_PREMIUM_CAP);
  assert.throws(() => s.act(a, { kind: 'auctionSell', item: fish.id, n: 1 }, dawn + 60_000), /하루 10마리/);
  // Only fish.
  s.life.ext[a.id].inv.stone = 3;
  assert.throws(() => s.act(a, { kind: 'auctionSell', item: 'stone', n: 1 }, at(2, 6, 10)), /물고기만/);
  // Without the harbor it does not exist.
  const t = world(1);
  t.life.ext[t.members[0].id].inv[fish.id] = 2;
  assert.throws(() => t.act(t.members[0], { kind: 'auctionSell', item: fish.id, n: 1 }, dawn), /항구 구역/);
  // The premium never passes the cap however much is sold.
  const u = world(1, ['district-harbor']);
  const big = FISH.reduce((m, f) => (f.sell > m.sell && f.weight > 1 ? f : m), FISH[0]);
  u.life.ext[u.members[0].id].inv[big.id] = 10;
  u.act(u.members[0], { kind: 'auctionSell', item: big.id, n: 10 }, dawn);
  assert.ok(u.life.ext[u.members[0].id].town.auc <= AUCTION_PREMIUM_CAP);
});

test('농협 weekly prices pay a capped bonus; other crops are refused at the notice', () => {
  const s = world(1);
  const [a] = s.members;
  const week = weekOfDay(DAY0);
  const crops = coopWeekCrops(week);
  assert.equal(crops.length, 3);
  assert.deepEqual(coopWeekCrops(week), crops, 'deterministic');
  s.life.bag[a.id].produce[crops[0]] = 40;
  const before = wallet(s, a);
  const v = s.act(a, { kind: 'coopSell', crop: crops[0], n: 40 });
  assert.ok(wallet(s, a) > before);
  assert.ok((s.life.ext[a.id].town.coop ?? 0) <= COOP_BONUS_CAP);
  assert.ok(v.town.coop.bonusLeft <= COOP_BONUS_CAP);
  const other = ['carrot', 'tomato', 'potato', 'strawberry', 'corn', 'pumpkin'].find((c) => !crops.includes(c));
  s.life.bag[a.id].produce[other] = 1;
  assert.throws(() => s.act(a, { kind: 'coopSell', crop: other, n: 1 }), /시세표/);
});

test('빵집 카페: treats are a spend, fill mood needs and stop after two a day', () => {
  const s = world(1);
  const [a] = s.members;
  const coffee = BAKERY_MENU.find((b) => b.id === 'coffee');
  const before = wallet(s, a);
  s.act(a, { kind: 'bakeryBuy', item: 'coffee' });
  assert.equal(before - wallet(s, a), coffee.price);
  s.act(a, { kind: 'bakeryBuy', item: 'milkbread' });
  assert.equal(BAKERY_PER_DAY, 2);
  assert.throws(() => s.act(a, { kind: 'bakeryBuy', item: 'coffee' }), /2번까지/);
  assert.throws(() => s.act(a, { kind: 'bakeryBuy', item: 'cake' }, T0 + DAY), /메뉴/);
  s.act(a, { kind: 'bakeryBuy', item: 'coffee' }, T0 + DAY);
});

test('장날 좌판 on Sundays (and 마키마 at the harbor on Wed/Sat), three a day, 80% prices', () => {
  const sun = dayWith(0),
    wed = dayWith(3),
    mon = dayWith(1);
  const s = world(1, ['district-harbor']);
  const [a] = s.members;
  const goods = stallGoods(DAY0 + sun);
  assert.throws(() => s.act(a, { kind: 'stallBuy', stall: 'stall-w' }, at(mon, 12)), /장날/);
  for (const st of ['stall-w', 'stall-e', 'stall-sw']) {
    const before = wallet(s, a);
    s.act(a, { kind: 'stallBuy', stall: st }, at(sun, 12));
    assert.equal(before - wallet(s, a), goods[st].price);
  }
  assert.equal(STALL_PER_DAY, 3);
  assert.throws(() => s.act(a, { kind: 'stallBuy', stall: 'stall-se' }, at(sun, 13)), /3번까지/);
  assert.throws(() => s.act(a, { kind: 'stallBuy', stall: 'stall-harbor' }, at(mon, 12)), /수요일과 토요일/);
  s.act(a, { kind: 'stallBuy', stall: 'stall-harbor' }, at(wed, 12));
  const t = world(1);
  assert.throws(() => t.act(t.members[0], { kind: 'stallBuy', stall: 'stall-harbor' }, at(wed, 12)), /항구 구역/);
});

test('독서 모임: Wednesday 19–21 at the library, once a week, skill XP only (no 범)', () => {
  const wed = dayWith(3);
  const s = world(1, ['district-hillside']);
  const [a] = s.members;
  assert.throws(() => s.act(a, { kind: 'readingClub', skill: 'farm' }, at(wed, 18)), /수요일 저녁/);
  const before = wallet(s, a);
  const xp0 = s.life.growth?.u?.[a.id]?.xp?.farm ?? 0;
  s.act(a, { kind: 'readingClub', skill: 'farm' }, at(wed, 19, 30));
  assert.equal(wallet(s, a), before);
  assert.ok((s.life.growth.u[a.id].xp.farm ?? 0) - xp0 >= Math.min(READING_XP, 1));
  assert.throws(() => s.act(a, { kind: 'readingClub', skill: 'fish' }, at(wed, 20)), /이미 참석/);
  const t = world(1);
  assert.throws(() => t.act(t.members[0], { kind: 'readingClub', skill: 'farm' }, at(wed, 19, 30)), /언덕 주택가/);
});

test('town state round-trips through a save and ignores junk', () => {
  const s = world(1, ['district-harbor']);
  const [a] = s.members;
  s.act(a, { kind: 'bakeryBuy', item: 'coffee' });
  s.life.ext[a.id].town.seen = ['harbor', 'nowhere', 'harbor'];
  s.life.ext[a.id].town.junk = 5;
  const loaded = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(loaded.ext[a.id].town.seen, ['harbor']);
  assert.equal(loaded.ext[a.id].town.junk, undefined);
  assert.equal(loaded.ext[a.id].town.bake, 1);
});

test('in the world every resident but the pose-sheet four is a chibi at a friend size; dialogue keeps the tall art', async () => {
  const fs = await import('node:fs');
  const { NPC_CHIBI } = await import('../app/lounge-npc-chibi.ts');
  const record = JSON.parse(fs.readFileSync(new URL('../public/assets/lounge/npc-chibi-generation.json', import.meta.url), 'utf8'));
  const chibi = ['frieren', 'nasera', 'rose', 'gwen', 'nyamo', 'thresh', 'sinjjajang', 'volibas', 'janna', 'gabung', 'lux', 'himmel', 'beatrice', 'bocchi', 'tsunade', 'makima', 'yanineko', 'realtor', 'misun'];
  assert.deepEqual(Object.keys(NPC_CHIBI).sort(), [...chibi].sort());
  for (const id of NPC_IDS) {
    const c = NPC_CHIBI[id];
    if (NPCS[id].art.kind === 'sheet') {
      assert.equal(c, undefined, `${id} keeps its chibi pose sheet`);
      continue;
    }
    assert.ok(c, `${id} has a chibi`);
    const file = new URL(`../public${c.asset}`, import.meta.url);
    assert.ok(fs.existsSync(file), `${id} chibi file`);
    // Sizes match what the keying script wrote (the plane's aspect comes from them).
    assert.deepEqual([record.web[id].w, record.web[id].h], [c.w, c.h], `${id} size`);
    assert.equal(c.h, 640);
    assert.ok(c.w >= 512 && c.w <= 640);
    // The tall art still serves the dialogue portrait.
    assert.equal(NPCS[id].art.kind, 'image');
    assert.ok(NPCS[id].art.portrait);
  }
});

test('승준 explorer pass: the harbor and the hillside and their counters are open for him only', async () => {
  const { EXPLORER_PASS } = await import('../app/lounge-explorer-pass.ts');
  const seungjun = EXPLORER_PASS.actor;
  // The view: open for him, still closed for the others (the village record is untouched).
  const s = world(4);
  const me = s.members[seungjun],
    other = s.members[0];
  const mine = lifeView(s.life, me.id, me.actor, T0).districts;
  assert.equal(mine.pass, true);
  assert.deepEqual([...mine.open].sort(), ['harbor', 'hillside', 'market']);
  assert.equal(mine.goals.harbor.open, false, 'the village has not opened it');
  const theirs = lifeView(s.life, other.id, other.actor, T0).districts;
  assert.equal(theirs.pass, false);
  assert.deepEqual(theirs.open, ['market']);
  assert.equal(districtOpen('harbor', { flags: [], pass: true }), true);
  // Server rules honour it: dawn auction, reading club and the harbor rod spots.
  const fish = FISH.find((f) => f.sell >= 500 && f.weight > 1);
  s.life.ext[me.id].inv[fish.id] = 2;
  s.life.ext[other.id].inv[fish.id] = 2;
  s.act(me, { kind: 'auctionSell', item: fish.id, n: 1 }, at(1, 6, 20));
  assert.throws(() => s.act(other, { kind: 'auctionSell', item: fish.id, n: 1 }, at(1, 6, 20)), /항구 구역/);
  const wed = dayWith(3);
  s.act(me, { kind: 'readingClub', skill: 'fish' }, at(wed, 19, 30));
  assert.throws(() => s.act(other, { kind: 'readingClub', skill: 'fish' }, at(wed, 19, 30)), /언덕 주택가/);
  assert.throws(() => s.act(other, { kind: 'anglerCast', spot: 'breakwater' }, at(1, 12)), /열리지|아직|갈 수 없/);
  s.act(me, { kind: 'anglerCast', spot: 'breakwater' }, at(1, 12));
  // After it ends he follows the village's record like everyone else.
  const late = world(4);
  assert.deepEqual(lifeView(late.life, late.members[seungjun].id, seungjun, EXPLORER_PASS.until).districts.open, ['market']);
});

test('승준 explorer pass: the server lets him into the districts, not the others', async () => {
  const { EXPLORER_PASS } = await import('../app/lounge-explorer-pass.ts');
  let w = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const mk = (actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' });
  const run = async (p, op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}), ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
    const r = cloudTransition(w, p, command, await commandHash(command), T0);
    w = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    return r.response;
  };
  const him = mk(EXPLORER_PASS.actor),
    friend = mk(0);
  for (const p of [him, friend]) {
    await run(p, 'wallet');
    await run(p, 'open', { code: 'BEMTADUVLY' });
  }
  for (const area of ['harbor', 'hillside']) {
    const ok = await run(him, 'action', { action: { kind: 'area', area } });
    assert.ok(!ok.error, `${area}: ${ok.error}`);
    const no = await run(friend, 'action', { action: { kind: 'area', area } });
    assert.ok(no.error, `${area} still closed for the others`);
  }
  assert.ok(!(w.life.flags ?? []).includes('district-harbor'), 'no village flag was written');
});

test('the hub signpost (친구에게 가기) is within reach of the plaza paths', async () => {
  const { HUB_SIGNPOST } = await import('../app/lounge-districts.ts');
  const { villagePath } = await import('../app/lounge-village-layout.ts');
  const end = villagePath({ x: 0, z: 3 }, HUB_SIGNPOST).at(-1);
  assert.ok(Math.hypot(end.x - HUB_SIGNPOST.x, end.z - HUB_SIGNPOST.z) < HUB_SIGNPOST.reach);
});
