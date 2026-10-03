// 우리 농장 F1 (handover/design/design-our-farm.md §3-1, §6): the old 3 × 4
// yards (6 / 9 / 12 plots) move onto the 10 × 8 fields on read — same shape in
// the top-left block, fixtures and farm news with them, the paid size on the
// same tier — the fields are written sparse, and nothing touches the ledger.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { QUALITY_ODDS, emptyLife, ensureLifeMember, lifeView, packField, packLife, plotGrowMs, plotQuality, readField, readLife } from '../app/lounge-life.ts';
import { legacyWet } from '../app/lounge-farm-soil.ts';
import {
  FIELD_TIERS,
  GRID_TILES,
  bedSeed,
  bedTiles,
  fieldBlock,
  legacyIndexOf,
  legacyTile,
  openTiles,
  tileBed,
  tileOpen,
  tileSeed,
} from '../app/lounge-farm-data.ts';
import { giantBed } from '../app/lounge-farm.ts';
import { ROOMS_RESET_ID } from '../app/lounge-rooms-reset.ts';
import { hash32 } from '../app/lounge-calendar.ts';

const uuid = () => crypto.randomUUID();
const empty = () => ({ crop: null, plantedAt: 0, wateredAt: null });
/** An old yard: 12 plots, every one different, one withered. */
function oldYard(n = 12) {
  return Array.from({ length: n }, (_, i) =>
    i === 4 ? { ...empty(), dead: 'watermelon' } : i === 7 ? empty() : { crop: i % 2 ? 'carrot' : 'tomato', plantedAt: 1_000 + i, wateredAt: i % 3 ? null : 2_000 + i, ...(i === 5 ? { fert: 2, speed: 10 } : {}) },
  );
}
/**
 * An old plot as F2 reads it: tilled, and a crop already watered (it grows on
 * until the old rules had it ripe; lounge-farm-soil legacyWet).
 */
function migrated(p) {
  const { wateredAt, ...rest } = p;
  if (!p.crop) return { ...rest, t: 1 };
  const plot = { ...rest, t: 1 };
  return { ...plot, ...legacyWet(p.plantedAt, wateredAt, plotGrowMs(plot)) };
}
function oldWorldLife() {
  const a = uuid(),
    b = uuid(),
    c = uuid();
  return {
    ids: [a, b, c],
    life: {
      farms: { [a]: oldYard(6), [b]: oldYard(9), [c]: oldYard(12) },
      bag: {},
      actors: { [a]: 0, [b]: 1, [c]: 2 },
      ext: { [b]: { plots: 9 }, [c]: { plots: 12, inv: { sprinkler: 1 } } },
      farmx: {
        [c]: {
          fx: { 3: { k: 'sprinkler', at: 5 }, 11: { k: 'scarecrow', at: 6 }, 8: { k: 'beehouse', at: 7, h: 9 } },
          mach: { 0: { k: 'jar' } },
          log: [{ kind: 'crow', at: 8, crop: 'carrot', tile: 9 }, { kind: 'ship', at: 9, n: 2, beom: 100 }],
        },
      },
      seq: 4,
    },
  };
}

test('the field grid: 10 × 8, tiers open the top-left 6 × 4, 8 × 6 and 10 × 8 blocks', () => {
  assert.equal(GRID_TILES, 80);
  assert.deepEqual(
    FIELD_TIERS.map((t) => [t.size, openTiles(t.size).length]),
    [
      [24, 24],
      [48, 48],
      [80, 80],
    ],
  );
  assert.deepEqual(fieldBlock(48), { cols: 8, rows: 6 });
  assert.equal(tileOpen(24, 5), true);
  assert.equal(tileOpen(24, 6), false);
  assert.equal(tileOpen(24, 40), false);
  assert.equal(tileOpen(80, 79), true);
  assert.equal(tileOpen(80, 80), false);
  // Beds: 3 × 2 blocks; column 9 belongs to none.
  assert.equal(tileBed(9), null);
  assert.deepEqual(bedTiles(tileBed(77)), [66, 67, 68, 76, 77, 78]);
});

test('old yard tiles keep their shape in the top-left 3 × 4 block (and their rolls)', () => {
  // Back bed (old 6–11) on rows 0–1, front bed (old 0–5) on rows 2–3.
  assert.deepEqual(
    Array.from({ length: 12 }, (_, i) => legacyTile(i)),
    [20, 21, 22, 30, 31, 32, 0, 1, 2, 10, 11, 12],
  );
  for (let i = 0; i < 12; i++) {
    assert.equal(legacyIndexOf(legacyTile(i)), i);
    // Quality and giant rolls are seeded by the old index: crops planted before the move keep them.
    assert.equal(tileSeed(legacyTile(i)), i);
    assert.ok(tileOpen(24, legacyTile(i)), 'every old tile is tilled on the smallest field');
  }
  assert.equal(bedSeed(tileBed(legacyTile(0))), 0);
  assert.equal(bedSeed(tileBed(legacyTile(6))), 1);
  assert.equal(legacyTile(12), null);
  // A ripe giant bed planted before the move is still giant after it.
  const uid = uuid();
  let t = 50_000;
  while (hash32(`giant:${uid}:0:${t}`) % 100 >= 8) t += 1_000;
  const plot = { crop: 'pumpkin', plantedAt: t, wateredAt: null };
  const field = readField(Array.from({ length: 12 }, (_, i) => (i < 6 ? plot : empty())));
  assert.equal(giantBed(field, uid, tileBed(legacyTile(0)), t + 10 * 86_400_000), true);
  // Quality for the same planting: same roll as the old index gave.
  for (let i = 0; i < 12; i++) {
    const roll = hash32(`q:${uid}:${i}:${t}:carrot`) % 100,
      [gold, silver] = QUALITY_ODDS[0];
    assert.equal(plotQuality(uid, legacyTile(i), { crop: 'carrot', plantedAt: t, wateredAt: null }), roll < gold ? 2 : roll < silver ? 1 : 0);
  }
});

test('old world → new: no plot, fixture or farm news lost; tiers 6/9/12 → 24/48/80', () => {
  const { ids, life: old } = oldWorldLife();
  const life = readLife(structuredClone(old));
  for (const uid of ids) {
    const before = old.farms[uid],
      after = life.farms[uid];
    assert.equal(after.length, GRID_TILES);
    before.forEach((p, i) => assert.deepEqual(after[legacyTile(i)], migrated(p), `${uid} tile ${i}`));
    // Nothing else on the field: grass (F2: not tilled).
    const moved = new Set(before.map((_, i) => legacyTile(i)));
    after.forEach((p, i) => moved.has(i) || assert.deepEqual(p, { crop: null, plantedAt: 0 }));
  }
  // Sprinklers move with their tile; scarecrows and bee houses (F2) to the
  // free front-yard spot nearest them; the work yard and goods do not change.
  const c = ids[2];
  assert.deepEqual(life.farmx[c].fx, {
    [legacyTile(3)]: { k: 'sprinkler', at: 5 },
    y0: { k: 'beehouse', at: 7, h: 9 },
    y1: { k: 'scarecrow', at: 6 },
  });
  assert.deepEqual(life.farmx[c].mach, { 0: { k: 'jar' } });
  assert.equal(life.farmx[c].log[0].tile, legacyTile(9));
  assert.equal(life.farmx[c].log[1].tile, undefined);
  // Paid sizes carry over to the same tier.
  assert.deepEqual(
    ids.map((uid) => lifeView(life, uid, life.actors[uid], 10_000).me.plots),
    [24, 48, 80],
  );
  assert.equal(life.ext[ids[1]].plots, 48);
  assert.equal(life.ext[ids[2]].plots, 80);
  assert.equal(life.ext[ids[2]].inv.sprinkler, 1);
});

test('the conversion is pure and idempotent; packLife round-trips', () => {
  const { life: old } = oldWorldLife();
  const frozen = JSON.stringify(old);
  const once = readLife(old);
  assert.equal(JSON.stringify(old), frozen, 'readLife never writes into its input');
  assert.deepEqual(readLife(structuredClone(once)), once);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(once))), once);
  const packed = packLife(once);
  assert.equal(JSON.stringify(packLife(packed)), JSON.stringify(packed));
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(packed))), once);
  // Stored sparse: only tiles with tilled soil, a crop or a withered plant.
  for (const [uid, f] of Object.entries(packed.farms)) {
    assert.ok(!Array.isArray(f));
    assert.deepEqual(
      Object.keys(f).map(Number).sort((a, b) => a - b),
      once.farms[uid].flatMap((p, i) => (p.crop || p.dead || p.t ? [i] : [])),
    );
  }
  // A full field of 80 crops stays small (design §6: about 30KB for everyone).
  const full = Array.from({ length: GRID_TILES }, (_, i) => ({ crop: 'carrot', plantedAt: 1_700_000_000_000 + i, wateredAt: 1_700_000_100_000, fert: 2, speed: 10 }));
  assert.ok(JSON.stringify(packField(full)).length * 7 < 60_000);
  // A new member starts with the empty grid; nothing is stored for it.
  const fresh = ensureLifeMember(emptyLife(), uuid(), 3);
  assert.deepEqual(Object.values(packLife(fresh).farms), [{}]);
});

const member = (id, actor) => ({ id, actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });
async function run(world, m, op, extra = {}) {
  const command = { op, connection: m.connection, ...(op === 'read' || op === 'wallet' ? {} : { requestId: uuid(), sequence: ++m.sequence }), ...(op === 'open' ? { epoch: m.epoch } : {}), ...extra };
  const result = cloudTransition(world, m, command, await commandHash(command), Date.UTC(2026, 9, 3, 3));
  validateLedger(result.state.ledger);
  m.epoch = result.response.epoch;
  return result;
}

test('cloud: a plain read of an old world writes nothing; the first write stores sparse fields, ledger untouched', async () => {
  const { ids, life } = oldWorldLife();
  let ledger = newLoungeLedger();
  for (const id of ids) ledger = registerWallet(ledger, 'wallet-' + id);
  const world = { schema: 1, ledger, rooms: {}, receipts: {}, epochs: {}, life: { ...life, roomsReset: { id: ROOMS_RESET_ID, at: 1, backup: {} } } };
  const m = member(ids[2], 2);
  const read = await run(world, m, 'wallet');
  assert.equal(read.changed, false);
  assert.ok(Array.isArray(read.state.life.farms[ids[0]]), 'still the old shape until something is written');
  // The read's view already shows the moved field.
  const opened = await run(read.state, m, 'open');
  const view = opened.response.life;
  assert.equal(view.me.plots, 80);
  assert.equal(view.me.farm[legacyTile(0)].crop, 'tomato');
  assert.equal(view.housesPlotsPublic[ids[0]].find((p) => p.tile === legacyTile(1))?.crop, 'carrot');
  const wrote = await run(opened.state, m, 'action', { action: { kind: 'status', text: '농장으로 이사!' } });
  assert.equal(wrote.response.ok, true, wrote.response.error);
  const stored = wrote.state.life;
  for (const id of ids) assert.ok(!Array.isArray(stored.farms[id]) && typeof stored.farms[id] === 'object');
  // The same fields (the first settle only starts the old sprinkler's wet soil, F2).
  const soilless = (farms) => Object.fromEntries(Object.entries(farms).map(([uid, f]) => [uid, f.map((p) => ({ ...p, sp: undefined, wetMs: undefined, wetUntil: undefined }))]));
  assert.deepEqual(soilless(readLife(stored).farms), soilless(readLife(life).farms));
  assert.ok(readLife(stored).farms[ids[2]].some((p) => p.sp));
  // Fixtures, machines and news as they were (settling only stamps the crow day, `st`).
  for (const [uid, x] of Object.entries(readLife(life).farmx)) {
    const { st, ...rest } = readLife(stored).farmx[uid];
    assert.ok(st > 0);
    assert.deepEqual(rest, x);
  }
  // The move costs nobody anything.
  assert.deepEqual(wrote.state.ledger.accounts, world.ledger.accounts);
});

// ------------------------------------------------------------ the farm map
import { REGIONS, regionWalk, nearestExit } from '../app/lounge-areas.ts';
import { DISTRICTS, districtOpen } from '../app/lounge-districts.ts';
import {
  FARM_BIN,
  FARM_BOARD,
  FARM_COLLIDERS,
  FARM_FIELDS,
  FARM_HOUSES,
  FARM_LATER,
  FARM_MAILBOX,
  FARM_W,
  FARM_D,
  farmStart,
  fieldTileAt,
  fieldTileCenter,
  houseOutside,
} from '../app/lounge-farm-layout.ts';
import { farmReach, farmSceneState } from '../app/lounge-farm-view.ts';
import { districtMinimap } from '../app/lounge-district-minimap.ts';
import { AREA_DEFAULTS } from '../app/lounge-games.ts';
import { regionToNetwork } from '../app/lounge-areas.ts';

test('우리 농장: open from the start behind the hub north gate; 84 × 64; arrival on the road', () => {
  assert.equal(districtOpen('farm'), true);
  assert.deepEqual({ x: DISTRICTS.farm.gate.x, z: DISTRICTS.farm.gate.z }, { x: -4, z: -43.4 });
  assert.deepEqual(REGIONS.farm.bounds, { w: 84, d: 64 });
  assert.deepEqual(AREA_DEFAULTS.farm, regionToNetwork('farm', REGIONS.farm.arrive.village));
  assert.equal(nearestExit('farm', REGIONS.farm.exits[0].stand)?.to, 'village');
});

test('the farm map: seven houses in a row, each field in front of its door, everything reachable', () => {
  const w = regionWalk('farm');
  const start = REGIONS.farm.arrive.village;
  assert.ok(w.canWalk(start));
  const reach = (p, label) => {
    assert.ok(w.canWalk(p), `${label} walkable`);
    const end = w.path(start, p).at(-1);
    assert.ok(end && Math.hypot(end.x - p.x, end.z - p.z) < 0.05, `${label} reachable`);
  };
  assert.deepEqual(new Set(FARM_HOUSES.map((h) => h.actor)), new Set([0, 1, 2, 3, 4, 5, 6]));
  for (const h of FARM_HOUSES) {
    assert.ok(Math.abs(h.x) + h.w / 2 < FARM_W / 2 && h.z - h.d / 2 > -FARM_D / 2, `house ${h.actor} inside`);
    reach(h.door, `door ${h.actor}`);
    reach(houseOutside(h), `outside ${h.actor}`);
    reach(farmStart(h.actor), `start ${h.actor}`);
    const f = FARM_FIELDS.find((x) => x.actor === h.actor);
    // The field is right in front of the house, under its door.
    assert.ok(f.z0 > h.door.z && f.z0 - h.door.z < 3, `field ${h.actor} by the door`);
    assert.ok(Math.abs(f.x0 + f.w / 2 - h.x) < 0.01);
    // Every tile is walkable ground (fields are not walls) and maps back to itself.
    for (let t = 0; t < 80; t++) {
      const c = fieldTileCenter(f, t);
      assert.equal(fieldTileAt(f, c), t);
      assert.ok(w.canWalk(c), `tile ${t} of ${h.actor}`);
    }
  }
  // Fields never overlap each other.
  const sorted = [...FARM_FIELDS].sort((a, b) => a.x0 - b.x0);
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i].x0 >= sorted[i - 1].x0 + sorted[i - 1].w + 1);
  reach(FARM_BIN.front, 'bin');
  reach(FARM_MAILBOX.front, 'mailbox');
  reach(FARM_BOARD.front, 'board');
  for (const l of FARM_LATER) reach({ x: l.x, z: l.z }, l.id);
  assert.ok(FARM_COLLIDERS.length > 7);
  // The minimap names every house and the yard.
  const map = districtMinimap('farm', 1);
  for (const a of [0, 1, 2, 3, 4, 5, 6]) assert.ok(map.places.some((p) => p.id === `home-${a}`));
  for (const p of map.places) if (p.kind !== 'exit') reach(p.go, `pin ${p.id}`);
});

test('farm touches: my field farms, a friend\'s field waters once a day, doors go in, the yard opens', () => {
  const uidMe = uuid(),
    uidB = uuid();
  const life = {
    me: { farm: Array.from({ length: 80 }, (_, i) => (i === 3 ? { crop: 'carrot', readyAt: 0, wateredAt: null } : { crop: null, readyAt: null, wateredAt: null })), plots: 24, waterFriend: [] },
    actors: { [uidMe]: 3, [uidB]: 1 },
    housesPlotsPublic: { [uidB]: [{ tile: 0, crop: 'carrot', stage: 1, needsWater: true }] },
    fieldSizes: { [uidB]: 48 },
    farmsPublic: {},
    houses: { 1: 4 },
  };
  const field = (a) => FARM_FIELDS.find((f) => f.actor === a);
  const mine = farmReach(fieldTileCenter(field(3), 3), life, 3, 10)[0];
  assert.equal(mine.touch.kind, 'field');
  assert.equal(mine.label, '거두기 (1)');
  assert.equal(mine.action, 'harvest');
  // Untilled tiles of my field are out of E's reach (column 9 at 6 × 4).
  assert.ok(!farmReach(fieldTileCenter(field(3), 79), life, 3, 10).some((r) => r.touch.kind === 'field'));
  const friend = farmReach(fieldTileCenter(field(1), 0), life, 3, 10)[0];
  assert.deepEqual(friend.touch, { kind: 'friendField', actor: 1 });
  assert.equal(friend.action, 'waterFriend');
  life.me.waterFriend = [1];
  assert.equal(farmReach(fieldTileCenter(field(1), 0), life, 3, 10)[0].disabled, true);
  const door = farmReach(FARM_HOUSES.find((h) => h.actor === 3).door, life, 3, 10)[0];
  assert.deepEqual(door.touch, { kind: 'home', actor: 3 });
  assert.equal(door.label, '내 집 들어가기');
  assert.equal(farmReach(FARM_HOUSES.find((h) => h.actor === 1).door, life, 3, 10)[0].label, '강재네 집 놀러 가기');
  assert.equal(farmReach(FARM_BIN.front, life, 3, 10)[0].touch.kind, 'bin');
  assert.equal(farmReach(FARM_MAILBOX.front, life, 3, 10)[0].touch.kind, 'mailbox');
  assert.equal(farmReach(FARM_BOARD.front, life, 3, 10)[0].touch.kind, 'board');
  // The scene state: all seven fields, friends' sizes and house tiers.
  const state = farmSceneState(life, 3);
  assert.equal(state.fields.length, 7);
  assert.equal(state.fields.find((f) => f.actor === 1).size, 48);
  assert.deepEqual(state.fields.find((f) => f.actor === 3).plots, [{ tile: 3, crop: 'carrot', growth: 0, tilled: true }]);
  assert.equal(state.houses[1], 4);
});
