// Pure helpers for the interior tables (step 2 of the game-flow redesign):
// what each table in the hall / casino shows, and what the action button does
// next to it. Games start by sitting at a table (a table-forming invite).
import {
  GAME_INFO,
  TABLE_AREA,
  tableIdOf,
  type GameKind,
  type TableArea,
} from './lounge-games.ts';
import type { GameInvite, LoungeView } from './lounge-room.ts';
import { formatBeom } from './lounge-text.ts';

export type TablePhase = 'empty' | 'forming' | 'playing' | 'retained';

export type TableState = {
  game: GameKind;
  area: TableArea;
  id: string;
  phase: TablePhase;
  /** The forming table (or a fill invite for a retained one). */
  invite: GameInvite | null;
  /** Who sits there now (forming: seated; playing: seats; retained: members). */
  occupants: string[];
  /** Seats the table has (forming / retained / playing). */
  required: number;
  stake: number | null;
  /** I sit at this forming table. */
  seated: boolean;
  /** I play at (or am kept at) this table's running / finished match. */
  member: boolean;
  /** A friend called me to this forming table and I have not answered. */
  called: boolean;
  /** A retained table's fill invite that names me. */
  fill: GameInvite | null;
  /** 연습 판 against the practice AI (no 범 at stake). */
  practice: boolean;
};

type View = Pick<
  LoungeView,
  'invites' | 'seats' | 'tables' | 'self' | 'status'
> &
  Partial<Pick<LoungeView, GameKind>>;

const active = (view: View, game: GameKind) => {
  const match = view[game];
  if (!match) return false;
  return game === 'chess'
    ? !(match as NonNullable<LoungeView['chess']>).winner
    : (match as { phase?: string }).phase !== 'over';
};

/** The waiting table-forming invite at this game's interior table, if any. */
export const formingInvite = (view: Pick<View, 'invites'>, game: GameKind) =>
  view.invites.find(
    (r) =>
      r.status === 'waiting' && r.game === game && r.table === tableIdOf(game),
  ) ?? null;

export function tableState(view: View, game: GameKind): TableState {
  const area = TABLE_AREA[game],
    id = tableIdOf(game),
    self = view.self;
  const connected = view.status === 'connected';
  const table = connected ? view.tables?.[game] : undefined;
  const seats = connected ? (view.seats?.[game] ?? []) : [];
  const forming = connected ? formingInvite(view, game) : null;
  const fill = connected
    ? (view.invites.find(
        (r) =>
          r.status === 'waiting' &&
          r.game === game &&
          !!r.fill &&
          r.invited.includes(self) &&
          !r.accepted.includes(self) &&
          !r.declined.includes(self),
      ) ?? null)
    : null;
  const base = {
    game,
    area,
    id,
    fill,
    seated: false,
    called: false,
    member: false,
    practice: !!table?.practice,
  };
  if (connected && active(view, game)) {
    const occupants = seats.filter((s): s is string => !!s);
    return {
      ...base,
      phase: 'playing',
      invite: null,
      occupants,
      required: table?.required ?? occupants.length,
      stake: table?.stake ?? null,
      member:
        (!!table && table.members.includes(self)) ||
        (!table && seats.includes(self)),
    };
  }
  if (table?.members.length)
    return {
      ...base,
      phase: 'retained',
      invite: fill,
      occupants: [...table.members],
      required: table.required,
      stake: table.stake,
      member: table.members.includes(self),
    };
  if (forming)
    return {
      ...base,
      phase: 'forming',
      invite: forming,
      occupants: [...forming.accepted],
      required: forming.required,
      stake: forming.stake,
      seated: forming.accepted.includes(self),
      called:
        forming.invited.includes(self) &&
        !forming.accepted.includes(self) &&
        !forming.declined.includes(self),
    };
  return {
    ...base,
    phase: 'empty',
    invite: null,
    occupants: [],
    required: GAME_INFO[game].players,
    stake: null,
  };
}

export type TableActionKind = 'sit' | 'join' | 'watch' | 'resume' | 'stand';

/** What pressing the action button (E) next to this table does. */
export function tableAction(state: TableState): TableActionKind {
  if (state.phase === 'forming') return state.seated ? 'stand' : 'join';
  if (state.phase === 'playing') return state.member ? 'resume' : 'watch';
  if (state.phase === 'retained')
    return state.member ? 'resume' : state.fill ? 'join' : 'watch';
  return 'sit';
}

export const TABLE_ACTION_LABEL: Record<TableActionKind, string> = {
  sit: '앉기',
  join: '자리 잡기',
  watch: '구경하기',
  resume: '이어하기',
  stand: '일어나기',
};

/**
 * The table's label in the scene, e.g. "섯다 · 1/3명 · 5,000범 · 앉기".
 * `status` is the middle part without the game name or the action.
 */
export function tableLabel(state: TableState): {
  status: string;
  text: string;
} {
  const name = GAME_INFO[state.game].name;
  // 파티 판 / 라이어 게임: nothing staked.
  const stake = state.stake === 0 ? '파티 판' : state.stake !== null ? formatBeom(state.stake) : '';
  const status =
    state.phase === 'forming'
      ? `${state.occupants.length}/${state.required}명 · ${stake}`
      : state.phase === 'playing'
        ? state.practice
          ? '연습 중'
          : '게임 중'
        : state.phase === 'retained'
          ? state.practice
            ? '연습 · 다음 판 준비'
            : `다음 판 준비 · ${state.occupants.length}/${state.required}명`
          : '빈 테이블';
  const action =
    state.phase === 'forming' && !state.seated
      ? '앉기'
      : state.phase === 'forming'
        ? '내 자리'
        : TABLE_ACTION_LABEL[tableAction(state)];
  return { status, text: `${name} · ${status} · ${action}` };
}

/** Short place name for banners ("도원이 회관 섯다 테이블로 불렀어요"). */
export const TABLE_PLACE: Record<TableArea, string> = {
  lounge: '회관',
  casino: '카지노',
};

/** The forming table I sit at (at most one: seats make me busy). */
export const mySeat = (view: View) =>
  view.invites.find(
    (r) =>
      r.status === 'waiting' && !!r.table && r.accepted.includes(view.self),
  ) ?? null;
