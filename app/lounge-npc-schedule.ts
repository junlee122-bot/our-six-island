// Where every resident is, as a pure function of the game clock
// (design-village-2x-npcs.md §2 "NPC가 맵을 오가는 방식", §4 "일과표";
// design-game-clock.md: 게임 하루 = 실제 1시간):
//
//   npcSpot(id, now) → { area, x, z, facing, walking, activity, label }
//
// No server row, no realtime: every friend's screen computes the same spot
// for the same instant. Every game day (one real hour) is a list of "be at
// place P from hh:mm" segments in game minutes, picked by the real day the
// game day falls in: its weekday, weather (lounge-calendar.ts weatherOf),
// market day (Sunday, 일요 장터) and festival days. Walks and door/gate hops
// keep real seconds (a later segment simply starts once they arrive). Changing place is a walk:
// along the area's walking path to its exit, a hidden transit (~20 s through
// a district gate, a few seconds through a door), then from the next area's
// entrance on to the place. Places are named spots that tests check are
// walkable; paths come from the areas' own walkers (villagePath for the hub,
// regionWalk for 시장 거리, interiorPath for the tavern).
//
// Hidden areas are places a resident can be but nobody can see: the counter
// rooms of 부동산·가구점, and — until ③ 언덕 주택가 opens — their homes and the
// library up the hillside (the 'home' / 'library' stand-ins at the hub's west
// gate). Once the hillside is open (village flag 'district-hillside') every
// resident commutes to their own house there instead (`hill` option; the
// client sets it from the world with setNpcWorld, the server passes it).
// Inside a house, the library or the lighthouse a resident is not drawn
// (`hidden` places in a visible area). The residents who work indoors are
// drawn at their posts by their scenes; 발키리 takes an evening walk through
// the hub, and 루미 · 매화 · 로제 leave the casino and the hall through their
// doors for breaks and a weekly day off (hostPlan; the tables and the
// lender's desk keep working without them, npcAtPost). 범마을 부동산 is kept in turns by a married
// couple (realtyDuty): 신형만 on Mon/Wed/Fri, 봉미선 on Tue/Thu, both at the
// weekend (one at the counter, the other showing the model house). Off duty
// 형만 works out of the village and ends the day at the tavern; 미선 shops in
// 시장 거리 and the bakery, then fetches him from the tavern. 지점장 무잔 keeps the
// 범마을 증권 counter in market hours (muzanPlan, Sunday off) and spends his
// evenings by the casino, in the tavern or under 시장 거리's lamps. Stage-2 residents (hasSprite: false) have
// schedules too, but npcsIn leaves them out until they can be drawn.
//
// Stage 3 (design-npcs-stage3.md): 닐라·하쿠 live and work in ④ 목장·과수원,
// 오른·메르시·신이치 in ⑤ 산기슭 마을. Until a district opens (village flags
// 'district-ranch' / 'district-foothill', the `ranch` / `foothill` options of
// NpcWorld) its residents stay out of sight beyond its gate (the hidden
// 'fields' / 'mountain' stand-ins) all day. 신이치 keeps his tent only on
// weekends and festival days; on other days he is away on a case.
import { kstDay } from './lounge-economy.ts';
import { GAME_DAY_MS, GAME_MINUTE_MS, gameDay, gameDayStart, holidaysOn, realDayOfGameDay, weatherOf, weekdayOf, hash32 } from './lounge-calendar.ts';
import { VILLAGE_PLACES, villagePath, villageCanWalk, VILLAGE_BOARD, VILLAGE_MUSEUM, VILLAGE_PAVILION, VILLAGE_HARBOR, type VillagePoint } from './lounge-village-layout.ts';
import { walkableNear } from './lounge-village-life.ts';
import { DISTRICTS } from './lounge-districts.ts';
import { MARKET_SPOTS } from './lounge-market-layout.ts';
import { HARBOR_SPOTS_NPC } from './lounge-harbor-layout.ts';
import { HILLSIDE_SPOTS } from './lounge-hillside-layout.ts';
import { RANCH_SPOTS } from './lounge-ranch-layout.ts';
import { FARM_HOUSES, FARM_SPOTS } from './lounge-farm-layout.ts';
import { FOOTHILL_SPOTS } from './lounge-foothill-layout.ts';
import { regionWalk } from './lounge-areas.ts';
import { INTERIOR_DOOR, interiorCanWalk, interiorPath, interiorToWorld, worldToInterior, TAVERN_HOST_AT } from './lounge-interior-layout.ts';
import { CASINO_LENDER_SPOT } from './lounge-casino-lender.ts';
import { BANKER_SPOT } from './lounge-bank-layout.ts';
import { SALON_STYLIST_SPOT } from './lounge-salon-layout.ts';
import { SHOP_AREAS, SHOP_INTERIORS, SHOP_STAFF_RADIUS, isShopArea, shopCanWalk, shopPath, shopWorld, type ShopArea } from './lounge-shop-interiors.ts';
import { NPCS, STAGE2_NPCS, STAGE3_NPCS, VISIBLE_NPC_IDS, WALKING_NPCS, type NpcId } from './lounge-npc-data.ts';
import type { WalkPoint } from './lounge-walk-world.ts';
import { josa } from './lounge-text.ts';
import { fortuneOpenOn } from './lounge-stage3-data.ts';

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
  | 'harbor'
  | 'hillside'
  /** ④ 목장·과수원 and ⑤ 산기슭 마을 (stage 3). */
  | 'ranch'
  | 'foothill'
  /** 우리 농장: the friends' houses and fields behind the hub's north gate. */
  | 'farm'
  /** Beyond the 들길 / 산길 gates while those districts are shut (hidden). */
  | 'fields'
  | 'mountain'
  /** Out of the village (마키마 on the days she does not visit). */
  | 'away'
  /** The shop rooms off 시장 거리 and the harbor (lounge-shop-interiors.ts, room world units). */
  | ShopArea;
/** Where residents are drawn walking about (the rest is drawn by its own scene or not at all). */
export const NPC_WALK_AREAS: readonly NpcArea[] = ['village', 'market', 'tavern', 'harbor', 'hillside', 'ranch', 'foothill', 'farm', ...SHOP_AREAS];
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
type Place = { area: NpcArea; x: number; z: number; face: number; name: string; hidden?: boolean };
const vSnap = (p: VillagePoint) => walkableNear(p);
const place = (area: NpcArea, p: WalkPoint, face: number, name: string): Place => ({ area, x: p.x, z: p.z, face, name });
/** Inside a building of a visible area: there, but not drawn. */
const inside = (area: NpcArea, p: WalkPoint, name: string): Place => ({ area, x: p.x, z: p.z, face: 0, name, hidden: true });
const entryOf = (id: string) => VILLAGE_PLACES.find((p) => p.id === id)!.entry;

/** Tavern spots in interior scene units (0–100), converted to world units below. */
const TAVERN_SCENE = {
  door: INTERIOR_DOOR,
  'bar-1': { x: 24, y: 45 },
  'bar-2': { x: 41, y: 45.5 },
  fire: { x: 79, y: 56 },
  booth: { x: 80, y: 71 },
  judge: { x: 60, y: 76 },
  'bar-3': { x: 33, y: 45.5 },
  stage: { x: 68, y: 62 },
  // Evening seats (every one on the walkable floor, apart from each other).
  'table-1': { x: 20, y: 60 },
  'table-2': { x: 20, y: 76 },
  'table-3': { x: 35, y: 83 },
  'table-4': { x: 50, y: 83 },
  window: { x: 84, y: 48 },
  corner: { x: 72, y: 83 },
  'bar-4': { x: 50, y: 46 },
  'bar-5': { x: 57, y: 47 },
  misun: { x: 61, y: 51 },
  // 무잔's stool after the market closes (off the evening seat pool).
  muzan: { x: 45, y: 72 },
  // 루미 · 매화 · 로제 on their breaks and days off (kept off the evening seat pool).
  lumi: { x: 28, y: 68 },
  maehwa: { x: 36, y: 62 },
  rose: { x: 62, y: 88 },
} as const;
const tw = (k: keyof typeof TAVERN_SCENE) => interiorToWorld(TAVERN_SCENE[k]);

/**
 * Shop rooms: the door, the owner's (and helper's) spot behind the counter,
 * the residents' café chairs and the floor spots, as `<area>.<spot>`.
 */
function shopPlaces(): Record<string, Place> {
  const out: Record<string, Place> = {};
  for (const area of SHOP_AREAS) {
    const s = SHOP_INTERIORS[area];
    out[`${area}.door`] = place(area, interiorToWorld(INTERIOR_DOOR), Math.PI / 2, `${s.name} 문 앞`);
    out[`${area}.owner`] = place(area, s.ownerAt, 0, `${s.name} 계산대`);
    if (s.helperAt) out[`${area}.helper`] = place(area, s.helperAt, 0, `${s.name} 계산대`);
    for (const seat of s.seats) if (seat.npc) out[`${area}.seat-${seat.table}`] = place(area, seat, seat.face, `${s.name} 자리`);
    for (const [k, p] of Object.entries(s.spots)) out[`${area}.${k}`] = place(area, p, p.face, s.name);
  }
  return out;
}

const market = MARKET_SPOTS;
const hb = HARBOR_SPOTS_NPC,
  hl = HILLSIDE_SPOTS;
/** Who lives where once the hillside is open ('hl.in-*' are inside their houses). */
const HILL_HOMES: Partial<Record<NpcId, string>> = {
  nasera: 'hl.in-nasera',
  frieren: 'hl.in-frieren',
  thresh: 'hl.in-thresh',
  janna: 'hl.in-janna',
  sinjjajang: 'hl.in-sinjjajang',
  volibas: 'hl.in-volibas',
  lux: 'hl.in-lux',
  bocchi: 'hl.in-bocchi',
  tsunade: 'hl.in-tsunade',
  himmel: 'hl.in-youth',
  yanineko: 'hl.in-youth-2',
};
const HOUSE_NAMES: Record<string, string> = { youth: '청년 자취방', 'youth-2': '청년 자취방' };
const HARBOR_NAMES: Record<string, string> = {
  gate: '둑길 어귀',
  fishmarket: '어시장',
  'fishmarket-2': '어시장',
  auction: '새벽 경매장',
  'auction-crowd': '새벽 경매장',
  board: '항구 게시판',
  guild: '낚시조합',
  'pier-root': '큰 선착장',
  'pier-mid': '큰 선착장',
  'pier-end': '선착장 끝',
  'lighthouse-door': '등대 앞',
  'lighthouse-yard': '등대 마당',
  'breakwater-mid': '방파제',
  'breakwater-end': '방파제 끝',
  'bench-w': '항구 벤치',
  'bench-e': '항구 벤치',
  shed: '항구 창고',
  quay: '항구 부두',
};
const RANCH_NAMES: Record<string, string> = {
  gate: '들길 어귀',
  'barn-door': '축사 앞',
  'barn-yard': '목장 마당',
  'pasture-gate': '초원 울타리 문',
  pasture: '목장 초원',
  coop: '닭장 앞',
  'nilah-door': '닐라네 집 앞',
  'stream-w': '개울가',
  'stream-e': '개울가',
  stones: '징검다리',
  bridge: '나무 다리',
  'orchard-door': '과수원 창고 앞',
  'orchard-row-a': '과수원',
  'orchard-row-b': '과수원',
  'orchard-row-c': '과수원',
  pavilion: '원두막',
  'pavilion-2': '원두막',
  'haku-door': '하쿠네 집 앞',
  'bench-stream': '개울가 벤치',
  'bench-orchard': '과수원 벤치',
  board: '목장 게시판',
  road: '들길',
};
const FOOTHILL_NAMES: Record<string, string> = {
  gate: '산길 어귀',
  'smithy-door': '대장간 앞',
  anvil: '대장간 모루',
  'smithy-yard': '대장간 마당',
  'bench-forge': '대장간 옆 벤치',
  'mine-yard': '광산 입구',
  'mine-mouth': '광산 입구',
  'clinic-door': '의원 앞',
  'bench-clinic': '의원 앞 벤치',
  plaza: '산기슭 광장',
  'plaza-e': '산기슭 광장',
  'bench-plaza': '광장 벤치',
  tent: '점집 천막',
  onsen: '온천 공사장',
  board: '산기슭 게시판',
  path: '산길',
};
const hillName = (k: string) => {
  if (HILL_NAMES[k]) return HILL_NAMES[k];
  const who = k.startsWith('door-') ? k.slice(5) : '';
  if (who === 'youth' || who === 'youth-2') return '청년 자취방 앞';
  return who && who in NPCS ? `${NPCS[who as NpcId].name} 집 앞` : '언덕 주택가';
};
const HILL_NAMES: Record<string, string> = {
  gate: '언덕 계단',
  'library-door': '도서관 앞',
  'library-steps': '도서관 계단',
  'garden-gate': '텃밭 입구',
  'garden-w': '텃밭',
  'garden-e': '텃밭',
  'park-bench-w': '공원 벤치',
  'park-bench-e': '공원 벤치',
  'park-corner': '공원 구석',
  plaza: '작은 광장',
  'lane-n': '윗골목',
  'lane-s': '아랫골목',
  board: '언덕 게시판',
};
/** 우리 농장's spot names (lounge-farm-layout.ts FARM_SPOTS; the doors are named per house). */
const FARM_NAMES: Record<string, string> = {
  gate: '농장 길 어귀',
  bin: '농장 출하함 앞',
  board: '농장 게시판',
  yard: '농장 마당',
  'bench-yard': '농장 마당 벤치',
  lane: '밭 사이 길',
  ...Object.fromEntries(FARM_HOUSES.map((h) => [`door-${h.actor}`, `${h.name} 앞`])),
};
export const NPC_PLACES: Record<string, Place> = {
  // Hidden areas (their "position" is the gate they left by).
  home: place('home', DISTRICTS.hillside.gate.stand, 0, '언덕 집'),
  library: place('library', DISTRICTS.hillside.gate.stand, 0, '언덕 도서관'),
  away: place('away', DISTRICTS.market.gate.stand, 0, '마을 밖'),
  fields: place('fields', DISTRICTS.ranch.gate.stand, 0, '들길 너머'),
  mountain: place('mountain', DISTRICTS.foothill.gate.stand, 0, '산길 너머'),
  'realty-in': place('realty', entryOf('realty'), 0, '범마을 부동산'),
  'realty-model': place('realty', entryOf('realty'), 0, '범마을 부동산 모델하우스'),
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
  'v.lane-w': place('village', vSnap({ x: -20.5, z: -8.4 }), Math.PI, '윗길'),
  'v.lane-e': place('village', vSnap({ x: 19.6, z: -8.4 }), Math.PI, '윗길'),
  // 우리 농장 (§5): the farm lane's gate, the west park and the east stall spots.
  'v.farm-gate': place('village', DISTRICTS.farm.gate.stand, 0, '농장 길 입구'),
  'v.farm-lane': place('village', vSnap({ x: 1.2, z: -20 }), -Math.PI / 2, '농장 가로수길'),
  'v.park': place('village', vSnap({ x: -14.6, z: -18.2 }), Math.PI / 2, '작은 공원'),
  'v.park-2': place('village', vSnap({ x: -16.4, z: -17.2 }), -Math.PI / 2, '작은 공원 정자 옆'),
  'v.stalls': place('village', vSnap({ x: 16.5, z: -15.6 }), Math.PI, '장터 자리'),
  'v.orchard': place('village', vSnap({ x: -29.5, z: 3.4 }), 0, '과수원'),
  'v.camp': place('village', vSnap({ x: 4.4, z: 23.6 }), 0, '강변 캠프'),
  'v.beach': place('village', vSnap({ x: 12, z: 35.4 }), 0, '남쪽 해변'),
  'v.harbor': place('village', vSnap({ x: VILLAGE_HARBOR.x, z: 42.4 }), 0, '밤 항구'),
  'v.forest': place('village', vSnap({ x: 1.6, z: -33.8 }), Math.PI, '북쪽 숲길'),
  'v.bridge': place('village', vSnap({ x: 0.9, z: 17.6 }), Math.PI, '가운데 다리'),
  'v.market-gate': place('village', DISTRICTS.market.gate.stand, -Math.PI / 2, '큰길 입구'),
  'v.home-gate': place('village', DISTRICTS.hillside.gate.stand, Math.PI / 2, '언덕 계단'),
  'v.harbor-gate': place('village', DISTRICTS.harbor.gate.stand, Math.PI, '둑길 입구'),
  'v.ranch-gate': place('village', DISTRICTS.ranch.gate.stand, 0, '들길 입구'),
  'v.foothill-gate': place('village', DISTRICTS.foothill.gate.stand, 0, '산길 입구'),
  // 메르시's house call and 신이치's festival table on the plaza (off the festival ring and the evening seats).
  'v.housecall': place('village', vSnap({ x: -5.2, z: 3.8 }), 0.6, '마을 광장 왕진'),
  'v.fortune': place('village', vSnap({ x: 5.6, z: 3.2 }), -0.6, '광장 축제 점집'),
  'v.tavern-door': place('village', entryOf('tavern'), Math.PI, '허풍 주점 앞'),
  'v.realty-door': place('village', entryOf('realty'), Math.PI, '부동산 앞'),
  'v.furniture-door': place('village', entryOf('furniture'), Math.PI, '가구점 앞'),
  'v.casino-door': place('village', entryOf('casino'), Math.PI, '별빛 카지노 앞'),
  'v.hall-door': place('village', entryOf('hall'), Math.PI, '범마을 회관 앞'),
  // 루미 · 매화's breaks and days off (off the evening seats).
  'v.lumi-flower': place('village', vSnap({ x: -33.5, z: -9.4 }), -Math.PI / 2, '연못가 꽃밭'),
  'v.lumi-late': place('village', vSnap({ x: -1.8, z: 8.4 }), Math.PI / 2, '광장 가로등 아래'),
  'v.casino-yard': place('village', vSnap({ x: 18.6, z: 9.6 }), -Math.PI / 2, '카지노 처마 밑'),
  'v.hall-yard': place('village', vSnap({ x: -13.4, z: 9.6 }), Math.PI / 2, '회관 앞마당'),
  'v.hall-late': place('village', vSnap({ x: -18.6, z: 9.8 }), -Math.PI / 2, '회관 앞 골목'),
  'v.maehwa-orchard': place('village', vSnap({ x: -26, z: 6 }), 0, '과수원 길'),
  // 신형만 · 봉미선's Sunday evening walk (side by side, off the evening seats).
  'v.couple-a': place('village', vSnap({ x: VILLAGE_PAVILION.x - 1.2, z: VILLAGE_PAVILION.z + 3.4 }), Math.PI / 2, '팔각정 산책길'),
  'v.couple-b': place('village', vSnap({ x: VILLAGE_PAVILION.x + 0.4, z: VILLAGE_PAVILION.z + 3.4 }), -Math.PI / 2, '팔각정 산책길'),
  // 무잔 watching the casino crowd after the market closes.
  'v.muzan-casino': place('village', vSnap({ x: 21.8, z: 10.2 }), -Math.PI / 2, '카지노 앞 가로등 아래'),
  // Festival ring on the plaza.
  ...Object.fromEntries(
    [0, 1, 2, 3, 4, 5].map((i) => {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      return [`v.fest-${i}`, place('village', vSnap({ x: Math.cos(a) * 4.2, z: Math.sin(a) * 4.2 + 0.4 }), a + Math.PI / 2, '광장 축제')];
    }),
  ),
  // 시장 거리.
  'm.coop': place('market', market.coop, 0, '농협 앞'),
  'm.general': place('market', market.general, 0, '잡화점 앞'),
  'm.bakery': place('market', market.bakery, 0, '빵집 카페 앞'),
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
  // Stage-2 residents' seats in the market (beside the stage-1 ones).
  'm.bakery-2': place('market', { x: 6.4, z: -8.2 }, -0.3, '빵집 카페 계산대'),
  'm.cafe-5': place('market', { x: 8, z: -10.2 }, 0.9, '빵집 카페 테라스'),
  'm.cafe-6': place('market', { x: 11, z: -6.1 }, -0.9, '빵집 카페 테라스'),
  'm.cafe-7': place('market', { x: 14.2, z: -7.4 }, -1.6, '빵집 카페 테라스'),
  // 루미's café seat and flower stall, 매화's grocery round.
  'm.lumi-cafe': place('market', { x: 9.6, z: -9.2 }, 0.4, '빵집 카페 테라스'),
  'm.lumi-flowers': place('market', { x: 0.6, z: 11.4 }, Math.PI, '시장 꽃 좌판'),
  'm.maehwa': place('market', { x: -6.4, z: -4.4 }, 0, '시장 거리 장보기'),
  // 봉미선's shopping round.
  'm.misun': place('market', { x: market['plaza-n'].x + 2.2, z: market['plaza-n'].z + 0.6 }, Math.PI, '시장 광장'),
  // 범마을 증권: the door (his way in) and 무잔's walks along the east street.
  'm.broker': place('market', market.broker, Math.PI, '범마을 증권 앞'),
  'm.muzan': place('market', { x: 17.6, z: 5.6 }, -Math.PI / 2, '시장 거리 동쪽'),
  'm.muzan-lamp': place('market', { x: 16, z: -1.4 }, Math.PI / 2, '시장 거리 등불 아래'),
  // ② 항구 구역.
  ...Object.fromEntries(Object.entries(hb).map(([k, p]) => [`hb.${k}`, place('harbor', p, p.face, HARBOR_NAMES[k] ?? '항구')])),
  'hb.quay-2': place('harbor', { x: 15.4, z: -0.6 }, 0, '항구 좌판'),
  'hb.lighthouse-in': inside('harbor', hb['lighthouse-door'], '등대 안'),
  // 로제's sea walks.
  'hb.rose': place('harbor', { x: -0.2, z: 10.5 }, 0, '큰 선착장'),
  'hb.rose-sunset': place('harbor', { x: 23.4, z: 11.2 }, -Math.PI / 2, '방파제'),
  // ③ 언덕 주택가 (visible once it is open; the plans map these to 'home' / 'library' before).
  ...Object.fromEntries(Object.entries(hl).map(([k, p]) => [`hl.${k}`, place('hillside', p, p.face, hillName(k))])),
  'hl.library-club': place('hillside', { x: hl['library-steps'].x - 1.6, z: hl['library-steps'].z + 0.2 }, -0.3, '도서관 독서 모임'),
  'hl.library-in': inside('hillside', hl['library-door'], '언덕 도서관'),
  ...Object.fromEntries(
    Object.entries(hl)
      .filter(([k]) => k.startsWith('door-'))
      .map(([k, p]) => [`hl.in-${k.slice(5)}`, inside('hillside', p, HOUSE_NAMES[k.slice(5)] ?? '언덕 집')]),
  ),
  // ④ 목장·과수원 and ⑤ 산기슭 마을 (stage 3).
  ...Object.fromEntries(Object.entries(RANCH_SPOTS).map(([k, p]) => [`rc.${k}`, place('ranch', p, p.face, RANCH_NAMES[k] ?? '목장·과수원')])),
  'rc.in-nilah': inside('ranch', RANCH_SPOTS['nilah-door'], '닐라네 집'),
  'rc.in-haku': inside('ranch', RANCH_SPOTS['haku-door'], '하쿠네 집'),
  ...Object.fromEntries(Object.entries(FARM_SPOTS).map(([k, p]) => [`fa.${k}`, place('farm', p, p.face, FARM_NAMES[k] ?? '우리 농장')])),
  ...Object.fromEntries(Object.entries(FOOTHILL_SPOTS).map(([k, p]) => [`fh.${k}`, place('foothill', p, p.face, FOOTHILL_NAMES[k] ?? '산기슭 마을')])),
  'fh.in-ornn': inside('foothill', FOOTHILL_SPOTS['smithy-door'], '대장간 안채'),
  'fh.in-mercy': inside('foothill', FOOTHILL_SPOTS['clinic-door'], '의원 2층'),
  // 허풍 주점 (interior world units).
  't.door': place('tavern', tw('door'), Math.PI / 2, '주점 문 앞'),
  't.bar-1': place('tavern', tw('bar-1'), Math.PI, '주점 바'),
  't.bar-2': place('tavern', tw('bar-2'), Math.PI, '주점 바'),
  't.fire': place('tavern', tw('fire'), -Math.PI / 2, '주점 벽난로 옆'),
  't.booth': place('tavern', tw('booth'), -Math.PI / 2, '주점 구석 자리'),
  't.judge': place('tavern', tw('judge'), Math.PI, '허풍 탁자 옆'),
  't.bar-3': place('tavern', tw('bar-3'), Math.PI, '주점 바'),
  't.bar-4': place('tavern', tw('bar-4'), Math.PI, '주점 바'),
  // 신형만's after-work stool (kept off the evening seat pool).
  't.bar-5': place('tavern', tw('bar-5'), Math.PI, '주점 바 끝자리'),
  't.misun': place('tavern', tw('misun'), -Math.PI / 2, '주점 바 끝자리 옆'),
  't.muzan': place('tavern', tw('muzan'), Math.PI, '주점 안쪽 탁자'),
  't.lumi': place('tavern', tw('lumi'), -Math.PI / 2, '주점 창가 탁자'),
  't.maehwa': place('tavern', tw('maehwa'), Math.PI, '주점 탁자'),
  't.rose': place('tavern', tw('rose'), Math.PI, '주점 바다 그림 아래'),
  't.table-1': place('tavern', tw('table-1'), -Math.PI / 2, '주점 창가 탁자'),
  't.table-2': place('tavern', tw('table-2'), -Math.PI / 2, '주점 탁자'),
  't.table-3': place('tavern', tw('table-3'), Math.PI, '주점 탁자'),
  't.table-4': place('tavern', tw('table-4'), Math.PI, '주점 탁자'),
  't.window': place('tavern', tw('window'), -Math.PI / 2, '주점 창가'),
  't.corner': place('tavern', tw('corner'), Math.PI, '주점 구석'),
  // 공연 밤: the placeholder stage by the fireplace (lounge-town.ts SHOW_*).
  't.stage': place('tavern', tw('stage'), 0, '주점 무대'),
  // Posts of the residents who work indoors (drawn by their own scenes).
  'casino.lumi': place('casino', { x: 0, z: 0 }, 0, '블랙잭 테이블'),
  'casino.rose': place('casino', interiorToWorld(CASINO_LENDER_SPOT), 0, '대부 창구'),
  'lounge.maehwa': place('lounge', { x: 0, z: 0 }, 0, '화투방'),
  // The casino's and the hall's doors (inside, not drawn: the scenes draw the posts).
  'casino.door': place('casino', interiorToWorld(INTERIOR_DOOR), 0, '별빛 카지노'),
  'lounge.door': place('lounge', interiorToWorld(INTERIOR_DOOR), 0, '범마을 회관'),
  'tavern.captain': place('tavern', TAVERN_HOST_AT, 0, '주점 바 안쪽'),
  'bank.nyamo': place('bank', interiorToWorld(BANKER_SPOT), 0, '은행 창구'),
  'salon.gwen': place('salon', interiorToWorld(SALON_STYLIST_SPOT), 0, '미용실'),
  // 가게 실내 (the owners work inside during opening hours).
  ...shopPlaces(),
};
export const npcPlace = (id: string) => NPC_PLACES[id];

// ---------------------------------------------------------------- the area graph
/**
 * Doors between areas: in area A you walk to `from`, vanish for `ms`, and
 * appear at `to` in area B. Hidden areas have no inside to walk.
 */
type Portal = { a: NpcArea; b: NpcArea; from: string; to: string; ms: number };
/** The district spot in front of each shop's door (where its owner stood at the old counter). */
const SHOP_DOOR_OUTSIDE: Record<ShopArea, string> = {
  bakery: 'm.bakery',
  coop: 'm.coop',
  general: 'm.general',
  fishmarket: 'hb.fishmarket',
  barn: 'rc.barn-door',
  orchardShop: 'rc.orchard-door',
  smithy: 'fh.smithy-door',
  clinic: 'fh.clinic-door',
  broker: 'm.broker',
};
const PORTALS: readonly Portal[] = [
  { a: 'village', b: 'market', from: 'v.market-gate', to: 'm.gate', ms: GATE_TRANSIT_MS },
  { a: 'market', b: 'village', from: 'm.gate', to: 'v.market-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'tavern', from: 'v.tavern-door', to: 't.door', ms: DOOR_TRANSIT_MS },
  { a: 'tavern', b: 'village', from: 't.door', to: 'v.tavern-door', ms: DOOR_TRANSIT_MS },
  { a: 'village', b: 'home', from: 'v.home-gate', to: 'home', ms: GATE_TRANSIT_MS },
  { a: 'home', b: 'village', from: 'home', to: 'v.home-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'library', from: 'v.home-gate', to: 'library', ms: GATE_TRANSIT_MS },
  { a: 'library', b: 'village', from: 'library', to: 'v.home-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'harbor', from: 'v.harbor-gate', to: 'hb.gate', ms: GATE_TRANSIT_MS },
  { a: 'harbor', b: 'village', from: 'hb.gate', to: 'v.harbor-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'hillside', from: 'v.home-gate', to: 'hl.gate', ms: GATE_TRANSIT_MS },
  { a: 'hillside', b: 'village', from: 'hl.gate', to: 'v.home-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'ranch', from: 'v.ranch-gate', to: 'rc.gate', ms: GATE_TRANSIT_MS },
  { a: 'ranch', b: 'village', from: 'rc.gate', to: 'v.ranch-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'farm', from: 'v.farm-gate', to: 'fa.gate', ms: GATE_TRANSIT_MS },
  { a: 'farm', b: 'village', from: 'fa.gate', to: 'v.farm-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'foothill', from: 'v.foothill-gate', to: 'fh.gate', ms: GATE_TRANSIT_MS },
  { a: 'foothill', b: 'village', from: 'fh.gate', to: 'v.foothill-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'fields', from: 'v.ranch-gate', to: 'fields', ms: GATE_TRANSIT_MS },
  { a: 'fields', b: 'village', from: 'fields', to: 'v.ranch-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'mountain', from: 'v.foothill-gate', to: 'mountain', ms: GATE_TRANSIT_MS },
  { a: 'mountain', b: 'village', from: 'mountain', to: 'v.foothill-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'away', from: 'v.market-gate', to: 'away', ms: GATE_TRANSIT_MS },
  { a: 'away', b: 'village', from: 'away', to: 'v.market-gate', ms: GATE_TRANSIT_MS },
  { a: 'village', b: 'realty', from: 'v.realty-door', to: 'realty-in', ms: DOOR_TRANSIT_MS },
  { a: 'realty', b: 'village', from: 'realty-in', to: 'v.realty-door', ms: DOOR_TRANSIT_MS },
  { a: 'village', b: 'furniture', from: 'v.furniture-door', to: 'furniture-in', ms: DOOR_TRANSIT_MS },
  { a: 'furniture', b: 'village', from: 'furniture-in', to: 'v.furniture-door', ms: DOOR_TRANSIT_MS },
  { a: 'village', b: 'casino', from: 'v.casino-door', to: 'casino.door', ms: DOOR_TRANSIT_MS },
  { a: 'casino', b: 'village', from: 'casino.door', to: 'v.casino-door', ms: DOOR_TRANSIT_MS },
  { a: 'village', b: 'lounge', from: 'v.hall-door', to: 'lounge.door', ms: DOOR_TRANSIT_MS },
  { a: 'lounge', b: 'village', from: 'lounge.door', to: 'v.hall-door', ms: DOOR_TRANSIT_MS },
  // The shop rooms: in through the door by the old outdoor counter spot.
  ...SHOP_AREAS.flatMap((area): Portal[] => {
    const outside = SHOP_DOOR_OUTSIDE[area];
    const by = SHOP_INTERIORS[area].district;
    return [
      { a: by, b: area, from: outside, to: `${area}.door`, ms: DOOR_TRANSIT_MS },
      { a: area, b: by, from: `${area}.door`, to: outside, ms: DOOR_TRANSIT_MS },
    ];
  }),
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
const walkers = new Map<string, ReturnType<typeof regionWalk>>();
type WalkDistrict = 'market' | 'harbor' | 'hillside' | 'ranch' | 'foothill' | 'farm';
const isWalkDistrict = (a: NpcArea): a is WalkDistrict => a === 'market' || a === 'harbor' || a === 'hillside' || a === 'ranch' || a === 'foothill' || a === 'farm';
const walkerOf = (area: WalkDistrict) => {
  let w = walkers.get(area);
  if (!w) walkers.set(area, (w = regionWalk(area)));
  return w;
};
/** Waypoints (area coordinates) from one place to another inside a visible area; first = start. */
export function walkPath(area: NpcArea, from: WalkPoint, to: WalkPoint): WalkPoint[] {
  const key = `${area}:${from.x},${from.z}>${to.x},${to.z}`;
  const hit = pathCache.get(key);
  if (hit) return hit;
  let pts: WalkPoint[];
  if (area === 'village') pts = villagePath(from, to);
  else if (isWalkDistrict(area)) pts = walkerOf(area).path(from, to);
  else if (area === 'tavern') {
    const s = worldToInterior(from),
      e = worldToInterior(to);
    pts = interiorPath(s, e, 'tavern').map((p) => interiorToWorld(p));
  } else if (isShopArea(area)) {
    // Residents walk as staff (round the counter's ends to the owner's spot).
    pts = shopPath(area, worldToInterior(from), worldToInterior(to), { staff: true, radius: SHOP_STAFF_RADIUS }).map((p) => shopWorld(p));
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
  if (isWalkDistrict(area)) return walkerOf(area).canWalk(p);
  if (area === 'tavern') return interiorCanWalk(worldToInterior(p), 'tavern');
  if (isShopArea(area)) return shopCanWalk(worldToInterior(p), area, SHOP_STAFF_RADIUS, true);
  return true;
}

// ---------------------------------------------------------------- day plans
type Seg = readonly [hhmm: number, place: string, act: NpcActivity, label?: string];
/** `day` is the game day (varies the seeds); weekday, weather and festivals come from its real KST day. */
export type DayKind = { weekday: number; rain: boolean; marketDay: boolean; festival: boolean; day: number; hill: boolean };
export function dayKind(day: number, hill = false): DayKind {
  const real = realDayOfGameDay(day);
  const weekday = weekdayOf(real);
  const w = weatherOf(real);
  return {
    day,
    hill,
    weekday,
    rain: w === 'rain' || w === 'storm',
    marketDay: weekday === 0,
    festival: holidaysOn(real).some((h) => !!h.claim),
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

// ---------------------------------------------------------------- 범마을 부동산
export type RealtyKeeper = 'realtor' | 'misun';
/**
 * Who keeps 범마을 부동산 on a KST weekday (0 = Sunday): 신형만 ('realtor') on
 * Mon/Wed/Fri, 봉미선 ('misun') on Tue/Thu; at the weekend both are in, one at
 * the counter and the other showing the model house (Sat 형만 at the counter,
 * Sun 미선).
 */
export function realtyDuty(weekday: number): { counter: RealtyKeeper; model: RealtyKeeper | null } {
  switch (weekday) {
    case 1:
    case 3:
    case 5:
      return { counter: 'realtor', model: null };
    case 2:
    case 4:
      return { counter: 'misun', model: null };
    case 6:
      return { counter: 'realtor', model: 'misun' };
    default:
      return { counter: 'misun', model: 'realtor' };
  }
}
/** The realty keeper at the counter at `now` (the counter shows their face and name). */
export const realtyKeeper = (now: number): RealtyKeeper => realtyDuty(weekdayOf(kstDay(now))).counter;

function realtyPlan(id: RealtyKeeper, k: DayKind): Seg[] {
  const duty = realtyDuty(k.weekday);
  // The friends play late, so both stay out until 01:00 (game clock): 형만 on his
  // stool at the tavern, 미선 coming to fetch him (and staying for a glass).
  const night: Seg = id === 'realtor' ? [0, 't.bar-5', 'drink', '주점에서 늦게까지 한잔'] : [0, 't.misun', 'drink', '주점에서 형만 씨랑 한잔하는 중'];
  const morning: Seg[] = [night, [hm(1), 'home', 'sleep', '집에서 자는 중']];
  const evening: Seg[] =
    k.weekday === 0
      ? [
          [hm(18, 30), id === 'realtor' ? 'v.couple-a' : 'v.couple-b', 'stroll', '부부 저녁 산책 중'],
          [hm(21, 30), night[1], 'drink', id === 'realtor' ? '산책 끝에 주점에서 맥주 한잔' : '주점에서 형만 씨랑 한잔하는 중'],
        ]
      : id === 'realtor'
        ? [[hm(19), 't.bar-5', 'drink', '퇴근하고 주점에서 맥주 한잔']]
        : [
            [hm(18), 'm.misun', 'stroll', '저녁 장 보는 중'],
            [hm(19, 30), 'm.misun', 'stroll', '시장 거리 마감 세일 구경 중'],
            [hm(21, 30), 't.misun', 'drink', '형만 씨 데리러 주점에 온 중'],
            [hm(22, 30), 't.misun', 'drink', '결국 주점에서 같이 한잔하는 중'],
          ];
  if (duty.counter === id) return [...morning, [hm(9), 'realty-in', 'work', '범마을 부동산 상담 중'], ...evening];
  if (duty.model === id) return [...morning, [hm(9, 30), 'realty-model', 'stroll', '모델하우스 안내 중'], ...evening];
  // Off duty: 형만 helps his old company out of the village, 미선 does the shopping.
  if (id === 'realtor') return [...morning, [hm(8), 'away', 'work', '옛 회사 일 도우러 출근 중'], ...evening];
  return [
    ...morning,
    [hm(10), 'coop.browse-2', 'stroll', '농협에서 세일 품목 고르는 중'],
    [hm(11, 40), 'bakery.queue', 'eat', '빵집 카페에서 점심 빵 고르는 중'],
    [hm(13), 'm.misun', 'stroll', '장바구니 들고 시장 구경 중'],
    [hm(16, 30), 'bakery.browse', 'eat', '빵집 마감 할인 기다리는 중'],
    ...evening,
  ];
}

// ---------------------------------------------------------------- 범마을 증권
/** 무잔's weekly day off (KST weekday, 0 = Sunday: the 일요 장터 he walks as a customer). */
export const MUZAN_DAY_OFF = 0;
/**
 * 지점장 무잔 (design-broker-muzan.md): behind the broker's counter before the
 * 09:00 open until the books are closed after 15:30, tea at the ticker board
 * at noon, then a walk along 시장 거리 counting the shops' trade. Evenings by
 * weekday: the casino's lamp (Mon/Thu), the tavern (Tue/Fri), the market's
 * lamps (Wed/Sat); rain sends him to the tavern. He always ends the night at
 * his tavern table and goes home at 01:00. Sunday is his day off.
 */
function muzanPlan(k: DayKind): Seg[] {
  const late: Seg = [hm(22, 30), 't.muzan', 'drink', '주점에서 늦게까지 장부 이야기 중'];
  const start: Seg[] = [[0, 't.muzan', 'drink', '주점에서 늦게까지 장부 이야기 중'], [hm(1), 'home', 'sleep', '집에서 쉬는 중']];
  const evening: Seg =
    k.rain || k.weekday === 2 || k.weekday === 5
      ? [hm(18), 't.muzan', 'drink', '주점에서 와인 한잔하며 오늘 장 복기 중']
      : k.weekday === 1 || k.weekday === 4 || k.weekday === 0
        ? [hm(18), 'v.muzan-casino', 'stroll', '카지노 앞에서 오늘의 확률 구경 중']
        : [hm(18), 'm.muzan-lamp', 'stroll', '시장 거리 등불 아래 우아하게 산책 중'];
  if (k.weekday === MUZAN_DAY_OFF)
    return [
      ...start,
      [hm(10), 'm.muzan', 'stroll', '휴무일 · 장날 좌판 사이 시장 조사 중'],
      [hm(12), 'bakery.seat-cafe-3', 'eat', '빵집 카페에서 느긋한 점심'],
      // The harbor is two district gates away (game minutes on the game clock): a long lunch first.
      [hm(14), k.rain ? 't.muzan' : 'hb.bench-e', k.rain ? 'drink' : 'stroll', k.rain ? '주점에서 비 피하며 신문 읽는 중' : '항구에서 어시장 경기 살피는 중'],
      evening,
      late,
    ];
  return [
    ...start,
    [hm(8, 20), 'broker.owner', 'work', '개장 전 시황 점검 중'],
    [hm(9), 'broker.owner', 'work', '범마을 증권 창구'],
    [hm(12), 'broker.board', 'eat', '전광판 앞에서 점심 대신 차 한잔'],
    [hm(12, 40), 'broker.owner', 'work', '범마을 증권 창구'],
    [hm(15, 30), 'broker.owner', 'work', '장 마감 정리 · 매매 일지 쓰는 중'],
    [hm(16, 30), k.rain ? 'bakery.seat-cafe-3' : 'm.muzan', k.rain ? 'eat' : 'stroll', k.rain ? '빵집 카페에서 비 피하며 홍차 한잔' : '시장 거리 산책 · 가게 매출 살피는 중'],
    evening,
    late,
  ];
}

// ---------------------------------------------------------------- the casino and the hall
// 루미 (블랙잭 딜러), 매화 (화투방) and 로제 (대부 창구) work the evening rush
// at their posts and walk the village on their breaks and one day off a week
// (루미 화, 매화 수, 로제 월). The tables and the desk never wait for them:
// the games are dealt by the server and the lender's book is a desk at a fixed
// spot (nearCasinoLender), so while they are out the scenes show an empty
// post with an "자동 진행 / 창구 장부" note (npcAtPost).
type HostNpc = 'lumi' | 'maehwa' | 'rose';
export const NPC_POSTS: Readonly<Record<HostNpc, string>> = { lumi: 'casino.lumi', maehwa: 'lounge.maehwa', rose: 'casino.rose' };
/** KST weekday off (0 = Sunday). */
export const HOST_DAY_OFF: Readonly<Record<HostNpc, number>> = { lumi: 2, maehwa: 3, rose: 1 };
const POST_LABEL: Record<HostNpc, string> = { lumi: '별빛 카지노 딜러', maehwa: '회관 화투방', rose: '카지노 대부 창구' };
/** Where a host is as day `k` ends (the next day starts there and sends them home at 01:00). */
function hostLate(id: HostNpc, k: DayKind): Seg {
  if (k.weekday !== HOST_DAY_OFF[id]) return [0, NPC_POSTS[id], 'work', POST_LABEL[id]];
  if (id === 'lumi') return k.rain ? [0, 't.lumi', 'drink', '주점 창가에서 꽃차 마시는 중'] : [0, 'v.lumi-late', 'stroll', '광장 가로등 아래서 밤 산책 중'];
  if (id === 'maehwa') return k.rain ? [0, 't.maehwa', 'eat', '주점에서 안주 나눠 먹는 중'] : [0, 'v.hall-late', 'stroll', '회관 앞 골목 밤 산책 중'];
  return k.rain ? [0, 't.rose', 'drink', '주점에서 허 선장과 바다 이야기 중'] : [0, 'hb.rose', 'stroll', '밤 선착장에서 바다 보는 중'];
}
function hostPlan(id: HostNpc, k: DayKind): Seg[] {
  const start: Seg[] = [hostLate(id, dayKind(k.day - 1, k.hill)), [hm(1), 'home', 'sleep']];
  const post = (t: number): Seg => [t, NPC_POSTS[id], 'work', POST_LABEL[id]];
  const late = hostLate(id, k);
  const off = k.weekday === HOST_DAY_OFF[id];
  if (id === 'lumi')
    return off
      ? [
          ...start,
          [hm(11), 'm.lumi-cafe', 'eat', '빵집 카페 테라스에서 브런치 중'],
          [hm(12, 30), 'm.lumi-flowers', 'stroll', '시장 꽃 좌판 구경 중'],
          [hm(14), k.rain ? 'v.casino-yard' : 'v.lumi-flower', 'stroll', k.rain ? '카지노 처마 밑에서 비 구경 중' : '연못가 꽃밭 산책 중'],
          [hm(16, 30), 'm.lumi-cafe', 'eat', '빵집 카페에서 달콤한 음료 마시는 중'],
          [hm(19, 30), 't.lumi', 'drink', '주점 창가에서 꽃차 마시는 중'],
          [hm(22, 30), late[1], late[2], late[3]],
        ]
      : [
          ...start,
          [hm(10, 30), 'm.lumi-cafe', 'eat', '출근 전 빵집 카페에서 달콤한 음료 한잔'],
          post(hm(11, 30)),
          [hm(15), k.rain ? 'v.casino-yard' : 'v.lumi-flower', 'rest', k.rain ? '카지노 처마 밑에서 쉬는 시간' : '쉬는 시간에 연못가 꽃 구경 중'],
          post(hm(16)),
        ];
  if (id === 'maehwa')
    return off
      ? [
          ...start,
          [hm(9), 'm.maehwa', 'stroll', '시장 거리에서 찻감·요리 재료 장보는 중'],
          [hm(10, 30), 'coop.drop', 'stroll', '농협에서 햇곡식 고르는 중'],
          [hm(12), 't.maehwa', 'eat', '주점에서 허 선장과 안주 바꿔 먹는 중'],
          [hm(14), k.rain ? 'v.hall-yard' : 'v.maehwa-orchard', 'stroll', k.rain ? '회관 처마 밑에서 비 구경 중' : '과수원 길 산책 중'],
          [hm(16), 'v.hall-yard', 'rest', '회관 앞마당에서 차 한잔 중'],
          [hm(19, 30), 't.maehwa', 'eat', '주점에서 직접 만든 안주 나누는 중'],
          [hm(22, 30), late[1], late[2], late[3]],
        ]
      : [
          ...start,
          [hm(8, 30), 'm.maehwa', 'stroll', '시장 거리에서 찻감·요리 재료 장보는 중'],
          post(hm(9, 30)),
          [hm(13), 't.maehwa', 'eat', '주점에서 허 선장과 안주 바꿔 먹는 점심'],
          post(hm(14)),
          [hm(18), k.rain ? NPC_POSTS.maehwa : 'v.hall-yard', k.rain ? 'work' : 'rest', k.rain ? POST_LABEL.maehwa : '회관 앞마당에서 차 한잔 쉬는 중'],
          post(hm(18, 40)),
        ];
  return off
    ? [
        ...start,
        [hm(9), k.rain ? 'fishmarket.browse' : 'hb.rose', 'stroll', k.rain ? '어시장에서 비 피하며 생선 구경 중' : '선착장에서 아침 바다 보는 중'],
        [hm(10, 30), 'fishmarket.browse', 'stroll', '어시장에서 귀한 바닷고기 고르는 중'],
        [hm(12), 't.rose', 'eat', '주점에서 허 선장과 바다 이야기 중'],
        [hm(14), 'general.browse', 'stroll', '잡화점에서 보석 값 흥정 중'],
        [hm(15, 30), k.rain ? 't.rose' : 'hb.rose-sunset', 'stroll', k.rain ? '주점에서 비 그치길 기다리는 중' : '방파제에서 바다 보는 중'],
        [hm(19, 30), 't.rose', 'drink', '주점에서 허 선장과 바다 이야기 중'],
        [hm(22, 30), late[1], late[2], late[3]],
      ]
    : [
        ...start,
        [hm(9, 30), k.rain ? 'general.browse' : 'hb.rose', 'stroll', k.rain ? '잡화점에서 보석 구경 중' : '출근 전 선착장에서 바다 보는 중'],
        [hm(10, 40), 'general.browse', 'stroll', '잡화점에서 보석 값 흥정 중'],
        post(hm(11, 30)),
        // A long break: the breakwater is two district gates from the casino, and walks take game minutes.
        [hm(17), k.rain ? NPC_POSTS.rose : 'hb.rose-sunset', k.rain ? 'work' : 'rest', k.rain ? POST_LABEL.rose : '쉬는 시간에 방파제에서 노을 보는 중'],
        post(hm(19)),
      ];
}
/**
 * Whether a resident is at their indoor post right now (the scenes draw them
 * there; otherwise the table runs on its own and the desk shows its book).
 */
export function npcAtPost(id: NpcId, now: number, world: NpcWorld = worldDefault): boolean {
  const s = npcSpot(id, now, world);
  return isPostPlace(s.place) && s.activity !== 'transit' && !s.place.endsWith('.door');
}

function planOf(id: NpcId, k: DayKind): Seg[] {
  const seed = (salt: string, n: number) => hash32(`${id}:${k.day}:${salt}`) % n;
  switch (id) {
    case 'nasera': {
      const lunch: Seg = k.rain ? [hm(12), 'bakery.seat-cafe-1', 'eat', '빵집 카페에서 비 피하며 점심'] : [hm(12), 'library', 'read', '도서관에서 책 읽는 중'];
      const plan: Seg[] = k.marketDay
        ? [
            [0, 'home', 'sleep'],
            [hm(6), 'coop.owner', 'work', '농협 매입 창구'],
            [hm(9), 'm.stall-e', 'stall', '장날 작물 좌판'],
            lunch,
            [hm(13), 'm.stall-e', 'stall', '장날 작물 좌판'],
            [hm(16), 'coop.owner', 'work', '장날 장부 정리'],
            [hm(18), 'fa.lane', 'patrol', '농장 밭 순찰 중'],
            [hm(18, 40), 'fa.yard', 'patrol', '농장 밭 순찰 중'],
            [hm(19, 20), 'v.orchard', 'patrol', '과수원 살피는 중'],
            [hm(20), 'home', 'sleep', '언덕 집에서 쉬는 중'],
          ]
        : [
            [0, 'home', 'sleep'],
            [hm(6), 'coop.owner', 'work', '농협 매입 창구'],
            lunch,
            [hm(13), 'coop.owner', 'work', '농협 매입 창구'],
            [hm(18), 'fa.lane', 'patrol', '농장 밭 순찰 중'],
            [hm(18, 40), 'fa.yard', 'patrol', '농장 밭 순찰 중'],
            ...(k.weekday === 3
              ? ([
                  [hm(19), 'hl.library-club', 'read', '도서관 독서 모임'],
                  [hm(21), 'home', 'sleep', '언덕 집에서 쉬는 중'],
                ] as Seg[])
              : ([
                  [hm(19, 20), 'v.orchard', 'patrol', '과수원 살피는 중'],
                  [hm(20), 'home', 'sleep', '언덕 집에서 쉬는 중'],
                ] as Seg[])),
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
            [open, 'bakery.owner', 'work', open > hm(10) ? '늦잠 자고 이제 가게 여는 중' : '빵집 카페'],
            [hm(11, 30), 'm.stall-se', 'stall', '장날 빵 좌판'],
            [hm(14), 'bakery.owner', 'work', '빵집 카페'],
            nap,
            [hm(16), 'bakery.owner', 'work', '빵집 카페'],
            night,
            [hm(21), 'home', 'sleep', '언덕 집에서 쉬는 중'],
          ]
        : [
            [0, 'home', 'sleep'],
            [open, 'bakery.owner', 'work', open > hm(10) ? '늦잠 자고 이제 가게 여는 중' : '빵집 카페'],
            nap,
            [hm(16), 'bakery.owner', 'work', '빵집 카페'],
            night,
            [hm(21), 'home', 'sleep', '언덕 집에서 쉬는 중'],
          ];
      return festival(plan, k, 1);
    }
    case 'thresh': {
      const lantern = k.weekday === 6;
      const plan: Seg[] = [
        [0, 'home', 'sleep'],
        [hm(8), 'general.owner', 'work', '잡화점'],
        ...(k.marketDay ? ([[hm(14), 'm.stall-w', 'stall', '장날 경매 여는 중'], [hm(17), 'general.owner', 'work', '잡화점']] as Seg[]) : []),
        [hm(19), 'v.harbor', 'stroll', '밤바다 산책 중'],
        [hm(20), 'v.beach', 'stroll', '해변에서 등불 켜는 중'],
        lantern ? [hm(21), 'general.owner', 'work', '밤에만 여는 등불 상점'] : [hm(21), 't.fire', 'drink', '주점 벽난로 옆에서 수집품 자랑'],
        [hm(23), 'home', 'sleep', '언덕 집에서 쉬는 중'],
      ];
      return festival(plan, k, 2);
    }
    case 'sinjjajang': {
      // The morning round visits the friends' houses on 우리 농장 in a daily order, then the harbor.
      const order = [0, 1, 2, 3, 4, 5, 6].sort((a, b) => hash32(`mail:${k.day}:${a}`) - hash32(`mail:${k.day}:${b}`)).slice(0, 4);
      const round: Seg[] = order.map((a, i) => [hm(9) + i * 22, `fa.door-${a}`, 'deliver', `${FARM_HOUSES.find((h) => h.actor === a)?.name ?? '친구 집'}에 편지 배달 중`] as Seg);
      const plan: Seg[] = [
        [0, 'home', 'sleep'],
        [hm(7), 'm.post', 'work', '우체국에서 우편 분류'],
        ...round,
        [hm(10, 40), 'hb.lighthouse-yard', 'deliver', '항구 등대까지 배달 중'],
        [hm(12), 'm.cafe-1', 'eat', '빵집 카페에서 점심'],
        [hm(13), 'coop.drop', 'deliver', '농협에 소포 전하는 중'],
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
        [hm(15), 'fa.lane', 'patrol', '우리 농장 집 앞 순찰 중'],
        [hm(15, 40), k.rain ? 'v.bridge' : 'v.beach', 'patrol', k.rain ? '다리 위에서 물길 살피는 중' : '해변 순찰 중'],
        [hm(16, 20), 'hb.quay', 'patrol', '항구 순찰 중'],
        [hm(17, 10), 'm.board', 'patrol', '수배 전단 붙이는 중'],
      ];
      const plan: Seg[] = [
        [0, 'home', 'sleep'],
        [hm(8), 'm.police', 'work', '파출소 근무'],
        [hm(12), 'bakery.seat-cafe-2', 'eat', '빵집 카페에서 빵 먹는 중'],
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
    case 'misun':
      return realtyPlan(id, k);
    case 'carpenter':
      return [
        [0, 'furniture-in', 'work', '나무결 가구점'],
        [hm(18), k.rain ? 'v.plaza-e' : 'v.orchard', 'stroll', k.rain ? '광장에서 비 구경' : '과수원 나뭇결 구경'],
        [hm(19, 10), 'furniture-in', 'work', '나무결 가구점'],
      ];
    case 'lumi':
    case 'maehwa':
    case 'rose':
      return hostPlan(id, k);
    case 'captain':
      return [[0, 'tavern.captain', 'work', '허풍 주점 바']];
    case 'nyamo':
      return [[0, 'bank.nyamo', 'work', '은행 창구']];
    case 'gwen':
      return [[0, 'salon.gwen', 'work', '보송 미용실']];
    // ---------------------------------------------------------- stage 2 (not drawn until they have sprites)
    case 'gabung': {
      const plan: Seg[] = [
        [0, 'hb.lighthouse-in', 'sleep', '등대에서 불 지키는 중'],
        [hm(5), 'hb.lighthouse-door', 'work', '등대 점검 중'],
        [hm(7), 'hb.breakwater-mid', 'patrol', '방파제 순찰 중'],
        [hm(9), k.rain ? 'hb.lighthouse-door' : 'hb.breakwater-end', 'forecast', k.rain ? '등대 앞에서 폭풍 경보' : '방파제 끝에서 날씨 발표'],
        [hm(10, 30), 'hb.pier-end', 'patrol', '선착장 순찰 중'],
        [hm(12), 'm.cafe-5', 'eat', '빵집 카페에서 점심'],
        [hm(13), 'hb.quay', 'work', '항구 부두 정비'],
        [hm(15, 30), 'hb.lighthouse-yard', 'work', '등대 마당 정비'],
        [hm(18), 'hb.lighthouse-door', 'work', '등대 불 켜는 중'],
      ];
      return plan;
    }
    case 'lux':
      return [
        [0, 'home', 'sleep'],
        [hm(5), 'hb.auction', 'stall', '새벽 경매 여는 중'],
        [hm(8), 'fishmarket.owner', 'work', '어시장'],
        [hm(12), 'hb.lighthouse-door', 'deliver', '등대에 도시락 배달 중'],
        [hm(13), 'fishmarket.owner', 'work', '어시장'],
        [hm(15), 'hb.guild', 'work', '낚시조합'],
        [hm(18), 't.bar-1', 'drink', '주점에서 하루 마무리'],
        [hm(20), 'home', 'sleep', '언덕 집에서 쉬는 중'],
      ];
    case 'himmel':
      return [
        [0, 'home', 'sleep'],
        [hm(8), 'bakery.helper', 'work', '사장 대신 빵집 문 여는 중'],
        [hm(9), 'bakery.helper', 'work', '빵집 알바'],
        [hm(15), 'v.plaza', 'work', '광장에서 동상 청원 서명 받는 중'],
        [hm(17), 'hb.pier-root', 'deliver', '항구 심부름 중'],
        [hm(19), 'home', 'sleep', '청년 자취방에서 쉬는 중'],
      ];
    case 'beatrice':
      return [
        [0, 'hl.library-in', 'sleep', '도서관 안'],
        [hm(9), 'hl.library-in', 'work', '도서관 사서'],
        ...(k.rain
          ? ([
              [hm(13), 'bakery.seat-cafe-3', 'eat', '빵집 카페에서 홍차 마시는 중'],
              [hm(14), 'hl.library-in', 'work', '도서관 사서'],
            ] as Seg[])
          : []),
        ...(k.weekday === 3
          ? ([
              [hm(19), 'hl.library-steps', 'read', '도서관 독서 모임'],
              [hm(21), 'hl.library-in', 'sleep', '도서관 안'],
            ] as Seg[])
          : []),
      ];
    case 'bocchi': {
      const show = k.weekday === 2 || k.weekday === 5;
      const practice = seed('practice', 2) ? 'hb.shed' : 'hl.park-corner';
      return [
        [0, 'home', 'sleep'],
        [hm(10), practice, 'work', '구석에서 혼자 기타 연습'],
        ...(show
          ? ([
              [hm(19, 30), 't.stage', 'work', '주점 무대에서 공연 준비'],
              [hm(22), 'home', 'sleep', '언덕 집에서 쉬는 중'],
            ] as Seg[])
          : ([
              [hm(17), 'hl.park-bench-e', 'rest', '공원 벤치에서 가사 쓰는 중'],
              [hm(21), 'home', 'sleep', '언덕 집에서 쉬는 중'],
            ] as Seg[])),
      ];
    }
    case 'tsunade':
      return [
        [0, 'home', 'sleep'],
        [hm(6), 'hl.garden-w', 'work', '텃밭 가꾸는 중'],
        [hm(10), 'hl.garden-e', 'work', '약초 손질 중'],
        [hm(11, 20), 'coop.browse', 'stroll', '농협에서 씨앗 고르는 중'],
        [hm(12), 'm.cafe-7', 'eat', '빵집 카페에서 점심'],
        [hm(14), 'hl.garden-gate', 'work', '텃밭 앞에서 조언하는 중'],
        [hm(17), 'home', 'rest', '언덕 집에서 쉬는 중'],
      ];
    case 'makima': {
      if (k.marketDay)
        return [
          [0, 'away', 'sleep', '마을 밖'],
          [hm(9), 'm.stall-sw', 'stall', '장날 노점'],
          [hm(17), 't.bar-3', 'eat', '주점에서 저녁 식사'],
          [hm(20), 'away', 'sleep', '마을 밖'],
        ];
      if (k.weekday === 3 || k.weekday === 6)
        return [
          [0, 'away', 'sleep', '마을 밖'],
          [hm(10), 'hb.quay-2', 'stall', '항구 좌판'],
          [hm(17), 't.bar-3', 'eat', '주점에서 저녁 식사'],
          [hm(20), 'away', 'sleep', '마을 밖'],
        ];
      return [[0, 'away', 'sleep', '마을 밖']];
    }
    case 'muzan':
      return muzanPlan(k);
    // ---------------------------------------------------------- stage 3 (design-npcs-stage3.md §3)
    case 'nilah':
      return [
        [0, 'home', 'sleep'],
        [hm(5), 'barn.owner', 'work', '축사 동물 돌보는 중'],
        [hm(7), 'rc.pasture', 'work', '초원에서 소 몰이 중'],
        [hm(9), 'barn.owner', 'work', '닐라 목장'],
        [hm(12), 'rc.pavilion', 'eat', '원두막에서 점심'],
        [hm(13), 'barn.owner', 'work', '닐라 목장'],
        [hm(16), k.rain ? 'barn.browse' : 'rc.stream-w', 'rest', k.rain ? '축사에서 비 구경' : '개울에서 물놀이 중'],
        [hm(18), 'rc.coop', 'work', '닭장 문 닫는 중'],
      ];
    case 'haku':
      return [
        [0, 'home', 'sleep'],
        [hm(6), 'rc.orchard-row-a', 'patrol', '과수원 순찰 중'],
        [hm(9), 'orchardShop.owner', 'work', '강물 과수원 창고'],
        [hm(12), 'rc.pavilion-2', 'eat', '원두막에서 점심'],
        [hm(14), 'rc.orchard-row-c', 'work', '과일나무 손질 중'],
        [hm(16), 'orchardShop.owner', 'work', '강물 과수원 창고'],
        [hm(17, 30), 'rc.stones', 'rest', '징검다리에서 물소리 듣는 중'],
      ];
    case 'ornn':
      return [
        [0, 'home', 'sleep'],
        [hm(6), 'smithy.owner', 'work', '풀무에 불 지피는 중'],
        [hm(12), 'fh.bench-forge', 'eat', '대장간 옆에서 점심'],
        [hm(13), 'smithy.owner', 'work', '오른의 대장간'],
        [hm(15), 'fh.mine-yard', 'work', '광산 입구에서 광석 감정 중'],
        [hm(16, 30), 'smithy.owner', 'work', '오른의 대장간'],
      ];
    case 'mercy':
      return [
        [0, 'home', 'sleep'],
        [hm(9), 'clinic.owner', 'work', '메르시 의원 진료 중'],
        [hm(12), 'fh.bench-clinic', 'eat', '의원 앞에서 커피 한 잔'],
        [hm(13), 'clinic.owner', 'work', '메르시 의원 진료 중'],
        [hm(16, 30), k.rain ? 'clinic.owner' : 'v.housecall', 'work', k.rain ? '비 오는 날 의원 지키는 중' : '마을 광장 왕진 중'],
        [hm(18), 'clinic.owner', 'work', '저녁 진료 중'],
      ];
    case 'shinichi': {
      if (!fortuneOpenOn(realDayOfGameDay(k.day))) return [[0, 'away', 'sleep', '사건 의뢰로 마을 밖']];
      if (k.festival)
        return [
          [0, 'away', 'sleep', '마을 밖'],
          [hm(10), 'fh.tent', 'stall', '점집 천막에서 운세 보는 중'],
          [hm(15), 'v.fortune', 'stall', '광장 축제에서 운세 보는 중'],
        ];
      return [
        [0, 'away', 'sleep', '마을 밖'],
        [hm(10), 'fh.tent', 'stall', '점집 천막에서 운세 보는 중'],
        [hm(13), 'fh.plaza-e', 'stroll', '산기슭 광장에서 단서 찾는 중'],
        [hm(14), 'fh.tent', 'stall', '점집 천막에서 운세 보는 중'],
      ];
    }
    case 'yanineko':
      // Wakes at 11; naps in the library until 베아트리스 chases her out; sunbathes at the harbor.
      return [
        [0, 'home', 'sleep'],
        [hm(11, 30), 'hl.library-steps', 'nap', '도서관에서 조는 중'],
        // (Not the harbor shed: 봇치 may be practising there.)
        [hm(15), k.rain ? 'fishmarket.browse' : 'hb.pier-mid', 'rest', k.rain ? '어시장 처마 밑에서 생선 냄새 맡으며 비 피하는 중' : '선착장에서 해바라기 중'],
        [hm(18), 'v.plaza', 'rest', '광장에서 어슬렁거리는 중'],
        [hm(20), 'home', 'sleep', '청년 자취방에서 뒹구는 중'],
      ];
  }
}

/**
 * Homes: before ③ 언덕 주택가 opens, 'home' / 'library' are the hidden stand-ins
 * at the hub's west gate and every hillside place falls back to them; once it
 * is open, 'home' is the resident's own house up there.
 */
function homesOf(id: NpcId, plan: Seg[], hill: boolean): Seg[] {
  const map = (p: string) => {
    if (hill) {
      if (p === 'home') return HILL_HOMES[id] ?? 'home';
      if (p === 'library') return 'hl.library-in';
      return p;
    }
    if (!p.startsWith('hl.')) return p;
    return p.startsWith('hl.library') ? 'library' : 'home';
  };
  return plan.map(([t, p, act, label]) => [t, map(p), act, label] as Seg);
}


// ---------------------------------------------------------------- evenings
// Every resident who walks about stays out until 01:00 and sleeps only
// 01:00–(morning) on the game clock (this predates the game clock, when the
// friends played 20:00–01:00 KST; the evening is kept as the village's night). The day plans above
// cover the day until about 19:00; the evening comes from here: an evening
// spot from 19:30 and a late spot from 22:30, which they keep past midnight —
// the next day's timeline starts where the last one ended and sends them home
// at 01:00. Venues vary by weekday; seats in a venue are handed out in the
// residents' order, so two residents never stand on the same spot.
const NIGHT_START = hm(19, 30),
  LATE_START = hm(22, 30),
  BED_TIME = hm(1);
type Venue = 'T' | 'P' | 'M' | 'H' | 'B' | 'L' | 'R' | 'F';
/** Seats per venue (the fixed spots below are never in a pool). */
const VENUE_SEATS: Record<Venue, readonly string[]> = {
  T: ['t.bar-1', 't.bar-2', 't.bar-3', 't.bar-4', 't.fire', 't.booth', 't.table-1', 't.table-2', 't.table-3', 't.table-4', 't.window', 't.corner'],
  // 우리 농장 (§5): the new west park takes the evening crowd the plaza cannot seat.
  P: ['v.plaza', 'v.plaza-bench', 'v.plaza-e', 'v.pavilion', 'v.board', 'v.museum', 'v.bridge', 'v.park', 'v.park-2'],
  M: ['m.bench-w', 'm.bench-e', 'm.plaza-n', 'm.plaza-s', 'm.cafe-1', 'm.cafe-2', 'm.cafe-3', 'm.cafe-4', 'm.board'],
  H: ['v.harbor', 'v.beach', 'v.camp', 'v.lake'],
  B: ['hb.bench-w', 'hb.bench-e', 'hb.quay', 'hb.pier-mid', 'hb.pier-end', 'hb.auction-crowd', 'hb.board'],
  L: ['hl.park-bench-w', 'hl.park-bench-e', 'hl.plaza', 'hl.park-corner', 'hl.lane-n', 'hl.lane-s', 'hl.garden-gate'],
  R: ['rc.bench-stream', 'rc.stream-e', 'rc.pavilion', 'rc.bridge', 'rc.bench-orchard', 'rc.board'],
  F: ['fh.bench-plaza', 'fh.plaza', 'fh.bench-clinic', 'fh.board', 'fh.path'],
};
const VENUE_LABEL: Record<Venue, [eve: string, late: string]> = {
  T: ['주점에서 한잔하는 중', '주점에서 늦게까지 수다 중'],
  P: ['광장에서 저녁 바람 쐬는 중', '광장 가로등 아래서 쉬는 중'],
  M: ['시장 거리 밤 등불 구경 중', '시장 벤치에서 밤 산책 중'],
  H: ['밤바다 보러 나온 중', '해변에서 별 보는 중'],
  B: ['항구에서 밤바다 구경 중', '항구 벤치에서 쉬는 중'],
  L: ['언덕 공원에서 쉬는 중', '언덕 골목에서 산책 중'],
  R: ['개울가에서 반딧불 보는 중', '목장 밤바람 쐬는 중'],
  F: ['산기슭 광장에서 쉬는 중', '산바람 맞으며 별 보는 중'],
};
/**
 * Evening and late codes for Sunday…Saturday. A venue letter, or a fixed
 * spot: S 주점 무대 (공연 밤), J 허풍 심판석, G 밤의 등불 상점, D 등대 앞,
 * K 독서 모임 자리, Y 도서관 계단 (the hillside ones fall back to a venue until
 * ③ 언덕 주택가 opens).
 */
const NIGHTS: Record<string, { eve: string; late: string }> = {
  nasera: { eve: 'MPTKTPM', late: 'TTPPHTP' },
  frieren: { eve: 'TMTLMTM', late: 'PTTPTTP' },
  thresh: { eve: 'HHTHHTH', late: 'TMTTTTG' },
  sinjjajang: { eve: 'PMPTPMT', late: 'TPTPTTP' },
  volibas: { eve: 'MPMPMJP', late: 'PTPTPTT' },
  janna: { eve: 'TPMTPMT', late: 'PTTMTPT' },
  gabung: { eve: 'BBBBBBB', late: 'DDDDDDD' },
  lux: { eve: 'TBTBTBT', late: 'LBLTLBT' },
  himmel: { eve: 'PTTPTTM', late: 'LPTLPTL' },
  beatrice: { eve: 'YYYYYYY', late: 'YTYYTYY' },
  bocchi: { eve: 'LBSLBSL', late: 'TTTLTTB' },
  tsunade: { eve: 'TLTTLTT', late: 'TTLTTTT' },
  makima: { eve: 'TTTTTTT', late: 'TTTTTTT' },
  yanineko: { eve: 'BPHBPBH', late: 'PTLPMTL' },
  // Stage 3 (R 목장 저녁, F 산기슭 저녁, A 대장간 모루).
  nilah: { eve: 'TRBRTRT', late: 'RTRTRBT' },
  haku: { eve: 'RRPRRPR', late: 'RRRTRRR' },
  ornn: { eve: 'AAATAAA', late: 'AAAAAAT' },
  mercy: { eve: 'TFPFTFM', late: 'FTFFTFT' },
  shinichi: { eve: 'TTTTTTT', late: 'TFFFFFT' },
};
const FIXED: Record<string, { place: string; hill?: boolean; foothill?: boolean; label: string; act: NpcActivity; fallback: Venue }> = {
  S: { place: 't.stage', label: '주점 무대에서 공연 중', act: 'work', fallback: 'T' },
  J: { place: 't.judge', label: '허풍 경연 심판 보는 중', act: 'drink', fallback: 'T' },
  G: { place: 'general.owner', label: '밤에만 여는 등불 상점', act: 'work', fallback: 'M' },
  D: { place: 'hb.lighthouse-door', label: '등대 앞에서 밤새 불 지키는 중', act: 'work', fallback: 'B' },
  K: { place: 'hl.library-club', hill: true, label: '도서관 독서 모임', act: 'read', fallback: 'T' },
  Y: { place: 'hl.library-steps', hill: true, label: '도서관 늦은 열람 시간', act: 'work', fallback: 'M' },
  A: { place: 'fh.anvil', foothill: true, label: '대장간 모루에서 혼자 망치질 중', act: 'work', fallback: 'T' },
};
/** Residents with an evening (the rest keep their posts). */
export const NIGHT_NPCS: readonly NpcId[] = [...WALKING_NPCS, ...STAGE2_NPCS, ...STAGE3_NPCS];
/** Where each resident sleeps (01:00 until their day starts). */
const BED: Partial<Record<NpcId, string>> = {
  gabung: 'hb.lighthouse-in',
  beatrice: 'hl.library-in',
  makima: 'away',
  nilah: 'rc.in-nilah',
  haku: 'rc.in-haku',
  ornn: 'fh.in-ornn',
  mercy: 'fh.in-mercy',
  shinichi: 'away',
};
type NightSpot = { place: string; act: NpcActivity; label: string };
const nightCache = new Map<string, Record<string, { eve: NightSpot; late: NightSpot }>>();
/** Every resident's evening and late spot on `day` (seats handed out without clashes). */
function nightsOn(day: number, w: OpenWorld) {
  const hill = w.hill;
  const key = `${day}:${worldKey(w)}`;
  const hit = nightCache.get(key);
  if (hit) return hit;
  const k = dayKind(day, hill);
  const taken = { eve: new Set<string>(), late: new Set<string>() };
  const out: Record<string, { eve: NightSpot; late: NightSpot }> = {};
  const resolve = (code: string, when: 'eve' | 'late'): NightSpot => {
    const fixed = FIXED[code];
    let v = (fixed ? fixed.fallback : code) as Venue;
    if (v === 'L' && !hill) v = 'P';
    if ((v === 'R' && !w.ranch) || (v === 'F' && !w.foothill)) v = 'P';
    // Rainy nights move the seaside, hillside and stage-3 evenings indoors.
    if (k.rain && (v === 'H' || v === 'B' || v === 'L' || v === 'R' || v === 'F')) v = 'T';
    const seats = VENUE_SEATS[v];
    const start = hash32(`night:${day}:${v}:${when}`) % seats.length;
    for (const venue of [v, 'T', 'P', 'M'] as Venue[]) {
      const list = VENUE_SEATS[venue];
      const base = venue === v ? start : 0;
      for (let i = 0; i < list.length; i++) {
        const seat = list[(base + i) % list.length];
        if (taken[when].has(seat)) continue;
        taken[when].add(seat);
        return { place: seat, act: venue === 'T' ? 'drink' : 'stroll', label: VENUE_LABEL[venue][when === 'eve' ? 0 : 1] };
      }
    }
    return { place: 'v.plaza', act: 'stroll', label: VENUE_LABEL.P[0] };
  };
  // Fixed spots first so a venue seat never lands on them.
  for (const when of ['eve', 'late'] as const)
    for (const id of NIGHT_NPCS) {
      const f = FIXED[NIGHTS[id][when][k.weekday]];
      if (f && (!f.hill || hill) && (!f.foothill || w.foothill)) taken[when].add(f.place);
    }
  for (const id of NIGHT_NPCS) {
    const n = NIGHTS[id];
    const eveCode = n.eve[k.weekday],
      lateCode = n.late[k.weekday];
    const pick = (code: string, when: 'eve' | 'late') => {
      const f = FIXED[code];
      if (f && (!f.hill || hill) && (!f.foothill || w.foothill)) return { place: f.place, act: f.act, label: f.label };
      return resolve(code, when);
    };
    out[id] = { eve: pick(eveCode, 'eve'), late: pick(lateCode, 'late') };
  }
  if (nightCache.size > 64) nightCache.clear();
  nightCache.set(key, out);
  return out;
}
/**
 * A resident's full day: yesterday's late spot until 01:00, bed, the day
 * plan until 19:30, the evening spot, then the late spot past midnight.
 */
function withNight(id: NpcId, plan: Seg[], day: number, w: OpenWorld): Seg[] {
  if (!NIGHT_NPCS.includes(id)) return plan;
  const prev = nightsOn(day - 1, w)[id].late,
    today = nightsOn(day, w)[id];
  const bed = BED[id] ?? 'home';
  // 신이치 is in the village only on tent days (real days; and the game night after one).
  const tent = (g: number) => fortuneOpenOn(realDayOfGameDay(g));
  if (id === 'shinichi' && !tent(day))
    return tent(day - 1) ? [[0, prev.place, prev.act, prev.label], [BED_TIME, 'away', 'sleep', '사건 의뢰로 마을 밖']] : plan;
  if (id === 'shinichi' && !tent(day - 1))
    return [[0, 'away', 'sleep', '마을 밖'], ...plan.filter(([t]) => t > 0 && t < NIGHT_START), [NIGHT_START, today.eve.place, today.eve.act, today.eve.label], [LATE_START, today.late.place, today.late.act, today.late.label]];
  const body = plan.filter(([t]) => t > 0 && t < NIGHT_START);
  return [
    [0, prev.place, prev.act, prev.label],
    [BED_TIME, bed, 'sleep', bed === 'away' ? '마을 밖' : undefined],
    ...body.filter(([t]) => t > BED_TIME),
    [NIGHT_START, today.eve.place, today.eve.act, today.eve.label],
    [LATE_START, today.late.place, today.late.act, today.late.label],
  ];
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
/** World facts a schedule depends on: whether ③ 언덕 주택가 is open. */
export type NpcWorld = { hill?: boolean; ranch?: boolean; foothill?: boolean };
type OpenWorld = { hill: boolean; ranch: boolean; foothill: boolean };
const openWorld = (w: NpcWorld): OpenWorld => ({ hill: !!w.hill, ranch: !!w.ranch, foothill: !!w.foothill });
const worldKey = (w: OpenWorld) => `${w.hill ? 1 : 0}${w.ranch ? 1 : 0}${w.foothill ? 1 : 0}`;
let worldDefault: NpcWorld = {};
/** The client's current world (the server always passes its own). */
export const setNpcWorld = (w: NpcWorld) => {
  worldDefault = openWorld(w);
};
/** Where stage-3 residents wait while their district is shut. */
const STAGE3_HOME: Record<(typeof STAGE3_NPCS)[number], { district: 'ranch' | 'foothill'; stand: string; label: string }> = {
  nilah: { district: 'ranch', stand: 'fields', label: '들길 너머에서 목장 준비 중' },
  haku: { district: 'ranch', stand: 'fields', label: '들길 너머에서 과수원 가꾸는 중' },
  ornn: { district: 'foothill', stand: 'mountain', label: '산길 너머에서 대장간 짓는 중' },
  mercy: { district: 'foothill', stand: 'mountain', label: '산길 너머에서 의원 준비 중' },
  shinichi: { district: 'foothill', stand: 'away', label: '사건 의뢰로 마을 밖' },
};
/** A resident's whole day, with the stage-3 districts' gates applied. */
function dayPlan(id: NpcId, day: number, w: OpenWorld): Seg[] {
  const shut = (STAGE3_NPCS as readonly string[]).includes(id) ? STAGE3_HOME[id as (typeof STAGE3_NPCS)[number]] : null;
  if (shut && !w[shut.district]) return [[0, shut.stand, 'sleep', shut.label]];
  return homesOf(id, withNight(id, planOf(id, dayKind(day, w.hill)), day, w), w.hill);
}
/** Every event of a resident's game day `day` (cached). Times are real ms. */
export function npcTimeline(id: NpcId, day: number, world: NpcWorld = worldDefault): Ev[] {
  const w = openWorld(world);
  const key = `${id}:${day}:${worldKey(w)}`;
  const hit = timelines.get(key);
  if (hit) return hit;
  const plan = dayPlan(id, day, w);
  const start = gameDayStart(day);
  const end = start + GAME_DAY_MS;
  const ev: Ev[] = [];
  let cur = plan[0][1],
    curAct = plan[0][2],
    curLabel = plan[0][3] ?? NPC_PLACES[plan[0][1]].name,
    t = start;
  for (let i = 1; i < plan.length; i++) {
    const [hhmm, to, act, label] = plan[i];
    const at = Math.max(t, start + hhmm * GAME_MINUTE_MS);
    if (to === cur) {
      ev.push({ k: 'stay', t0: t, t1: at, place: cur, act: curAct, label: curLabel });
      t = at;
      curAct = act;
      curLabel = label ?? NPC_PLACES[to].name;
      continue;
    }
    // Leave early enough to be there at hh:mm: a walk takes real seconds,
    // which are game minutes (a district gate alone is 8), so a resident who
    // only set off at hh:mm would arrive a game hour late.
    const going = goingLabel(to, label);
    const trip = route(cur, to, 0, going),
      tripMs = trip.length ? trip[trip.length - 1].t1 : 0;
    // Bedtime is the exception: they stay out until then and walk home after.
    const depart = act === 'sleep' ? at : Math.max(t, at - tripMs);
    ev.push({ k: 'stay', t0: t, t1: depart, place: cur, act: curAct, label: curLabel });
    const moves = route(cur, to, depart, going);
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
export function npcSpot(id: NpcId, now: number, world: NpcWorld = worldDefault): NpcSpot {
  const day = gameDay(now);
  const ev = npcTimeline(id, day, world);
  let e = ev[ev.length - 1];
  for (const x of ev)
    if (now >= x.t0 && now < x.t1) {
      e = x;
      break;
    }
  if (e.k === 'stay') {
    const p = NPC_PLACES[e.place];
    const visible = NPC_WALK_AREAS.includes(p.area) && !isPostPlace(e.place) && !p.hidden;
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

/**
 * Screenshot harness only (scripts/market-check.mjs): shifts the clock the
 * scenes draw residents at, so a check can see them at work any time of day.
 * The server and dialogue never use it. Set by the 'bumtadew:npc-clock' event.
 */
let viewShift = 0;
export const setNpcViewShift = (ms: number) => {
  viewShift = Number.isFinite(ms) ? ms : 0;
};
/** Every resident in `area` who is drawn walking about there right now. */
export function npcsIn(area: NpcArea, now: number, ids: readonly NpcId[] = VISIBLE_NPC_IDS): NpcSpot[] {
  return ids.map((id) => npcSpot(id, now + viewShift)).filter((s) => s.visible && s.area === area);
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
  harbor: '항구 구역',
  hillside: '언덕 주택가',
  ranch: '목장·과수원',
  foothill: '산기슭 마을',
  farm: '우리 농장',
  fields: '들길 너머',
  mountain: '산길 너머',
  away: '마을 밖',
  bakery: SHOP_INTERIORS.bakery.name,
  coop: SHOP_INTERIORS.coop.name,
  general: SHOP_INTERIORS.general.name,
  fishmarket: SHOP_INTERIORS.fishmarket.name,
  barn: SHOP_INTERIORS.barn.name,
  orchardShop: SHOP_INTERIORS.orchardShop.name,
  smithy: SHOP_INTERIORS.smithy.name,
  clinic: SHOP_INTERIORS.clinic.name,
  broker: SHOP_INTERIORS.broker.name,
};
/** Test / debug helper: game day `day`'s plan as [game minute, place]. */
export const npcPlan = (id: NpcId, day: number, world: NpcWorld = worldDefault) =>
  dayPlan(id, day, openWorld(world)).map(([t, p]) => [t, p] as const);
/** When game day `day` starts (real ms): the schedule's midnight. */
export const npcDayStart = gameDayStart;
