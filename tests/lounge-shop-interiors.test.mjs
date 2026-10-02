// 가게 실내 (2026-10-02): the bakery, co-op, general store and fish market
// rooms. Layout (counter reachable, furniture blocks walking, staff strip
// closed to players, café chairs), the registry, the residents' posts, the
// models' records, and the server: entering and leaving the areas, the
// harbor gate in front of the fish market, and counter actions allowed inside
// the matching room only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  SHOP_AREAS,
  SHOP_INTERIORS,
  SHOP_SEATED_AT,
  isShopArea,
  nearShopCounter,
  nearShopSeat,
  seatPoint,
  shopCanWalk,
  shopForCounter,
  shopObstacles,
  shopPath,
  shopSeatAt,
  standUpSpot,
  townActionShop,
} from '../app/lounge-shop-interiors.ts';
import { AREAS, AREA_DEFAULTS, TABLE_AREA, chatScope } from '../app/lounge-games.ts';
import { INTERIOR_AREAS, VENUES } from '../app/lounge-venues.ts';
import { INTERIOR_DOOR, interiorArrival, interiorAction, interiorCanWalk, interiorPath, interiorTables, segmentWalkable, worldToInterior } from '../app/lounge-interior-layout.ts';
import { sceneCanWalk } from '../app/lounge-scene-layout.ts';
import { readReaction } from '../app/lounge-reactions.ts';
import { districtCounters, shopDoorOutside } from '../app/lounge-district-counters.ts';
import { regionWalk } from '../app/lounge-areas.ts';
import { NPC_PLACES, npcCanStand, npcSpot, kstDayStart } from '../app/lounge-npc-schedule.ts';
import { SHOP_INTERIOR_MODELS } from '../app/lounge-model-assets.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { BAKERY_MENU } from '../app/lounge-town.ts';

// ---------------------------------------------------------------- registry
test('the shop rooms are interior areas with their own chat and no game tables', () => {
  // Stage 2's four, then stage 3's 축사 · 과수원 창고 · 대장간 · 의원 (design-npcs-stage3.md).
  assert.deepEqual([...SHOP_AREAS], ['bakery', 'coop', 'general', 'fishmarket', 'barn', 'orchardShop', 'smithy', 'clinic']);
  for (const area of SHOP_AREAS) {
    assert.ok(AREAS.includes(area));
    assert.ok(INTERIOR_AREAS.includes(area));
    assert.ok(isShopArea(area));
    assert.equal(chatScope(area), area);
    // A step in from the door (past 나가기), lounge-map-doors.ts.
    assert.deepEqual(AREA_DEFAULTS[area], interiorArrival(area));
    assert.deepEqual(interiorTables(area), []);
    assert.ok(!Object.values(TABLE_AREA).includes(area));
    assert.equal(VENUES[area].name, SHOP_INTERIORS[area].name);
    assert.equal(shopForCounter(SHOP_INTERIORS[area].counter), area);
    // Stickers are scoped to the room like the other interiors.
    assert.ok(readReaction({ id: 'laugh', at: 1, scope: area }));
  }
  assert.equal(isShopArea('market'), false);
  assert.equal(shopForCounter('post'), null);
  assert.equal(shopForCounter('guild'), null);
});

test('district doors lead in; the harbor auction yard stays an outdoor counter', () => {
  for (const area of ['market', 'harbor', 'ranch', 'foothill']) {
    const touches = districtCounters(area, 1).filter((c) => c.a.kind === 'counter');
    for (const shop of SHOP_AREAS.filter((s) => SHOP_INTERIORS[s].district === area))
      assert.ok(touches.some((c) => c.a.enter === shop && /들어가기/.test(c.a.label)), `${shop} door in ${area}`);
  }
  const harbor = districtCounters('harbor', 1).filter((c) => c.a.kind === 'counter' && c.a.place === 'fishmarket');
  assert.equal(harbor.filter((c) => c.a.enter).length, 1, 'the building door enters');
  assert.equal(harbor.filter((c) => !c.a.enter).length, 1, '새벽 경매장 is still a counter');
  // Walking out puts you on walkable street in front of the door.
  for (const area of SHOP_AREAS) {
    const out = shopDoorOutside(area);
    assert.equal(out.district, SHOP_INTERIORS[area].district);
    assert.ok(regionWalk(out.district).canWalk(out.at), `${area} exit spot walkable`);
  }
});

// ---------------------------------------------------------------- layout
for (const area of SHOP_AREAS) {
  const s = SHOP_INTERIORS[area];
  test(`${area}: the counter is reachable from the door and opens only on the customers' side`, () => {
    assert.ok(interiorCanWalk(s.front, area), 'front walkable');
    assert.ok(interiorCanWalk(INTERIOR_DOOR, area), 'door walkable');
    assert.ok(nearShopCounter(s.front, area));
    assert.deepEqual(interiorAction(s.front, area), { kind: 'counter' });
    assert.deepEqual(interiorAction(INTERIOR_DOOR, area), { kind: 'door' });
    assert.equal(nearShopCounter(s.front, 'market'), false);
    assert.equal(nearShopCounter(INTERIOR_DOOR, area), false);
    // Behind the counter (the owner's spot) is not the customers' side.
    assert.equal(nearShopCounter(worldToInterior(s.ownerAt), area), false);
    let current = INTERIOR_DOOR;
    for (const next of interiorPath(INTERIOR_DOOR, s.front, area)) {
      assert.ok(segmentWalkable(current, next, area), `${area} ${JSON.stringify(current)} → ${JSON.stringify(next)}`);
      current = next;
    }
    assert.deepEqual(current, s.front);
  });
  test(`${area}: furniture blocks both floors, props stay in the room, no stranded pockets`, () => {
    for (const o of shopObstacles(area)) {
      assert.equal(sceneCanWalk(o, area), false, o.id);
      assert.equal(interiorCanWalk(o, area), false, o.id);
    }
    for (const it of s.items) {
      assert.ok(it.x - it.w / 2 >= -8.45 && it.x + it.w / 2 <= 8.45 && it.z - it.d / 2 >= -6.05 && it.z + it.d / 2 <= 5.25, `${it.id} inside the room`);
      if (it.model) assert.ok(it.model in SHOP_INTERIOR_MODELS || ['cafeTable', 'register', 'storageShelf', 'teaSideboard', 'produceCrate', 'banquetChair', 'plantStand', 'hanjiLantern', 'gardenLantern', 'onggi', 'barrelRack', 'fishMackerel', 'fishCod', 'fishHairtail', 'stove', 'cauldron', 'keg', 'firewood', 'cornerCabinet'].includes(it.model), it.id);
    }
    // Every walkable start (every 40 cm) reaches the door and the counter.
    let starts = 0;
    for (let x = 16; x <= 84; x += 2)
      for (let y = 42; y <= 88; y += 2) {
        const p = { x, y };
        if (!interiorCanWalk(p, area)) continue;
        starts++;
        for (const goal of [INTERIOR_DOOR, s.front]) {
          let current = p;
          for (const next of interiorPath(p, goal, area)) {
            assert.ok(segmentWalkable(current, next, area), `${area} from ${x},${y} → ${JSON.stringify(next)}`);
            current = next;
          }
          assert.deepEqual(current, goal);
        }
      }
    assert.ok(starts > 200, `${area}: ${starts} walkable starts`);
  });
  test(`${area}: players never get behind the counter; staff walk round its ends`, () => {
    const owner = worldToInterior(s.ownerAt);
    assert.equal(shopCanWalk(owner, area), false, 'customers cannot stand at the owner spot');
    assert.ok(shopCanWalk(owner, area, 1.4, true), 'the owner can');
    for (let x = 16; x <= 84; x += 1) assert.equal(interiorCanWalk({ x, y: owner.y }, area) && Math.abs(x - owner.x) < 8, false, `staff strip at x ${x}`);
    const path = shopPath(area, INTERIOR_DOOR, owner, { staff: true, radius: 1.4 });
    let current = INTERIOR_DOOR;
    for (const next of path) {
      const n = Math.max(1, Math.ceil(Math.hypot(next.x - current.x, next.y - current.y) / 0.5));
      for (let i = 1; i <= n; i++)
        assert.ok(shopCanWalk({ x: current.x + ((next.x - current.x) * i) / n, y: current.y + ((next.y - current.y) * i) / n }, area, 1.4, true), `${area} staff path`);
      current = next;
    }
    assert.deepEqual(current, owner);
  });
}

test('bakery: six café chairs; standing on one is sitting, an occupied one is skipped, getting up is walkable', () => {
  const { seats } = SHOP_INTERIORS.bakery;
  assert.equal(seats.length, 6);
  assert.equal(seats.filter((s) => s.npc).length, 3, 'residents use the far-side chairs');
  for (const seat of seats) {
    const p = seatPoint(seat);
    assert.ok(interiorCanWalk(p, 'bakery'), `${seat.id} reachable`);
    assert.equal(shopSeatAt(p, 'bakery')?.id, seat.id);
    assert.deepEqual(interiorAction(p, 'bakery'), { kind: 'stand' });
    // Walk there from the door.
    let current = INTERIOR_DOOR;
    for (const next of interiorPath(INTERIOR_DOOR, p, 'bakery')) {
      assert.ok(segmentWalkable(current, next, 'bakery'), `${seat.id} path`);
      current = next;
    }
    assert.deepEqual(current, p);
    // Close by: 앉기 offers this chair, unless a friend sits there.
    const by = { x: p.x + (seat.npc ? 0 : 0), y: p.y + (seat.face === 0 ? -2.6 : 2.6) };
    if (interiorCanWalk(by, 'bakery')) {
      const offer = nearShopSeat(by, 'bakery');
      assert.ok(offer, `${seat.id} offered from beside it`);
      assert.notEqual(nearShopSeat(by, 'bakery', [p])?.id, seat.id, 'taken chair skipped');
    }
    const up = standUpSpot(p, 'bakery');
    assert.ok(up && interiorCanWalk(up, 'bakery') && !shopSeatAt(up, 'bakery'), `${seat.id} stand up`);
    assert.ok(Math.hypot(up.x - p.x, up.y - p.y) > SHOP_SEATED_AT);
  }
  for (const area of ['coop', 'general', 'fishmarket']) assert.equal(SHOP_INTERIORS[area].seats.length, 0);
});

// ---------------------------------------------------------------- residents
test('shop owners stand behind their counters during opening hours; residents visit', () => {
  const DAY0 = Math.floor(Date.UTC(2026, 9, 5) / 86_400_000); // a Monday
  const at = (id, h, m = 0) => npcSpot(id, kstDayStart(DAY0) + (h * 60 + m) * 60_000);
  assert.equal(at('nasera', 9).place, 'coop.owner');
  assert.equal(at('thresh', 10).place, 'general.owner');
  assert.equal(at('frieren', 11, 30).place, 'bakery.owner');
  assert.equal(at('himmel', 10).place, 'bakery.helper');
  assert.equal(at('lux', 9).place, 'fishmarket.owner');
  for (const s of [at('nasera', 9), at('thresh', 10), at('frieren', 11, 30), at('lux', 9)]) assert.ok(s.visible && !s.walking);
  assert.equal(at('tsunade', 11, 30).place, 'coop.browse');
  assert.equal(at('volibas', 12, 20).place, 'bakery.seat-cafe-2');
  // Every shop place is standable for residents.
  for (const [id, p] of Object.entries(NPC_PLACES)) if (isShopArea(p.area)) assert.ok(npcCanStand(p.area, p), id);
});

// ---------------------------------------------------------------- models
test('the shop models are recorded with source, terms and both hashes', () => {
  const record = JSON.parse(fs.readFileSync('public/models/village/shop-interiors/assets.json', 'utf8'));
  assert.equal(record.provider, 'kArchive');
  assert.match(record.terms, /자료: kArchive · 출처: 쓰레드 dogfooter/);
  assert.match(record.terms, /재판매 금지/);
  const keys = Object.keys(SHOP_INTERIOR_MODELS);
  assert.deepEqual(record.assets.map((a) => a.key).sort(), [...keys].sort());
  for (const a of record.assets) {
    assert.match(a.source, /^https:\/\/karchive\.vibeline\.co\.kr\/models\//);
    const original = fs.readFileSync(`public/models/_originals/village/shop-interiors/${a.file}`);
    assert.equal(createHash('sha256').update(original).digest('hex'), a.sha256, `${a.key} original`);
    const web = fs.readFileSync(`public/models/village/shop-interiors/${a.file}`);
    assert.equal(createHash('sha256').update(web).digest('hex'), a.webSha256, `${a.key} web copy`);
    assert.ok(web.length < original.length, `${a.key} web copy is smaller`);
  }
  assert.match(fs.readFileSync('public/models/village/shop-interiors/ATTRIBUTION.md', 'utf8'), /자료: kArchive · 출처: 쓰레드 dogfooter/);
});

// ---------------------------------------------------------------- server
const T0 = Date.UTC(2026, 9, 5, 3, 0, 0); // Monday 12:00 KST
function server() {
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const person = (actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), code: '', epoch: 0, sequence: 0 });
  const run = async (p, op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}), ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
    const r = cloudTransition(state, p, command, await commandHash(command), T0);
    state = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    validateLedger(state.ledger);
    return r.response;
  };
  return { person, run, act: (p, a) => run(p, 'action', { action: a }), get state() { return state; } };
}
const meIn = (r, p) => r.packet?.players.find((x) => x.id === p.id);

test('server: entering a shop room, walking inside (clamped to the floor) and leaving to its street', async () => {
  const h = server();
  const a = h.person(0);
  await h.run(a, 'wallet');
  await h.run(a, 'open', { code: 'BEMTADUVLY' });
  let r = await h.act(a, { kind: 'area', area: 'market', x: 30, y: 30 });
  assert.equal(r.ok, true, r.error);
  r = await h.act(a, { kind: 'area', area: 'bakery', ...INTERIOR_DOOR });
  assert.equal(r.ok, true, r.error);
  assert.equal(meIn(r, a).area, 'bakery');
  r = await h.act(a, { kind: 'move', x: 2, y: 99 });
  assert.equal(r.ok, true, r.error);
  assert.deepEqual([meIn(r, a).x, meIn(r, a).y], [15, 88], 'interior range');
  r = await h.act(a, { kind: 'reaction', id: 'laugh', scope: 'bakery' });
  assert.equal(r.ok, true, r.error);
  r = await h.act(a, { kind: 'area', area: 'market', x: 40, y: 20 });
  assert.equal(r.ok, true, r.error);
  assert.equal(meIn(r, a).area, 'market');
});

test('server: the fish market room stays shut until the harbor opens', async () => {
  const h = server();
  const a = h.person(0);
  await h.run(a, 'wallet');
  await h.run(a, 'open', { code: 'BEMTADUVLY' });
  let r = await h.act(a, { kind: 'area', area: 'fishmarket' });
  assert.ok(r.error, 'refused before the harbor flag');
  h.state.life.flags = ['district-harbor'];
  r = await h.act(a, { kind: 'area', area: 'fishmarket', ...INTERIOR_DOOR });
  assert.equal(r.ok, true, r.error);
});

test('server: counter actions work in the district or inside the matching room only', async () => {
  assert.equal(townActionShop('bakeryBuy'), 'bakery');
  assert.equal(townActionShop('coopSell'), 'coop');
  assert.equal(townActionShop('auctionSell'), 'fishmarket');
  assert.equal(townActionShop('stallBuy'), null);
  assert.equal(townActionShop('toString'), null);
  const h = server();
  const a = h.person(0);
  await h.run(a, 'wallet');
  await h.run(a, 'open', { code: 'BEMTADUVLY' });
  const item = BAKERY_MENU[0].id;
  // Inside the co-op the bakery's counter is not there.
  await h.act(a, { kind: 'area', area: 'coop', ...INTERIOR_DOOR });
  let r = await h.act(a, { kind: 'bakeryBuy', item });
  assert.match(r.error ?? '', /시장 거리에 가서/);
  // In the village either.
  await h.act(a, { kind: 'area', area: 'village', x: 50, y: 60 });
  r = await h.act(a, { kind: 'bakeryBuy', item });
  assert.match(r.error ?? '', /시장 거리에 가서/);
  // Inside the bakery it is.
  await h.act(a, { kind: 'area', area: 'bakery', ...SHOP_INTERIORS.bakery.front });
  r = await h.act(a, { kind: 'bakeryBuy', item });
  assert.equal(r.ok, true, r.error);
  // And still out in the street (the stall days and older clients).
  await h.act(a, { kind: 'area', area: 'market', x: 30, y: 30 });
  r = await h.act(a, { kind: 'bakeryBuy', item });
  assert.equal(r.ok, true, r.error);
});
