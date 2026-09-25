// Friends called to a forming table (TableSheet "친구 부르기"): who is on the
// way, who sat down, who said no. Pure, so the sheet can show pending seats
// with a timer (초대 보냄 → 오는 중 → 앉음 / 거절) and toast the changes.
import type { GameInvite } from './lounge-room.ts';

export type CallStatus = 'sent' | 'coming' | 'seated' | 'declined' | 'gone';

export type TableCall = {
  id: string;
  actor: number | null;
  status: CallStatus;
  /** Until the call (the forming table) expires, in ms. */
  leftMs: number;
};

type Person = { id: string; actor: number; area: string };

export const CALL_LABEL: Readonly<Record<CallStatus, string>> = {
  sent: '초대 보냄',
  coming: '오는 중',
  seated: '앉음',
  declined: '거절',
  gone: '접속 끊김',
};

/**
 * Everyone the table's host called (not the host, not me unless called):
 * `coming` once they are in the room with the table (hall or casino),
 * `gone` if they logged out before answering.
 */
export function tableCalls(
  invite: Pick<GameInvite, 'from' | 'invited' | 'accepted' | 'declined' | 'expires' | 'status'> | null,
  players: readonly Person[],
  area: string,
  now: number,
): TableCall[] {
  if (!invite || invite.status !== 'waiting') return [];
  const leftMs = Math.max(0, invite.expires - now);
  return invite.invited
    .filter((id, i, all) => id !== invite.from && all.indexOf(id) === i)
    .map((id) => {
      const p = players.find((q) => q.id === id) ?? null;
      const status: CallStatus = invite.accepted.includes(id)
        ? 'seated'
        : invite.declined.includes(id)
          ? 'declined'
          : !p
            ? 'gone'
            : p.area === area
              ? 'coming'
              : 'sent';
      return { id, actor: p?.actor ?? null, status, leftMs };
    });
}

/** Calls still waiting for an answer (they hold an empty seat). */
export const pendingCalls = (calls: readonly TableCall[]) =>
  calls.filter((c) => c.status === 'sent' || c.status === 'coming');

/** "4:59" for the seat timer. */
export function callClock(ms: number): string {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Status changes worth a toast between two snapshots (arrivals, refusals). */
export function callChanges(
  before: readonly TableCall[],
  after: readonly TableCall[],
): { id: string; status: 'seated' | 'declined' }[] {
  const out: { id: string; status: 'seated' | 'declined' }[] = [];
  for (const call of after) {
    if (call.status !== 'seated' && call.status !== 'declined') continue;
    const was = before.find((b) => b.id === call.id);
    if (was && was.status !== call.status) out.push({ id: call.id, status: call.status });
  }
  return out;
}
