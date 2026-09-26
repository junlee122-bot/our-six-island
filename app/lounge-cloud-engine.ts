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
export type CloudMember = { id: string; actor: number; username: string };
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
};
export class CloudError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CLOUD_LEASE_MS = 180000;
/**
 * D-3: a plain `read` only rewrites the world row to refresh `lease.seen` when
 * the lease is older than this (well under CLOUD_LEASE_MS even with the 45 s
 * hidden-tab poll and one missed poll). Fresher leases are refreshed only when
 * the transition commits anyway (SEEN_PIGGYBACK_MS granularity).
 */
export const SEEN_REFRESH_MS = 60000;
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
function wallet(ledger: LoungeLedger, id: string, now: number, life?: LifeState) {
  const bank = new LoungeBank(null);
  bank.commit(ledger);
  return bank.view('wallet-' + id, now, life ? lifeWealth(life, id) : 0);
}
/** Village context a hosted room needs: flags (VIP stakes) and bag wealth (relief). */
function roomContext(r: LoungeRoom, life: LifeState) {
  r.villageFlags = [...(life.flags ?? [])];
  r.wealthOf = (w) => lifeWealth(life, w.replace(/^wallet-/, ''));
  return r;
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
  let current = Object.keys(g.rooms).find((c) => g.rooms[c].leases[member.id]),
    target = command.code ? roomCode(command.code) : null;
  let ok = true,
    error = '',
    status = 200;
  /** A read's lease whose `seen` is refreshed only if we commit anyway (D-3). */
  let piggyback: Lease | null = null;
  const mutating = !['read', 'wallet'].includes(command.op);
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
        g.ledger = claimDailyGrant(g.ledger, id, now, lifeWealth(readLife(g.life), member.id));
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
        if (mutating || now - lease.seen > SEEN_REFRESH_MS) lease.seen = now;
        else if (now - lease.seen > SEEN_PIGGYBACK_MS) piggyback = lease;
        const r = roomContext(LoungeRoom.hosted(entry.snapshot, g.ledger), readLife(g.life));
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
          // Walking into a friend's room ('home' + owner) honours their access setting.
          if (action.kind === 'area' && action.area === 'home') {
            const owner = action.home ?? member.actor;
            if (!validHomeOwner(owner)) throw new CloudError(REJECT.area, 400);
            if (!mayEnterRoom(readLife(g.life), owner, member.actor))
              throw new CloudError(HOME_CLOSED, 403);
          }
          const reason = r.hostedAttempt(member.id, command.action, now);
          if (reason) throw new CloudError(reason, 409);
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
          // A coalesced look is applied by a later tick; no broadcast now.
          quiet = r.hostedCoalesced;
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
  const settled = Object.entries(g.ledger.games)
    .filter(
      ([id, game]) =>
        game.state === 'settled' &&
        original.ledger.games[id]?.state !== 'settled' &&
        game.wallets.length > 1,
    )
    .map(([id, game]) => ({ id, wallets: game.wallets }));
  if (settled.length) {
    const next = recordTables(readLife(g.life), g.ledger, settled, now);
    g.life = next.life;
    g.ledger = next.ledger;
  }
  // No packet before the caller atomically commits g. A receipt returns a fresh
  // authorized view, never another connection's historical private response.
  const entry = target ? g.rooms[target] : null,
    lease = entry?.leases[member.id];
  const allowed = !!entry && lease?.connection === command.connection;
  const runtime = allowed ? LoungeRoom.hosted(entry.snapshot, g.ledger) : null;
  const lifeState = readLife(g.life),
    life = lifeView(lifeState, member.id, member.actor, now);
  const packet = runtime ? { ...runtime.hostedPacket(member.id), life } : null;
  const nextDue =
    entry && allowed ? snapshotNextDue(entry.snapshot) : Infinity;
  const response = {
    ok,
    error,
    status,
    code: allowed ? target : '',
    host: allowed ? entry.snapshot.host : null,
    packet,
    wallet: wallet(g.ledger, member.id, now, lifeState),
    life,
    activeRoom: current ?? null,
    epoch: g.epochs[member.id] ?? 0,
    nextDue: Number.isFinite(nextDue) ? nextDue : null,
    serverNow: now,
  };
  validateLedger(g.ledger);
  const changed = JSON.stringify(g) !== JSON.stringify(original);
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
