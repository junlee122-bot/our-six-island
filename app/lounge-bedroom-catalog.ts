// Pure catalog of everything that can be placed in a room (shared by the
// browser and the hohyeon-api Edge function: no asset, DOM or three.js imports).
// Sizes are in walk-room world units at scale 1. The character is ~1.8 tall
// (chibi proportions), so furniture is drawn about 1.2× real size.

/**
 * 새 방 (rooms v2, 2026-10-02): every friend's room has the same shape, seen
 * straight on by the 구역 공통 규격 camera (lounge-village-camera.ts): the back
 * wall at the top of the screen, the door in the front wall at the bottom,
 * a built-in kitchen counter and closet against the back wall. The room grows
 * to the right and toward the front with the 집 확장 tier (범마을 부동산):
 * the back-left corner stays put, so furniture never moves when it grows.
 */
export type RoomFixture = {
  id: 'kitchen' | 'closet';
  name: string;
  /** Floor footprint (world units); both stand against the back wall. */
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** Height (wall items may hang above it). */
  h: number;
  /** The room action it offers (요리·만들기 / 옷 갈아입기). */
  action: 'cook' | 'dress';
};
export type RoomShape = {
  /** 집 확장 tier 0–4 (-1: an old themed room shown in the model house). */
  tier: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  wallHeight: number;
  /** Window on the back wall (x range, y range). Wall items must not cover it. */
  window: { x0: number; x1: number; y0: number; y1: number };
  /** Entry door in the front wall (x range). Its floor strip stays clear. */
  door: { x0: number; x1: number; height: number };
  fixtures: readonly RoomFixture[];
};
/** Floor size per 집 확장 tier (width × depth), from the back-left corner. */
export const ROOM_TIERS: readonly { w: number; d: number }[] = [
  { w: 12, d: 8 },
  { w: 13, d: 8.5 },
  { w: 14, d: 9 },
  { w: 16, d: 9.5 },
  { w: 18, d: 10 },
];
const ORIGIN = { x: -6, z: -4 } as const;
export const ROOM_FIXTURES: readonly RoomFixture[] = [
  { id: 'kitchen', name: '부엌 조리대', x0: ORIGIN.x + 0.15, x1: ORIGIN.x + 2.45, z0: ORIGIN.z, z1: ORIGIN.z + 0.9, h: 1.05, action: 'cook' },
  { id: 'closet', name: '붙박이 옷장', x0: ORIGIN.x + 2.65, x1: ORIGIN.x + 4.15, z0: ORIGIN.z, z1: ORIGIN.z + 0.75, h: 2.5, action: 'dress' },
];
const clampTier = (tier: number) => (Number.isSafeInteger(tier) ? Math.max(0, Math.min(ROOM_TIERS.length - 1, tier)) : 0);
/** The room of a 집 확장 tier (0 = no expansion yet). */
export function roomShape(tier = 0): RoomShape {
  const t = clampTier(tier),
    size = ROOM_TIERS[t];
  return {
    tier: t,
    minX: ORIGIN.x,
    maxX: ORIGIN.x + size.w,
    minZ: ORIGIN.z,
    maxZ: ORIGIN.z + size.d,
    wallHeight: 3.8,
    window: { x0: ORIGIN.x + 5.1, x1: ORIGIN.x + 8.1, y0: 1.54, y1: 3.44 },
    door: { x0: ORIGIN.x + 1.6, x1: ORIGIN.x + 2.8, height: 2.63 },
    fixtures: ROOM_FIXTURES,
  };
}
/**
 * The largest room (tier 4): what the server accepts. The editor keeps items
 * inside the owner's current tier (roomConflicts 'outside').
 */
export const ROOM = roomShape(ROOM_TIERS.length - 1);
/** Where you stand after walking in through the door. */
export const roomDoorPoint = (shape: RoomShape) => ({ x: (shape.door.x0 + shape.door.x1) / 2, z: shape.maxZ - 0.55 });
export const ROOM_DOOR_POINT = roomDoorPoint(roomShape(0));
/**
 * The old themed rooms (room format v3, one per friend) are kept as model
 * houses at 범마을 부동산 (lounge-bedroom-layouts.ts): the old 10 × 8.2 floor,
 * with its window, and a front door added so it reads like the new rooms.
 */
export const LEGACY_ROOM: RoomShape = {
  tier: -1,
  minX: -5,
  maxX: 5,
  minZ: -4.1,
  maxZ: 4.1,
  wallHeight: 3.8,
  window: { x0: -3.58, x1: -0.62, y0: 1.54, y1: 3.44 },
  door: { x0: -4.7, x1: -3.5, height: 2.63 },
  fixtures: [],
};

export type RoomCategory =
  | 'furniture'
  | 'soft'
  | 'music'
  | 'plant'
  | 'small'
  | 'wall'
  | 'miku'
  | 'rare';
export type RoomItemKind = 'model' | 'prop';
/**
 * floor: stands on the floor and blocks walking.
 * rug: lies flat, walkable, never overlaps anything.
 * small: stands on the floor OR on a surface (desk, shelf, bed…) via `y`.
 * wall: hangs on the back or left wall; `y` is its centre height.
 */
export type RoomMount = 'floor' | 'rug' | 'small' | 'wall';
export type CatalogEntry = {
  ref: string;
  kind: RoomItemKind;
  name: string;
  category: RoomCategory;
  mount: RoomMount;
  /** Width (x), depth (z) and height at scale 1 (wall items: w × h on the wall). */
  w: number;
  d: number;
  h: number;
  /** Height of a top surface small items can stand on. */
  top?: number;
  /** Shop unlock needed before it can be placed (every piece but the trophies: its own ref). */
  unlock?: string;
  /**
   * Premium furniture bought in the rotating 가구 상점 (or crafted): the room
   * may hold at most as many copies as the owner owns (`unlock` = its ref).
   */
  premium?: boolean;
};

const e = (
  ref: string,
  kind: RoomItemKind,
  name: string,
  category: RoomCategory,
  mount: RoomMount,
  w: number,
  d: number,
  h: number,
  extra: Partial<Pick<CatalogEntry, 'top' | 'unlock' | 'premium'>> = {},
): CatalogEntry => ({
  ref,
  kind,
  name,
  category,
  mount,
  w,
  d,
  h,
  // 새 방 (2026-10-02): every piece is bought at 나무결 가구점 and counted
  // per owned copy, except the rare trophies (범타듀 상점 unlocks).
  ...(extra.unlock ? {} : { unlock: ref, premium: true }),
  ...extra,
});
/** How a piece is placed (나무결 가구점 shows it next to the size). */
export const MOUNT_NAME: Record<RoomMount, string> = {
  floor: '바닥에 놓는 가구',
  rug: '바닥에 까는 깔개',
  small: '바닥이나 탁자 위 소품',
  wall: '뒷벽에 거는 장식',
};

export const ROOM_CATALOG: readonly CatalogEntry[] = [
  // 3D furniture (3DAssets.dev CC0 and kArchive models).
  e('bed', 'model', '포근한 침대', 'furniture', 'floor', 2.36, 3.02, 1.52, { top: 0.74 }),
  e('desk', 'model', '나무 책상', 'furniture', 'floor', 1.93, 0.97, 1.03, { top: 1.03 }),
  e('chair', 'model', '책상 의자', 'furniture', 'floor', 0.79, 0.82, 1.34),
  e('bookcase', 'model', '5단 책장', 'furniture', 'floor', 1.27, 0.48, 2.8),
  e('low-bookcase', 'model', '낮은 책장', 'furniture', 'floor', 1.44, 0.64, 1.56, { top: 1.56 }),
  e('wardrobe', 'model', '옷장', 'furniture', 'floor', 1.68, 0.86, 2.8),
  e('nightstand', 'model', '협탁', 'furniture', 'floor', 0.62, 0.59, 0.73, { top: 0.73 }),
  e('coffee-table', 'model', '커피 테이블', 'furniture', 'floor', 1.66, 0.83, 0.65, { top: 0.65 }),
  e('tea-table', 'model', '찻상 테이블', 'furniture', 'floor', 0.96, 0.96, 0.62, { top: 0.62 }),
  e('sofa', 'model', '벤치 소파', 'furniture', 'floor', 2.34, 1.14, 1.14),
  e('wool-rug', 'model', '울 러그', 'soft', 'rug', 3.18, 2.46, 0.05),
  e('table-lamp', 'model', '돔 스탠드', 'small', 'small', 0.44, 0.44, 0.62),
  e('cushions', 'model', '쿠션 세트', 'soft', 'small', 1.08, 0.66, 0.6),
  e('plant-stand', 'model', '화분 선반', 'plant', 'floor', 1.18, 0.48, 1.44),
  e('tulips', 'model', '튤립 화분', 'plant', 'small', 0.89, 0.46, 1.01),
  // Painted props (Higgsfield art) shown as upright cards.
  e('vanity', 'prop', '화장대', 'furniture', 'floor', 1.32, 0.6, 1.8),
  e('clothes-rack', 'prop', '옷걸이 행거', 'furniture', 'floor', 1.5, 0.6, 1.92),
  e('armchair', 'prop', '1인 소파', 'furniture', 'floor', 1.14, 0.9, 1.2),
  e('floor-lamp', 'prop', '플로어 조명', 'furniture', 'floor', 0.66, 0.54, 2.1),
  e('mirror', 'prop', '전신 거울', 'furniture', 'floor', 0.74, 0.42, 2.04),
  e('round-rug', 'prop', '폭신한 러그', 'soft', 'rug', 2.88, 2.04, 0.02),
  e('cat-plush', 'prop', '고양이 인형', 'soft', 'small', 0.55, 0.36, 0.6),
  e('bunny-plush', 'prop', '토끼 인형', 'soft', 'small', 0.5, 0.36, 0.62),
  e('heart-cushion', 'prop', '하트 쿠션', 'soft', 'small', 0.6, 0.3, 0.54),
  e('record-player', 'prop', '레코드 플레이어', 'music', 'small', 0.86, 0.54, 0.48),
  e('speaker', 'prop', '작은 스피커', 'music', 'small', 0.58, 0.36, 0.43),
  e('plant', 'prop', '몬스테라 화분', 'plant', 'small', 0.84, 0.54, 1.02),
  e('flowers', 'prop', '꽃 한 다발', 'plant', 'small', 0.43, 0.3, 0.6),
  e('books', 'prop', '좋아하는 책', 'small', 'small', 0.5, 0.36, 0.43),
  e('tea-set', 'prop', '티타임 세트', 'small', 'small', 0.67, 0.42, 0.41),
  e('twin-tail-figure', 'prop', '트윈테일 피규어', 'miku', 'small', 0.36, 0.24, 0.55),
  e('headband-display', 'prop', '응원 머리띠 장식', 'small', 'small', 0.6, 0.36, 0.53),
  e('instant-camera', 'prop', '즉석 카메라', 'small', 'small', 0.38, 0.26, 0.32),
  e('music-poster', 'prop', '음악 포스터', 'wall', 'wall', 0.96, 0.04, 1.26),
  e('photo-string', 'prop', '추억 사진 줄', 'wall', 'wall', 2.04, 0.04, 0.9),
  e('wall-clock', 'prop', '동그란 벽시계', 'wall', 'wall', 0.7, 0.04, 0.7),
  e('star-lights', 'prop', '별빛 전구', 'wall', 'wall', 2.28, 0.04, 0.74),
  // 미쿠 테마: an original mint twin-tail singer motif (fan tribute).
  e('miku-poster', 'prop', '미쿠 테마 콘서트 포스터', 'miku', 'wall', 1.14, 0.04, 1.52),
  e('miku-banner', 'prop', '미쿠 테마 패브릭 배너', 'miku', 'wall', 0.86, 0.04, 1.2),
  e('miku-records', 'model', '미쿠 테마 레코드 선반', 'miku', 'wall', 1.56, 0.36, 0.74),
  e('miku-acrylic', 'model', '미쿠 테마 아크릴 스탠드', 'miku', 'small', 0.38, 0.17, 0.53),
  e('miku-light-sticks', 'model', '민트 응원봉 세트', 'miku', 'small', 0.41, 0.26, 0.6),
  e('miku-headphones', 'model', '미쿠 테마 헤드폰 거치대', 'miku', 'small', 0.43, 0.31, 0.6),
  e('miku-cushion', 'model', '트윈테일 쿠션', 'miku', 'small', 0.86, 0.43, 0.6),
  e('miku-rug', 'model', '민트 원형 러그', 'miku', 'rug', 2.64, 2.64, 0.04),
  e('miku-leek', 'model', '대파 인형', 'miku', 'small', 0.74, 0.26, 0.29),
  e('miku-figure-shelf', 'model', '피규어 진열장', 'miku', 'floor', 1.2, 0.53, 1.94),
  // Rare props bought in the 범타듀 상점 (art: lounge-trophy-art.ts).
  e('trophy-carrot', 'prop', '황금 당근 트로피', 'rare', 'small', 0.48, 0.36, 0.6, { unlock: 'trophy-carrot' }),
  e('trophy-tomato', 'prop', '루비 토마토 트로피', 'rare', 'small', 0.48, 0.36, 0.6, { unlock: 'trophy-tomato' }),
  e('trophy-pumpkin', 'prop', '대왕 호박 트로피', 'rare', 'small', 0.53, 0.36, 0.66, { unlock: 'trophy-pumpkin' }),
  e('trophy-strawberry', 'prop', '별빛 딸기 트로피', 'rare', 'small', 0.48, 0.36, 0.6, { unlock: 'trophy-strawberry' }),
  e('fruit-basket', 'prop', '과일 바구니', 'rare', 'small', 0.62, 0.43, 0.5, { unlock: 'fruit-basket' }),
  // Premium furniture (life expansion, lounge-items.ts FURNITURE): owned copies only.
  ...(
    [
      ['furn-plant', '꽃 화분', 'plant', 'small', 0.6, 0.5, 0.9],
      ['furn-chair', '소풍 의자', 'furniture', 'floor', 0.8, 0.8, 1.0],
      ['furn-lamp', '별빛 조명', 'small', 'small', 0.45, 0.45, 0.7],
      ['furn-tent', '작은 텐트', 'furniture', 'floor', 2.2, 1.8, 1.8],
      ['furn-table', '원목 식탁', 'furniture', 'floor', 1.6, 1.0, 0.9, 0.9],
      ['furn-sofa', '푹신한 소파', 'furniture', 'floor', 2.2, 1.0, 1.1],
      ['furn-bookshelf', '이야기 책장', 'furniture', 'floor', 1.3, 0.5, 2.0],
      ['furn-logbed', '통나무 침대', 'furniture', 'floor', 2.3, 3.0, 1.2, 0.6],
      ['furn-rug', '체크 피크닉 매트', 'soft', 'rug', 2.8, 2.0, 0.02],
      ['furn-bench', '산책길 벤치', 'furniture', 'floor', 1.8, 0.6, 0.9],
      ['furn-fence', '정원 울타리', 'plant', 'floor', 1.8, 0.2, 0.8],
      ['furn-fountain', '작은 분수', 'plant', 'floor', 1.2, 1.2, 1.2],
      ['furn-radio', '빈티지 라디오', 'music', 'small', 0.6, 0.3, 0.4],
      ['furn-planter', '정원 화단', 'plant', 'floor', 1.4, 0.6, 0.7],
      ['furn-fireplace', '따뜻한 벽난로', 'furniture', 'floor', 1.8, 0.7, 1.6],
      ['furn-fruit-tree', '작은 귤나무', 'plant', 'floor', 1.0, 1.0, 1.8],
      ['furn-bed-mint', '민트 침대', 'furniture', 'floor', 2.36, 3.02, 2.38, 0.74],
      ['furn-sofa-rose', '로즈 벤치 소파', 'furniture', 'floor', 2.34, 1.14, 1.92],
      ['furn-armchair-navy', '네이비 1인 소파', 'furniture', 'floor', 1.14, 0.9, 1.32],
      ['furn-rug-lilac', '라일락 울 러그', 'soft', 'rug', 3.18, 2.46, 0.05],
      ['furn-bookcase-walnut', '월넛 5단 책장', 'furniture', 'floor', 1.27, 0.48, 2.11],
      ['furn-wardrobe-white', '화이트 옷장', 'furniture', 'floor', 1.68, 0.86, 2.55],
      // Was the kArchive 3D model until 2026-10-02 (stored rooms: LEGACY_ITEM_KIND).
      ['furn-rocking-chair', '흔들의자', 'furniture', 'floor', 1.0, 1.2, 1.22],
      ['furn-cherry-vase', '벚꽃 가지 화병', 'plant', 'small', 0.5, 0.35, 0.65],
      ['furn-fan', '레트로 선풍기', 'furniture', 'floor', 0.5, 0.4, 0.95],
      ['furn-maple-garland', '단풍 가랜드', 'wall', 'wall', 1.8, 0.04, 0.9],
      ['furn-snowman', '눈사람 인형', 'soft', 'small', 0.55, 0.5, 0.75],
      ['furn-moon-lantern', '보름달 등', 'small', 'small', 0.5, 0.5, 0.85],
      ['furn-lucky-pouch', '복주머니 장식', 'wall', 'wall', 0.45, 0.04, 1.0],
      ['furn-jack-lantern', '호박 등불', 'small', 'small', 0.5, 0.5, 0.52],
      ['furn-xmas-tree', '크리스마스 트리', 'plant', 'floor', 1.2, 1.2, 1.9],
      ['furn-village-medal', '마을 복원 기념패', 'rare', 'wall', 0.8, 0.04, 0.78],
      // 나무결 가구점 새 가구 (2026-10-02, furniture-art-generation.json sheet 2).
      ['furn-round-dining-set', '원목 2인 식탁', 'furniture', 'floor', 2.0, 1.2, 1.68],
      ['furn-beanbag', '빈백 소파', 'soft', 'floor', 1.1, 1.0, 1.08],
      ['furn-hanging-planter', '행잉 플랜트', 'plant', 'wall', 0.8, 0.04, 1.37],
      ['furn-cat-tower', '캣타워', 'furniture', 'floor', 1.3, 0.8, 1.68],
      ['furn-retro-tv', '레트로 TV', 'music', 'floor', 1.2, 0.6, 1.21],
      ['furn-wall-shelf', '벽걸이 선반', 'wall', 'wall', 1.4, 0.04, 0.95],
      // 이번 주 명품 가구 (weekly luxury rotation).
      ['furn-grand-piano', '그랜드 피아노', 'music', 'floor', 2.0, 1.6, 2.12],
      ['furn-canopy-bed', '캐노피 침대', 'furniture', 'floor', 2.4, 3.0, 2.47, 0.74],
      ['furn-aquarium', '대형 수족관', 'furniture', 'floor', 1.8, 0.6, 1.73, 1.5],
      ['furn-crystal-lamp', '크리스탈 스탠드', 'small', 'small', 0.5, 0.5, 0.93],
      ['furn-gold-mirror', '금테 전신 거울', 'furniture', 'floor', 0.95, 0.4, 1.95],
      ['furn-arcade', '레트로 오락기', 'furniture', 'floor', 1.05, 0.8, 1.77],
      ['furn-telescope', '별 보는 망원경', 'furniture', 'floor', 1.1, 0.9, 1.53],
      ['furn-mother-pearl', '자개 병풍', 'rare', 'floor', 2.4, 0.3, 2.35],
      ['furn-velvet-sofa', '벨벳 체스터필드 소파', 'furniture', 'floor', 2.4, 1.1, 1.44],
      ['furn-bonsai', '명품 분재', 'plant', 'small', 0.7, 0.5, 0.76],
      ['furn-marble-fireplace', '대리석 벽난로', 'furniture', 'floor', 2.0, 0.6, 2.14],
      ['furn-najeon-wardrobe', '자개 장롱', 'furniture', 'floor', 1.7, 0.75, 2.4],
      // 마을 공사 / 축제 rewards.
      ['furn-project-plaque', '마을 공사 현판', 'rare', 'wall', 1.2, 0.04, 0.96],
      ['furn-festival-lantern', '축제 청사초롱', 'rare', 'small', 0.45, 0.45, 0.9],
      ['furn-festival-drum', '축제 북', 'rare', 'floor', 0.9, 0.9, 1.04],
      ['furn-festival-kite', '축제 방패연', 'rare', 'small', 0.8, 0.3, 0.93],
      ['furn-festival-fan', '축제 부채', 'rare', 'small', 0.9, 0.3, 0.71],
    ] as const
  ).map(([ref, name, category, mount, w, d, h, top]: readonly [string, string, RoomCategory, RoomMount, number, number, number, number?]) =>
    e(ref, 'prop', name, category, mount, w, d, h, { unlock: ref, premium: true, ...(top ? { top } : {}) }),
  ),
];
/**
 * Pieces whose kind or mount changed after rooms were saved with them
 * (2026-10-02 furniture art): readers accept the old form and store the new.
 * 흔들의자 was a 3D model; the festival kite and fan hung on the back wall and
 * now stand (their paintings have stands).
 */
export const LEGACY_ITEM_KIND: Readonly<Record<string, RoomItemKind>> = { 'furn-rocking-chair': 'model' };
export const LEGACY_WALL_ITEM: readonly string[] = ['furn-festival-kite', 'furn-festival-fan'];
export const CATALOG_BY_REF: Readonly<Record<string, CatalogEntry>> =
  Object.fromEntries(ROOM_CATALOG.map((entry) => [entry.ref, entry]));
export const catalogEntry = (ref: string): CatalogEntry | undefined =>
  Object.prototype.hasOwnProperty.call(CATALOG_BY_REF, ref)
    ? CATALOG_BY_REF[ref]
    : undefined;
