// 파티 테이블: crops from the bag eaten at a no-범 table for a small, visible
// effect (friends' idea: "농작물 색깔 카드 / 먹으면 확률 조작"). Pure rules
// shared by the room (effects), the cloud engine (the bag) and the UI.
// - Only in 파티 판 / 연습 판 rounds: never while 범 is staked.
// - One crop per player per round; every use is written to the table log.
import { PARTY_GAMES, type GameKind } from './lounge-games.ts';
import { josa } from './lounge-text.ts';

export type PartyItem = 'strawberry' | 'carrot' | 'watermelon';
export const PARTY_ITEM_IDS: readonly PartyItem[] = ['strawberry', 'carrot', 'watermelon'];
export const PARTY_PEEK_MS = 5_000;
export const PARTY_EXTEND_MS = 30_000;

export const PARTY_ITEMS: Record<
  PartyItem,
  { name: string; effect: string; games: readonly GameKind[] }
> = {
  strawberry: {
    name: '딸기',
    effect: '상대 패 한 장을 5초 동안 훔쳐봐요. 훔쳐본 건 모두에게 알려져요.',
    games: ['gostop'],
  },
  carrot: {
    name: '당근',
    effect: '굴린 주사위 하나를 한 번 더 굴려요 (굴리기 횟수는 그대로).',
    games: ['yacht'],
  },
  watermelon: {
    name: '수박',
    effect: '지금 흐르는 시간을 30초 늘려요.',
    games: ['yacht', 'gostop', 'liar', 'chess'],
  },
};

export type PartyAction = {
  kind: 'party';
  game: GameKind;
  /** The running match. */
  id: string;
  item: PartyItem;
  /** 딸기: whose hand to peek at (seat). */
  target?: number;
  /** 당근: which die (0–4). */
  die?: number;
};
export type PartyLine = { actor: number; item: PartyItem; text: string; at: number };
/** Per-table party state for the current match (kept in the room snapshot). */
export type PartyState = {
  matchId: string;
  /** Members who already ate something this round. */
  used: string[];
  log: PartyLine[];
  /** 딸기: the card is shown only to `by` (the room filters it out for others). */
  peek?: { by: string; seat: number; card: string; until: number };
};
export type PartyView = Omit<PartyState, 'peek'> & {
  peek?: { by: string; seat: number; until: number; card?: string };
};

export const isPartyItem = (v: unknown): v is PartyItem =>
  typeof v === 'string' && (PARTY_ITEM_IDS as readonly string[]).includes(v);

/** A 파티 판 / 연습 판 table (no 범 at stake) of a game with party items. */
export function partyTable(
  game: GameKind,
  table: { party?: boolean; practice?: boolean; stake: number } | undefined,
  staked: boolean,
): boolean {
  return (
    !!table &&
    !staked &&
    table.stake === 0 &&
    (!!table.party || !!table.practice) &&
    (PARTY_GAMES.includes(game) || !!table.practice)
  );
}

export const PARTY_REJECT = {
  staked: '범이 걸린 판에서는 먹을 수 없어요. 파티 판에서만 돼요.',
  used: '이번 판에는 벌써 하나 먹었어요. 다음 판에 또 먹어요.',
  game: '이 게임에서는 쓸 수 없는 작물이에요.',
  moment: '지금은 효과를 쓸 수 없어요.',
  bag: (item: PartyItem) => `가방에 ${josa(PARTY_ITEMS[item].name, '이/가')} 없어요.`,
} as const;

/** What the table log says (without the peeked card). */
export function partyLine(item: PartyItem, who: string, target?: string, extra = ''): string {
  if (item === 'strawberry') return `${who}님이 딸기를 먹고 ${target ?? '상대'}님의 패 한 장을 훔쳐봤어요`;
  if (item === 'carrot') return `${who}님이 당근을 먹고 주사위 하나를 다시 굴렸어요${extra ? ` (${extra})` : ''}`;
  return `${who}님이 수박을 먹고 시간을 30초 늘렸어요`;
}

/** Views of the party state: the peeked card goes only to the peeker. */
export function partyViewFor(state: PartyState | undefined, member: string, now: number): PartyView | undefined {
  if (!state) return undefined;
  const { peek, ...rest } = state;
  const view: PartyView = structuredClone(rest);
  if (peek && peek.until > now)
    view.peek = { by: peek.by, seat: peek.seat, until: peek.until, ...(peek.by === member ? { card: peek.card } : {}) };
  return view;
}

type BagLike = { produce: Record<string, number> };
/** How many of this crop the bag holds. */
export const partyCount = (bag: BagLike | undefined, item: PartyItem) =>
  Math.max(0, Math.floor(bag?.produce?.[item] ?? 0));
/** The bag after eating one (throws when there is none). */
export function eatPartyItem<B extends BagLike>(bag: B, item: PartyItem): B {
  if (partyCount(bag, item) < 1) throw new Error(PARTY_REJECT.bag(item));
  return { ...bag, produce: { ...bag.produce, [item]: bag.produce[item] - 1 } };
}
