// District minimaps (시장 거리, 항구 구역, 언덕 주택가 and any district added
// later): the hub minimap's look for a district's own map, drawn from the
// layout data, never from pictures. Pure data so tests can check every place
// is on the map and every "walk there" point is walkable.
//
// A district with its own drawing (DISTRICT_ART) shows its paving, water and
// buildings; a new district without one still gets a map from its walls
// (REGIONS colliders), its exits and its counters, so adding it to DISTRICTS
// and REGIONS is enough for a first map.
import { REGIONS, isDistrictArea, regionFromNetwork, type OutdoorArea } from './lounge-areas.ts';
import { COUNTER_NAME, districtCounters } from './lounge-district-counters.ts';
import { DISTRICTS, type DistrictId } from './lounge-districts.ts';
import {
  MARKET_BOARD,
  MARKET_PAVING,
  MARKET_SHOPS,
  MARKET_STALLS,
} from './lounge-market-layout.ts';
import {
  HARBOR_AUCTION,
  HARBOR_BOARD,
  HARBOR_BREAKWATER,
  HARBOR_BUILDINGS,
  HARBOR_D,
  HARBOR_LIGHTHOUSE,
  HARBOR_PAVING,
  HARBOR_PIER,
  HARBOR_POINT,
  HARBOR_SHORE_Z,
  HARBOR_W,
} from './lounge-harbor-layout.ts';
import {
  HILL_BOARD,
  HILL_GARDEN,
  HILL_HOUSES,
  HILL_LIBRARY,
  HILL_PERGOLA,
  HILL_YOUTH,
  HILLSIDE_PAVING,
} from './lounge-hillside-layout.ts';
import {
  RANCH_BOARD,
  RANCH_BRIDGE,
  RANCH_BUILDINGS,
  RANCH_COOP,
  RANCH_D,
  RANCH_HOUSES,
  RANCH_PASTURE,
  RANCH_PAVILION,
  RANCH_PAVING,
  RANCH_SILO,
  RANCH_STREAM,
  RANCH_TREES_FRUIT,
} from './lounge-ranch-layout.ts';
import {
  FOOTHILL_BOARD,
  FOOTHILL_BUILDINGS,
  FOOTHILL_MINE,
  FOOTHILL_ONSEN,
  FOOTHILL_PAVING,
  FOOTHILL_RIDGE,
  FOOTHILL_TENT,
  FOOTHILL_W,
} from './lounge-foothill-layout.ts';
import { SHOP_INTERIORS, isShopArea, type ShopArea } from './lounge-shop-interiors.ts';
import { NPCS, type NpcId } from './lounge-npc-data.ts';
import type { WalkPoint } from './lounge-walk-world.ts';

/** What a shape is (the component picks the colour; the hub's palette). */
export type MiniTone = 'road' | 'plaza' | 'lawn' | 'water' | 'deck' | 'stone' | 'board' | 'stall' | 'civic' | 'lamp' | 'wall';
export type MiniShape =
  | { kind: 'rect'; x: number; z: number; w: number; d: number; tone: MiniTone; fill?: string }
  | { kind: 'circle'; x: number; z: number; r: number; tone: MiniTone; fill?: string };
/** A named, clickable place: a shop or its room's door, a board, a fishing spot, the road home. */
export type MiniPlaceKind = 'shop' | 'door' | 'board' | 'fish' | 'stall' | 'exit' | 'house' | 'place';
export type MiniPlace = {
  id: string;
  /** Pin label on the map ("농협", "방파제 낚시"). */
  label: string;
  /** Spoken name ("범마을 농협 들어가기"). */
  title: string;
  kind: MiniPlaceKind;
  /** Where the pin sits (district coordinates). */
  x: number;
  z: number;
  /** Where a click walks me (the spot E works from). */
  go: WalkPoint;
  /** Named on the compact map too (houses only when expanded / hovered). */
  named: boolean;
};
export type DistrictMinimap = {
  area: OutdoorArea;
  name: string;
  bounds: { w: number; d: number };
  shapes: MiniShape[];
  places: MiniPlace[];
};

const rect = (x: number, z: number, w: number, d: number, tone: MiniTone, fill?: string): MiniShape => ({ kind: 'rect', x, z, w, d, tone, ...(fill ? { fill } : {}) });

/** Drawings of the districts that have one (paving, water, buildings). */
const DISTRICT_ART: Partial<Record<DistrictId, () => MiniShape[]>> = {
  market: () => [
    ...MARKET_PAVING.map((p) => rect(p.x, p.z, p.w, p.d, p.tone === 'plaza' ? 'plaza' : 'road')),
    ...MARKET_STALLS.map((s) => rect(s.x, s.z, s.w, s.d, 'stall')),
    rect(MARKET_BOARD.x, MARKET_BOARD.z, MARKET_BOARD.w, Math.max(0.8, MARKET_BOARD.d), 'board'),
    ...MARKET_SHOPS.map((s) => rect(s.x, s.z, s.w, s.d, 'civic', s.sign.line)),
  ],
  harbor: () => [
    // The sea fills everything south of the quay edge.
    rect(0, (HARBOR_SHORE_Z + HARBOR_D / 2) / 2, HARBOR_W, HARBOR_D / 2 - HARBOR_SHORE_Z, 'water'),
    { kind: 'circle', x: HARBOR_POINT.x, z: HARBOR_POINT.z, r: HARBOR_POINT.r, tone: 'stone' },
    ...HARBOR_PAVING.map((p) => rect(p.x, p.z, p.w, p.d, p.tone === 'quay' ? 'plaza' : p.tone === 'stone' ? 'stone' : 'road')),
    rect(HARBOR_PIER.x, HARBOR_PIER.z, HARBOR_PIER.w, HARBOR_PIER.d, 'deck'),
    rect(HARBOR_BREAKWATER.x, HARBOR_BREAKWATER.z, HARBOR_BREAKWATER.w, HARBOR_BREAKWATER.d, 'stone'),
    rect(HARBOR_AUCTION.x, HARBOR_AUCTION.z, HARBOR_AUCTION.w, HARBOR_AUCTION.d, 'stall'),
    rect(HARBOR_BOARD.x, HARBOR_BOARD.z, HARBOR_BOARD.w, Math.max(0.8, HARBOR_BOARD.d), 'board'),
    ...HARBOR_BUILDINGS.map((b) => rect(b.x, b.z, b.w, b.d, 'civic', b.sign.line)),
    { kind: 'circle', x: HARBOR_LIGHTHOUSE.x, z: HARBOR_LIGHTHOUSE.z, r: HARBOR_LIGHTHOUSE.r, tone: 'lamp' },
  ],
  hillside: () => [
    ...HILLSIDE_PAVING.map((p) => rect(p.x, p.z, p.w, p.d, p.tone === 'plaza' ? 'lawn' : 'road')),
    rect(HILL_GARDEN.x, HILL_GARDEN.z, HILL_GARDEN.w, HILL_GARDEN.d, 'lawn'),
    rect(HILL_PERGOLA.x, HILL_PERGOLA.z, HILL_PERGOLA.w, HILL_PERGOLA.d, 'deck'),
    rect(HILL_BOARD.x, HILL_BOARD.z, HILL_BOARD.w, Math.max(0.8, HILL_BOARD.d), 'board'),
    ...HILL_HOUSES.map((h) => rect(h.x, h.z, h.w, h.d, 'civic', h.sign.line)),
    rect(HILL_YOUTH.x, HILL_YOUTH.z, HILL_YOUTH.w, HILL_YOUTH.d, 'civic'),
    rect(HILL_LIBRARY.x, HILL_LIBRARY.z, HILL_LIBRARY.w, HILL_LIBRARY.d, 'civic'),
  ],
  ranch: () => [
    rect(RANCH_PASTURE.x, RANCH_PASTURE.z, RANCH_PASTURE.w, RANCH_PASTURE.d, 'lawn'),
    ...RANCH_PAVING.filter((p) => p.tone !== 'wood').map((p) => rect(p.x, p.z, p.w, p.d, p.tone === 'yard' ? 'plaza' : 'road')),
    rect(RANCH_STREAM.x, 0, RANCH_STREAM.w, RANCH_D, 'water'),
    rect(RANCH_BRIDGE.x, RANCH_BRIDGE.z, RANCH_BRIDGE.w, RANCH_BRIDGE.d, 'deck'),
    ...RANCH_TREES_FRUIT.map((t) => ({ kind: 'circle' as const, x: t.x, z: t.z, r: 0.9, tone: 'lawn' as const, fill: '#6f9f5a' })),
    rect(RANCH_PAVILION.x, RANCH_PAVILION.z, RANCH_PAVILION.w, RANCH_PAVILION.d, 'deck'),
    rect(RANCH_COOP.x, RANCH_COOP.z, RANCH_COOP.w, RANCH_COOP.d, 'stall'),
    rect(RANCH_BOARD.x, RANCH_BOARD.z, RANCH_BOARD.w, Math.max(0.8, RANCH_BOARD.d), 'board'),
    { kind: 'circle', x: RANCH_SILO.x, z: RANCH_SILO.z, r: RANCH_SILO.r, tone: 'stone' },
    ...RANCH_HOUSES.map((h) => rect(h.x, h.z, h.w, h.d, 'civic')),
    ...RANCH_BUILDINGS.map((b) => rect(b.x, b.z, b.w, b.d, 'civic', b.sign.line)),
  ],
  foothill: () => [
    rect(0, FOOTHILL_RIDGE.z, FOOTHILL_W, FOOTHILL_RIDGE.d, 'wall'),
    rect(FOOTHILL_MINE.x, FOOTHILL_RIDGE.z + 0.6, FOOTHILL_RIDGE.gap, FOOTHILL_RIDGE.d - 1.2, 'road'),
    ...FOOTHILL_PAVING.map((p) => rect(p.x, p.z, p.w, p.d, p.tone === 'stone' ? 'plaza' : p.tone === 'yard' ? 'stone' : 'road')),
    rect(FOOTHILL_ONSEN.x, FOOTHILL_ONSEN.z, FOOTHILL_ONSEN.w, FOOTHILL_ONSEN.d, 'water'),
    { kind: 'circle', x: FOOTHILL_TENT.x, z: FOOTHILL_TENT.z, r: FOOTHILL_TENT.r, tone: 'stall' },
    rect(FOOTHILL_BOARD.x, FOOTHILL_BOARD.z, FOOTHILL_BOARD.w, Math.max(0.8, FOOTHILL_BOARD.d), 'board'),
    ...FOOTHILL_BUILDINGS.map((b) => rect(b.x, b.z, b.w, b.d, 'civic', b.sign.line)),
  ],
};

/** A district without its own drawing: its walls (buildings as boxes, trees and posts as dots). */
function wallShapes(area: OutdoorArea): MiniShape[] {
  return REGIONS[area].colliders.map((c) =>
    c.shape === 'box' ? rect(c.x, c.z, c.w, c.d, 'wall') : { kind: 'circle' as const, x: c.x, z: c.z, r: Math.max(0.3, c.r), tone: 'wall' as const },
  );
}

/** A board's pin sits this far above where you stand to read it (so the label does not hide my dot). */
const BOARD_LIFT = 2.8;

/** Short pin names for the district counters (the full name goes in the title). */
const COUNTER_SHORT: Record<string, string> = {
  coop: '농협',
  general: '잡화점',
  bakery: '빵집',
  newspaper: '신문사',
  post: '우체국',
  police: '파출소',
  fishmarket: '어시장',
  guild: '낚시조합',
  library: '도서관',
  barn: '목장',
  orchardShop: '과수원',
  smithy: '대장간',
  clinic: '의원',
  fortune: '점집',
};

/** Houses and buildings with no counter (언덕's residents' homes). */
function extraPlaces(area: OutdoorArea): MiniPlace[] {
  if (area === 'ranch')
    return RANCH_HOUSES.map((h) => ({ id: h.id, label: h.name.replace(' 집', ''), title: `${h.name} 앞으로 걸어가기`, kind: 'house' as const, x: h.x, z: h.z, go: { ...h.door }, named: false }));
  if (area !== 'hillside') return [];
  const npcName = (id: string) => (Object.hasOwn(NPCS, id) ? NPCS[id as NpcId].name : '');
  return [
    ...HILL_HOUSES.map((h) => ({
      id: h.id,
      label: `${npcName(h.npc)}네`,
      title: `${npcName(h.npc)}네 집 앞으로 걸어가기`,
      kind: 'house' as const,
      x: h.x,
      z: h.z,
      go: { ...h.door },
      named: false,
    })),
    {
      id: HILL_YOUTH.id,
      label: '자취방',
      title: `${HILL_YOUTH.name} 앞으로 걸어가기`,
      kind: 'house',
      x: HILL_YOUTH.x,
      z: HILL_YOUTH.z,
      go: { ...HILL_YOUTH.door },
      named: false,
    },
  ];
}

/**
 * Everything E reaches in the district (shops and their rooms, boards,
 * fishing spots, stalls) plus its exits, as map places. `weekday` (KST, 0 =
 * Sunday) decides which stalls stand today.
 */
function districtPlaces(area: OutdoorArea, weekday: number): MiniPlace[] {
  const out: MiniPlace[] = [];
  const counters = isDistrictArea(area) ? districtCounters(area, weekday) : [];
  const buildingAt = (place: string): WalkPoint | null => {
    const shop =
      MARKET_SHOPS.find((s) => s.id === place) ??
      HARBOR_BUILDINGS.find((b) => b.id === place) ??
      RANCH_BUILDINGS.find((b) => b.id === place) ??
      FOOTHILL_BUILDINGS.find((b) => b.id === place);
    if (shop) return { x: shop.x, z: shop.z };
    if (place === 'library') return { x: HILL_LIBRARY.x, z: HILL_LIBRARY.z };
    return null;
  };
  let stalls = 0,
    fishing = 0;
  for (const c of counters) {
    const go = { x: c.x, z: c.z };
    const a = c.a;
    if (a.kind === 'signpost') continue;
    if (a.kind === 'board') {
      out.push({ id: 'board', label: '게시판', title: `${a.label} · 걸어가기`, kind: 'board', x: go.x, z: go.z - BOARD_LIFT, go, named: true });
      continue;
    }
    if (a.kind === 'fish') {
      // Rod spots only; the crab pots sit beside them.
      if (a.label.includes('통발')) continue;
      out.push({ id: `fish-${a.spot}-${fishing++}`, label: a.spot === 'pier' ? '선착장 낚시' : '방파제 낚시', title: `${a.label} · 걸어가기`, kind: 'fish', x: go.x, z: go.z, go, named: true });
      continue;
    }
    const place = a.place;
    if (place === 'stalls' || place === 'harborStall') {
      out.push({ id: `stall-${stalls++}`, label: place === 'stalls' ? '좌판' : '마키마 좌판', title: `${a.label} · 걸어가기`, kind: 'stall', x: go.x - 1.1, z: go.z - 1.6, go, named: place === 'harborStall' || stalls === 1 });
      continue;
    }
    // A second counter of the same place (항구's 새벽 경매장 and 대회 게시판): its own pin where it stands.
    if (out.some((p) => p.id === place)) {
      const short = a.label.replace(/ (보기|들르기)$/, '').replace('주간 낚시 대회 ', '대회 ').replace('새벽 ', '');
      const board = a.label.includes('게시판');
      out.push({
        id: `${place}-${out.filter((p) => p.id.startsWith(place)).length}`,
        label: short,
        title: `${a.label} · 걸어가기`,
        kind: board ? 'board' : 'stall',
        x: go.x,
        z: board ? go.z - BOARD_LIFT : go.z + 0.4,
        go,
        named: true,
      });
      continue;
    }
    const lot = buildingAt(place);
    const enter = a.enter as ShopArea | undefined;
    const label = COUNTER_SHORT[place] ?? COUNTER_NAME[place];
    out.push({
      id: place,
      label,
      title: enter ? `${SHOP_INTERIORS[enter].name} 문 앞으로 걸어가기` : `${COUNTER_NAME[place]} 앞으로 걸어가기`,
      kind: enter ? 'door' : lot ? 'shop' : 'place',
      x: lot?.x ?? go.x,
      z: lot?.z ?? go.z,
      go,
      named: true,
    });
  }
  for (const e of REGIONS[area].exits)
    out.push({
      id: `exit-${e.id}`,
      label: e.to === 'village' ? '마을로' : REGIONS[e.to].short,
      title: `${e.label} · 걸어가기`,
      kind: 'exit',
      x: e.x,
      z: e.z,
      go: { ...e.stand },
      named: true,
    });
  return [...out, ...extraPlaces(area)];
}

/** The minimap of a district (null for the hub's outdoor areas that are not districts: 뒷산, 숲, 광산). */
export function districtMinimap(area: OutdoorArea, weekday: number): DistrictMinimap | null {
  if (!isDistrictArea(area)) return null;
  const region = REGIONS[area];
  const art = DISTRICT_ART[area as DistrictId];
  return {
    area,
    name: Object.hasOwn(DISTRICTS, area) ? DISTRICTS[area as DistrictId].name : region.name,
    bounds: { ...region.bounds },
    shapes: art ? art() : wallShapes(area),
    places: districtPlaces(area, weekday),
  };
}

type Presence = { id: string; actor: number; area?: string; x: number; y: number };
export type DistrictFriendPin = { id: string; actor: number; point: WalkPoint; indoor: boolean; location: string };
/**
 * Friends on a district's map: walking in it where they are, inside one of
 * its shop rooms at that shop's door (marked indoor). Friends elsewhere are
 * on the hub's map, not here.
 */
export function districtFriendPins(players: readonly Presence[], self: string | null, area: OutdoorArea): DistrictFriendPin[] {
  const map = districtMinimap(area, 1);
  if (!map) return [];
  const ids = new Set<string>();
  return players.flatMap((p): DistrictFriendPin[] => {
    if (p.id === self || p.id.startsWith('friend-') || ids.has(p.id) || !Number.isInteger(p.actor) || p.actor < 0 || p.actor > 6) return [];
    if (p.area === area) {
      ids.add(p.id);
      return [{ id: p.id, actor: p.actor, point: regionFromNetwork(area, p), indoor: false, location: map.name }];
    }
    if (isShopArea(p.area) && SHOP_INTERIORS[p.area].district === area) {
      const door = map.places.find((pl) => pl.id === SHOP_INTERIORS[p.area as ShopArea].counter);
      if (!door) return [];
      ids.add(p.id);
      return [{ id: p.id, actor: p.actor, point: { x: door.x, z: door.z + 1 }, indoor: true, location: SHOP_INTERIORS[p.area].name }];
    }
    return [];
  });
}
