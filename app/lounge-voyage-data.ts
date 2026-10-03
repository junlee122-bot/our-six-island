// 먼바다 낚싯배 data (handover/design/design-sea-fishing.md): fares, the
// sailing timetable, seats, the deck's fishing rails, the captain's dawn
// invitation, the 멀미약 and its sellers, and the voyage lines of 샹크스 and
// friends. Pure data plus clock helpers with no engine imports, so
// lounge-life.ts can list the action kinds at load time and lounge-items.ts
// can spread the 멀미약 into its catalogs without an import cycle. The engine
// is lounge-voyage.ts.
import type { ItemDef } from './lounge-items.ts';

const MIN = 60_000,
  HOUR = 60 * MIN,
  DAY = 24 * HOUR,
  KST = 9 * HOUR,
  // The game clock (lounge-calendar.ts, design-game-clock.md): a game day is
  // one real hour from every real hour on the hour, a game hour 2 min 30 s.
  GAME_DAY = HOUR,
  GAME_HOUR = GAME_DAY / 24;

// ---------------------------------------------------------------- fares and clock
/** 승선료 (each friend pays their own seat). */
export const VOYAGE_FARE = 15_000;
/** 새벽 초대 배: this share off the fare (the inviter and the friends they bring). */
export const DAWN_DISCOUNT = 0.3;
export const DAWN_FARE = Math.round((VOYAGE_FARE * (1 - DAWN_DISCOUNT)) / 10) * 10;
/** One voyage a real KST day (a dawn sailing counts), however many game days pass. */
export const VOYAGES_PER_DAY = 1;
/** A sailing lasts this long from its departure (real time: eight game hours, so a dawn boat comes back in the game afternoon). */
export const VOYAGE_MS = 20 * MIN;
/** Boarding opens this long before a departure. */
export const BOARDING_MS = 2 * MIN;
/** Seats per boat. */
export const SEATS = 4;
/**
 * Departures on every game hour from game 05:00 to 19:00 (both included), every
 * game day: fifteen boats a real hour, one every 2 min 30 s (a game half hour
 * would be 75 seconds, too close for the two-minute boarding).
 */
export const FIRST_HOUR = 5;
export const LAST_HOUR = 19;
export const SAILING_STEP_MS = GAME_HOUR;
/** The cast-out animation before the deck shows (client only). */
export const SAIL_OUT_MS = 3_000;
/** Unlock: the 항구 구역 flag and 낚시 Lv. */
export const VOYAGE_LEVEL = 4;
/** On the boat: rain brings bites this much sooner (×1/1.15), the treasure chest +5%p. */
export const RAIN_BITE = 1.15;
export const OFFSHORE_TREASURE = 5;
/** Dawn sailing: legends a little likelier (×1.2). */
export const DAWN_LEGEND = 1.2;

// ---------------------------------------------------------------- dawn invitation
/** The captain knocks for friends with this many voyage days in the last seven (today not counted). */
export const REGULAR_TRIPS = 4;
export const REGULAR_DAYS = 7;
/**
 * Game hours [from, to) when the captain comes to the door: the next game dawn
 * while the friend is in the village (a real hour never passes without one).
 */
export const DAWN_HOURS = [5, 7] as const;
/** The dawn boat leaves this long after the invitation is accepted. */
export const DAWN_LEAD_MS = 3 * MIN;
/** Friends the inviter may bring along. */
export const DAWN_GUESTS = 3;

// ---------------------------------------------------------------- 멀미약
export const PILL = 'seasick-pill';
export const PILL_PRICE = 1_500;
/**
 * Who sells the 멀미약 and where they stand. 'mercy' (의사 메르시) sells it
 * inside her 메르시 의원 (the stage-3 'clinic' room on the 산기슭); a seller is
 * active only while that id is in the NPC registry (lounge-npc-data NPC_IDS).
 */
export const PILL_SELLERS: readonly { npc: string; area: 'hillside' | 'clinic'; label: string }[] = [
  { npc: 'tsunade', area: 'hillside', label: '츠나데 텃밭' },
  { npc: 'mercy', area: 'clinic', label: '메르시 의원' },
];
export const VOYAGE_TOOL_ITEMS: readonly ItemDef[] = [
  { id: PILL, name: '멀미약', emoji: '', cat: 'tool', kind: 'tool', sell: 0, note: '먹은 날(자정까지) 배가 덜 흔들려요 · 손맛 칸 출렁임도 멈춰요' },
];
export const VOYAGE_ITEM_PRICES: Readonly<Record<string, number>> = { [PILL]: PILL_PRICE };

// ---------------------------------------------------------------- deck
/** The deck: about 6 × 14 tiles (x across, z bow → stern toward the camera). */
export const DECK_W = 6,
  DECK_D = 14;
/** Fishing places along the rails (two per side, bow and stern): four friends fish at once. */
export const DECK_RAILS: readonly { id: string; x: number; z: number; side: -1 | 1 | 0; label: string }[] = [
  { id: 'port-bow', x: -2.2, z: -3.4, side: -1, label: '왼쪽 뱃전에서 낚시' },
  { id: 'star-bow', x: 2.2, z: -3.4, side: 1, label: '오른쪽 뱃전에서 낚시' },
  { id: 'port-stern', x: -2.2, z: 3.6, side: -1, label: '왼쪽 고물에서 낚시' },
  { id: 'star-stern', x: 2.2, z: 3.6, side: 1, label: '오른쪽 고물에서 낚시' },
];
export const RAIL_REACH = 1.3;

// ---------------------------------------------------------------- actions
export const VOYAGE_ACTION_KINDS = ['voyageBoard', 'voyageLeave', 'voyageDone', 'voyageInvite', 'pillBuy', 'pillTake'] as const;
export type VoyageAction =
  /** Board the next departure at the pier (or the dawn boat I was invited onto: `dawn` = its id). */
  | { kind: 'voyageBoard'; dawn?: string }
  /** 그만 돌아가기 (no refund), or step off before the boat leaves (refund). */
  | { kind: 'voyageLeave' }
  /** Close the catch summary after coming back. */
  | { kind: 'voyageDone' }
  /** The captain's dawn knock: yes (with up to three friends) or no. */
  | { kind: 'voyageInvite'; answer: 'yes' | 'no'; guests?: number[] }
  | { kind: 'pillBuy'; from: string; n?: number }
  | { kind: 'pillTake' };
export const isVoyageAction = (a: unknown): a is VoyageAction =>
  !!a && typeof a === 'object' && (VOYAGE_ACTION_KINDS as readonly string[]).includes((a as { kind?: unknown }).kind as string);

// ---------------------------------------------------------------- clock helpers
export const kstDayOf = (now: number) => Math.floor((now + KST) / DAY);
/** Game day number and game hour (lounge-calendar gameDay / gameHour, without the import). */
export const gameDayOf = (now: number) => Math.floor(now / GAME_DAY);
export const gameHourOf = (now: number) => Math.floor((((now % GAME_DAY) + GAME_DAY) % GAME_DAY) / GAME_HOUR);
/** Every departure of a game day (epoch ms). */
export function sailingsOf(gameDay: number): number[] {
  const out: number[] = [];
  for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) out.push(gameDay * GAME_DAY + h * SAILING_STEP_MS);
  return out;
}
/** The departure whose boarding is open at `now` (null between windows). */
export function boardingSailing(now: number): number | null {
  return sailingsOf(gameDayOf(now)).find((t) => now >= t - BOARDING_MS && now < t) ?? null;
}
/** The next departure after `now` (this game day or the next one's first). */
export function nextSailing(now: number): number {
  const g = gameDayOf(now);
  return sailingsOf(g).find((t) => t > now) ?? sailingsOf(g + 1)[0];
}
export const sailingId = (dep: number) => `s${Math.floor(dep / MIN)}`;
export const dawnId = (dep: number, actor: number) => `d${Math.floor(dep / MIN)}a${actor}`;
export const inDawnHours = (now: number) => {
  const h = gameHourOf(now);
  return h >= DAWN_HOURS[0] && h < DAWN_HOURS[1];
};

// ---------------------------------------------------------------- lines
/** What residents say about the boat (shown on the boarding board, the knock and the summary). */
export const VOYAGE_LINES = {
  captain: {
    board: ['먼바다 가는 배다! 자리 넷, 늦으면 다음 배 타면 돼. 하하!', '배 타기 전에 화장실 다녀와라. 바다 한가운데엔 없거든.', '오늘 바다 기분은 좋아 보인다. 고기 기분은 가 봐야 알지.'],
    storm: ['오늘은 결항이다. 바다가 성났을 땐 기다려 주는 게 예의야.', '폭풍 앞에선 나도 주점에 있는다. 내일 같이 나가자.'],
    sail: ['닻 올려라! 방파제만 지나면 바다가 달라진다.', '꽉 잡아라, 다들! 출항이다! 다하하!'],
    back: ['돌아왔다! 오늘 어획이면 주점에서 잔치 열 만하다.', '뭍이다! 다리가 아직 출렁이지? 그게 바다 맛이다.'],
    knock: ['오늘 새벽 배, 먼저 갈래? 단골한테만 묻는 거다.', '{me}, 일어났어? 새벽 물때가 딱이다. 같이 가자.'],
    decline: ['그래, 오늘은 푹 자라. 바다는 어디 안 가. 다음에 또 두드릴게.'],
    sick: ['멀미 나면 수평선을 봐라. 그래도 나면… 츠나데 할멈 약이 잘 듣는다.'],
  },
  gabung: {
    tomorrow: ['내일 바다 예보! 배 뜨는 날이에요.', '내일은 폭풍이에요. 샹크스 선장님 배는 결항이래요!'],
  },
  lux: {
    buy: ['먼바다 물건이네! 경매장보다 내가 먼저 봐야지.', '이 녀석들 어디서 낚았어? 아, 선장님 배구나.'],
  },
  rose: {
    fare: ['승선료가 모자라? 이자는 바닷바람처럼 시원하게 붙여 줄게.'],
  },
  tsunade: {
    pill: ['멀미약이다. 먹고 하루는 배가 덜 흔들릴 거다. 술이랑은 같이 먹지 마라.', '배 타는 놈들은 꼭 와서 이걸 사 가더구나.'],
  },
  mercy: {
    pill: ['멀미약이에요. 배 타기 30분 전에 드세요. 자정까지 괜찮을 거예요.', '먼바다 나가요? 무리하지 말고, 속 울렁거리면 바로 돌아와요.'],
  },
} as const;
