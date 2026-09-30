// Where every resident is, as a pure function of the KST clock
// (design-village-2x-npcs.md §2 "NPC가 맵을 오가는 방식", §4 "일과표"):
//
//   npcSpot(id, now) → { area, x, z, facing, walking, activity, label }
//
// No server row, no realtime: every friend's screen computes the same spot
// for the same instant. A day is a list of "be at place P from hh:mm"
// segments picked by weekday, weather (lounge-calendar.ts weatherOf), market
// day (Sunday, 일요 장터) and festival days. Changing place is a walk:
// along the area's walking path to its exit, a hidden transit (~20 s through
// a district gate, a few seconds through a door), then from the next area's
// entrance on to the place. Places are named spots that tests check are
// walkable; paths come from the areas' own walkers (villagePath for the hub,
// regionWalk for 시장 거리, interiorPath for the tavern).
//
// Hidden areas are places a resident can be but nobody can see yet: their
// homes and the library up the hillside, the harbor district, the counter
// rooms of 부동산·가구점. The eight residents who already work indoors stay at
// their posts (their scenes draw them); 문 사장 and 결 목수 take an evening
// walk through the hub.
import { kstDay } from './lounge-economy.ts';
import { holidaysOn, weatherOf, weekdayOf, hash32 } from './lounge-calendar.ts';
import { VILLAGE_PLACES, villagePath, villageCanWalk, VILLAGE_BOARD, VILLAGE_MUSEUM, VILLAGE_PAVILION, VILLAGE_HARBOR, type VillagePoint } from './lounge-village-layout.ts';
import { walkableNear } from './lounge-village-life.ts';
import { DISTRICTS } from './lounge-districts.ts';
import { MARKET_SPOTS } from './lounge-market-layout.ts';
import { regionWalk } from './lounge-areas.ts';
import { INTERIOR_DOOR, interiorCanWalk, interiorPath, interiorToWorld, worldToInterior, TAVERN_HOST_AT } from './lounge-interior-layout.ts';
import { CASINO_LENDER_SPOT } from './lounge-casino-lender.ts';
import { BANKER_SPOT } from './lounge-bank-layout.ts';
import { SALON_STYLIST_SPOT } from './lounge-salon-layout.ts';
import { NPC_IDS, NPCS, type NpcId } from './lounge-npc-data.ts';
import type { WalkPoint } from './lounge-walk-world.ts';
import { josa } from './lounge-text.ts';

const MIN = 60_000,
  HOUR = 60 * MIN,
  DAY = 24 * HOUR,
  KST = 9 * HOUR;
/** Resident walking speed (world units / s); friends walk 5.2. */
export const NPC_WALK_SPEED = 2.1;
/** Hidden time through a district gate / a building door. */
export const GATE_TRANSIT_MS = 20_000;
export const DOOR_TRANSIT_MS = 5_000;

/** Areas a resident can be in. Visible ones have a scene; hidden ones are "off screen". */
export type NpcArea =
  | 'village'
  | 'market'
  | 'tavern'
  | 'casino'
  | 'lounge'
  | 'bank'
  | 'salon'
  | 'realty'
  | 'furniture'
  | 'home'
  | 'library'
  | 'harbor';
/** Where residents are drawn walking about (the rest is drawn by its own scene or not at all). */
export const NPC_WALK_AREAS: readonly NpcArea[] = ['village', 'market', 'tavern'];
export type NpcActivity =
  | 'work'
  | 'stall'
  | 'rest'
  | 'nap'
  | 'eat'
  | 'read'
  | 'patrol'
  | 'deliver'
  | 'report'
  | 'forecast'
  | 'stroll'
  | 'drink'
  | 'sleep'
  | 'gather'
  | 'walk'
  | 'transit';

export type NpcSpot = {
  id: NpcId;
  area: NpcArea;
  /** Area coordinates (tavern: interior world units). */
  x: number;
  z: number;
  /** Where they face (radians about y, 0 = toward the camera / +z). */
  facing: number;
  walking: boolean;
  /** Seen in a scene right now (false in hidden areas and in transit). */
  visible: boolean;
  activity: NpcActivity;
  /** "신짜장 · 항구로 배달 중" — the part after the name. */
  label: string;
  /** The place they are at or heading to. */
  place: string;
};

// ---------------------------------------------------------------- places
type Place = { area: NpcArea; x: number; z: number; face: number; name: string };
const vSnap = (p: VillagePoint) => walkableNear(p);
const place = (area: NpcArea, p: WalkPoint, face: number, name: string): Place => ({ area, x: p.x, z: p.z, face, name });
const entryOf = (id: string) => VILLAGE_PLACES.find((p) => p.id === id)!.entry;

/** Tavern spots in interior scene units (0–100), converted to world units below. */
const TAVERN_SCENE = {
  door: INTERIOR_DOOR,
  'bar-1': { x: 24, y: 45 },
  'bar-2': { x: 41, y: 45.5 },
  fire: { x: 79, y: 56 },
  booth: { x: 80, y: 71 },
  judge: { x: 60, y: 76 },
} as const;
const tw = (k: keyof typeof TAVERN_SCENE) => interiorToWorld(TAVERN_SCENE[k]);

const market = MARKET_SPOTS;
const homes = VILLAGE_PLACES.filter((p) => p.kind === 'home' && p.actor !== undefined).sort((a, b) => a.actor! - b.actor!);
export const NPC_PLACES: Record<string, Place> = {
  // Hidden areas (their "position" is the gate they left by).
  home: place('home', DISTRICTS.hillside.gate.stand, 0, '언덕 집'),
  library: place('library', DISTRICTS.hillside.gate.stand, 0, '언덕 도서관'),
  harbor: place('harbor', DISTRICTS.harbor.gate.stand, 0, '항구'),
  'realty-in': place('realty', entryOf('realty'), 0, '범마을 부동산'),
  'furniture-in': place('furniture', entryOf('furniture'), 0, '나무결 가구점'),
  // The hub.
  'v.plaza-bench': place('village', vSnap({ x: -3.0, z: -0.8 }), Math.PI / 2, '광장 벤치'),
  'v.plaza': place('village', vSnap({ x: 1.6, z: 5.4 }), 0, '광장'),
  'v.plaza-e': place('village', vSnap({ x: 3.2, z: -1.6 }), -Math.PI / 2, '광장'),
  'v.board': place('village', vSnap({ x: VILLAGE_BOARD.x, z: VILLAGE_BOARD.z + 0.9 }), Math.PI, '마을 게시판'),
  'v.museum': place('village', vSnap({ x: VILLAGE_MUSEUM.x, z: VILLAGE_MUSEUM.z + VILLAGE_MUSEUM.depth / 2 + 0.8 }), Math.PI, '박물관 앞'),
  'v.pavilion': place('village', vSnap({ x: VILLAGE_PAVILION.x - 2.4, z: VILLAGE_PAVILION.z + 1.2 }), 0.8, '팔각정'),
  'v.lake': place('village', vSnap({ x: 34.2, z: -24.6 }), Math.PI / 2, '호숫가'),
  'v.pond': place('village', vSnap({ x: -30.8, z: -13.2 }), -Math.PI / 2, '연못가'),
  'v.lane-w': place('village', vSnap({ x: -20.5, z: -8.4 }), Math.PI, '텃밭 길'),
  'v.lane-e': place('village', vSnap({ x: 19.6, z: -8.4 }), Math.PI, '텃밭 길'),
  'v.orchard': place('village', vSnap({ x: -29.5, z: 3.4 }), 0, '과수원'),
  'v.camp': place('village', vSnap({ x: 4.4, z: 23.6 }), 0, '강변 캠프'),
  'v.beach': place('village', vSnap({ x: 12, z: 35.4 }), 0, '남쪽 해변'),
  'v.harbor': place('village', vSnap({ x: VILLAGE_HARBOR.x, z: 42.4 }), 0, '밤 항구'),
  'v.forest': place('village', vSnap({ x: 1.6, z: -33.8 }), Math.PI, '북쪽 숲길'),
  'v.bridge': place('village', vSnap({ x: 0.9, z: 17.6 }), Math.PI, '가운데 다리'),
  'v.market-gate': place('village', DISTRICTS.market.gate.stand, -Math.PI / 2, '큰길 입구'),
  'v.home-gate': place('village', DISTRICTS.hillside.gate.stand, Math.PI / 2, '언덕 계단'),
  'v.harbor-gate': place('village', DISTRICTS.harbor.gate.stand, Math.PI, '둑길 입구'),
  'v.tavern-door': place('village', entryOf('tavern'), Math.PI, '허풍 주점 앞'),
  'v.realty-door': place('village', entryOf('realty'), Math.PI, '부동산 앞'),
  'v.furniture-door': place('village', entryOf('furniture'), Math.PI, '가구점 앞'),
  ...Object.fromEntries(homes.map((h) => [`v.home-${h.actor}`, place('village', vSnap({ x: h.entry.x - 1.2, z: h.entry.z + 1.9 }), Math.PI, `${h.name} 집 앞`)])),
  // Festival ring on the plaza.
  ...Object.fromEntries(
    [0, 1, 2, 3, 4, 5].map((i) => {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      return [`v.fest-${i}`, place('village', vSnap({ x: Math.cos(a) * 4.2, z: Math.sin(a) * 4.2 + 0.4 }), a + Math.PI / 2, '광장 축제')];
    }),
  ),
  // 시장 거리.
  'm.coop': place('market', market.coop, 0, '농협 매입 창구'),
  'm.general': place('market', market.general, 0, '잡화점'),
  'm.bakery': place('market', market.bakery, 0, '빵집 카페'),
  'm.newspaper': place('market', market.newspaper, 0, '신문사'),
  'm.post': place('market', market.post, 0, '우체국'),
  'm.police': place('market', market.police, 0, '파출소'),
  // Where the mail carrier hands parcels over (beside the owner at the counter).
  'm.coop-drop': place('market', { x: market.coop.x + 1.5, z: market.coop.z + 0.5 }, -Math.PI / 2, '농협 창구 옆'),
  'm.newspaper-drop': place('market', { x: market.newspaper.x - 1.5, z: market.newspaper.z + 0.5 }, Math.PI / 2, '신문사 앞'),
  'm.bench-w': place('market', market['bench-w'], 0, '시장 벤치'),
  'm.bench-e': place('market', market['bench-e'], 0, '시장 벤치'),
  'm.board': place('market', market.board, Math.PI, '의뢰 게시판'),
  'm.cafe-1': place('market', market['cafe-seat'], -0.6, '빵집 카페 테라스'),
  'm.cafe-2': place('market', market['cafe-seat-2'], -1.2, '빵집 카페 테라스'),
  'm.cafe-3': place('market', { x: 8.2, z: -6.4 }, 0.8, '빵집 카페 테라스'),
  'm.cafe-4': place('market', { x: 12.8, z: -10.4 }, -2.2, '빵집 카페 테라스'),
  'm.stall-w': place('market', market['stall-w'], 0, '장날 좌판'),
  'm.stall-e': place('market', market['stall-e'], 0, '장날 좌판'),
  'm.stall-w-crowd': place('market', { x: market['stall-w'].x + 2.2, z: market['stall-w'].z + 1 }, -0.9, '장날 경매 구경'),
  'm.stall-sw': place('market', market['stall-sw'], 0, '장날 좌판'),
  'm.stall-se': place('market', market['stall-se'], 0, '장날 좌판'),
  'm.plaza-n': place('market', market['plaza-n'], 0, '시장 광장'),
  'm.plaza-s': place('market', market['plaza-s'], Math.PI, '시장 광장'),
  'm.street-e': place('market', market['street-e'], -Math.PI / 2, '시장 거리 끝'),
  'm.gate': place('market', market.gate, Math.PI / 2, '큰길 어귀'),
  // 허풍 주점 (interior world units).
  't.door': place('tavern', tw('door'), Math.PI / 2, '주점 문 앞'),
  't.bar-1': place('tavern', tw('bar-1'), Math.PI, '주점 바'),
  't.bar-2': place('tavern', tw('bar-2'), Math.PI, '주점 바'),
  't.fire': place('tavern', tw('fire'), -Math.PI / 2, '주점 벽난로 옆'),
  't.booth': place('tavern', tw('booth'), -Math.PI / 2, '주점 구석 자리'),
  't.judge': place('tavern', tw('judge'), Math.PI, '허풍 탁자 옆'),
  // Posts of the residents who work indoors (drawn by their own scenes).
  'casino.lumi': place('casino', { x: 0, z: 0 }, 0, '블랙잭 테이블'),
  'casino.rose': place('casino', interiorToWorld(CASINO_LENDER_SPOT), 0, '대부 창구'),
  'lounge.maehwa': place('lounge', { x: 0, z: 0 }, 0, '화투방'),
  'tavern.captain': place('tavern', TAVERN_HOST_AT, 0, '주점 바 안쪽'),
  'bank.nyamo': place('bank', interiorToWorld(BANKER_SPOT), 0, '은행 창구'),
  'salon.gwen': place('salon', interiorToWorld(SALON_STYLIST_SPOT), 0, '미용실'),
};
export const npcPlace = (id: string) => NPC_PLACES[id];

// ---------------------------------------------------------------- the area graph
/**
 * Doors between areas: in area A you walk to `from`, vanish for `ms`, and
 * appear at `to` in area B. Hidden areas have no inside to walk.
 */
type Portal = { a: NpcArea; b: NpcArea; from: string; to: string; ms: number };
const PORTALS: readonly Portal[] = [
  { a: 'village', b: 'market', from: 'v.market-gate', to: 'm.gate', ms: GATE_TRANSIT_MS },
  { a: 'market', b: 'village', from: 'm.gate', to: 'v.market-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'tavern', from: 'v.tavern-door', to: 't.door', ms: DOOR_TRANSIT_MS },
  { a: 'tavern', b: 'village', from: 't.door', to: 'v.tavern-door', ms: DOOR_TRANSIT_MS },
  { a: 'village', b: 'home', from: 'v.home-gate', to: 'home', ms: GATE_TRANSIT_MS },
  { a: 'home', b: 'village', from: 'home', to: 'v.home-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'library', from: 'v.home-gate', to: 'library', ms: GATE_TRANSIT_MS },
  { a: 'library', b: 'village', from: 'library', to: 'v.home-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'harbor', from: 'v.harbor-gate', to: 'harbor', ms: GATE_TRANSIT_MS },
  { a: 'harbor', b: 'village', from: 'harbor', to: 'v.harbor-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'realty', from: 'v.realty-door', to: 'realty-in', ms: DOOR_TRANSIT_MS },
  { a: 'realty', b: 'village', from: 'realty-in', to: 'v.realty-door', ms: DOOR_TRANSIT_MS },
  { a: 'village', b: 'furniture', from: 'v.furniture-door', to: 'furniture-in', ms: DOOR_TRANSIT_MS },
  { a: 'furniture', b: 'village', from: 'furniture-in', to: 'v.furniture-door', ms: DOOR_TRANSIT_MS },
];
/** Area hops from A to B (breadth-first over the portals). */
function areaRoute(a: NpcArea, b: NpcArea): Portal[] {
  if (a === b) return [];
  const prev = new Map<NpcArea, Portal>();
  const queue: NpcArea[] = [a];
  while (queue.length) {
    const at = queue.shift()!;
    for (const p of PORTALS)
      if (p.a === at && !prev.has(p.b) && p.b !== a) {
        prev.set(p.b, p);
        queue.push(p.b);
      }
  }
  const out: Portal[] = [];
  for (let at = b; at !== a; ) {
    const p = prev.get(at);
    if (!p) return [];
    out.unshift(p);
    at = p.a;
  }
  return out;
}

// ---------------------------------------------------------------- walking paths
const pathCache = new Map<string, WalkPoint[]>();
let marketWalk: ReturnType<typeof regionWalk> | null = null;
/** Waypoints (area coordinates) from one place to another inside a visible area; first = start. */
export function walkPath(area: NpcArea, from: WalkPoint, to: WalkPoint): WalkPoint[] {
  const key = `${area}:${from.x},${from.z}>${to.x},${to.z}`;
  const hit = pathCache.get(key);
  if (hit) return hit;
  let pts: WalkPoint[];
  if (area === 'village') pts = villagePath(from, to);
  else if (area === 'market') {
    marketWalk ??= regionWalk('market');
    pts = marketWalk.path(from, to);
  } else if (area === 'tavern') {
    const s = worldToInterior(from),
      e = worldToInterior(to);
    pts = interiorPath(s, e, 'tavern').map((p) => interiorToWorld(p));
  } else pts = [to];
  if (!pts.length) pts = [to];
  const last = pts[pts.length - 1];
  if (Math.hypot(last.x - to.x, last.z - to.z) > 1e-6) pts = [...pts, to];
  const out = [{ ...from }, ...pts.map((p) => ({ x: p.x, z: p.z }))];
  if (pathCache.size > 4000) pathCache.clear();
  pathCache.set(key, out);
  return out;
}
/** Whether a point is walkable in its area (tests). */
export function npcCanStand(area: NpcArea, p: WalkPoint): boolean {
  if (area === 'village') return villageCanWalk(p);
  if (area === 'market') {
    marketWalk ??= regionWalk('market');
    return marketWalk.canWalk(p);
  }
  if (area === 'tavern') return interiorCanWalk(worldToInterior(p), 'tavern');
  return true;
}

// ---------------------------------------------------------------- day plans
type Seg = readonly [hhmm: number, place: string, act: NpcActivity, label?: string];
export type DayKind = { weekday: number; rain: boolean; marketDay: boolean; festival: boolean; day: number };
export function dayKind(day: number): DayKind {
  const weekday = weekdayOf(day);
  const w = weatherOf(day);
  return {
    day,
    weekday,
    rain: w === 'rain' || w === 'storm',
    marketDay: weekday === 0,
    festival: holidaysOn(day).some((h) => !!h.claim),
  };
}
const hm = (h: number, m = 0) => h * 60 + m;

/** Festival afternoons: everyone gathers on the hub plaza. */
function festival(plan: Seg[], k: DayKind, slot: number): Seg[] {
  if (!k.festival) return plan;
  const out = plan.filter(([t]) => t < hm(15) || t >= hm(18));
  out.push([hm(15), `v.fest-${slot}`, 'gather', '광장 축제 구경']);
  // Whatever they were doing at 18:00 resumes (or they head home).
  const after = plan.filter(([t]) => t < hm(18)).at(-1);
  if (after && !out.some(([t]) => t === hm(18))) out.push([hm(18), after[1], after[2], after[3]]);
  return out.sort((a, b) => a[0] - b[0]);
}

function planOf(id: NpcId, k: DayKind): Seg[] {
  const seed = (salt: string, n: number) => hash32(`${id}:${k.day}:${salt}`) % n;
  switch (id) {
    case 'nasera': {
      const lunch: Seg = k.rain ? [hm(12), 'm.cafe-4', 'eat', '빵집 카페에서 비 피하며 점심'] : [hm(12), 'library', 'read', '도서관에서 책 읽는 중'];
      const plan: Seg[] = k.marketDay
        ? [
            [0, 'home', 'sleep'],
            [hm(6), 'm.coop', 'work', '농협 매입 창구'],
            [hm(9), 'm.stall-e', 'stall', '장날 작물 좌판'],
            lunch,
            [hm(13), 'm.stall-e', 'stall', '장날 작물 좌판'],
            [hm(16), 'm.coop', 'work', '장날 장부 정리'],
            [hm(18), 'v.lane-w', 'patrol', '텃밭 순찰 중'],
            [hm(18, 40), 'v.lane-e', 'patrol', '텃밭 순찰 중'],
            [hm(19, 20), 'v.orchard', 'patrol', '과수원 살피는 중'],
            [hm(20), 'home', 'sleep', '언덕 집에서 쉬는 중'],
          ]
        : [
            [0, 'home', 'sleep'],
            [hm(6), 'm.coop', 'work', '농협 매입 창구'],
            lunch,
            [hm(13), 'm.coop', 'work', '농협 매입 창구'],
            [hm(18), 'v.lane-w', 'patrol', '텃밭 순찰 중'],
            [hm(18, 40), 'v.lane-e', 'patrol', '텃밭 순찰 중'],
            [hm(19, 20), 'v.orchard', 'patrol', '과수원 살피는 중'],
            [hm(20), 'home', 'sleep', '언덕 집에서 쉬는 중'],
          ];
      return festival(plan, k, 0);
    }
    case 'frieren': {
      // Running joke: she oversleeps. Opening time slips by 0–40 minutes.
      const open = hm(10) + seed('oversleep', 3) * 20;
      const night: Seg = [1, 3, 5].includes(k.weekday) ? [hm(19), 't.booth', 'drink', '주점 구석에서 우유 마시는 중'] : [hm(19), 'library', 'read', '도서관에서 옛 레시피 찾는 중'];
      const nap: Seg = k.rain ? [hm(15), 'm.cafe-3', 'nap', '테라스 차양 아래서 꾸벅꾸벅'] : [hm(15), 'v.plaza-bench', 'nap', '광장 벤치에서 낮잠'];
      const plan: Seg[] = k.marketDay
        ? [
            [0, 'home', 'sleep'],
            [open, 'm.bakery', 'work', open > hm(10) ? '늦잠 자고 이제 가게 여는 중' : '빵집 카페'],
            [hm(11, 30), 'm.stall-se', 'stall', '장날 빵 좌판'],
            [hm(14), 'm.bakery', 'work', '빵집 카페'],
            nap,
            [hm(16), 'm.bakery', 'work', '빵집 카페'],
            night,
            [hm(21), 'home', 'sleep', '언덕 집에서 쉬는 중'],
          ]
        : [
            [0, 'home', 'sleep'],
            [open, 'm.bakery', 'work', open > hm(10) ? '늦잠 자고 이제 가게 여는 중' : '빵집 카페'],
            nap,
            [hm(16), 'm.bakery', 'work', '빵집 카페'],
            night,
            [hm(21), 'home', 'sleep', '언덕 집에서 쉬는 중'],
          ];
      return festival(plan, k, 1);
    }
    case 'thresh': {
      const lantern = k.weekday === 6;
      const plan: Seg[] = [
        [0, 'home', 'sleep'],
        [hm(8), 'm.general', 'work', '잡화점'],
        ...(k.marketDay ? ([[hm(14), 'm.stall-w', 'stall', '장날 경매 여는 중'], [hm(17), 'm.general', 'work', '잡화점']] as Seg[]) : []),
        [hm(19), 'v.harbor', 'stroll', '밤바다 산책 중'],
        [hm(20), 'v.beach', 'stroll', '해변에서 등불 켜는 중'],
        lantern ? [hm(21), 'm.general', 'work', '밤에만 여는 등불 상점'] : [hm(21), 't.fire', 'drink', '주점 벽난로 옆에서 수집품 자랑'],
        [hm(23), 'home', 'sleep', '언덕 집에서 쉬는 중'],
      ];
      return festival(plan, k, 2);
    }
    case 'sinjjajang': {
      // The morning round visits the friends' mailboxes in a daily order, then the harbor.
      const order = [0, 1, 2, 3, 4, 5, 6].sort((a, b) => hash32(`mail:${k.day}:${a}`) - hash32(`mail:${k.day}:${b}`)).slice(0, 4);
      const round: Seg[] = order.map((a, i) => [hm(9) + i * 22, `v.home-${a}`, 'deliver', `${homes[a]?.name ?? '친구'} 집에 편지 배달 중`] as Seg);
      const plan: Seg[] = [
        [0, 'home', 'sleep'],
        [hm(7), 'm.post', 'work', '우체국에서 우편 분류'],
        ...round,
        [hm(10, 40), 'harbor', 'deliver', '항구로 배달 중'],
        [hm(12), 'm.cafe-1', 'eat', '빵집 카페에서 점심'],
        [hm(13), 'm.coop-drop', 'deliver', '농협에 소포 전하는 중'],
        [hm(13, 30), 'v.museum', 'deliver', '박물관에 소포 배달 중'],
        [hm(14, 10), 'v.tavern-door', 'deliver', '허풍 주점에 편지 배달 중'],
        [hm(14, 50), 'v.board', 'deliver', '게시판에 공고 붙이는 중'],
        [hm(15, 30), 'm.newspaper-drop', 'deliver', '신문사에 원고 받으러 가는 중'],
        [hm(16), 'm.street-e', 'deliver', '시장 거리 배달 중'],
        [hm(17), 'm.post', 'work', '우체국 마감 정리'],
        [hm(18), 'home', 'sleep', '언덕 집에서 쉬는 중'],
      ];
      return festival(plan, k, 3);
    }
    case 'volibas': {
      const hub: Seg[] = [
        [hm(13), 'm.street-e', 'patrol', '시장 거리 순찰 중'],
        [hm(13, 40), 'v.plaza-e', 'patrol', '광장 순찰 중'],
        [hm(14, 20), 'v.pond', 'patrol', '연못가 순찰 중'],
        [hm(15), 'v.forest', 'patrol', '북쪽 숲길 순찰 중'],
        [hm(15, 40), k.rain ? 'v.bridge' : 'v.beach', 'patrol', k.rain ? '다리 위에서 물길 살피는 중' : '해변 순찰 중'],
        [hm(16, 20), 'harbor', 'patrol', '항구 순찰 중'],
        [hm(17, 10), 'm.board', 'patrol', '수배 전단 붙이는 중'],
      ];
      const plan: Seg[] = [
        [0, 'home', 'sleep'],
        [hm(8), 'm.police', 'work', '파출소 근무'],
        [hm(12), 'm.cafe-2', 'eat', '빵집 카페에서 빵 먹는 중'],
        ...hub,
        [hm(18), 'm.police', 'work', '파출소 근무'],
        ...(k.weekday === 5 ? ([[hm(20), 't.judge', 'drink', '허풍 경연 심판 보는 중']] as Seg[]) : []),
        [k.weekday === 5 ? hm(22) : hm(20), 'home', 'sleep', '언덕 집에서 쉬는 중'],
      ];
      return festival(plan, k, 4);
    }
    case 'janna': {
      const beat = ['v.museum', 'v.pavilion', 'v.lake', 'v.camp', 'v.bridge', 'm.plaza-s'];
      const a = beat[seed('beat-a', beat.length)],
        b = beat[(seed('beat-a', beat.length) + 1 + seed('beat-b', beat.length - 1)) % beat.length];
      const plan: Seg[] = [
        [0, 'home', 'sleep'],
        [hm(6), 'm.newspaper', 'work', '아침 소식 쓰는 중'],
        [hm(8), 'v.plaza', 'forecast', k.rain ? '광장에서 우산 들고 날씨 예보' : '광장에서 날씨 예보'],
        [hm(9), a, 'report', '취재 중'],
        [hm(10, 30), b, 'report', '취재 중'],
        [hm(12), 'm.cafe-3', 'eat', '빵집 카페에서 점심'],
        [hm(13), 'm.newspaper', 'work', '기사 쓰는 중'],
        [hm(15), k.marketDay ? 'm.stall-w-crowd' : 'm.board', 'report', k.marketDay ? '장날 경매 취재 중' : '의뢰 게시판 취재 중'],
        [hm(16, 30), 'm.newspaper', 'work', '마감 중'],
        [hm(18), 'home', 'sleep', '언덕 집에서 쉬는 중'],
      ];
      return festival(plan, k, 5);
    }
    case 'realtor':
      return [
        [0, 'realty-in', 'work', '범마을 부동산'],
        [hm(19), 'v.pavilion', 'stroll', '팔각정에서 땅값 계산하는 중'],
        [hm(20, 30), 'realty-in', 'work', '범마을 부동산'],
      ];
    case 'carpenter':
      return [
        [0, 'furniture-in', 'work', '나무결 가구점'],
        [hm(18), k.rain ? 'v.plaza-e' : 'v.orchard', 'stroll', k.rain ? '광장에서 비 구경' : '과수원 나뭇결 구경'],
        [hm(19, 10), 'furniture-in', 'work', '나무결 가구점'],
      ];
    case 'lumi':
      return [[0, 'casino.lumi', 'work', '별빛 카지노 딜러']];
    case 'maehwa':
      return [[0, 'lounge.maehwa', 'work', '회관 화투방']];
    case 'captain':
      return [[0, 'tavern.captain', 'work', '허풍 주점 바']];
    case 'rose':
      return [[0, 'casino.rose', 'work', '카지노 대부 창구']];
    case 'nyamo':
      return [[0, 'bank.nyamo', 'work', '은행 창구']];
    case 'gwen':
      return [[0, 'salon.gwen', 'work', '보송 미용실']];
  }
}

// ---------------------------------------------------------------- timeline
type Ev =
  | { k: 'stay'; t0: number; t1: number; place: string; act: NpcActivity; label: string }
  | { k: 'walk'; t0: number; t1: number; area: NpcArea; pts: WalkPoint[]; cum: number[]; to: string; label: string; act: NpcActivity }
  | { k: 'hide'; t0: number; t1: number; area: NpcArea; at: string; to: string; label: string };

const destLabel = (p: string) => NPC_PLACES[p]?.name ?? '';
const goingLabel = (to: string, label?: string) => {
  if (label && label.endsWith('중') && /배달|순찰|취재/.test(label)) return label;
  const name = destLabel(to);
  return name ? `${josa(name, '으로/로')} 가는 중` : '걸어가는 중';
};
function legWalk(area: NpcArea, from: string, to: string, t0: number, label: string, act: NpcActivity): Ev & { k: 'walk' } {
  const a = NPC_PLACES[from],
    b = NPC_PLACES[to];
  const pts = walkPath(area, a, b);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const ms = Math.ceil((cum[cum.length - 1] / NPC_WALK_SPEED) * 1000);
  return { k: 'walk', t0, t1: t0 + ms, area, pts, cum, to, label, act };
}
/** The moves from place A to place B starting at t (walk legs and hidden hops). */
function route(from: string, to: string, t: number, label: string): Ev[] {
  const A = NPC_PLACES[from],
    B = NPC_PLACES[to];
  const hops = areaRoute(A.area, B.area);
  const out: Ev[] = [];
  let at = from,
    now = t;
  const act: NpcActivity = /배달/.test(label) ? 'deliver' : /순찰/.test(label) ? 'patrol' : 'walk';
  const walkTo = (target: string) => {
    const area = NPC_PLACES[at].area;
    if (at === target) return;
    if (NPC_WALK_AREAS.includes(area)) {
      const leg = legWalk(area, at, target, now, label, act);
      out.push(leg);
      now = leg.t1;
    }
    at = target;
  };
  for (const hop of hops) {
    walkTo(hop.from);
    out.push({ k: 'hide', t0: now, t1: now + hop.ms, area: hop.b, at: hop.from, to: hop.to, label });
    now += hop.ms;
    at = hop.to;
  }
  walkTo(to);
  return out;
}
const timelines = new Map<string, Ev[]>();
/** Every event of a resident's KST day (cached). */
export function npcTimeline(id: NpcId, day: number): Ev[] {
  const key = `${id}:${day}`;
  const hit = timelines.get(key);
  if (hit) return hit;
  const k = dayKind(day);
  const plan = planOf(id, k);
  const start = day * DAY - KST;
  const end = start + DAY;
  const ev: Ev[] = [];
  let cur = plan[0][1],
    curAct = plan[0][2],
    curLabel = plan[0][3] ?? NPC_PLACES[plan[0][1]].name,
    t = start;
  for (let i = 1; i < plan.length; i++) {
    const [hhmm, to, act, label] = plan[i];
    const at = Math.max(t, start + hhmm * MIN);
    if (to === cur) {
      ev.push({ k: 'stay', t0: t, t1: at, place: cur, act: curAct, label: curLabel });
      t = at;
      curAct = act;
      curLabel = label ?? NPC_PLACES[to].name;
      continue;
    }
    ev.push({ k: 'stay', t0: t, t1: at, place: cur, act: curAct, label: curLabel });
    const moves = route(cur, to, at, goingLabel(to, label));
    ev.push(...moves);
    t = moves.length ? moves[moves.length - 1].t1 : at;
    cur = to;
    curAct = act;
    curLabel = label ?? NPC_PLACES[to].name;
  }
  ev.push({ k: 'stay', t0: t, t1: Math.max(t, end), place: cur, act: curAct, label: curLabel });
  if (timelines.size > 400) timelines.clear();
  timelines.set(key, ev);
  return ev;
}

function interp(e: Ev & { k: 'walk' }, now: number) {
  const d = Math.min(e.cum[e.cum.length - 1], ((now - e.t0) / 1000) * NPC_WALK_SPEED);
  for (let i = 1; i < e.pts.length; i++) {
    if (d <= e.cum[i] || i === e.pts.length - 1) {
      const seg = e.cum[i] - e.cum[i - 1] || 1;
      const k = Math.max(0, Math.min(1, (d - e.cum[i - 1]) / seg));
      const a = e.pts[i - 1],
        b = e.pts[i];
      return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, facing: Math.atan2(b.x - a.x, b.z - a.z) };
    }
  }
  const last = e.pts[e.pts.length - 1];
  return { x: last.x, z: last.z, facing: 0 };
}

/** Where resident `id` is at `now` (ms, server clock). */
export function npcSpot(id: NpcId, now: number): NpcSpot {
  const day = kstDay(now);
  const ev = npcTimeline(id, day);
  let e = ev[ev.length - 1];
  for (const x of ev)
    if (now >= x.t0 && now < x.t1) {
      e = x;
      break;
    }
  if (e.k === 'stay') {
    const p = NPC_PLACES[e.place];
    const visible = NPC_WALK_AREAS.includes(p.area) && !isPostPlace(e.place);
    return { id, area: p.area, x: p.x, z: p.z, facing: p.face, walking: false, visible, activity: e.act, label: e.label, place: e.place };
  }
  if (e.k === 'walk') {
    const p = interp(e, now);
    return { id, area: e.area, x: p.x, z: p.z, facing: p.facing, walking: true, visible: true, activity: e.act, label: e.label, place: e.to };
  }
  const p = NPC_PLACES[e.at];
  return { id, area: e.area, x: p.x, z: p.z, facing: 0, walking: false, visible: false, activity: 'transit', label: e.label, place: e.to };
}
/** Posts drawn by their own scenes (dealers, the captain, service desks). */
const isPostPlace = (p: string) => /^(casino|lounge|bank|salon|tavern)\./.test(p);

/** Every resident in `area` who is drawn walking about there right now. */
export function npcsIn(area: NpcArea, now: number, ids: readonly NpcId[] = NPC_IDS): NpcSpot[] {
  return ids.map((id) => npcSpot(id, now)).filter((s) => s.visible && s.area === area);
}
/** "신짜장 · 항구로 배달 중" for the notebook and the map. */
export const npcWhere = (s: NpcSpot) => `${NPCS[s.id].name} · ${s.label}`;
/** Hidden area names for "지금 어디" when they are off screen. */
export const NPC_AREA_NAMES: Record<NpcArea, string> = {
  village: '마을 중심',
  market: '시장 거리',
  tavern: '허풍 주점',
  casino: '별빛 카지노',
  lounge: '범마을 회관',
  bank: '범마을 은행',
  salon: '보송 미용실',
  realty: '범마을 부동산',
  furniture: '나무결 가구점',
  home: '언덕 집',
  library: '언덕 도서관',
  harbor: '항구',
};
/** Test / debug helper: the day's plan as [minute, place]. */
export const npcPlan = (id: NpcId, day: number) => planOf(id, dayKind(day)).map(([t, p]) => [t, p] as const);
export const kstDayStart = (day: number) => day * DAY - KST;
