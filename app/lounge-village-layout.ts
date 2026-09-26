import { KARCHIVE_COLLIDERS } from './lounge-village-karchive-layout.ts';
import { slideSubstep } from './lounge-walk-slide.ts';

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

/**
 * VILL-2 (2026-09-26): the valley grew from 80 × 60 to 96 × 76. The resident
 * row moved 8 north so every friend has a front-yard farm between the door
 * and the lane, and the new margins hold the fishing spots (waterfall pool,
 * lake dock, upstream rapids, beach rocks, night harbor).
 */
export const VILLAGE_BOUNDS = { width: 96, depth: 76, radius: 0.35 } as const;
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
    point: { x: 0, z: -34 },
    color: '#547552',
  },
  {
    id: 'north-falls',
    name: '폭포 소',
    description: '북서쪽 바위 절벽 아래 물보라 이는 소',
    point: { x: -36.2, z: -31.2 },
    color: '#5f8f9c',
  },
  {
    id: 'east-lake',
    name: '호숫가 선착장',
    description: '북동쪽 조용한 호수와 나무 선착장',
    point: { x: 31, z: -26 },
    color: '#4f8aa6',
  },
  {
    id: 'south-beach',
    name: '남쪽 해변',
    description: '모래사장과 갯바위, 밤에 불 켜지는 항구',
    point: { x: 8, z: 33.2 },
    color: '#c9a86a',
  },
] as const;

export const VILLAGE_SCENIC_TREES = [
  { x: -30, z: -35.4, radius: 0.9, scale: 0.92 },
  { x: -20, z: -36, radius: 0.85, scale: 0.86 },
  { x: 20, z: -36, radius: 0.85, scale: 0.86 },
  { x: 30, z: -35.4, radius: 0.9, scale: 0.92 },
  { x: -44, z: -12, radius: 1, scale: 1.1 },
  { x: -45, z: 2, radius: 0.9, scale: 1 },
  { x: 44.5, z: -8, radius: 1, scale: 1.1 },
  { x: 44, z: 6, radius: 0.9, scale: 0.98 },
  { x: -44, z: 24, radius: 0.9, scale: 1 },
  { x: -38, z: -23, radius: 1.05, scale: 1.15 },
  { x: -38, z: -16, radius: 0.85, scale: 0.95 },
  { x: -38, z: 22, radius: 1, scale: 1.1 },
  { x: 42.5, z: -20.5, radius: 1.05, scale: 1.15 },
  { x: 38, z: -15, radius: 0.85, scale: 0.95 },
  { x: 38, z: 22, radius: 1, scale: 1.1 },
  { x: -20, z: 27, radius: 0.85, scale: 0.9 },
  { x: -14, z: 28, radius: 0.8, scale: 0.84 },
  { x: 18, z: 27, radius: 0.85, scale: 0.9 },
  { x: 24, z: 26, radius: 0.8, scale: 0.86 },
] as const;

const homeNames = ['도원', '강재', '민서', '승준', '민재', '재민', '호현'];
/** Every home stands in one row; its front yard (farm) fills the strip down to the lane. */
export const VILLAGE_HOME_ROW_Z = -22;
const homePositions: readonly VillagePoint[] = [
  { x: -14, z: VILLAGE_HOME_ROW_Z },
  { x: -7, z: VILLAGE_HOME_ROW_Z },
  { x: 0, z: VILLAGE_HOME_ROW_Z },
  { x: 7, z: VILLAGE_HOME_ROW_Z },
  { x: 14, z: VILLAGE_HOME_ROW_Z },
  { x: -23.2, z: VILLAGE_HOME_ROW_Z },
  { x: 23.2, z: VILLAGE_HOME_ROW_Z },
];
// The five middle houses alternate the two narrower models; the wide
// courtyard houses close the row at both ends.
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

/* ------------------------------------------------------------ farm yards */

/** One raised plot is PLOT_SIZE square; a bed frame holds 3 × 2 plots. */
export const PLOT_SIZE = 0.72;
export const PLOT_GAP = 0.1;
/** Frame rim around the plots (each side). */
export const BED_RIM = 0.12;
export const BED_COLS = 3;
export const BED_ROWS = 2;
const BED_W = BED_COLS * PLOT_SIZE + (BED_COLS - 1) * PLOT_GAP + 2 * BED_RIM;
const BED_D = BED_ROWS * PLOT_SIZE + (BED_ROWS - 1) * PLOT_GAP + 2 * BED_RIM;
/** The lane in front of the yards and the picket fence that closes them (gates at each path). */
export const VILLAGE_LANE_Z = -9;
export const YARD_FENCE_Z = -10.35;
export const YARD_GATE_HALF = 0.85;
export type YardRect = { x: number; z: number; w: number; d: number };
/**
 * A friend's front-yard farm: two 3 × 2 bed frames beside the path from the
 * door to the gate (plots 0–5 in the front bed, 6–11 in the back bed, which
 * stays fallow until the farm is expanded), a well and a name sign at the
 * gate. Yards are bounded by the house front, the lane fence and the midpoints
 * to the neighbours.
 */
export type FarmYard = {
  actor: number;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** Door → gate path (x) through the yard. */
  pathX: number;
  /** [front bed (plots 0–5), back bed (plots 6–11)]. */
  beds: readonly [YardRect, YardRect];
  well: VillagePoint;
  sign: VillagePoint;
  /**
   * Open ground east of the front bed, kept free for a scarecrow or another
   * yard prop (kArchive slot; nothing stands there yet, so no collider).
   */
  scarecrow: VillagePoint;
};
export const VILLAGE_YARDS: readonly FarmYard[] = (() => {
  const homes = VILLAGE_PLACES.filter((p) => p.kind === 'home').sort((a, b) => a.x - b.x);
  return homes.map((home, i): FarmYard => {
    const prev = homes[i - 1],
      next = homes[i + 1];
    const x0 = round(prev ? (prev.x + home.x) / 2 : home.x - home.width / 2),
      x1 = round(next ? (next.x + home.x) / 2 : home.x + home.width / 2);
    const pathX = home.entry.x,
      bedX = round(pathX + 0.75 + BED_W / 2),
      front = home.z + home.depth / 2;
    const bed = (z: number): YardRect => ({ x: bedX, z, w: round(BED_W), d: round(BED_D) });
    return {
      actor: home.actor!,
      x0,
      x1,
      z0: round(front),
      z1: YARD_FENCE_Z,
      pathX,
      beds: [bed(-13.9), bed(-17)],
      well: { x: round(pathX - 1.5), z: -11.9 },
      sign: { x: round(pathX + YARD_GATE_HALF + 0.12), z: YARD_FENCE_Z },
      scarecrow: { x: round(Math.min(x1 - 0.5, bedX + BED_W / 2 + 0.45)), z: -12.2 },
    };
  });
})();
export const villageYard = (actor: number) => VILLAGE_YARDS.find((y) => y.actor === actor) ?? null;
/**
 * Centre of plot `index` (0–11) in a yard: row-major from the back-left of
 * the front bed (0–5), then the back bed (6–11).
 */
export function yardPlotCenter(yard: FarmYard, index: number): VillagePoint {
  const bed = yard.beds[index < 6 ? 0 : 1],
    i = index % 6,
    col = i % BED_COLS,
    row = Math.floor(i / BED_COLS),
    step = PLOT_SIZE + PLOT_GAP;
  return {
    x: round(bed.x + (col - (BED_COLS - 1) / 2) * step),
    z: round(bed.z + (row - (BED_ROWS - 1) / 2) * step),
  };
}

export const VILLAGE_TERRACE = {
  id: 'terrace',
  x: -8,
  z: 8,
  width: 5,
  depth: 3,
} as const;
export const VILLAGE_ORCHARD: readonly VillagePoint[] = [
  { x: -31, z: -6 },
  { x: -10, z: -27.1 },
  { x: 10, z: -27.1 },
  { x: 30.6, z: -13 },
  { x: 8, z: 12 },
  { x: -36, z: -5 },
  { x: -36, z: 5 },
  { x: -36, z: 14 },
];
// VILL-2: 0.6 narrower so a walkable gap (not a notch) separates it from the casino.
export const VILLAGE_FARMLAND = {
  id: 'farmland',
  x: 8.45,
  z: 6.5,
  width: 4.4,
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

/**
 * Life expansion (LIFE-B) places. The pond and the pier are fishing spots
 * (the river is the third), the museum pavilion stands west of the plaza
 * (toward the hall), the notice board south-east of the fountain holds the
 * village bundles, and the greenhouse
 * frame on the river's north bank gets its glass once the 'greenhouse' bundle is
 * done. All are built from primitives in lounge-village-season-3d.ts.
 */
export const VILLAGE_POND = { id: 'pond', name: '연못', x: -34, z: -15, radius: 2.6 } as const;
/** Sea pier off the east edge; fishing stands at its root (x ≤ 47.6). */
export const VILLAGE_PIER = { id: 'pier', name: '동쪽 바다 데크', x: 47, z: 24, width: 1.5 } as const;

/*
 * VILL-2 fishing spots. Each water body is one convex solid (or a disc
 * bitten into the island edge) so walking around it never wedges.
 */
/** 폭포 소: a pool bitten into the north-west edge under a rock cliff (the cliff stands beyond the edge). */
export const VILLAGE_FALLS = { id: 'falls', name: '폭포 소', x: -40, z: -36.4, radius: 4 } as const;
/** 호숫가 선착장: a round lake in the north-east; the dock reaches in from its west shore. */
export const VILLAGE_LAKE = { id: 'lake', name: '호수', x: 39.5, z: -26, radius: 4, dockZ: -26 } as const;
/** 윗물 여울: the river's upstream (west) stretch, past the last bridge, runs over rocks. */
export const VILLAGE_RAPIDS = { id: 'rapids', name: '윗물 여울', x0: -48, x1: -35 } as const;
/** South coast: a sand beach band, 갯바위 (a rock heap on the shore) and the night harbor dock. */
export const VILLAGE_BEACH = { z0: 31.2 } as const;
export const VILLAGE_ROCKS = { id: 'rocks', name: '갯바위', x: -19, z: 37.6, radius: 1.5 } as const;
export const VILLAGE_HARBOR = { id: 'harbor', name: '밤 항구', x: 36, z: 38, width: 1.6, length: 6 } as const;
// Museum and greenhouse footprints follow their kArchive models
// (lounge-village-karchive-layout.ts: KARCHIVE_MUSEUM, KARCHIVE_GREENHOUSE).
export const VILLAGE_MUSEUM = {
  id: 'museum',
  name: '마을 박물관',
  x: -9.2,
  z: 1.5,
  width: 2.6,
  depth: 2.91,
} as const;
export const VILLAGE_BOARD = {
  id: 'board',
  name: '마을 게시판',
  x: 4.4,
  z: 4.8,
  width: 1.4,
  depth: 0.3,
} as const;
export const VILLAGE_GREENHOUSE = {
  id: 'greenhouse',
  name: '마을 온실',
  x: -10,
  z: 12.6,
  width: 3.2,
  depth: 2.35,
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
    z: -35.2,
    width: 3,
    depth: 2.5,
    height: 1.4,
  },
  {
    // Beside (not on) the boardwalk mouth so its 1.9-wide deck stays open.
    id: 'eastLantern',
    model: 'gardenLantern',
    x: 28.9,
    z: -2.5,
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
// Each door path runs through the friend's yard and out of its gate to the lane.
const homeSpurs: VillagePathSegment[] = VILLAGE_PLACES.filter(
  (place) => place.kind === 'home',
).map((place) => [place.entry.x, place.entry.z - 0.4, place.entry.x, VILLAGE_LANE_Z, 1.3] as const);
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
  [27, -1, 27, -9, 1.4],
  [28.5, -9, 28.5, -33, 1.4],
  [28.5, -33, 0, -33, 1.4],
  [27, -5, 29, -5, 1.45],
  // The west perimeter mirrors it past the pond (VILL-2).
  [0, -33, -28.5, -33, 1.4],
  [-28.5, -33, -28.5, -9, 1.4],
  [-27, -9, -27, 10, 1.4],
  // The yard lane runs the whole row and meets both perimeters.
  [14, -9, 28.5, -9, 1.3],
  [-28.5, -9, -15.2, -9, 1.5],
  // New fishing spots: waterfall pool, lake dock, upstream rapids, sea pier,
  // and the south beach promenade to the rocks and the night harbor.
  [-28.5, -33, -36.6, -32.6, 1.3],
  [28.5, -26, 34.6, -26, 1.3],
  [-27, 12.6, -40.6, 12.6, 1.2],
  [27, 17.5, 31, 24, 1.3],
  [31, 24, 46.6, 24, 1.3],
  [5, 24, 5, 33.4, 1.3],
  [-8, 24, -18, 33.4, 1.2],
  [-19, 33.4, 30, 33.4, 1.3],
  [-19, 33.4, -19, 35.2, 1.2],
  [30, 33.4, 35.9, 36.9, 1.3],
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
  // The market walk and its east twin join the plaza south of the fountain.
  [-13.5, -1.1, -7, -1.1, 1.5],
  [13.5, -1.1, 7, -1.1, 1.5],
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
  | 'rail'
  /** VILL-2 yard well (pump and trough); drawn by the life layer. */
  | 'well';
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
    [-24.5, -28, 1.2],
    [-31.5, -9.8, 0.9],
    [-25.3, -1.8, 1.2],
    [-22, 3, 0.95],
    [-23.5, 6.8, 1.1],
    [-22, 18, 0.95],
    [31, -17.5, 1.1],
    [31.6, -21.4, 0.92],
    [25.3, -1.8, 1.16],
    [22, 3, 0.95],
    [23.5, 6.8, 1.1],
    [22, 18, 0.92],
    [-18, -27.6, 0.82],
    [-3.5, -27.6, 0.72],
    [4.5, -27.6, 0.78],
    [13, -27.8, 0.75],
    [18, -27.6, 0.8],
    // VILL-2: the lots the side cottages left, and the new margins.
    [-21, -4.2, 1.0],
    [21, -4.2, 0.96],
    [-37, -21, 1.05],
    [-43, -24, 0.9],
    [34.5, -12.5, 1.0],
    [44, -18, 0.92],
    [42, -34, 0.9],
    [-42.5, 30, 0.95],
    [-33, 28.5, 0.85],
    [42.5, 30.5, 0.9],
    [-18, 12.3, 0.76],
    [-14, 12.3, 0.72],
    [14, 12.3, 0.74],
    [18, 12.3, 0.78],
    [-19, 0.3, 0.76],
    [19, 0.3, 0.72],
  ] as const
).forEach(([x, z, s], i) => addTree(x, z, s, i));
VILLAGE_SCENIC_TREES.forEach(({ x, z, scale }, i) => addTree(x, z, scale, i + 3));

// Lamps light the plaza, bridge heads and districts; none stand on a route.
(
  [
    [-5.25, -1.1],
    [5.25, 1.1],
    [-2.4, 3.4],
    [2.4, 3.4],
    [-29, 7],
    // Midway between the camp table and the stage (no pocket either side).
    [9.4, 21.3],
    [30, -8],
    [36, -8],
    [-5.2, 11.6],
    [5.2, 11.6],
  ] as const
).forEach(([x, z], i) =>
  decor.push({ id: `lamp-${i}`, kind: 'lamp', x, z, collider: circle(0.15) }),
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
    [-21.5, 8.4],
    [-19.6, 11.4],
    [21.5, 8.4],
    [19.6, 11.4],
    [-13.2, 0.6],
    [13.2, 0.6],
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
    [0, -36, 14, 5],
    [-36.5, -27.5, 10, 2],
    [34, -21.5, 10, 4],
    [-4, 30, 9, 1],
    [22, 29.6, 9, 3],
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
      x: place.entry.x - 1.2,
      // A walker fits between the post and the wall (no dead-end niche).
      z: front + 1.0,
      home,
      // The post is thin; the box sits above head height.
      collider: circle(0.14),
    },
    {
      id: `hydrangea-${home}`,
      kind: 'hydrangea',
      x: place.entry.x + 1.5,
      z: front + 0.55,
      home,
      // Knee-high: walkable like the flower beds (a collider here left a
      // narrow niche against the wall that caught walkers).
      collider: null,
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

// Yard fronts: one picket run along the lane, open at every yard's gate, and
// a well beside each gate. (The fence is a straight wall with free ends and
// the well stands clear of everything, so neither leaves a pocket.)
{
  const gates = VILLAGE_YARDS.map((y) => y.pathX).sort((a, b) => a - b);
  const start = VILLAGE_YARDS[0].x0,
    end = VILLAGE_YARDS[VILLAGE_YARDS.length - 1].x1;
  const cuts = [start, ...gates.flatMap((g) => [g - YARD_GATE_HALF, g + YARD_GATE_HALF]), end];
  for (let i = 0; i < cuts.length; i += 2) {
    const a = cuts[i],
      b = cuts[i + 1];
    if (b - a < 0.3) continue;
    decor.push({
      id: `yard-fence-${i / 2}`,
      kind: 'fence',
      x: round((a + b) / 2),
      z: YARD_FENCE_Z,
      collider: boxCollider(round(b - a), 0.14),
    });
  }
  for (const yard of VILLAGE_YARDS)
    decor.push({
      id: `well-${yard.actor}`,
      kind: 'well',
      x: yard.well.x,
      z: yard.well.z,
      home: yard.actor,
      collider: circle(0.32),
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
/**
 * Fill the unusable slivers beside buildings. Two footprints less than
 * NARROW_SLOT apart side by side (the terraced homes, the casino and the
 * farm plot) leave a slot a walker cannot pass but can wedge into; the slot
 * is closed flush with their fronts. A garden fence along an outer side wall
 * becomes part of that wall over the house's whole depth, so walking along
 * the wall never catches on the fence's end.
 */
const NARROW_SLOT = 1.3;
const SIDE_FENCE = 0.25;
const slotFillers: SolidCollider[] = (() => {
  const rects = [
    ...VILLAGE_PLACES.map((p) => ({ id: p.id, home: p.kind === 'home', x: p.x, z: p.z, hw: p.width / 2, hd: p.depth / 2 })),
    { id: VILLAGE_FARMLAND.id, home: false, x: VILLAGE_FARMLAND.x, z: VILLAGE_FARMLAND.z, hw: VILLAGE_FARMLAND.width / 2, hd: VILLAGE_FARMLAND.depth / 2 },
  ];
  const out: SolidCollider[] = [];
  const add = (id: string, x0: number, x1: number, z0: number, z1: number) =>
    out.push({ id, x: (x0 + x1) / 2, z: (z0 + z1) / 2, collider: boxCollider(x1 - x0, z1 - z0), rotation: 0 });
  for (const a of rects)
    for (const side of [-1, 1]) {
      const wall = a.x + side * a.hw;
      const neighbour = rects.find(
        (b) =>
          b !== a &&
          (b.x - a.x) * side > 0 &&
          Math.abs(b.x - side * b.hw - wall) < NARROW_SLOT &&
          b.z - b.hd < a.z + a.hd &&
          b.z + b.hd > a.z - a.hd,
      );
      if (neighbour) {
        // Once per pair: from the left footprint.
        if (side === 1)
          add(
            `slot-${a.id}-${neighbour.id}`,
            wall,
            neighbour.x - neighbour.hw,
            Math.max(a.z - a.hd, neighbour.z - neighbour.hd),
            Math.min(a.z + a.hd, neighbour.z + neighbour.hd),
          );
      } else if (a.home)
        add(
          `fence-side-${a.id}-${side}`,
          Math.min(wall, wall + side * SIDE_FENCE),
          Math.max(wall, wall + side * SIDE_FENCE),
          a.z - a.hd,
          a.z + a.hd,
        );
    }
  return out;
})();

/* ------------------------------------------------------------ valley props (VILL-2 kArchive set) */

/** Measured GLB bounds (model units): w, h, d and the lowest y (0 = origin at the base). */
export const VALLEY_MODEL_SIZE = {
  waterPump: { w: 0.441, h: 0.552, d: 0.85, y0: 0 },
  picketGate: { w: 1.054, h: 0.601, d: 0.12, y0: 0 },
  toolShed: { w: 3.2, h: 2.927, d: 2.461, y0: 0 },
  onggi: { w: 1.805, h: 2, d: 1.826, y0: 0 },
  produceCrate: { w: 0.563, h: 0.317, d: 0.4, y0: 0 },
  firewood: { w: 2, h: 1.56, d: 1.308, y0: 0 },
  scarecrow: { w: 1.512, h: 1.901, d: 1.238, y0: -0.951 },
  campChair: { w: 0.722, h: 0.742, d: 0.8, y0: 0 },
  volcanicRock: { w: 1.2, h: 0.481, d: 1.034, y0: 0 },
  graniteBoulder: { w: 1.2, h: 0.542, d: 1.078, y0: 0 },
  cattail: { w: 1.2, h: 1.068, d: 0.84, y0: 0 },
  hanjiLantern: { w: 1.001, h: 2, d: 0.99, y0: 0 },
  valleyRocks: { w: 1.675, h: 0.571, d: 1.902, y0: -0.286 },
  ropeFence: { w: 1.011, h: 1.2, d: 0.18, y0: 0 },
  broadleafTree: { w: 1.8, h: 1.906, d: 1.079, y0: 0 },
  smallPine: { w: 1.2, h: 1.612, d: 1.124, y0: 0 },
  meadowGrass: { w: 1.2, h: 0.409, d: 0.967, y0: 0 },
  shrub: { w: 1.018, h: 0.495, d: 0.65, y0: 0 },
  treeStump: { w: 1.2, h: 0.377, d: 1.171, y0: 0 },
  cobbleWall: { w: 1, h: 1.2, d: 0.24, y0: 0 },
  pavilion: { w: 1.758, h: 1.9, d: 1.773, y0: -0.951 },
  stonePaver: { w: 1, h: 0.08, d: 1, y0: 0 },
} as const;
export type ValleyModelKey = keyof typeof VALLEY_MODEL_SIZE;
/**
 * Where a valley prop shows: always, only for a friend's farm size, or in a
 * fishing zone (those load when the player comes near).
 */
export type ValleyZone = 'village' | 'falls' | 'lake' | 'rapids' | 'rocks' | 'harbor' | 'bridge' | 'sea';
export type ValleyProp = {
  model: ValleyModelKey;
  x: number;
  z: number;
  /** Uniform scale, or [x, y, z]. */
  s: number | readonly [number, number, number];
  rot?: number;
  /** Extra height (e.g. on a deck). */
  y?: number;
  zone: ValleyZone;
  /** Shown only when this friend's farm has at least `plots` plots. */
  yard?: { actor: number; plots: 9 | 12 };
  collider?: VillageCollider;
};
/** 팔각정 by the lake: a landmark you walk around (solid octagon). */
export const VILLAGE_PAVILION = { x: 34.2, z: -19.8, scale: 1.9, radius: 1.5 } as const;
/** Dry-stone wall behind the homes, open at three alley gaps. */
export const VILLAGE_STONE_WALL = { z: -29.5, x0: -26, x1: 26, gaps: [-13.5, 0, 13.5], gapHalf: 1.1, scale: 0.6 } as const;

const valleyProps: ValleyProp[] = [];
// Friends' yards: pump by the well, an open gate leaf, a jar terrace (장독대),
// firewood, and — for bigger farms — a produce crate (9+), a tool shed and a
// scarecrow (12). Knee-high props and the size-gated ones are walkable
// decoration (no collider), like the flowers.
for (const yard of VILLAGE_YARDS) {
  const west = yard.pathX - yard.x0;
  valleyProps.push(
    { model: 'waterPump', x: yard.well.x, z: yard.well.z, s: 1.1, rot: Math.PI / 2, zone: 'village' },
    { model: 'picketGate', x: round(yard.pathX - YARD_GATE_HALF - 0.04), z: round(YARD_FENCE_Z - 0.45), s: 0.78, rot: Math.PI / 2, zone: 'village' },
    { model: 'stonePaver', x: yard.pathX, z: YARD_FENCE_Z, s: [1.2, 1, 1.2], y: 0.09, zone: 'village' },
  );
  const jx = round(yard.pathX - Math.min(1.5, west - 0.7));
  for (const [dx, dz, sc] of [[0, 0, 0.3], [0.45, 0.25, 0.23], [-0.2, 0.5, 0.2]] as const)
    valleyProps.push({ model: 'onggi', x: round(jx + dx), z: round(-15.6 + dz), s: sc, rot: dx * 3, zone: 'village' });
  valleyProps.push({ model: 'firewood', x: round(yard.x1 - 0.75), z: round(yard.z0 + 0.7), s: 0.35, zone: 'village' });
  const bed = yard.beds[0];
  valleyProps.push(
    { model: 'produceCrate', x: round(bed.x + bed.w / 2 + 0.4), z: -13.4, s: 1.2, rot: 0.2, zone: 'village', yard: { actor: yard.actor, plots: 9 } },
    { model: 'toolShed', x: round(yard.pathX - Math.min(1.55, west / 2 + 0.3)), z: -13.3, s: 0.45, rot: Math.PI / 2, zone: 'village', yard: { actor: yard.actor, plots: 12 } },
    { model: 'scarecrow', x: yard.scarecrow.x, z: yard.scarecrow.z, s: 0.7, rot: -0.3, zone: 'village', yard: { actor: yard.actor, plots: 12 } },
  );
}
// Main green: stone pavers down the plaza walk to the middle bridge.
for (let z = 3.6; z <= 12.4; z += 1.25) valleyProps.push({ model: 'stonePaver', x: 0, z: round(z), s: [1.2, 1, 1.2], y: 0.09, zone: 'village' });
// Stone-wall alley behind the homes (solid runs, open gaps).
{
  const w = VILLAGE_STONE_WALL,
    seg = VALLEY_MODEL_SIZE.cobbleWall.w * w.scale;
  const cuts = [w.x0, ...w.gaps.flatMap((g) => [g - w.gapHalf, g + w.gapHalf]), w.x1];
  for (let i = 0; i < cuts.length; i += 2) {
    const a = cuts[i],
      b = cuts[i + 1],
      n = Math.max(1, Math.round((b - a) / seg)),
      step = (b - a) / n;
    for (let k = 0; k < n; k++)
      valleyProps.push({ model: 'cobbleWall', x: round(a + step * (k + 0.5)), z: w.z, s: [step, w.scale, w.scale], zone: 'village' });
    valleyProps.push({
      model: 'cobbleWall',
      x: round((a + b) / 2),
      z: w.z,
      s: 0,
      zone: 'village',
      collider: boxCollider(round(b - a), 0.2),
    });
  }
}
valleyProps.push({ model: 'pavilion', x: VILLAGE_PAVILION.x, z: VILLAGE_PAVILION.z, s: VILLAGE_PAVILION.scale, rot: Math.PI / 8, zone: 'village', collider: circle(VILLAGE_PAVILION.radius) });
// Fishing spots (zone props load when the player comes near).
{
  const mid = (VILLAGE_RIVER.minZ + VILLAGE_RIVER.maxZ) / 2;
  for (let i = 0; i < 8; i++)
    valleyProps.push({ model: 'graniteBoulder', x: round(VILLAGE_RAPIDS.x0 + 1.6 + i * 1.5), z: round(mid + (i % 2 ? 0.45 : -0.4)), s: 0.55 + (i % 3) * 0.12, rot: i * 1.3, y: -0.05, zone: 'rapids' });
  const f = VILLAGE_FALLS;
  valleyProps.push({ model: 'valleyRocks', x: f.x, z: round(-VILLAGE_BOUNDS.depth / 2 + 0.2), s: 2.4, zone: 'falls' });
  for (const a of [0.35, 1.2, 2.75])
    valleyProps.push({ model: 'graniteBoulder', x: round(f.x + Math.cos(a) * 3.5), z: round(f.z + Math.sin(a) * 3.5), s: 0.8, rot: a * 2, y: -0.08, zone: 'falls' });
  const lake = VILLAGE_LAKE;
  for (let x = lake.x - lake.radius + 0.5; x <= lake.x - lake.radius + 2.5; x += 0.8)
    for (const side of [-1, 1])
      valleyProps.push({ model: 'ropeFence', x: round(x), z: round(lake.dockZ + side * 0.68), s: 0.8, y: 0.3, zone: 'lake' });
  for (const a of [0.5, 1.1, 1.9, 4.3, 5.0, 5.7])
    valleyProps.push({ model: 'cattail', x: round(lake.x + Math.cos(a) * (lake.radius - 0.45)), z: round(lake.z + Math.sin(a) * (lake.radius - 0.45)), s: 0.75, rot: a, zone: 'lake' });
  const r = VILLAGE_ROCKS;
  for (const [dx, dz, sc] of [[0.2, 0.3, 2.2], [-1.6, 1.4, 1.6], [1.8, 1.6, 1.4]] as const)
    valleyProps.push({ model: 'volcanicRock', x: round(r.x + dx), z: round(r.z + dz), s: sc, rot: dx, zone: 'rocks' });
  const h = VILLAGE_HARBOR;
  for (const dz of [0.6, 2.4, 4.2, 5.8])
    for (const side of [-1, 1])
      valleyProps.push({ model: 'hanjiLantern', x: round(h.x + side * (h.width / 2 + 0.12)), z: round(h.z + dz), s: 0.34, y: 0.34, zone: 'harbor' });
  for (const [x, z] of [[-3.8, VILLAGE_RIVER.minZ + 0.25], [3.9, VILLAGE_RIVER.maxZ - 0.25], [-4.6, VILLAGE_RIVER.maxZ - 0.3], [4.4, VILLAGE_RIVER.minZ + 0.3]] as const)
    valleyProps.push({ model: 'cattail', x, z: round(z), s: 0.6, rot: x, zone: 'bridge' });
}
/** A folding camp chair beside each fishing stand (added by the spots module's stands). */
export const VALLEY_CHAIR_OFFSET = { x: 0.95, z: -0.35 } as const;
// Nature filler for the enlarged valley (picked by scratch gen-nature.mjs from
// this layout: off routes, a walker-wide ring clear around each solid one).
const NATURE: readonly (readonly [ValleyModelKey, number, number, number, number])[] = [
  ['broadleafTree', -41.4, 24.9, 2.09, 2.14],
  ['broadleafTree', -4.1, 18.8, 1.97, 0.67],
  ['broadleafTree', -45.1, -28.9, 1.63, 2.75],
  ['broadleafTree', 19.1, 23, 1.84, 6.02],
  ['broadleafTree', -25.5, 24.6, 1.83, 3.57],
  ['broadleafTree', -41.3, -19.9, 1.74, 4.14],
  ['broadleafTree', 45.3, 2.5, 1.94, 3.84],
  ['broadleafTree', -45.3, -14.4, 1.83, 0.08],
  ['broadleafTree', 36.1, 6.7, 1.95, 4.37],
  ['broadleafTree', 35.4, 20.6, 1.89, 1.86],
  ['broadleafTree', 21, 27.4, 2.03, 2.12],
  ['broadleafTree', 40.8, 1.2, 1.63, 3.88],
  ['broadleafTree', 15.7, 26.4, 1.95, 2.77],
  ['broadleafTree', 29.2, 27.1, 1.99, 2.28],
  ['broadleafTree', -41.2, -1.8, 1.99, 3.98],
  ['broadleafTree', 23.3, -0.4, 1.8, 3.66],
  ['broadleafTree', -14.2, 23.4, 1.83, 1.24],
  ['broadleafTree', -40.8, -9.6, 1.69, 5.46],
  ['broadleafTree', 24.8, 19, 2.07, 3.16],
  ['broadleafTree', -31, -20.2, 2.03, 3.22],
  ['broadleafTree', -35.6, 21.2, 1.68, 1.72],
  ['broadleafTree', 42.2, -12.4, 2, 1.82],
  ['smallPine', 42.9, 19.8, 1.83, 4.78],
  ['smallPine', 39, 11.1, 1.68, 2.02],
  ['smallPine', -35.3, 25, 1.92, 6.15],
  ['smallPine', -42.3, 7.3, 1.92, 1.9],
  ['smallPine', 35.1, -35.6, 1.85, 3.75],
  ['smallPine', 39.2, -9.3, 1.91, 2.46],
  ['smallPine', 27.3, 23, 1.94, 0.71],
  ['smallPine', 42.7, -2.5, 1.53, 3.4],
  ['smallPine', -17.5, 27.3, 1.89, 5.2],
  ['smallPine', -34, 18.3, 1.58, 4.82],
  ['smallPine', 39.6, 27.8, 1.97, 5.28],
  ['smallPine', -14.7, 18.2, 1.83, 0.34],
  ['smallPine', 45.4, 11.1, 1.87, 4.77],
  ['smallPine', -21.4, 21.5, 1.68, 2.32],
  ['smallPine', -5.7, 29.9, 1.72, 5.91],
  ['smallPine', -38, -11.8, 1.85, 0.95],
  ['smallPine', -36.9, -0.3, 1.67, 3.33],
  ['smallPine', -24.7, 28.4, 1.82, 3.63],
  ['treeStump', 22.4, 30.1, 0.55, 2.66],
  ['treeStump', 45.2, 29.2, 0.52, 3.86],
  ['treeStump', -32.9, -21.9, 0.5, 0.75],
  ['treeStump', -36.8, -26.2, 0.51, 1.02],
  ['treeStump', 22.4, -6.2, 0.59, 0.43],
  ['treeStump', -44.8, -4.7, 0.54, 1.32],
  ['treeStump', 44, -5.7, 0.53, 2.84],
  ['treeStump', 42.9, 26.2, 0.55, 3.18],
  ['graniteBoulder', 45.7, -33.1, 1.19, 4.35],
  ['graniteBoulder', -23.9, 0.4, 1.04, 5.76],
  ['graniteBoulder', -40.5, -26.1, 0.99, 1.19],
  ['graniteBoulder', 35.2, 29.1, 1.17, 4.56],
  ['graniteBoulder', -40.3, -5.6, 0.92, 3.6],
  ['graniteBoulder', 29.4, 0, 1.03, 1.91],
  ['shrub', -3.2, 24, 1.12, 5.31],
  ['shrub', 38.2, 26.1, 1.06, 5.03],
  ['shrub', -40.2, -22.6, 1.13, 5.13],
  ['shrub', -42.3, -0.2, 1.05, 5.01],
  ['shrub', -4.5, 20.7, 1, 6.18],
  ['shrub', -28.4, 24.3, 1.26, 2.7],
  ['shrub', -32.5, -2.8, 1.09, 2.85],
  ['shrub', 8.6, 29.3, 1.04, 5.29],
  ['shrub', 45.6, -16, 1.25, 5.76],
  ['shrub', 0.9, 25.6, 1.13, 3.25],
  ['shrub', 16.2, 24, 1.02, 4.29],
  ['shrub', -35.5, 26.9, 1.21, 2.27],
  ['shrub', -43.4, -5.8, 1.28, 0.95],
  ['shrub', -42.2, -17.3, 1.21, 6.22],
  ['shrub', -23.6, -5.7, 1.27, 3.17],
  ['shrub', -43.9, -8.5, 1.11, 2.01],
  ['meadowGrass', 16.2, 22.1, 0.71, 1.01],
  ['meadowGrass', -39.7, 18.3, 0.81, 0.15],
  ['meadowGrass', 45.8, 4.8, 0.81, 3.11],
  ['meadowGrass', 32.4, -15.8, 0.68, 2.79],
  ['meadowGrass', -13.7, -34.6, 0.72, 0.23],
  ['meadowGrass', -32.6, 22, 0.8, 4.88],
  ['meadowGrass', 33, 26.5, 0.63, 3.95],
  ['meadowGrass', 28.8, 29.7, 0.78, 0.75],
  ['meadowGrass', -45.8, 6.4, 0.78, 3.52],
  ['meadowGrass', -6.2, 27.8, 0.84, 0.9],
  ['meadowGrass', 27.5, 27.2, 0.62, 1.4],
  ['meadowGrass', -43.4, -2.9, 0.7, 5.65],
  ['meadowGrass', -13.8, -26.8, 0.88, 3.81],
  ['meadowGrass', 31, 7.9, 0.71, 2.43],
  ['meadowGrass', 20.7, -31.6, 0.64, 1.25],
  ['meadowGrass', -1.5, 30.2, 0.74, 2.81],
  ['meadowGrass', -29.9, 18.9, 0.64, 3.32],
  ['meadowGrass', -7.8, 21.8, 0.85, 6.24],
  ['meadowGrass', 20, 21.6, 0.69, 5.8],
  ['meadowGrass', -43.3, -26.1, 0.7, 4.95],
  ['meadowGrass', 35.4, 26.4, 0.71, 6.03],
  ['meadowGrass', 25, -6.6, 0.63, 6.03],
  ['meadowGrass', 32.1, -32.9, 0.61, 1.01],
  ['meadowGrass', -24.6, -35.5, 0.76, 2.59],
];
for (const [model, x, z, sc, rot] of NATURE) {
  const size = VALLEY_MODEL_SIZE[model];
  const solid = model === 'broadleafTree' || model === 'smallPine' || model === 'treeStump' || model === 'graniteBoulder';
  const r = model === 'broadleafTree' ? 0.2 * sc : model === 'smallPine' ? 0.22 * sc : model === 'treeStump' ? 0.25 * sc * size.w : 0.36 * sc * size.w;
  valleyProps.push({ model, x, z, s: sc, rot, zone: 'village', ...(solid ? { collider: circle(round(r)) } : {}) });
}
/** Single source for the valley kArchive props: the layer draws them, collision uses their colliders. */
export const VILLAGE_VALLEY_PROPS: readonly ValleyProp[] = valleyProps;

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
    // Trunk only: the canopy is overhead.
    collider: circle(0.45),
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
  ...[VILLAGE_POND, VILLAGE_FALLS, VILLAGE_LAKE, VILLAGE_ROCKS].map((w) => ({
    id: w.id,
    x: w.x,
    z: w.z,
    collider: circle(w.radius),
    rotation: 0,
  })),
  // Raised bed frames in every yard (two per friend).
  ...VILLAGE_YARDS.flatMap((yard) =>
    yard.beds.map((bed, i) => ({
      id: `bed-${yard.actor}-${i}`,
      x: bed.x,
      z: bed.z,
      collider: boxCollider(bed.w, bed.d),
      rotation: 0,
    })),
  ),
  ...[VILLAGE_MUSEUM, VILLAGE_BOARD, VILLAGE_GREENHOUSE].map((b) => ({
    id: b.id,
    x: b.x,
    z: b.z,
    collider: boxCollider(b.width, b.depth),
    rotation: 0,
  })),
  // kArchive civic set: the festival stage and the pergola's four posts.
  ...KARCHIVE_COLLIDERS,
  // VILL-2 valley props with a footprint (trees, stumps, boulders, wall runs, 팔각정).
  ...VILLAGE_VALLEY_PROPS.flatMap((p, i) =>
    p.collider ? [{ id: `valley-${p.model}-${i}`, x: p.x, z: p.z, collider: p.collider, rotation: 0 }] : [],
  ),
  ...slotFillers,
];

const FOUNTAIN = { x: 0, z: 0, radius: 2 } as const;

/** Nearest solid surface: signed distance (negative inside) and its outward normal. */
type Contact = { d: number; nx: number; nz: number; small: boolean };

// Signed distance to an axis-aligned box (rounded outside its corners, so a
// walker slides around a corner instead of catching on it).
function boxDistance(dx: number, dz: number, hw: number, hd: number): number {
  const qx = Math.abs(dx) - hw,
    qz = Math.abs(dz) - hd;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0)
  );
}

// The river is solid between (and beyond) the bridges: one box per stretch.
const RIVER_STRETCHES = (() => {
  const edges = [-VILLAGE_BOUNDS.width, VILLAGE_BOUNDS.width];
  const cuts = [...VILLAGE_RIVER.bridges]
    .sort((a, b) => a.x - b.x)
    .flatMap((b) => [b.x - b.halfWidth, b.x + b.halfWidth]);
  const xs = [edges[0], ...cuts, edges[1]];
  const out: { x: number; hw: number }[] = [];
  for (let i = 0; i < xs.length; i += 2)
    out.push({ x: (xs[i] + xs[i + 1]) / 2, hw: (xs[i + 1] - xs[i]) / 2 });
  return out;
})();
const RIVER_Z = (VILLAGE_RIVER.minZ + VILLAGE_RIVER.maxZ) / 2,
  RIVER_HD = (VILLAGE_RIVER.maxZ - VILLAGE_RIVER.minZ) / 2;

/** Props small enough that walking straight into them should steer around. */
const SMALL_PROP = 0.8;

type Solid =
  | { shape: 'circle'; x: number; z: number; r: number; small: boolean }
  | {
      shape: 'box';
      x: number;
      z: number;
      hw: number;
      hd: number;
      cos: number;
      sin: number;
      small: boolean;
    };
const SOLIDS: Solid[] = [
  ...VILLAGE_PLACES.map(
    (place): Solid => ({
      shape: 'box',
      x: place.x,
      z: place.z,
      hw: place.width / 2,
      hd: place.depth / 2,
      cos: 1,
      sin: 0,
      small: false,
    }),
  ),
  ...VILLAGE_COLLIDERS.map((item): Solid => {
    const c = item.collider;
    return c.shape === 'circle'
      ? { shape: 'circle', x: item.x, z: item.z, r: c.r, small: c.r <= SMALL_PROP }
      : {
          shape: 'box',
          x: item.x,
          z: item.z,
          hw: c.w / 2,
          hd: c.d / 2,
          cos: Math.cos(item.rotation),
          sin: Math.sin(item.rotation),
          small: Math.max(c.w, c.d) <= SMALL_PROP * 2.1,
        };
  }),
  { shape: 'circle', x: FOUNTAIN.x, z: FOUNTAIN.z, r: FOUNTAIN.radius, small: false },
  ...RIVER_STRETCHES.map(
    (stretch): Solid => ({
      shape: 'box',
      x: stretch.x,
      z: RIVER_Z,
      hw: stretch.hw,
      hd: RIVER_HD,
      cos: 1,
      sin: 0,
      small: false,
    }),
  ),
];

// Spatial buckets: each cell lists the solids within REACH of it, so every
// distance below REACH (all that walking and contact need) is exact.
const CELL = 2,
  REACH = 0.6;
const CELL_COLS = Math.ceil(VILLAGE_BOUNDS.width / CELL) + 1,
  CELL_ROWS = Math.ceil(VILLAGE_BOUNDS.depth / CELL) + 1;
const cellOf = (x: number, z: number) =>
  Math.min(CELL_ROWS - 1, Math.max(0, Math.floor((z + VILLAGE_BOUNDS.depth / 2) / CELL))) *
    CELL_COLS +
  Math.min(CELL_COLS - 1, Math.max(0, Math.floor((x + VILLAGE_BOUNDS.width / 2) / CELL)));
const BUCKETS: Solid[][] = Array.from({ length: CELL_COLS * CELL_ROWS }, () => []);
for (const solid of SOLIDS) {
  const extent =
    solid.shape === 'circle' ? solid.r : Math.hypot(solid.hw, solid.hd);
  const x0 = solid.x - extent - REACH,
    x1 = solid.x + extent + REACH,
    z0 = solid.z - extent - REACH,
    z1 = solid.z + extent + REACH;
  for (let z = z0; z < z1 + CELL; z += CELL)
    for (let x = x0; x < x1 + CELL; x += CELL) {
      const bucket = BUCKETS[cellOf(Math.min(x, x1), Math.min(z, z1))];
      if (!bucket.includes(solid)) bucket.push(solid);
    }
}

function solidDistance(x: number, z: number): { d: number; small: boolean } {
  const { width, depth } = VILLAGE_BOUNDS;
  let d = Math.min(width / 2 - Math.abs(x), depth / 2 - Math.abs(z), REACH),
    small = false;
  for (const solid of BUCKETS[cellOf(x, z)]) {
    let value: number;
    if (solid.shape === 'circle')
      value = Math.hypot(x - solid.x, z - solid.z) - solid.r;
    else {
      const dx = x - solid.x,
        dz = z - solid.z;
      value = boxDistance(
        dx * solid.cos - dz * solid.sin,
        dx * solid.sin + dz * solid.cos,
        solid.hw,
        solid.hd,
      );
    }
    if (value < d) {
      d = value;
      small = solid.small;
    }
  }
  return { d, small };
}

function contactAt(point: VillagePoint): Contact {
  const e = 0.002;
  const here = solidDistance(point.x, point.z);
  const gx =
      solidDistance(point.x + e, point.z).d -
      solidDistance(point.x - e, point.z).d,
    gz =
      solidDistance(point.x, point.z + e).d -
      solidDistance(point.x, point.z - e).d,
    length = Math.hypot(gx, gz) || 1;
  return { d: here.d, nx: gx / length, nz: gz / length, small: here.small };
}

export function villageCanWalk(point: VillagePoint): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return false;
  return solidDistance(point.x, point.z).d >= VILLAGE_BOUNDS.radius;
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

/** Pushes a slightly overlapping point back out along the surface normal. */
function pushOut(point: VillagePoint): VillagePoint | null {
  let p = point;
  for (let i = 0; i < 4; i++) {
    const c = contactAt(p);
    if (c.d >= VILLAGE_BOUNDS.radius) return p;
    const depth = VILLAGE_BOUNDS.radius - c.d + 1e-4;
    p = { x: p.x + c.nx * depth, z: p.z + c.nz * depth };
  }
  return villageCanWalk(p) ? p : null;
}

/**
 * Collide-and-slide: each substep moves, then resolves any overlap by pushing
 * out along the obstacle's normal, which leaves the tangential part of the
 * move (sliding along walls and around round props). Walking almost straight
 * into a small prop (lamp, tree trunk, mailbox) steers around it instead of
 * stopping dead; large walls and water still stop you.
 */
export function villageStep(
  from: VillagePoint,
  dx: number,
  dz: number,
): VillagePoint {
  if (!villageCanWalk(from) || !Number.isFinite(dx) || !Number.isFinite(dz))
    return from;
  const distance = Math.hypot(dx, dz);
  if (distance > 20) return from;
  const count = Math.max(1, Math.ceil(distance / 0.06));
  const sx = dx / count,
    sz = dz / count,
    stepLength = distance / count;
  let point = { ...from };
  for (let i = 0; i < count; i++) {
    const next = { x: point.x + sx, z: point.z + sz };
    if (villageCanWalk(next)) {
      point = next;
      continue;
    }
    let best: VillagePoint | null = null,
      progress = -Infinity;
    const consider = (candidate: VillagePoint | null) => {
      if (!candidate) return;
      const mx = candidate.x - point.x,
        mz = candidate.z - point.z;
      // Never move farther than the step itself (no pops through thin props).
      if (Math.hypot(mx, mz) > stepLength * 1.05 + 1e-6) return;
      const along = mx * sx + mz * sz;
      if (along > progress) {
        progress = along;
        best = candidate;
      }
    };
    const slid = pushOut(next);
    consider(slid);
    const contact = contactAt(next);
    // Head-on into a small prop: the pushed-out point barely advances, so
    // walk along the prop's tangent (on the side the walker leans toward).
    if (
      contact.small &&
      (progress < stepLength * stepLength * 0.5 || !best)
    ) {
      let tx = -contact.nz,
        tz = contact.nx;
      if (tx * sx + tz * sz < 0 || (tx * sx + tz * sz === 0 && tx < 0)) {
        tx = -tx;
        tz = -tz;
      }
      const around = pushOut({
        x: point.x + tx * stepLength * 0.9,
        z: point.z + tz * stepLength * 0.9,
      });
      if (around) {
        best = around;
        progress = (around.x - point.x) * sx + (around.z - point.z) * sz;
      }
    }
    if (progress < stepLength * stepLength * 0.3) {
      // Wedged between a wall and a prop (or two props): steer out along the
      // least-turned free direction, like a player easing off the key.
      const out = slideSubstep(point.x, point.z, sx, sz, (x, z) =>
        villageCanWalk({ x, z }),
      );
      if (out) consider({ x: out[0], z: out[1] });
    }
    if (!best || progress < -1e-9) break;
    point = best;
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
    // Diagonal steps must not cut a blocked corner (straight steps never do,
    // so one-cell-wide aisles between farm beds stay connected).
    if (
      nextX !== x &&
      Math.abs(offset) !== COLS &&
      Math.abs(offset) !== 1 &&
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
