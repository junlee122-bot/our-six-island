// Light, dependency-free game/area constants shared by the lobby UI and the
// engine. Import from here (not lounge-room.ts) in client code so the entry
// chunk does not pull in chess.js and every rules engine.
import type { LoungeView } from './lounge-room.ts';
/** Must equal CHESS_MOVE_MS in lounge-chess.ts (checked by a test). */
const CHESS_MOVE_LIMIT_MS = 120_000;
export type GameKind =
  | 'chess'
  | 'gostop'
  | 'poker'
  | 'blackjack'
  | 'seotda'
  | 'yacht'
  | 'liar'
  | 'liarsbar';
export const GAME_INFO = {
  chess: { name: '체스', symbol: '♞', players: 2, stake: 1000 },
  gostop: { name: '고스톱', symbol: '花', players: 3, stake: 10000 },
  poker: { name: '텍사스 홀덤', symbol: '♠', players: 3, stake: 10000 },
  blackjack: { name: '블랙잭', symbol: '21', players: 3, stake: 1000 },
  seotda: { name: '섯다', symbol: '섯', players: 3, stake: 10000 },
  yacht: { name: '야추', symbol: '야', players: 2, stake: 1000 },
  liar: { name: '라이어 게임', symbol: '?', players: 4, stake: 0 },
  liarsbar: { name: '허풍 카드', symbol: '뻥', players: 4, stake: 0 },
} as const;
export const GAME_KINDS: GameKind[] = [
  'chess',
  'gostop',
  'seotda',
  'poker',
  'blackjack',
  'yacht',
  'liar',
  'liarsbar',
];
export const gameReservation = (game: GameKind, stake: number) =>
  game === 'blackjack' ? stake * 4 : stake;
/**
 * Friend-only tables with no dealer (진행 strip instead of 루미 / 매화).
 * 라이어 게임 never has 범 at stake; 야추 may (winner takes the pot).
 */
export const FRIEND_GAMES: readonly GameKind[] = ['yacht', 'liar', 'liarsbar'];
/** Games that are always played without 범 (every round is a 파티 판). */
export const NO_STAKE_GAMES: readonly GameKind[] = ['liar'];
/**
 * 파티 판: a friends' round with no 범 at stake, where crops from the bag can
 * be eaten for small visible effects (lounge-party.ts). 연습 판 counts too.
 */
export const PARTY_GAMES: readonly GameKind[] = ['yacht', 'gostop', 'liar', 'liarsbar'];
/** Seat range of each flexible table (the table sheet's 인원 chips). */
export const SEAT_RANGE: Partial<Record<GameKind, readonly [number, number]>> = {
  poker: [2, 7],
  blackjack: [2, 7],
  seotda: [2, 7],
  yacht: [2, 4],
  liar: [3, 7],
  liarsbar: [2, 4],
};
/**
 * 혼자 하기: blackjack can be played alone against the dealer (루미) with the
 * usual stake; chess and go-stop have a 연습 판 against the practice AI with
 * no 범 at stake. Everything else needs friends.
 */
export const minPlayers = (game: GameKind) =>
  game === 'blackjack' ? 1 : (SEAT_RANGE[game]?.[0] ?? 2);
/** Most seats a table of this game can have. */
export const maxPlayers = (game: GameKind) => SEAT_RANGE[game]?.[1] ?? 7;
export const PRACTICE_GAMES: readonly GameKind[] = ['chess', 'gostop', 'liarsbar'];
/** Seat ids of the practice AI (never a member id: those are UUIDs). */
export const PRACTICE_AI_PREFIX = 'ai:';
export const isPracticeAi = (id: unknown): id is string =>
  typeof id === 'string' && id.startsWith(PRACTICE_AI_PREFIX);
/** The practice AI's names, seat by seat after mine. */
export const PRACTICE_NAMES: Partial<Record<GameKind, readonly string[]>> = {
  chess: ['루미'],
  gostop: ['매화', '루미'],
  liarsbar: ['루미', '매화', '무쇠'],
};
/** Seat counts a flexible table (poker, blackjack, seotda) can be set up for. */
export const FLEX_GAMES: readonly GameKind[] = [
  'poker',
  'blackjack',
  'seotda',
  'yacht',
  'liar',
  'liarsbar',
];
/**
 * Games whose empty seats a 파티 판 may fill with 대타 봇 (the practice AI):
 * friends start with fewer people and still play the usual table size.
 */
export const BOT_FILL_GAMES: readonly GameKind[] = ['liarsbar'];
export const TABLE_STAKES = [1000, 5000, 10000, 20000, 50000, 100000] as const;
/** High-roller tiers: 50,000 needs this much 범 in the wallet… */
/**
 * Stake chips a game may use instead of TABLE_STAKES (허풍 카드: 1천 / 5천 /
 * 1만 only, never the high-roller tiers; a 파티 판 at 0 is the default).
 */
export const STAKES_FOR: Partial<Record<GameKind, readonly number[]>> = {
  liarsbar: [1000, 5000, 10000],
};
export const stakesOf = (game: GameKind): readonly number[] => STAKES_FOR[game] ?? TABLE_STAKES;
export const HIGH_STAKE_BALANCE = 250_000;
/** …and 100,000 (VIP) also needs the village's '카지노 VIP룸' project. */
export const VIP_STAKE_BALANCE = 500_000;
export const VIP_FLAG = 'vip';
/**
 * Why the table creator cannot pick this stake (null = allowed). Lower tiers
 * are always open; players joining only need the reservation itself.
 */
export function stakeLock(
  stake: number,
  balance: number,
  flags: readonly string[] = [],
): string | null {
  if (stake >= 100_000) {
    if (!flags.includes(VIP_FLAG))
      return '마을 공사 ‘카지노 VIP룸’이 완성되면 열려요.';
    if (balance < VIP_STAKE_BALANCE)
      return `지갑에 ${VIP_STAKE_BALANCE.toLocaleString('en-US')}범 이상 있으면 열려요.`;
  } else if (stake >= 50_000 && balance < HIGH_STAKE_BALANCE)
    return `지갑에 ${HIGH_STAKE_BALANCE.toLocaleString('en-US')}범 이상 있으면 열려요.`;
  return null;
}
/**
 * Which interior holds each game's table (회관: 고스톱·섯다·야추·라이어,
 * 카지노: 체스·홀덤·블랙잭, 허풍 주점: 허풍 카드). See lounge-venues.ts.
 */
export type TableArea = 'lounge' | 'casino' | 'tavern';
export const TABLE_AREA: Record<GameKind, TableArea> = {
  seotda: 'lounge',
  gostop: 'lounge',
  yacht: 'lounge',
  liar: 'lounge',
  liarsbar: 'tavern',
  chess: 'casino',
  poker: 'casino',
  blackjack: 'casino',
};
/** Interior table id carried by a table-forming invite (`invite.table`). */
export const tableIdOf = (game: GameKind) => `${TABLE_AREA[game]}-${game}`;
/** The game of an interior table id, or null when the id is unknown. */
export const gameOfTable = (id: unknown): GameKind | null =>
  (Object.keys(TABLE_AREA) as GameKind[]).find((g) => tableIdOf(g) === id) ??
  null;
/**
 * A forming table (host seated, friends walking up) stays open this long;
 * each new sit or call restarts it.
 */
export const TABLE_FORM_MS = 300_000;
/** Server turn limits. On expiry the server acts for the seat (see hostedTick). */
export const TURN_LIMIT_MS: Record<GameKind, number> = {
  poker: 60_000,
  seotda: 60_000,
  blackjack: 45_000,
  gostop: 45_000,
  chess: CHESS_MOVE_LIMIT_MS,
  yacht: 40_000,
  // 라이어 게임: the hint turn; other phases have their own clocks (lounge-liar.ts).
  liar: 40_000,
  // 허풍 카드: the play turn; reveal / trigger / shot have their own clocks (lounge-liarsbar.ts).
  liarsbar: 30_000,
};
/** Ready check after a round; non-ready members are removed on expiry. */
export const READY_LIMIT_MS = 60_000;
/** Minimum spacing of committed `look` changes per member. */
export const LOOK_THROTTLE_MS = 300;
export type Area = 'village' | 'lounge' | 'casino' | 'tavern' | 'wardrobe' | 'home';
export const AREAS: Area[] = ['village', 'lounge', 'casino', 'tavern', 'wardrobe', 'home'];
/** Where a member stands when they enter an area without coordinates. */
export const AREA_DEFAULTS: Record<Area, { x: number; y: number }> = {
  village: { x: 50, y: 60 },
  // Front left, clear of the hall's 라이어 게임 table (front middle).
  lounge: { x: 28, y: 84 },
  casino: { x: 50, y: 79 },
  // Front left by the door, clear of the 허풍 카드 table (middle).
  tavern: { x: 26, y: 84 },
  wardrobe: { x: 50, y: 79 },
  // Just inside the room's door (see ROOM_DOOR_POINT / roomToNetwork).
  home: { x: 7.5, y: 85.85 },
};
/**
 * Chat follows the area: village and casino chat are separate from the hall,
 * and each friend's room ('home' + owner actor) has its own chat.
 */
export type HomeScope = `home-${number}`;
export type ChatScope = 'village' | 'lounge' | 'casino' | 'tavern' | HomeScope;
export const homeScope = (owner: number): HomeScope => `home-${owner}`;
export const validHomeOwner = (owner: unknown): owner is number =>
  Number.isInteger(owner) && (owner as number) >= 0 && (owner as number) < 7;
export const chatScope = (area: Area, home?: number): ChatScope =>
  area === 'village'
    ? 'village'
    : area === 'casino' || area === 'tavern'
      ? area
      : area === 'home' && validHomeOwner(home)
        ? homeScope(home)
        : 'lounge';
/** Who can walk into a friend's room (stored in the room save and in world.life). */
export type HomeAccess = 'public' | 'friends' | 'closed';
export const HOME_CLOSED = '지금은 방문을 닫아 둔 방이에요.';
export const emptyLoungeView = (): LoungeView => ({
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
    yacht: [null, null],
    liar: [null, null, null, null],
    liarsbar: [null, null, null, null],
  },
  chess: null,
  gostop: null,
  poker: null,
  blackjack: null,
  seotda: null,
  yacht: null,
  liar: null,
  liarsbar: null,
  names: {
    chess: [],
    gostop: [],
    poker: [],
    blackjack: [],
    seotda: [],
    yacht: [],
    liar: [],
    liarsbar: [],
  },
  wallet: {
    balance: 0,
    held: 0,
    history: [],
    daily: { available: false, amount: 0, nextAt: 0 },
  },
  chat: [],
  invites: [],
  tables: {},
});
