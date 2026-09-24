import {
  VILLAGE_PLACES,
  villageCanWalk,
  villageLineClear,
  type VillagePlace,
  type VillagePoint,
} from './lounge-village-layout.ts';

export const VILLAGE_ENTRY_RADIUS = 1.4;

export function villageCanEnterPlace(place: VillagePlace, actor: number) {
  return place.kind !== 'home' || place.actor === actor;
}

export type NearbyVillageEntrance = {
  place: VillagePlace;
  canEnter: boolean;
  distance: number;
};

/** Find a nearby door only from walkable ground with a clear line to its front step. */
export function villageNearbyEntrance(
  point: VillagePoint,
  actor?: number,
  radius = VILLAGE_ENTRY_RADIUS,
): NearbyVillageEntrance | null {
  if (!villageCanWalk(point) || !Number.isFinite(radius) || radius < 0)
    return null;
  let nearest: NearbyVillageEntrance | null = null;
  for (const place of VILLAGE_PLACES) {
    const distance = Math.hypot(
      point.x - place.entry.x,
      point.z - place.entry.z,
    );
    if (
      distance > radius ||
      !villageLineClear(point, place.entry) ||
      (nearest && distance >= nearest.distance)
    )
      continue;
    nearest = {
      place,
      canEnter: villageCanEnterPlace(place, actor ?? -1),
      distance,
    };
  }
  return nearest;
}

/** Returning from an interior places the player just outside that building's door. */
export function villageReturnPoint(place: VillagePlace): VillagePoint {
  const directions = [
    { x: 0, z: 1 },
    { x: 1, z: 0 },
    { x: -1, z: 0 },
    { x: 0, z: -1 },
  ];
  for (let distance = 1.8; distance <= 6; distance += 0.2)
    for (const direction of directions) {
      const point = {
        x: place.entry.x + direction.x * distance,
        z: place.entry.z + direction.z * distance,
      };
      if (villageCanWalk(point)) return point;
    }
  return { ...place.entry };
}
