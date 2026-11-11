// A next walking step only. Never changes area, position, a seat or inventory.
// After the player uses the existing doorway/gate, calculate again in that area.
import { gatheringPlace } from './lounge-gatherings-data.ts';
import { FISH_STAND } from './lounge-village-spots.ts';
import { VILLAGE_PLACES } from './lounge-village-layout.ts';
import { DISTRICTS } from './lounge-districts.ts';
import { REGIONS, isOutdoorArea, type OutdoorArea } from './lounge-areas.ts';
import { districtCounters } from './lounge-district-counters.ts';
import { INTERIOR_DOOR, TAVERN_BAR_FRONT } from './lounge-interior-layout.ts';
import { SHOP_INTERIORS } from './lounge-shop-interiors.ts';
import { isInteriorArea, type InteriorArea } from './lounge-venues.ts';
import { sceneTableSide } from './lounge-scene-layout.ts';
import { STAIR_FRONT } from './lounge-lighthouse-layout.ts';
import { activeRoomShape, roomDoorPoint, type RoomShape } from './lounge-bedroom-data.ts';

type StepInfo = {
  label: string; hint: string;
  /** Only true at the requested activity's interaction point. */
  final: boolean;
  /** Informational: the area reached when the player presses E at this door.
   * The caller must not issue an area change automatically.
   */
  nextArea?: string;
};
export type GatheringNavigation =
  | ({ kind: 'outdoor'; area: 'village' | OutdoorArea; point: { x: number; z: number } } & StepInfo)
  | ({ kind: 'interior'; area: InteriorArea; point: { x: number; y: number } } & StepInfo)
  | ({ kind: 'room'; area: 'home'; point: { x: number; z: number } } & StepInfo)
  | { kind: 'unavailable'; message: string };

/** currentArea is the live world area, not the UI tab ('home' and 'bedroom'
 * are accepted for the player's or a visited room). No saved position needed.
 */
export function gatheringNavigation(placeId: unknown, currentArea: string, options: { roomShape?: RoomShape } = {}): GatheringNavigation {
  const place = gatheringPlace(placeId);
  if (!place) return { kind: 'unavailable', message: '모임 장소를 확인한 뒤 다시 길을 안내할게요.' };
  if (currentArea === 'home' || currentArea === 'bedroom') return {
    kind: 'room', area: 'home', point: roomDoorPoint(options.roomShape ?? activeRoomShape()),
    label: '방 나가는 문', hint: '문 앞에서 직접 나간 뒤 모임 길 안내를 이어가세요.', final: false, nextArea: 'farm',
  };
  if (currentArea === 'wardrobe') return { kind: 'unavailable', message: '옷 고르기를 마친 뒤 모임 길 안내를 다시 눌러 주세요.' };
  if (currentArea === place.area) {
    if (place.activity === 'fishing') return {
      kind: 'outdoor', area: 'village', point: { ...FISH_STAND[place.id === 'river-fishing' ? 'river' : 'pond'] },
      label: place.label, hint: '물가에 도착하면 E로 직접 낚시를 시작하세요.', final: true,
    };
    if (place.id === 'bakery-meal') return {
      kind: 'interior', area: 'bakery', point: { ...SHOP_INTERIORS.bakery.front },
      label: '빵집 카페 계산대', hint: '도착하면 E로 계산대를 열고 각자 먹을 것을 골라요.', final: true,
    };
    if (place.id === 'tavern-meal') return {
      kind: 'interior', area: 'tavern', point: { ...TAVERN_BAR_FRONT },
      label: '허풍 주점 샹크스 앞', hint: '도착하면 E로 주점 메뉴를 열고 각자 먹을 것을 골라요.', final: true,
    };
    if (place.game && (place.area === 'lounge' || place.area === 'casino' || place.area === 'tavern')) return {
      kind: 'interior', area: place.area, point: sceneTableSide(place.area, place.game), label: place.label,
      hint: '도착하면 E로 테이블을 살펴보세요. 자리는 직접 고르며 모임 참가가 좌석을 보장하지 않아요.', final: true,
    };
  }
  if (currentArea === 'lighthouseTop') return {
    kind: 'interior', area: 'lighthouseTop', point: { ...STAIR_FRONT }, label: '등대 아래층으로 가는 계단',
    hint: '계단에서 E로 아래층에 내려간 뒤 길 안내를 이어가세요.', final: false, nextArea: 'lighthouse',
  };
  if (isInteriorArea(currentArea)) return {
    kind: 'interior', area: currentArea, point: { ...INTERIOR_DOOR }, label: '밖으로 나가는 문',
    hint: '문 앞에서 E로 나간 뒤 모임 길 안내를 이어가세요.', final: false,
    nextArea: currentArea === 'bakery' || currentArea === 'coop' || currentArea === 'general' || currentArea === 'broker' ? 'market'
      : currentArea === 'fishmarket' || currentArea === 'lighthouse' ? 'harbor'
        : currentArea === 'barn' || currentArea === 'orchardShop' ? 'ranch'
          : currentArea === 'smithy' || currentArea === 'clinic' ? 'foothill' : 'village',
  };
  if (currentArea === 'market' && place.area === 'bakery') {
    const door = districtCounters('market', 1).find((counter) => counter.a.kind === 'counter' && counter.a.enter === 'bakery');
    if (door) return {
      kind: 'outdoor', area: 'market', point: { x: door.x, z: door.z }, label: '느긋한 빵집 카페 입구',
      hint: '문 앞에서 E로 빵집에 들어간 뒤 계산대까지 안내를 이어가세요.', final: false, nextArea: 'bakery',
    };
  }
  if (isOutdoorArea(currentArea)) {
    const exit = REGIONS[currentArea].exits.find((exit) => exit.to === 'village')
      ?? REGIONS[currentArea].exits.find((exit) => exit.to === 'hill');
    if (exit) return {
      kind: 'outdoor', area: currentArea, point: { ...exit.stand }, label: exit.label,
      hint: '출구에서 E로 나간 뒤 모임 길 안내를 이어가세요.', final: false, nextArea: exit.to,
    };
    return { kind: 'unavailable', message: '지금은 이곳에서 바로 나갈 수 없어요. 기존 귀환 안내를 따른 뒤 모임 길 안내를 눌러 주세요.' };
  }
  if (currentArea === 'village') {
    if (place.area === 'bakery') return {
      kind: 'outdoor', area: 'village', point: { ...DISTRICTS.market.gate.stand }, label: '시장 거리로 가는 큰길',
      hint: '큰길 입구에서 E로 시장 거리에 들어간 뒤 빵집 길 안내를 이어가세요.', final: false, nextArea: 'market',
    };
    const door = VILLAGE_PLACES.find((entry) => entry.destination === place.area);
    if (door) return {
      kind: 'outdoor', area: 'village', point: { ...door.entry }, label: `${door.name} 입구`,
      hint: '문 앞에서 E로 들어간 뒤 모임 장소까지 길 안내를 이어가세요.', final: false, nextArea: place.area,
    };
  }
  return { kind: 'unavailable', message: '마을로 나온 뒤 모임 길 안내를 다시 눌러 주세요.' };
}
