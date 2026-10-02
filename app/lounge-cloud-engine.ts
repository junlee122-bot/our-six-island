// This module runs in the Edge Function and tests, never as a client authority.
import {
  LoungeRoom,
  snapshotNextDue,
  REJECT,
  type HostedRoomSnapshot,
  type LoungeAction,
} from './lounge-room.ts';
import {
  validateLedger,
  registerWallet,
  compactLedger,
  voidGame,
  claimDailyGrant,
  dailyGrantInfo,
  type LoungeLedger,
} from './lounge-economy.ts';
import { LoungeBank } from './lounge-wallet.ts';
import { roomCode } from './multiplayer-protocol.ts';
import { defaultLook, type Look } from './lounge-look.ts';
import {
  ensureLifeMember,
  isLifeAction,
  lifeAction,
  lifeView,
  readLife,
  LifeError,
  mayEnterRoom,
  type LifeState,
} from './lounge-life.ts';
import { HOME_CLOSED, validHomeOwner } from './lounge-games.ts';
import { lifeWealth, recordTables, recordVisit } from './lounge-life-plus.ts';
import { PARTY_REJECT, eatPartyItem, isPartyItem, partyCount, type PartyItem } from './lounge-party.ts';
import { moodAfterCloud, moodWritesAnyway } from './lounge-mood.ts';
import { collectOverdue, financeAction, financeView, recordCasino, type FinanceState, type FinancePresence } from './lounge-finance.ts';
import { assertNpcSocialContext } from './lounge-romance.ts';
import { assertBirthdayContext } from './lounge-birthday.ts';
import { villageFromNetwork } from './lounge-village-layout.ts';
import { DISTRICTS, districtOpen, isDistrictId } from './lounge-districts.ts';
import { hasExplorerPass } from './lounge-explorer-pass.ts';
import { isTownAction, townActionArea } from './lounge-town-data.ts';
import { STAGE3_ACTION_PLACE, festivalDay, isStage3Action, stage3ActionAreas } from './lounge-stage3-data.ts';
// 가게 나누기 · 음식 시스템: shops' districts and where meals are eaten.
import { SHOP_INFO, isShopId, shopArea } from './lounge-shops.ts';
import { DISH_BY_ID } from './lounge-items.ts';
import { weekdayOf } from './lounge-calendar.ts';
import { kstDay } from './lounge-economy.ts';
import { SHOP_INTERIORS, isShopArea, townActionShop } from './lounge-shop-interiors.ts';
import { recordDistrictVisit } from './lounge-town.ts';
import type { LoginGift } from './lounge-login-gifts.ts';
import { readTableStats, recordTableStats, tableStatsView, type TableStats } from './lounge-table-stats.ts';
import { ROOMS_RESET_ID, applyRoomsReset } from './lounge-rooms-reset.ts';
import { atHubCounter, hubCounterFor, hubCounterReject } from './lounge-hub-counters.ts';
import { listStocks, materializeStocks, stocksAction, stocksView, stockWealth, type StockNews, type StockState } from './lounge-stocks.ts';
import { addNews } from './lounge-life-plus.ts';
import { ACTORS } from './lounge-roster.ts';
// 먼바다 낚싯배 (design-sea-fishing.md): the deck only while a voyage is on; boarding at the pier.
import { isVoyageAction } from './lounge-voyage-data.ts';
import { voyageActionArea, voyageAt } from './lounge-voyage.ts';
import { regionToNetwork } from './lounge-areas.ts';
import { HARBOR_VOYAGE } from './lounge-harbor-layout.ts';
/** A voyage's deck accepts me a few seconds before the departure (clock slack). */
const DECK_EARLY_MS = 5_000;
/** The life state without the reset's done-mark (for the "did anything change" check). */
const withoutResetMark = (life: LifeState) => {
  const { roomsReset: _mark, ...rest } = life;
  return rest;
};
export type CloudMember = {
  id: string;
  actor: number;
  username: string;
  /** 무드 아늑함: room score of the member's profile save (hohyeon-api), when known. */
  room?: number;
};
type Lease = { connection: string; seen: number; sequence: number };
type Room = { snapshot: HostedRoomSnapshot; leases: Record<string, Lease> };
type Receipt = {
  id: string;
  hash: string;
  code: string;
  ok: boolean;
  error: string;
  /** Server time it was written; receipts expire after RECEIPT_TTL_MS (D-4). */
  at?: number;
};
export type CloudWorld = {
  schema: 1;
  ledger: LoungeLedger;
  rooms: Record<string, Room>;
  receipts: Record<string, Receipt[]>;
  epochs?: Record<string, number>;
  /**
   * Highest (connection, sequence) each member had processed. Replay guard for
   * requests whose receipt was already trimmed (D-4); clients send one request
   * at a time per connection with increasing sequences.
   */
  sequences?: Record<string, { connection: string; sequence: number }>;
  /** Phase 2 life state (farms, bags, mail…). Absent in older worlds. */
  life?: LifeState;
  finance?: FinanceState;
  /** Private administrator-armed login gifts; delivered records never expire. */
  loginGifts?: Record<string, LoginGift>;
  /** 테이블 기록: per-game results and the weekly table (lounge-table-stats.ts). */
  tableStats?: TableStats;
  /** 범마을 증권 (lounge-stocks.ts). Its seed never leaves the server. */
  stocks?: StockState;
};
export type CloudCommand = {
  op: 'open' | 'join' | 'read' | 'action' | 'leave' | 'wallet';
  code?: string;
  connection?: string;
  sequence?: number;
  requestId?: string;
  epoch?: number;
  action?: LoungeAction;
  look?: Look;
  /**
   * `lifeHash` of the life view the client already holds: the response then
   * leaves `life` out when it has not changed (most polls during a game).
   */
  lifeHash?: string;
  /** Same for the stock market view (lounge-stocks.ts stocksView). */
  stocksHash?: string;
};
export class CloudError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
/**
 * Short content hash of a view (two 32-bit FNV-1a / djb2 lanes). Only used to
 * skip resending an unchanged life view, never for security.
 */
export function viewHash(value: unknown): string {
  const text = JSON.stringify(value) ?? '';
  let a = 0x811c9dc5,
    b = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = (Math.imul(b, 33) + c) | 0;
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36) + text.length.toString(36);
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CLOUD_LEASE_MS = 180000;
/**
 * D-3: a plain `read` only rewrites the world row to refresh `lease.seen` when
 * the lease is at least this old. Fresher leases are refreshed only when the
 * transition commits anyway (SEEN_PIGGYBACK_MS granularity).
 * It sits below the 45 s hidden-tab poll + a few seconds and below the
 * one-a-minute timers browsers give background tabs, so every hidden poll
 * refreshes: at 60 s (and `>`), a poll landing at exactly 60 s did not, the
 * next one did at ~120 s, and one slow or missed poll on top let the 180 s
 * lease run out — the friend dropped out of everyone's list while they sat
 * fishing or waiting on the 먼바다 deck with the tab in the background.
 */
export const SEEN_REFRESH_MS = 40000;
const SEEN_PIGGYBACK_MS = 15000;
/**
 * D-4: receipts made up ~98% of the world row at 512 per member. A client
 * retries one request at a time within seconds, so a short window is plenty;
 * older replays are refused by `sequences` / lease sequence / epoch checks.
 */
export const RECEIPT_CAP = 64;
export const RECEIPT_TTL_MS = 10 * 60000;
/** Keeps each member's receipts that are younger than the TTL, newest RECEIPT_CAP. */
export function trimReceipts(
  receipts: Record<string, Receipt[]>,
  now: number,
): Record<string, Receipt[]> {
  const next: Record<string, Receipt[]> = {};
  for (const [id, list] of Object.entries(receipts)) {
    // Legacy receipts have no `at`: they predate this rule and are dropped.
    const kept = list
      .filter((r) => typeof r.at === 'number' && r.at > now - RECEIPT_TTL_MS)
      .slice(-RECEIPT_CAP);
    if (kept.length) next[id] = kept;
  }
  return next;
}
/**
 * D-8: a deliberate rejection (stored as a 409 receipt) vs an engine bug.
 * Rejections are CloudError/LifeError, or a plain Error with a Korean
 * user-facing message (economy/room rules). TypeError, RangeError and other
 * runtime errors are bugs: they must not be committed as receipts.
 */
export function isRejection(e: unknown): e is Error {
  if (e instanceof CloudError || e instanceof LifeError) return true;
  return (
    e instanceof Error &&
    Object.getPrototypeOf(e) === Error.prototype &&
    /[\uAC00-\uD7A3]/.test(e.message)
  );
}
function code() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    data = crypto.getRandomValues(new Uint8Array(10));
  return [...data].map((n) => chars[n % chars.length]).join('');
}
export async function commandHash(c: CloudCommand) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(c)),
      ),
    ),
  ]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
}
function wallet(ledger: LoungeLedger, id: string, now: number, life?: LifeState, stocks?: StockState) {
  const bank = new LoungeBank(null);
  bank.commit(ledger);
  return bank.view('wallet-' + id, now, (life ? lifeWealth(life, id) : 0) + stockWealth(stocks, id));
}
/** Village context a hosted room needs: flags (VIP stakes) and bag and share wealth (relief). */
function roomContext(r: LoungeRoom, life: LifeState, stocks?: StockState) {
  r.villageFlags = [...(life.flags ?? [])];
  r.wealthOf = (w) => lifeWealth(life, w.replace(/^wallet-/, '')) + stockWealth(stocks, w.replace(/^wallet-/, ''));
  return r;
}
/** 범마을 증권: a fresh 128-bit seed for a new market (server only). */
const stockSeed = () => [...crypto.getRandomValues(new Uint8Array(16))].map((n) => n.toString(16).padStart(2, '0')).join('');
/** Market lines a day may add to the village news (상한가·하한가, 반대매매, the day's headline). */
const STOCK_NEWS_DAY = 4;
function stockNewsInto(life: LifeState, news: StockNews[], now: number) {
  const today = kstDay(now);
  let added = false;
  for (const n of news) {
    const day = kstDay(n.at);
    if (day < today - 1) continue;
    const lines = life.news?.find((d) => d.day === day)?.lines ?? [];
    if (lines.some((l) => l.key === n.key) || lines.filter((l) => l.kind === 'stock').length >= STOCK_NEWS_DAY) continue;
    const actors = n.uids.flatMap((u) => (Object.hasOwn(life.actors, u) ? [life.actors[u]] : []));
    const text = n.text.replace('{actor}', actors.length ? (ACTORS[actors[0]] ?? '누군가') : '누군가');
    addNews(life, n.at, n.key, n.kind, text, actors);
    added = true;
  }
  return added;
}
/** Refund whatever a broken room still holds, so one room cannot wedge the world. */
function isolateRoom(ledger: LoungeLedger, snapshot: HostedRoomSnapshot) {
  let next = ledger;
  for (const match of [
    snapshot.chess,
    snapshot.go,
    snapshot.poker,
    snapshot.blackjack,
    snapshot.seotda,
    snapshot.yacht,
    // 허풍 카드 can hold 참가비 (라이어 게임 never does; listed for safety).
    snapshot.liar,
    snapshot.liarsbar,
  ])
    if (match && next.games[match.id]?.state === 'reserved')
      next = voidGame(next, match.id);
  return next;
}
export function cloudTransition(
  original: CloudWorld,
  member: CloudMember,
  command: CloudCommand,
  hash: string,
  now: number,
) {
  if (
    !original ||
    original.schema !== 1 ||
    !original.rooms ||
    !original.receipts
  )
    throw new CloudError('서버 저장 기록을 읽을 수 없습니다.', 500);
  validateLedger(original.ledger);
  if (
    !UUID.test(member.id) ||
    !Number.isInteger(member.actor) ||
    member.actor < 0 ||
    member.actor > 6
  )
    throw new CloudError('등록된 계정이 아닙니다.', 403);
  if (command.code !== undefined && typeof command.code !== 'string')
    throw new CloudError('초대 코드를 확인해 주세요.', 400);
  const g = structuredClone(original),
    notifications = new Set<string>();
  // 새 방 가구 초기화 (lounge-rooms-reset.ts): once per world, before anything
  // else reads the furniture. A world with no furniture only gets the done-mark,
  // which is stored with the next write (a plain read still writes nothing).
  let resetMarkOnly = false;
  if (g.life) {
    const current = readLife(g.life);
    if (!current.roomsReset) {
      const reset = applyRoomsReset(current, now);
      if (reset.empty) {
        (g.life as LifeState).roomsReset = reset.life.roomsReset;
        resetMarkOnly = true;
      } else g.life = reset.life;
    }
  }
  g.epochs ??= {};
  g.ledger = compactLedger(g.ledger);
  const saveRoom = (
    c: string,
    r: LoungeRoom,
    leases: Record<string, Lease>,
  ) => {
    g.ledger = r.hostedLedger();
    const snapshot = r.hostedSnapshot();
    if (snapshot.players.length) g.rooms[c] = { snapshot, leases };
    else {
      r.hostedClose(now);
      g.ledger = r.hostedLedger();
      delete g.rooms[c];
    }
  };
  const lifeBefore = readLife(g.life),
    mayStay = (owner: number, visitor: number) =>
      mayEnterRoom(lifeBefore, owner, visitor);
  for (const [c, entry] of Object.entries(g.rooms)) {
    const before = g.ledger;
    try {
      const r = LoungeRoom.hosted(entry.snapshot, g.ledger);
      for (const [id, lease] of Object.entries(entry.leases))
        if (lease.seen < now - CLOUD_LEASE_MS) {
          r.hostedDrop(id, 'expired');
          delete entry.leases[id];
        }
      // A room its owner has closed: visitors still inside go back to the village.
      r.hostedEvictHomes(mayStay);
      r.hostedTick(now);
      saveRoom(c, r, entry.leases);
    } catch (error) {
      // Isolate the failing room: refund its reserved games and drop it.
      console.error('lounge: room tick failed', c, error);
      try {
        g.ledger = isolateRoom(before, entry.snapshot);
      } catch (refund) {
        console.error('lounge: refund of failed room failed', c, refund);
        g.ledger = before;
      }
      delete g.rooms[c];
    }
    if (JSON.stringify(original.rooms[c]) !== JSON.stringify(g.rooms[c]))
      notifications.add(c);
  }
  g.ledger = registerWallet(g.ledger, 'wallet-' + member.id);
  const mutating = !['read', 'wallet'].includes(command.op);
  // 범마을 증권: catch the market up to now (prices, dividends, interest, forced
  // sales). Only a command that writes anyway stores it; a read looks only.
  if (mutating) {
    const inputs = { ledger: g.ledger, casino: g.finance?.casino };
    if (!g.stocks) g.stocks = listStocks(stockSeed(), now, inputs);
    else {
      const m = materializeStocks(g.stocks, g.ledger, inputs, now);
      if (m.changed) {
        g.stocks = m.state;
        g.ledger = m.ledger;
        if (m.news.length) {
          const life = readLife(g.life);
          if (stockNewsInto(life, m.news, now)) g.life = life;
        }
      }
    }
  }
  let current = Object.keys(g.rooms).find((c) => g.rooms[c].leases[member.id]),
    target = command.code ? roomCode(command.code) : null;
  let ok = true,
    error = '',
    status = 200;
  /** A read's lease whose `seen` is refreshed only if we commit anyway (D-3). */
  let piggyback: Lease | null = null;
  if (
    mutating &&
    (!UUID.test(command.requestId ?? '') ||
      !UUID.test(command.connection ?? ''))
  )
    throw new CloudError('요청 정보를 확인해 주세요.');
  const old = mutating
    ? g.receipts[member.id]?.find((r) => r.id === command.requestId)
    : null;
  if (old && old.hash !== hash.slice(0, old.hash.length))
    throw new CloudError('이미 사용한 요청 번호입니다.', 409);
  const mark = g.sequences?.[member.id];
  if (
    mutating &&
    !old &&
    mark &&
    mark.connection === command.connection &&
    Number.isSafeInteger(command.sequence) &&
    command.sequence! <= mark.sequence
  )
    throw new CloudError('이미 처리했거나 순서가 지난 요청입니다.', 409);
  const receipt = old ?? null;
  if (!receipt) {
    try {
      if (command.op === 'open' || command.op === 'join') {
        if (command.epoch !== (g.epochs[member.id] ?? 0))
          throw new CloudError(
            '접속 정보가 갱신됐어요. 다시 입장해 주세요.',
            409,
          );
        if (command.op === 'join' && !target)
          throw new CloudError('10자리 초대 코드를 확인해 주세요.');
        if (current && command.op === 'join' && target !== current)
          throw new CloudError(
            `이미 ${current} 방에 있어요. 먼저 그 방에서 나가 주세요.`,
            409,
          );
        if (current) target = current;
        if (command.op === 'open' && !target) {
          do {
            target = code();
          } while (g.rooms[target]);
        }
        if (!target) throw new CloudError('방을 찾을 수 없습니다.');
        if (command.op === 'join' && !g.rooms[target])
          throw new CloudError('닫혔거나 없는 방이에요.', 404);
        const entry = g.rooms[target],
          r = LoungeRoom.hosted(
            entry?.snapshot ?? null,
            g.ledger,
            target,
            member.id,
          );
        r.hostedJoin(
          member.id,
          member.actor,
          command.look ?? defaultLook(member.actor),
        );
        const leases = entry?.leases ?? {};
        // A deliberate join on another device takes control; delayed old actions/leave fail.
        const previous = leases[member.id];
        leases[member.id] = {
          connection: command.connection!,
          seen: now,
          sequence:
            previous?.connection === command.connection ? previous.sequence : 0,
        };
        g.epochs[member.id] = (g.epochs[member.id] ?? 0) + 1;
        r.hostedTick(now);
        saveRoom(target, r, leases);
        current = target;
        notifications.add(target);
        g.life = ensureLifeMember(readLife(g.life), member.id, member.actor);
      } else if (command.op === 'action' && command.action?.kind === 'stock') {
        // 범마을 증권: orders at the server's price; new positions only inside the 증권사.
        const entry = target ? g.rooms[target] : undefined, lease = entry?.leases[member.id];
        if (!entry || !lease || lease.connection !== command.connection)
          throw new CloudError('마을에 다시 접속한 뒤 주문해 주세요.', 409);
        if (!Number.isSafeInteger(command.sequence) || command.sequence! <= lease.sequence)
          throw new CloudError('이미 처리했거나 순서가 지난 요청입니다.', 409);
        lease.sequence = command.sequence!;
        lease.seen = now;
        const player = entry.snapshot.players.find((p) => p.id === member.id);
        if (!player || !g.stocks) throw new CloudError('마을에 다시 접속한 뒤 주문해 주세요.', 409);
        const next = stocksAction(g.stocks, g.ledger, member.id, command.action, now, { area: player.area ?? 'village' });
        g.stocks = next.state;
        g.ledger = next.ledger;
      } else if (command.op === 'action' && command.action?.kind === 'finance') {
        const entry = target ? g.rooms[target] : undefined, lease = entry?.leases[member.id];
        if (!entry || !lease || lease.connection !== command.connection)
          throw new CloudError('마을에 다시 접속한 뒤 거래해 주세요.', 409);
        if (!Number.isSafeInteger(command.sequence) || command.sequence! <= lease.sequence)
          throw new CloudError('이미 처리했거나 순서가 지난 요청입니다.', 409);
        lease.sequence = command.sequence!;
        lease.seen = now;
        const life = readLife(g.life);
        const presence: FinancePresence[] = entry.snapshot.players.filter((p) => entry.leases[p.id]?.seen >= now - CLOUD_LEASE_MS).map((p) => ({
          ...p, busy: Object.values(entry.snapshot.tables ?? {}).some((t) => t?.members.includes(p.id)) ||
            (life.ext?.[p.id]?.pending?.expiresAt ?? 0) > now,
        }));
        const next = financeAction(g.finance, g.ledger, life, member.id, command.action, now, presence);
        g.finance = next.state; g.ledger = next.ledger; g.life = next.life;
        for (const c of Object.keys(g.rooms)) notifications.add(c);
      } else if (command.op === 'action' && isLifeAction(command.action)) {
        // Life actions work inside the village room and outside any room.
        const entry = target ? g.rooms[target] : undefined,
          lease = entry?.leases[member.id];
        if (lease) {
          if (lease.connection !== command.connection)
            throw new CloudError(
              '다른 창이나 기기에서 이 계정으로 입장했습니다. 여기서는 다시 입장해 주세요.',
              409,
            );
          if (
            !Number.isSafeInteger(command.sequence) ||
            command.sequence! <= lease.sequence
          )
            throw new CloudError('이미 처리했거나 순서가 지난 요청입니다.', 409);
          lease.sequence = command.sequence!;
          lease.seen = now;
        }
        try {
          if (command.action.kind === 'npcSocial') {
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            if (!lease || !player) throw new CloudError('마을에 먼저 접속한 뒤 주민을 만나 주세요.', 409);
            const life = readLife(g.life);
            assertNpcSocialContext(command.action, life.ext?.[member.id]?.npcRelations, {
              area: player.area ?? 'village', home: player.home, actor: member.actor,
              fishing: (life.ext?.[member.id]?.pending?.expiresAt ?? 0) > now,
              x: player.x, y: player.y,
              hill: (life.flags ?? []).includes('district-hillside'),
              ranch: (life.flags ?? []).includes('district-ranch'),
              foothill: (life.flags ?? []).includes('district-foothill'),
            }, now);
          }
          if ((command.action as { kind?: string }).kind === 'birthdayCheer') {
            // 생일 케이크: in the village plaza, by the cake (the authoritative player, not client coordinates).
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            if (!lease || !player) throw new CloudError('마을에 먼저 접속한 뒤 축하해 주세요.', 409);
            const area = player.area ?? 'village';
            assertBirthdayContext(area, area === 'village' ? villageFromNetwork({ x: player.x, y: player.y }) : null);
          }
          if (isVoyageAction(command.action)) {
            // Boarding at the pier; the 멀미약 at its seller (츠나데 텃밭, 메르시 의원).
            const where = voyageActionArea(command.action);
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            if (where && (!lease || !player || (player.area ?? 'village') !== where))
              throw new CloudError(where === 'harbor' ? '항구 큰 선착장의 출항 안내판 앞에서 타 주세요.' : '멀미약은 파는 곳에 가서 사 주세요.', 409);
          }
          if ((command.action as { kind?: string; spot?: unknown }).kind === 'anglerCast' && (command.action as { spot?: unknown }).spot === 'offshore') {
            // 먼바다: casting from the deck only (the fishing engine checks the voyage itself).
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            if (!lease || !player || player.area !== 'offshore') throw new CloudError('배 위에서만 먼바다 낚시를 할 수 있어요.', 409);
          }
          if ((command.action as { kind?: string }).kind === 'cupClaim' && (readLife(g.life).flags ?? []).includes('district-harbor')) {
            // 주간 낚시 대회 is held at the harbor once it is open: prizes are handed out at 낚시조합.
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            if (!lease || !player || player.area !== 'harbor') throw new CloudError('주간 낚시 대회 상품은 항구 낚시조합에서 받아요.', 409);
          }
          if (isTownAction(command.action)) {
            // 새벽 경매 at the harbor, 시장 거리 shops and stalls, the library's reading club,
            // 허풍 주점's food, 행상인 마키마 (시장 on Sundays, 항구 on Wednesdays and Saturdays).
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            const where = townActionArea(command.action, weekdayOf(kstDay(now)) !== 0);
            // Inside the shop's own room counts too (lounge-shop-interiors.ts).
            const shop = townActionShop(command.action.kind);
            if (!lease || !player || (player.area !== where && (!shop || player.area !== shop)))
              throw new CloudError(`${where === 'tavern' ? '허풍 주점' : DISTRICTS[where].name}에 가서 해 주세요.`, 409);
          }
          if (isStage3Action(command.action)) {
            // 3단계: 목장·과수원 / 산기슭 마을 (in the district or the shop's own room; 운세 on a
            // festival day also on the hub plaza, lounge-stage3-data.ts).
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            const places = stage3ActionAreas(command.action.kind, festivalDay(kstDay(now)));
            if (!lease || !player || !places.includes(player.area ?? 'village'))
              throw new CloudError(`${DISTRICTS[STAGE3_ACTION_PLACE[command.action.kind].district].name}에 가서 해 주세요.`, 409);
          }
          if ((command.action as { kind?: string }).kind === 'respec') {
            // 운명 다시 보기 is 신이치's (design-skill-tree.md §2): where his 운세 is read.
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            if (!lease || !player || !stage3ActionAreas('fortuneRead', festivalDay(kstDay(now))).includes(player.area ?? 'village'))
              throw new CloudError('운명 다시 보기는 산기슭 마을 점집의 신이치에게 부탁해요.', 409);
          }
          {
            // 가게 나누기: buying or selling "at" a shop needs me at its counter's district.
            const at = (command.action as { at?: unknown }).at;
            if (at !== undefined) {
              if (!isShopId(at)) throw new CloudError('가게를 확인해 주세요.', 400);
              const player = entry?.snapshot.players.find((p) => p.id === member.id);
              const where = shopArea(at, now);
              if (!where) throw new CloudError('행상인 마키마는 수요일·토요일(항구)과 일요일(시장 거리)에만 와요.', 409);
              // Its counter inside the shop's own room counts too (lounge-shop-interiors.ts).
              const inside = isShopArea(at) && player?.area === at;
              if (!lease || !player || ((player.area ?? 'village') !== where && !inside))
                throw new CloudError(`${SHOP_INFO[at].name}에 가서 해 주세요.`, 409);
            }
          }
          {
            // 나무결 가구점 / 범마을 부동산: buying needs me at the shop's door in the hub (lounge-hub-counters.ts).
            const counter = hubCounterFor(command.action.kind);
            if (counter && (!lease || !atHubCounter(counter, entry?.snapshot.players.find((p) => p.id === member.id))))
              throw new CloudError(hubCounterReject(counter), 409);
          }
          if (['eat', 'snack'].includes(command.action.kind)) {
            // 음식 시스템: the server says where I ate (함께 먹기); home cooking is eaten at home,
            // a lunchbox anywhere.
            const player = lease ? entry?.snapshot.players.find((p) => p.id === member.id) : undefined;
            const act = command.action as { kind: string; item?: unknown; where?: unknown };
            const area = player ? (player.area ?? 'village') : undefined;
            if (area === undefined) delete act.where;
            else act.where = area;
            const dish = act.kind === 'eat' && typeof act.item === 'string' && Object.hasOwn(DISH_BY_ID, act.item) ? DISH_BY_ID[act.item] : undefined;
            if (dish && !dish.lunch && area !== 'home')
              throw new CloudError('집밥은 방에서 먹어요. 밖에서는 도시락을 먹을 수 있어요.', 409);
          }
          if (command.action.kind === 'npcRequest') {
            // 의뢰 게시판 stands in 시장 거리 (lounge-market-layout.ts MARKET_BOARD).
            const player = entry?.snapshot.players.find((p) => p.id === member.id);
            if (!lease || !player || player.area !== 'market') throw new CloudError('시장 거리 의뢰 게시판 앞에서 전해 주세요.', 409);
          }
          const next = lifeAction(
            readLife(g.life),
            g.ledger,
            member,
            command.action,
            now,
          );
          g.life = next.life;
          g.ledger = next.ledger;
        } catch (e) {
          if (e instanceof LifeError) throw new CloudError(e.message, 409);
          throw e;
        }
        // Farms, statuses, guestbooks and mail are visible to friends. Watering
        // does not change a stage right away, so friends pick it up on their
        // next read instead of a broadcast; batch plant/water is one hint.
        if (!['sell', 'buy', 'pick', 'readMail', 'readGuestbook', 'water'].includes(command.action.kind))
          for (const c of Object.keys(g.rooms)) notifications.add(c);
        if (command.action.kind === 'room') {
          // Closing my room moves visitors out in this same transition.
          const life = readLife(g.life);
          for (const [c, entry] of Object.entries(g.rooms)) {
            const r = LoungeRoom.hosted(entry.snapshot, g.ledger);
            if (r.hostedEvictHomes((owner, visitor) => mayEnterRoom(life, owner, visitor))) {
              saveRoom(c, r, entry.leases);
              notifications.add(c);
            }
          }
        }
      } else if (
        command.op === 'action' &&
        command.action?.kind === 'daily' &&
        !(target && g.rooms[target]?.leases[member.id])
      ) {
        // The daily grant also works from the wallet outside any room.
        const id = 'wallet-' + member.id;
        if (!dailyGrantInfo(g.ledger, id, now).available)
          throw new CloudError(REJECT.daily, 409);
        g.ledger = claimDailyGrant(g.ledger, id, now, lifeWealth(readLife(g.life), member.id) + stockWealth(g.stocks, member.id));
      } else if (
        command.op === 'action' ||
        command.op === 'leave' ||
        command.op === 'read'
      ) {
        if (!target || !g.rooms[target]?.leases[member.id])
          throw new CloudError('이 방에 먼저 들어와 주세요.', 404);
        const entry = g.rooms[target],
          lease = entry.leases[member.id];
        if (lease.connection !== command.connection)
          throw new CloudError(
            '다른 창이나 기기에서 이 계정으로 입장했습니다. 여기서는 다시 입장해 주세요.',
            409,
          );
        if (
          mutating &&
          (!Number.isSafeInteger(command.sequence) ||
            command.sequence! <= lease.sequence)
        )
          throw new CloudError('이미 처리했거나 순서가 지난 요청입니다.', 409);
        if (mutating) lease.sequence = command.sequence!;
        if (mutating || now - lease.seen >= SEEN_REFRESH_MS) lease.seen = now;
        else if (now - lease.seen > SEEN_PIGGYBACK_MS) piggyback = lease;
        const r = roomContext(LoungeRoom.hosted(entry.snapshot, g.ledger), readLife(g.life), g.stocks);
        if (command.op === 'leave') {
          r.hostedDrop(member.id);
          delete entry.leases[member.id];
          current = undefined;
        }
        let quiet = command.op === 'read';
        if (command.op === 'action') {
          if (!command.action || typeof command.action !== 'object')
            throw new CloudError('요청 정보를 확인해 주세요.');
          const action = command.action as { kind?: unknown; area?: unknown; home?: unknown };
          if ((action.kind === 'move' || action.kind === 'area') && (g.life?.ext?.[member.id]?.pending?.expiresAt ?? 0) > now)
            throw new CloudError('낚시를 마치거나 취소한 뒤 움직일 수 있어요.', 409);
          // Walking into a friend's room ('home' + owner) honours their access setting.
          if (action.kind === 'area' && action.area === 'home') {
            const owner = action.home ?? member.actor;
            if (!validHomeOwner(owner)) throw new CloudError(REJECT.area, 400);
            if (!mayEnterRoom(readLife(g.life), owner, member.actor))
              throw new CloudError(HOME_CLOSED, 403);
          }
          // 항구 구역 / 언덕 주택가 open only once their village goal is recorded.
          // A shop's room (가게 실내) is behind its district: the fish market needs the harbor.
          const gated =
            action.kind !== 'area'
              ? null
              : isDistrictId(action.area) && action.area !== 'market'
                ? action.area
                : isShopArea(action.area) && SHOP_INTERIORS[action.area].district !== 'market'
                  ? SHOP_INTERIORS[action.area].district
                  : null;
          if (gated) {
            const flags = readLife(g.life).flags ?? [];
            if (!districtOpen(gated, { flags, pass: hasExplorerPass(member.actor, now) })) throw new CloudError(DISTRICTS[gated].hint, 403);
          }
          // 먼바다: the deck is there only while my voyage is out.
          if (action.kind === 'area' && action.area === 'offshore' && !voyageAt(readLife(g.life), member.id, now, DECK_EARLY_MS))
            throw new CloudError('배가 떠 있을 때만 갑판에 오를 수 있어요.', 409);
          // 파티 판: the crop must be in the bag; it is eaten only on success.
          let eat: PartyItem | null = null;
          if (action.kind === 'party') {
            const item = (command.action as { item?: unknown }).item;
            if (!isPartyItem(item)) throw new CloudError(REJECT.invalid, 400);
            if (partyCount(readLife(g.life).bag[member.id], item) < 1)
              throw new CloudError(PARTY_REJECT.bag(item), 409);
            eat = item;
          }
          const reason = r.hostedAttempt(member.id, command.action, now);
          if (reason) throw new CloudError(reason, 409);
          if (eat) {
            const life = readLife(g.life);
            life.bag[member.id] = eatPartyItem(life.bag[member.id], eat);
            g.life = life;
          }
          // Visiting a friend's room counts toward friendship and the digest.
          if (
            action.kind === 'area' &&
            action.area === 'home' &&
            validHomeOwner(action.home) &&
            action.home !== member.actor
          ) {
            const before = readLife(g.life),
              after = recordVisit(before, member, action.home as number, now);
            if (after !== before) g.life = after;
          }
          // The first walk into a district (for the 친구에게 가기 signpost).
          if (action.kind === 'area' && isDistrictId(action.area)) {
            const life = readLife(g.life);
            if (!life.ext?.[member.id]?.town?.seen?.includes(action.area)) {
              const next = ensureLifeMember(life, member.id, member.actor);
              if (recordDistrictVisit(next, member.id, action.area)) g.life = next;
            }
          }
          // A coalesced look is applied by a later tick; no broadcast now.
          quiet = r.hostedCoalesced;
        }
        // 먼바다: a voyage that ran out (or ended early) puts me back on the pier
        // with my next command or read (nothing has to run at the 20-minute mark).
        const aboard = r.hostedPlayer(member.id);
        if (aboard?.area === 'offshore' && !voyageAt(readLife(g.life), member.id, now, DECK_EARLY_MS)) {
          const pier = regionToNetwork('harbor', HARBOR_VOYAGE.landing);
          r.hostedAttempt(member.id, { kind: 'area', area: 'harbor', x: pier.x, y: pier.y }, now);
          quiet = false;
        }
        r.hostedTick(now);
        saveRoom(target, r, entry.leases);
        if (!quiet) notifications.add(target);
      } else if (command.op !== 'wallet')
        throw new CloudError('지원하지 않는 요청입니다.');
    } catch (e) {
      // Bugs propagate (500, logged by the caller, nothing committed).
      if (!isRejection(e)) throw e;
      ok = false;
      error = e.message;
      status = e instanceof CloudError ? e.status : 409;
    }
    if (mutating) {
      const list = g.receipts[member.id] ?? [];
      g.receipts[member.id] = [
        ...list,
        {
          id: command.requestId!,
          // 128 bits of the SHA-256 are plenty to tell a retry from reuse.
          hash: hash.slice(0, 32),
          code: target ?? '',
          ok,
          error,
          at: now,
        },
      ];
      if (Number.isSafeInteger(command.sequence)) {
        g.sequences ??= {};
        const prev = g.sequences[member.id];
        g.sequences[member.id] = {
          connection: command.connection!,
          sequence:
            prev?.connection === command.connection
              ? Math.max(prev.sequence, command.sequence!)
              : command.sequence!,
        };
      }
    }
  } else {
    ok = receipt.ok;
    error = receipt.error;
    status = ok ? 200 : 409;
    target = receipt.code || target;
  }
  // Table games that settled in this transition: friendship, stats, the
  // Friday casino-night bonus and a digest line (life expansion).
  g.finance = recordCasino(g.finance, original.ledger, g.ledger, now);
  // An overdue casino loan takes whatever the borrower holds on their next request.
  if (mutating) ({ state: g.finance, ledger: g.ledger } = collectOverdue(g.finance, g.ledger, member.id, now));
  const settled = Object.entries(g.ledger.games)
    .filter(
      ([id, game]) =>
        game.state === 'settled' &&
        original.ledger.games[id]?.state !== 'settled' &&
        game.wallets.length > 1,
    )
    .map(([id, game]) => ({ id, wallets: game.wallets }));
  // 테이블 기록 (also 혼자 블랙잭): results only, never money.
  const newlySettled = Object.entries(g.ledger.games)
    .filter(([id, game]) => game.state === 'settled' && original.ledger.games[id]?.state !== 'settled')
    .map(([, game]) => game);
  if (newlySettled.length)
    g.tableStats = recordTableStats(
      readTableStats(g.tableStats, now),
      newlySettled,
      (w) => (w.startsWith('wallet-') ? w.slice(7) : null),
      now,
    );
  if (settled.length) {
    const next = recordTables(readLife(g.life), g.ledger, settled, now);
    g.life = next.life;
    g.ledger = next.ledger;
  }
  // 무드 (lounge-mood.ts): only on a row that is written anyway — a new command
  // or a read that refreshed its lease. A plain read never writes (D-3).
  if (!receipt && g.life && (mutating || moodWritesAnyway(original.rooms, g.rooms, member.id, now))) {
    const a = command.op === 'action' && ok ? (command.action as { kind?: unknown; area?: unknown; home?: unknown } | undefined) : undefined;
    g.life = moodAfterCloud({
      life: readLife(g.life),
      before: lifeBefore,
      member,
      prevGames: original.ledger.games,
      games: g.ledger.games,
      prevRooms: original.rooms,
      rooms: g.rooms,
      leaseMs: CLOUD_LEASE_MS,
      visited: a?.kind === 'area' && a.area === 'home' && validHomeOwner(a.home) ? (a.home as number) : null,
      room: member.room,
      now,
    });
  }
  // No packet before the caller atomically commits g. A receipt returns a fresh
  // authorized view, never another connection's historical private response.
  const entry = target ? g.rooms[target] : null,
    lease = entry?.leases[member.id];
  const allowed = !!entry && lease?.connection === command.connection;
  const runtime = allowed ? LoungeRoom.hosted(entry.snapshot, g.ledger) : null;
  const lifeState = readLife(g.life),
    life = lifeView(lifeState, member.id, member.actor, now);
  // `life` travels once, at the top level (it used to be in the packet too).
  const packet = runtime ? runtime.hostedPacket(member.id) : null;
  // serverNow ticks on every call; the client stamps it from the response.
  const lifeHash = viewHash({ ...life, serverNow: 0 });
  // 범마을 증권: a read shows the market caught up in memory only.
  const shown = g.stocks
    ? mutating ? g.stocks : materializeStocks(g.stocks, g.ledger, { ledger: g.ledger, casino: g.finance?.casino }, now).state
    : null;
  const stocks = shown ? stocksView(shown, member.id, lifeState.actors, now) : null;
  const stocksHash = stocks ? viewHash(stocks) : '';
  const nextDue =
    entry && allowed ? snapshotNextDue(entry.snapshot) : Infinity;
  const response = {
    ok,
    error,
    status,
    code: allowed ? target : '',
    host: allowed ? entry.snapshot.host : null,
    packet,
    wallet: wallet(g.ledger, member.id, now, lifeState, g.stocks),
    ...(command.lifeHash === lifeHash ? {} : { life }),
    lifeHash,
    ...(stocks && command.stocksHash !== stocksHash ? { stocks } : {}),
    stocksHash,
    finance: financeView(g.finance, g.ledger, lifeState, member.id, now),
    tableStats: tableStatsView(
      readTableStats(g.tableStats, now),
      member.id,
      (uid) => (Object.hasOwn(lifeState.actors, uid) ? lifeState.actors[uid] : null),
      now,
    ),
    activeRoom: current ?? null,
    epoch: g.epochs[member.id] ?? 0,
    nextDue: Number.isFinite(nextDue) ? nextDue : null,
    serverNow: now,
  };
  validateLedger(g.ledger);
  // A life started in this very command is born after the reset.
  if (g.life && !(g.life as LifeState).roomsReset) {
    (g.life as LifeState).roomsReset = { id: ROOMS_RESET_ID, at: now, backup: {} };
    resetMarkOnly = true;
  }
  const changed =
    resetMarkOnly && !original.life?.roomsReset
      ? JSON.stringify({ ...g, life: withoutResetMark(g.life!) }) !== JSON.stringify(original)
      : JSON.stringify(g) !== JSON.stringify(original);
  // The row is rewritten anyway (a timer fired, someone else's lease expired…):
  // refresh this reader's presence for free. `seen` is not in the response.
  if (changed && piggyback) piggyback.seen = now;
  // Trim (and migrate legacy) receipts only when the row is written anyway.
  if (changed) g.receipts = trimReceipts(g.receipts, now);
  return {
    state: g,
    response,
    notifications: [...notifications],
    changed,
  };
}
