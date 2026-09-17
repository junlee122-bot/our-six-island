// This module runs in the Edge Function and tests, never as a client authority.
import {
  LoungeRoom,
  type HostedRoomSnapshot,
  type LoungeAction,
} from './lounge-room.ts';
import {
  validateLedger,
  registerWallet,
  type LoungeLedger,
} from './lounge-economy.ts';
import { LoungeBank } from './lounge-wallet.ts';
import { roomCode } from './multiplayer-protocol.ts';
import { defaultLook, type Look } from './lounge-look.ts';
export type CloudMember = { id: string; actor: number; username: string };
type Lease = { connection: string; seen: number; sequence: number };
type Room = { snapshot: HostedRoomSnapshot; leases: Record<string, Lease> };
type Receipt = {
  id: string;
  hash: string;
  code: string;
  ok: boolean;
  error: string;
};
export type CloudWorld = {
  schema: 1;
  ledger: LoungeLedger;
  rooms: Record<string, Room>;
  receipts: Record<string, Receipt[]>;
  epochs?: Record<string, number>;
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
function wallet(ledger: LoungeLedger, id: string) {
  const bank = new LoungeBank(null);
  bank.commit(ledger);
  return bank.view('wallet-' + id);
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
  const g = structuredClone(original),
    notifications = new Set<string>();
  g.epochs ??= {};
  const saveRoom = (
    c: string,
    r: LoungeRoom,
    leases: Record<string, Lease>,
  ) => {
    g.ledger = r.hostedLedger();
    const snapshot = r.hostedSnapshot();
    if (snapshot.players.length) g.rooms[c] = { snapshot, leases };
    else {
      r.hostedClose();
      g.ledger = r.hostedLedger();
      delete g.rooms[c];
    }
  };
  for (const [c, entry] of Object.entries(g.rooms)) {
    const r = LoungeRoom.hosted(entry.snapshot, g.ledger);
    for (const [id, lease] of Object.entries(entry.leases))
      if (lease.seen < now - CLOUD_LEASE_MS) {
        r.hostedDrop(id);
        delete entry.leases[id];
      }
    r.hostedTick(now);
    saveRoom(c, r, entry.leases);
    if (JSON.stringify(original.rooms[c]) !== JSON.stringify(g.rooms[c]))
      notifications.add(c);
  }
  g.ledger = registerWallet(g.ledger, 'wallet-' + member.id);
  let current = Object.keys(g.rooms).find((c) => g.rooms[c].leases[member.id]),
    target = command.code ? roomCode(command.code) : null;
  let ok = true,
    error = '',
    status = 200;
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
  if (old && old.hash !== hash)
    throw new CloudError('이미 사용한 요청 번호입니다.', 409);
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
          throw new CloudError('닫혔거나 없는 라운지입니다.', 404);
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
      } else if (
        command.op === 'action' ||
        command.op === 'leave' ||
        command.op === 'read'
      ) {
        if (!target || !g.rooms[target]?.leases[member.id])
          throw new CloudError('이 라운지에 먼저 입장해 주세요.', 404);
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
        if (now - lease.seen > 15000 || mutating) lease.seen = now;
        const r = LoungeRoom.hosted(entry.snapshot, g.ledger);
        if (command.op === 'leave') {
          r.hostedDrop(member.id);
          delete entry.leases[member.id];
          current = undefined;
        }
        if (command.op === 'action') {
          if (
            !command.action ||
            !r.hostedAction(member.id, command.action, now)
          )
            throw new CloudError(
              '상태가 바뀌었어요. 참가 인원, 잔액과 차례를 확인해 주세요.',
              409,
            );
        }
        r.hostedTick(now);
        saveRoom(target, r, entry.leases);
        if (command.op !== 'read') notifications.add(target);
      } else if (command.op !== 'wallet')
        throw new CloudError('지원하지 않는 요청입니다.');
    } catch (e) {
      if (!(e instanceof Error)) throw e;
      ok = false;
      error = e.message;
      status = e instanceof CloudError ? e.status : 409;
    }
    if (mutating) {
      const list = g.receipts[member.id] ?? [];
      g.receipts[member.id] = [
        ...list,
        { id: command.requestId!, hash, code: target ?? '', ok, error },
      ].slice(-512);
    }
  } else {
    ok = receipt.ok;
    error = receipt.error;
    status = ok ? 200 : 409;
    target = receipt.code || target;
  }
  // No packet before the caller atomically commits g. A receipt returns a fresh
  // authorized view, never another connection's historical private response.
  const entry = target ? g.rooms[target] : null,
    lease = entry?.leases[member.id];
  const allowed = !!entry && lease?.connection === command.connection;
  const runtime = allowed ? LoungeRoom.hosted(entry.snapshot, g.ledger) : null;
  const packet = runtime ? runtime.hostedPacket(member.id) : null;
  const nextDue =
    entry && allowed
      ? Math.min(...Object.values(entry.snapshot.due).map((d) => d.at))
      : Infinity;
  const response = {
    ok,
    error,
    status,
    code: allowed ? target : '',
    host: allowed ? entry.snapshot.host : null,
    packet,
    wallet: wallet(g.ledger, member.id),
    activeRoom: current ?? null,
    epoch: g.epochs[member.id] ?? 0,
    nextDue: Number.isFinite(nextDue) ? nextDue : null,
    serverNow: now,
  };
  validateLedger(g.ledger);
  return {
    state: g,
    response,
    notifications: [...notifications],
    changed: JSON.stringify(g) !== JSON.stringify(original),
  };
}
