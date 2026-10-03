// Test helpers for 우리 농장 F2 (tilling): fields start as grass, so tests
// that are about something else till the open block first, the way a friend
// would with the hoe (no action side effects: XP, mood, news).
import { openTiles } from '../app/lounge-farm-data.ts';

/** Marks every open tile of a field of `size` tiles as tilled soil. */
export function tillField(life, uid, size = 24) {
  const farm = life.farms[uid];
  for (const i of openTiles(size)) if (farm[i] && !farm[i].crop) farm[i].t = 1;
  return life;
}
/** Tills every member's field (their current size tier). */
export function tillAll(life) {
  for (const uid of Object.keys(life.farms)) tillField(life, uid, life.ext?.[uid]?.plots ?? 24);
  return life;
}
