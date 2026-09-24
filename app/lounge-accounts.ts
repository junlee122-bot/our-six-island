import { ACTORS } from './theater-data.ts';
import { readLounge, type LoungeSave } from './lounge-look.ts';
import { readBedroom } from './lounge-bedroom-data.ts';
export const ACCOUNT_IDS = [
  'dowon',
  'gangjae',
  'minseo',
  'seungjun',
  'minjae',
  'jaemin',
  'hohyeon',
] as const;
export const ACCOUNTS = ACCOUNT_IDS.map((username, actor) => ({
  username,
  actor,
  name: ACTORS[actor],
}));
export type AccountProfile = {
  id: string;
  username: string;
  actor: number;
  save: LoungeSave | null;
  revision: number;
  updatedAt: string;
};
export function accountSave(
  value: unknown,
  actor: number,
  previousSave?: unknown,
): LoungeSave {
  if (!Number.isInteger(actor) || actor < 0 || actor >= ACCOUNT_IDS.length)
    throw new RangeError('Unknown account actor');
  let raw: string | null = null;
  try {
    raw = JSON.stringify(value) ?? null;
  } catch {
    /* Non-JSON input is treated as a fresh save. */
  }
  const s = readLounge(raw, actor);
  const source =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const previous =
    previousSave !== null &&
    typeof previousSave === 'object' &&
    !Array.isArray(previousSave)
      ? (previousSave as Record<string, unknown>)
      : undefined;
  // Older clients know only outfits. Missing bedroom preserves the server's room;
  // an explicitly supplied null/invalid room is normalized as an intentional reset.
  const incomingRoom = source.bedroom as
    | { designVersion?: unknown; items?: unknown }
    | null
    | undefined;
  const priorRoom = previous?.bedroom as
    | { designVersion?: unknown; items?: unknown }
    | null
    | undefined;
  const legacyRoomWrite =
    priorRoom?.designVersion === 2 &&
    Array.isArray(incomingRoom?.items) &&
    incomingRoom?.designVersion !== 2;
  const bedroom =
    previous &&
    (legacyRoomWrite ||
      (!Object.prototype.hasOwnProperty.call(source, 'bedroom') &&
        Object.prototype.hasOwnProperty.call(previous, 'bedroom')))
      ? readBedroom(previous.bedroom, actor)
      : s.bedroom;
  return {
    ...s,
    actor,
    bedroom,
    saved: s.saved.filter((c) => c.actor === actor),
  };
}
export function validPassword(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 10 &&
    value.length <= 72 &&
    new TextEncoder().encode(value).length <= 72 &&
    /\S/.test(value)
  );
}
