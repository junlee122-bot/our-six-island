/** Pure 꾸미기 모드 operations on a v3 room (no DOM, no three.js). */
import {
  BEDROOM_LIMITS,
  DOOR_ZONE,
  ROOM,
  catalogEntry,
  itemFootprint,
  normalizeDegrees,
  roomConflicts,
  surfaceTop,
  wallSpan,
  type Bedroom,
  type RoomConflict,
  type RoomItem,
  type RoomWall,
} from './lounge-bedroom-data.ts';

const r3 = (n: number) => Math.round(n * 1000) / 1000;
export const newItemId = () =>
  'i' +
  Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) =>
    (b % 36).toString(36),
  ).join('');

/** Scale range offered in the editor (furniture keeps believable sizes). */
export function scaleRange(ref: string) {
  const entry = catalogEntry(ref);
  if (entry?.category === 'furniture') return { min: 0.7, max: 1.3 };
  if (entry?.mount === 'rug') return { min: BEDROOM_LIMITS.minScale, max: 1.6 };
  return { min: 0.6, max: 1.6 };
}

/** Keeps an item inside the room (its whole footprint, or its whole wall span). */
export function clampItem(item: RoomItem): RoomItem {
  const entry = catalogEntry(item.ref);
  if (!entry) return item;
  const range = scaleRange(item.ref);
  const scale = r3(Math.max(range.min, Math.min(range.max, item.scale)));
  const next: RoomItem = { ...item, scale, rotY: normalizeDegrees(item.rotY) };
  if (entry.mount === 'wall') {
    const wall: RoomWall = item.wall === 'left' ? 'left' : 'back';
    const half = (entry.w * scale) / 2,
      halfH = (entry.h * scale) / 2;
    const y = Math.max(0.9 + halfH, Math.min(ROOM.wallHeight - 0.1 - halfH, item.y ?? 2));
    next.wall = wall;
    next.y = r3(y);
    next.rotY = 0;
    if (wall === 'back') {
      next.x = r3(Math.max(ROOM.minX + half, Math.min(ROOM.maxX - half, item.x)));
      next.z = ROOM.minZ;
    } else {
      next.z = r3(Math.max(ROOM.minZ + half, Math.min(ROOM.maxZ - half, item.z)));
      next.x = ROOM.minX;
    }
    return next;
  }
  delete next.wall;
  const f = itemFootprint(next, entry)!;
  const hx = (f.x1 - f.x0) / 2,
    hz = (f.z1 - f.z0) / 2;
  next.x = r3(Math.max(ROOM.minX + hx, Math.min(ROOM.maxX - hx, item.x)));
  next.z = r3(Math.max(ROOM.minZ + hz, Math.min(ROOM.maxZ - hz, item.z)));
  return next;
}

/** The highest surface under (x, z) that small items can stand on. */
export function surfaceUnder(
  room: Pick<Bedroom, 'items'>,
  x: number,
  z: number,
  exclude?: string,
): { id: string; y: number } | null {
  let best: { id: string; y: number } | null = null;
  for (const item of room.items) {
    if (item.id === exclude) continue;
    const top = surfaceTop(item);
    if (top === null) continue;
    const f = itemFootprint(item)!;
    if (x < f.x0 + 0.05 || x > f.x1 - 0.05 || z < f.z0 + 0.05 || z > f.z1 - 0.05)
      continue;
    const y = (item.y ?? 0) + top;
    if (!best || y > best.y) best = { id: item.id, y: r3(y) };
  }
  return best;
}
/** Small items land on the surface below them (or the floor). */
export function settleItem(room: Pick<Bedroom, 'items'>, item: RoomItem): RoomItem {
  const entry = catalogEntry(item.ref);
  if (!entry || entry.mount === 'wall') return item;
  const next = { ...item };
  delete next.y;
  if (entry.mount === 'small') {
    const s = surfaceUnder(room, item.x, item.z, item.id);
    if (s) next.y = s.y;
  }
  return next;
}

export function withItem(room: Bedroom, item: RoomItem): Bedroom {
  const exists = room.items.some((i) => i.id === item.id);
  return {
    ...room,
    items: exists
      ? room.items.map((i) => (i.id === item.id ? item : i))
      : [...room.items, item],
  };
}
export const withoutItem = (room: Bedroom, id: string): Bedroom => ({
  ...room,
  items: room.items.filter((i) => i.id !== id),
});

/** Conflicts that involve one item (for the selection outline and message). */
export function itemConflicts(room: Pick<Bedroom, 'items'>, id: string): RoomConflict[] {
  return roomConflicts(room).filter((c) => c.id === id);
}
export const CONFLICT_TEXT: Record<RoomConflict['reason'], string> = {
  overlap: '다른 가구와 겹쳐 있어요.',
  door: '문 앞은 비워 두세요.',
  window: '창문을 가리고 있어요.',
  outside: '방 밖으로 나갔어요.',
};

/** Moves a floor/rug/small item to (x, z), clamped and settled on surfaces. */
export function moveFloorItem(room: Bedroom, item: RoomItem, x: number, z: number) {
  return settleItem(room, clampItem({ ...item, x: r3(x), z: r3(z) }));
}
/** Moves a wall item: `along` runs along the chosen wall, `y` is height. */
export function moveWallItem(item: RoomItem, wall: RoomWall, along: number, y: number) {
  return clampItem({
    ...item,
    wall,
    x: wall === 'back' ? along : ROOM.minX,
    z: wall === 'left' ? along : ROOM.minZ,
    y,
  });
}
export function rotateItem(room: Bedroom, item: RoomItem, degrees: number) {
  const entry = catalogEntry(item.ref);
  if (!entry || entry.mount === 'wall') return item;
  return settleItem(room, clampItem({ ...item, rotY: normalizeDegrees(item.rotY + degrees) }));
}
export function scaleItem(room: Bedroom, item: RoomItem, scale: number) {
  return settleItem(room, clampItem({ ...item, scale }));
}

const blocking = (room: Pick<Bedroom, 'items'>, candidate: RoomItem) =>
  roomConflicts({
    items: [...room.items.filter((i) => i.id !== candidate.id), candidate],
  }).some((c) => c.id === candidate.id);
/**
 * A new catalog item near `near` (normally just in front of the player):
 * the first conflict-free spot on a spiral, on the wall closest to them for
 * wall items. Falls back to `near` itself when the room is full.
 */
export function placeNew(
  room: Bedroom,
  ref: string,
  near: { x: number; z: number },
  id = newItemId(),
): RoomItem | null {
  const entry = catalogEntry(ref);
  if (!entry) return null;
  const base: RoomItem = { id, kind: entry.kind, ref, x: near.x, z: near.z, rotY: 0, scale: 1 };
  if (entry.mount === 'wall') {
    const toLeft = near.x - ROOM.minX,
      toBack = near.z - ROOM.minZ;
    const walls: RoomWall[] = toLeft < toBack ? ['left', 'back'] : ['back', 'left'];
    for (const wall of walls) {
      // Every spot along the wall, nearest to me first.
      const [lo, hi] = wall === 'back' ? [ROOM.minX, ROOM.maxX] : [ROOM.minZ, ROOM.maxZ],
        target = wall === 'back' ? near.x : near.z;
      const spots = Array.from({ length: Math.round((hi - lo) / 0.25) + 1 }, (_, i) => lo + i * 0.25).sort(
        (a, b) => Math.abs(a - target) - Math.abs(b - target),
      );
      for (const y of [2.3, 1.7, 2.9])
        for (const along of spots) {
          const candidate = moveWallItem(base, wall, along, y);
          if (!blocking(room, candidate)) return candidate;
        }
    }
    return moveWallItem(base, walls[0], walls[0] === 'back' ? near.x : near.z, 2.3);
  }
  // Rugs may lie anywhere; they never block.
  if (entry.mount === 'rug') return moveFloorItem(room, base, near.x, near.z);
  for (let ring = 0; ring < 14; ring++) {
    const steps = Math.max(1, ring * 6);
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * Math.PI * 2;
      const candidate = moveFloorItem(
        room,
        base,
        near.x + Math.cos(a) * ring * 0.3,
        near.z + Math.sin(a) * ring * 0.3,
      );
      if (!blocking(room, candidate) && !doorBlocked(candidate)) return candidate;
    }
  }
  return moveFloorItem(room, base, near.x, near.z);
}
const doorBlocked = (item: RoomItem) => {
  const f = itemFootprint(item);
  return (
    !!f &&
    f.x0 < DOOR_ZONE.x1 &&
    f.x1 > DOOR_ZONE.x0 &&
    f.z0 < DOOR_ZONE.z1 &&
    f.z1 > DOOR_ZONE.z0
  );
};
/** A copy of an item placed beside it. */
export function duplicateItem(room: Bedroom, item: RoomItem): RoomItem | null {
  const entry = catalogEntry(item.ref);
  if (!entry) return null;
  if (entry.mount === 'wall') {
    const span = wallSpan(item)!;
    return placeNew(room, item.ref, item.wall === 'left' ? { x: ROOM.minX + 0.5, z: span.a1 + 0.3 } : { x: span.a1 + 0.3, z: ROOM.minZ + 0.5 });
  }
  const copy = placeNew(room, item.ref, { x: item.x + 0.4, z: item.z + 0.4 });
  return copy ? settleItem(room, clampItem({ ...copy, rotY: item.rotY, scale: item.scale })) : null;
}
