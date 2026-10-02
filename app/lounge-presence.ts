// Where an online friend is, in words (친구들 목록, 테이블 시트, 친구 방 방문).
// Every server area has a name here, so a friend in 시장 거리, a shop's room
// or on the 먼바다 deck reads as "시장 거리에 있어요" and never falls back to
// "마을" (which made friends elsewhere look as if they had dropped out).
import { DISTRICTS, isDistrictId } from './lounge-districts.ts';
import { ACTORS } from './lounge-roster.ts';
import { NAMES } from './lounge-text.ts';
import { VENUES, isInteriorArea } from './lounge-venues.ts';

/** Place names of the areas that are neither a district nor an interior. */
const OTHER_PLACES: Record<string, string> = {
  village: '마을 중심',
  wardrobe: NAMES.wardrobe,
  hill: '뒷산',
  woods: '숲 깊은 곳',
  mine: '광산',
  offshore: '먼바다 낚싯배',
};

/** The place name of an area ('home' needs the owner: "도원의 방"). */
export function areaPlace(area: string | undefined, home?: number): string {
  if (!area) return OTHER_PLACES.village;
  if (area === 'home') return home !== undefined && ACTORS[home] ? `${ACTORS[home]}의 방` : '친구 방';
  if (isDistrictId(area)) return DISTRICTS[area].name;
  if (isInteriorArea(area)) return VENUES[area].name;
  return OTHER_PLACES[area] ?? OTHER_PLACES.village;
}

/** "시장 거리에 있어요" / "내 방에 있어요" for a friend at `p` (seen by `selfActor`). */
export function presenceLine(p: { area?: string; home?: number; actor: number }, selfActor?: number): string {
  if (p.area === 'home' && (p.home ?? p.actor) === selfActor) return '내 방에 와 있어요';
  if (p.area === 'home' && (p.home ?? p.actor) === p.actor) return '자기 방에 있어요';
  return `${areaPlace(p.area, p.home)}에 있어요`;
}
