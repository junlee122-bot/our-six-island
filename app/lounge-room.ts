import { IslandRoom } from "./multiplayer-transport.ts";
import { PEER_PREFIX, roomCode } from "./multiplayer-protocol.ts";
import { readLook, type Look } from "./lounge-look.ts";
import { channelIdentity, channelKey, seal, unseal } from "./lounge-crypto.ts";
import { ACTORS } from "./theater-data.ts";
import {
  reactionId,
  readReaction,
  REACTION_COOLDOWN,
  type Reaction,
  type ReactionId,
  type ReactionScope,
} from "./lounge-reactions.ts";
import {
  newSeotda,
  seotdaAction,
  seotdaDeal,
  seotdaLegal,
  seotdaView,
  type SeotdaMatch,
  type SeotdaView,
  type SeotdaAction,
} from "./lounge-seotda.ts";
import {
  newBlackjack,
  blackjackAction,
  blackjackDeal,
  blackjackView,
  blackjackStepDelay,
  type BlackjackMatch,
  type BlackjackView,
  type BlackjackAction,
} from "./lounge-blackjack.ts";
import {
  newPoker,
  pokerBigBlind,
  pokerAction,
  pokerDeal,
  pokerView,
  pokerLegalActions,
  pokerStepDelay,
  type PokerMatch,
  type PokerView,
  type PokerAction,
} from "./lounge-poker.ts";
import {
  registerWallet,
  reserveGame,
  settleGame,
  voidGame,
  chessBeomResult,
  goBeomResult,
  claimDailyGrant,
  dailyGrantInfo,
  type LoungeLedger,
} from "./lounge-economy.ts";
import {
  LoungeBank,
  loadWalletIdentity,
  proveWallet,
  verifyWallet,
  acquireHouseLock,
  type WalletIdentity,
} from "./lounge-wallet.ts";
import {
  newChess,
  chessBoard,
  chessMove,
  chessResign,
  chessOfferDraw,
  chessAnswerDraw,
  chessTimeout,
  type ChessMatch,
} from "./lounge-chess.ts";
import {
  newGo,
  normalizeGo,
  shuffleCards,
  goAction,
  goView,
  goPracticeAction,
  GO_POINT_BEOM,
  type GoMatch,
  type GoView,
  type GoAction,
} from "./lounge-gostop.ts";
import type { LifeAction } from "./lounge-life.ts";
import {
  GAME_INFO,
  GAME_KINDS,
  gameReservation,
  TURN_LIMIT_MS,
  READY_LIMIT_MS,
  LOOK_THROTTLE_MS,
  AREAS,
  AREA_DEFAULTS,
  chatScope,
  validHomeOwner,
  FLEX_GAMES,
  TABLE_AREA,
  TABLE_FORM_MS,
  TABLE_STAKES,
  stakeLock,
  tableIdOf,
  emptyLoungeView as empty,
  type GameKind,
  type Area,
  type ChatScope,
} from "./lounge-games.ts";
export {
  GAME_INFO,
  GAME_KINDS,
  gameReservation,
  TURN_LIMIT_MS,
  READY_LIMIT_MS,
  LOOK_THROTTLE_MS,
  AREAS,
  AREA_DEFAULTS,
  chatScope,
};
export type { GameKind, Area, ChatScope };
export type ChatLine = {
  id: string;
  actor: number;
  text: string;
  scope?: ChatScope;
};
/** Server-clock deadline for the seat to act, and seats played automatically. */
export type TurnTiming = { turnDeadline?: number; away?: number[] };
export type GameInvite = {
  id: string;
  game: GameKind;
  from: string;
  invited: string[];
  accepted: string[];
  declined: string[];
  status: "waiting" | "started" | "cancelled" | "expired";
  expires: number;
  matchId: string | null;
  required: number;
  stake: number;
  /**
   * Set on a "빈자리에 친구 초대" invite: the matchId of the retained table
   * whose empty seats it fills. `required` is then missing seats + 1 (inviter).
   * Each friend who accepts joins that table (ready) for its next round.
   */
  fill?: string;
  /**
   * Set on a table-forming invite: the interior table id (`tableIdOf(game)`,
   * e.g. 'lounge-seotda') the host sits at. `invited` are the friends called
   * over; anyone standing in that interior may also sit (reply accept) without
   * being called. Standing up (cancel / decline) only leaves the seat: the
   * table stays open while anyone is seated, and the host seat passes on.
   */
  table?: string;
};
export type LoungeTable = {
  matchId: string;
  round: number;
  stake: number;
  required: number;
  members: string[];
  ready: string[];
  /** Server-clock end of the ready check after a round (absent while playing). */
  readyDeadline?: number;
};
export type LoungeTables = Partial<Record<GameKind, LoungeTable>>;
export type LoungePlayer = {
  id: string;
  actor: number;
  look: Look;
  x: number;
  y: number;
  emote: string;
  emoteAt: number;
  reaction?: Reaction;
  balance: number;
  area: Area;
  /** Whose room I am in (owner actor) while `area` is 'home'. */
  home?: number;
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
  chess: (ChessMatch & TurnTiming) | null;
  gostop: (GoView & TurnTiming) | null;
  poker: (PokerView & TurnTiming) | null;
  blackjack: (BlackjackView & TurnTiming) | null;
  seotda: (SeotdaView & TurnTiming) | null;
  names: Record<GameKind, string[]>;
  wallet: ReturnType<LoungeBank["view"]>;
  chat: ChatLine[];
  invites: GameInvite[];
  tables: LoungeTables;
  /** Member id of the room opener (moves to the next member if they leave). */
  host?: string;
};
export type LoungeView = LoungeWorld & {
  status: "offline" | "connecting" | "selecting" | "connected" | "error";
  role: "host" | "guest" | null;
  code: string;
  self: string;
  error: string;
  claiming: number | null;
};
export { empty as emptyLoungeView };
const actorValid = (v: unknown): v is number =>
  Number.isInteger(v) && Number(v) >= 0 && Number(v) < 7;
const player = (id: string, actor: number, look: Look): LoungePlayer => ({
  id,
  actor,
  look: readLook(look, actor),
  x: 42 + actor * 3,
  y: 74,
  emote: "",
  emoteAt: 0,
  balance: 0,
  area: "lounge",
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
      typeof p.id !== "string" ||
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
      emote: typeof p.emote === "string" ? p.emote.slice(0, 16) : "",
      emoteAt: Number(p.emoteAt) || 0,
      reaction: readReaction(p.reaction),
      balance:
        Number.isSafeInteger(p.balance) && p.balance >= 0 ? p.balance : 0,
      area: AREAS.includes(p.area) ? p.area : "lounge",
      ...(p.area === "home" && validHomeOwner(p.home) ? { home: p.home } : {}),
    });
  }
  return out;
}
export type LoungeAction =
  | LifeAction
  | {
      kind: "invite";
      game: GameKind;
      players: string[];
      stake?: number;
      required?: number;
      /** Interior table id: sit down at that table (host) or call friends to it. */
      table?: string;
    }
  | { kind: "area"; area: Area; x?: number; y?: number; home?: number }
  | { kind: "draw"; id: string; op: "offer" | "accept" | "decline" }
  | { kind: "daily" }
  | { kind: "poker"; id: string; revision: number; action: PokerAction }
  | { kind: "blackjack"; id: string; revision: number; action: BlackjackAction }
  | { kind: "seotda"; id: string; revision: number; action: SeotdaAction }
  | { kind: "reply"; id: string; accept: boolean }
  | { kind: "cancel"; id: string }
  | { kind: "stand"; game: GameKind; id?: string }
  | { kind: "ready"; game: GameKind; id: string; ready: boolean }
  | {
      kind: "chess";
      id: string;
      ply: number;
      from: string;
      to: string;
      promotion?: string;
    }
  | { kind: "resign"; id: string }
  | { kind: "gostop"; id: string; ply: number; action: GoAction }
  | { kind: "move"; x: number; y: number }
  | { kind: "look"; look: Look }
  | { kind: "chat"; text: string }
  | { kind: "emote"; emote: string }
  | {
      kind: "reaction";
      id: ReactionId;
      scope: ReactionScope;
      matchId?: string;
    };
// Private server snapshot, never returned to a browser. Public packets still
// remove every other player's hand and the undealt deck.
export type HostedRoomSnapshot = {
  code: string;
  host: string;
  players: LoungePlayer[];
  seats: LoungeWorld["seats"];
  names: LoungeWorld["names"];
  invites: GameInvite[];
  tables?: LoungeTables;
  chat: LoungeWorld["chat"];
  chess: ChessMatch | null;
  go: GoMatch | null;
  poker: PokerMatch | null;
  blackjack: BlackjackMatch | null;
  seotda: SeotdaMatch | null;
  pokerAway: number[];
  blackjackAway: number[];
  seotdaAway: number[];
  // Optional fields were added later; older snapshots load without them.
  goAway?: number[];
  /** Chess seats whose connection expired; the move clock decides the game. */
  chessAway?: number[];
  lastChat: [string, number][];
  due: Partial<
    Record<
      "poker" | "blackjack" | "seotda" | "gostop",
      { id: string; revision: number; at: number }
    >
  >;
  deadlines?: Partial<Record<GameKind, { key: string; at: number }>>;
  lookAt?: [string, number][];
  pendingLooks?: [string, Look][];
};
/** Earliest server time at which hostedTick has work for this snapshot. */
export function snapshotNextDue(s: HostedRoomSnapshot) {
  const times = [
    ...Object.values(s.due ?? {}).map((d) => d!.at),
    ...Object.values(s.deadlines ?? {}).map((d) => d!.at),
    ...Object.values(s.tables ?? {}).flatMap((t) =>
      t?.readyDeadline ? [t.readyDeadline] : [],
    ),
    // A forming table that nobody completes closes on expiry.
    ...(s.invites ?? []).flatMap((r) =>
      r.status === "waiting" && r.table && r.expires > 0 ? [r.expires] : [],
    ),
    ...(s.pendingLooks?.length
      ? (s.lookAt ?? []).map(([, at]) => at + LOOK_THROTTLE_MS)
      : []),
  ];
  return times.length ? Math.min(...times) : Infinity;
}
/** Rejection messages returned by hostedAttempt (shown as error toasts). */
export const REJECT = {
  invalid: "요청을 처리할 수 없어요. 화면을 새로 고친 뒤 다시 시도해 주세요.",
  stale: "화면이 최신 상태가 아니에요. 잠시 후 다시 시도해 주세요.",
  notTurn: "지금은 내 차례가 아니에요.",
  notSeated: "이 게임에 참가하고 있지 않아요.",
  illegal: "지금은 할 수 없는 행동이에요.",
  away: "자리를 비운 것으로 처리되어 자동으로 진행 중이에요.",
  balance: "잔액이 부족해요.",
  chat: "채팅은 잠시 후에 다시 보내 주세요.",
  busy: "참가 중인 게임이나 수락한 초대를 먼저 마쳐 주세요.",
  active: "이 게임은 이미 진행 중이에요.",
  retained: "기존 테이블의 다음 판 준비가 끝날 때까지 기다려 주세요.",
  pending: "이 게임의 초대 응답을 기다리고 있어요.",
  friends: "함께할 수 있는 친구가 부족해요.",
  stake: "판돈이나 인원 설정을 확인해 주세요.",
  invite: "초대가 만료되었거나 취소됐어요.",
  reaction: "리액션은 잠시 후에 다시 보낼 수 있어요.",
  area: "갈 수 없는 장소예요.",
  daily: "오늘의 범은 이미 받았어요. 내일 다시 받을 수 있어요.",
  drawOffer: "지금은 무승부를 제안하거나 답할 수 없어요.",
  table: "다음 판 준비가 끝났거나 테이블이 정리됐어요.",
  tableArea: "그 테이블이 있는 곳으로 먼저 가 주세요.",
  tableFull: "테이블 자리가 모두 찼어요.",
} as const;
/** 나가리/redeal settle at zero; a winner collects points × 100범 up to each stake. */
function goSettle(ledger: LoungeLedger, g: GoMatch, deposits: number[]) {
  const result =
    g.winner === null
      ? [0, 0, 0]
      : goBeomResult(g.result, GO_POINT_BEOM, deposits);
  g.beom = result;
  g.capped =
    g.winner !== null &&
    g.result.some((p, i) => p < 0 && -p * GO_POINT_BEOM > deposits[i]);
  return settleGame(ledger, g.id, result);
}
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
  private nonce = "";
  private hostSeen = 0;
  private incoming = Promise.resolve();
  private outgoing = Promise.resolve();
  private pending: { actor: number; look: Look } | null = null;
  private serverMode = false;
  private serverDue: HostedRoomSnapshot["due"] = {};
  private goAway = new Set<number>();
  private chessAway = new Set<number>();
  private deadlines: NonNullable<HostedRoomSnapshot["deadlines"]> = {};
  private lookAt = new Map<string, number>();
  private pendingLooks = new Map<string, Look>();
  /** Server clock of the current hosted call (Date.now() in peer mode). */
  private now = 0;
  private rejection = "";
  private coalesced = false;
  /** Village flags (world.life) for the VIP stake tier; set by the cloud engine. */
  villageFlags: readonly string[] = [];
  /** Non-ledger wealth (bag at sell value) for the daily relief; set by the cloud engine. */
  wealthOf: (wallet: string) => number = () => 0;
  static hosted(
    snapshot: HostedRoomSnapshot | null,
    ledger: LoungeLedger,
    code = "",
    host = "",
  ) {
    const r = new LoungeRoom();
    r.serverMode = true;
    r.bank = new LoungeBank(null);
    r.bank.commit(ledger);
    r.view = {
      ...empty(),
      status: "connected",
      role: "host",
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
        tables: structuredClone(snapshot.tables ?? {}),
      };
      r.members = new Map(
        snapshot.players.map((p) => [
          p.id,
          {
            ...structuredClone(p),
            area: AREAS.includes(p.area) ? p.area : "lounge",
          },
        ]),
      );
      r.chess = structuredClone(snapshot.chess);
      r.go = snapshot.go ? normalizeGo(structuredClone(snapshot.go)) : null;
      r.poker = structuredClone(snapshot.poker);
      r.blackjack = structuredClone(snapshot.blackjack);
      r.seotda = structuredClone(snapshot.seotda);
      r.pokerAway = new Set(snapshot.pokerAway);
      r.blackjackAway = new Set(snapshot.blackjackAway);
      r.seotdaAway = new Set(snapshot.seotdaAway);
      r.goAway = new Set(snapshot.goAway ?? []);
      r.chessAway = new Set(snapshot.chessAway ?? []);
      r.lastChat = new Map(snapshot.lastChat);
      r.serverDue = structuredClone(snapshot.due);
      r.deadlines = structuredClone(snapshot.deadlines ?? {});
      r.lookAt = new Map(snapshot.lookAt ?? []);
      r.pendingLooks = new Map(structuredClone(snapshot.pendingLooks ?? []));
    }
    for (const id of r.members.keys()) r.wallets.set(id, "wallet-" + id);
    r.sync();
    return r;
  }
  hostedSnapshot(): HostedRoomSnapshot {
    if (!this.serverMode) throw new Error("Server adapter required");
    return structuredClone({
      code: this.view.code,
      host: this.view.self,
      players: [...this.members.values()],
      seats: this.view.seats,
      names: this.view.names,
      invites: this.view.invites,
      tables: this.view.tables,
      chat: this.view.chat,
      chess: this.chess,
      go: this.go,
      poker: this.poker,
      blackjack: this.blackjack,
      seotda: this.seotda,
      pokerAway: [...this.pokerAway],
      blackjackAway: [...this.blackjackAway],
      seotdaAway: [...this.seotdaAway],
      goAway: [...this.goAway],
      chessAway: [...this.chessAway],
      lastChat: [...this.lastChat],
      due: this.serverDue,
      deadlines: this.deadlines,
      lookAt: [...this.lookAt],
      pendingLooks: [...this.pendingLooks],
    });
  }
  hostedLedger() {
    return this.bank.ledger;
  }
  hostedJoin(id: string, actor: number, look: Look) {
    if (!this.serverMode || !actorValid(actor))
      throw new Error("계정 정보를 확인해 주세요.");
    const existing = this.members.get(id);
    if (existing) {
      if (existing.actor !== actor)
        throw new Error("계정 캐릭터가 일치하지 않습니다.");
      return;
    }
    if (
      this.members.size >= 7 ||
      [...this.members.values()].some((p) => p.actor === actor)
    )
      throw new Error("이미 접속한 계정이거나 방이 가득 찼습니다.");
    const wallet = "wallet-" + id;
    this.bank.commit(registerWallet(this.bank.ledger, wallet));
    this.wallets.set(id, wallet);
    this.members.set(id, player(id, actor, look));
    // A chess player whose connection expired returns to their running game.
    const chessSeat = this.view.seats.chess.indexOf(id);
    if (chessSeat >= 0) this.chessAway.delete(chessSeat);
    this.sync();
  }
  /** Boolean wrapper kept for callers that only need success. */
  hostedAction(id: string, a: LoungeAction, now = Date.now()) {
    return this.hostedAttempt(id, a, now) === "";
  }
  /**
   * Apply one member action. Returns '' on success, otherwise a specific
   * Korean reason for the rejection (never a generic "state changed").
   */
  hostedAttempt(id: string, a: LoungeAction, now = Date.now()): string {
    if (!this.serverMode) throw new Error("Server adapter required");
    this.now = now;
    this.rejection = "";
    this.coalesced = false;
    const ok = this.apply(id, a, now);
    if (ok) {
      this.refreshTimers(now);
      this.sync();
      return "";
    }
    return this.rejection || REJECT.invalid;
  }
  /** True when the last accepted action was deferred (look throttle). */
  get hostedCoalesced() {
    return this.coalesced;
  }
  /**
   * `expired` drops keep a running chess seat: the move clock, not the lost
   * connection, decides the game. Explicit leaves resign chess as before.
   */
  hostedDrop(id: string, reason: "left" | "expired" = "left") {
    if (!this.serverMode) throw new Error("Server adapter required");
    this.drop(id, reason === "expired");
    if (this.view.self === id)
      this.view = {
        ...this.view,
        self: this.members.keys().next().value ?? "",
      };
    this.sync();
  }
  /**
   * The room is empty. Reserved games are played out automatically and
   * settled (no free option to void a losing round). Only a failure to
   * finish, which means a server bug, falls back to a refund.
   */
  hostedClose(now = this.now || Date.now()) {
    if (!this.serverMode) throw new Error("Server adapter required");
    this.now = now;
    for (const kind of GAME_KINDS) {
      const match = kind === "gostop" ? this.go : this[kind];
      if (!match || this.bank.ledger.games[match.id]?.state !== "reserved")
        continue;
      try {
        if (kind === "chess") {
          const c = this.chess!;
          const next = c.moves.length
            ? chessTimeout(c)
            : {
                ...c,
                winner: "draw" as const,
                reason: "첫 수 전에 모두 떠났어요",
              };
          if (next) {
            this.settle("chess", next);
            this.chess = next;
          }
        } else
          for (let step = 0; step < 2000 && this.gameActive(kind); step++)
            if (!this.autoStep(kind, false)) break;
      } catch (error) {
        console.error("lounge: auto-complete failed", kind, error);
      }
      if (this.bank.ledger.games[match.id]?.state === "reserved")
        this.bank.commit(voidGame(this.bank.ledger, match.id));
    }
  }
  /** Ids of every match that still holds reserved 범 (for error recovery). */
  hostedMatchIds() {
    return [this.chess, this.go, this.poker, this.blackjack, this.seotda]
      .filter((m): m is NonNullable<typeof m> => !!m)
      .map((m) => m.id);
  }
  hostedPacket(id: string) {
    if (!this.serverMode || !this.members.has(id))
      throw new Error("이 방에 먼저 들어와 주세요.");
    return this.packet(id);
  }
  /**
   * Server: visitors standing in a friend's room that `mayStay` no longer
   * allows (the owner closed it) go back to the village. The owner always stays.
   * Returns whether anyone moved.
   */
  hostedEvictHomes(mayStay: (owner: number, visitor: number) => boolean) {
    if (!this.serverMode) throw new Error("Server adapter required");
    let moved = false;
    for (const [id, member] of this.members) {
      if (
        member.area !== "home" ||
        member.home === undefined ||
        member.home === member.actor ||
        mayStay(member.home, member.actor)
      )
        continue;
      const next: LoungePlayer = {
        ...member,
        area: "village",
        ...AREA_DEFAULTS.village,
      };
      delete next.home;
      this.members.set(id, next);
      moved = true;
    }
    if (moved) this.sync();
    return moved;
  }
  hostedTick(now: number) {
    if (!this.serverMode) throw new Error("Server adapter required");
    this.now = now;
    this.view = {
      ...this.view,
      invites: this.view.invites.map((r) =>
        r.status === "waiting" && r.expires < now
          ? { ...r, status: "expired" }
          : r,
      ),
    };
    for (const [id, look] of this.pendingLooks) {
      const member = this.members.get(id);
      if (!member) this.pendingLooks.delete(id);
      else if (now - (this.lookAt.get(id) ?? 0) >= LOOK_THROTTLE_MS) {
        this.members.set(id, { ...member, look: readLook(look, member.actor) });
        this.lookAt.set(id, now);
        this.pendingLooks.delete(id);
      }
    }
    for (const id of this.lookAt.keys())
      if (!this.members.has(id)) this.lookAt.delete(id);
    // Automatic dealer steps and seats of players who left.
    for (const kind of ["poker", "blackjack", "seotda", "gostop"] as const) {
      const spec = () => {
        const g = kind === "gostop" ? this.go : this[kind];
        if (!g || g.phase === "over") return null;
        const automatic =
          kind === "poker"
            ? ["dealing", "showdown"].includes(g.phase)
            : kind === "blackjack"
              ? g.phase !== "players"
              : kind === "seotda"
                ? g.phase !== "betting"
                : false;
        return automatic || this.awaySet(kind).has(g.turn)
          ? {
              id: g.id,
              revision: g.revision,
              delay: automatic
                ? kind === "seotda"
                  ? g.phase === "redeal"
                    ? 2200
                    : 1500
                  : kind === "blackjack"
                    ? (blackjackStepDelay(g as BlackjackMatch) ?? 1100)
                    : kind === "poker"
                      ? (pokerStepDelay(g as PokerMatch) ?? 1100)
                      : 1100
                : kind === "gostop"
                  ? 1200
                  : 600,
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
      this.autoStep(kind, false);
      const after = spec();
      if (after)
        this.serverDue[kind] = {
          id: after.id,
          revision: after.revision,
          at: now + after.delay,
        };
      else delete this.serverDue[kind];
    }
    // Turn deadlines: the server acts for a seat that let its clock run out.
    for (const kind of GAME_KINDS) {
      const d = this.deadlines[kind],
        key = this.turnKey(kind);
      if (d && key && d.key === key && d.at <= now) this.autoStep(kind, true);
    }
    this.refreshTimers(now);
    // Ready checks that ran out: non-ready members leave the table, and a
    // table below its required size dissolves.
    const tables = { ...this.view.tables };
    let changed = false;
    for (const kind of GAME_KINDS) {
      const table = tables[kind];
      if (!table?.readyDeadline || table.readyDeadline > now) continue;
      const members = table.members.filter((m) => table.ready.includes(m));
      if (members.length < table.required) delete tables[kind];
      else tables[kind] = { ...table, members, readyDeadline: undefined };
      changed = true;
    }
    if (changed) this.view = { ...this.view, tables };
    this.cancelStaleFills();
    this.sync();
  }
  private awaySet(kind: GameKind) {
    return kind === "poker"
      ? this.pokerAway
      : kind === "blackjack"
        ? this.blackjackAway
        : kind === "seotda"
          ? this.seotdaAway
          : kind === "gostop"
            ? this.goAway
            : this.chessAway;
  }
  /** Identifies one pending human decision; a new key restarts the clock. */
  private turnKey(kind: GameKind): string | null {
    if (kind === "chess")
      return this.chess && !this.chess.winner
        ? `${this.chess.id}:${this.chess.moves.length}`
        : null;
    if (kind === "gostop")
      return this.go && this.go.phase !== "over"
        ? `${this.go.id}:${this.go.revision}`
        : null;
    const g = this[kind];
    if (!g || g.turn < 0) return null;
    const deciding =
      kind === "poker"
        ? ["preflop", "flop", "turn", "river"].includes(g.phase)
        : kind === "blackjack"
          ? g.phase === "players"
          : g.phase === "betting";
    return deciding ? `${g.id}:${g.revision}` : null;
  }
  /** Start clocks for new decisions and ready checks; dissolve short tables. */
  private refreshTimers(now: number) {
    for (const kind of GAME_KINDS) {
      const key = this.turnKey(kind);
      if (!key) delete this.deadlines[kind];
      else if (this.deadlines[kind]?.key !== key)
        this.deadlines[kind] = { key, at: now + TURN_LIMIT_MS[kind] };
    }
    let tables = this.view.tables,
      changed = false;
    for (const kind of GAME_KINDS) {
      const table = tables[kind];
      if (!table) continue;
      if (this.gameActive(kind)) {
        if (table.readyDeadline !== undefined) {
          tables = {
            ...tables,
            [kind]: { ...table, readyDeadline: undefined },
          };
          changed = true;
        }
        continue;
      }
      const members = table.members.filter((m) => this.members.has(m));
      if (!members.length) {
        tables = { ...tables };
        delete tables[kind];
        changed = true;
      } else if (
        members.length !== table.members.length ||
        table.readyDeadline === undefined
      ) {
        tables = {
          ...tables,
          [kind]: {
            ...table,
            members,
            ready: table.ready.filter((m) => members.includes(m)),
            readyDeadline: table.readyDeadline ?? now + READY_LIMIT_MS,
          },
        };
        changed = true;
      }
    }
    if (changed) this.view = { ...this.view, tables };
    this.cancelStaleFills();
  }
  /**
   * One server-side step: dealer phases advance, otherwise the seat to act
   * gets the safe default (check, else fold/die; stand; the practice AI for
   * go-stop; loss on time for chess). Returns false when nothing applied.
   */
  private autoStep(kind: GameKind, timeout: boolean): boolean {
    if (kind === "poker") {
      const g = this.poker;
      if (!g || g.phase === "over") return false;
      const next = ["dealing", "showdown"].includes(g.phase)
        ? pokerDeal(g)
        : pokerAction(g, g.turn, {
            kind: pokerLegalActions(g, g.turn).canCheck ? "check" : "fold",
          });
      if (!next) return false;
      this.settle(kind, next);
      this.poker = next;
    } else if (kind === "blackjack") {
      const g = this.blackjack;
      if (!g || g.phase === "over") return false;
      const next =
        g.phase === "players"
          ? blackjackAction(g, g.turn, { kind: "stand" })
          : blackjackDeal(g);
      if (!next) return false;
      this.settle(kind, next);
      this.blackjack = next;
    } else if (kind === "seotda") {
      const g = this.seotda;
      if (!g || g.phase === "over") return false;
      const next =
        g.phase === "betting"
          ? seotdaAction(g, g.turn, {
              kind: seotdaLegal(g, g.turn).canCheck ? "check" : "fold",
            })
          : seotdaDeal(g);
      if (!next) return false;
      this.settle(kind, next);
      this.seotda = next;
    } else if (kind === "gostop") {
      const g = this.go;
      if (!g || g.phase === "over") return false;
      const next = goAction(g, g.turn, goPracticeAction(goView(g, g.turn)));
      if (!next) return false;
      this.settle(kind, next);
      this.go = next;
    } else {
      const g = this.chess;
      if (!g || g.winner || !timeout) return false;
      const next = chessTimeout(g);
      if (!next) return false;
      this.settle(kind, next);
      this.chess = next;
    }
    return true;
  }
  private timing(kind: GameKind): TurnTiming {
    const d = this.deadlines[kind];
    return {
      ...(d ? { turnDeadline: d.at } : {}),
      away: [...this.awaySet(kind)].sort((a, b) => a - b),
    };
  }
  private reject(reason: string): false {
    this.rejection = reason;
    return false;
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
  /** Per-seat views of every match, with public turn timing and away seats. */
  private games(id: string) {
    const seat = (kind: GameKind) => this.view.seats[kind].indexOf(id);
    return {
      chess: this.chess ? { ...this.chess, ...this.timing("chess") } : null,
      gostop: this.go
        ? { ...goView(this.go, seat("gostop")), ...this.timing("gostop") }
        : null,
      poker: this.poker
        ? { ...pokerView(this.poker, seat("poker")), ...this.timing("poker") }
        : null,
      blackjack: this.blackjack
        ? {
            ...blackjackView(this.blackjack, seat("blackjack")),
            ...this.timing("blackjack"),
          }
        : null,
      seotda: this.seotda
        ? {
            ...seotdaView(this.seotda, seat("seotda")),
            ...this.timing("seotda"),
          }
        : null,
    };
  }
  private chatFor(id: string) {
    const member = this.members.get(id),
      scope = chatScope(member?.area ?? "lounge", member?.home);
    return this.view.chat.filter((c) => (c.scope ?? "lounge") === scope);
  }
  private clock() {
    return this.serverMode ? this.now || Date.now() : Date.now();
  }
  private packet(id: string) {
    return {
      v: 1,
      type: "world",
      players: [...this.members.values()],
      seats: this.view.seats,
      ...this.games(id),
      chat: this.chatFor(id),
      invites: this.view.invites,
      tables: this.view.tables,
      names: this.view.names,
      wallet: this.bank.view(this.wallets.get(id), this.clock()),
      host: this.view.self,
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
      tables: this.view.tables,
      ...this.games(this.view.self),
      wallet: this.bank.view(this.wallets.get(this.view.self), this.clock()),
      host: this.view.self,
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
    if (this.seotdaTimer || !g || g.phase === "over") return;
    const automatic = g.phase !== "betting";
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
            : seotdaAction(current, current.turn, { kind: "fold" });
          if (next) {
            this.settle("seotda", next);
            this.seotda = next;
            this.sync();
          }
        } catch (error) {
          this.update({
            error:
              error instanceof Error
                ? error.message
                : "범 정산을 저장하지 못했습니다.",
          });
        }
      },
      automatic ? (g.phase === "redeal" ? 2200 : 1500) : 600,
    );
    (this.seotdaTimer as unknown as { unref?: () => void }).unref?.();
  }
  private scheduleBlackjack() {
    const g = this.blackjack;
    if (this.blackjackTimer || !g || g.phase === "over") return;
    const automatic = g.phase !== "players";
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
          const next =
            current.phase !== "players"
              ? blackjackDeal(current)
              : blackjackAction(current, current.turn, { kind: "stand" });
          if (next) {
            this.settle("blackjack", next);
            this.blackjack = next;
            this.sync();
          }
        } catch (error) {
          this.update({
            error:
              error instanceof Error
                ? error.message
                : "범 정산을 저장하지 못했습니다.",
          });
        }
      },
      automatic ? (blackjackStepDelay(g) ?? 1100) : 600,
    );
    (this.blackjackTimer as unknown as { unref?: () => void }).unref?.();
  }
  private scheduleDealer() {
    if (this.dealerTimer || !this.poker || this.poker.phase === "over") return;
    const g = this.poker,
      id = g.id,
      revision = g.revision;
    const automatic = ["dealing", "showdown"].includes(g.phase);
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
                  ? "check"
                  : "fold",
              });
          if (next) {
            this.settle("poker", next);
            this.poker = next;
            this.sync();
          }
        } catch (error) {
          this.update({
            error:
              error instanceof Error
                ? error.message
                : "범 정산을 저장하지 못했습니다.",
          });
        }
      },
      automatic ? (pokerStepDelay(g) ?? 1100) : 600,
    );
    (this.dealerTimer as unknown as { unref?: () => void }).unref?.();
  }
  private settle(
    kind: GameKind,
    game: ChessMatch | GoMatch | PokerMatch | BlackjackMatch | SeotdaMatch,
  ) {
    const escrow = this.bank.ledger.games[game.id];
    if (!escrow || escrow.state !== "reserved") return;
    if (kind === "chess") {
      const c = game as ChessMatch;
      if (c.winner)
        this.bank.commit(
          settleGame(
            this.bank.ledger,
            c.id,
            chessBeomResult(c.winner, escrow.deposits[0]),
          ),
        );
    } else if (kind === "gostop") {
      const g = game as GoMatch;
      if (g.phase === "over")
        this.bank.commit(goSettle(this.bank.ledger, g, escrow.deposits));
    } else {
      const g = game as PokerMatch | BlackjackMatch | SeotdaMatch;
      if (g.phase === "over")
        this.bank.commit(settleGame(this.bank.ledger, g.id, g.result));
    }
  }
  private lobby(id: string, error = "") {
    const c = this.challenges.get(id);
    if (c)
      this.transport?.send(id, {
        v: 1,
        type: "lobby",
        nonce: c.nonce,
        publicKey: this.identity!.publicKey,
        players: [...this.members.values()],
        error,
      });
  }
  leave(error = "") {
    if (this.view.role === "host" && this.houseRelease) {
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
    this.nonce = "";
    this.view = empty();
    this.update({ status: error ? "error" : "offline", error });
  }
  async start(
    role: "host" | "guest",
    input: string,
    actor: number,
    look: Look,
  ) {
    this.leave();
    let code = "";
    if (role === "guest") {
      try {
        const url = input.trim().startsWith("http") ? new URL(input) : null;
        code =
          roomCode(
            url
              ? (new URLSearchParams(url.hash.slice(1)).get("lounge") ?? "")
              : input,
          ) ?? "";
      } catch {}
      if (!code) {
        this.update({
          status: "error",
          error: "10자리 초대 코드 또는 마을 초대 링크를 확인해 주세요.",
        });
        return;
      }
    }
    if (!actorValid(actor)) return;
    const generation = ++this.generation;
    this.update({ status: "connecting", role, code });
    this.deadline = setTimeout(() => {
      if (generation === this.generation)
        this.leave("연결하지 못했어요. 방장이 접속 중인지 확인해 주세요.");
    }, 25000);
    try {
      const [room, identity, wallet] = await Promise.all([
        IslandRoom.create(role === "host", code, "hohyeon-lounge-v4:", 131072),
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
      if (role === "host") {
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
            this.leave("실시간 연결이 끊겼어요. 다시 참가해 주세요.");
        },
      );
      if (generation !== this.generation) return;
      this.hostSeen = Date.now();
      if (role === "host") {
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
            : "마을에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
    }
  }
  private finishConnecting() {
    if (this.deadline) clearTimeout(this.deadline);
    this.deadline = null;
    this.update({ status: "connected", claiming: null, error: "" });
  }
  private hello() {
    this.transport?.send(this.hostId(), {
      v: 1,
      type: "hello",
      lounge: 1,
      publicKey: this.identity?.publicKey,
    });
  }
  claim(actor: number, look: Look) {
    if (
      this.view.status !== "selecting" ||
      !actorValid(actor) ||
      this.view.players.some((p) => p.actor === actor)
    )
      return false;
    this.pending = { actor, look: readLook(look, actor) };
    this.update({ claiming: actor, error: "" });
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
          type: "join",
          nonce,
          ...pending,
          wallet,
        });
    } catch {
      this.pending = null;
      this.update({
        claiming: null,
        error: "지갑 소유 확인을 완료하지 못했습니다.",
      });
    }
  }
  action(action: LoungeAction) {
    if (this.view.status !== "connected") return false;
    if (this.view.role === "host") {
      let ok = false;
      this.rejection = "";
      try {
        ok = this.apply(this.view.self, action);
      } catch (error) {
        this.update({
          error:
            error instanceof Error
              ? error.message
              : "범 지갑을 저장하지 못했습니다.",
        });
        return false;
      }
      if (!ok) this.update({ error: this.rejection || REJECT.invalid });
      return ok;
    }
    this.send(this.hostId(), { v: 1, type: "action", action });
    return true;
  }
  private gameActive(game: GameKind) {
    return game === "chess"
      ? !!this.chess && !this.chess.winner
      : game === "gostop"
        ? !!this.go && this.go.phase !== "over"
        : game === "poker"
          ? !!this.poker && this.poker.phase !== "over"
          : game === "seotda"
            ? !!this.seotda && this.seotda.phase !== "over"
            : !!this.blackjack && this.blackjack.phase !== "over";
  }
  private busy(id: string, except = "") {
    return (
      Object.values(this.view.tables).some((table) =>
        table?.members.includes(id),
      ) ||
      GAME_KINDS.some(
        (game) => this.gameActive(game) && this.view.seats[game].includes(id),
      ) ||
      this.view.invites.some(
        (r) =>
          r.id !== except && r.status === "waiting" && r.accepted.includes(id),
      )
    );
  }
  /**
   * `round` rotates positions across rematches: the poker button and the
   * seotda first seat move one seat per round, chess colours alternate, and
   * go-stop starts with the previous winner (kept after 나가리).
   */
  private launch(request: GameInvite, round = 1) {
    const id = crypto.randomUUID(),
      n = request.accepted.length,
      order =
        request.game === "chess" && round % 2 === 0
          ? [...request.accepted].reverse()
          : [...request.accepted],
      wallets = order.map((p) => this.wallets.get(p)!);
    const deposits = order.map(() =>
      gameReservation(request.game, request.stake),
    );
    let goFirst = 0;
    if (request.game === "gostop" && round > 1 && this.go) {
      const prev = this.go,
        seat = prev.winner ?? prev.first ?? 0;
      goFirst = Math.max(0, order.indexOf(this.view.seats.gostop[seat] ?? ""));
    }
    const game =
      request.game === "chess"
        ? newChess(id)
        : request.game === "gostop"
          ? { ...newGo(id, shuffleCards(), goFirst), stake: request.stake }
          : request.game === "poker"
            ? newPoker(
                id,
                deposits,
                undefined,
                (round - 1) % n,
                pokerBigBlind(request.stake),
              )
            : request.game === "seotda"
              ? newSeotda(id, n, request.stake, undefined, (round - 1) % n)
              : newBlackjack(id, n, request.stake, undefined, (round - 1) % n);
    let ledger = reserveGame(
      this.bank.ledger,
      id,
      request.game,
      wallets,
      deposits,
    );
    if (request.game === "gostop" && (game as GoMatch).phase === "over")
      ledger = goSettle(ledger, game as GoMatch, deposits);
    this.bank.commit(ledger);
    for (const id of request.accepted) this.removeSeat(id);
    const seats = { ...this.view.seats, [request.game]: order };
    request.status = "started";
    request.matchId = id;
    this.update({
      seats,
      tables: {
        ...this.view.tables,
        [request.game]: {
          matchId: id,
          round,
          stake: request.stake,
          required: request.required,
          members: [...request.accepted],
          ready: [],
        },
      },
      names: {
        ...this.view.names,
        [request.game]: order.map((p) => ACTORS[this.members.get(p)!.actor]),
      },
    });
    delete this.deadlines[request.game];
    if (request.game === "chess") {
      this.chess = game as ChessMatch;
      this.chessAway.clear();
    } else if (request.game === "gostop") {
      this.go = game as GoMatch;
      this.goAway.clear();
    } else if (request.game === "poker") {
      this.poker = game as PokerMatch;
      this.pokerAway.clear();
    } else if (request.game === "seotda") {
      this.seotda = game as SeotdaMatch;
      this.seotdaAway.clear();
    } else {
      this.blackjack = game as BlackjackMatch;
      this.blackjackAway.clear();
    }
    for (let i = 0; i < order.length; i++) {
      const p = this.members.get(order[i])!;
      this.members.set(p.id, {
        ...p,
        area:
          request.game === "gostop" || request.game === "seotda"
            ? "lounge"
            : "casino",
        x:
          (request.game === "seotda"
            ? 31
            : request.game === "gostop"
              ? 68
              : request.game === "chess"
                ? 24
                : request.game === "blackjack"
                  ? 77
                  : 50) + (i === 0 ? -8 : i === 1 ? 8 : 0),
        y: i === 2 ? 78 : 64,
      });
    }
  }
  private apply(id: string, a: LoungeAction, now = Date.now()) {
    const member = this.members.get(id);
    if (!member || !a || typeof a !== "object")
      return this.reject(REJECT.invalid);
    const turnGame = (
      kind: "poker" | "blackjack" | "seotda",
      matchId: unknown,
      revision: unknown,
    ) => {
      const g = this[kind],
        seat = this.view.seats[kind].indexOf(id);
      if (!g || seat < 0) return this.reject(REJECT.notSeated);
      if (g.id !== matchId || g.revision !== revision)
        return this.reject(REJECT.stale);
      if (this.awaySet(kind).has(seat)) return this.reject(REJECT.away);
      if (g.turn !== seat) return this.reject(REJECT.notTurn);
      return seat;
    };
    if (a.kind === "area") {
      if (!AREAS.includes(a.area)) return this.reject(REJECT.area);
      const coord = (v: unknown) =>
        typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100
          ? v
          : null;
      const x = coord(a.x),
        y = coord(a.y),
        fallback = AREA_DEFAULTS[a.area];
      // 'home' + owner: everyone in the same friend's room shares presence.
      // (Entry permission is checked by the cloud engine, which knows world.life.)
      if (a.area === "home" && a.home !== undefined && !validHomeOwner(a.home))
        return this.reject(REJECT.area);
      const next: LoungePlayer = {
        ...member,
        area: a.area,
        x: x ?? fallback.x,
        y: y ?? fallback.y,
      };
      if (a.area === "home") next.home = a.home ?? member.actor;
      else delete next.home;
      this.members.set(id, next);
      // Walking out of the interior stands me up from a forming table there.
      if (
        this.view.invites.some(
          (r) => this.seatedForming(r, id) && TABLE_AREA[r.game] !== a.area,
        )
      )
        this.update({
          invites: this.view.invites.map((r) =>
            this.seatedForming(r, id) && TABLE_AREA[r.game] !== a.area
              ? this.standFromForming(r, id)
              : r,
          ),
        });
    } else if (a.kind === "poker") {
      const seat = turnGame("poker", a.id, a.revision);
      if (seat === false) return false;
      const next = pokerAction(this.poker!, seat, a.action);
      if (!next) return this.reject(REJECT.illegal);
      this.settle("poker", next);
      this.poker = next;
    } else if (a.kind === "blackjack") {
      const seat = turnGame("blackjack", a.id, a.revision);
      if (seat === false) return false;
      const next = blackjackAction(this.blackjack!, seat, a.action);
      if (!next) return this.reject(REJECT.illegal);
      this.settle("blackjack", next);
      this.blackjack = next;
    } else if (a.kind === "seotda") {
      const seat = turnGame("seotda", a.id, a.revision);
      if (seat === false) return false;
      const next = seotdaAction(this.seotda!, seat, a.action);
      if (!next) return this.reject(REJECT.illegal);
      this.settle("seotda", next);
      this.seotda = next;
    } else if (a.kind === "move") {
      if (!Number.isFinite(a.x) || !Number.isFinite(a.y))
        return this.reject(REJECT.invalid);
      // Seated players stay at their table in the hall and casino. At a
      // forming table the client places me on my seat around it.
      if (
        this.busy(id) &&
        !this.view.invites.some((r) => this.seatedForming(r, id)) &&
        (member.area === "lounge" || member.area === "casino")
      )
        return true;
      this.members.set(
        id,
        member.area === "village" || member.area === "home"
          ? {
              ...member,
              x: Math.max(0, Math.min(100, a.x)),
              y: Math.max(0, Math.min(100, a.y)),
            }
          : {
              ...member,
              x: Math.max(15, Math.min(85, a.x)),
              y: Math.max(42, Math.min(88, a.y)),
            },
      );
    } else if (a.kind === "look") {
      const last = this.lookAt.get(id) ?? -Infinity;
      if (this.serverMode && now - last < LOOK_THROTTLE_MS) {
        // Coalesce rapid edits (colour drags): keep only the latest look.
        this.pendingLooks.set(id, readLook(a.look, member.actor));
        this.coalesced = true;
        return true;
      }
      this.pendingLooks.delete(id);
      this.lookAt.set(id, now);
      this.members.set(id, { ...member, look: readLook(a.look, member.actor) });
    } else if (a.kind === "reaction") {
      if (!reactionId(a.id)) return this.reject(REJECT.invalid);
      if (member.reaction && now - member.reaction.at < REACTION_COOLDOWN)
        return this.reject(REJECT.reaction);
      if (
        a.scope === "village" ||
        a.scope === "lounge" ||
        a.scope === "casino" ||
        a.scope === "home"
      ) {
        if (member.area !== a.scope || a.matchId !== undefined)
          return this.reject(REJECT.invalid);
      } else {
        if (!GAME_KINDS.includes(a.scope)) return this.reject(REJECT.invalid);
        const match = a.scope === "gostop" ? this.go : this[a.scope];
        if (!match || match.id !== a.matchId) return this.reject(REJECT.stale);
      }
      this.members.set(id, {
        ...member,
        reaction: {
          id: a.id,
          scope: a.scope,
          at: now,
          ...(a.matchId ? { matchId: a.matchId } : {}),
        },
      });
    } else if (a.kind === "emote") {
      if (!["👋", "♥", "✨", "ㅋㅋ"].includes(a.emote))
        return this.reject(REJECT.invalid);
      this.members.set(id, { ...member, emote: a.emote, emoteAt: now });
    } else if (a.kind === "chat") {
      const text =
        typeof a.text === "string" ? a.text.trim().slice(0, 120) : "";
      if (!text) return this.reject(REJECT.invalid);
      if (now - (this.lastChat.get(id) ?? 0) < 500)
        return this.reject(REJECT.chat);
      this.lastChat.set(id, now);
      const scope = chatScope(member.area, member.home),
        line: ChatLine = {
          id: crypto.randomUUID(),
          actor: member.actor,
          text,
          scope,
        };
      // Twelve recent lines per scope.
      const chat = [...this.view.chat, line];
      const kept = chat.filter(
        (c, i) =>
          chat
            .slice(i + 1)
            .filter((d) => (d.scope ?? "lounge") === (c.scope ?? "lounge"))
            .length < 12,
      );
      this.update({ chat: kept });
    } else if (a.kind === "daily") {
      const wallet = this.wallets.get(id);
      if (!wallet || !dailyGrantInfo(this.bank.ledger, wallet, now).available)
        return this.reject(REJECT.daily);
      this.bank.commit(
        claimDailyGrant(this.bank.ledger, wallet, now, this.wealthOf(wallet)),
      );
    } else if (a.kind === "invite") {
      if (
        !GAME_KINDS.includes(a.game) ||
        !Array.isArray(a.players) ||
        a.players.length > 6
      )
        return this.reject(REJECT.invalid);
      if (a.table !== undefined) return this.inviteTable(id, member, a, now);
      const retained = this.view.tables[a.game];
      if (
        retained?.members.includes(id) &&
        !this.gameActive(a.game) &&
        retained.members.length < retained.required
      )
        return this.inviteFill(id, a.game, retained, a.players, now);
      if (this.busy(id)) return this.reject(REJECT.busy);
      if (this.gameActive(a.game)) return this.reject(REJECT.active);
      if (this.view.tables[a.game]?.members.length)
        return this.reject(REJECT.retained);
      if (
        this.view.invites.some(
          (r) => r.game === a.game && r.status === "waiting",
        )
      )
        return this.reject(REJECT.pending);
      const stake = a.stake ?? GAME_INFO[a.game].stake;
      const required =
        a.game === "poker" || a.game === "blackjack" || a.game === "seotda"
          ? (a.required ?? 3)
          : GAME_INFO[a.game].players;
      if (
        !(TABLE_STAKES as readonly number[]).includes(stake) ||
        !Number.isInteger(required) ||
        required < 2 ||
        required > 7
      )
        return this.reject(REJECT.stake);
      const balance = this.bank.view(this.wallets.get(id), now).balance;
      const lock = stakeLock(stake, balance, this.villageFlags);
      if (lock) return this.reject(lock);
      if (balance < gameReservation(a.game, stake))
        return this.reject(REJECT.balance);
      const invited = [...new Set(a.players)].filter(
        (p) => p !== id && this.members.has(p) && !this.busy(p),
      );
      if (invited.length < required - 1) return this.reject(REJECT.friends);
      this.update({
        invites: [
          ...this.view.invites.filter((r) => r.status === "waiting"),
          {
            id: crypto.randomUUID(),
            game: a.game,
            from: id,
            invited,
            accepted: [id],
            declined: [],
            status: "waiting",
            expires: now + 90000,
            matchId: null,
            required,
            stake,
          },
        ],
      });
    } else if (a.kind === "reply") {
      const invites = structuredClone(this.view.invites),
        request = invites.find((r) => r.id === a.id);
      if (!request || request.status !== "waiting" || now > request.expires)
        return this.reject(REJECT.invite);
      if (request.table)
        return this.replyTable(id, member, invites, request, a.accept, now);
      if (
        !request.invited.includes(id) ||
        request.accepted.includes(id) ||
        request.declined.includes(id) ||
        typeof a.accept !== "boolean"
      )
        return this.reject(REJECT.invalid);
      if (a.accept && request.fill) {
        if (this.busy(id, request.id)) return this.reject(REJECT.busy);
        const table = this.view.tables[request.game];
        if (
          !table ||
          table.matchId !== request.fill ||
          this.gameActive(request.game) ||
          table.members.length >= table.required
        )
          return this.reject(REJECT.table);
        if (
          this.bank.view(this.wallets.get(id), now).balance <
          gameReservation(request.game, table.stake)
        )
          return this.reject(REJECT.balance);
        request.accepted.push(id);
        const members = [...table.members, id],
          full = members.length >= table.required;
        if (request.accepted.length === request.required || full) {
          request.status = "started";
          request.matchId = table.matchId;
        }
        const next: LoungeTable = {
          ...table,
          members,
          // Accepting the invite counts as being ready for the next round.
          ready: [...new Set([...table.ready, id])],
          readyDeadline: now + READY_LIMIT_MS,
        };
        this.update({
          invites,
          tables: { ...this.view.tables, [request.game]: next },
        });
        this.startIfAllReady(request.game, next, now);
        return true;
      }
      if (a.accept) {
        if (this.busy(id, request.id)) return this.reject(REJECT.busy);
        if (this.gameActive(request.game)) return this.reject(REJECT.active);
        if (this.view.tables[request.game]?.members.length)
          return this.reject(REJECT.retained);
        if (
          this.bank.view(this.wallets.get(id), now).balance <
          gameReservation(request.game, request.stake)
        )
          return this.reject(REJECT.balance);
        request.accepted.push(id);
        if (request.accepted.length === request.required) this.launch(request);
      } else {
        request.declined.push(id);
        if (
          1 + request.invited.length - request.declined.length <
          request.required
        )
          request.status = "cancelled";
      }
      this.update({ invites });
    } else if (a.kind === "cancel") {
      const invites = structuredClone(this.view.invites),
        r = invites.find((r) => r.id === a.id);
      if (!r || r.status !== "waiting") return this.reject(REJECT.invite);
      if (!r.accepted.includes(id)) return this.reject(REJECT.invalid);
      if (r.table)
        // Standing up from a forming table: only my seat goes.
        invites[invites.indexOf(r)] = this.standFromForming(r, id);
      else if (r.from === id) r.status = "cancelled";
      else {
        // A guest who already accepted only withdraws themselves; the invite
        // stays open while enough friends can still join.
        r.accepted = r.accepted.filter((p) => p !== id);
        r.declined = [...new Set([...r.declined, id])];
        if (1 + r.invited.length - r.declined.length < r.required)
          r.status = "cancelled";
      }
      this.update({ invites });
    } else if (a.kind === "stand") {
      if (!GAME_KINDS.includes(a.game)) return this.reject(REJECT.invalid);
      const table = this.view.tables[a.game];
      const currentMatchId =
        a.game === "gostop" ? this.go?.id : this[a.game]?.id;
      if (
        a.id !== undefined &&
        (a.id !== currentMatchId || (table && a.id !== table.matchId))
      )
        return this.reject(REJECT.stale);
      if (!this.view.seats[a.game].includes(id) && !table?.members.includes(id))
        return this.reject(REJECT.notSeated);
      this.removeSeat(id);
      const back = AREA_DEFAULTS[member.area];
      this.members.set(id, { ...member, x: back.x - 2, y: back.y });
    } else if (a.kind === "ready") {
      if (!GAME_KINDS.includes(a.game) || typeof a.ready !== "boolean")
        return this.reject(REJECT.invalid);
      const table = this.view.tables[a.game];
      const matchId = a.game === "gostop" ? this.go?.id : this[a.game]?.id;
      if (
        !table ||
        table.matchId !== a.id ||
        matchId !== a.id ||
        !table.members.includes(id)
      )
        return this.reject(REJECT.table);
      if (this.gameActive(a.game)) return this.reject(REJECT.active);
      if (
        a.ready &&
        this.bank.view(this.wallets.get(id), now).balance <
          gameReservation(a.game, table.stake)
      )
        return this.reject(REJECT.balance);
      const ready = a.ready
        ? [...new Set([...table.ready, id])]
        : table.ready.filter((memberId) => memberId !== id);
      const next = { ...table, ready };
      const started = this.startIfAllReady(a.game, next, now);
      if (started === "balance") return this.reject(REJECT.balance);
      if (!started)
        this.update({
          tables: {
            ...this.view.tables,
            [a.game]: next,
          },
        });
    } else if (a.kind === "chess") {
      const g = this.chess,
        seat = this.view.seats.chess.indexOf(id);
      if (!g || seat < 0) return this.reject(REJECT.notSeated);
      if (a.id !== g.id || a.ply !== g.moves.length)
        return this.reject(REJECT.stale);
      const next = chessMove(g, seat, a.from, a.to, a.promotion);
      if (!next)
        return this.reject(
          chessBoard(g).turn() !== (seat === 0 ? "w" : "b")
            ? REJECT.notTurn
            : REJECT.illegal,
        );
      this.chessAway.delete(seat);
      this.settle("chess", next);
      this.chess = next;
    } else if (a.kind === "draw") {
      const g = this.chess,
        seat = this.view.seats.chess.indexOf(id);
      if (!g || seat < 0) return this.reject(REJECT.notSeated);
      if (a.id !== g.id) return this.reject(REJECT.stale);
      const next =
        a.op === "offer"
          ? chessOfferDraw(g, seat)
          : a.op === "accept" || a.op === "decline"
            ? chessAnswerDraw(g, seat, a.op === "accept")
            : null;
      if (!next) return this.reject(REJECT.drawOffer);
      this.settle("chess", next);
      this.chess = next;
    } else if (a.kind === "resign") {
      const seat = this.view.seats.chess.indexOf(id);
      if (!this.chess || seat < 0) return this.reject(REJECT.notSeated);
      if (a.id !== this.chess.id || this.chess.winner)
        return this.reject(REJECT.stale);
      const next = chessResign(this.chess, seat)!;
      this.settle("chess", next);
      this.chess = next;
    } else if (a.kind === "gostop") {
      const g = this.go,
        seat = this.view.seats.gostop.indexOf(id);
      if (!g || seat < 0) return this.reject(REJECT.notSeated);
      if (a.id !== g.id || a.ply !== g.ply) return this.reject(REJECT.stale);
      if (this.goAway.has(seat)) return this.reject(REJECT.away);
      if (g.turn !== seat) return this.reject(REJECT.notTurn);
      const next = goAction(g, seat, a.action);
      if (!next) return this.reject(REJECT.illegal);
      this.settle("gostop", next);
      this.go = next;
    } else return this.reject(REJECT.invalid);
    this.sync();
    return true;
  }
  private seatedForming(r: GameInvite, id: string) {
    return !!r.table && r.status === "waiting" && r.accepted.includes(id);
  }
  /**
   * Leave a forming table's seat. The table stays open while anyone is
   * seated; when the host stands, the next seated player hosts it.
   */
  private standFromForming(r: GameInvite, id: string): GameInvite {
    const accepted = r.accepted.filter((p) => p !== id);
    if (!accepted.length) return { ...r, accepted, status: "cancelled" };
    const from = r.from === id ? accepted[0] : r.from;
    return {
      ...r,
      from,
      accepted,
      invited: [
        ...new Set([...r.invited, ...(r.from === id ? [id] : [])]),
      ].filter((p) => p !== from),
      declined: [...new Set([...r.declined, id])],
    };
  }
  /**
   * Sit down at an empty interior table (table-forming invite), or, already
   * seated there, call more friends over. Nothing is reserved until the
   * required count sits (then launch reserves every stake at once).
   */
  private inviteTable(
    id: string,
    member: LoungePlayer,
    a: Extract<LoungeAction, { kind: "invite" }>,
    now: number,
  ) {
    const game = a.game;
    if (a.table !== tableIdOf(game)) return this.reject(REJECT.invalid);
    const players = [...new Set(a.players)].filter(
      (p): p is string =>
        typeof p === "string" && p !== id && this.members.has(p),
    );
    const mine = this.view.invites.find(
      (r) =>
        r.status === "waiting" &&
        r.game === game &&
        r.table === a.table &&
        r.accepted.includes(id),
    );
    if (mine) {
      // "친구 부르기": call more friends to the table I sit at.
      const called = players.filter(
        (p) => !mine.accepted.includes(p) && !this.busy(p),
      );
      if (!called.length) return this.reject(REJECT.friends);
      this.update({
        invites: this.view.invites.map((r) =>
          r.id === mine.id
            ? {
                ...r,
                invited: [...new Set([...r.invited, ...called])],
                // A friend called again may answer again.
                declined: r.declined.filter((p) => !called.includes(p)),
                expires: now + TABLE_FORM_MS,
              }
            : r,
        ),
      });
      return true;
    }
    if (member.area !== TABLE_AREA[game]) return this.reject(REJECT.tableArea);
    if (this.busy(id)) return this.reject(REJECT.busy);
    if (this.gameActive(game)) return this.reject(REJECT.active);
    if (this.view.tables[game]?.members.length)
      return this.reject(REJECT.retained);
    if (
      this.view.invites.some((r) => r.game === game && r.status === "waiting")
    )
      return this.reject(REJECT.pending);
    const stake = a.stake ?? GAME_INFO[game].stake;
    const required = FLEX_GAMES.includes(game)
      ? (a.required ?? GAME_INFO[game].players)
      : GAME_INFO[game].players;
    if (
      !(TABLE_STAKES as readonly number[]).includes(stake) ||
      !Number.isInteger(required) ||
      required < 2 ||
      required > 7
    )
      return this.reject(REJECT.stake);
    const balance = this.bank.view(this.wallets.get(id), now).balance;
    const lock = stakeLock(stake, balance, this.villageFlags);
    if (lock) return this.reject(lock);
    if (balance < gameReservation(game, stake))
      return this.reject(REJECT.balance);
    this.update({
      invites: [
        ...this.view.invites.filter((r) => r.status === "waiting"),
        {
          id: crypto.randomUUID(),
          game,
          from: id,
          invited: players.filter((p) => !this.busy(p)),
          accepted: [id],
          declined: [],
          status: "waiting",
          expires: now + TABLE_FORM_MS,
          matchId: null,
          required,
          stake,
          table: a.table,
        },
      ],
    });
    return true;
  }
  /**
   * Sit at (accept) or turn down (decline) a forming table. Anyone standing in
   * the table's interior may sit, called or not; the last seat starts the game.
   */
  private replyTable(
    id: string,
    member: LoungePlayer,
    invites: GameInvite[],
    request: GameInvite,
    accept: unknown,
    now: number,
  ) {
    if (typeof accept !== "boolean" || request.accepted.includes(id))
      return this.reject(REJECT.invalid);
    if (!accept) {
      if (!request.invited.includes(id)) return this.reject(REJECT.invalid);
      request.declined = [...new Set([...request.declined, id])];
      this.update({ invites });
      return true;
    }
    if (member.area !== TABLE_AREA[request.game])
      return this.reject(REJECT.tableArea);
    if (this.busy(id, request.id)) return this.reject(REJECT.busy);
    if (this.gameActive(request.game)) return this.reject(REJECT.active);
    if (this.view.tables[request.game]?.members.length)
      return this.reject(REJECT.retained);
    if (request.accepted.length >= request.required)
      return this.reject(REJECT.tableFull);
    if (
      this.bank.view(this.wallets.get(id), now).balance <
      gameReservation(request.game, request.stake)
    )
      return this.reject(REJECT.balance);
    request.accepted.push(id);
    if (!request.invited.includes(id)) request.invited.push(id);
    request.declined = request.declined.filter((p) => p !== id);
    request.expires = now + TABLE_FORM_MS;
    if (request.accepted.length === request.required) {
      // Everyone who could not pay any more stands up instead of failing launch.
      const broke = request.accepted.filter(
        (p) =>
          !this.members.has(p) ||
          this.bank.view(this.wallets.get(p), now).balance <
            gameReservation(request.game, request.stake),
      );
      if (broke.length) {
        let next = request;
        for (const p of broke) next = this.standFromForming(next, p);
        invites[invites.indexOf(request)] = next;
      } else this.launch(request);
    }
    this.update({ invites });
    return true;
  }
  /** "빈자리에 친구 초대": invite friends into a short retained table. */
  private inviteFill(
    id: string,
    game: GameKind,
    table: LoungeTable,
    players: string[],
    now: number,
  ) {
    if (
      this.view.invites.some((r) => r.game === game && r.status === "waiting")
    )
      return this.reject(REJECT.pending);
    const missing = table.required - table.members.length;
    const invited = [...new Set(players)].filter(
      (p) =>
        typeof p === "string" &&
        p !== id &&
        this.members.has(p) &&
        !table.members.includes(p) &&
        !this.busy(p),
    );
    if (!invited.length) return this.reject(REJECT.friends);
    this.update({
      invites: [
        ...this.view.invites.filter((r) => r.status === "waiting"),
        {
          id: crypto.randomUUID(),
          game,
          from: id,
          invited,
          accepted: [id],
          declined: [],
          status: "waiting",
          expires: now + 90000,
          matchId: null,
          required: Math.min(missing, invited.length) + 1,
          stake: table.stake,
          fill: table.matchId,
        },
      ],
      tables: {
        ...this.view.tables,
        // Give friends time to answer before the ready check runs out.
        [game]: { ...table, readyDeadline: now + READY_LIMIT_MS },
      },
    });
    return true;
  }
  /**
   * Starts the table's next round when it is full and everyone is ready.
   * Returns true when launched, 'balance' when a member cannot pay.
   */
  private startIfAllReady(
    game: GameKind,
    table: LoungeTable,
    now: number,
  ): boolean | "balance" {
    if (
      table.ready.length !== table.required ||
      table.members.length !== table.required ||
      !table.members.every((memberId) => table.ready.includes(memberId))
    )
      return false;
    if (
      table.members.some(
        (memberId) =>
          !this.members.has(memberId) ||
          this.bank.view(this.wallets.get(memberId), now).balance <
            gameReservation(game, table.stake),
      )
    )
      return "balance";
    const request: GameInvite = {
      id: crypto.randomUUID(),
      game,
      from: table.members[0],
      invited: table.members.slice(1),
      accepted: [...table.members],
      declined: [],
      status: "waiting",
      expires: 0,
      matchId: null,
      required: table.required,
      stake: table.stake,
    };
    // launch commits escrow before changing table or match state. Failed
    // storage writes leave the previous ended round and readiness intact.
    this.launch(request, table.round + 1);
    return true;
  }
  /** Fill invites end when their table started, dissolved or was replaced. */
  private cancelStaleFills() {
    let changed = false;
    const invites = this.view.invites.map((r) => {
      if (r.status !== "waiting" || !r.fill) return r;
      const table = this.view.tables[r.game];
      if (
        table &&
        table.matchId === r.fill &&
        !this.gameActive(r.game) &&
        table.members.length < table.required
      )
        return r;
      changed = true;
      return { ...r, status: "cancelled" as const };
    });
    if (changed) this.view = { ...this.view, invites };
  }
  /**
   * Leave every table and seat. Active matches continue: chess resigns unless
   * `keepChess` (connection expiry; the move clock decides), go-stop, poker,
   * blackjack and seotda seats are played automatically to the end.
   */
  private removeSeat(id: string, keepChess = false) {
    const c = this.view.seats.chess.indexOf(id),
      g = this.view.seats.gostop.indexOf(id);
    const chessRunning = c >= 0 && !!this.chess && !this.chess.winner;
    if (chessRunning && keepChess) this.chessAway.add(c);
    else if (chessRunning) {
      const next = chessResign(this.chess!, c)!;
      this.settle("chess", next);
      this.chess = next;
    }
    if (g >= 0 && this.go && this.go.phase !== "over") this.goAway.add(g);
    const p = this.view.seats.poker.indexOf(id);
    if (p >= 0 && this.poker && this.poker.phase !== "over")
      this.pokerAway.add(p);
    const b = this.view.seats.blackjack.indexOf(id);
    if (b >= 0 && this.blackjack && this.blackjack.phase !== "over")
      this.blackjackAway.add(b);
    const s = this.view.seats.seotda.indexOf(id);
    if (s >= 0 && this.seotda && this.seotda.phase !== "over")
      this.seotdaAway.add(s);
    const tables = { ...this.view.tables };
    for (const game of GAME_KINDS) {
      const table = tables[game];
      if (!table?.members.includes(id)) continue;
      if (game === "chess" && chessRunning && keepChess) continue;
      const members = table.members.filter((memberId) => memberId !== id);
      // A finished table stays while anyone is left: its empty seats can be
      // filled by invite until the ready check runs out.
      if (members.length) tables[game] = { ...table, members, ready: [] };
      else delete tables[game];
    }
    const keep = (kind: GameKind, running: boolean) =>
      running
        ? this.view.seats[kind]
        : this.view.seats[kind].map((s) => (s === id ? null : s));
    this.update({
      tables,
      seats: {
        chess: keep("chess", chessRunning && keepChess),
        seotda: keep("seotda", !!this.seotda && this.seotda.phase !== "over"),
        gostop: keep("gostop", !!this.go && this.go.phase !== "over"),
        poker: keep("poker", !!this.poker && this.poker.phase !== "over"),
        blackjack: keep(
          "blackjack",
          !!this.blackjack && this.blackjack.phase !== "over",
        ),
      },
    });
  }
  private drop(id: string, expired = false) {
    this.removeSeat(id, expired);
    this.members.delete(id);
    this.seen.delete(id);
    this.keys.delete(id);
    this.lastChat.delete(id);
    this.lookAt.delete(id);
    this.pendingLooks.delete(id);
    this.update({
      invites: this.view.invites.map((r) => {
        if (r.status !== "waiting") return r;
        if (r.table && r.accepted.includes(id))
          return this.standFromForming(r, id);
        if (r.table)
          return {
            ...r,
            invited: r.invited.filter((p) => p !== id),
            declined: r.declined.filter((p) => p !== id),
          };
        if (r.accepted.includes(id)) return { ...r, status: "cancelled" };
        const invited = r.invited.filter((p) => p !== id),
          declined = r.declined.filter((p) => p !== id);
        return {
          ...r,
          invited,
          declined,
          status:
            1 + invited.length - declined.length < r.required
              ? "cancelled"
              : "waiting",
        };
      }),
    });
  }
  private tick() {
    if (this.view.role === "host") {
      for (const [id, t] of this.seen)
        if (Date.now() - t > 45000) this.drop(id);
      for (const [id, c] of this.challenges)
        if (Date.now() - c.time > 20000) {
          this.challenges.delete(id);
          this.keys.delete(id);
        }
      this.update({
        invites: this.view.invites.map((r) =>
          r.status === "waiting" && r.expires < Date.now()
            ? { ...r, status: "expired" }
            : r,
        ),
      });
      this.sync();
    } else {
      if (Date.now() - this.hostSeen > 45000) {
        this.leave("방장이 마을을 나갔어요. 내 옷장은 저장되어 있습니다.");
        return;
      }
      if (this.view.status === "connected")
        this.send(this.hostId(), { v: 1, type: "ping" });
      else {
        this.hello();
        if (this.pending) void this.sendClaim();
      }
    }
  }
  private async receive(from: string, value: unknown) {
    if (!value || typeof value !== "object") return;
    // The legacy wire envelope is validated per message below and after unseal.
    // oxlint-disable-next-line typescript/no-explicit-any
    let p = value as any;
    if (p.v !== 1) return;
    const generation = this.generation;
    if (p.type === "sealed") {
      const key = this.keys.get(from);
      if (!key) return;
      p = await unseal(key, p);
      if (generation !== this.generation || p.v !== 1) return;
    } else if (!["hello", "join", "lobby", "closed", "leave"].includes(p.type))
      return;
    if (this.view.role === "host") {
      if (p.type === "hello" && p.lounge === 1) {
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
      if (p.type === "join") {
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
            "다른 친구가 먼저 선택했어요. 남아 있는 친구를 골라 주세요.",
          );
          return;
        }
        if (this.members.size >= 7) {
          this.lobby(from, "일곱 자리가 모두 찼어요.");
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
            "이미 접속한 지갑이거나 지갑 소유 확인에 실패했어요.",
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
              : "범 지갑을 저장하지 못했습니다.",
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
      if (p.type === "leave") {
        this.drop(from);
        this.sync();
      } else if (p.type === "action") {
        let ok = false,
          error: string = REJECT.invalid;
        this.rejection = "";
        try {
          ok = this.apply(from, p.action);
          if (!ok && this.rejection) error = this.rejection;
        } catch (e) {
          if (e instanceof Error) error = e.message;
        }
        if (!ok)
          this.send(from, {
            v: 1,
            type: "notice",
            error,
          });
      } else if (p.type === "ping") this.send(from, this.packet(from));
    } else {
      this.hostSeen = Date.now();
      if (p.type === "closed") {
        this.leave("방장이 마을을 나갔어요. 내 옷장은 저장되어 있습니다.");
        return;
      }
      if (p.type === "notice") {
        this.update({
          error: typeof p.error === "string" ? p.error.slice(0, 150) : "",
        });
        return;
      }
      const players = playersRead(p.players);
      if (!players) return;
      if (
        p.type === "lobby" &&
        this.view.status !== "connected" &&
        typeof p.nonce === "string" &&
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
          status: "selecting",
          players,
          error: typeof p.error === "string" ? p.error.slice(0, 150) : "",
          claiming: p.error ? null : this.view.claiming,
        });
      } else if (p.type === "world") {
        if (!players.some((m) => m.id === this.view.self)) {
          if (this.view.status === "connected")
            this.leave(
              "오래 연결이 끊겨 자리가 해제됐어요. 다시 참가해 주세요.",
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
          tables: p.tables && typeof p.tables === "object" ? p.tables : {},
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
