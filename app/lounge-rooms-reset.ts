// 새 방 가구 초기화 (2026-10-02, handover/design/design-rooms-v2.md 결정 2):
// the one-time, server-side furniture reset that comes with the new rooms.
//
//   - Every friend's furniture counts (`life.ext[uid].furn`) and the theft
//     marks that go with them (`furnStrict`) are wiped. Nothing goes back to
//     the bag and nothing is refunded (user decision). Rooms themselves are
//     in the profile saves: the room format moved to v4, so every older room
//     reads as the new default room — empty but for one bed.
//   - Before wiping, the old values are copied into `life.roomsReset.backup`
//     (per uid, with the actor), inside the world row itself. That backup is
//     never sent to clients (lifeView lists its fields explicitly).
//   - It runs once per world: `life.roomsReset` marks it done, so running it
//     again changes nothing. Nothing else is touched — 범 (the ledger), crops,
//     fish, hearts, mail, the 명품 purchase log and every other life field stay.
//
// Pure (no I/O), shared by the Edge function (via lounge-cloud-engine.ts and
// lounge-accounts.ts) and the tests.
import type { LifeState } from './lounge-life.ts';

export const ROOMS_RESET_ID = '2026-10-02-rooms-v2';
export type RoomsResetBackup = {
  actor?: number;
  furn?: Record<string, number>;
  furnStrict?: Record<string, true>;
};
export type RoomsReset = {
  id: string;
  /** Server time the reset ran (0 when only applied in memory). */
  at: number;
  backup: Record<string, RoomsResetBackup>;
};
export type RoomsResetReport = {
  /** One line per friend who had furniture or theft marks. */
  members: { uid: string; actor: number | null; kinds: number; copies: number; strict: number }[];
  kinds: number;
  copies: number;
};

const UUIDISH = /^[0-9a-f-]{36}$/i;
const REF = /^[a-z0-9-]{1,48}$/;
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Reads a stored reset record (drops anything malformed; backups stay bounded). */
export function readRoomsReset(value: unknown): RoomsReset | undefined {
  if (!isRecord(value) || value.id !== ROOMS_RESET_ID) return undefined;
  const at = Number.isSafeInteger(value.at) && (value.at as number) >= 0 ? (value.at as number) : 0;
  const backup: Record<string, RoomsResetBackup> = {};
  for (const [uid, raw] of Object.entries(isRecord(value.backup) ? value.backup : {}).slice(0, 32)) {
    if (!UUIDISH.test(uid) || !isRecord(raw)) continue;
    const entry: RoomsResetBackup = {};
    if (Number.isInteger(raw.actor) && (raw.actor as number) >= 0 && (raw.actor as number) <= 6) entry.actor = raw.actor as number;
    const furn: Record<string, number> = {};
    for (const [ref, n] of Object.entries(isRecord(raw.furn) ? raw.furn : {}).slice(0, 200))
      if (REF.test(ref) && Number.isSafeInteger(n) && (n as number) > 0) furn[ref] = n as number;
    if (Object.keys(furn).length) entry.furn = furn;
    const strict: Record<string, true> = {};
    for (const [ref, yes] of Object.entries(isRecord(raw.furnStrict) ? raw.furnStrict : {}).slice(0, 200))
      if (REF.test(ref) && yes === true) strict[ref] = true;
    if (Object.keys(strict).length) entry.furnStrict = strict;
    backup[uid] = entry;
  }
  return { id: ROOMS_RESET_ID, at, backup };
}

const actorOf = (life: LifeState, uid: string) =>
  Object.hasOwn(life.actors ?? {}, uid) ? life.actors[uid] : null;

/** Dry run: what the reset would remove from this world (nothing once it ran). */
export function roomsResetReport(life: LifeState): RoomsResetReport {
  const members: RoomsResetReport['members'] = [];
  if (!life.roomsReset)
    for (const [uid, x] of Object.entries(life.ext ?? {})) {
      const furn = Object.entries(x.furn ?? {}).filter(([, n]) => n > 0);
      const strict = Object.keys(x.furnStrict ?? {}).length;
      if (!furn.length && !strict) continue;
      members.push({
        uid,
        actor: actorOf(life, uid),
        kinds: furn.length,
        copies: furn.reduce((sum, [, n]) => sum + n, 0),
        strict,
      });
    }
  return {
    members,
    kinds: members.reduce((sum, m) => sum + m.kinds, 0),
    copies: members.reduce((sum, m) => sum + m.copies, 0),
  };
}

/**
 * Runs the reset on a copy of `life` (the input is never changed). Returns
 * the same object when it already ran. `empty` is true when there was nothing
 * to wipe (only the done-mark was added).
 */
export function applyRoomsReset(life: LifeState, now: number): { life: LifeState; applied: boolean; empty: boolean; report: RoomsResetReport } {
  const report = roomsResetReport(life);
  if (life.roomsReset) return { life, applied: false, empty: true, report };
  const next = structuredClone(life);
  const backup: Record<string, RoomsResetBackup> = {};
  for (const [uid, x] of Object.entries(next.ext ?? {})) {
    const furn = Object.fromEntries(Object.entries(x.furn ?? {}).filter(([, n]) => n > 0));
    const strict = { ...(x.furnStrict ?? {}) };
    if (!Object.keys(furn).length && !Object.keys(strict).length) {
      delete x.furn;
      delete x.furnStrict;
      continue;
    }
    const actor = actorOf(next, uid);
    backup[uid] = {
      ...(actor !== null ? { actor } : {}),
      ...(Object.keys(furn).length ? { furn } : {}),
      ...(Object.keys(strict).length ? { furnStrict: strict } : {}),
    };
    delete x.furn;
    delete x.furnStrict;
    // Friends visiting this room refetch it (the saved layout is the new default now).
    const room = ((next.rooms ??= {})[uid] ??= { access: 'friends', rev: 0 });
    room.rev++;
  }
  next.roomsReset = { id: ROOMS_RESET_ID, at: Math.max(0, Math.floor(now)), backup };
  return { life: next, applied: true, empty: report.members.length === 0, report };
}

/** The life state as it is after the reset (applied in memory when not stored yet). */
export const afterRoomsReset = (life: LifeState): LifeState => (life.roomsReset ? life : applyRoomsReset(life, 0).life);
