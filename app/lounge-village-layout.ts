export type VillageDestination = 'lounge' | 'casino' | 'wardrobe' | 'bedroom';
export type VillagePoint = { x: number; z: number };
export type VillagePlace = {
  id: string;
  name: string;
  subtitle: string;
  kind: 'home' | 'hall' | 'casino' | 'wardrobe';
  actor?: number;
  x: number;
  z: number;
  width: number;
  depth: number;
  color: string;
  roofColor: string;
  entry: VillagePoint;
  destination: VillageDestination;
};

export const VILLAGE_BOUNDS = { width: 50, depth: 38, radius: 0.35 } as const;
export const VILLAGE_START: VillagePoint = { x: 0, z: 10 };

const homeNames = ['도원', '강재', '민서', '승준', '민재', '재민', '호현'];
const homePositions: readonly VillagePoint[] = [
  { x: -14, z: -14 },
  { x: -7, z: -14 },
  { x: 0, z: -14 },
  { x: 7, z: -14 },
  { x: 14, z: -14 },
  { x: -20, z: -6 },
  { x: 20, z: -6 },
];
const homeColors = [
  '#f2c789',
  '#e9b9a7',
  '#b7d4b1',
  '#e7d58e',
  '#a9c8da',
  '#d0b0dc',
  '#dfaa9c',
];
const roofColors = [
  '#9d5946',
  '#557a74',
  '#927047',
  '#526c8b',
  '#9a604e',
  '#75608c',
  '#a56851',
];

const makePlace = (place: Omit<VillagePlace, 'entry'>): VillagePlace => ({
  ...place,
  // All entrances face the plaza (+z) and include a small step beyond the wall.
  entry: { x: place.x, z: place.z + place.depth / 2 + 1 },
});

export const VILLAGE_PLACES: readonly VillagePlace[] = [
  ...homePositions.map((point, actor) =>
    makePlace({
      id: `home-${actor}`,
      name: `${homeNames[actor]}의 집`,
      subtitle: '주민의 집',
      kind: 'home',
      actor,
      ...point,
      width: 4.8,
      depth: 4.8,
      color: homeColors[actor],
      roofColor: roofColors[actor],
      destination: 'bedroom',
    }),
  ),
  makePlace({
    id: 'hall',
    name: '범마을 회관',
    subtitle: '체스 · 고스톱 · 섯다',
    kind: 'hall',
    x: -16,
    z: 5,
    width: 8,
    depth: 6,
    color: '#f1dfb7',
    roofColor: '#ab6c4f',
    destination: 'lounge',
  }),
  makePlace({
    id: 'casino',
    name: '별빛 카지노',
    subtitle: '홀덤 · 블랙잭 · AI 딜러',
    kind: 'casino',
    x: 16,
    z: 5,
    width: 8,
    depth: 6,
    color: '#d3dfb9',
    roofColor: '#57776e',
    destination: 'casino',
  }),
  makePlace({
    id: 'wardrobe',
    name: '분장실',
    subtitle: '옷 컬렉션 · 나만의 코디',
    kind: 'wardrobe',
    x: 0,
    z: -6,
    width: 8,
    depth: 5,
    color: '#ead1dd',
    roofColor: '#86647d',
    destination: 'wardrobe',
  }),
];

export const VILLAGE_TERRACE = {
  id: 'terrace',
  x: -8,
  z: 8,
  width: 5,
  depth: 3,
} as const;
export const VILLAGE_ORCHARD: readonly VillagePoint[] = [
  { x: -22, z: -13 },
  { x: -10, z: -17.7 },
  { x: 10, z: -17.7 },
  { x: 22, z: -13 },
  { x: 8, z: 12 },
];
export const VILLAGE_FARMLAND = {
  id: 'farmland',
  x: 8.75,
  z: 6.5,
  width: 5,
  depth: 3,
} as const;
export const VILLAGE_FARMLAND_ENTRY: VillagePoint = { x: 8.75, z: 4.45 };

const FOUNTAIN = { x: 0, z: 0, radius: 2 } as const;
const RIVER = { minZ: 14, maxZ: 16, bridgeHalfWidth: 2.5 } as const;

export function villageCanWalk(point: VillagePoint): boolean {
  const { width, depth, radius } = VILLAGE_BOUNDS;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return false;
  if (
    Math.abs(point.x) > width / 2 - radius ||
    Math.abs(point.z) > depth / 2 - radius
  )
    return false;

  const blockedByPlace = VILLAGE_PLACES.some(
    (place) =>
      Math.abs(point.x - place.x) < place.width / 2 + radius &&
      Math.abs(point.z - place.z) < place.depth / 2 + radius,
  );
  const blockedByFarm =
    Math.abs(point.x - VILLAGE_FARMLAND.x) <
      VILLAGE_FARMLAND.width / 2 + radius &&
    Math.abs(point.z - VILLAGE_FARMLAND.z) <
      VILLAGE_FARMLAND.depth / 2 + radius;
  if (
    blockedByPlace ||
    blockedByFarm ||
    (Math.abs(point.x - VILLAGE_TERRACE.x) <
      VILLAGE_TERRACE.width / 2 + radius &&
      Math.abs(point.z - VILLAGE_TERRACE.z) <
        VILLAGE_TERRACE.depth / 2 + radius)
  )
    return false;

  if (
    VILLAGE_ORCHARD.some(
      (tree) => Math.hypot(point.x - tree.x, point.z - tree.z) < 0.9,
    )
  )
    return false;

  const dx = point.x - FOUNTAIN.x;
  const dz = point.z - FOUNTAIN.z;
  if (dx * dx + dz * dz < (FOUNTAIN.radius + radius) ** 2) return false;

  const touchesRiver =
    point.z + radius > RIVER.minZ && point.z - radius < RIVER.maxZ;
  if (touchesRiver && Math.abs(point.x) + radius > RIVER.bridgeHalfWidth)
    return false;
  return true;
}

export function villageLineClear(
  from: VillagePoint,
  to: VillagePoint,
): boolean {
  if (!villageCanWalk(from) || !villageCanWalk(to)) return false;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.18),
  );
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (
      !villageCanWalk({
        x: from.x + (to.x - from.x) * t,
        z: from.z + (to.z - from.z) * t,
      })
    )
      return false;
  }
  return true;
}

export function villageStep(
  from: VillagePoint,
  dx: number,
  dz: number,
): VillagePoint {
  if (!villageCanWalk(from) || !Number.isFinite(dx) || !Number.isFinite(dz))
    return from;
  const distance = Math.hypot(dx, dz);
  if (distance > 20) return from;
  const count = Math.max(1, Math.ceil(distance / 0.08));
  let point = { ...from };
  for (let i = 0; i < count; i++) {
    const next = { x: point.x + dx / count, z: point.z + dz / count };
    if (villageCanWalk(next)) point = next;
    else {
      const slideX = { x: next.x, z: point.z };
      if (villageCanWalk(slideX)) point = slideX;
      const slideZ = { x: point.x, z: next.z };
      if (villageCanWalk(slideZ)) point = slideZ;
    }
  }
  return point;
}

const GRID = 0.5;
const COLS = Math.round(VILLAGE_BOUNDS.width / GRID) + 1;
const ROWS = Math.round(VILLAGE_BOUNDS.depth / GRID) + 1;
const gridPoint = (id: number): VillagePoint => ({
  x: -VILLAGE_BOUNDS.width / 2 + (id % COLS) * GRID,
  z: -VILLAGE_BOUNDS.depth / 2 + Math.floor(id / COLS) * GRID,
});
const GRID_POINTS: readonly VillagePoint[] = Array.from(
  { length: COLS * ROWS },
  (_, id) => gridPoint(id),
);
const GRID_WALKABLE = Uint8Array.from(GRID_POINTS, (point) =>
  Number(villageCanWalk(point)),
);

function nearestWalkableId(
  point: VillagePoint,
  visibleFrom?: VillagePoint,
): number | null {
  let nearest = -1;
  let best = Number.POSITIVE_INFINITY;
  for (let id = 0; id < COLS * ROWS; id++) {
    if (!GRID_WALKABLE[id]) continue;
    const candidate = GRID_POINTS[id];
    if (!candidate) continue;
    const distance =
      (candidate.x - point.x) ** 2 + (candidate.z - point.z) ** 2;
    if (distance >= best) continue;
    if (visibleFrom && !villageLineClear(visibleFrom, candidate)) continue;
    if (distance < best) {
      best = distance;
      nearest = id;
    }
  }
  return nearest < 0 ? null : nearest;
}

/** Returns smoothed reachable waypoints; blocked clicks resolve to the nearest walkable ground. */
export function villagePath(
  from: VillagePoint,
  to: VillagePoint,
): VillagePoint[] {
  if (
    !Number.isFinite(from.x) ||
    !Number.isFinite(from.z) ||
    !Number.isFinite(to.x) ||
    !Number.isFinite(to.z)
  )
    return [];
  if (villageCanWalk(to) && villageLineClear(from, to))
    return [{ x: to.x, z: to.z }];
  const startId = nearestWalkableId(from, from);
  const targetId = nearestWalkableId(to);
  if (startId === null || targetId === null) return [];

  const total = COLS * ROWS;
  const parent = new Int32Array(total).fill(-2);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  parent[startId] = -1;
  queue[tail++] = startId;
  const offsets = [
    -COLS - 1,
    -COLS,
    -COLS + 1,
    -1,
    1,
    COLS - 1,
    COLS,
    COLS + 1,
  ];
  while (head < tail && parent[targetId] === -2) {
    const current = queue[head++];
    const x = current % COLS;
    for (const offset of offsets) {
      const next = current + offset;
      if (next < 0 || next >= total || parent[next] !== -2) continue;
      const nextX = next % COLS;
      if (Math.abs(nextX - x) > 1 || !GRID_WALKABLE[next]) continue;
      if (
        nextX !== x &&
        Math.abs(offset) !== COLS &&
        (!GRID_WALKABLE[current + (nextX > x ? 1 : -1)] ||
          !GRID_WALKABLE[current + (offset > 0 ? COLS : -COLS)])
      )
        continue;
      parent[next] = current;
      queue[tail++] = next;
      if (next === targetId) break;
    }
  }
  if (parent[targetId] === -2) return [];

  const reverse: VillagePoint[] = [];
  for (let id = targetId; id !== -1; id = parent[id]) {
    const point = GRID_POINTS[id];
    if (point) reverse.push(point);
  }
  reverse.reverse();
  const path: VillagePoint[] = [];
  let anchor = from;
  let index = -1;
  while (index < reverse.length - 1) {
    let nextIndex = -1;
    for (let i = reverse.length - 1; i > index; i--) {
      if (villageLineClear(anchor, reverse[i])) {
        nextIndex = i;
        break;
      }
    }
    if (nextIndex < 0) return [];
    anchor = reverse[nextIndex];
    path.push({ x: anchor.x, z: anchor.z });
    index = nextIndex;
  }
  const snappedTarget = reverse[reverse.length - 1];
  if (villageLineClear(anchor, to)) {
    if (
      path.length > 0 &&
      path[path.length - 1].x === snappedTarget.x &&
      path[path.length - 1].z === snappedTarget.z
    )
      path.pop();
    path.push(to);
  }
  return path;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function villageToNetwork(point: VillagePoint): {
  x: number;
  y: number;
} {
  const { width, depth } = VILLAGE_BOUNDS;
  const x = Number.isFinite(point.x) ? point.x : 0;
  const z = Number.isFinite(point.z) ? point.z : 0;
  return {
    x: 15 + ((clamp(x, -width / 2, width / 2) + width / 2) / width) * 70,
    y: 42 + ((clamp(z, -depth / 2, depth / 2) + depth / 2) / depth) * 46,
  };
}

export function villageFromNetwork(point: {
  x: number;
  y: number;
}): VillagePoint {
  const { width, depth } = VILLAGE_BOUNDS;
  const x = Number.isFinite(point.x) ? point.x : 50;
  const y = Number.isFinite(point.y) ? point.y : 65;
  return {
    x: clamp(((x - 15) / 70) * width - width / 2, -width / 2, width / 2),
    z: clamp(((y - 42) / 46) * depth - depth / 2, -depth / 2, depth / 2),
  };
}
