// Light, dependency-free game/area constants shared by the lobby UI and the
// engine. Import from here (not lounge-room.ts) in client code so the entry
// chunk does not pull in chess.js and every rules engine.
import type { LoungeView } from './lounge-room.ts';
/** Must equal CHESS_MOVE_MS in lounge-chess.ts (checked by a test). */
const CHESS_MOVE_LIMIT_MS = 120_000;
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
/** Seat counts a flexible table (poker, blackjack, seotda) can be set up for. */
export const FLEX_GAMES: readonly GameKind[] = ['poker', 'blackjack', 'seotda'];
export const TABLE_STAKES = [1000, 5000, 10000, 20000] as const;
/** Which interior holds each game's table (회관: 고스톱·섯다, 카지노: the rest). */
export type TableArea = 'lounge' | 'casino';
export const TABLE_AREA: Record<GameKind, TableArea> = {
  seotda: 'lounge',
  gostop: 'lounge',
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
};
/** Ready check after a round; non-ready members are removed on expiry. */
export const READY_LIMIT_MS = 60_000;
/** Minimum spacing of committed `look` changes per member. */
export const LOOK_THROTTLE_MS = 300;
export type Area = 'village' | 'lounge' | 'casino' | 'wardrobe' | 'home';
export const AREAS: Area[] = ['village', 'lounge', 'casino', 'wardrobe', 'home'];
/** Where a member stands when they enter an area without coordinates. */
export const AREA_DEFAULTS: Record<Area, { x: number; y: number }> = {
  village: { x: 50, y: 60 },
  lounge: { x: 50, y: 79 },
  casino: { x: 50, y: 79 },
  wardrobe: { x: 50, y: 79 },
  // Just inside the room's door (see ROOM_DOOR_POINT / roomToNetwork).
  home: { x: 7.5, y: 85.85 },
};
/**
 * Chat follows the area: village and casino chat are separate from the hall,
 * and each friend's room ('home' + owner actor) has its own chat.
 */
export type HomeScope = `home-${number}`;
export type ChatScope = 'village' | 'lounge' | 'casino' | HomeScope;
export const homeScope = (owner: number): HomeScope => `home-${owner}`;
export const validHomeOwner = (owner: unknown): owner is number =>
  Number.isInteger(owner) && (owner as number) >= 0 && (owner as number) < 7;
export const chatScope = (area: Area, home?: number): ChatScope =>
  area === 'village'
    ? 'village'
    : area === 'casino'
      ? 'casino'
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
  },
  chess: null,
  gostop: null,
  poker: null,
  blackjack: null,
  seotda: null,
  names: { chess: [], gostop: [], poker: [], blackjack: [], seotda: [] },
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
