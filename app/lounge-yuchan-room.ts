/** Yuchan's room-bound starter set. These are placement allowances, never
 * inventory grants: they cannot be sold, shipped, gifted or stolen. */
import { catalogEntry } from './lounge-bedroom-catalog.ts';
import { YUCHAN_ACTOR } from './lounge-yuchan.ts';
import type { Bedroom, RoomItem } from './lounge-bedroom-data.ts';

export const YUCHAN_ROOM_TITLE = '느긋한 베이스캠프';
const ROOM_SET_PERMISSION = 'room-yuchan-v1';
const item = (id: string, ref: string, x: number, z: number, rotY = 0, y?: number): RoomItem => ({
  id, ref, kind: catalogEntry(ref)!.kind, x, z, rotY, scale: 1,
  ...(y === undefined ? {} : { y }),
});
/** Fits the smallest room; the doorway, fixtures and a full walking route stay clear. */
export const YUCHAN_ROOM_ITEMS: readonly RoomItem[] = [
  item('bed', 'bed', 4.2, -2.46),
  item('yc-desk', 'desk', 0.3, -3.4),
  item('yc-chair', 'chair', 0.3, -2.25, 180),
  item('yc-notes', 'books', 0.3, -3.4, 0, 1.03),
  item('yc-lamp', 'table-lamp', -0.3, -3.4, 0, 1.03),
  item('yc-sofa', 'sofa', -5.1, 0, 90),
  item('yc-rug', 'wool-rug', -3.8, 0, 90),
  item('yc-table', 'coffee-table', -2.8, 0, 90),
  item('yc-tea', 'tea-set', -2.8, 0, 90, 0.65),
  item('yc-rack', 'clothes-rack', 2.15, -3.6),
  item('yc-plant', 'plant', 5.2, 1.3),
  item('yc-floor-lamp', 'floor-lamp', -5, 2),
  { ...item('yc-photos', 'photo-string', 3.25, -4, 0, 2.85), wall: 'back' },
];

export function yuchanBedroom(): Bedroom {
  return { version: 4, theme: 'basecamp', wall: 'cream', floor: 'oak', access: 'friends',
    items: YUCHAN_ROOM_ITEMS.map((i) => ({ ...i })) };
}
/** One per set ref; bed is already granted by the shared room system. */
export function yuchanRoomUnlocks(actor: number): string[] {
  return actor === YUCHAN_ACTOR ? YUCHAN_ROOM_ITEMS.filter((i) => i.ref !== 'bed').map((i) => i.ref) : [];
}
/** Idempotent merge keeps paid copies in addition to the room-bound copy. */
export function withYuchanRoomUnlocks(unlocks: readonly string[], actor: number): string[] {
  return actor !== YUCHAN_ACTOR || unlocks.includes(ROOM_SET_PERMISSION) ? [...unlocks] :
    [...unlocks, ROOM_SET_PERMISSION, ...yuchanRoomUnlocks(actor)];
}
export function yuchanRoomFurniture(actor: number): Readonly<Record<string, number>> {
  return actor === YUCHAN_ACTOR ? Object.fromEntries(YUCHAN_ROOM_ITEMS.map((i) => [i.ref, 1])) : {};
}
/** Explicit starter installation only: a decorated/moved room is never replaced.
 * Empty saved rooms are eligible only after the owner chooses to apply. */
export function canApplyYuchanRoom(room: Bedroom, actor: number): boolean {
  if (actor !== YUCHAN_ACTOR) return false;
  if (room.items.length === 0) return true;
  if (room.items.length !== 1) return false;
  const bed = room.items[0], starter = YUCHAN_ROOM_ITEMS[0];
  return bed.id === 'bed' && bed.ref === 'bed' && bed.kind === 'model' &&
    bed.x === starter.x && bed.z === starter.z && bed.rotY === 0 && bed.scale === 1 &&
    bed.wall === undefined && (bed.y === undefined || bed.y === 0);
}
export function applyYuchanRoom(room: Bedroom, actor: number): Bedroom | null {
  if (!canApplyYuchanRoom(room, actor)) return null;
  // Keep paid styles, privacy and the existing bed's exact normalized data.
  const set = yuchanBedroom();
  return { ...room, theme: set.theme, items: set.items.map((i) => i.id === 'bed' && room.items[0] ? { ...room.items[0] } : i) };
}

/** The normal legacy allowance may grandfather old furniture; new free copies
 * must not accumulate by repeatedly saving a previous starter placement. */
export function yuchanRoomCopiesAllowed(room: Bedroom, actor: number, unlocks: readonly string[], previous?: Bedroom | null): boolean {
  if (actor !== YUCHAN_ACTOR) return true;
  for (const ref of new Set(YUCHAN_ROOM_ITEMS.map((i) => i.ref))) {
    const count = room.items.filter((i) => i.ref === ref).length;
    const allowed = Math.max(unlocks.filter((u) => u === ref).length, previous?.items.filter((i) => i.ref === ref).length ?? 0);
    if (count > allowed) return false;
  }
  return true;
}

export type YuchanRoomSpotId = 'photo' | 'rest' | 'tomato-note';
export type YuchanRoomSpot = {
  id: YuchanRoomSpotId; item: string; ref: string; title: string; hint: string; x: number; z: number;
};
const SPOTS: readonly Omit<YuchanRoomSpot, 'x' | 'z'>[] = [
  { id: 'photo', item: 'yc-photos', ref: 'photo-string', title: '가벼운 하루의 사진', hint: '게임 속 하루를 붙여 둔 사진을 구경해요.' },
  { id: 'rest', item: 'yc-tea', ref: 'tea-set', title: '잠깐 쉬는 자리', hint: '차 자리에서 짧게 쉬어 가요. 음식은 소비하지 않아요.' },
  { id: 'tomato-note', item: 'yc-notes', ref: 'books', title: '토마토 관찰 메모', hint: '게임 속 토마토를 기다리는 메모를 펼쳐 봐요.' },
];
/** Features belong to the real owner and actual placed anchors, not their old
 * coordinates or the visitor's own room. Moving/removing a prop is respected. */
export function yuchanRoomSpots(room: Pick<Bedroom, 'items'>, owner: number): YuchanRoomSpot[] {
  if (owner !== YUCHAN_ACTOR) return [];
  return SPOTS.flatMap((spot) => {
    const anchor = room.items.find((i) => i.id === spot.item && i.ref === spot.ref) ?? room.items.find((i) => i.ref === spot.ref);
    return anchor ? [{ ...spot, item: anchor.id, x: anchor.x, z: anchor.z }] : [];
  });
}
export const YUCHAN_ROOM_REACH = 2;
/** A local, reward-free inspection. Foreign rooms and distant/missing props
 * cannot open it; the server still owns all profile and guestbook writes. */
export function yuchanRoomSpotAt(room: Pick<Bedroom, 'items'>, owner: number, point: { x: number; z: number }): YuchanRoomSpot | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return null;
  return yuchanRoomSpots(room, owner)
    .map((spot) => ({ spot, distance: Math.hypot(point.x - spot.x, point.z - spot.z) }))
    .filter((v) => v.distance <= YUCHAN_ROOM_REACH)
    .sort((a, b) => a.distance - b.distance)[0]?.spot ?? null;
}
