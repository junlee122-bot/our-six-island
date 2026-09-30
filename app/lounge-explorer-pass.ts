// Temporary explorer pass (user request, 2026-09-30): 승준 may go to every
// place without its unlock requirement while the expansion is being built and
// tested. Server rules (areas, mine floors, districts) read it; the client only
// mirrors it for signs and gates. Other friends' closed rooms stay closed.
import { ACTORS } from './lounge-roster.ts';

export const EXPLORER_PASS = {
  actor: ACTORS.indexOf('승준'),
  /** Until 2027-01-01 00:00 KST (extended by the user on 2026-10-01). */
  until: Date.UTC(2026, 11, 31, 15),
} as const;

export const hasExplorerPass = (actor: number | undefined, now: number) =>
  actor !== undefined && actor === EXPLORER_PASS.actor && now < EXPLORER_PASS.until;
