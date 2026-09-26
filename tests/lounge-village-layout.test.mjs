import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  VILLAGE_BOARDWALK,
  VILLAGE_COLLIDERS,
  VILLAGE_DECOR,
  VILLAGE_DISTRICTS,
  VILLAGE_DOOR_HEIGHT,
  VILLAGE_FURNISHINGS,
  VILLAGE_HOUSE_MODELS,
  VILLAGE_PATHS,
  VILLAGE_PLACES,
  VILLAGE_START,
  villageCanWalk,
  villageFromNetwork,
  villageHouseScale,
  villageLineClear,
  villagePath,
  villageToNetwork,
} from '../app/lounge-village-layout.ts';
import { VILLAGE_ACTOR_HEIGHT } from '../app/lounge-village-camera.ts';

const segmentDistance = (px, pz, [x1, z1, x2, z2]) => {
  const dx = x2 - x1,
    dz = z2 - z1,
    length = dx * dx + dz * dz;
  const t = length
    ? Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / length))
    : 0;
  return Math.hypot(px - (x1 + dx * t), pz - (z1 + dz * t));
};
const extent = (collider) =>
  collider.shape === 'circle' ? collider.r : Math.min(collider.w, collider.d) / 2;

test('no decoration or furnishing collider stands on a walking route', () => {
  for (const item of VILLAGE_COLLIDERS) {
    // Rails line the boardwalk; the terrace deck and farm plot are destinations.
    if (/^rail-|^terrace$|^farmland$/.test(item.id)) continue;
    for (const segment of VILLAGE_PATHS) {
      const gap =
        segmentDistance(item.x, item.z, segment) -
        segment[4] / 2 -
        extent(item.collider);
      assert.ok(
        gap >= -0.01,
        `${item.id} (${item.x}, ${item.z}) overlaps route ${segment.join(',')}`,
      );
    }
  }
});

test('every tree, lamp, bench, fence and rail blocks walking; flowers and hydrangeas are knee-high', () => {
  const kinds = new Set();
  for (const item of VILLAGE_DECOR) {
    if (!item.collider) {
      assert.ok(['flowers', 'hydrangea'].includes(item.kind), `${item.id} needs a collider`);
      continue;
    }
    kinds.add(item.kind);
    assert.equal(villageCanWalk(item), false, `${item.id} must block walking`);
  }
  for (const kind of ['tree', 'lamp', 'bench', 'fence', 'rail', 'mailbox', 'shrub'])
    assert.ok(kinds.has(kind), `${kind} colliders exist`);
  // The former road trees at (±23, 10) and the lamp inside the camp picnic table are gone.
  for (const x of [-23, 23]) assert.ok(villageCanWalk({ x, z: 10 }));
  const picnic = VILLAGE_FURNISHINGS.find((prop) => prop.id === 'campPicnic');
  for (const item of VILLAGE_DECOR.filter((decor) => decor.kind === 'lamp'))
    assert.ok(
      Math.abs(item.x - picnic.x) > picnic.width / 2 ||
        Math.abs(item.z - picnic.z) > picnic.depth / 2,
      `${item.id} is not inside the picnic table`,
    );
});

test('the boardwalk mouth is open and its rails are solid', () => {
  const mouth = { x: 27, z: VILLAGE_BOARDWALK.z },
    deck = { x: 33, z: VILLAGE_BOARDWALK.z };
  assert.ok(villageLineClear(mouth, deck), 'straight walk onto the deck');
  assert.deepEqual(villagePath(mouth, deck), [deck]);
  for (const z of VILLAGE_BOARDWALK.railZ)
    assert.equal(villageCanWalk({ x: 33, z }), false);
});

test('spawn and the server default land on the plaza, never the bridge end', () => {
  assert.ok(villageCanWalk(VILLAGE_START));
  const fromDefault = villageFromNetwork({ x: 50, y: 60 });
  assert.ok(Math.abs(fromDefault.x - VILLAGE_START.x) < 1e-9);
  assert.ok(Math.abs(fromDefault.z - VILLAGE_START.z) < 1e-9);
  const net = villageToNetwork(VILLAGE_START);
  assert.ok(Math.abs(net.x - 50) < 1e-9 && Math.abs(net.y - 60) < 1e-9);
  for (const point of [
    { x: -47, z: -37 },
    { x: 12.3, z: -4.2 },
    { x: 0, z: 18.26 },
    { x: 47, z: 37 },
  ]) {
    const back = villageFromNetwork(villageToNetwork(point));
    assert.ok(Math.abs(back.x - point.x) < 1e-9 && Math.abs(back.z - point.z) < 1e-9);
  }
});

test('all entrances and districts are reachable over clear segments', () => {
  const targets = [
    ...VILLAGE_PLACES.map((place) => ({ id: place.id, point: place.entry })),
    ...VILLAGE_DISTRICTS.map((district) => ({
      id: district.id,
      point: district.point,
    })),
  ];
  for (const { id, point } of targets) {
    const route = villagePath(VILLAGE_START, point);
    assert.ok(route.length > 0, `${id} reachable`);
    let previous = VILLAGE_START;
    for (const waypoint of route) {
      assert.ok(villageLineClear(previous, waypoint), `${id} route is clear`);
      previous = waypoint;
    }
    assert.deepEqual(route.at(-1), point);
  }
});

function glbBounds(file) {
  // Minimal GLB reader: POSITION accessor bounds through the node hierarchy.
  const bytes = fs.readFileSync(file);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  const multiply = (a, b) => {
    const out = Array.from({ length: 16 }, () => 0);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 4; k++) out[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k];
    return out;
  };
  const local = (node) => {
    if (node.matrix) return node.matrix;
    const [tx, ty, tz] = node.translation ?? [0, 0, 0],
      [x, y, z, w] = node.rotation ?? [0, 0, 0, 1],
      [sx, sy, sz] = node.scale ?? [1, 1, 1];
    return [
      (1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
      2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
      2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
      tx, ty, tz, 1,
    ];
  };
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  const visit = (index, parent) => {
    const node = json.nodes[index],
      matrix = multiply(parent, local(node));
    if (node.mesh !== undefined)
      for (const primitive of json.meshes[node.mesh].primitives) {
        const accessor = json.accessors[primitive.attributes.POSITION];
        const q = accessor.normalized
          ? ({ 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 })[accessor.componentType]
          : 1;
        for (const cx of [accessor.min[0] / q, accessor.max[0] / q])
          for (const cy of [accessor.min[1] / q, accessor.max[1] / q])
            for (const cz of [accessor.min[2] / q, accessor.max[2] / q])
              for (let r = 0; r < 3; r++) {
                const value = matrix[r] * cx + matrix[4 + r] * cy + matrix[8 + r] * cz + matrix[12 + r];
                min[r] = Math.min(min[r], value);
                max[r] = Math.max(max[r], value);
              }
      }
    for (const child of node.children ?? []) visit(child, matrix);
  };
  for (const root of json.scenes[json.scene ?? 0].nodes)
    visit(root, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  return { width: max[0] - min[0], height: max[1] - min[1], depth: max[2] - min[2] };
}

test('home colliders come from the real model bounds at door scale', () => {
  for (const [model, spec] of Object.entries(VILLAGE_HOUSE_MODELS)) {
    const bounds = glbBounds(new URL(`../public/models/village/${model}.glb`, import.meta.url));
    for (const axis of ['width', 'height', 'depth'])
      assert.ok(
        Math.abs(bounds[axis] - spec[axis]) < 0.01,
        `${model} ${axis}: ${bounds[axis]} vs ${spec[axis]}`,
      );
    assert.ok(Math.abs(villageHouseScale(model) * spec.door - VILLAGE_DOOR_HEIGHT) < 1e-9);
  }
  for (const place of VILLAGE_PLACES.filter((item) => item.kind === 'home')) {
    const spec = VILLAGE_HOUSE_MODELS[place.model],
      scale = villageHouseScale(place.model);
    assert.ok(Math.abs(place.width - (spec.width * scale + 0.1)) < 0.002);
    assert.ok(Math.abs(place.depth - (spec.depth * scale + 0.1)) < 0.002);
    assert.ok(Math.abs(place.entry.x - (place.x + spec.doorX * scale)) < 0.002);
  }
  // Neighbouring homes never overlap.
  const homes = VILLAGE_PLACES.filter((item) => item.kind === 'home');
  for (const a of homes)
    for (const b of homes)
      if (a !== b)
        assert.ok(
          Math.abs(a.x - b.x) >= (a.width + b.width) / 2 ||
            Math.abs(a.z - b.z) >= (a.depth + b.depth) / 2,
          `${a.id} and ${b.id} overlap`,
        );
  // The character stands a little shorter than a door (drawn figure ≈ 94% of its canvas).
  const up = Math.cos(Math.atan2(43, Math.hypot(34, 52)));
  const figure = (VILLAGE_ACTOR_HEIGHT / up) * 0.94;
  assert.ok(figure / VILLAGE_DOOR_HEIGHT > 0.8 && figure / VILLAGE_DOOR_HEIGHT < 1.1);
});
