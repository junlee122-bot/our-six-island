// 나무결 가구점 and 범마을 부동산 (handover/design/design-food-and-shops.md §1:
// "가게에 직접 가야 구매(서버에서 위치 확인)"). Neither has a room of its own:
// the door in the hub opens the counter while I stay in the village, so the
// server checks that I stand in the village close to that shop's door. Pure
// data shared by the cloud engine and the client (which puts me at the door
// before the counter opens).
import { VILLAGE_PLACES, villageFromNetwork } from './lounge-village-layout.ts';

export type HubCounter = 'furniture' | 'realty';
/** How far from the shop's door (hub units) still counts as "at the counter". The two doors are 10.5 apart. */
export const HUB_COUNTER_REACH = 4.5;
export const HUB_COUNTER_NAME: Record<HubCounter, string> = { furniture: '나무결 가구점', realty: '범마을 부동산' };

/** Which counter a life action needs (null: it works anywhere). */
export function hubCounterFor(kind: unknown): HubCounter | null {
  if (kind === 'buyFurniture' || kind === 'rerollShop') return 'furniture';
  if (kind === 'upgradeHouse' || kind === 'buyRoomStyle') return 'realty';
  return null;
}
/** The shop's door in the hub (village coordinates). */
export const hubCounterDoor = (counter: HubCounter) => VILLAGE_PLACES.find((p) => p.id === counter)!.entry;

/** Whether a player (server presence: area and the 0–100 network square) stands at the counter. */
export function atHubCounter(counter: HubCounter, player: { area?: string; x: number; y: number } | undefined): boolean {
  if (!player || (player.area ?? 'village') !== 'village' || !Number.isFinite(player.x) || !Number.isFinite(player.y)) return false;
  const me = villageFromNetwork(player),
    door = hubCounterDoor(counter);
  return Math.hypot(me.x - door.x, me.z - door.z) <= HUB_COUNTER_REACH;
}
export const hubCounterReject = (counter: HubCounter) =>
  `${HUB_COUNTER_NAME[counter]}에 가서 해 주세요. 마을 남서쪽 상점가에 있어요.`;
