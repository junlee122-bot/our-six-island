// Friends arrange a meeting; RSVP never consumes food, reserves a game seat,
// moves a player, or grants a reward. The outer world transaction supplies CAS.
import { LifeError, lifeText, type LifeState } from './lounge-life.ts';
import { ACTOR_COUNT, isActor } from './lounge-roster.ts';
import { cleanText } from './text-clean.ts';
import { gatheringPlace, type GatheringPlaceId } from './lounge-gatherings-data.ts';

export const GATHERING_DURATIONS = [30, 60, 120] as const;
export const GATHERING_RESERVE_DAYS = 7;
export const GATHERING_HISTORY_DAYS = 7;
export const GATHERING_MAX_OPEN = ACTOR_COUNT;
export const GATHERING_HISTORY_MAX = 16;
export const GATHERING_MAX_RECORDS = GATHERING_MAX_OPEN + GATHERING_HISTORY_MAX;
export const GATHERING_NOTE_MAX = 80;
export const GATHERING_MAX_AHEAD_MS = GATHERING_RESERVE_DAYS * 86_400_000;
export const GATHERING_HISTORY_MS = GATHERING_HISTORY_DAYS * 86_400_000;
const MINUTE = 60_000;
const MAX_DATE = 8_640_000_000_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID = /^gathering-([1-9]\d{0,15})$/;
const at = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= MAX_DATE;
const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const fail = (message: string): never => { throw new LifeError(message); };

export type GatheringDuration = typeof GATHERING_DURATIONS[number];
export type GatheringStatus = 'scheduled' | 'running' | 'finished' | 'cancelled' | 'expired';
export type GatheringAction =
  | { kind: 'gathering'; op: 'create'; place: GatheringPlaceId; startsAt?: number; duration: GatheringDuration; note?: string }
  | { kind: 'gathering'; op: 'join' | 'leave' | 'cancel' | 'finish'; id: string };
export type GatheringRecord = {
  id: string;
  host: number;
  /** Authorization uses the authenticated owner as well as the stable actor. */
  hostId: string;
  place: GatheringPlaceId;
  startsAt: number;
  endsAt: number;
  createdAt: number;
  note?: string;
  participants: number[];
  closed?: 'finished' | 'cancelled';
  closedAt?: number;
};
export type GatheringsExt = { gatherings?: { records: GatheringRecord[] } };
export type GatheringView = Omit<GatheringRecord, 'hostId' | 'closed'> & {
  status: GatheringStatus;
  joined: boolean;
  isHost: boolean;
  canJoin: boolean;
  canLeave: boolean;
  canCancel: boolean;
  canFinish: boolean;
  blockedReason?: string;
};
export type GatheringsView = {
  open: GatheringView[];
  previous: GatheringView[];
  canCreate: boolean;
  createBlockedReason?: string;
};

export function gatheringStatus(record: GatheringRecord, now: number): GatheringStatus {
  if (record.closed) return record.closed;
  if (now >= record.endsAt) return 'expired';
  return now < record.startsAt ? 'scheduled' : 'running';
}
const open = (record: GatheringRecord, now: number) =>
  !record.closed && now < record.endsAt;
const closedTime = (record: GatheringRecord) => record.closedAt ?? record.endsAt;

/** Bounded, old-save compatible restoration; reads never use the local clock. */
export function readGatherings(value: unknown): GatheringsExt {
  const raw = obj(value).records;
  if (!Array.isArray(raw)) return {};
  const records: GatheringRecord[] = [], seen = new Set<string>();
  for (const row of raw.slice(0, GATHERING_MAX_RECORDS * 4)) {
    const x = obj(row);
    if (typeof x.id !== 'string' || !ID.test(x.id) || !Number.isSafeInteger(Number(x.id.slice(10))) || seen.has(x.id) ||
      !isActor(x.host) || typeof x.hostId !== 'string' || !UUID.test(x.hostId) ||
      typeof x.place !== 'string' || !gatheringPlace(x.place) ||
      !at(x.createdAt) || !at(x.startsAt) || !at(x.endsAt) ||
      x.startsAt < x.createdAt || x.startsAt - x.createdAt > GATHERING_MAX_AHEAD_MS ||
      !(GATHERING_DURATIONS as readonly number[]).includes((x.endsAt - x.startsAt) / MINUTE) ||
      !Array.isArray(x.participants) || x.participants.length > ACTOR_COUNT ||
      x.participants.some((actor) => !isActor(actor)) || !x.participants.includes(x.host)) continue;
    if (x.closed !== undefined && x.closed !== 'finished' && x.closed !== 'cancelled') continue;
    if (x.closed === undefined ? x.closedAt !== undefined :
      !at(x.closedAt) || x.closedAt < x.createdAt || x.closedAt >= x.endsAt ||
      (x.closed === 'cancelled' ? x.closedAt >= x.startsAt : x.closedAt < x.startsAt)) continue;
    const note = cleanText(x.note, GATHERING_NOTE_MAX);
    records.push({
      id: x.id, host: x.host, hostId: x.hostId, place: x.place as GatheringPlaceId,
      startsAt: x.startsAt, endsAt: x.endsAt, createdAt: x.createdAt,
      ...(note ? { note } : {}), participants: [...new Set(x.participants as number[])].sort((a, b) => a - b),
      ...(x.closed ? { closed: x.closed, closedAt: x.closedAt as number } : {}),
    });
    seen.add(x.id);
  }
  records.sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id, 'en', { numeric: true }));
  return records.length ? { gatherings: { records: records.slice(0, GATHERING_MAX_RECORDS) } } : {};
}

/** Eight open hosts plus the latest sixteen closed records in the last week. */
function currentRecords(value: GatheringsExt['gatherings'], now: number): GatheringRecord[] {
  const records = readGatherings(value).gatherings?.records ?? [];
  const hosts = new Set<number>();
  const active = records.filter((record) => {
    if (record.createdAt > now || !open(record, now) || hosts.has(record.host)) return false;
    hosts.add(record.host);
    return true;
  }).slice(0, GATHERING_MAX_OPEN);
  const previous = records.filter((record) => record.createdAt <= now && !open(record, now) &&
    closedTime(record) >= now - GATHERING_HISTORY_MS && closedTime(record) <= now)
    .sort((a, b) => closedTime(b) - closedTime(a) || b.createdAt - a.createdAt)
    .slice(0, GATHERING_HISTORY_MAX);
  return [...active, ...previous];
}

export function gatheringAction(
  life: LifeState,
  member: { id: string; actor: number },
  action: GatheringAction,
  now: number,
): void {
  const invalid = '모임 요청을 확인한 뒤 다시 골라 주세요.';
  if (!UUID.test(member.id) || !isActor(member.actor) || life.actors[member.id] !== member.actor || !at(now)) fail(invalid);
  const keys: Record<string, readonly string[]> = {
    create: ['kind', 'op', 'place', 'startsAt', 'duration', 'note'],
    join: ['kind', 'op', 'id'], leave: ['kind', 'op', 'id'],
    cancel: ['kind', 'op', 'id'], finish: ['kind', 'op', 'id'],
  };
  if (action.kind !== 'gathering' || !Object.hasOwn(keys, action.op) || Object.keys(action).some((key) => !keys[action.op].includes(key))) fail(invalid);
  const records = currentRecords(life.gatherings, now);
  if (action.op === 'create') {
    if (typeof action.place !== 'string' || !gatheringPlace(action.place) || !(GATHERING_DURATIONS as readonly unknown[]).includes(action.duration)) fail(invalid);
    if (records.some((record) => record.host === member.actor && open(record, now))) fail('내가 연 모임이 있어요. 그 모임을 마치거나 취소한 뒤 열어 주세요.');
    if (records.filter((record) => open(record, now)).length >= GATHERING_MAX_OPEN) fail('지금 열린 모임이 가득해요. 잠시 뒤 다시 열어 주세요.');
    const startsAt = action.startsAt === undefined ? now : action.startsAt;
    if (!at(startsAt) || (action.startsAt !== undefined && startsAt <= now) || startsAt - now > GATHERING_MAX_AHEAD_MS) fail('예약은 지금부터 일주일 안의 시간으로 골라 주세요.');
    const endsAt = startsAt + action.duration * MINUTE;
    if (!at(endsAt)) fail(invalid);
    const note = action.note === undefined ? '' : lifeText(action.note, GATHERING_NOTE_MAX, true);
    const seq = Math.max(life.seq, ...records.map((record) => Number(record.id.slice(10))));
    if (!Number.isSafeInteger(seq) || seq >= Number.MAX_SAFE_INTEGER) fail('모임 기록을 확인한 뒤 다시 열어 주세요.');
    life.seq = seq + 1;
    records.unshift({ id: `gathering-${life.seq}`, host: member.actor, hostId: member.id, place: action.place,
      startsAt, endsAt, createdAt: now, ...(note ? { note } : {}), participants: [member.actor] });
  } else {
    if (typeof action.id !== 'string' || !ID.test(action.id)) fail(invalid);
    const record = records.find((entry) => entry.id === action.id);
    if (!record) fail('모임을 찾을 수 없어요. 목록을 다시 열어 주세요.');
    const current = record!;
    const isHost = current.host === member.actor && current.hostId === member.id;
    if ((action.op === 'cancel' || action.op === 'finish') && !isHost) fail('모임을 연 친구만 취소하거나 끝낼 수 있어요.');
    if (!open(current, now)) fail('이미 끝나거나 취소된 모임이에요.');
    if (action.op === 'join') {
      if (!current.participants.includes(member.actor)) {
        if (current.participants.length >= ACTOR_COUNT) fail('모임의 참가 표시가 가득해요.');
        current.participants = [...current.participants, member.actor].sort((a, b) => a - b);
      }
    } else if (action.op === 'leave') {
      if (current.host === member.actor) fail('모임을 연 친구는 예정 모임을 취소하거나 진행 중인 모임을 끝내 주세요.');
      current.participants = current.participants.filter((actor) => actor !== member.actor);
    } else if (action.op === 'cancel') {
      if (now >= current.startsAt) fail('이미 시작한 모임이에요. 모임 끝내기를 골라 주세요.');
      current.closed = 'cancelled'; current.closedAt = now;
    } else if (action.op === 'finish') {
      if (now < current.startsAt) fail('아직 시작 전이에요. 예정 모임은 취소할 수 있어요.');
      current.closed = 'finished'; current.closedAt = now;
    }
  }
  life.gatherings = { records: currentRecords({ records }, now) };
}

export function gatheringsView(life: LifeState, uid: string, actor: number, now: number): GatheringsView {
  const records = currentRecords(life.gatherings, now);
  const authorized = UUID.test(uid) && isActor(actor) && life.actors[uid] === actor;
  const view = (record: GatheringRecord): GatheringView => {
    const status = gatheringStatus(record, now), isOpen = open(record, now);
    const isHost = authorized && record.host === actor && record.hostId === uid;
    const joined = authorized && record.participants.includes(actor);
    const { hostId: _hostId, closed: _closed, ...publicRecord } = record;
    const blockedReason = !isOpen ? '이미 끝나거나 취소된 모임이에요.' :
      !authorized ? '등록된 친구로 접속한 뒤 참가해 주세요.' :
      !joined && record.participants.length >= ACTOR_COUNT ? '모임의 참가 표시가 가득해요.' : undefined;
    return { ...publicRecord, participants: [...record.participants], status, joined, isHost,
      canJoin: isOpen && authorized && !joined && record.participants.length < ACTOR_COUNT,
      canLeave: isOpen && joined && record.host !== actor,
      canCancel: isHost && status === 'scheduled', canFinish: isHost && status === 'running',
      ...(!isOpen ? { closedAt: closedTime(record) } : {}), ...(blockedReason ? { blockedReason } : {}),
    };
  };
  const active = records.filter((record) => open(record, now));
  const mine = active.some((record) => record.host === actor);
  const canCreate = authorized && !mine && active.length < GATHERING_MAX_OPEN;
  const createBlockedReason = !authorized ? '등록된 친구로 접속한 뒤 모임을 열어 주세요.' :
    mine ? '내가 연 모임이 있어요. 그 모임을 마치거나 취소한 뒤 열어 주세요.' :
    active.length >= GATHERING_MAX_OPEN ? '지금 열린 모임이 가득해요.' : undefined;
  return { open: active.sort((a, b) => a.startsAt - b.startsAt || a.createdAt - b.createdAt).map(view),
    previous: records.filter((record) => !open(record, now)).map(view), canCreate,
    ...(createBlockedReason ? { createBlockedReason } : {}),
  };
}
