// kArchive civic set (2026-09-25): the measured sizes the scenes rely on come
// from the real GLBs, the new footprints stay off routes and open where they
// should, and walking every route through the village never stalls.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  KARCHIVE_COLLIDERS,
  KARCHIVE_GREENHOUSE,
  KARCHIVE_MODEL_SIZE,
  KARCHIVE_MUSEUM,
  KARCHIVE_PERGOLA,
  KARCHIVE_STAGE,
  VEGETABLE_BED_SOIL,
  karchiveFootprint,
} from '../app/lounge-village-karchive-layout.ts';
import {
  VILLAGE_COLLIDERS,
  VILLAGE_DISTRICTS,
  VILLAGE_GREENHOUSE,
  VILLAGE_MUSEUM,
  VILLAGE_PATHS,
  VILLAGE_PLACES,
  VILLAGE_START,
  villageCanWalk,
  villagePath,
  villageStep,
} from '../app/lounge-village-layout.ts';
import { FARM_BEDS, farmFront } from '../app/lounge-village-life.ts';
import { BOARD_FRONT, MUSEUM_FRONT } from '../app/lounge-village-spots.ts';
import { BAR_STOOL_Z, CLUB_MODELS, VIP_CORNER } from '../app/lounge-karchive-club.ts';
import { interiorToWorld } from '../app/lounge-interior-layout.ts';

const models = new URL('../public/models/_originals/', import.meta.url);
const FILES = {
  greenhouse: 'village/civic/greenhouse.glb',
  noticeBoard: 'village/civic/noticeBoard.glb',
  museumLibrary: 'village/civic/museumLibrary.glb',
  hanokHall: 'village/civic/hanokHall.glb',
  festivalStage: 'village/civic/festivalStage.glb',
  wisteriaPergola: 'village/civic/wisteriaPergola.glb',
  vegetableBed: 'village/civic/vegetableBed.glb',
  timberDeck: 'village/civic/timberDeck.glb',
  harborFence: 'village/civic/harborFence.glb',
  picketFence: 'village/civic/picketFence.glb',
};

/** Float positions and triangle indices of a single-mesh, unquantized GLB. */
function glbMesh(relative) {
  const bytes = fs.readFileSync(new URL(relative, models));
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const bin = 20 + jsonLength + 8;
  const read = (index) => {
    const accessor = json.accessors[index],
      view = json.bufferViews[accessor.bufferView],
      offset = bin + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const size = { SCALAR: 1, VEC3: 3 }[accessor.type],
      count = accessor.count * size;
    const Type = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[accessor.componentType];
    return new Type(bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + count * Type.BYTES_PER_ELEMENT));
  };
  assert.equal(json.meshes.length, 1);
  for (const node of json.nodes) assert.ok(!node.matrix && !node.scale && !node.translation, 'identity nodes');
  const primitive = json.meshes[0].primitives[0];
  return { position: read(primitive.attributes.POSITION), index: read(primitive.indices), accessor: json.accessors[primitive.attributes.POSITION] };
}
/** Height (model units) with the most upward-facing surface area in a y range. */
function topSurface(relative, y0 = 0, y1 = Infinity) {
  const { position: p, index } = glbMesh(relative);
  const area = new Map();
  for (let i = 0; i < index.length; i += 3) {
    const [a, b, c] = [index[i] * 3, index[i + 1] * 3, index[i + 2] * 3];
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const twice = Math.hypot(nx, ny, nz);
    if (!twice || ny / twice < 0.9) continue;
    const y = (p[a + 1] + p[b + 1] + p[c + 1]) / 3;
    if (y < y0 || y > y1) continue;
    const key = Math.round(y * 50) / 50;
    area.set(key, (area.get(key) ?? 0) + twice / 2);
  }
  return [...area].sort((x, y) => y[1] - x[1])[0][0];
}

test('civic model sizes are the GLBs’ real bounds (origin at the bottom centre)', () => {
  for (const [key, file] of Object.entries(FILES)) {
    const { accessor } = glbMesh(file);
    const size = KARCHIVE_MODEL_SIZE[key];
    const [w, h, d] = [0, 1, 2].map((i) => accessor.max[i] - accessor.min[i]);
    assert.ok(Math.abs(w - size.w) < 0.005 && Math.abs(h - size.h) < 0.005 && Math.abs(d - size.d) < 0.005, `${key}: ${w} ${h} ${d}`);
    assert.ok(Math.abs(accessor.min[1]) < 1e-3, `${key} stands on y = 0`);
    assert.ok(Math.abs(accessor.min[0] + accessor.max[0]) < 0.01 && Math.abs(accessor.min[2] + accessor.max[2]) < 0.01, `${key} is centred`);
  }
  assert.ok(Math.abs(topSurface(FILES.vegetableBed, 0.2, 0.4) - VEGETABLE_BED_SOIL) < 0.021, 'bed soil height');
});

test('club furniture measurements match the GLBs (seated figures sit on the cushion)', () => {
  const chair = glbMesh('lounge/club/banquetChair.glb').accessor;
  assert.ok(Math.abs(chair.max[0] - chair.min[0] - CLUB_MODELS.banquetChair.w) < 0.005);
  assert.ok(Math.abs(chair.max[2] - chair.min[2] - CLUB_MODELS.banquetChair.d) < 0.005);
  assert.ok(Math.abs(topSurface('lounge/club/banquetChair.glb', 0.4, 0.7) - CLUB_MODELS.banquetChair.seat) < 0.021, 'cushion top');
  const table = glbMesh('lounge/club/cardTable.glb').accessor;
  assert.ok(Math.abs(table.max[1] - CLUB_MODELS.cardTable.top) < 0.005);
  assert.ok(Math.abs(topSurface('lounge/club/cardTable.glb') - CLUB_MODELS.cardTable.top) < 0.03, 'table top');
  assert.ok(Math.abs(topSurface('lounge/club/barStool.glb', 0.5) - CLUB_MODELS.barStool.seat) < 0.021, 'stool seat');
});

test('the casino VIP corner and bar stools stand behind the walkable floor', () => {
  const floorBack = interiorToWorld({ x: 50, y: 42 }).z;
  assert.ok(VIP_CORNER.z1 < floorBack - 0.1);
  assert.ok(BAR_STOOL_Z < floorBack - 0.3);
});

test('greenhouse and museum footprints follow their models', () => {
  const g = karchiveFootprint('greenhouse', KARCHIVE_GREENHOUSE.scale);
  assert.equal(VILLAGE_GREENHOUSE.x, KARCHIVE_GREENHOUSE.x);
  assert.equal(VILLAGE_GREENHOUSE.z, KARCHIVE_GREENHOUSE.z);
  assert.ok(Math.abs(VILLAGE_GREENHOUSE.width - g.w) < 0.02 && Math.abs(VILLAGE_GREENHOUSE.depth - g.d) < 0.02);
  const m = karchiveFootprint('museumLibrary', KARCHIVE_MUSEUM.scale);
  assert.equal(VILLAGE_MUSEUM.x, KARCHIVE_MUSEUM.x);
  assert.equal(VILLAGE_MUSEUM.z, KARCHIVE_MUSEUM.z);
  assert.ok(Math.abs(VILLAGE_MUSEUM.width - m.w) < 0.02 && Math.abs(VILLAGE_MUSEUM.depth - m.d) < 0.02);
  // Neither building overlaps a route (the full box, not just its short side).
  for (const b of [VILLAGE_GREENHOUSE, VILLAGE_MUSEUM])
    for (const [x1, z1, x2, z2, width] of VILLAGE_PATHS)
      for (let t = 0; t <= 1; t += 0.02) {
        const x = x1 + (x2 - x1) * t,
          z = z1 + (z2 - z1) * t;
        const dx = Math.max(0, Math.abs(x - b.x) - b.width / 2),
          dz = Math.max(0, Math.abs(z - b.z) - b.depth / 2);
        assert.ok(Math.hypot(dx, dz) >= width / 2 - 0.01, `${b.id} on route ${[x1, z1, x2, z2].join(',')}`);
      }
});

test('the pergola is walkable underneath; only its posts and the stage block', () => {
  for (const c of KARCHIVE_COLLIDERS) assert.ok(VILLAGE_COLLIDERS.some((item) => item.id === c.id), c.id);
  const { x, z, scale, posts } = KARCHIVE_PERGOLA;
  assert.ok(villageCanWalk({ x, z }), 'under the pergola');
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) assert.ok(!villageCanWalk({ x: x + sx * posts.x * scale, z: z + sz * posts.z * scale }));
  assert.ok(villagePath(VILLAGE_START, { x, z }).length > 0, 'pergola reachable');
  // Posts fit inside the model's footprint.
  const f = karchiveFootprint('wisteriaPergola', scale);
  assert.ok(posts.x * scale + posts.r <= f.w / 2 && posts.z * scale + posts.r <= f.d / 2);
  assert.ok(!villageCanWalk({ x: KARCHIVE_STAGE.x, z: KARCHIVE_STAGE.z }));
  const s = karchiveFootprint('festivalStage', KARCHIVE_STAGE.scale);
  assert.ok(KARCHIVE_STAGE.radius <= Math.max(s.w, s.d) / 2 + 0.05);
});

/**
 * Walks a route the way the village does (villagePath waypoints, villageStep
 * at walking speed, 60 fps) and fails when the walker stops short: the
 * "snagging on props" friends reported.
 */
function walk(from, to) {
  const route = villagePath(from, to);
  if (!route.length) return { ok: false, why: 'no route' };
  let at = { ...from };
  const dt = 1 / 60,
    speed = 5.2;
  for (const goal of route) {
    let stalled = 0;
    for (let frame = 0; frame < 60 * 40; frame++) {
      const dx = goal.x - at.x,
        dz = goal.z - at.z,
        left = Math.hypot(dx, dz);
      if (left < 0.02) break;
      const step = Math.min(left, speed * dt);
      const next = villageStep(at, (dx / left) * step, (dz / left) * step);
      const moved = Math.hypot(next.x - at.x, next.z - at.z);
      stalled = moved < step * 0.25 ? stalled + 1 : 0;
      if (stalled > 12) return { ok: false, why: `stalled at ${at.x.toFixed(2)},${at.z.toFixed(2)} toward ${goal.x},${goal.z}` };
      at = next;
    }
  }
  return { ok: Math.hypot(at.x - to.x, at.z - to.z) < 0.3, why: `ended at ${at.x.toFixed(2)},${at.z.toFixed(2)}` };
}

test('walking to every entrance, district and kArchive spot never stalls', () => {
  /** @type {{ id: string; point: { x: number; z: number } }[]} */
  const targets = [
    ...VILLAGE_PLACES.map((p) => ({ id: p.id, point: p.entry })),
    ...VILLAGE_DISTRICTS.map((d) => ({ id: d.id, point: d.point })),
    ...FARM_BEDS.map((b) => ({ id: `farm-${b.actor}`, point: farmFront(b) })),
    { id: 'museum-front', point: MUSEUM_FRONT },
    { id: 'board-front', point: BOARD_FRONT },
    { id: 'greenhouse-door', point: { x: KARCHIVE_GREENHOUSE.x + 2.3, z: KARCHIVE_GREENHOUSE.z } },
    { id: 'stage-front', point: { x: KARCHIVE_STAGE.x, z: KARCHIVE_STAGE.z + KARCHIVE_STAGE.radius + 0.9 } },
    { id: 'pergola', point: { x: KARCHIVE_PERGOLA.x, z: KARCHIVE_PERGOLA.z } },
  ];
  for (const { id, point } of targets) {
    assert.ok(villageCanWalk(point), `${id} stands on walkable ground`);
    const result = walk(VILLAGE_START, point);
    assert.ok(result.ok, `${id}: ${result.why}`);
  }
  // Across the pergola (under its roof, between the posts) and back.
  const { x, z } = KARCHIVE_PERGOLA;
  const across = walk({ x: x - 3, z }, { x: x + 3, z });
  assert.ok(across.ok, `through the pergola: ${across.why}`);
});
