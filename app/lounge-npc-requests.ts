// 의뢰 게시판 (design-village-2x-npcs.md §4): residents post two or three
// requests a day on the board in 시장 거리 — bring a crop, a fish, something
// gathered or a cooked dish. The day's list is a pure function of the KST day
// (every screen and the server agree). Finishing one hands the items over and
// pays 범, sometimes an item, and relationship points with the resident.
//
// 범 from requests is minted (a `grant` through grantBeom, reason 'request',
// the same bucket as friends' requests), capped per person per day
// (NPC_REQUEST_BEOM_CAP) so the economy plan holds. Finishing a request a
// friend already finished today counts as working together: a small co-op
// bonus in points and 범 (still under the cap).
import { grantBeom, kstDay, type LoungeLedger } from './lounge-economy.ts';
import { hash32, seasonOfDay, type Season } from './lounge-calendar.ts';
import { CROPS, LifeError, type LifeState } from './lounge-life.ts';
import { CROP_SELL_REF, DISHES, FISH, FORAGE, ITEM_BY_ID } from './lounge-items.ts';
import { addInv, itemCount, takeItem } from './lounge-life-plus.ts';
import { NPCS, NPC_POINTS_MAX, WALKING_NPCS, type NpcId } from './lounge-npc-data.ts';

export type NpcRequestKind = 'gather' | 'fish' | 'cook' | 'deliver';
export type NpcRequest = {
  id: string;
  npc: NpcId;
  kind: NpcRequestKind;
  item: string;
  n: number;
  /** 범 (before the daily cap), relationship points, and an optional item. */
  beom: number;
  points: number;
  bonus?: readonly [string, number];
};
export type NpcRequestAction = { kind: 'npcRequest'; id: string };
/** Per person, per KST day. */
export type NpcBoardState = { day: number; done: string[]; beom: number };

export const NPC_REQUEST_BEOM_CAP = 3_000;
export const NPC_REQUEST_POINTS = 4;
export const NPC_REQUEST_COOP_POINTS = 2;
/** Extra 범 share when a friend already finished the same request today. */
export const NPC_REQUEST_COOP_SHARE = 0.2;
const REQUEST_BEOM_MIN = 300,
  REQUEST_BEOM_MAX = 1_500;

const fail = (text: string): never => {
  throw new LifeError(text);
};
const round10 = (n: number) => Math.round(n / 10) * 10;
const inSeason = (seasons: readonly Season[], s: Season) => seasons.includes(s);

/** What each resident asks for (by kind), picked from what the season offers. */
const ASKS: Record<(typeof WALKING_NPCS)[number], readonly NpcRequestKind[]> = {
  nasera: ['gather', 'gather', 'cook'],
  frieren: ['gather', 'deliver', 'cook'],
  thresh: ['fish', 'deliver', 'deliver'],
  sinjjajang: ['cook', 'gather', 'deliver'],
  volibas: ['fish', 'cook', 'deliver'],
  janna: ['deliver', 'fish', 'cook'],
};

function candidates(kind: NpcRequestKind, season: Season): string[] {
  switch (kind) {
    case 'gather':
      return [...CROPS];
    case 'fish':
      return FISH.filter((f) => inSeason(f.seasons, season) && f.weight >= 20 && f.time !== 'night' && f.sky !== 'rain').map((f) => f.id);
    case 'cook':
      return DISHES.filter((d) => !d.flag && d.needs.every((n) => !('item' in n) || !FORAGE.some((f) => f.id === n.item && !inSeason(f.seasons, season)))).map((d) => d.id);
    case 'deliver':
      return FORAGE.filter((f) => inSeason(f.seasons, season) && f.weight >= 20 && f.sky !== 'rain').map((f) => f.id);
  }
}
const valueOf = (item: string) => CROP_SELL_REF[item] ?? ITEM_BY_ID[item]?.sell ?? 100;

/** The board for a KST day: two or three requests from different residents. */
export function npcRequestsOn(day: number): NpcRequest[] {
  const season = seasonOfDay(day);
  const count = 2 + (hash32(`npc-board:${day}`) % 2);
  const npcs = [...WALKING_NPCS].sort((a, b) => hash32(`npc-board:${day}:${a}`) - hash32(`npc-board:${day}:${b}`)).slice(0, count);
  return npcs.map((npc, i) => {
    const key = `npc-req:${day}:${npc}`;
    const kinds = ASKS[npc];
    let kind = kinds[hash32(key + ':kind') % kinds.length];
    let list = candidates(kind, season);
    if (!list.length) {
      kind = 'gather';
      list = candidates('gather', season);
    }
    const item = list[hash32(key + ':item') % list.length];
    const single = kind === 'cook' || kind === 'fish';
    const n = single ? 1 : kind === 'gather' ? 2 + (hash32(key + ':n') % 3) : 1 + (hash32(key + ':n') % 3);
    const beom = Math.max(REQUEST_BEOM_MIN, Math.min(REQUEST_BEOM_MAX, round10(valueOf(item) * n * 0.6 + 200)));
    const bonusRoll = hash32(key + ':bonus') % 3;
    const bonus: readonly [string, number] | undefined = bonusRoll === 0 ? NPCS[npc].rewards[40] : undefined;
    return { id: `nr-${day}-${i}`, npc, kind, item, n, beom, points: NPC_REQUEST_POINTS, ...(bonus ? { bonus: [bonus[0], 1] as const } : {}) };
  });
}

/** Reads a saved board row (drops anything malformed or from another day). */
export function readNpcBoard(value: unknown, day?: number): NpcBoardState | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const v = value as Record<string, unknown>;
  if (typeof v.day !== 'number' || !Number.isSafeInteger(v.day) || v.day < 0) return;
  if (day !== undefined && v.day !== day) return;
  const done = Array.isArray(v.done) ? v.done.filter((s): s is string => typeof s === 'string' && /^nr-\d+-\d$/.test(s)).slice(0, 5) : [];
  const beom = typeof v.beom === 'number' && Number.isSafeInteger(v.beom) && v.beom >= 0 ? Math.min(v.beom, NPC_REQUEST_BEOM_CAP) : 0;
  return { day: v.day, done: [...new Set(done)], beom };
}

export type NpcRequestView = NpcRequest & { done: boolean; friends: number };
export type NpcBoardView = { day: number; requests: NpcRequestView[]; beomToday: number; beomCap: number };
/** My board today: which I finished, how many friends finished each. */
export function npcBoardView(life: LifeState, uid: string, now: number): NpcBoardView {
  const day = kstDay(now);
  const mine = readNpcBoard(life.ext?.[uid]?.npcBoard, day);
  const others = Object.entries(life.ext ?? {}).filter(([id]) => id !== uid).map(([, x]) => readNpcBoard(x?.npcBoard, day));
  return {
    day,
    requests: npcRequestsOn(day).map((r) => ({ ...r, done: !!mine?.done.includes(r.id), friends: others.filter((o) => o?.done.includes(r.id)).length })),
    beomToday: mine?.beom ?? 0,
    beomCap: NPC_REQUEST_BEOM_CAP,
  };
}

/**
 * Finishes a request on a cloned life + ledger. Returns what was paid.
 * Location (the board in 시장 거리) is checked by the cloud engine.
 */
export function npcRequestAction(life: LifeState, ledger: LoungeLedger, uid: string, action: NpcRequestAction, now: number) {
  const day = kstDay(now);
  const req = typeof action.id === 'string' ? npcRequestsOn(day).find((r) => r.id === action.id) : undefined;
  if (!req) fail('오늘 게시판에 없는 의뢰예요. 게시판을 다시 확인해 주세요.');
  const r = req!;
  const user = ((life.ext ??= {})[uid] ??= {});
  const board: NpcBoardState = readNpcBoard(user.npcBoard, day) ?? { day, done: [], beom: 0 };
  if (board.done.includes(r.id)) fail('이미 끝낸 의뢰예요.');
  if (itemCount(life, uid, r.item) < r.n) fail(`${ITEM_BY_ID[r.item]?.name ?? '물건'}이(가) 모자라요.`);
  takeItem(life, uid, r.item, r.n);
  const coop = Object.entries(life.ext ?? {}).some(([id, x]) => id !== uid && readNpcBoard(x?.npcBoard, day)?.done.includes(r.id));
  const want = r.beom + (coop ? round10(r.beom * NPC_REQUEST_COOP_SHARE) : 0);
  const beom = Math.max(0, Math.min(want, NPC_REQUEST_BEOM_CAP - board.beom));
  let next = ledger;
  const wallet = 'wallet-' + uid;
  if (beom > 0 && Object.prototype.hasOwnProperty.call(ledger.accounts, wallet))
    next = grantBeom(ledger, wallet, beom, `life-npcreq-${uid}-${++life.seq}`, now, 'request');
  board.done.push(r.id);
  board.beom += beom;
  user.npcBoard = board;
  const relations = (user.npcRelations ??= {});
  const rel = (relations[r.npc] ??= { points: 0, ch: 0 });
  const points = r.points + (coop ? NPC_REQUEST_COOP_POINTS : 0);
  rel.points = Math.min(NPC_POINTS_MAX, rel.points + points);
  if (r.bonus) addInv(life, uid, r.bonus[0], r.bonus[1]);
  return { life, ledger: next, paid: { beom, points, coop, bonus: r.bonus } };
}
