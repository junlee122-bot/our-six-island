// Venues: the interior registry (회관 · 카지노 · 허풍 주점), the tavern's room
// layout (every prop off the walkable floor, seats reachable, 허 선장 behind
// the bar), the three new village buildings (lots clear of routes, doors
// reachable), their kArchive records, and the shared shop upgrades (tier
// order, capped contributions, ledger invariant, rules for the furniture
// store and the realty, idempotent retries through the cloud engine).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { AREAS, AREA_DEFAULTS, TABLE_AREA, chatScope } from '../app/lounge-games.ts';
import { INTERIOR_AREAS, VENUES, isInteriorArea } from '../app/lounge-venues.ts';
import {
  INTERIOR_DOOR,
  TAVERN_BAR_FRONT,
  TAVERN_HOST_AT,
  interiorAction,
  interiorCanWalk,
  interiorPath,
  interiorTables,
  tableSeats,
  worldToInterior,
} from '../app/lounge-interior-layout.ts';
import { TAVERN_SPOTS, tavernFootprint, TAVERN_MODEL_SIZE } from '../app/lounge-tavern-layout.ts';
import { TAVERN_MODELS, SHOP_MODELS, tavernModelUrl } from '../app/lounge-model-assets.ts';
import { SHOP_LOTS, SHOP_MODEL_SIZE, shopFit, GRILL_STALL } from '../app/lounge-village-shops-layout.ts';
import {
  VILLAGE_PLACES,
  VILLAGE_PATHS,
  VILLAGE_START,
  villageCanWalk,
  villagePath,
} from '../app/lounge-village-layout.ts';
import {
  VENUE_BASE,
  VENUE_REJECT,
  VENUE_UPGRADES,
  furnitureBonus,
  housePrice,
  venueLook,
  venuesFromView,
} from '../app/lounge-venue-data.ts';
import { LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { shopStock } from '../app/lounge-life-plus.ts';
import { HOUSE_TIERS, SHOP_DAILY_ITEMS, SHOP_REROLL_MAX } from '../app/lounge-items.ts';
import { INITIAL_BEOM, grantBeom, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';

// ---------------------------------------------------------------- registry

test('every table interior is in the registry; the hall and casino keep their looks', () => {
  assert.deepEqual([...INTERIOR_AREAS], ['lounge', 'casino', 'tavern']);
  for (const a of INTERIOR_AREAS) {
    assert.ok(AREAS.includes(a));
    assert.ok(isInteriorArea(a));
    assert.ok(VILLAGE_PLACES.some((p) => p.id === VENUES[a].place && p.destination === a));
  }
  assert.equal(isInteriorArea('village'), false);
  assert.equal(VENUES.lounge.venue, 'hall');
  assert.equal(VENUES.casino.venue, 'casino');
  assert.equal(VENUES.lounge.exposure, 1.05);
  assert.equal(VENUES.casino.exposure, 1.12);
  assert.equal(VENUES.lounge.music, 'hall');
  assert.equal(chatScope('tavern'), 'tavern');
  assert.equal(chatScope('lounge'), 'lounge');
  assert.equal(TABLE_AREA.liarsbar, 'tavern');
  for (const g of Object.keys(TABLE_AREA)) assert.ok(isInteriorArea(TABLE_AREA[g]));
});

// ---------------------------------------------------------------- tavern room

test('tavern: every prop stands off the walkable floor and inside the room', () => {
  for (const [key, spots] of Object.entries(TAVERN_SPOTS)) {
    assert.ok(tavernModelUrl(key), `${key} has a model`);
    for (const s of spots) {
      const f = tavernFootprint(key, s);
      const onFloor = f.x1 > -7 && f.x0 < 7 && f.z1 > -4.6 && f.z0 < 4.6;
      assert.equal(onFloor, false, `${key} at ${s.x},${s.z} is off the walkable floor`);
      assert.ok(f.x0 >= -8.45 && f.x1 <= 8.45 && f.z0 >= -6.05 && f.z1 <= 5.25, `${key} inside the room`);
    }
  }
  // Every upgrade prop has a spot; base props too (the table and stools are placed by the scene).
  for (const u of VENUE_UPGRADES) for (const p of u.props ?? []) assert.ok(TAVERN_SPOTS[p], p);
  for (const p of VENUE_BASE.tavern.props) assert.ok(TAVERN_SPOTS[p] || p === 'cafeTable' || p === 'saddleStool', p);
});

test('tavern: the door, the default spot and every seat of 2–4 are reachable; 허 선장 is behind the bar', () => {
  assert.ok(interiorCanWalk(AREA_DEFAULTS.tavern, 'tavern'));
  assert.ok(interiorCanWalk(INTERIOR_DOOR, 'tavern'));
  const [table] = interiorTables('tavern');
  assert.equal(table.game, 'liarsbar');
  assert.equal(table.host, 'captain');
  assert.deepEqual(table.hostAt, TAVERN_HOST_AT);
  const host = worldToInterior(TAVERN_HOST_AT);
  assert.ok(host.y < 42, 'the host stands behind the walkable floor');
  for (const n of [2, 3, 4])
    for (const s of tableSeats('tavern', 'liarsbar', n, [])) {
      const route = interiorPath(INTERIOR_DOOR, s.at, 'tavern');
      assert.deepEqual(route.at(-1), s.at);
    }
  assert.deepEqual(interiorAction(TAVERN_BAR_FRONT, 'tavern'), { kind: 'host' });
  assert.equal(interiorAction(TAVERN_BAR_FRONT, 'lounge')?.kind === 'host', false);
  // The hall and the casino have no bar host.
  for (const a of ['lounge', 'casino']) for (const t of interiorTables(a)) assert.equal(t.fixedHost, undefined);
});

// ---------------------------------------------------------------- village

test('the three new buildings: lots match the layout, doors reachable, lots clear of every route', () => {
  for (const id of ['tavern', 'realty', 'furniture']) {
    const place = VILLAGE_PLACES.find((p) => p.id === id);
    const lot = SHOP_LOTS[id];
    assert.deepEqual({ x: place.x, z: place.z, w: place.width, d: place.depth }, lot);
    assert.ok(villageCanWalk(place.entry), `${id} door`);
    const route = villagePath(VILLAGE_START, place.entry);
    assert.deepEqual(route.at(-1), place.entry);
    // No path segment crosses the building (paths may reach its door).
    for (const [x1, z1, x2, z2, w] of VILLAGE_PATHS)
      for (let t = 0; t <= 1; t += 0.02) {
        const x = x1 + (x2 - x1) * t,
          z = z1 + (z2 - z1) * t;
        const inside = Math.abs(x - lot.x) < lot.w / 2 - w / 2 && Math.abs(z - lot.z) < lot.d / 2 - w / 2;
        assert.equal(inside, false, `${id} is clear of the path ${[x1, z1, x2, z2].join(",")}`);
      }
  }
  // The tavern: beach hill by the night harbor, with the moved pine and boulder.
  const tavern = VILLAGE_PLACES.find((p) => p.id === 'tavern');
  assert.ok(tavern.x > 30 && tavern.z > 25);
  assert.ok(villageCanWalk({ x: 42.2 + 1.2, z: 28.6 }));
  // The grill stall lot is solid and walkable around.
  assert.equal(villageCanWalk({ x: GRILL_STALL.x, z: GRILL_STALL.z }), false);
  for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) assert.ok(villageCanWalk({ x: GRILL_STALL.x + dx, z: GRILL_STALL.z + dz }));
});

test('building fits: every exterior tier fits its lot, front wall on the lot edge', () => {
  const fits = {
    tavern: ['tavernStall', 'dumplingShop', 'stallHeritage'],
    realty: ['realtyOffice', 'realtyDuplex'],
    furniture: ['furnitureShop', 'furnitureShowroom'],
  };
  for (const [lot, models] of Object.entries(fits))
    for (const m of models) {
      const f = shopFit(lot, m);
      const s = SHOP_MODEL_SIZE[m];
      assert.ok(s.w * f.scale <= SHOP_LOTS[lot].w + 1e-6, `${m} width`);
      assert.ok(s.d * f.scale <= SHOP_LOTS[lot].d + 1e-6, `${m} depth`);
      assert.ok(Math.abs(f.z + (s.d * f.scale) / 2 - (SHOP_LOTS[lot].z + SHOP_LOTS[lot].d / 2)) < 0.01);
    }
});

test('kArchive records: originals match assets.json, sizes match the code, 512² props', () => {
  for (const folder of ['lounge/tavern', 'village/tavern', 'village/shops']) {
    const rec = JSON.parse(fs.readFileSync(`public/models/${folder}/assets.json`, 'utf8'));
    assert.equal(rec.provider, 'kArchive');
    assert.match(rec.terms, /출처: 쓰레드 dogfooter/);
    for (const a of rec.assets) {
      const orig = fs.readFileSync(`public/models/_originals/${folder}/${a.file}`);
      assert.equal(orig.length, a.bytes, a.file);
      assert.equal(createHash('sha256').update(orig).digest('hex'), a.sha256, a.file);
      assert.ok(fs.statSync(`public/models/${folder}/${a.file}`).size < a.bytes, `${a.file} web copy is smaller`);
      const size = TAVERN_MODEL_SIZE[a.key] ?? SHOP_MODEL_SIZE[a.key];
      assert.ok(size, `${a.key} size in code`);
      for (const [i, k] of [[0, 'w'], [1, 'h'], [2, 'd']]) assert.ok(Math.abs(a.bounds.size[i] - size[k]) < 0.01, `${a.key} ${k}`);
      const url = TAVERN_MODELS[a.key] ?? SHOP_MODELS[a.key];
      assert.equal(url, `/models/${folder}/${a.file}`);
    }
  }
  const attribution = fs.readFileSync('public/models/lounge/ATTRIBUTION.md', 'utf8');
  assert.match(attribution, /허풍 주점/);
});

// ---------------------------------------------------------------- upgrades

const T0 = Date.UTC(2026, 8, 24, 3);
function world(n = 3) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: crypto.randomUUID(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    ledger = grantBeom(ledger, 'wallet-' + m.id, 3_000_000, 'test-' + m.id, T0, 'test');
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, ledger, life };
  s.act = (m, a) => {
    const r = lifeAction(s.life, s.ledger, m, a, T0);
    s.life = r.life;
    s.ledger = r.ledger;
    validateLedger(s.ledger);
    return r;
  };
  s.fails = (m, a, message) =>
    assert.throws(() => lifeAction(s.life, s.ledger, m, a, T0), (e) => e instanceof LifeError && (!message || e.message === message));
  return s;
}

test('upgrades: tier order, shared contributions capped at the cost, then the shop changes', () => {
  const s = world(3);
  const [a, b] = s.members;
  s.fails(a, { kind: 'venueUpgrade', upgrade: 'tavern-bar-2', n: 10_000 }, VENUE_REJECT.locked);
  s.fails(a, { kind: 'venueUpgrade', upgrade: 'nope', n: 10_000 }, VENUE_REJECT.upgrade);
  s.fails(a, { kind: 'venueUpgrade', upgrade: 'tavern-bar-1', n: 10 }, VENUE_REJECT.give);
  const before = s.ledger.accounts['wallet-' + a.id];
  s.act(a, { kind: 'venueUpgrade', upgrade: 'tavern-bar-1', n: 50_000 });
  assert.equal(s.ledger.accounts['wallet-' + a.id], before - 50_000);
  // b gives more than is left: only what is left is taken.
  const bBefore = s.ledger.accounts['wallet-' + b.id];
  s.act(b, { kind: 'venueUpgrade', upgrade: 'tavern-bar-1', n: 999_999 });
  assert.equal(s.ledger.accounts['wallet-' + b.id], bBefore - 30_000);
  assert.ok(s.life.venues['tavern-bar-1'].doneAt);
  s.fails(a, { kind: 'venueUpgrade', upgrade: 'tavern-bar-1', n: 1000 }, VENUE_REJECT.done);
  const look = venueLook(s.life, 'tavern');
  for (const p of ['glass', 'cupTree', 'bottleCrate', ...VENUE_BASE.tavern.props]) assert.ok(look.props.includes(p), p);
  assert.equal(look.tiers.bar, 1);
  // The view lists every upgrade; tier 2 opened.
  const v = lifeView(s.life, a.id, a.actor, T0);
  assert.equal(v.venues.length, VENUE_UPGRADES.length);
  assert.equal(v.venues.find((x) => x.id === 'tavern-bar-2').open, true);
  assert.deepEqual(v.venues.find((x) => x.id === 'tavern-bar-1').by, { 0: 50_000, 1: 30_000 });
  // Round trip through storage keeps the progress, clamped.
  const stored = readLife(JSON.parse(JSON.stringify({ ...s.life, venues: { ...s.life.venues, bogus: { got: 5 }, 'tavern-bar-2': { got: 10 ** 12 } } })));
  assert.equal(stored.venues['tavern-bar-1'].got, 80_000);
  assert.equal(stored.venues.bogus, undefined);
  assert.equal(stored.venues['tavern-bar-2'].got, 200_000, 'clamped to the cost');
  // Balances + house = everyone's 범 (spent 범 goes to the house).
  const total = Object.values(s.ledger.accounts).reduce((x, y) => x + y, 0) + (s.ledger.houseBalance ?? 0);
  assert.equal(total - (s.ledger.granted ?? 0), 3 * INITIAL_BEOM);
});

test('the exterior swaps by tier; the view shape rebuilds the same look on the client', () => {
  const s = world(1);
  const [a] = s.members;
  s.act(a, { kind: 'venueUpgrade', upgrade: 'tavern-ext-1', n: 100_000 });
  s.act(a, { kind: 'venueUpgrade', upgrade: 'tavern-ext-2', n: 300_000 });
  assert.equal(venueLook(s.life, 'tavern').building, 'dumplingShop');
  const client = venuesFromView(lifeView(s.life, a.id, a.actor, T0).venues);
  assert.deepEqual(venueLook(client, 'tavern'), venueLook(s.life, 'tavern'));
  s.act(a, { kind: 'venueUpgrade', upgrade: 'tavern-ext-3', n: 600_000 });
  const look = venueLook(s.life, 'tavern');
  assert.equal(look.building, 'stallHeritage');
  assert.deepEqual(look.outside.sort(), ['grillHut', 'menuBoard']);
});

test('furniture store: more stock, more luxury slots, more rerolls; realty plans cut house prices', () => {
  const s = world(1);
  const [a] = s.members;
  const base = shopStock(s.life, T0, a.id);
  assert.equal(furnitureBonus(s.life).stock, 0);
  s.act(a, { kind: 'venueUpgrade', upgrade: 'furniture-stock-1', n: 250_000 });
  s.act(a, { kind: 'venueUpgrade', upgrade: 'furniture-luxury-1', n: 400_000 });
  s.act(a, { kind: 'venueUpgrade', upgrade: 'furniture-service-1', n: 150_000 });
  const more = shopStock(s.life, T0, a.id);
  assert.ok(more.items.length >= Math.min(base.items.length + 2, base.items.length + 2));
  assert.ok(more.items.length > SHOP_DAILY_ITEMS - 1);
  assert.equal(more.luxury.length, base.luxury.length + 1);
  for (let i = 0; i < SHOP_REROLL_MAX + 2; i++) s.act(a, { kind: 'rerollShop' });
  s.fails(a, { kind: 'rerollShop' });
  // Realty: plan rooms take 10% off tiers 3 and 4.
  assert.equal(housePrice(s.life, 3, HOUSE_TIERS[2].price), HOUSE_TIERS[2].price);
  s.act(a, { kind: 'venueUpgrade', upgrade: 'realty-plans-1', n: 300_000 });
  assert.equal(housePrice(s.life, 3, 900_000), 810_000);
  assert.equal(housePrice(s.life, 4, 2_000_000), 2_000_000);
  for (let t = 0; t < 3; t++) s.act(a, { kind: 'upgradeHouse' });
  assert.equal(s.life.ext[a.id].house, 3);
});

test('the cloud engine applies a retried contribution once (same request id)', async () => {
  const uid = '11111111-2222-4333-8444-555555555561';
  const me = { id: uid, actor: 1, username: 'a' };
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const now = 1_800_000_000_000;
  const conn = crypto.randomUUID();
  let seq = 0,
    code = '';
  const send = async (c) => {
    const t = cloudTransition(world, me, c, await commandHash(c), now);
    world = t.state;
    if (t.response.code) code = t.response.code;
    return t.response;
  };
  await send({ op: 'open', connection: conn, requestId: crypto.randomUUID(), sequence: ++seq, epoch: 0 });
  const balance = () => world.ledger.accounts['wallet-' + uid];
  const start = balance();
  const c = { op: 'action', connection: conn, code, requestId: crypto.randomUUID(), sequence: ++seq, action: { kind: 'venueUpgrade', upgrade: 'realty-ext-1', n: 5_000 } };
  const r1 = await send(c);
  assert.equal(r1.ok, true, r1.error);
  const r2 = await send(c);
  assert.equal(balance(), start - 5_000, 'charged once');
  assert.ok(r2.ok || r2.error, 'the retry answers without charging again');
  validateLedger(world.ledger);
});
