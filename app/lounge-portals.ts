// Village waystones: fixed outdoor stops shared by the scene and cloud authority.
// A portal never accepts client coordinates, mine floors or a voyage destination.
import { regionFromNetwork, regionToNetwork, type DistrictArea } from './lounge-areas.ts';
import { DISTRICTS, districtOpen, isDistrictId } from './lounge-districts.ts';
import { villageFromNetwork, villageToNetwork } from './lounge-village-layout.ts';

export type PortalArea = 'village' | DistrictArea | 'hill' | 'woods';
export type Portal = { area: PortalArea; name: string; point: { x: number; z: number }; reach: number };
export const PORTALS: readonly Portal[] = [
  { area: 'village', name: '마을 광장', point: { x: 6, z: 10 }, reach: 2.2 },
  { area: 'farm', name: '우리 농장', point: { x: 5, z: 19 }, reach: 2.2 },
  { area: 'market', name: '시장 거리', point: { x: -8, z: 8 }, reach: 2.2 },
  { area: 'harbor', name: '항구 구역', point: { x: -16, z: -5 }, reach: 2.2 },
  { area: 'hillside', name: '언덕 주택가', point: { x: 17, z: 5 }, reach: 2.2 },
  { area: 'ranch', name: '목장·과수원', point: { x: -7, z: 17 }, reach: 2.2 },
  { area: 'foothill', name: '산기슭 마을', point: { x: 5, z: 15 }, reach: 2.2 },
  { area: 'hill', name: '뒷산', point: { x: 5, z: 13 }, reach: 2.2 },
  { area: 'woods', name: '숲 깊은 곳', point: { x: 15, z: 6 }, reach: 2.2 },
];
export const portalAt = (area: unknown) => PORTALS.find((p) => p.area === area);
export const isPortalArea = (area: unknown): area is PortalArea => !!portalAt(area);
export type PortalContext = {
  flags?: readonly string[];
  pass?: boolean;
  regions?: { hill: { open: boolean }; woods: { open: boolean } } | null;
};
export function portalOpen(area: PortalArea, ctx: PortalContext = {}): boolean {
  if (area === 'village') return true;
  if (isDistrictId(area)) return districtOpen(area, ctx);
  return !!ctx.pass || !!ctx.regions?.[area].open;
}
export function portalHint(area: PortalArea): string {
  if (isDistrictId(area)) return DISTRICTS[area].hint;
  if (area === 'hill') return '마을 개척 “산길 정비”를 마치면 열려요.';
  if (area === 'woods') return '뒷산의 쓰러진 통나무를 치우면 열려요.';
  return '다른 구역의 포탈과 이어져 있어요.';
}
export function portalNetwork(area: PortalArea) {
  const p = portalAt(area)!.point;
  return area === 'village' ? villageToNetwork(p) : regionToNetwork(area, p);
}
export function nearPortal(player: { area?: unknown; x: number; y: number }): boolean {
  const portal = portalAt(player.area ?? 'village');
  if (!portal || !Number.isFinite(player.x) || !Number.isFinite(player.y)) return false;
  const p = portal.area === 'village' ? villageFromNetwork(player) : regionFromNetwork(portal.area, player);
  return Math.hypot(p.x - portal.point.x, p.z - portal.point.z) <= portal.reach;
}
