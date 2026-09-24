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
  /** kArchive model used for a resident home (procedural shell is the fallback). */
  model?: VillageHouseModel;
};

export const VILLAGE_BOUNDS = { width: 80, depth: 60, radius: 0.35 } as const;
export const VILLAGE_START: VillagePoint = { x: 0, z: 10 };

/**
 * Door height every resident home is normalized to. The walking figure is
 * `VILLAGE_ACTOR_HEIGHT` (lounge-village-camera.ts) tall, i.e. about 0.9 of a
 * door, so homes, civic buildings and the character share one scale.
 */
export const VILLAGE_DOOR_HEIGHT = 1.45;

/**
 * Real bounding boxes of the curated kArchive house GLBs (model units, +z is
 * the front door side) and their measured door height / horizontal door offset.
 * tests/lounge-village.test.mjs re-reads the GLB accessors to keep these honest.
 */
export const VILLAGE_HOUSE_MODELS = {
  cottage: { width: 2.9687, height: 2.5253, depth: 3, door: 0.79, doorX: 0 },
  cornerHouse: {
    width: 3.2,
    height: 2.4142,
    depth: 2.7471,
    door: 0.724,
    doorX: -0.6,
  },
  courtyardHouse: {
    width: 3.2,
    height: 1.6486,
    depth: 2.3623,
    door: 0.6,
    doorX: 0,
  },
} as const;
export type VillageHouseModel = keyof typeof VILLAGE_HOUSE_MODELS;

/** Scale that brings a model's door to `VILLAGE_DOOR_HEIGHT`. */
export function villageHouseScale(model: VillageHouseModel) {
  return VILLAGE_DOOR_HEIGHT / VILLAGE_HOUSE_MODELS[model].door;
}

export const VILLAGE_RIVER = {
  minZ: 14,
  maxZ: 16,
  bridges: [
    { x: -27, halfWidth: 2.5 },
    { x: 0, halfWidth: 2.5 },
    { x: 27, halfWidth: 2.5 },
  ],
} as const;

export const VILLAGE_DISTRICTS = [
  {
    id: 'west-orchard',
    name: '과수원 피크닉',
    description: '서쪽 언덕의 과수원과 피크닉 자리',
    point: { x: -32, z: 5 },
    color: '#bc8153',
  },
  {
    id: 'south-camp',
    name: '강변 캠프',
    description: '세 다리 아래 남쪽 강변 쉼터',
    point: { x: 5, z: 24 },
    color: '#668c68',
  },
  {
    id: 'east-boardwalk',
    name: '동쪽 산책길',
    description: '정원과 강을 따라 이어지는 나무 데크',
    point: { x: 33, z: -5 },
    color: '#57918c',
  },
  {
    id: 'north-forest',
    name: '북쪽 숲길',
    description: '마을 뒤편 숲속 산책로',
    point: { x: 0, z: -26 },
    color: '#547552',
  },
] as const;

export const VILLAGE_SCENIC_TREES = [
  { x: -30, z: -27, radius: 0.9, scale: 0.92 },
  { x: -20, z: -28, radius: 0.85, scale: 0.86 },
  { x: 20, z: -28, radius: 0.85, scale: 0.86 },
  { x: 30, z: -27, radius: 0.9, scale: 0.92 },
  { x: -38, z: -23, radius: 1.05, scale: 1.15 },
  { x: -38, z: -16, radius: 0.85, scale: 0.95 },
  { x: -38, z: 22, radius: 1, scale: 1.1 },
  { x: 38, z: -22, radius: 1.05, scale: 1.15 },
  { x: 38, z: -15, radius: 0.85, scale: 0.95 },
  { x: 38, z: 22, radius: 1, scale: 1.1 },
  { x: -20, z: 27, radius: 0.85, scale: 0.9 },
  { x: -14, z: 28, radius: 0.8, scale: 0.84 },
  { x: 18, z: 27, radius: 0.85, scale: 0.9 },
  { x: 24, z: 26, radius: 0.8, scale: 0.86 },
] as const;

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
// The five-house row alternates the two narrower models; the wide courtyard
// house sits on the roomier side lots.
const homeModels: readonly VillageHouseModel[] = [
  'cornerHouse',
  'cottage',
  'cornerHouse',
  'cottage',
  'cornerHouse',
  'courtyardHouse',
  'courtyardHouse',
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

const round = (n: number) => Math.round(n * 1000) / 1000;

const makePlace = (
  place: Omit<VillagePlace, 'entry'>,
  doorX = 0,
): VillagePlace => ({
  ...place,
  // All entrances face the plaza (+z) and include a small step beyond the wall.
  entry: {
    x: round(place.x + doorX),
    z: round(place.z + place.depth / 2 + 1),
  },
});

export const VILLAGE_PLACES: readonly VillagePlace[] = [
  ...homePositions.map((point, actor) => {
    const model = homeModels[actor];
    const spec = VILLAGE_HOUSE_MODELS[model],
      scale = villageHouseScale(model);
    return makePlace(
      {
        id: `home-${actor}`,
        name: `${homeNames[actor]}의 집`,
        subtitle: '주민의 집',
        kind: 'home',
        actor,
        ...point,
        // Colliders follow the scaled model's real footprint.
        width: round(spec.width * scale + 0.1),
        depth: round(spec.depth * scale + 0.1),
        color: homeColors[actor],
        roofColor: roofColors[actor],
        destination: 'bedroom',
        model,
      },
      spec.doorX * scale,
    );
  }),
  makePlace({
    id: 'hall',
    name: '범마을 회관',
    subtitle: '고스톱 · 섯다 · 친구들과 수다',
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
    subtitle: '체스 · 홀덤 · 블랙잭',
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
  { x: -36, z: -5 },
  { x: -36, z: 5 },
  { x: -36, z: 14 },
];
export const VILLAGE_FARMLAND = {
  id: 'farmland',
  x: 8.75,
  z: 6.5,
  width: 5,
  depth: 3,
} as const;
export const VILLAGE_FARMLAND_ENTRY: VillagePoint = { x: 8.75, z: 4.45 };
/** "범타듀 상점": a small market stall west of the plaza (faces +z). */
export const VILLAGE_MARKET = {
  id: 'market',
  name: '범타듀 상점',
  x: -11,
  z: -4.4,
  width: 2.4,
  depth: 1.4,
} as const;

/** Matching footprints keep imported kArchive props out of walking routes. */
export const VILLAGE_FURNISHINGS = [
  {
    id: 'orchardPicnic',
    model: 'picnicTable',
    x: -32,
    z: 1,
    width: 3,
    depth: 3,
    height: 1.3,
  },
  {
    id: 'campPicnic',
    model: 'picnicTable',
    x: 7,
    z: 21,
    width: 3,
    depth: 3,
    height: 1.3,
  },
  {
    id: 'boardwalkBench',
    model: 'parkBench',
    x: 33,
    z: -9,
    width: 3,
    depth: 2.5,
    height: 1.4,
  },
  {
    id: 'forestBench',
    model: 'parkBench',
    x: 5,
    z: -27.2,
    width: 3,
    depth: 2.5,
    height: 1.4,
  },
  {
    // Beside (not on) the boardwalk mouth so its 1.9-wide deck stays open.
    id: 'eastLantern',
    model: 'gardenLantern',
    x: 28.9,
    z: -3.2,
    width: 0.8,
    depth: 0.8,
    height: 1.9,
  },
  {
    id: 'orchardLantern',
    model: 'gardenLantern',
    x: -34.2,
    z: 7.2,
    width: 0.8,
    depth: 0.8,
    height: 1.9,
  },
  {
    id: 'campLantern',
    model: 'gardenLantern',
    x: 3.3,
    z: 20.9,
    width: 0.8,
    depth: 0.8,
    height: 1.9,
  },
] as const;

/** Walking routes drawn by the world builder and the minimap: [x1, z1, x2, z2, width]. */
export type VillagePathSegment = readonly [number, number, number, number, number];
const homeSpurs: VillagePathSegment[] = VILLAGE_PLACES.filter(
  (place) => place.kind === 'home',
).map((place) =>
  place.z < -10
    ? ([place.entry.x, place.entry.z - 0.4, place.entry.x, -9, 1.3] as const)
    : ([place.entry.x, place.entry.z - 0.4, place.entry.x, -1.1, 1.45] as const),
);
export const VILLAGE_PATHS: readonly VillagePathSegment[] = [
  // Three crossings fan the expanded valley out from the civic green.
  [-16, 10, -27, 10, 1.7],
  [-27, 10, -27, 17.5, 1.55],
  [-27, 17.5, -32, 5, 1.3],
  [16, 10, 27, 10, 1.7],
  [27, 10, 27, 17.5, 1.55],
  [27, 10, 27, -1, 1.4],
  [27, 17.5, 33, -5, 1.3],
  [0, 13, 0, 20, 1.65],
  [0, 20, 5, 24, 1.4],
  [0, 20, -8, 24, 1.3],
  [5, 24, 14, 24, 1.3],
  // The eastern perimeter loops north to the forest walk and boardwalk.
  [27, -1, 27, -25, 1.4],
  [27, -25, 0, -25, 1.4],
  [27, -5, 29, -5, 1.45],
  // Existing homes remain connected to the long forest trail at the north edge.
  [14, -9, 24, -9, 1.3],
  [24, -9, 27, -12, 1.3],
  // West orchard picnic loop from its dedicated bridge.
  [-27, 5, -32, 5, 1.35],
  [-32, 5, -32, 3.2, 1.25],
  // North green and crossing, with a walk around the fountain's rim.
  [0, 2.7, 0, 13.4, 2.55],
  [0, 2.7, -1.9, 2.05, 1.7],
  [-1.9, 2.05, -2.7, 0.7, 1.7],
  [-2.7, 0.7, -2.7, -0.7, 1.7],
  [-2.7, -0.7, -1.9, -2.05, 1.7],
  [-1.9, -2.05, 0, -2.7, 1.7],
  [0, 2.7, 1.9, 2.05, 1.7],
  [1.9, 2.05, 2.7, 0.7, 1.7],
  [2.7, 0.7, 2.7, -0.7, 1.7],
  [2.7, -0.7, 1.9, -2.05, 1.7],
  [1.9, -2.05, 0, -2.7, 1.7],
  // Door spurs are generated from each home's real entrance.
  ...homeSpurs,
  [-15.2, -9, -7, -9, 1.5],
  [-7, -9, 0, -9, 1.5],
  [0, -9, 7, -9, 1.5],
  [7, -9, 14, -9, 1.5],
  [-7, -9, -7, -3.3, 1.45],
  [7, -9, 7, -3.3, 1.45],
  [-7, -3.3, -5, -3.3, 1.45],
  [7, -3.3, 5, -3.3, 1.45],
  [-5, -3.3, -3, -3.3, 1.45],
  [5, -3.3, 3, -3.3, 1.45],
  [-3, -3.3, 0, -2.7, 1.45],
  [3, -3.3, 0, -2.7, 1.45],
  // The two side cottages join the plaza from the south side of the fountain.
  [-20, -1.1, -7, -1.1, 1.5],
  [20, -1.1, 7, -1.1, 1.5],
  [-7, -1.1, -5, -2.2, 1.4],
  [7, -1.1, 5, -2.2, 1.4],
  [-5, -2.2, -3, -3.3, 1.4],
  [5, -2.2, 3, -3.3, 1.4],
  // Civic entrances connect along the open green in front of both buildings.
  [-16, 10, -16, 9, 2.1],
  [16, 10, 16, 9, 2.1],
  [-16, 10, 16, 10, 2],
  [-3.1, 10, 0, 2.7, 1.8],
  [3.1, 10, 0, 2.7, 1.8],
  // The kitchen plot opens south into a lane that feeds the eastern plaza rim.
  [
    VILLAGE_FARMLAND_ENTRY.x,
    VILLAGE_FARMLAND_ENTRY.z,
    VILLAGE_FARMLAND.x,
    2.7,
    1.2,
  ],
  [VILLAGE_FARMLAND.x, 2.7, 3.1, 2.7, 1.2],
  // A narrow lane skirts the west edge of the café terrace and leaves its deck clear.
  [-11.3, 10, -11.3, 8, 0.8],
  [-11.3, 8, -10.7, 8, 0.7],
  [-11.3, 8, -11.3, 4.1, 0.8],
  [-11.3, 4.1, -3.1, 4.1, 1.45],
];

/** Boardwalk deck and its two rails at the eastern garden edge. */
export const VILLAGE_BOARDWALK = {
  x1: 29,
  x2: 38,
  z: -5,
  railZ: [-5.95, -4.05],
} as const;

export type VillageDecorKind =
  | 'tree'
  | 'lamp'
  | 'bench'
  | 'shrub'
  | 'flowers'
  | 'fence'
  | 'mailbox'
  | 'hydrangea'
  | 'rail';
export type VillageCollider =
  | { shape: 'circle'; r: number }
  | { shape: 'box'; w: number; d: number };
export type VillageDecor = {
  id: string;
  kind: VillageDecorKind;
  x: number;
  z: number;
  /** Visual scale (trees) or item count (flowers). */
  scale?: number;
  rotation?: number;
  variant?: number;
  /** Home the prop belongs to (garden props follow the resident's colors). */
  home?: number;
  collider: VillageCollider | null;
};

const circle = (r: number): VillageCollider => ({ shape: 'circle', r });
const boxCollider = (w: number, d: number): VillageCollider => ({
  shape: 'box',
  w,
  d,
});

const decor: VillageDecor[] = [];
const addTree = (x: number, z: number, scale: number, variant: number) =>
  decor.push({
    id: `tree-${decor.length}`,
    kind: 'tree',
    x,
    z,
    scale,
    variant,
    // Trunk plus the low part of the canopy; the character may brush leaves.
    collider: circle(0.34 * scale + 0.08),
  });
// Edge woodland planted in irregular clusters, leaving routes and fronts open.
(
  [
    [-23, -16, 1.2],
    [-22, -10.6, 0.9],
    [-24.8, -2.2, 1.2],
    [-22, 3, 0.95],
    [-23.5, 6.8, 1.1],
    [-22, 18, 0.95],
    [23, -16, 1.1],
    [22, -10.6, 0.92],
    [24.8, -2.2, 1.16],
    [22, 3, 0.95],
    [23.5, 6.8, 1.1],
    [22, 18, 0.92],
    [-18, -18.3, 0.82],
    [-3.5, -18.3, 0.72],
    [4.5, -18.3, 0.78],
    [13, -18.6, 0.75],
    [18, -18.3, 0.8],
    [-18, 12.3, 0.76],
    [-14, 12.3, 0.72],
    [14, 12.3, 0.74],
    [18, 12.3, 0.78],
    [-19, 1, 0.76],
    [19, 1, 0.72],
  ] as const
).forEach(([x, z, s], i) => addTree(x, z, s, i));
VILLAGE_SCENIC_TREES.forEach(({ x, z, scale }, i) => addTree(x, z, scale, i + 3));

// Lamps light the plaza, bridge heads and districts; none stand on a route.
(
  [
    [-4.9, -1],
    [4.9, 1],
    [-2.4, 3.4],
    [2.4, 3.4],
    [-29, 7],
    [9.6, 21.6],
    [30, -8],
    [36, -8],
    [-5.2, 11.6],
    [5.2, 11.6],
  ] as const
).forEach(([x, z], i) =>
  decor.push({ id: `lamp-${i}`, kind: 'lamp', x, z, collider: circle(0.2) }),
);

// Plaza benches face the fountain from its east and west rims.
decor.push(
  {
    id: 'bench-west',
    kind: 'bench',
    x: -3.95,
    z: -0.6,
    rotation: Math.PI / 2,
    collider: boxCollider(0.55, 1.65),
  },
  {
    id: 'bench-east',
    kind: 'bench',
    x: 3.95,
    z: 0.6,
    rotation: -Math.PI / 2,
    collider: boxCollider(0.55, 1.65),
  },
);

// Hedges: a shrub is ~1.4 wide but only its dense core blocks walking.
(
  [
    [-19, -11],
    [-18.5, -10.8],
    [18.5, -10.8],
    [-21, 8],
    [-19.6, 11.4],
    [20.6, 8],
    [19.6, 11.4],
    [-11.4, 1.5],
    [11.4, 1.5],
    [-4, 7],
    [4, 7],
  ] as const
).forEach(([x, z], i) =>
  decor.push({
    id: `shrub-${i}`,
    kind: 'shrub',
    x,
    z,
    variant: i,
    collider: circle(0.55),
  }),
);

// Flower beds are ankle-high and stay walkable.
(
  [
    [-3.1, 1.9, 7, 1],
    [3.15, -1.9, 7, 2],
    [-1.4, -3.7, 6, 3],
    [1.5, 3.7, 6, 4],
    [-32, 9, 12, 3],
    [5, 28, 10, 4],
    [33, -10.9, 12, 2],
    [0, -28, 14, 5],
    [-4, 12, 8, 2],
    [4, 12, 8, 5],
    [-20, 12.6, 8, 4],
    [20, 12.6, 8, 1],
  ] as const
).forEach(([x, z, count, seed], i) =>
  decor.push({
    id: `flowers-${i}`,
    kind: 'flowers',
    x,
    z,
    scale: count,
    variant: seed,
    collider: null,
  }),
);

// Resident front gardens are derived from each home's real footprint.
for (const place of VILLAGE_PLACES) {
  if (place.kind !== 'home' || place.actor === undefined) continue;
  const front = place.z + place.depth / 2,
    half = place.width / 2,
    home = place.actor;
  decor.push(
    {
      id: `mailbox-${home}`,
      kind: 'mailbox',
      x: place.entry.x - 1.35,
      z: front + 0.55,
      home,
      collider: circle(0.22),
    },
    {
      id: `hydrangea-${home}`,
      kind: 'hydrangea',
      x: place.entry.x + 1.5,
      z: front + 0.55,
      home,
      collider: circle(0.42),
    },
    {
      id: `garden-flowers-${home}`,
      kind: 'flowers',
      x: place.x + (place.entry.x < place.x ? half - 0.6 : -half + 0.6),
      z: front + 0.45,
      scale: 4,
      variant: home + 1,
      home,
      collider: null,
    },
  );
  for (const side of [-1, 1])
    decor.push({
      id: `fence-${home}-${side}`,
      kind: 'fence',
      x: place.x + side * (half + 0.18),
      z: front - 1.2,
      home,
      collider: boxCollider(0.14, 2.3),
    });
}

// Boardwalk rails are solid; the deck between them stays 1.9 wide.
for (const railZ of VILLAGE_BOARDWALK.railZ)
  decor.push({
    id: `rail-${railZ}`,
    kind: 'rail',
    x: (VILLAGE_BOARDWALK.x1 + VILLAGE_BOARDWALK.x2) / 2 + 0.1,
    z: railZ,
    collider: boxCollider(VILLAGE_BOARDWALK.x2 - VILLAGE_BOARDWALK.x1 + 0.2, 0.14),
  });

/** Single source for decorative placement: the world builder and collision share it. */
export const VILLAGE_DECOR: readonly VillageDecor[] = decor;

type SolidCollider = {
  id: string;
  x: number;
  z: number;
  collider: VillageCollider;
  rotation: number;
};
/** Every solid thing a walker can bump into, besides places, water and bounds. */
export const VILLAGE_COLLIDERS: readonly SolidCollider[] = [
  ...VILLAGE_DECOR.flatMap((item) =>
    item.collider
      ? [
          {
            id: item.id,
            x: item.x,
            z: item.z,
            collider: item.collider,
            rotation: item.kind === 'bench' ? 0 : (item.rotation ?? 0),
          },
        ]
      : [],
  ),
  ...VILLAGE_ORCHARD.map((tree, i) => ({
    id: `fruitTree-${i}`,
    x: tree.x,
    z: tree.z,
    collider: circle(0.55),
    rotation: 0,
  })),
  ...VILLAGE_FURNISHINGS.map((prop) => ({
    id: prop.id,
    x: prop.x,
    z: prop.z,
    collider: boxCollider(prop.width, prop.depth),
    rotation: 0,
  })),
  {
    id: VILLAGE_TERRACE.id,
    x: VILLAGE_TERRACE.x,
    z: VILLAGE_TERRACE.z,
    collider: boxCollider(VILLAGE_TERRACE.width, VILLAGE_TERRACE.depth),
    rotation: 0,
  },
  {
    id: VILLAGE_MARKET.id,
    x: VILLAGE_MARKET.x,
    z: VILLAGE_MARKET.z,
    collider: boxCollider(VILLAGE_MARKET.width, VILLAGE_MARKET.depth),
    rotation: 0,
  },
  {
    id: VILLAGE_FARMLAND.id,
    x: VILLAGE_FARMLAND.x,
    z: VILLAGE_FARMLAND.z,
    collider: boxCollider(VILLAGE_FARMLAND.width, VILLAGE_FARMLAND.depth),
    rotation: 0,
  },
];

const FOUNTAIN = { x: 0, z: 0, radius: 2 } as const;

function blockedByCollider(point: VillagePoint, radius: number) {
  for (const item of VILLAGE_COLLIDERS) {
    const dx = point.x - item.x,
      dz = point.z - item.z;
    const c = item.collider;
    if (c.shape === 'circle') {
      const r = c.r + radius;
      if (dx * dx + dz * dz < r * r) return true;
    } else if (
      Math.abs(dx) < c.w / 2 + radius &&
      Math.abs(dz) < c.d / 2 + radius
    )
      return true;
  }
  return false;
}

export function villageCanWalk(point: VillagePoint): boolean {
  const { width, depth, radius } = VILLAGE_BOUNDS;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return false;
  if (
    Math.abs(point.x) > width / 2 - radius ||
    Math.abs(point.z) > depth / 2 - radius
  )
    return false;

  if (
    VILLAGE_PLACES.some(
      (place) =>
        Math.abs(point.x - place.x) < place.width / 2 + radius &&
        Math.abs(point.z - place.z) < place.depth / 2 + radius,
    )
  )
    return false;
  if (blockedByCollider(point, radius)) return false;

  const dx = point.x - FOUNTAIN.x;
  const dz = point.z - FOUNTAIN.z;
  if (dx * dx + dz * dz < (FOUNTAIN.radius + radius) ** 2) return false;

  const touchesRiver =
    point.z + radius > VILLAGE_RIVER.minZ &&
    point.z - radius < VILLAGE_RIVER.maxZ;
  const onBridge = VILLAGE_RIVER.bridges.some(
    (bridge) => Math.abs(point.x - bridge.x) + radius <= bridge.halfWidth,
  );
  if (touchesRiver && !onBridge) return false;
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

// Cache the static walkable graph once. Expanding bounds increases the grid
// area; rebuilding collision/raycast checks inside every BFS would multiply cost.
const GRID_NEIGHBORS = new Int32Array(COLS * ROWS * 8).fill(-1);
const GRID_DEGREE = new Uint8Array(COLS * ROWS);
for (let id = 0; id < COLS * ROWS; id++) {
  if (!GRID_WALKABLE[id]) continue;
  const x = id % COLS;
  for (const offset of [
    -COLS - 1,
    -COLS,
    -COLS + 1,
    -1,
    1,
    COLS - 1,
    COLS,
    COLS + 1,
  ]) {
    const next = id + offset;
    if (next < 0 || next >= COLS * ROWS || !GRID_WALKABLE[next]) continue;
    const nextX = next % COLS;
    if (Math.abs(nextX - x) > 1) continue;
    if (
      nextX !== x &&
      Math.abs(offset) !== COLS &&
      (!GRID_WALKABLE[id + (nextX > x ? 1 : -1)] ||
        !GRID_WALKABLE[id + (offset > 0 ? COLS : -COLS)])
    )
      continue;
    const slot = GRID_DEGREE[id] ?? 0;
    GRID_NEIGHBORS[id * 8 + slot] = next;
    GRID_DEGREE[id] = slot + 1;
  }
}

function nearestWalkableId(
  point: VillagePoint,
  visibleFrom?: VillagePoint,
): number | null {
  let nearest = -1;
  let best = Number.POSITIVE_INFINITY;
  const centerCol = clamp(
    Math.round((point.x + VILLAGE_BOUNDS.width / 2) / GRID),
    0,
    COLS - 1,
  );
  const centerRow = clamp(
    Math.round((point.z + VILLAGE_BOUNDS.depth / 2) / GRID),
    0,
    ROWS - 1,
  );
  for (let ring = 0; ring < Math.max(COLS, ROWS); ring++) {
    const minRow = Math.max(0, centerRow - ring);
    const maxRow = Math.min(ROWS - 1, centerRow + ring);
    const minCol = Math.max(0, centerCol - ring);
    const maxCol = Math.min(COLS - 1, centerCol + ring);
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (
          ring &&
          row !== minRow &&
          row !== maxRow &&
          col !== minCol &&
          col !== maxCol
        )
          continue;
        const id = row * COLS + col;
        if (!GRID_WALKABLE[id]) continue;
        const candidate = GRID_POINTS[id];
        if (!candidate) continue;
        const distance =
          (candidate.x - point.x) ** 2 + (candidate.z - point.z) ** 2;
        if (distance >= best) continue;
        if (visibleFrom && !villageLineClear(visibleFrom, candidate)) continue;
        best = distance;
        nearest = id;
      }
    }
    const nextRingMinimum = Math.max(0, ring + 0.5) * GRID;
    if (nearest >= 0 && nextRingMinimum ** 2 > best) break;
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
  const maxExpansions = total;
  let expansions = 0;
  while (head < tail && parent[targetId] === -2 && expansions < maxExpansions) {
    const current = queue[head++];
    expansions++;
    const degree = GRID_DEGREE[current] ?? 0;
    for (let index = 0; index < degree; index++) {
      const next = GRID_NEIGHBORS[current * 8 + index];
      if (next < 0 || parent[next] !== -2) continue;
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
    // Drop the snapped grid point only when the exact target is still in
    // clear view from the waypoint before it.
    if (
      path.length > 0 &&
      path[path.length - 1].x === snappedTarget.x &&
      path[path.length - 1].z === snappedTarget.z &&
      villageLineClear(path.length > 1 ? path[path.length - 2] : from, to)
    )
      path.pop();
    path.push(to);
  }
  return path;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/*
 * Village presence coordinates reuse the server's existing move range
 * (x 15..85, y 42..88). The mapping is piecewise linear so the server's
 * default village position (50, 60) lands on the plaza (VILLAGE_START).
 */
const NET = { minX: 15, maxX: 85, minY: 42, plazaY: 60, maxY: 88 } as const;
export function villageToNetwork(point: VillagePoint): {
  x: number;
  y: number;
} {
  const { width, depth } = VILLAGE_BOUNDS;
  const x = clamp(Number.isFinite(point.x) ? point.x : 0, -width / 2, width / 2);
  const z = clamp(
    Number.isFinite(point.z) ? point.z : VILLAGE_START.z,
    -depth / 2,
    depth / 2,
  );
  const y =
    z <= VILLAGE_START.z
      ? NET.minY +
        ((z + depth / 2) / (VILLAGE_START.z + depth / 2)) *
          (NET.plazaY - NET.minY)
      : NET.plazaY +
        ((z - VILLAGE_START.z) / (depth / 2 - VILLAGE_START.z)) *
          (NET.maxY - NET.plazaY);
  return {
    x: NET.minX + ((x + width / 2) / width) * (NET.maxX - NET.minX),
    y,
  };
}

export function villageFromNetwork(point: {
  x: number;
  y: number;
}): VillagePoint {
  const { width, depth } = VILLAGE_BOUNDS;
  const x = clamp(Number.isFinite(point.x) ? point.x : 50, NET.minX, NET.maxX);
  const y = clamp(
    Number.isFinite(point.y) ? point.y : NET.plazaY,
    NET.minY,
    NET.maxY,
  );
  const z =
    y <= NET.plazaY
      ? -depth / 2 +
        ((y - NET.minY) / (NET.plazaY - NET.minY)) *
          (VILLAGE_START.z + depth / 2)
      : VILLAGE_START.z +
        ((y - NET.plazaY) / (NET.maxY - NET.plazaY)) *
          (depth / 2 - VILLAGE_START.z);
  return {
    x: ((x - NET.minX) / (NET.maxX - NET.minX)) * width - width / 2,
    z,
  };
}
