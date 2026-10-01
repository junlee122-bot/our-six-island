/**
 * Room save format v4 (새 방, 2026-10-02), shared by the browser and the
 * hohyeon-api Edge function (via lounge-accounts.ts / lounge-look.ts). No
 * asset, DOM, or storage imports.
 *
 * One room system: items are placed in walk-room world units and edited in 3D.
 * Older saves (v1–v3) are NOT migrated: the friends chose a full reset
 * (handover/design/design-rooms-v2.md), so they read as the new default room —
 * an empty room with one bed. The old themed layouts live on as 범마을
 * 부동산's model houses (legacyThemeRoom).
 */
import { BEDROOM_THEMES, bedroomTheme } from './lounge-bedroom-themes.ts';
import {
  ROOM,
  catalogEntry,
  type CatalogEntry,
  type RoomItemKind,
} from './lounge-bedroom-catalog.ts';
import { legacyRoomItems } from './lounge-bedroom-layouts.ts';
import { LEGACY_ROOM, ROOM_TIERS, roomShape, type RoomShape } from './lounge-bedroom-catalog.ts';
export {
  ROOM,
  ROOM_DOOR_POINT,
  ROOM_TIERS,
  ROOM_FIXTURES,
  LEGACY_ROOM,
  MOUNT_NAME,
  roomShape,
  roomDoorPoint,
  ROOM_CATALOG,
  CATALOG_BY_REF,
  catalogEntry,
} from './lounge-bedroom-catalog.ts';
export type {
  RoomFixture,
  RoomShape,
  CatalogEntry,
  RoomCategory,
  RoomItemKind,
  RoomMount,
} from './lounge-bedroom-catalog.ts';

export const BEDROOM_VERSION = 4;
/** v4 rooms hang things on the back wall only ('left' is the old rooms' wall, model houses). */
export type RoomWall = 'back' | 'left';
export type RoomItem = {
  id: string;
  kind: RoomItemKind;
  /** Catalog reference (lounge-bedroom-catalog.ts). */
  ref: string;
  /** Footprint centre on the floor (world units). */
  x: number;
  z: number;
  /** Degrees, 0 ≤ rotY < 360. 0 = the item's front faces the room's front (+z). */
  rotY: number;
  scale: number;
  /** Wall items only: which wall they hang on. */
  wall?: RoomWall;
  /** Wall items: centre height. Small items: height of the surface they stand on. */
  y?: number;
};
export const WALL_COLORS = [
  'cream',
  'sage',
  'blush',
  'blue',
  'mint',
  'dusk',
  // Premium walls (집 확장 tiers, lounge-items HOUSE_TIERS).
  'gold',
  'navy',
  'rose',
  'forest',
  'silver',
  'terracotta',
  'velvet',
] as const;
export const FLOOR_KINDS = [
  'oak',
  'walnut',
  'pale',
  'ash',
  'marble',
  'herringbone',
  'cherry',
  'ebony',
] as const;
/** Every room starts with these (the rest are bought at 범마을 부동산). */
export const FREE_WALL = 'cream';
export const FREE_FLOOR = 'oak';
/**
 * Room styles that need an unlock: a house tier ('house-N', 집 확장) or a
 * model-house style bought at 범마을 부동산 ('style-<name>', 모델하우스 관람).
 */
export const STYLE_UNLOCK: Readonly<Record<string, string>> = {
  sage: 'style-sage',
  blush: 'style-blush',
  blue: 'style-blue',
  mint: 'style-mint',
  dusk: 'style-dusk',
  walnut: 'style-walnut',
  pale: 'style-pale',
  ash: 'style-ash',
  gold: 'house-1',
  navy: 'house-1',
  rose: 'house-1',
  forest: 'house-1',
  marble: 'house-2',
  herringbone: 'house-2',
  cherry: 'house-2',
  silver: 'house-3',
  terracotta: 'house-3',
  velvet: 'house-4',
  ebony: 'house-4',
};
/**
 * Premium wall/floor styles the saver has not unlocked (a style the stored
 * room already had stays allowed, like rare items).
 */
export function lockedRoomStyle(
  room: Pick<Bedroom, 'wall' | 'floor'>,
  unlocks: readonly string[],
  previous?: Pick<Bedroom, 'wall' | 'floor'> | null,
): string[] {
  const out: string[] = [];
  for (const [style, before] of [
    [room.wall, previous?.wall],
    [room.floor, previous?.floor],
  ] as const) {
    const need = Object.hasOwn(STYLE_UNLOCK, style) ? STYLE_UNLOCK[style] : null;
    if (need && !unlocks.includes(need) && style !== before) out.push(style);
  }
  return out;
}
export type RoomAccess = 'public' | 'friends' | 'closed';
export const ROOM_ACCESS: readonly RoomAccess[] = ['public', 'friends', 'closed'];
export type BedroomThemeId = (typeof BEDROOM_THEMES)[number]['id'];
export type Bedroom = {
  version: 4;
  theme: BedroomThemeId;
  wall: (typeof WALL_COLORS)[number];
  floor: (typeof FLOOR_KINDS)[number];
  /** Who may walk in (default 'friends' = all seven friends). */
  access?: RoomAccess;
  items: RoomItem[];
};
export const BEDROOM_LIMITS = {
  maxItems: 80,
  minScale: 0.5,
  maxScale: 2,
  maxIdLength: 32,
  /** Highest surface or wall centre an item may sit at. */
  maxY: ROOM.wallHeight,
} as const;
const ITEM_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,31}$/;

/** The one bed every room keeps (free, apart from the furniture counts). */
export const DEFAULT_BED: RoomItem = {
  id: 'bed',
  kind: 'model',
  ref: 'bed',
  x: 4.2,
  z: -2.46,
  rotY: 0,
  scale: 1,
};
/** Every friend's starting room: the same empty room with one bed. */
export function defaultBedroom(actor = 0): Bedroom {
  return {
    version: 4,
    theme: bedroomTheme(actor).id,
    wall: FREE_WALL,
    floor: FREE_FLOOR,
    access: 'friends',
    items: [{ ...DEFAULT_BED }],
  };
}
/**
 * A friend's old themed room (the v3 starting layout) as 범마을 부동산 shows it
 * in 모델하우스 관람: its theme wall and floor and every piece, in LEGACY_ROOM
 * coordinates. Art on the old left wall moves to a free spot on the back wall
 * (the straight-on camera sees the side walls edge-on) or is left out.
 */
export function legacyThemeRoom(actor = 0): Bedroom {
  const theme = bedroomTheme(actor);
  const items = legacyRoomItems(actor).map((item) => ({ ...item }));
  const back = items.filter((i) => i.wall === 'back');
  const out: RoomItem[] = [];
  for (const item of items) {
    if (item.wall !== 'left') {
      out.push(item);
      continue;
    }
    const entry = catalogEntry(item.ref);
    if (!entry) continue;
    const half = (entry.w * item.scale) / 2,
      h = (entry.h * item.scale) / 2,
      y = item.y ?? 2.3;
    const win = LEGACY_ROOM.window;
    for (let along = LEGACY_ROOM.minX + half + 0.2; along <= LEGACY_ROOM.maxX - half - 0.2; along += 0.2) {
      const free = [...back].every((b) => {
        const s = wallSpan(b)!;
        return along + half < s.a0 - 0.1 || along - half > s.a1 + 0.1 || y + h < s.y0 - 0.1 || y - h > s.y1 + 0.1;
      });
      const clearWindow = along + half < win.x0 - 0.05 || along - half > win.x1 + 0.05 || y - h > win.y1;
      if (free && clearWindow) {
        const moved: RoomItem = { ...item, wall: 'back', x: Math.round(along * 1000) / 1000, z: LEGACY_ROOM.minZ, y };
        back.push(moved);
        out.push(moved);
        break;
      }
    }
  }
  return { version: 4, theme: theme.id, wall: theme.wall, floor: theme.floor, access: 'public', items: out };
}

/**
 * The room the editor, walking and conflicts use right now (the owner's
 * tier, or a model house). Pure callers pass a shape; the default is this.
 */
let active: RoomShape = roomShape(0);
export const setActiveRoomShape = (shape: RoomShape) => {
  active = shape;
};
export const activeRoomShape = () => active;
/** The room shape of a 집 확장 tier count (0–4). */
export const roomOfHouse = (house: number | undefined) => roomShape(house ?? 0);
/**
 * What a room may hold: shop unlocks, house tiers, bought model-house styles,
 * one entry per owned furniture copy, and the one free bed every room keeps.
 * Shared by the room editor and the server's save check (lounge-accounts).
 */
export function roomUnlocks(input: {
  unlocks?: readonly string[];
  house?: number;
  styles?: readonly string[];
  furniture?: Readonly<Record<string, number>>;
}): string[] {
  const out = [...(input.unlocks ?? [])];
  for (let i = 1; i <= Math.min(ROOM_TIERS.length - 1, input.house ?? 0); i++) out.push(`house-${i}`);
  for (const style of input.styles ?? []) if (Object.hasOwn(STYLE_UNLOCK, style)) out.push(STYLE_UNLOCK[style]);
  for (const [ref, n] of Object.entries(input.furniture ?? {}))
    if (Number.isSafeInteger(n) && n > 0) for (let i = 0; i < Math.min(n, 40); i++) out.push(ref);
  out.push(DEFAULT_BED.ref);
  return out;
}

// ------------------------------------------------------------- geometry
const round = (n: number, digits = 3) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};
export const normalizeDegrees = (deg: number) => {
  const d = ((deg % 360) + 360) % 360;
  return round(d >= 359.95 ? 0 : d, 1);
};
export type Footprint = { x0: number; x1: number; z0: number; z1: number };
/** Axis-aligned floor footprint of a floor/rug/small item (rotation aware). */
export function itemFootprint(item: RoomItem, entry = catalogEntry(item.ref)) {
  if (!entry) return null;
  const w = entry.w * item.scale,
    d = entry.d * item.scale,
    r = (item.rotY * Math.PI) / 180,
    c = Math.abs(Math.cos(r)),
    s = Math.abs(Math.sin(r));
  const hx = (c * w + s * d) / 2,
    hz = (s * w + c * d) / 2;
  return { x0: item.x - hx, x1: item.x + hx, z0: item.z - hz, z1: item.z + hz };
}
/** Span of a wall item on its wall: `a` runs along the wall, `y` is height. */
export function wallSpan(item: RoomItem, entry = catalogEntry(item.ref)) {
  if (!entry || entry.mount !== 'wall') return null;
  const along = item.wall === 'left' ? item.z : item.x,
    y = item.y ?? 2,
    w = (entry.w * item.scale) / 2,
    h = (entry.h * item.scale) / 2;
  return { wall: item.wall ?? 'back', a0: along - w, a1: along + w, y0: y - h, y1: y + h };
}
/** Surface height of an item that small items may stand on (null if none). */
export function surfaceTop(item: RoomItem, entry = catalogEntry(item.ref)) {
  return entry?.top ? entry.top * item.scale : null;
}
const overlaps = (a: Footprint, b: Footprint, margin = 0.02) =>
  a.x0 < b.x1 - margin &&
  b.x0 < a.x1 - margin &&
  a.z0 < b.z1 - margin &&
  b.z0 < a.z1 - margin;
/** True for items that stand on the floor and block walking. */
export function blocksFloor(item: RoomItem, entry = catalogEntry(item.ref)) {
  if (!entry) return false;
  if (entry.mount === 'floor') return true;
  return entry.mount === 'small' && (item.y ?? 0) < 0.05;
}
/** The strip inside the door that must stay walkable. */
export const doorZone = (shape: RoomShape = active): Footprint => ({
  x0: shape.door.x0 - 0.2,
  x1: shape.door.x1 + 0.2,
  z0: shape.maxZ - 1.15,
  z1: shape.maxZ,
});
/** A built-in fixture's floor box. */
export const fixtureBox = (f: { x0: number; x1: number; z0: number; z1: number }): Footprint => ({ x0: f.x0, x1: f.x1, z0: f.z0, z1: f.z1 });
export type RoomConflict = { id: string; reason: 'overlap' | 'door' | 'window' | 'outside'; with?: string };
/**
 * Placement problems shown in 꾸미기 모드 (overlapping furniture, blocked door,
 * art over the window, things through a wall). Rugs never conflict, and small
 * items standing on a surface are not floor obstacles.
 */
export function roomConflicts(room: Pick<Bedroom, 'items'>, shape: RoomShape = active): RoomConflict[] {
  const out: RoomConflict[] = [];
  const ROOM = shape,
    DOOR_ZONE = doorZone(shape);
  const floor: { item: RoomItem; box: Footprint }[] = [];
  const walls: { item: RoomItem; span: NonNullable<ReturnType<typeof wallSpan>> }[] = [];
  for (const item of room.items) {
    const entry = catalogEntry(item.ref);
    if (!entry) continue;
    if (entry.mount === 'wall') {
      const span = wallSpan(item, entry)!;
      const length = span.wall === 'left' ? ROOM.maxZ - ROOM.minZ : ROOM.maxX - ROOM.minX,
        start = span.wall === 'left' ? ROOM.minZ : ROOM.minX;
      if (span.a0 < start - 0.01 || span.a1 > start + length + 0.01 || span.y0 < 0.05 || span.y1 > ROOM.wallHeight + 0.01)
        out.push({ id: item.id, reason: 'outside' });
      if (
        span.wall === 'back' &&
        span.a0 < ROOM.window.x1 - 0.02 &&
        span.a1 > ROOM.window.x0 + 0.02 &&
        span.y0 < ROOM.window.y1 - 0.02 &&
        span.y1 > ROOM.window.y0 + 0.02
      )
        out.push({ id: item.id, reason: 'window' });
      if (span.wall === 'left' && shape.tier >= 0) out.push({ id: item.id, reason: 'outside' });
      // Nothing hangs behind the kitchen counter or the closet.
      if (span.wall === 'back')
        for (const f of shape.fixtures)
          if (span.a0 < f.x1 - 0.02 && span.a1 > f.x0 + 0.02 && span.y0 < f.h + 0.05) out.push({ id: item.id, reason: 'overlap', with: f.id });
      walls.push({ item, span });
      continue;
    }
    const box = itemFootprint(item, entry)!;
    if (
      box.x0 < ROOM.minX - 0.01 ||
      box.x1 > ROOM.maxX + 0.01 ||
      box.z0 < ROOM.minZ - 0.01 ||
      box.z1 > ROOM.maxZ + 0.01
    )
      out.push({ id: item.id, reason: 'outside' });
    if (!blocksFloor(item, entry)) continue;
    if (overlaps(box, DOOR_ZONE)) out.push({ id: item.id, reason: 'door' });
    for (const f of shape.fixtures)
      if (overlaps(box, fixtureBox(f))) out.push({ id: item.id, reason: 'overlap', with: f.id });
    floor.push({ item, box });
  }
  for (let i = 0; i < floor.length; i++)
    for (let j = i + 1; j < floor.length; j++)
      if (overlaps(floor[i].box, floor[j].box)) {
        out.push({ id: floor[i].item.id, reason: 'overlap', with: floor[j].item.id });
        out.push({ id: floor[j].item.id, reason: 'overlap', with: floor[i].item.id });
      }
  for (let i = 0; i < walls.length; i++)
    for (let j = i + 1; j < walls.length; j++) {
      const a = walls[i].span,
        b = walls[j].span;
      if (a.wall === b.wall && a.a0 < b.a1 - 0.02 && b.a0 < a.a1 - 0.02 && a.y0 < b.y1 - 0.02 && b.y0 < a.y1 - 0.02) {
        out.push({ id: walls[i].item.id, reason: 'overlap', with: walls[j].item.id });
        out.push({ id: walls[j].item.id, reason: 'overlap', with: walls[i].item.id });
      }
    }
  return out;
}

// ------------------------------------------------------------- validation
/** A v3 room that is present but malformed (the server rejects the save). */
export class BedroomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BedroomError';
  }
}
export const BEDROOM_INVALID =
  '방 꾸미기 정보를 확인할 수 없어요. 새로고침한 뒤 다시 저장해 주세요.';
export const ROOM_ITEM_LOCKED =
  '아직 상점에서 사지 않은 소품이 방에 있어요. 새로고침한 뒤 다시 꾸며 주세요.';
/**
 * Shop-locked items (catalog entries with `unlock`) the owner does not own.
 * Premium furniture (`premium`) is counted: `unlocks` lists one entry per
 * owned copy (lounge-accounts lifeUnlocksOf), and the room may hold at most
 * that many. Items already in `previous` (the stored room) are grandfathered
 * per ref and count, so a room saved before ownership was enforced still
 * saves; only new copies of a locked item are reported. Returns the offending refs.
 */
export function lockedRoomItems(
  room: Bedroom,
  unlocks: readonly string[],
  previous?: Bedroom | null,
): string[] {
  const before = new Map<string, number>(),
    owned = new Map<string, number>();
  for (const item of previous?.items ?? [])
    before.set(item.ref, (before.get(item.ref) ?? 0) + 1);
  for (const id of unlocks) owned.set(id, (owned.get(id) ?? 0) + 1);
  const locked: string[] = [];
  for (const item of room.items) {
    const entry = catalogEntry(item.ref),
      unlock = entry?.unlock;
    if (!unlock) continue;
    const have = owned.get(unlock) ?? 0;
    if (entry.premium ? have > 0 : have > 0 || unlocks.includes(unlock)) {
      if (entry.premium) owned.set(unlock, have - 1);
      continue;
    }
    const left = before.get(item.ref) ?? 0;
    if (left > 0) before.set(item.ref, left - 1);
    else locked.push(item.ref);
  }
  return locked;
}
function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
const finite = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);
const inRange = (v: unknown, min: number, max: number): v is number =>
  finite(v) && v >= min && v <= max;
/**
 * Validates one v3 item. Returns the normalized item, or a reason string.
 * `clamp` (lenient client reads) pulls slightly-out-of-range numbers back in;
 * strict server reads reject them instead.
 */
function readItem(value: unknown, clamp: boolean): RoomItem | string {
  const item = record(value);
  if (!item) return 'item';
  if (typeof item.id !== 'string' || !ITEM_ID.test(item.id)) return 'id';
  if (typeof item.ref !== 'string') return 'ref';
  const entry = catalogEntry(item.ref);
  if (!entry) return 'ref';
  if (item.kind !== entry.kind) return 'kind';
  const num = (v: unknown, min: number, max: number, name: string) => {
    if (inRange(v, min, max)) return v;
    if (clamp && finite(v)) return Math.max(min, Math.min(max, v));
    throw name;
  };
  try {
    const x = num(item.x, ROOM.minX, ROOM.maxX, 'x'),
      z = num(item.z, ROOM.minZ, ROOM.maxZ, 'z'),
      scale = num(item.scale, BEDROOM_LIMITS.minScale, BEDROOM_LIMITS.maxScale, 'scale');
    if (!finite(item.rotY) || Math.abs(item.rotY) > 3600) throw 'rotY';
    const out: RoomItem = {
      id: item.id,
      kind: entry.kind,
      ref: entry.ref,
      x: round(x),
      z: round(z),
      rotY: normalizeDegrees(item.rotY),
      scale: round(scale),
    };
    if (entry.mount === 'wall') {
      if (item.wall !== 'back') throw 'wall';
      out.wall = item.wall;
      out.y = round(num(item.y ?? 2, 0, BEDROOM_LIMITS.maxY, 'y'));
      // A wall item hugs its wall: snap the cross-wall coordinate.
      out.z = ROOM.minZ;
    } else {
      if (item.wall !== undefined) throw 'wall';
      if (item.y !== undefined) {
        const y = round(num(item.y, 0, BEDROOM_LIMITS.maxY, 'y'));
        if (entry.mount === 'small' && y > 0) out.y = y;
        else if (entry.mount !== 'small' && y !== 0) throw 'y';
      }
    }
    return out;
  } catch (reason) {
    return typeof reason === 'string' ? reason : 'item';
  }
}
function readRoom(value: unknown, actor: number, strict: boolean): Bedroom {
  const fallback = defaultBedroom(actor),
    source = record(value);
  // The reset: anything that is not a v3 room becomes the new default room.
  if (!source || source.version !== BEDROOM_VERSION) {
    if (strict && source && source.version !== undefined && finite(source.version) && source.version > BEDROOM_VERSION)
      throw new BedroomError('newer');
    return fallback;
  }
  const bad = (reason: string) => {
    throw new BedroomError(reason);
  };
  const pick = <T extends string>(v: unknown, list: readonly T[], def: T, name: string): T =>
    list.includes(v as T) ? (v as T) : strict ? bad(name) : def;
  const theme = pick(source.theme, BEDROOM_THEMES.map((t) => t.id), fallback.theme, 'theme');
  const wall = pick(source.wall, WALL_COLORS, fallback.wall, 'wall');
  const floor = pick(source.floor, FLOOR_KINDS, fallback.floor, 'floor');
  const access =
    source.access === undefined
      ? 'friends'
      : pick(source.access, ROOM_ACCESS, 'friends', 'access');
  if (!Array.isArray(source.items)) {
    if (strict) bad('items');
    return { ...fallback, theme, wall, floor, access };
  }
  if (strict && source.items.length > BEDROOM_LIMITS.maxItems) bad('too many items');
  const ids = new Set<string>();
  const items: RoomItem[] = [];
  // Bound the work as well as the output for direct callers outside the HTTP limit.
  for (const candidate of source.items.slice(0, BEDROOM_LIMITS.maxItems * 2)) {
    if (items.length === BEDROOM_LIMITS.maxItems) break;
    const item = readItem(candidate, !strict);
    if (typeof item === 'string' || ids.has(item.id)) {
      if (strict) bad(typeof item === 'string' ? item : 'duplicate id');
      continue;
    }
    ids.add(item.id);
    items.push(item);
  }
  return { version: 4, theme, wall, floor, access, items };
}
/**
 * Lenient reader (browser, friend visits): older (v3 and before) or unreadable rooms become the
 * actor's default v3 room; malformed v3 items are dropped or clamped.
 */
export function readBedroom(value: unknown, actor = 0): Bedroom {
  return readRoom(value, actor, false);
}
/**
 * Fail-closed reader for the server save path: a v3 room with any malformed
 * field or item throws BedroomError. Older rooms still reset to the default.
 */
export function readBedroomStrict(value: unknown, actor = 0): Bedroom {
  return readRoom(value, actor, true);
}
export const isBedroomCurrent = (value: unknown) =>
  record(value)?.version === BEDROOM_VERSION;
/** @deprecated name kept for older imports; true for the current (v4) format. */
export const isBedroomV3 = isBedroomCurrent;

// ------------------------------------------------------------- helpers
export const roomHasMiku = (room: Pick<Bedroom, 'items'>) =>
  room.items.some((item) => catalogEntry(item.ref)?.category === 'miku');
/** Network coordinates (0..100) of a walk-room point, used for presence. */
export const roomToNetwork = (p: { x: number; z: number }) => ({
  x: round(((p.x - ROOM.minX) / (ROOM.maxX - ROOM.minX)) * 100, 2),
  y: round(((p.z - ROOM.minZ) / (ROOM.maxZ - ROOM.minZ)) * 100, 2),
});
export const roomFromNetwork = (p: { x: number; y: number }) => ({
  x: ROOM.minX + (Math.max(0, Math.min(100, p.x)) / 100) * (ROOM.maxX - ROOM.minX),
  z: ROOM.minZ + (Math.max(0, Math.min(100, p.y)) / 100) * (ROOM.maxZ - ROOM.minZ),
});
export type { CatalogEntry as RoomCatalogEntry };
