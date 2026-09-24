// The seven friends' starting rooms (pure; shared with the Edge function).
// Tall furniture stands against the back and left walls (the camera looks in
// from the open front-right corner), beds sit headboard-to-wall, desks sit
// under the window, rugs are centred and the door strip stays clear.
import { ROOM, catalogEntry } from './lounge-bedroom-catalog.ts';
import type { RoomItem, RoomWall } from './lounge-bedroom-data.ts';

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const GAP = 0.03;
function make(
  id: string,
  ref: string,
  x: number,
  z: number,
  rotY = 0,
  scale = 1,
  y?: number,
): RoomItem {
  const entry = catalogEntry(ref);
  if (!entry) throw new Error('unknown ref ' + ref);
  return {
    id,
    kind: entry.kind,
    ref,
    x: r3(x),
    z: r3(z),
    rotY,
    scale,
    ...(y !== undefined && y > 0 ? { y: r3(y) } : {}),
  };
}
/** Against the back wall, facing the room. */
const back = (id: string, ref: string, x: number, scale = 1) =>
  make(id, ref, x, ROOM.minZ + (catalogEntry(ref)!.d * scale) / 2 + GAP, 0, scale);
/** Against the left wall, facing the room (+x). */
const left = (id: string, ref: string, z: number, scale = 1) =>
  make(id, ref, ROOM.minX + (catalogEntry(ref)!.d * scale) / 2 + GAP, z, 90, scale);
/** Standing on another item's top surface. */
const on = (
  id: string,
  ref: string,
  host: RoomItem,
  dx: number,
  dz: number,
  rotY = 0,
  scale = 1,
) =>
  make(id, ref, host.x + dx, host.z + dz, rotY, scale, catalogEntry(host.ref)!.top! * host.scale);
/** Hung on a wall: `along` is x on the back wall, z on the left wall. */
const hang = (
  id: string,
  ref: string,
  wall: RoomWall,
  along: number,
  y: number,
  scale = 1,
): RoomItem => ({
  ...make(id, ref, wall === 'back' ? along : ROOM.minX, wall === 'back' ? ROOM.minZ : along, 0, scale),
  wall,
  y,
});

/** Bed headboard-to-wall on the right, a nightstand beside it, a desk under the window. */
function base() {
  const bed = back('bed', 'bed', 3.22);
  const nightstand = back('nightstand', 'nightstand', 1.66);
  const desk = back('desk', 'desk', -2.1);
  const chair = make('chair', 'chair', -2.1, desk.z + 0.485 + 0.43, 180);
  return { bed, nightstand, desk, chair };
}
/** A sofa against the left wall facing a coffee table on a rug. */
function lounge(z: number, rug: string) {
  const sofa = left('sofa', 'sofa', z);
  // Leave a full character width between sofa, table and the desk chair.
  const table = make('table', 'coffee-table', -2.8, z, 90);
  return {
    sofa,
    table,
    rug: make('rug', rug, -2.85, z, rug === 'wool-rug' ? 90 : 0),
  };
}

function dowon(): RoomItem[] {
  // 미쿠 스튜디오: a fan's collection room with a real display cabinet.
  const { bed, nightstand, desk, chair } = base();
  const shelf = left('figures', 'miku-figure-shelf', -3.0);
  const low = left('low-shelf', 'low-bookcase', -1.15);
  const table = make('tea-table', 'tea-table', 0.35, 0.75);
  return [
    make('rug', 'miku-rug', 0.3, 0.65, 0, 1.15),
    bed,
    nightstand,
    desk,
    chair,
    shelf,
    low,
    table,
    on('lamp', 'table-lamp', nightstand, 0, 0.02),
    on('cushion', 'miku-cushion', bed, 0.05, -0.2, 20),
    on('headphones', 'miku-headphones', desk, -0.62, -0.05),
    on('acrylic', 'miku-acrylic', desk, 0.02, 0.12),
    on('sticks', 'miku-light-sticks', desk, 0.6, -0.05),
    on('figure', 'twin-tail-figure', low, 0.02, -0.38, 90),
    on('speaker', 'speaker', low, 0.02, 0.32, 90),
    make('cushions', 'cushions', -1.3, 1.95),
    make('leek', 'miku-leek', -0.3, 2.62, 330),
    make('sticks-2', 'miku-light-sticks', 1.9, 1.9, 20),
    make('plant', 'plant', 4.35, 0.3),
    hang('poster', 'miku-poster', 'back', 3.22, 2.5),
    hang('records', 'miku-records', 'back', 0.25, 2.2),
    hang('lights', 'star-lights', 'back', 0.55, 3.3),
    hang('banner', 'miku-banner', 'left', -1.15, 2.5),
    hang('poster-2', 'miku-poster', 'left', 0.95, 2.2, 0.8),
  ];
}

function gangjae(): RoomItem[] {
  // 우드 리스닝룸: a record console between speakers, a sofa corner.
  const { bed, nightstand, desk, chair } = base();
  const console_ = back('console', 'low-bookcase', 0.2, 0.85);
  const corner = lounge(-0.7, 'wool-rug');
  return [
    corner.rug,
    bed,
    nightstand,
    desk,
    chair,
    console_,
    corner.sofa,
    corner.table,
    on('lamp', 'table-lamp', nightstand, 0, 0.02),
    on('player', 'record-player', console_, 0, 0.02),
    make('speaker-l', 'speaker', -0.72, -3.85, 0, 0.8),
    make('speaker-r', 'speaker', 1.08, -3.85, 0, 0.8),
    on('books', 'books', desk, -0.55, 0),
    on('tea', 'tea-set', corner.table, 0, 0.05, 90),
    make('floor-lamp', 'floor-lamp', -4.55, 0.75),
    make('armchair', 'armchair', 1.8, 1.4),
    make('plant', 'plant', 4.35, 0.5),
    hang('poster', 'music-poster', 'back', 0.2, 2.45),
    hang('clock', 'wall-clock', 'left', -0.7, 2.4),
    hang('photos', 'photo-string', 'back', 3.22, 2.6),
  ];
}

function minseo(): RoomItem[] {
  // 초록 온실방: plant shelves and flowers everywhere, a round rug.
  const { bed, nightstand, desk, chair } = base();
  const table = make('tea-table', 'tea-table', 0.4, 0.8);
  return [
    make('rug', 'round-rug', 0.4, 0.7),
    bed,
    nightstand,
    desk,
    chair,
    back('plants', 'plant-stand', 0.25),
    left('plants-2', 'plant-stand', -1.3),
    left('plants-3', 'plant-stand', -2.7),
    table,
    on('flowers', 'flowers', nightstand, 0, 0.02),
    on('tulips', 'tulips', desk, 0.5, 0),
    on('books', 'books', desk, -0.55, 0),
    on('bunny', 'bunny-plush', bed, 0.45, -0.6),
    make('plant', 'plant', -4.4, 0.6),
    make('plant-2', 'plant', 4.35, 0.4),
    make('tulips-2', 'tulips', 2.6, 2.6),
    make('armchair', 'armchair', -1.6, 1.1),
    hang('photos', 'photo-string', 'back', 3.22, 2.6),
    hang('clock', 'wall-clock', 'left', -2.0, 2.6),
  ];
}

function seungjun(): RoomItem[] {
  // 오후의 서재: tall bookcases, a reading chair with a lamp and tea.
  const { bed, nightstand, desk, chair } = base();
  const table = make('tea-table', 'tea-table', -2.6, 0.6);
  return [
    make('rug', 'wool-rug', 0.5, 0.9),
    bed,
    nightstand,
    desk,
    chair,
    left('books-1', 'bookcase', -3.0),
    left('books-2', 'bookcase', -1.7),
    back('books-3', 'bookcase', 0.25),
    table,
    make('armchair', 'armchair', -3.8, 0.55),
    make('floor-lamp', 'floor-lamp', -4.55, -0.45),
    on('lamp', 'table-lamp', nightstand, 0, 0.02),
    on('books', 'books', desk, -0.55, 0),
    on('camera', 'instant-camera', desk, 0.55, 0.05),
    on('cat', 'cat-plush', bed, 0.45, -0.6),
    make('books-floor', 'books', 1.4, 1.5),
    make('plant', 'plant', 4.35, 0.4),
    hang('clock', 'wall-clock', 'back', 0.25, 3.2),
    hang('poster', 'music-poster', 'left', 0.6, 2.3),
    hang('photos', 'photo-string', 'back', 3.22, 2.6),
  ];
}

function minjae(): RoomItem[] {
  // 밤빛 레코드룸: dusk walls, a record console, star lights and a sofa.
  const { bed, nightstand, desk, chair } = base();
  const console_ = back('console', 'low-bookcase', 0.2, 0.85);
  const corner = lounge(-0.7, 'round-rug');
  return [
    corner.rug,
    bed,
    nightstand,
    desk,
    chair,
    console_,
    corner.sofa,
    corner.table,
    on('lamp', 'table-lamp', nightstand, 0, 0.02),
    on('player', 'record-player', console_, 0, 0.02),
    make('speaker-l', 'speaker', -0.72, -3.85, 0, 0.8),
    make('speaker-r', 'speaker', 1.08, -3.85, 0, 0.8),
    on('heart', 'heart-cushion', bed, 0.45, -0.55),
    on('tea', 'tea-set', corner.table, 0, 0.05, 90),
    on('books', 'books', desk, 0.55, 0),
    make('floor-lamp', 'floor-lamp', -4.55, 0.75),
    make('heart-2', 'heart-cushion', 1.9, 1.6),
    make('plant', 'plant', 4.35, 0.45),
    hang('lights', 'star-lights', 'back', 0.55, 3.3),
    hang('poster', 'music-poster', 'back', 0.2, 2.3),
    hang('poster-2', 'music-poster', 'back', 3.22, 2.55, 1.1),
    hang('lights-2', 'star-lights', 'left', -0.7, 2.75, 0.8),
  ];
}

function jaemin(): RoomItem[] {
  // 여행자의 아지트: photos from trips, a clothes rack and a big mirror.
  const { bed, nightstand, desk, chair } = base();
  const low = back('low-shelf', 'low-bookcase', 0.3, 0.85);
  return [
    make('rug', 'wool-rug', 0.5, 0.9),
    bed,
    nightstand,
    desk,
    chair,
    low,
    make('rack', 'clothes-rack', -4.2, -3.0),
    make('mirror', 'mirror', -4.55, -1.6),
    left('wardrobe', 'wardrobe', -0.2),
    on('camera', 'instant-camera', nightstand, 0, 0.02),
    on('headband', 'headband-display', low, -0.3, 0),
    on('books', 'books', low, 0.33, 0),
    on('books-2', 'books', desk, -0.55, 0),
    on('flowers', 'flowers', desk, 0.55, 0),
    make('plant', 'plant', 4.35, 0.45),
    make('armchair', 'armchair', 2.9, 0.85),
    make('camera-2', 'instant-camera', 1.2, 1.7, 0, 1.2),
    hang('photos', 'photo-string', 'back', 3.22, 2.6),
    hang('photos-2', 'photo-string', 'back', 0.3, 2.5, 0.85),
    hang('photos-3', 'photo-string', 'left', 1.2, 2.3, 0.9),
  ];
}

function hohyeon(): RoomItem[] {
  // 플레이 아틀리에: a game corner with a sofa, cushions and a collection shelf.
  const { bed, nightstand, desk, chair } = base();
  const low = back('low-shelf', 'low-bookcase', 0.3, 0.85);
  const corner = lounge(-0.75, 'wool-rug');
  return [
    corner.rug,
    bed,
    nightstand,
    desk,
    chair,
    low,
    corner.sofa,
    corner.table,
    on('lamp', 'table-lamp', nightstand, 0, 0.02),
    on('figure', 'twin-tail-figure', low, -0.3, 0),
    on('headband', 'headband-display', low, 0.25, 0),
    on('speaker', 'speaker', desk, 0.55, 0),
    on('books', 'books', desk, -0.55, 0),
    on('cat', 'cat-plush', bed, 0.45, -0.6),
    make('cushions', 'cushions', -1.2, 1.3),
    on('tea', 'tea-set', corner.table, 0, 0.05, 90),
    make('floor-lamp', 'floor-lamp', 1.9, 0.9),
    make('plant', 'plant', 4.35, 0.45),
    hang('lights', 'star-lights', 'back', 0.55, 3.25),
    hang('poster', 'music-poster', 'back', 3.22, 2.55),
    hang('clock', 'wall-clock', 'left', -0.75, 2.5),
  ];
}

const LAYOUTS = [dowon, gangjae, minseo, seungjun, minjae, jaemin, hohyeon];
export function defaultRoomItems(actor: number): RoomItem[] {
  return (LAYOUTS[actor] ?? LAYOUTS[0])();
}
