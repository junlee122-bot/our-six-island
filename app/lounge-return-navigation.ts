// Walk destinations for 돌아온 오늘. No area changes, events or save writes:
// the shell first enters the returned area, then gives the point to its walker.
import type { LifeView } from './lounge-life.ts';
import type { ReturnBoardDestination } from './lounge-return-board.ts';
import { ACTORS, isActor } from './lounge-roster.ts';
import { farmField, fieldOpenRect, FIELD_REACH } from './lounge-farm-layout.ts';
import {
  COMMON_SIGN,
  farmSite,
  SITE_REACH,
  siteDistance,
} from './lounge-farm-sites-layout.ts';
import { FACILITY_BY_ID } from './lounge-farm-sites-data.ts';
import { regionWalk } from './lounge-areas.ts';
import {
  DISTRICTS,
  DISTRICT_FLAG,
  isDistrictId,
  type DistrictId,
} from './lounge-districts.ts';
import { VILLAGE_PLACES, villageCanWalk } from './lounge-village-layout.ts';
import { walkableNear } from './lounge-village-life.ts';
import { besideBed, ROOM_SLEEP_REACH } from './lounge-bedroom-navigation.ts';
import { itemFootprint, type Bedroom } from './lounge-bedroom-data.ts';
import { NPCS, VISIBLE_NPC_IDS } from './lounge-npc-data.ts';
import { NPC_AREA_NAMES, npcSpot } from './lounge-npc-schedule.ts';
import { npcSocialSpot } from './lounge-npc-social.ts';
import { NPC_SOCIAL_REACH } from './lounge-romance.ts';
import { BANKER_FRONT } from './lounge-bank-layout.ts';
import { SALON_FRONT } from './lounge-salon-layout.ts';
import { CASINO_LENDER_FRONT } from './lounge-casino-lender.ts';
import {
  TAVERN_BAR_FRONT,
  interiorCanWalk,
  worldToInterior,
} from './lounge-interior-layout.ts';
import { sceneTableSide, type ScenePoint } from './lounge-scene-layout.ts';
import {
  SHOP_INTERIORS,
  isShopArea,
  shopCanWalk,
} from './lounge-shop-interiors.ts';
import { isInteriorArea, type InteriorArea } from './lounge-venues.ts';
import type { WalkPoint } from './lounge-walk-world.ts';
import { josa } from './lounge-text.ts';

export type ReturnBoardNavigation =
  | {
      kind: 'outdoor';
      area: 'village' | DistrictId;
      point: WalkPoint;
      label: string;
    }
  | { kind: 'interior'; area: Exclude<InteriorArea, 'lighthouse' | 'lighthouseTop'>; point: ScenePoint; label: string }
  | { kind: 'bed'; point: WalkPoint; label: string }
  | { kind: 'unavailable'; message: string };

function districtOpen(life: LifeView, area: DistrictId): boolean {
  if (area === 'farm' || area === 'market') return true;
  return life.districts
    ? life.districts.open.includes(area)
    : (life.flags ?? []).includes(DISTRICT_FLAG[area]!);
}

const distance = (a: WalkPoint, b: WalkPoint) =>
  Math.hypot(a.x - b.x, a.z - b.z);
const unavailable = (message: string): ReturnBoardNavigation => ({
  kind: 'unavailable',
  message,
});

/** A public point close to a resident on the floor, never behind a staff gate. */
function interiorNear(
  point: ScenePoint,
  area: InteriorArea,
): ScenePoint | null {
  for (const r of [3, 5, 7, 0]) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI / 2 + (i * Math.PI * 2) / 12;
      const p = {
        x: point.x + Math.cos(angle) * r,
        y: point.y + Math.sin(angle) * r,
      };
      if (interiorCanWalk(p, area)) return p;
    }
  }
  return null;
}

/**
 * Bed coordinates use the existing active room shape, as besideBed does.
 * Call again after entering my room (the shell activates my house's shape).
 */
export function returnBoardNavigation(
  target: ReturnBoardDestination,
  life: LifeView,
  room: Bedroom,
  now: number,
): ReturnBoardNavigation {
  if (!Number.isFinite(now) || now <= 0)
    return unavailable('마을 시각을 확인한 뒤 다시 안내할게요.');
  if (target.kind === 'field') {
    if (!isActor(target.actor))
      return unavailable('밭의 주인을 확인할 수 없어요.');
    const field = farmField(target.actor)!;
    const uid = Object.keys(life.actors).find(
      (id) => life.actors[id] === target.actor,
    );
    const size = (uid && life.fieldSizes?.[uid]) || life.me.plots;
    const rect = fieldOpenRect(field, size);
    // The paved house-front lane, within E reach even of a starter field.
    const point = { x: rect.x, z: field.z0 - FIELD_REACH * 0.75 };
    if (!regionWalk('farm').canWalk(point))
      return unavailable(
        '지금은 밭 앞길에 안전하게 도착할 곳을 찾지 못했어요.',
      );
    return {
      kind: 'outdoor',
      area: 'farm',
      point,
      label: `${ACTORS[target.actor]}의 밭 앞길`,
    };
  }
  if (target.kind === 'site') {
    const site = farmSite(target.site);
    const built = life.farmSites?.sites.find(
      (s) => s.id === target.site && s.t >= 1,
    );
    if (!site || !built)
      return unavailable('이 시설은 아직 세워지지 않았어요.');
    const gap = SITE_REACH * 0.75;
    const candidates = [
      { x: site.x, z: site.z + site.d / 2 + gap },
      { x: site.x, z: site.z - site.d / 2 - gap },
      { x: site.x - site.w / 2 - gap, z: site.z },
      { x: site.x + site.w / 2 + gap, z: site.z },
    ];
    const point = candidates.find(
      (p) =>
        regionWalk('farm').canWalk(p) && siteDistance(site, p) <= SITE_REACH,
    );
    if (!point) return unavailable('시설 앞에 안전하게 도착할 자리가 없어요.');
    return {
      kind: 'outdoor',
      area: 'farm',
      point,
      label: FACILITY_BY_ID[built.k].name,
    };
  }
  if (target.kind === 'commonField')
    return {
      kind: 'outdoor',
      area: 'farm',
      point: { ...COMMON_SIGN },
      label: '공동 밭 안내판',
    };
  if (target.kind === 'bed') {
    const bed = room.items.find((item) => item.ref === 'bed');
    const box = bed && itemFootprint(bed);
    if (!box) return unavailable('내 방의 침대 위치를 확인할 수 없어요.');
    const point = besideBed(room);
    const dx = Math.max(0, box.x0 - point.x, point.x - box.x1);
    const dz = Math.max(0, box.z0 - point.z, point.z - box.z1);
    if (Math.hypot(dx, dz) > ROOM_SLEEP_REACH)
      return unavailable(
        '침대 곁이 가구로 막혀 있어요. 내 방에서 자리를 조금 비워 주세요.',
      );
    return { kind: 'bed', point, label: '내 방 침대 곁' };
  }
  const npc = target.npc;
  if (!VISIBLE_NPC_IDS.includes(npc))
    return unavailable('이 주민은 아직 마을에 오지 않았어요.');
  const flags = life.flags ?? [];
  const world = {
    hill: flags.includes('district-hillside'),
    ranch: flags.includes('district-ranch'),
    foothill: flags.includes('district-foothill'),
  };
  const spot = npcSocialSpot(npcSpot(npc, now, world), now, world);
  const name = NPCS[npc].name;
  const subject = josa(name, '은/는');
  if (spot.walking || spot.activity === 'transit')
    return unavailable(
      `${subject} 지금 ${spot.label}이에요. 도착한 뒤 다시 찾아볼까요?`,
    );
  if (spot.area === 'realty' || spot.area === 'furniture') {
    // These two counters open at the village door; there is no walkable tab.
    const entry = VILLAGE_PLACES.find((p) => p.id === spot.area)!.entry;
    const point = walkableNear(entry);
    if (!villageCanWalk(point) || distance(entry, point) > NPC_SOCIAL_REACH)
      return unavailable(`${name}의 창구 앞에 안전한 자리가 없어요.`);
    return {
      kind: 'outdoor',
      area: 'village',
      point,
      label: `${name} · ${NPCS[npc].place}`,
    };
  }
  if (spot.area === 'village' || isDistrictId(spot.area)) {
    const area = spot.area;
    if (area !== 'village' && !districtOpen(life, area))
      return unavailable(`${DISTRICTS[area].name}은 아직 열리지 않았어요.`);
    if (!spot.visible)
      return unavailable(
        `${subject} 지금 ${spot.label}이에요. 밖에 나오면 다시 안내할게요.`,
      );
    const near =
      area === 'village' ? walkableNear(spot) : regionWalk(area).near(spot);
    if (distance(near, spot) > NPC_SOCIAL_REACH)
      return unavailable(`${name} 곁으로 안전하게 걸어갈 곳을 찾지 못했어요.`);
    return {
      kind: 'outdoor',
      area,
      point: { x: near.x, z: near.z },
      label: `${name} · ${spot.label}`,
    };
  }
  if (isInteriorArea(spot.area)) {
    const area = spot.area;
    if (isShopArea(area) && !districtOpen(life, SHOP_INTERIORS[area].district))
      return unavailable(
        `${DISTRICTS[SHOP_INTERIORS[area].district].name}은 아직 열리지 않았어요.`,
      );
    let point: ScenePoint | null = null;
    const raw = worldToInterior(spot);
    // Service staff can stand in a non-player strip. Their existing public
    // fronts already match interaction reach; never send a walker behind them.
    if (isShopArea(area) && /\.(owner|helper)$/.test(spot.place))
      point = SHOP_INTERIORS[area].front;
    else if (isShopArea(area) && !shopCanWalk(raw, area))
      point = SHOP_INTERIORS[area].front;
    else if (area === 'bank' && npc === 'nyamo' && !spot.visible)
      point = BANKER_FRONT;
    else if (area === 'salon' && npc === 'gwen' && !spot.visible)
      point = SALON_FRONT;
    else if (area === 'casino' && npc === 'rose' && !spot.visible)
      point = CASINO_LENDER_FRONT;
    else if (area === 'tavern' && npc === 'captain' && !spot.visible)
      point = TAVERN_BAR_FRONT;
    else if (area === 'casino' && npc === 'lumi' && !spot.visible)
      point = sceneTableSide('casino', 'blackjack');
    else if (area === 'lounge' && npc === 'maehwa' && !spot.visible)
      point = sceneTableSide('lounge', 'seotda');
    else if (spot.visible) point = interiorNear(raw, area);
    if (point && interiorCanWalk(point, area))
      return {
        kind: 'interior',
        area,
        point: { ...point },
        label: `${name} · ${spot.label}`,
      };
    return unavailable(
      `${subject} 지금 ${spot.label}이에요. 만날 수 있는 자리가 생기면 다시 안내할게요.`,
    );
  }
  return unavailable(
    `${subject} 지금 ${NPC_AREA_NAMES[spot.area]}에서 ${spot.label}이에요. 만날 수 있을 때 다시 찾아보세요.`,
  );
}
