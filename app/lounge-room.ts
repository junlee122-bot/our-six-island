import { IslandRoom } from './multiplayer-transport.ts';
import { PEER_PREFIX, roomCode } from './multiplayer-protocol.ts';
import { readLook, type Look } from './lounge-look.ts';
import { channelIdentity, channelKey, seal, unseal } from './lounge-crypto.ts';
import {
  newChess,
  chessMove,
  chessResign,
  type ChessMatch,
} from './lounge-chess.ts';
import {
  newGo,
  shuffleCards,
  goAction,
  goView,
  type GoMatch,
  type GoView,
  type GoAction,
} from './lounge-gostop.ts';
export type GameKind = 'chess' | 'gostop';
export type GameInvite = {
  id: string;
  game: GameKind;
  from: string;
  invited: string[];
  accepted: string[];
  declined: string[];
  status: 'waiting' | 'started' | 'cancelled' | 'expired';
  expires: number;
  matchId: string | null;
};
export type LoungePlayer = {
  id: string;
  actor: number;
  look: Look;
  x: number;
  y: number;
  emote: string;
  emoteAt: number;
};
export type LoungeWorld = {
  players: LoungePlayer[];
  seats: { chess: (string | null)[]; gostop: (string | null)[] };
  chess: ChessMatch | null;
  gostop: GoView | null;
  chat: { id: string; actor: number; text: string }[];
  invites: GameInvite[];
};
export type LoungeView = LoungeWorld & {
  status: 'offline' | 'connecting' | 'selecting' | 'connected' | 'error';
  role: 'host' | 'guest' | null;
  code: string;
  self: string;
  error: string;
  claiming: number | null;
};
const empty = (): LoungeView => ({
  status: 'offline',
  role: null,
  code: '',
  self: '',
  error: '',
  claiming: null,
  players: [],
  seats: { chess: [null, null], gostop: [null, null, null] },
  chess: null,
  gostop: null,
  chat: [],
  invites: [],
});
const actorValid = (v: unknown): v is number =>
  Number.isInteger(v) && Number(v) >= 0 && Number(v) < 7;
const player = (id: string, actor: number, look: Look): LoungePlayer => ({
  id,
  actor,
  look: readLook(look, actor),
  x: 42 + actor * 3,
  y: 74,
  emote: '',
  emoteAt: 0,
});
function playersRead(value: unknown): LoungePlayer[] | null {
  if (!Array.isArray(value) || value.length > 7) return null;
  const ids = new Set(),
    actors = new Set();
  const out: LoungePlayer[] = [];
  for (const p of value) {
    if (
      !p ||
      !actorValid(p.actor) ||
      typeof p.id !== 'string' ||
      p.id.length > 100 ||
      ids.has(p.id) ||
      actors.has(p.actor) ||
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y)
    )
      return null;
    ids.add(p.id);
    actors.add(p.actor);
    out.push({
      ...player(p.id, p.actor, p.look),
      x: p.x,
      y: p.y,
      emote: typeof p.emote === 'string' ? p.emote.slice(0, 16) : '',
      emoteAt: Number(p.emoteAt) || 0,
    });
  }
  return out;
}
export type LoungeAction =
  | { kind: 'invite'; game: GameKind; players: string[] }
  | { kind: 'reply'; id: string; accept: boolean }
  | { kind: 'cancel'; id: string }
  | { kind: 'stand'; game: GameKind }
  | {
      kind: 'chess';
      id: string;
      ply: number;
      from: string;
      to: string;
      promotion?: string;
    }
  | { kind: 'resign'; id: string }
  | { kind: 'gostop'; id: string; ply: number; action: GoAction }
  | { kind: 'move'; x: number; y: number }
  | { kind: 'look'; look: Look }
  | { kind: 'chat'; text: string }
  | { kind: 'emote'; emote: string };
export class LoungeRoom {
  view = empty();
  private listeners = new Set<() => void>();
  private transport: IslandRoom | null = null;
  private members = new Map<string, LoungePlayer>();
  private identity: Awaited<ReturnType<typeof channelIdentity>> | null = null;
  private keys = new Map<string, CryptoKey>();
  private challenges = new Map<string, { nonce: string; time: number }>();
  private seen = new Map<string, number>();
  private lastChat = new Map<string, number>();
  private chess: ChessMatch | null = null;
  private go: GoMatch | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private deadline: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private nonce = '';
  private hostSeen = 0;
  private incoming = Promise.resolve();
  private outgoing = Promise.resolve();
  private pending: { actor: number; look: Look } | null = null;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  snapshot = () => this.view;
  private update(patch: Partial<LoungeView>) {
    this.view = { ...this.view, ...patch };
    for (const fn of this.listeners) fn();
  }
  private hostId() {
    return PEER_PREFIX + this.view.code;
  }
  private send(to: string, payload: unknown) {
    const key = this.keys.get(to),
      transport = this.transport,
      generation = this.generation;
    if (!key || !transport) return;
    this.outgoing = this.outgoing
      .then(async () => {
        const packet = await seal(key, payload);
        if (generation === this.generation) transport.send(to, packet);
      })
      .catch(() => {});
  }
  private packet(id: string) {
    return {
      v: 1,
      type: 'world',
      players: [...this.members.values()],
      seats: this.view.seats,
      chess: this.chess,
      gostop: this.go
        ? goView(this.go, this.view.seats.gostop.indexOf(id))
        : null,
      chat: this.view.chat,
      invites: this.view.invites,
    };
  }
  private sync() {
    const players = [...this.members.values()];
    this.transport?.retain(players.map((p) => p.id));
    this.update({
      players,
      chess: this.chess,
      gostop: this.go
        ? goView(this.go, this.view.seats.gostop.indexOf(this.view.self))
        : null,
    });
    for (const p of players)
      if (p.id !== this.view.self) this.send(p.id, this.packet(p.id));
    for (const id of this.challenges.keys()) this.lobby(id);
  }
  private lobby(id: string, error = '') {
    const c = this.challenges.get(id);
    if (c)
      this.transport?.send(id, {
        v: 1,
        type: 'lobby',
        nonce: c.nonce,
        publicKey: this.identity!.publicKey,
        players: [...this.members.values()],
        error,
      });
  }
  leave(error = '') {
    this.generation++;
    if (this.timer) clearInterval(this.timer);
    if (this.deadline) clearTimeout(this.deadline);
    this.timer = null;
    this.deadline = null;
    this.transport?.close();
    this.transport = null;
    this.members.clear();
    this.challenges.clear();
    this.keys.clear();
    this.seen.clear();
    this.lastChat.clear();
    this.identity = null;
    this.chess = null;
    this.go = null;
    this.pending = null;
    this.nonce = '';
    this.view = empty();
    this.update({ status: error ? 'error' : 'offline', error });
  }
  async start(
    role: 'host' | 'guest',
    input: string,
    actor: number,
    look: Look,
  ) {
    this.leave();
    let code = '';
    if (role === 'guest') {
      try {
        const url = input.trim().startsWith('http') ? new URL(input) : null;
        code =
          roomCode(
            url
              ? (new URLSearchParams(url.hash.slice(1)).get('lounge') ?? '')
              : input,
          ) ?? '';
      } catch {}
      if (!code) {
        this.update({
          status: 'error',
          error: '10자리 초대 코드 또는 라운지 초대 링크를 확인해 주세요.',
        });
        return;
      }
    }
    if (!actorValid(actor)) return;
    const generation = ++this.generation;
    this.update({ status: 'connecting', role, code });
    this.deadline = setTimeout(() => {
      if (generation === this.generation)
        this.leave('연결하지 못했어요. 방장이 접속 중인지 확인해 주세요.');
    }, 25000);
    try {
      const [room, identity] = await Promise.all([
        IslandRoom.create(role === 'host', code, 'hohyeon-lounge-v1:', 131072),
        channelIdentity(),
      ]);
      if (generation !== this.generation) {
        room.close();
        return;
      }
      this.identity = identity;
      this.transport = room;
      this.update({ self: room.id, code: room.code });
      await room.connect(
        (from, data) => {
          this.incoming = this.incoming
            .then(async () => {
              if (generation === this.generation)
                await this.receive(from, data);
            })
            .catch(() => {});
        },
        () => {
          if (generation === this.generation)
            this.leave('실시간 연결이 끊겼어요. 다시 참가해 주세요.');
        },
      );
      if (generation !== this.generation) return;
      this.hostSeen = Date.now();
      if (role === 'host') {
        this.members.set(room.id, player(room.id, actor, look));
        this.finishConnecting();
        this.sync();
      } else this.hello();
      this.timer = setInterval(() => this.tick(), 4000);
    } catch {
      if (generation === this.generation)
        this.leave('라운지에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }
  private finishConnecting() {
    if (this.deadline) clearTimeout(this.deadline);
    this.deadline = null;
    this.update({ status: 'connected', claiming: null, error: '' });
  }
  private hello() {
    this.transport?.send(this.hostId(), {
      v: 1,
      type: 'hello',
      lounge: 1,
      publicKey: this.identity?.publicKey,
    });
  }
  claim(actor: number, look: Look) {
    if (
      this.view.status !== 'selecting' ||
      !actorValid(actor) ||
      this.view.players.some((p) => p.actor === actor)
    )
      return false;
    this.pending = { actor, look: readLook(look, actor) };
    this.update({ claiming: actor, error: '' });
    this.transport?.send(this.hostId(), {
      v: 1,
      type: 'join',
      nonce: this.nonce,
      ...this.pending,
    });
    return true;
  }
  action(action: LoungeAction) {
    if (this.view.status !== 'connected') return false;
    if (this.view.role === 'host') {
      const ok = this.apply(this.view.self, action);
      if (!ok)
        this.update({
          error: '상태가 바뀌었어요. 참가 인원과 차례를 확인해 주세요.',
        });
      return ok;
    }
    this.send(this.hostId(), { v: 1, type: 'action', action });
    return true;
  }
  private gameActive(game: GameKind) {
    return game === 'chess'
      ? !!this.chess && !this.chess.winner
      : !!this.go && this.go.phase !== 'over';
  }
  private busy(id: string, except = '') {
    return (
      (['chess', 'gostop'] as GameKind[]).some(
        (game) => this.gameActive(game) && this.view.seats[game].includes(id),
      ) ||
      this.view.invites.some(
        (r) =>
          r.id !== except && r.status === 'waiting' && r.accepted.includes(id),
      )
    );
  }
  private launch(request: GameInvite) {
    for (const id of request.accepted) this.removeSeat(id);
    const seats = { ...this.view.seats, [request.game]: [...request.accepted] };
    request.status = 'started';
    request.matchId = crypto.randomUUID();
    this.update({ seats });
    if (request.game === 'chess') this.chess = newChess(request.matchId);
    else this.go = newGo(request.matchId, shuffleCards());
    for (let i = 0; i < request.accepted.length; i++) {
      const p = this.members.get(request.accepted[i])!;
      this.members.set(p.id, {
        ...p,
        x:
          (request.game === 'chess' ? 31 : 68) +
          (i === 0 ? -8 : i === 1 ? 8 : 0),
        y: i === 2 ? 78 : 64,
      });
    }
  }
  private apply(id: string, a: LoungeAction) {
    const member = this.members.get(id);
    if (!member || !a || typeof a !== 'object') return false;
    if (a.kind === 'move') {
      if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || this.busy(id))
        return false;
      this.members.set(id, {
        ...member,
        x: Math.max(15, Math.min(85, a.x)),
        y: Math.max(42, Math.min(88, a.y)),
      });
    } else if (a.kind === 'look')
      this.members.set(id, { ...member, look: readLook(a.look, member.actor) });
    else if (a.kind === 'emote') {
      if (!['👋', '♥', '✨', 'ㅋㅋ'].includes(a.emote)) return false;
      this.members.set(id, { ...member, emote: a.emote, emoteAt: Date.now() });
    } else if (a.kind === 'chat') {
      const text =
        typeof a.text === 'string' ? a.text.trim().slice(0, 120) : '';
      if (!text || Date.now() - (this.lastChat.get(id) ?? 0) < 500)
        return false;
      this.lastChat.set(id, Date.now());
      this.update({
        chat: [
          ...this.view.chat,
          { id: crypto.randomUUID(), actor: member.actor, text },
        ].slice(-12),
      });
    } else if (a.kind === 'invite') {
      if (
        !['chess', 'gostop'].includes(a.game) ||
        !Array.isArray(a.players) ||
        a.players.length > 6 ||
        this.busy(id) ||
        this.gameActive(a.game) ||
        this.view.invites.some(
          (r) => r.game === a.game && r.status === 'waiting',
        )
      )
        return false;
      const invited = [...new Set(a.players)].filter(
        (p) => p !== id && this.members.has(p) && !this.busy(p),
      );
      if (invited.length < (a.game === 'chess' ? 1 : 2)) return false;
      this.update({
        invites: [
          ...this.view.invites.filter((r) => r.status === 'waiting').slice(-1),
          {
            id: crypto.randomUUID(),
            game: a.game,
            from: id,
            invited,
            accepted: [id],
            declined: [],
            status: 'waiting',
            expires: Date.now() + 90000,
            matchId: null,
          },
        ],
      });
    } else if (a.kind === 'reply') {
      const invites = structuredClone(this.view.invites),
        request = invites.find((r) => r.id === a.id);
      if (
        !request ||
        request.status !== 'waiting' ||
        Date.now() > request.expires ||
        !request.invited.includes(id) ||
        request.accepted.includes(id) ||
        request.declined.includes(id) ||
        typeof a.accept !== 'boolean'
      )
        return false;
      if (a.accept) {
        if (this.busy(id, request.id) || this.gameActive(request.game))
          return false;
        request.accepted.push(id);
        if (request.accepted.length === (request.game === 'chess' ? 2 : 3))
          this.launch(request);
      } else {
        request.declined.push(id);
        if (
          1 + request.invited.length - request.declined.length <
          (request.game === 'chess' ? 2 : 3)
        )
          request.status = 'cancelled';
      }
      this.update({ invites });
    } else if (a.kind === 'cancel') {
      const invites = structuredClone(this.view.invites),
        r = invites.find((r) => r.id === a.id);
      if (!r || r.status !== 'waiting' || !r.accepted.includes(id))
        return false;
      r.status = 'cancelled';
      this.update({ invites });
    } else if (a.kind === 'stand') {
      if (
        !['chess', 'gostop'].includes(a.game) ||
        !this.view.seats[a.game].includes(id)
      )
        return false;
      this.removeSeat(id);
      this.members.set(id, { ...member, x: 48, y: 79 });
    } else if (a.kind === 'chess') {
      const g = this.chess,
        seat = this.view.seats.chess.indexOf(id);
      if (!g || seat < 0 || a.id !== g.id || a.ply !== g.moves.length)
        return false;
      const next = chessMove(g, seat, a.from, a.to, a.promotion);
      if (!next) return false;
      this.chess = next;
    } else if (a.kind === 'resign') {
      const seat = this.view.seats.chess.indexOf(id);
      if (
        !this.chess ||
        seat < 0 ||
        a.id !== this.chess.id ||
        this.chess.winner
      )
        return false;
      this.chess = chessResign(this.chess, seat);
    } else if (a.kind === 'gostop') {
      const g = this.go,
        seat = this.view.seats.gostop.indexOf(id);
      if (!g || seat < 0 || a.id !== g.id || a.ply !== g.ply) return false;
      const next = goAction(g, seat, a.action);
      if (!next) return false;
      this.go = next;
    } else return false;
    this.sync();
    return true;
  }
  private removeSeat(id: string) {
    const c = this.view.seats.chess.indexOf(id),
      g = this.view.seats.gostop.indexOf(id);
    if (c >= 0 && this.chess && !this.chess.winner)
      this.chess = chessResign(this.chess, c);
    if (g >= 0 && this.go && this.go.phase !== 'over')
      this.go = {
        ...this.go,
        phase: 'over',
        winner: null,
        reason: '친구가 자리를 떠나 이번 판을 마쳤어요.',
        revision: this.go.revision + 1,
        motion: {seq: this.go.revision + 1, actor: g, steps: []},
        result: [0, 0, 0],
      };
    this.update({
      seats: {
        chess: this.view.seats.chess.map((s) => (s === id ? null : s)),
        gostop: this.view.seats.gostop.map((s) => (s === id ? null : s)),
      },
    });
  }
  private drop(id: string) {
    this.removeSeat(id);
    this.members.delete(id);
    this.seen.delete(id);
    this.keys.delete(id);
    this.lastChat.delete(id);
    this.update({
      invites: this.view.invites.map((r) => {
        if (r.status !== 'waiting') return r;
        if (r.accepted.includes(id)) return { ...r, status: 'cancelled' };
        const invited = r.invited.filter((p) => p !== id),
          declined = r.declined.filter((p) => p !== id);
        return {
          ...r,
          invited,
          declined,
          status:
            1 + invited.length - declined.length < (r.game === 'chess' ? 2 : 3)
              ? 'cancelled'
              : 'waiting',
        };
      }),
    });
  }
  private tick() {
    if (this.view.role === 'host') {
      for (const [id, t] of this.seen)
        if (Date.now() - t > 45000) this.drop(id);
      for (const [id, c] of this.challenges)
        if (Date.now() - c.time > 20000) {
          this.challenges.delete(id);
          this.keys.delete(id);
        }
      this.update({
        invites: this.view.invites.map((r) =>
          r.status === 'waiting' && r.expires < Date.now()
            ? { ...r, status: 'expired' }
            : r,
        ),
      });
      this.sync();
    } else {
      if (Date.now() - this.hostSeen > 45000) {
        this.leave('방장이 라운지를 나갔어요. 내 옷장은 저장되어 있습니다.');
        return;
      }
      if (this.view.status === 'connected')
        this.send(this.hostId(), { v: 1, type: 'ping' });
      else {
        this.hello();
        if (this.pending)
          this.transport?.send(this.hostId(), {
            v: 1,
            type: 'join',
            nonce: this.nonce,
            ...this.pending,
          });
      }
    }
  }
  private async receive(from: string, value: unknown) {
    if (!value || typeof value !== 'object') return;
    let p = value as any;
    if (p.v !== 1) return;
    const generation = this.generation;
    if (p.type === 'sealed') {
      const key = this.keys.get(from);
      if (!key) return;
      p = await unseal(key, p);
      if (generation !== this.generation || p.v !== 1) return;
    } else if (!['hello', 'join', 'lobby', 'closed', 'leave'].includes(p.type))
      return;
    if (this.view.role === 'host') {
      if (p.type === 'hello' && p.lounge === 1) {
        if (this.members.has(from)) {
          this.seen.set(from, Date.now());
          this.send(from, this.packet(from));
          return;
        }
        if (!p.publicKey) return;
        const key = await channelKey(this.identity!.privateKey, p.publicKey);
        if (generation !== this.generation) return;
        this.keys.set(from, key);
        const old = this.challenges.get(from);
        this.challenges.set(from, {
          nonce: old?.nonce ?? crypto.randomUUID(),
          time: Date.now(),
        });
        if (this.challenges.size > 16) {
          const oldest = this.challenges.keys().next().value!;
          this.challenges.delete(oldest);
          this.keys.delete(oldest);
        }
        this.lobby(from);
        return;
      }
      if (p.type === 'join') {
        if (this.members.has(from)) {
          this.send(from, this.packet(from));
          return;
        }
        const c = this.challenges.get(from);
        if (
          !c ||
          c.nonce !== p.nonce ||
          Date.now() - c.time > 20000 ||
          !actorValid(p.actor) ||
          !this.keys.has(from)
        )
          return;
        if ([...this.members.values()].some((m) => m.actor === p.actor)) {
          this.lobby(
            from,
            '다른 친구가 먼저 선택했어요. 남아 있는 친구를 골라 주세요.',
          );
          return;
        }
        if (this.members.size >= 7) {
          this.lobby(from, '일곱 자리가 모두 찼어요.');
          return;
        }
        this.members.set(from, player(from, p.actor, p.look));
        this.challenges.delete(from);
        this.seen.set(from, Date.now());
        this.sync();
        return;
      }
      if (!this.members.has(from)) return;
      this.seen.set(from, Date.now());
      if (p.type === 'leave') {
        this.drop(from);
        this.sync();
      } else if (p.type === 'action') {
        if (!this.apply(from, p.action))
          this.send(from, {
            v: 1,
            type: 'notice',
            error: '상태가 바뀌었어요. 초대 정원과 차례를 확인해 주세요.',
          });
      } else if (p.type === 'ping') this.send(from, this.packet(from));
    } else {
      this.hostSeen = Date.now();
      if (p.type === 'closed') {
        this.leave('방장이 라운지를 나갔어요. 내 옷장은 저장되어 있습니다.');
        return;
      }
      if (p.type === 'notice') {
        this.update({
          error: typeof p.error === 'string' ? p.error.slice(0, 150) : '',
        });
        return;
      }
      const players = playersRead(p.players);
      if (!players) return;
      if (
        p.type === 'lobby' &&
        this.view.status !== 'connected' &&
        typeof p.nonce === 'string' &&
        p.nonce.length < 80
      ) {
        const key = await channelKey(this.identity!.privateKey, p.publicKey);
        if (generation !== this.generation) return;
        this.keys.set(from, key);
        this.nonce = p.nonce;
        if (this.deadline) clearTimeout(this.deadline);
        this.deadline = null;
        if (p.error) this.pending = null;
        this.update({
          status: 'selecting',
          players,
          error: typeof p.error === 'string' ? p.error.slice(0, 150) : '',
          claiming: p.error ? null : this.view.claiming,
        });
      } else if (p.type === 'world') {
        if (!players.some((m) => m.id === this.view.self)) {
          if (this.view.status === 'connected')
            this.leave(
              '오래 연결이 끊겨 자리가 해제됐어요. 다시 참가해 주세요.',
            );
          return;
        }
        if (
          !Array.isArray(p.seats?.chess) ||
          p.seats.chess.length !== 2 ||
          !Array.isArray(p.seats?.gostop) ||
          p.seats.gostop.length !== 3 ||
          !Array.isArray(p.chat) ||
          !Array.isArray(p.invites)
        )
          return;
        this.pending = null;
        this.transport?.retain(players.map((m) => m.id));
        this.finishConnecting();
        this.update({
          players,
          seats: p.seats,
          chess: p.chess,
          gostop: p.gostop,
          chat: p.chat.slice(-12),
          invites: p.invites,
        });
      }
    }
  }
}
