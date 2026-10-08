// What E reaches in a district besides residents and exits (lounge-area-3d.tsx):
// shop doors (just right of where the owner stands), the boards, the harbor's
// fishing and crab-pot spots, the stalls on their days and the 친구에게 가기
// signpost. Pure data so tests can check every point is walkable.
import { ARRIVE_CLEARANCE } from './lounge-map-doors.ts';
import { MARKET_BOARD, MARKET_EXIT, MARKET_SHOPS, MARKET_SPOTS } from './lounge-market-layout.ts';
import { HARBOR_AUCTION, HARBOR_BOARD, HARBOR_BUILDINGS, HARBOR_EXIT, HARBOR_LIGHTHOUSE, HARBOR_SPOTS, HARBOR_VOYAGE } from './lounge-harbor-layout.ts';
import { HILL_LIBRARY, HILLSIDE_EXIT } from './lounge-hillside-layout.ts';
import { RANCH_BUILDINGS, RANCH_EXIT } from './lounge-ranch-layout.ts';
import { FOOTHILL_BUILDINGS, FOOTHILL_EXIT, FOOTHILL_TENT } from './lounge-foothill-layout.ts';
import { FARM_EXIT } from './lounge-farm-layout.ts';
import type { DistrictArea } from './lounge-areas.ts';
import { SHOP_INTERIORS, shopForCounter, type ShopArea } from './lounge-shop-interiors.ts';

export type DistrictCounter =
  | 'coop'
  | 'general'
  | 'bakery'
  | 'newspaper'
  | 'post'
  | 'police'
  | 'fishmarket'
  | 'guild'
  | 'library'
  | 'stalls'
  | 'harborStall'
  // Stage 3 (design-npcs-stage3.md): 닐라 목장, 강물 과수원, 오른의 대장간, 메르시 의원, 점집.
  | 'barn'
  | 'orchardShop'
  | 'smithy'
  | 'clinic'
  | 'fortune'
  | 'broker'
  /** 먼바다 낚싯배's timetable board at the pier (design-sea-fishing.md). */
  | 'voyage'
  /** 범마을 등대's door (lounge-lighthouse.ts): it leads inside. */
  | 'lighthouse';
/** A room a district door leads into: a shop's (가게 실내) or the lighthouse's 1층. */
export type EnterArea = ShopArea | 'lighthouse';
export type DistrictTouch =
  /** `enter`: the shop has a room (가게 실내) and E walks in instead of opening the counter. */
  | { kind: 'counter'; place: DistrictCounter; label: string; enter?: EnterArea }
  | { kind: 'board'; label: string }
  | { kind: 'fish'; spot: 'breakwater' | 'pier'; label: string }
  | { kind: 'signpost'; label: string };

export const COUNTER_NAME: Record<DistrictCounter, string> = {
  coop: '농협 창구',
  general: '잡화점',
  bakery: '빵집 카페',
  newspaper: '신문사',
  post: '우체국',
  police: '파출소',
  fishmarket: '어시장',
  guild: '낚시조합',
  library: '도서관',
  stalls: '장날 좌판',
  harborStall: '마키마의 항구 좌판',
  barn: '닐라 목장',
  orchardShop: '강물 과수원',
  smithy: '오른의 대장간',
  clinic: '메르시 의원',
  fortune: '신이치의 점집',
  broker: '범마을 증권',
  voyage: '먼바다 출항 안내판',
  lighthouse: '범마을 등대',
};
/** The stage-3 buildings' doors lead to these counters (their rooms open the same windows). */
const STAGE3_COUNTER: Record<string, DistrictCounter> = { barn: 'barn', orchardShop: 'orchardShop', smithy: 'smithy', clinic: 'clinic' };
/**
 * What E reaches in a district besides residents and exits: shop doors (just
 * right of where the owner stands), the boards, the fishing and crab-pot
 * spots, the stalls on their days and the 친구에게 가기 signpost.
 */
export function districtCounters(area: DistrictArea, weekday: number): { x: number; z: number; reach: number; a: DistrictTouch }[] {
  const counter = (place: DistrictCounter, x: number, z: number, reach = 1.4, label = `${COUNTER_NAME[place]} 들르기`) => ({ x, z, reach, a: { kind: 'counter' as const, place, label } });
  // A shop with a room: its door leads in (가게 실내).
  const door = (place: DistrictCounter, x: number, z: number) => {
    const enter = shopForCounter(place);
    return enter
      ? { x, z, reach: SHOP_DOOR_REACH, a: { kind: 'counter' as const, place, enter, label: `${SHOP_INTERIORS[enter].name} 들어가기` } }
      : counter(place, x, z);
  };
  const out: { x: number; z: number; reach: number; a: DistrictTouch }[] = [];
  if (area === 'market') {
    for (const shop of MARKET_SHOPS) out.push(door(shop.id, shop.counter.x + 1.5, shop.counter.z + 0.2));
    out.push({ x: MARKET_BOARD.front.x, z: MARKET_BOARD.front.z, reach: MARKET_BOARD.reach, a: { kind: 'board', label: '의뢰 게시판 보기' } });
    if (weekday === 0)
      for (const k of ['stall-w', 'stall-e', 'stall-sw', 'stall-se']) out.push(counter('stalls', MARKET_SPOTS[k].x + 1.1, MARKET_SPOTS[k].z, 1.3, '장날 좌판 보기'));
    out.push({ x: MARKET_EXIT.x + 1.6, z: MARKET_EXIT.z - 0.8, reach: 1.3, a: { kind: 'signpost', label: '친구에게 가기' } });
  } else if (area === 'harbor') {
    for (const b of HARBOR_BUILDINGS) out.push(door(b.id, b.door.x + 1.4, b.door.z));
    out.push(counter('fishmarket', HARBOR_AUCTION.front.x, HARBOR_AUCTION.front.z, HARBOR_AUCTION.reach, '새벽 경매장'));
    out.push(counter('guild', HARBOR_BOARD.front.x, HARBOR_BOARD.front.z, HARBOR_BOARD.reach, '주간 낚시 대회 게시판'));
    for (const sp of HARBOR_SPOTS) out.push({ x: sp.stand.x, z: sp.stand.z, reach: sp.reach, a: { kind: 'fish', spot: sp.spot, label: sp.label } });
    out.push(counter('voyage', HARBOR_VOYAGE.stand.x, HARBOR_VOYAGE.stand.z, HARBOR_VOYAGE.reach, '먼바다 출항 안내판 보기'));
    // 범마을 등대: its door leads in (lounge-lighthouse.ts).
    out.push({ x: LIGHTHOUSE_DOOR.x, z: LIGHTHOUSE_DOOR.z, reach: SHOP_DOOR_REACH, a: { kind: 'counter', place: 'lighthouse', enter: 'lighthouse', label: '범마을 등대 들어가기' } });
    if (weekday === 3 || weekday === 6) out.push(counter('harborStall', 15.4, 0.8, 1.4, '마키마의 좌판 보기'));
    out.push({ x: HARBOR_EXIT.stand.x + 1.6, z: HARBOR_EXIT.stand.z + 1.2, reach: 1.3, a: { kind: 'signpost', label: '친구에게 가기' } });
  } else if (area === 'ranch') {
    for (const b of RANCH_BUILDINGS) out.push(door(STAGE3_COUNTER[b.id], b.door.x, b.door.z));
    out.push({ x: RANCH_EXIT.stand.x + 1.6, z: RANCH_EXIT.stand.z - 1.2, reach: 1.3, a: { kind: 'signpost', label: '친구에게 가기' } });
  } else if (area === 'foothill') {
    for (const b of FOOTHILL_BUILDINGS) out.push(door(STAGE3_COUNTER[b.id], b.door.x, b.door.z));
    // The tent opens on weekends (the window says when it is shut on other days).
    out.push(counter('fortune', FOOTHILL_TENT.front.x, FOOTHILL_TENT.front.z, FOOTHILL_TENT.reach, weekday === 0 || weekday === 6 ? '점집에서 오늘의 운세 보기' : '점집 천막 살펴보기'));
    out.push({ x: FOOTHILL_EXIT.stand.x + 1.6, z: FOOTHILL_EXIT.stand.z - 1.2, reach: 1.3, a: { kind: 'signpost', label: '친구에게 가기' } });
  } else if (area === 'farm') {
    // 우리 농장's own touches (fields, doors, bin, mailbox, board) are lounge-farm-view.ts farmReach.
    out.push({ x: FARM_EXIT.stand.x + 1.6, z: FARM_EXIT.stand.z - 1.2, reach: 1.3, a: { kind: 'signpost', label: '친구에게 가기' } });
  } else {
    out.push(counter('library', HILL_LIBRARY.door.x, HILL_LIBRARY.door.z, HILL_LIBRARY.reach, '도서관 들어가기'));
    out.push({ x: HILLSIDE_EXIT.stand.x - 0.8, z: HILLSIDE_EXIT.stand.z - 1.2, reach: 1.3, a: { kind: 'signpost', label: '친구에게 가기' } });
  }
  return out;
}


/** A shop door's touch reach (E) in its district. */
export const SHOP_DOOR_REACH = 1.4;
/** Where you stand at 범마을 등대's door (its E touch), just in front of the tower. */
export const LIGHTHOUSE_DOOR = { x: HARBOR_LIGHTHOUSE.door.x, z: HARBOR_LIGHTHOUSE.door.z + 0.2 } as const;
/** Out of the lighthouse: in front of its door, a step past the door's reach. */
export function lighthouseDoorOutside(): { district: 'harbor'; at: { x: number; z: number } } {
  return { district: 'harbor', at: { x: LIGHTHOUSE_DOOR.x, z: Math.round((LIGHTHOUSE_DOOR.z + SHOP_DOOR_REACH + ARRIVE_CLEARANCE) * 100) / 100 } };
}
/**
 * Where you stand in the district after walking out of a shop's room: its door
 * touch, then a step toward the street past the door's reach (so the door
 * does not offer itself again at once; lounge-map-doors.ts).
 */
export function shopDoorOutside(area: ShopArea): { district: 'market' | 'harbor' | 'ranch' | 'foothill'; at: { x: number; z: number } } {
  const def = SHOP_INTERIORS[area];
  const out = SHOP_DOOR_REACH + ARRIVE_CLEARANCE;
  const step = (z: number) => Math.round((z + out) * 100) / 100;
  if (def.district === 'market') {
    const shop = MARKET_SHOPS.find((s) => s.id === def.counter)!;
    return { district: 'market', at: { x: shop.counter.x + 1.5, z: step(shop.counter.z + 0.2) } };
  }
  if (def.district === 'ranch') {
    const b = RANCH_BUILDINGS.find((h) => h.id === def.counter)!;
    return { district: 'ranch', at: { x: b.door.x, z: step(b.door.z) } };
  }
  if (def.district === 'foothill') {
    const b = FOOTHILL_BUILDINGS.find((h) => h.id === def.counter)!;
    return { district: 'foothill', at: { x: b.door.x, z: step(b.door.z) } };
  }
  const b = HARBOR_BUILDINGS.find((h) => h.id === def.counter)!;
  return { district: 'harbor', at: { x: b.door.x + 1.4, z: step(b.door.z) } };
}
