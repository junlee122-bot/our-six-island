import { IslandRoom } from './multiplayer-transport.ts';
import { PEER_PREFIX, roomCode } from './multiplayer-protocol.ts';
import { readLook, type Look } from './lounge-look.ts';
import { channelIdentity, channelKey, seal, unseal } from './lounge-crypto.ts';
import { ACTORS } from './theater-data.ts';
import {
  newSeotda,
  seotdaAction,
  seotdaDeal,
  seotdaView,
  type SeotdaMatch,
  type SeotdaView,
  type SeotdaAction,
} from './lounge-seotda.ts';
import {
  newBlackjack,
  blackjackAction,
  blackjackDeal,
  blackjackView,
  type BlackjackMatch,
  type BlackjackView,
  type BlackjackAction,
} from './lounge-blackjack.ts';
import {
  newPoker,
  pokerAction,
  pokerDeal,
  pokerView,
  pokerLegalActions,
  type PokerMatch,
  type PokerView,
  type PokerAction,
} from './lounge-poker.ts';
import {
  registerWallet,
  reserveGame,
  settleGame,
  voidGame,
  chessBeomResult,
  goBeomResult,
  type LoungeLedger,
} from './lounge-economy.ts';
import {
  LoungeBank,
  loadWalletIdentity,
  proveWallet,
  verifyWallet,
  acquireHouseLock,
  type WalletIdentity,
} from './lounge-wallet.ts';
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
export type GameKind = 'chess' | 'gostop' | 'poker' | 'blackjack' | 'seotda';
export const GAME_INFO = {
  chess: { name: '체스', symbol: '♞', players: 2, stake: 1000 },
  gostop: { name: '고스톱', symbol: '花', players: 3, stake: 10000 },
  poker: { name: '텍사스 홀덤', symbol: '♠', players: 3, stake: 10000 },
  blackjack: { name: '블랙잭', symbol: '21', players: 3, stake: 1000 },
  seotda: { name: '섯다', symbol: '섯', players: 3, stake: 10000 },
} as const;
export const GAME_KINDS: GameKind[] = [
  'chess',
  'gostop',
  'seotda',
  'poker',
  'blackjack',
];
export const gameReservation = (game: GameKind, stake: number) =>
  game === 'blackjack' ? stake * 4 : stake;
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
  required: number;
  stake: number;
};
export type LoungePlayer = {
  id: string;
  actor: number;
  look: Look;
  x: number;
  y: number;
  emote: string;
  emoteAt: number;
  balance: number;
  area: 'lounge' | 'casino';
};
export type LoungeWorld = {
  players: LoungePlayer[];
  seats: {
    chess: (string | null)[];
    gostop: (string | null)[];
    poker: (string | null)[];
    blackjack: (string | null)[];
    seotda: (string | null)[];
  };
  chess: ChessMatch | null;
  gostop: GoView | null;
  poker: PokerView | null;
  blackjack: BlackjackView | null;
  seotda: SeotdaView | null;
  names: Record<GameKind, string[]>;
  wallet: ReturnType<LoungeBank['view']>;
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
  seats: {
    chess: [null, null],
    gostop: [null, null, null],
    poker: [null, null, null],
    blackjack: [null, null, null],
    seotda: [null, null, null],
  },
  chess: null,
  gostop: null,
  poker: null,
  blackjack: null,
  seotda: null,
  names: { chess: [], gostop: [], poker: [], blackjack: [], seotda: [] },
  wallet: { balance: 0, held: 0, history: [] },
  chat: [],
  invites: [],
});
export { empty as emptyLoungeView };
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
  balance: 0,
  area: 'lounge',
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
      balance:
        Number.isSafeInteger(p.balance) && p.balance >= 0 ? p.balance : 0,
      area: p.area === 'casino' ? 'casino' : 'lounge',
    });
  }
  return out;
}
export type LoungeAction =
  | {
      kind: 'invite';
      game: GameKind;
      players: string[];
      stake?: number;
      required?: number;
    }
  | { kind: 'area'; area: 'lounge' | 'casino' }
  | { kind: 'poker'; id: string; revision: number; action: PokerAction }
  | { kind: 'blackjack'; id: string; revision: number; action: BlackjackAction }
  | { kind: 'seotda'; id: string; revision: number; action: SeotdaAction }
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
// Private server snapshot, never returned to a browser. Public packets still
// remove every other player's hand and the undealt deck.
export type HostedRoomSnapshot = {
  code: string;
  host: string;
  players: LoungePlayer[];
  seats: LoungeWorld['seats'];
  names: LoungeWorld['names'];
  invites: GameInvite[];
  chat: LoungeWorld['chat'];
  chess: ChessMatch | null;
  go: GoMatch | null;
  poker: PokerMatch | null;
  blackjack: BlackjackMatch | null;
  seotda: SeotdaMatch | null;
  pokerAway: number[];
  blackjackAway: number[];
  seotdaAway: number[];
  lastChat: [string, number][];
  due: Partial<
    Record<
      'poker' | 'blackjack' | 'seotda',
      { id: string; revision: number; at: number }
    >
  >;
};
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
  private poker: PokerMatch | null = null;
  private blackjack: BlackjackMatch | null = null;
  private seotda: SeotdaMatch | null = null;
  private seotdaAway = new Set<number>();
  private seotdaTimer: ReturnType<typeof setTimeout> | null = null;
  private blackjackAway = new Set<number>();
  private blackjackTimer: ReturnType<typeof setTimeout> | null = null;
  private bank = new LoungeBank(null);
  private wallets = new Map<string, string>();
  private walletIdentity: WalletIdentity | null = null;
  private houseRelease: (() => void) | null = null;
  private pokerAway = new Set<number>();
  private dealerTimer: ReturnType<typeof setTimeout> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private deadline: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private nonce = '';
  private hostSeen = 0;
  private incoming = Promise.resolve();
  private outgoing = Promise.resolve();
  private pending: { actor: number; look: Look } | null = null;
  private serverMode = false;
  private serverDue: HostedRoomSnapshot['due'] = {};
  static hosted(
    snapshot: HostedRoomSnapshot | null,
    ledger: LoungeLedger,
    code = '',
    host = '',
  ) {
    const r = new LoungeRoom();
    r.serverMode = true;
    r.bank = new LoungeBank(null);
    r.bank.commit(ledger);
    r.view = {
      ...empty(),
      status: 'connected',
      role: 'host',
      code: snapshot?.code ?? code,
      self: snapshot?.host ?? host,
    };
    if (snapshot) {
      r.view = {
        ...r.view,
        seats: structuredClone(snapshot.seats),
        names: structuredClone(snapshot.names),
        invites: structuredClone(snapshot.invites),
        chat: structuredClone(snapshot.chat),
      };
      r.members = new Map(
        snapshot.players.map((p) => [p.id, structuredClone(p)]),
      );
      r.chess = structuredClone(snapshot.chess);
      r.go = structuredClone(snapshot.go);
      r.poker = structuredClone(snapshot.poker);
      r.blackjack = structuredClone(snapshot.blackjack);
      r.seotda = structuredClone(snapshot.seotda);
      r.pokerAway = new Set(snapshot.pokerAway);
      r.blackjackAway = new Set(snapshot.blackjackAway);
      r.seotdaAway = new Set(snapshot.seotdaAway);
      r.lastChat = new Map(snapshot.lastChat);
      r.serverDue = structuredClone(snapshot.due);
    }
    for (const id of r.members.keys()) r.wallets.set(id, 'wallet-' + id);
    r.sync();
    return r;
  }
  hostedSnapshot(): HostedRoomSnapshot {
    if (!this.serverMode) throw new Error('Server adapter required');
    return structuredClone({
      code: this.view.code,
      host: this.view.self,
      players: [...this.members.values()],
      seats: this.view.seats,
      names: this.view.names,
      invites: this.view.invites,
      chat: this.view.chat,
      chess: this.chess,
      go: this.go,
      poker: this.poker,
      blackjack: this.blackjack,
      seotda: this.seotda,
      pokerAway: [...this.pokerAway],
      blackjackAway: [...this.blackjackAway],
      seotdaAway: [...this.seotdaAway],
      lastChat: [...this.lastChat],
      due: this.serverDue,
    });
  }
  hostedLedger() {
    return this.bank.ledger;
  }
  hostedJoin(id: string, actor: number, look: Look) {
    if (!this.serverMode || !actorValid(actor))
      throw new Error('계정 정보를 확인해 주세요.');
    const existing = this.members.get(id);
    if (existing) {
      if (existing.actor !== actor)
        throw new Error('계정 캐릭터가 일치하지 않습니다.');
      return;
    }
    if (
      this.members.size >= 7 ||
      [...this.members.values()].some((p) => p.actor === actor)
    )
      throw new Error('이미 접속한 계정이거나 방이 가득 찼습니다.');
    const wallet = 'wallet-' + id;
    this.bank.commit(registerWallet(this.bank.ledger, wallet));
    this.wallets.set(id, wallet);
    this.members.set(id, player(id, actor, look));
    this.sync();
  }
  hostedAction(id: string, a: LoungeAction) {
    if (!this.serverMode) throw new Error('Server adapter required');
    return this.apply(id, a);
  }
  hostedDrop(id: string) {
    if (!this.serverMode) throw new Error('Server adapter required');
    this.drop(id);
    if (this.view.self === id)
      this.view = {
        ...this.view,
        self: this.members.keys().next().value ?? '',
      };
    this.sync();
  }
  hostedClose() {
    if (!this.serverMode) throw new Error('Server adapter required');
    for (const game of [
      this.chess,
      this.go,
      this.poker,
      this.blackjack,
      this.seotda,
    ])
      if (game && this.bank.ledger.games[game.id]?.state === 'reserved')
        this.bank.commit(voidGame(this.bank.ledger, game.id));
  }
  hostedPacket(id: string) {
    if (!this.serverMode || !this.members.has(id))
      throw new Error('이 라운지에 먼저 입장해 주세요.');
    return this.packet(id);
  }
  hostedTick(now: number) {
    if (!this.serverMode) throw new Error('Server adapter required');
    this.view = {
      ...this.view,
      invites: this.view.invites.map((r) =>
        r.status === 'waiting' && r.expires < now
          ? { ...r, status: 'expired' }
          : r,
      ),
    };
    for (const kind of ['poker', 'blackjack', 'seotda'] as const) {
      const spec = () => {
        const g = this[kind];
        if (!g || g.phase === 'over') return null;
        const automatic =
          kind === 'poker'
            ? ['dealing', 'showdown'].includes(g.phase)
            : kind === 'blackjack'
              ? g.phase !== 'players'
              : g.phase !== 'betting';
        const away =
          kind === 'poker'
            ? this.pokerAway
            : kind === 'blackjack'
              ? this.blackjackAway
              : this.seotdaAway;
        return automatic || away.has(g.turn)
          ? {
              id: g.id,
              revision: g.revision,
              delay: automatic
                ? kind === 'seotda'
                  ? g.phase === 'redeal'
                    ? 2200
                    : 1500
                  : 1100
                : 600,
              automatic,
            }
          : null;
      };
      const s = spec();
      if (!s) {
        delete this.serverDue[kind];
        continue;
      }
      const due = this.serverDue[kind];
      if (!due || due.id !== s.id || due.revision !== s.revision) {
        this.serverDue[kind] = {
          id: s.id,
          revision: s.revision,
          at: now + s.delay,
        };
        continue;
      }
      if (due.at > now) continue;
      if (kind === 'poker') {
        const g = this.poker!,
          next = s.automatic
            ? pokerDeal(g)
            : pokerAction(g, g.turn, {
                kind: pokerLegalActions(g, g.turn).canCheck ? 'check' : 'fold',
              });
        if (next) {
          this.settle(kind, next);
          this.poker = next;
        }
      } else if (kind === 'blackjack') {
        const g = this.blackjack!,
          next = s.automatic
            ? blackjackDeal(g)
            : blackjackAction(g, g.turn, { kind: 'stand' });
        if (next) {
          this.settle(kind, next);
          this.blackjack = next;
        }
      } else {
        const g = this.seotda!,
          next = s.automatic
            ? seotdaDeal(g)
            : seotdaAction(g, g.turn, { kind: 'fold' });
        if (next) {
          this.settle(kind, next);
          this.seotda = next;
        }
      }
      const after = spec();
      if (after)
        this.serverDue[kind] = {
          id: after.id,
          revision: after.revision,
          at: now + after.delay,
        };
      else delete this.serverDue[kind];
    }
    this.sync();
  }
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
      poker: this.poker
        ? pokerView(this.poker, this.view.seats.poker.indexOf(id))
        : null,
      blackjack: this.blackjack
        ? blackjackView(this.blackjack, this.view.seats.blackjack.indexOf(id))
        : null,
      names: this.view.names,
      seotda: this.seotda
        ? seotdaView(this.seotda, this.view.seats.seotda.indexOf(id))
        : null,
      wallet: this.bank.view(this.wallets.get(id)),
    };
  }
  private sync() {
    for (const [id, p] of this.members)
      this.members.set(id, {
        ...p,
        balance: this.bank.view(this.wallets.get(id)).balance,
      });
    const players = [...this.members.values()];
    this.transport?.retain(players.map((p) => p.id));
    this.update({
      players,
      chess: this.chess,
      gostop: this.go
        ? goView(this.go, this.view.seats.gostop.indexOf(this.view.self))
        : null,
      poker: this.poker
        ? pokerView(this.poker, this.view.seats.poker.indexOf(this.view.self))
        : null,
      blackjack: this.blackjack
        ? blackjackView(
            this.blackjack,
            this.view.seats.blackjack.indexOf(this.view.self),
          )
        : null,
      wallet: this.bank.view(this.wallets.get(this.view.self)),
      seotda: this.seotda
        ? seotdaView(
            this.seotda,
            this.view.seats.seotda.indexOf(this.view.self),
          )
        : null,
    });
    if (this.serverMode) return;
    for (const p of players)
      if (p.id !== this.view.self) this.send(p.id, this.packet(p.id));
    for (const id of this.challenges.keys()) this.lobby(id);
    this.scheduleDealer();
    this.scheduleBlackjack();
    this.scheduleSeotda();
  }
  private scheduleSeotda() {
    const g = this.seotda;
    if (this.seotdaTimer || !g || g.phase === 'over') return;
    const automatic = g.phase !== 'betting';
    if (!automatic && !this.seotdaAway.has(g.turn)) return;
    const { id, revision } = g,
      generation = this.generation;
    this.seotdaTimer = setTimeout(
      () => {
        this.seotdaTimer = null;
        if (generation !== this.generation) return;
        const current = this.seotda;
        if (!current || current.id !== id || current.revision !== revision) {
          this.scheduleSeotda();
          return;
        }
        try {
          const next = automatic
            ? seotdaDeal(current)
            : seotdaAction(current, current.turn, { kind: 'fold' });
          if (next) {
            this.settle('seotda', next);
            this.seotda = next;
            this.sync();
          }
        } catch (error) {
          this.update({
            error:
              error instanceof Error
                ? error.message
                : '범 정산을 저장하지 못했습니다.',
          });
        }
      },
      automatic ? (g.phase === 'redeal' ? 2200 : 1500) : 600,
    );
    (this.seotdaTimer as unknown as { unref?: () => void }).unref?.();
  }
  private scheduleBlackjack() {
    const g = this.blackjack;
    if (this.blackjackTimer || !g || g.phase === 'over') return;
    const automatic = g.phase !== 'players';
    if (!automatic && !this.blackjackAway.has(g.turn)) return;
    const { id, revision } = g,
      generation = this.generation;
    this.blackjackTimer = setTimeout(
      () => {
        this.blackjackTimer = null;
        if (generation !== this.generation) return;
        const current = this.blackjack;
        if (!current || current.id !== id || current.revision !== revision) {
          this.scheduleBlackjack();
          return;
        }
        try {
          const next = automatic
            ? blackjackDeal(current)
            : blackjackAction(current, current.turn, { kind: 'stand' });
          if (next) {
            this.settle('blackjack', next);
            this.blackjack = next;
            this.sync();
          }
        } catch (error) {
          this.update({
            error:
              error instanceof Error
                ? error.message
                : '범 정산을 저장하지 못했습니다.',
          });
        }
      },
      automatic ? 1100 : 600,
    );
    (this.blackjackTimer as any).unref?.();
  }
  private scheduleDealer() {
    if (this.dealerTimer || !this.poker || this.poker.phase === 'over') return;
    const g = this.poker,
      id = g.id,
      revision = g.revision;
    const automatic = ['dealing', 'showdown'].includes(g.phase);
    if (!automatic && !this.pokerAway.has(g.turn)) return;
    this.dealerTimer = setTimeout(
      () => {
        this.dealerTimer = null;
        if (
          !this.poker ||
          this.poker.id !== id ||
          this.poker.revision !== revision
        ) {
          this.scheduleDealer();
          return;
        }
        try {
          const next = automatic
            ? pokerDeal(this.poker)
            : pokerAction(this.poker, this.poker.turn, {
                kind: pokerLegalActions(this.poker, this.poker.turn).canCheck
                  ? 'check'
                  : 'fold',
              });
          if (next) {
            this.settle('poker', next);
            this.poker = next;
            this.sync();
          }
        } catch (error) {
          this.update({
            error:
              error instanceof Error
                ? error.message
                : '범 정산을 저장하지 못했습니다.',
          });
        }
      },
      automatic ? 1100 : 600,
    );
    (this.dealerTimer as any).unref?.();
  }
  private settle(
    kind: GameKind,
    game: ChessMatch | GoMatch | PokerMatch | BlackjackMatch | SeotdaMatch,
  ) {
    const escrow = this.bank.ledger.games[game.id];
    if (!escrow || escrow.state !== 'reserved') return;
    if (kind === 'chess') {
      const c = game as ChessMatch;
      if (c.winner)
        this.bank.commit(
          settleGame(
            this.bank.ledger,
            c.id,
            chessBeomResult(c.winner, escrow.deposits[0]),
          ),
        );
    } else if (kind === 'gostop') {
      const g = game as GoMatch;
      if (g.phase === 'over')
        this.bank.commit(
          g.winner === null
            ? voidGame(this.bank.ledger, g.id)
            : settleGame(
                this.bank.ledger,
                g.id,
                goBeomResult(g.result, 100, escrow.deposits),
              ),
        );
    } else {
      const g = game as PokerMatch | BlackjackMatch | SeotdaMatch;
      if (g.phase === 'over')
        this.bank.commit(settleGame(this.bank.ledger, g.id, g.result));
    }
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
    if (this.view.role === 'host' && this.houseRelease) {
      try {
        this.bank.recover();
      } catch {}
    }
    this.houseRelease?.();
    this.houseRelease = null;
    if (this.dealerTimer) clearTimeout(this.dealerTimer);
    this.dealerTimer = null;
    if (this.blackjackTimer) clearTimeout(this.blackjackTimer);
    this.blackjackTimer = null;
    this.blackjack = null;
    this.blackjackAway.clear();
    if (this.seotdaTimer) clearTimeout(this.seotdaTimer);
    this.seotdaTimer = null;
    this.seotda = null;
    this.seotdaAway.clear();
    this.poker = null;
    this.pokerAway.clear();
    this.wallets.clear();
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
      const [room, identity, wallet] = await Promise.all([
        IslandRoom.create(role === 'host', code, 'hohyeon-lounge-v4:', 131072),
        channelIdentity(),
        this.walletIdentity ?? loadWalletIdentity(),
      ]);
      if (generation !== this.generation) {
        room.close();
        return;
      }
      this.identity = identity;
      this.walletIdentity = wallet;
      this.transport = room;
      if (role === 'host') {
        const release = await acquireHouseLock();
        if (generation !== this.generation) {
          release();
          return;
        }
        this.houseRelease = release;
        this.bank = new LoungeBank();
        this.bank.recover();
      }
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
        this.bank.commit(registerWallet(this.bank.ledger, wallet.id));
        this.wallets.set(room.id, wallet.id);
        this.members.set(room.id, player(room.id, actor, look));
        this.finishConnecting();
        this.sync();
      } else this.hello();
      this.timer = setInterval(() => this.tick(), 4000);
    } catch (error) {
      if (generation === this.generation)
        this.leave(
          error instanceof Error
            ? error.message
            : '라운지에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
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
    void this.sendClaim();
    return true;
  }
  private async sendClaim() {
    if (!this.pending || !this.walletIdentity) return;
    const generation = this.generation,
      nonce = this.nonce,
      pending = this.pending;
    try {
      const wallet = await proveWallet(
        this.walletIdentity,
        this.view.code,
        this.view.self,
        nonce,
      );
      if (
        generation === this.generation &&
        pending === this.pending &&
        nonce === this.nonce
      )
        this.send(this.hostId(), {
          v: 1,
          type: 'join',
          nonce,
          ...pending,
          wallet,
        });
    } catch {
      this.pending = null;
      this.update({
        claiming: null,
        error: '지갑 소유 확인을 완료하지 못했습니다.',
      });
    }
  }
  action(action: LoungeAction) {
    if (this.view.status !== 'connected') return false;
    if (this.view.role === 'host') {
      let ok = false;
      try {
        ok = this.apply(this.view.self, action);
      } catch (error) {
        this.update({
          error:
            error instanceof Error
              ? error.message
              : '범 지갑을 저장하지 못했습니다.',
        });
        return false;
      }
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
      : game === 'gostop'
        ? !!this.go && this.go.phase !== 'over'
        : game === 'poker'
          ? !!this.poker && this.poker.phase !== 'over'
          : game === 'seotda'
            ? !!this.seotda && this.seotda.phase !== 'over'
            : !!this.blackjack && this.blackjack.phase !== 'over';
  }
  private busy(id: string, except = '') {
    return (
      GAME_KINDS.some(
        (game) => this.gameActive(game) && this.view.seats[game].includes(id),
      ) ||
      this.view.invites.some(
        (r) =>
          r.id !== except && r.status === 'waiting' && r.accepted.includes(id),
      )
    );
  }
  private launch(request: GameInvite) {
    const id = crypto.randomUUID(),
      wallets = request.accepted.map((p) => this.wallets.get(p)!);
    const deposits = request.accepted.map(() =>
      gameReservation(request.game, request.stake),
    );
    const game =
      request.game === 'chess'
        ? newChess(id)
        : request.game === 'gostop'
          ? newGo(id, shuffleCards())
          : request.game === 'poker'
            ? newPoker(id, deposits)
            : request.game === 'seotda'
              ? newSeotda(id, wallets.length, request.stake)
              : newBlackjack(id, wallets.length, request.stake);
    let ledger = reserveGame(
      this.bank.ledger,
      id,
      request.game,
      wallets,
      deposits,
    );
    if (request.game === 'gostop' && (game as GoMatch).phase === 'over') {
      const g = game as GoMatch;
      ledger =
        g.winner === null
          ? voidGame(ledger, id)
          : settleGame(ledger, id, goBeomResult(g.result, 100, deposits));
    }
    this.bank.commit(ledger);
    for (const id of request.accepted) this.removeSeat(id);
    const seats = { ...this.view.seats, [request.game]: [...request.accepted] };
    request.status = 'started';
    request.matchId = id;
    this.update({
      seats,
      names: {
        ...this.view.names,
        [request.game]: request.accepted.map(
          (p) => ACTORS[this.members.get(p)!.actor],
        ),
      },
    });
    if (request.game === 'chess') this.chess = game as ChessMatch;
    else if (request.game === 'gostop') this.go = game as GoMatch;
    else if (request.game === 'poker') {
      this.poker = game as PokerMatch;
      this.pokerAway.clear();
    } else if (request.game === 'seotda') {
      this.seotda = game as SeotdaMatch;
      this.seotdaAway.clear();
    } else {
      this.blackjack = game as BlackjackMatch;
      this.blackjackAway.clear();
    }
    for (let i = 0; i < request.accepted.length; i++) {
      const p = this.members.get(request.accepted[i])!;
      this.members.set(p.id, {
        ...p,
        area:
          request.game === 'gostop' || request.game === 'seotda'
            ? 'lounge'
            : 'casino',
        x:
          (request.game === 'seotda'
            ? 31
            : request.game === 'gostop'
              ? 68
              : request.game === 'chess'
                ? 24
                : request.game === 'blackjack'
                  ? 77
                  : 50) + (i === 0 ? -8 : i === 1 ? 8 : 0),
        y: i === 2 ? 78 : 64,
      });
    }
  }
  private apply(id: string, a: LoungeAction) {
    const member = this.members.get(id);
    if (!member || !a || typeof a !== 'object') return false;
    if (a.kind === 'area') {
      if (!['lounge', 'casino'].includes(a.area) || this.busy(id)) return false;
      this.members.set(id, { ...member, area: a.area, x: 50, y: 79 });
    } else if (a.kind === 'poker') {
      const g = this.poker,
        seat = this.view.seats.poker.indexOf(id);
      if (
        !g ||
        seat < 0 ||
        g.id !== a.id ||
        g.revision !== a.revision ||
        this.pokerAway.has(seat)
      )
        return false;
      const next = pokerAction(g, seat, a.action);
      if (!next) return false;
      this.settle('poker', next);
      this.poker = next;
    } else if (a.kind === 'blackjack') {
      const g = this.blackjack,
        seat = this.view.seats.blackjack.indexOf(id);
      if (
        !g ||
        seat < 0 ||
        g.id !== a.id ||
        g.revision !== a.revision ||
        this.blackjackAway.has(seat)
      )
        return false;
      const next = blackjackAction(g, seat, a.action);
      if (!next) return false;
      this.settle('blackjack', next);
      this.blackjack = next;
    } else if (a.kind === 'seotda') {
      const g = this.seotda,
        seat = this.view.seats.seotda.indexOf(id);
      if (
        !g ||
        seat < 0 ||
        g.id !== a.id ||
        g.revision !== a.revision ||
        this.seotdaAway.has(seat)
      )
        return false;
      const next = seotdaAction(g, seat, a.action);
      if (!next) return false;
      this.settle('seotda', next);
      this.seotda = next;
    } else if (a.kind === 'move') {
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
        !GAME_KINDS.includes(a.game) ||
        !Array.isArray(a.players) ||
        a.players.length > 6 ||
        this.busy(id) ||
        this.gameActive(a.game) ||
        this.view.invites.some(
          (r) => r.game === a.game && r.status === 'waiting',
        )
      )
        return false;
      const stake = a.stake ?? GAME_INFO[a.game].stake;
      const required =
        a.game === 'poker' || a.game === 'blackjack' || a.game === 'seotda'
          ? (a.required ?? 3)
          : GAME_INFO[a.game].players;
      if (
        ![1000, 5000, 10000, 20000].includes(stake) ||
        !Number.isInteger(required) ||
        required < 2 ||
        required > 7 ||
        this.bank.view(this.wallets.get(id)).balance <
          gameReservation(a.game, stake)
      )
        return false;
      const invited = [...new Set(a.players)].filter(
        (p) => p !== id && this.members.has(p) && !this.busy(p),
      );
      if (invited.length < required - 1) return false;
      this.update({
        invites: [
          ...this.view.invites.filter((r) => r.status === 'waiting'),
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
            required,
            stake,
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
        if (
          this.busy(id, request.id) ||
          this.gameActive(request.game) ||
          this.bank.view(this.wallets.get(id)).balance <
            gameReservation(request.game, request.stake)
        )
          return false;
        request.accepted.push(id);
        if (request.accepted.length === request.required) this.launch(request);
      } else {
        request.declined.push(id);
        if (
          1 + request.invited.length - request.declined.length <
          request.required
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
      if (!GAME_KINDS.includes(a.game) || !this.view.seats[a.game].includes(id))
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
      this.settle('chess', next);
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
      const next = chessResign(this.chess, seat)!;
      this.settle('chess', next);
      this.chess = next;
    } else if (a.kind === 'gostop') {
      const g = this.go,
        seat = this.view.seats.gostop.indexOf(id);
      if (!g || seat < 0 || a.id !== g.id || a.ply !== g.ply) return false;
      const next = goAction(g, seat, a.action);
      if (!next) return false;
      this.settle('gostop', next);
      this.go = next;
    } else return false;
    this.sync();
    return true;
  }
  private removeSeat(id: string) {
    const c = this.view.seats.chess.indexOf(id),
      g = this.view.seats.gostop.indexOf(id);
    if (c >= 0 && this.chess && !this.chess.winner) {
      const next = chessResign(this.chess, c)!;
      this.settle('chess', next);
      this.chess = next;
    }
    if (g >= 0 && this.go && this.go.phase !== 'over') {
      const next: GoMatch = {
        ...this.go,
        phase: 'over',
        winner: null,
        reason: '친구가 자리를 떠나 이번 판을 마쳤어요.',
        revision: this.go.revision + 1,
        motion: { seq: this.go.revision + 1, actor: g, steps: [] },
        result: [0, 0, 0],
      };
      this.settle('gostop', next);
      this.go = next;
    }
    const p = this.view.seats.poker.indexOf(id);
    if (p >= 0 && this.poker && this.poker.phase !== 'over')
      this.pokerAway.add(p);
    const b = this.view.seats.blackjack.indexOf(id);
    if (b >= 0 && this.blackjack && this.blackjack.phase !== 'over')
      this.blackjackAway.add(b);
    const s = this.view.seats.seotda.indexOf(id);
    if (s >= 0 && this.seotda && this.seotda.phase !== 'over')
      this.seotdaAway.add(s);
    this.update({
      seats: {
        chess: this.view.seats.chess.map((s) => (s === id ? null : s)),
        seotda:
          this.seotda?.phase === 'over'
            ? this.view.seats.seotda.map((s) => (s === id ? null : s))
            : this.view.seats.seotda,
        gostop: this.view.seats.gostop.map((s) => (s === id ? null : s)),
        poker:
          this.poker?.phase === 'over'
            ? this.view.seats.poker.map((s) => (s === id ? null : s))
            : this.view.seats.poker,
        blackjack:
          this.blackjack?.phase === 'over'
            ? this.view.seats.blackjack.map((s) => (s === id ? null : s))
            : this.view.seats.blackjack,
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
            1 + invited.length - declined.length < r.required
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
        if (this.pending) void this.sendClaim();
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
        const wallet = await verifyWallet(
          p.wallet,
          this.view.code,
          from,
          c.nonce,
        );
        if (generation !== this.generation || this.challenges.get(from) !== c)
          return;
        if (
          !wallet ||
          [...this.wallets.entries()].some(
            ([peer, w]) => w === wallet && this.members.has(peer),
          )
        ) {
          this.lobby(
            from,
            '이미 접속한 지갑이거나 지갑 소유 확인에 실패했어요.',
          );
          return;
        }
        try {
          this.bank.commit(registerWallet(this.bank.ledger, wallet));
        } catch (error) {
          this.lobby(
            from,
            error instanceof Error
              ? error.message
              : '범 지갑을 저장하지 못했습니다.',
          );
          return;
        }
        this.wallets.set(from, wallet);
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
        let ok = false,
          error = '상태가 바뀌었어요. 초대 정원, 잔액과 차례를 확인해 주세요.';
        try {
          ok = this.apply(from, p.action);
        } catch (e) {
          if (e instanceof Error) error = e.message;
        }
        if (!ok)
          this.send(from, {
            v: 1,
            type: 'notice',
            error,
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
          !Array.isArray(p.seats?.poker) ||
          p.seats.poker.length < 2 ||
          p.seats.poker.length > 7 ||
          !Array.isArray(p.seats?.blackjack) ||
          p.seats.blackjack.length < 2 ||
          p.seats.blackjack.length > 7 ||
          !Array.isArray(p.seats?.seotda) ||
          p.seats.seotda.length < 2 ||
          p.seats.seotda.length > 7 ||
          !p.wallet ||
          !Number.isSafeInteger(p.wallet.balance) ||
          p.wallet.balance < 0 ||
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
          poker: p.poker,
          blackjack: p.blackjack,
          seotda: p.seotda,
          names: p.names,
          wallet: p.wallet,
        });
      }
    }
  }
}
