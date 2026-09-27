import { VILLAGE_PLACES, villageFromNetwork, type VillagePoint } from './lounge-village-layout.ts';
import { VILLAGE_GATE } from './lounge-areas.ts';

type Presence = { id: string; actor: number; area: string; x: number; y: number; home?: number };
export type VillageFriendPin = {
  id: string;
  actor: number;
  point: VillagePoint;
  indoor: boolean;
  placeId?: string;
  location: string;
};

/** Group markers closer than one usable hit target at the current map scale. */
export function villageFriendGroups(pins: readonly VillageFriendPin[], pixelsPerUnit: number) {
  const pending = [...pins].sort((a, b) => a.actor - b.actor || a.id.localeCompare(b.id));
  const groups: { key: string; point: VillagePoint; friends: VillageFriendPin[] }[] = [];
  const reach = 28 / Math.max(0.1, pixelsPerUnit);
  while (pending.length) {
    const friends = [pending.shift()!];
    for (let member = 0; member < friends.length; member++) {
      const at = friends[member].point;
      for (let i = pending.length - 1; i >= 0; i--)
        if (Math.hypot(pending[i].point.x - at.x, pending[i].point.z - at.z) < reach)
          friends.push(...pending.splice(i, 1));
    }
    friends.sort((a, b) => a.actor - b.actor || a.id.localeCompare(b.id));
    groups.push({ key: friends.map((p) => p.id).join('|'), friends, point: {
      x: friends.reduce((sum, p) => sum + p.point.x, 0) / friends.length,
      z: friends.reduce((sum, p) => sum + p.point.z, 0) / friends.length,
    } });
  }
  return groups;
}

/** Interior coordinates use a different space; pin them to their real doorway. */
export function villageFriendPins(players: readonly Presence[], self: string): VillageFriendPin[] {
  const ids = new Set<string>();
  return players.flatMap((p): VillageFriendPin[] => {
    if (p.id === self || p.id.startsWith('friend-') || ids.has(p.id) || !Number.isInteger(p.actor) || p.actor < 0 || p.actor > 6) return [];
    ids.add(p.id);
    if (p.area === 'village')
      return [{ id: p.id, actor: p.actor, point: villageFromNetwork(p), indoor: false, location: '마을' }];
    const placeId = p.area === 'home' ? `home-${p.home ?? p.actor}`
      : p.area === 'lounge' ? 'hall'
      : ['casino', 'wardrobe', 'tavern'].includes(p.area) ? p.area : undefined;
    const place = VILLAGE_PLACES.find((v) => v.id === placeId);
    if (place) return [{ id: p.id, actor: p.actor, point: place.entry, indoor: true, placeId, location: place.name }];
    if (['hill', 'woods', 'mine'].includes(p.area))
      return [{ id: p.id, actor: p.actor, point: VILLAGE_GATE.stand, indoor: false,
        location: p.area === 'hill' ? '북쪽 언덕' : p.area === 'woods' ? '숲' : '광산' }];
    return [];
  });
}
