/** Shared by browser and account API. No asset, DOM, or storage imports. */
export type RoomCategory = 'furniture' | 'soft' | 'music' | 'small' | 'wall';
export type RoomPlacement = 'floor' | 'wall' | 'rug';
export const ROOM_PROPS = [
  {
    id: 'bed',
    name: '포근한 침대',
    category: 'furniture',
    placement: 'floor',
    width: 32,
    layer: 2,
  },
  {
    id: 'sofa',
    name: '작은 소파',
    category: 'furniture',
    placement: 'floor',
    width: 29,
    layer: 2,
  },
  {
    id: 'desk',
    name: '나무 책상',
    category: 'furniture',
    placement: 'floor',
    width: 25,
    layer: 2,
  },
  {
    id: 'vanity',
    name: '화장대',
    category: 'furniture',
    placement: 'floor',
    width: 24,
    layer: 2,
  },
  {
    id: 'wardrobe',
    name: '옷장',
    category: 'furniture',
    placement: 'floor',
    width: 26,
    layer: 2,
  },
  {
    id: 'low-table',
    name: '낮은 테이블',
    category: 'furniture',
    placement: 'floor',
    width: 25,
    layer: 2,
  },
  {
    id: 'bookshelf',
    name: '책장',
    category: 'furniture',
    placement: 'floor',
    width: 23,
    layer: 2,
  },
  {
    id: 'clothes-rack',
    name: '옷걸이 행거',
    category: 'furniture',
    placement: 'floor',
    width: 25,
    layer: 2,
  },
  {
    id: 'armchair',
    name: '쉬어 가는 의자',
    category: 'furniture',
    placement: 'floor',
    width: 19,
    layer: 2,
  },
  {
    id: 'floor-lamp',
    name: '플로어 조명',
    category: 'furniture',
    placement: 'floor',
    width: 13,
    layer: 2,
  },
  {
    id: 'mirror',
    name: '전신 거울',
    category: 'furniture',
    placement: 'floor',
    width: 15,
    layer: 2,
  },
  {
    id: 'rug',
    name: '폭신한 러그',
    category: 'soft',
    placement: 'rug',
    width: 38,
    layer: 1,
  },
  {
    id: 'cat-plush',
    name: '고양이 인형',
    category: 'soft',
    placement: 'floor',
    width: 11,
    layer: 2,
  },
  {
    id: 'bunny-plush',
    name: '토끼 인형',
    category: 'soft',
    placement: 'floor',
    width: 11,
    layer: 2,
  },
  {
    id: 'heart-cushion',
    name: '하트 쿠션',
    category: 'soft',
    placement: 'floor',
    width: 10,
    layer: 2,
  },
  {
    id: 'record-player',
    name: '레코드 플레이어',
    category: 'music',
    placement: 'floor',
    width: 15,
    layer: 2,
  },
  {
    id: 'speaker',
    name: '작은 스피커',
    category: 'music',
    placement: 'floor',
    width: 12,
    layer: 2,
  },
  {
    id: 'plant',
    name: '초록 화분',
    category: 'small',
    placement: 'floor',
    width: 14,
    layer: 2,
  },
  {
    id: 'flowers',
    name: '꽃 한 다발',
    category: 'small',
    placement: 'floor',
    width: 10,
    layer: 2,
  },
  {
    id: 'books',
    name: '좋아하는 책',
    category: 'small',
    placement: 'floor',
    width: 11,
    layer: 2,
  },
  {
    id: 'tea-set',
    name: '티타임 세트',
    category: 'small',
    placement: 'floor',
    width: 13,
    layer: 2,
  },
  {
    id: 'twin-tail-figure',
    name: '트윈테일 피규어',
    category: 'small',
    placement: 'floor',
    width: 10,
    layer: 2,
  },
  {
    id: 'headband-display',
    name: '응원 머리띠 장식',
    category: 'small',
    placement: 'floor',
    width: 12,
    layer: 2,
  },
  {
    id: 'instant-camera',
    name: '즉석 카메라',
    category: 'small',
    placement: 'floor',
    width: 9,
    layer: 2,
  },
  {
    id: 'music-poster',
    name: '음악 포스터',
    category: 'wall',
    placement: 'wall',
    width: 14,
    layer: 0,
  },
  {
    id: 'photo-string',
    name: '추억 사진 줄',
    category: 'wall',
    placement: 'wall',
    width: 28,
    layer: 0,
  },
  {
    id: 'wall-clock',
    name: '동그란 벽시계',
    category: 'wall',
    placement: 'wall',
    width: 10,
    layer: 0,
  },
  {
    id: 'star-lights',
    name: '별빛 전구',
    category: 'wall',
    placement: 'wall',
    width: 33,
    layer: 0,
  },
] as const satisfies readonly {
  id: string;
  name: string;
  category: RoomCategory;
  placement: RoomPlacement;
  width: number;
  layer: number;
}[];

export type RoomPropId = (typeof ROOM_PROPS)[number]['id'];
export const ROOM_PROP_BY_ID = Object.fromEntries(
  ROOM_PROPS.map((prop) => [prop.id, prop]),
) as Record<RoomPropId, (typeof ROOM_PROPS)[number]>;
export type RoomItem = {
  id: string;
  prop: RoomPropId;
  x: number;
  y: number;
  scale: number;
  flip: boolean;
};
export type Bedroom = {
  version: 1;
  wall: 'cream' | 'sage' | 'blush' | 'blue';
  floor: 'oak' | 'walnut' | 'pale';
  /** Within each catalog layer, later items are displayed in front. */
  items: RoomItem[];
};
export const BEDROOM_LIMITS = {
  maxItems: 48,
  minScale: 0.65,
  maxScale: 1.5,
  minX: 4,
  maxX: 96,
  maxIdLength: 64,
} as const;

export function roomItemBounds(prop: RoomPropId) {
  const placement = ROOM_PROP_BY_ID[prop].placement;
  return {
    minX: 4,
    maxX: 96,
    minY: placement === 'wall' ? 8 : placement === 'rug' ? 48 : 40,
    maxY: placement === 'wall' ? 58 : 94,
  };
}

/** A cozy starter inspired by Dowon's interests; every account can use every prop. */
export function defaultBedroom(actor = 0): Bedroom {
  const item = (
    prop: RoomPropId,
    x: number,
    y: number,
    scale = 1,
  ): RoomItem => ({ id: 'starter-' + prop, prop, x, y, scale, flip: false });
  return {
    version: 1,
    wall: actor === 0 ? 'blush' : 'cream',
    floor: 'oak',
    items: [
      item('star-lights', 46, 17),
      item('music-poster', 76, 27),
      item('photo-string', 37, 35, 0.8),
      item('rug', 48, 84),
      item('bed', 24, 76),
      item('vanity', 75, 68),
      item('floor-lamp', 57, 66),
      item('plant', 89, 78),
      item('low-table', 51, 87, 0.8),
      item('cat-plush', 31, 78),
      item('heart-cushion', 16, 69),
      item('twin-tail-figure', 75, 53, 0.8),
      item('headband-display', 66, 55, 0.8),
      item('tea-set', 52, 77, 0.8),
    ],
  };
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
function bounded(value: unknown, min: number, max: number, fallback: number) {
  const n =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.round(Math.max(min, Math.min(max, n)) * 1000) / 1000;
}
export function readBedroom(value: unknown, actor = 0): Bedroom {
  const fallback = defaultBedroom(actor),
    source = record(value);
  if (!source || source.version !== 1) return fallback;
  const ids = new Set<string>();
  const items: RoomItem[] = [];
  if (Array.isArray(source.items)) {
    // Bound work as well as output for direct callers outside the HTTP size limit.
    for (const candidate of source.items.slice(
      0,
      BEDROOM_LIMITS.maxItems * 4,
    )) {
      if (items.length === BEDROOM_LIMITS.maxItems) break;
      const item = record(candidate);
      if (
        !item ||
        typeof item.id !== 'string' ||
        !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(item.id) ||
        ids.has(item.id)
      )
        continue;
      const prop = ROOM_PROPS.find((prop) => prop.id === item.prop);
      if (!prop) continue;
      const bounds = roomItemBounds(prop.id);
      ids.add(item.id);
      items.push({
        id: item.id,
        prop: prop.id,
        x: bounded(item.x, bounds.minX, bounds.maxX, 50),
        y: bounded(
          item.y,
          bounds.minY,
          bounds.maxY,
          prop.placement === 'wall' ? 27 : prop.placement === 'rug' ? 81 : 77,
        ),
        scale: bounded(
          item.scale,
          BEDROOM_LIMITS.minScale,
          BEDROOM_LIMITS.maxScale,
          1,
        ),
        flip: item.flip === true,
      });
    }
  }
  return {
    version: 1,
    wall: ['cream', 'sage', 'blush', 'blue'].includes(source.wall as string)
      ? (source.wall as Bedroom['wall'])
      : fallback.wall,
    floor: ['oak', 'walnut', 'pale'].includes(source.floor as string)
      ? (source.floor as Bedroom['floor'])
      : fallback.floor,
    items: Array.isArray(source.items) ? items : fallback.items,
  };
}
