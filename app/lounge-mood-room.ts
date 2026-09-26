// 무드 아늑함: the room score of a friend's profile save (design-mood.md §2-5).
// Pure (catalog, furniture prices and the room reader only; no three.js), so
// the hohyeon-api Edge function can score `m.save` and pass it to the world
// command (CloudMember.room), and the engine adds the house tier (×8).
//
//   score = Σ item value + categories × 3 + premium wall/floor 4 + a theme set 6
//   item value: plain 1 · shop furniture price / 5,000 (1–8) · rare 5;
//   copies past the fifth of the same thing count 0 (no carpeting the floor).
import { catalogEntry, readBedroom, STYLE_UNLOCK } from './lounge-bedroom-data.ts';
import { FURNITURE_BY_REF } from './lounge-items.ts';
import { COZY_SCORE_MAX } from './lounge-mood-data.ts';

/** Points of one placed item (before the copy limit). */
export function roomItemValue(ref: string) {
  const entry = catalogEntry(ref);
  if (!entry) return 0;
  if (entry.category === 'rare') return 5;
  const furn = FURNITURE_BY_REF[entry.unlock ?? ref];
  if (entry.premium && furn) return Math.max(1, Math.min(8, Math.floor(furn.price / 5_000)));
  return 1;
}
export const ROOM_COPIES_MAX = 5;
export const ROOM_THEME_SET = 4;

/** The room part of the score from a profile save (`save.bedroom`). */
export function roomScore(save: unknown, actor = 0) {
  const raw = save && typeof save === 'object' ? (save as { bedroom?: unknown }).bedroom : undefined;
  const room = readBedroom(raw, actor);
  const copies = new Map<string, number>(),
    categories = new Set<string>();
  let score = 0,
    miku = 0;
  for (const item of room.items) {
    const entry = catalogEntry(item.ref);
    if (!entry) continue;
    const n = (copies.get(item.ref) ?? 0) + 1;
    copies.set(item.ref, n);
    if (n > ROOM_COPIES_MAX) continue;
    score += roomItemValue(item.ref);
    categories.add(entry.category);
    if (entry.category === 'miku') miku++;
  }
  score += categories.size * 3;
  if (Object.hasOwn(STYLE_UNLOCK, room.wall) || Object.hasOwn(STYLE_UNLOCK, room.floor)) score += 4;
  if (miku >= ROOM_THEME_SET) score += 6;
  return Math.min(COZY_SCORE_MAX, score);
}
/** Full 아늑함 score: the room plus the house tier (1–4) × 8. */
export const cozyScore = (roomPart: number, house = 0) => Math.min(COZY_SCORE_MAX, Math.max(0, roomPart) + Math.max(0, house) * 8);
