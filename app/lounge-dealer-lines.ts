// Table hosts' voices: 루미 (별빛 카지노 딜러: 블랙잭·홀덤) and 매화 (화투방 진행자:
// 섯다·고스톱). The engines only emit facts (events); every line here is built
// from the public view, so no hidden card can leak through a sentence.
// Variety comes from curated pools chosen by hash(matchId + revision + event):
// every client picks the same line for the same moment, no server call, no LLM.
// Tone: 해요체, short, calm and kind. Never nudge anyone to bet more or play
// again, never judge a hand that is not open, never hint at hidden cards.
import type { BlackjackView } from './lounge-blackjack.ts';
import type { PokerView } from './lounge-poker.ts';
import type { SeotdaView } from './lounge-seotda.ts';
import { blackjackValue } from './lounge-blackjack.ts';
import {
  finalConsonant,
  formatBeom,
  josa,
  particle,
  type JosaPair,
} from './lounge-text.ts';

export type DealerMood = 'calm' | 'smile' | 'wow' | 'sorry' | 'focus';
export type DealerLine = { text: string; mood: DealerMood };
export const HOSTS = {
  lumi: { name: '루미', title: '별빛 카지노 딜러' },
  maehwa: { name: '매화', title: '화투방 진행자' },
} as const;

/** FNV-1a 32-bit: stable across browsers and the server. */
export function lineHash(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
/** Deterministic choice: same key, same line on every client. */
export function pickLine<T>(pool: readonly T[], key: string): T {
  return pool[lineHash(key) % pool.length];
}
/**
 * Fills `{name}` and `{name|이/가}` (word + correct particle) placeholders.
 * Unknown keys stay visible so a missing value is caught by tests.
 */
export function fillLine(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)(?:\|([^}]+))?\}/g, (all, key, pair) => {
    if (!(key in vars)) return all;
    const word = String(vars[key]);
    return pair ? word + particle(word, pair as JosaPair) : word;
  });
}
export const beomText = (n: number) => formatBeom(n);
/** '도원 님' — how the hosts address a player. */
export const sir = (name: string | undefined) => `${name || '친구'} 님`;
/** Sentence subject for a seat: '내가' for the viewer, else '도원 님이'. */
export const subject = (seat: number, viewer: number, names: string[]) =>
  seat >= 0 && seat === viewer ? '내가' : josa(sir(names[seat]), '이/가');

/** Curated pools. Every entry must pass FORBIDDEN_LINE (tested). */
export const DEALER_LINES = {
  greet: [
    '{names}, 어서 오세요. 카드 나눠 드릴게요.',
    '{names}, 반가워요. 오늘 테이블은 제가 맡을게요.',
    '{names}, 어서 오세요. 편하게 즐겨 주세요.',
    '{names}, 자리해 주셔서 고마워요. 시작할게요.',
  ],
  greetRound: [
    '{names}, 다시 만나 반가워요. {round}번째 판이에요.',
    '{names}, {round}번째 판이에요. 이번에도 제가 나눌게요.',
    '{round}번째 판이에요. {names}, 편하게 즐겨 주세요.',
  ],
  bigPot: [
    '팟이 꽤 커졌어요.',
    '테이블이 조용해졌네요. 팟이 커졌어요.',
    '모두 집중하고 있네요.',
  ],
  allIn: [
    '테이블이 조용해졌어요.',
    '모두의 시선이 모였어요.',
    '긴장되는 순간이에요.',
  ],
  consolation: [
    '오늘 카드가 좀 심술궂네요.',
    '속상하죠. 쉬어 가도 괜찮아요.',
    '카드가 도와주지 않는 날도 있어요.',
  ],
  dealerBustStreak: [
    '오늘 제 손이 영 말을 안 듣네요.',
    '제가 또 넘겼네요. 오늘은 카드가 저를 싫어하나 봐요.',
    '딜러 체면이 말이 아니에요.',
  ],
  dealerHit: [
    '한 장 더 받을게요… {card}! 합계 {total|이에요/예요}.',
    '한 장 더요… {card}, 합계 {total|이에요/예요}.',
    '딜러 한 장 더. {card}{extra}, 합계 {total|이에요/예요}.',
  ],
  dealerStand: [
    '{total}, 여기서 멈출게요.',
    '딜러 {total|이에요/예요}. 여기서 멈출게요.',
    '{total|이/가} 됐어요. 딜러는 여기서 멈춰요.',
  ],
  dealerBust: [
    '{card}! 앗, {total|으로/로} 버스트예요.',
    '앗, {card}… {total|으로/로} 버스트예요.',
    '{card}{extra}… 딜러 {total}, 버스트예요.',
  ],
  win: [
    '축하해요!',
    '멋진 승부였어요.',
    '좋은 흐름이었어요.',
  ],
  thanks: [
    '모두 수고했어요.',
    '함께해 줘서 고마워요.',
    '오늘도 즐거운 테이블이었어요.',
  ],
  reaction: {
    laugh: ['하하, 저도 웃음이 나요.', '테이블 분위기 좋네요.'],
    wow: ['저도 깜짝 놀랐어요!', '정말 놀라운 장면이었죠.'],
    cry: ['괜찮아요, 속상한 마음 알아요.', '토닥토닥, 여기 있어요.'],
    love: ['고마워요, 저도 이 테이블이 좋아요.', '마음 잘 받았어요.'],
    cheer: ['고마워요! 멋진 테이블이에요.', '박수 고마워요.'],
    think: ['천천히 생각해도 괜찮아요.', '고민되는 순간이죠.'],
    sorry: ['괜찮아요, 누구나 그럴 때가 있어요.', '마음 쓰지 않아도 돼요.'],
    hello: ['{who}, 반가워요!', '{who}, 안녕하세요!'],
    jeje: ['{who}, 제제 왔군요! 반가워요.', '네, 딱 알아봤어요. {who}!'],
    yoi: ['좋아요, 준비됐어요!', '출발 신호 잘 받았어요.'],
    eum: ['천천히 생각해도 괜찮아요.', '고민되는 순간이죠.'],
    aye: ['네, 정말이에요!', '저도 조금 놀랐어요.'],
    nonono: ['알겠어요, 아닌 걸로 할게요.', '네네, 괜찮아요. 진정해요!'],
  },
  gostop: {
    start: [
      '{names}, 어서 오세요. 패를 나눠 드렸어요.',
      '{names}, 반가워요. 오늘 화투방은 제가 맡을게요.',
    ],
    turn: ['{who} 차례예요.', '이제 {who} 차례예요.'],
    mine: ['내 차례예요. 천천히 골라 주세요.', '내 차례예요. 낼 패를 골라 주세요.'],
    decide: [
      '{who}, 고 할지 스톱할지 정해 주세요.',
      '{who}의 선택을 기다릴게요.',
    ],
    over: ['모두 수고했어요.', '함께해 줘서 고마워요.'],
  },
} as const;

/**
 * Lines that push play or money, or hint at hidden information. Used by the
 * tests over every pool and every generated sentence.
 */
export const FORBIDDEN_LINE =
  /한 ?판 더|한 ?번 더 해|더 걸어|걸어 ?보|베팅해 ?보|레이즈해 ?보|올인해 ?보|올인하세요|질러|지르|만회|본전|다시 도전|이번엔 꼭|숨어 있을지도|좋은 카드가 숨|노려 ?보/;

/** Every string in DEALER_LINES (for tests). */
export function allPoolLines(): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(DEALER_LINES);
  return out;
}

// ---------------------------------------------------------------------------
// Cards
const RANKS = '23456789TJQKA';
const SUITS = ['♣', '♦', '♥', '♠'];
/** 'A♠', '10♥' for blackjack (0..311) and poker (0..51) cards. */
export function cardName(card: number): string {
  const c = card % 52,
    r = RANKS[c % 13];
  return (r === 'T' ? '10' : r) + SUITS[Math.floor(c / 13)];
}
const listNames = (names: string[]) => names.map(sir).join(', ');

// ---------------------------------------------------------------------------
// Blackjack
/** One notation everywhere: '블랙잭', '소프트 17', '24 버스트', '19'. */
export function blackjackTotalLabel(cards: number[], split = false): string {
  const v = blackjackValue(cards);
  if (!split && cards.length === 2 && v.total === 21) return '블랙잭';
  if (v.bust) return `${v.total} 버스트`;
  return v.soft ? `소프트 ${v.total}` : String(v.total);
}
export type BlackjackHandReport = {
  seat: number;
  hand: number;
  name: string;
  label: string;
  bet: number;
  doubled: boolean;
  outcome: '' | 'win' | 'lose' | 'push' | 'blackjack';
  amount: number;
  /** Why: '20 > 딜러 19', '딜러 버스트', '블랙잭 3:2 지급'… */
  reason: string;
};
/** Per-hand explanation of a finished round (H2). */
export function blackjackHandReports(
  g: Pick<BlackjackView, 'hands' | 'dealer' | 'stake' | 'phase'>,
  names: string[],
): BlackjackHandReport[] {
  const dealer = g.dealer.filter((c): c is number => c !== null),
    d = blackjackValue(dealer),
    dealerNatural = dealer.length === 2 && d.total === 21;
  return g.hands.flatMap((hands, seat) =>
    hands.map((h, hand) => {
      const v = blackjackValue(h.cards),
        label = blackjackTotalLabel(h.cards, h.split);
      const reason = v.bust
        ? `${v.total}로 먼저 버스트`
        : dealerNatural
          ? h.status === 'blackjack'
            ? '둘 다 블랙잭이라 푸시'
            : '딜러 블랙잭'
          : h.status === 'blackjack'
            ? `블랙잭 3:2 지급 (${formatBeom(h.bet)}의 1.5배)`
            : d.bust
              ? `딜러 ${d.total} 버스트`
              : v.total > d.total
                ? `${v.total} > 딜러 ${d.total}`
                : v.total < d.total
                  ? `${v.total} < 딜러 ${d.total}`
                  : `딜러와 같은 ${v.total}`;
      return {
        seat,
        hand,
        name: names[seat] ?? `참가자 ${seat + 1}`,
        label,
        bet: h.bet,
        doubled: h.bet > g.stake,
        outcome: h.outcome,
        amount: h.result,
        reason,
      };
    }),
  );
}
/**
 * One-sentence rule for how the hands were judged against the dealer. With
 * `hands`, a round where no hand needed the dealer (all bust / blackjack)
 * says so instead of quoting a dealer total nobody was compared with.
 */
export function blackjackVerdict(
  dealer: (number | null)[],
  hands?: BlackjackView['hands'],
): string {
  const cards = dealer.filter((c): c is number => c !== null),
    d = blackjackValue(cards);
  if (cards.length === 2 && d.total === 21)
    return '딜러 블랙잭! 블랙잭 손은 푸시, 나머지 손은 패배예요.';
  const all = hands?.flat() ?? [];
  if (all.length && all.every((h) => h.status === 'bust' || h.status === 'blackjack')) {
    const bj = all.some((h) => h.status === 'blackjack'),
      bust = all.some((h) => h.status === 'bust');
    return bj && bust
      ? '블랙잭 손은 3:2로 이기고, 버스트한 손은 딜러와 상관없이 패배예요.'
      : bj
        ? '블랙잭 손은 모두 3:2로 이겨요.'
        : '버스트한 손은 딜러와 상관없이 패배예요.';
  }
  if (d.bust)
    return `딜러 ${d.total} 버스트! 버스트하지 않은 손은 모두 이겨요.`;
  if (d.total >= 21)
    return '딜러 21: 블랙잭 손은 이기고, 21은 푸시, 나머지 손은 패배예요.';
  return `딜러 ${d.total}: ${d.total + 1} 이상 승리 · ${d.total} 푸시 · ${d.total - 1} 이하 패배예요.`;
}
export type TableMemory = {
  /** Consecutive losing rounds per player name. */
  losses: Record<string, number>;
  /** Consecutive blackjack rounds where the dealer busted. */
  dealerBusts: number;
  /** Match ids already counted. */
  seen: string[];
};
export const newTableMemory = (): TableMemory => ({
  losses: {},
  dealerBusts: 0,
  seen: [],
});
/** Folds one finished round into the table memory (idempotent per match). */
export function rememberRound(
  memory: TableMemory,
  matchId: string,
  names: string[],
  results: number[],
  dealerBust?: boolean,
): TableMemory {
  if (memory.seen.includes(matchId)) return memory;
  const losses = { ...memory.losses };
  names.forEach((n, i) => {
    losses[n] = (results[i] ?? 0) < 0 ? (losses[n] ?? 0) + 1 : 0;
  });
  return {
    losses,
    dealerBusts:
      dealerBust === undefined
        ? memory.dealerBusts
        : dealerBust
          ? memory.dealerBusts + 1
          : 0,
    seen: [...memory.seen, matchId].slice(-20),
  };
}
export type DealerContext = {
  /** Table round (1 = first 판). */
  round?: number;
  memory?: TableMemory;
  /** Beginner tips (settings toggle, default off). */
  tips?: boolean;
};
function actionsText(legal: BlackjackView['legal']) {
  const list = [
    legal.hit && '히트',
    legal.stand && '스탠드',
    legal.double && '더블다운',
    legal.split && '스플릿',
  ].filter(Boolean) as string[];
  return list.length > 2
    ? `${list.slice(0, -1).join('·')}${particle(list.at(-2)!, '과/와')} ${list.at(-1)} 중에서 골라 주세요.`
    : '히트나 스탠드를 골라 주세요.';
}
/** '7이면', '9면', 'A면' (conditional ending after a card value). */
const ifText = (word: string) => word + (finalConsonant(word) === 0 ? '면' : '이면');
/** Beginner hint: hit/stand only (never double/split: no nudge to bet more). */
export function blackjackTip(cards: number[], up: number | null): string {
  if (up === null || cards.length < 2) return '';
  const v = blackjackValue(cards),
    upValue = up % 13 === 12 ? 11 : Math.min((up % 13) + 2, 10),
    upText = upValue === 11 ? 'A' : String(upValue);
  if (v.bust || v.total >= 21) return '';
  if (v.soft)
    return v.total >= 19
      ? `팁: 소프트 ${v.total}은 보통 스탠드해요.`
      : v.total <= 17
        ? `팁: 소프트 ${v.total}은 A를 1로 셀 수 있어 한 장 더 받아도 버스트하지 않아요.`
        : '';
  if (v.total >= 17) return `팁: ${v.total} 이상은 보통 스탠드해요.`;
  if (v.total <= 11)
    return `팁: ${v.total} 이하는 한 장 더 받아도 버스트하지 않아요.`;
  if (upValue >= 7)
    return `팁: 딜러 업카드가 ${ifText(upText)} 보통 ${v.total}에서 히트해요.`;
  if (v.total >= 13 || upValue >= 4)
    return `팁: 딜러 업카드가 ${ifText(upText)} 딜러가 버스트하기 쉬워서 보통 ${v.total}에서 스탠드해요.`;
  return `팁: 딜러 업카드가 ${ifText(upText)} 12에서는 보통 히트해요.`;
}
/** Lumi's line for the current blackjack moment (H3, M4/M5, M7). */
export function blackjackLine(
  g: BlackjackView,
  seat: number,
  names: string[],
  ctx: DealerContext = {},
): DealerLine {
  const key = `${g.id}:${g.revision}:${g.event.kind}`,
    e = g.event,
    subj = subject(e.seat, seat, names),
    dealer = g.dealer.filter((c): c is number => c !== null),
    dv = blackjackValue(dealer),
    dealerLabel = blackjackTotalLabel(dealer);
  const handName = (s: number, h: number) =>
    g.hands[s]?.length === 2 ? `${h + 1}번 손` : '';
  const turnLine = () => {
    if (g.phase !== 'players' || g.turn < 0) return '';
    const hand = handName(g.turn, g.hand);
    if (g.turn === seat) {
      const mine = `내${hand ? ' ' + hand : ''} 차례예요. ${actionsText(g.legal)}`;
      const tip = ctx.tips
        ? blackjackTip(g.hands[seat]?.[g.hand]?.cards ?? [], g.dealer[0])
        : '';
      return tip ? `${mine} ${tip}` : mine;
    }
    return `이제 ${sir(names[g.turn])}${hand ? '의 ' + hand : ''} 차례예요.`;
  };
  const say = (text: string, mood: DealerMood = 'calm'): DealerLine => ({
    text: text.replace(/\s+/g, ' ').trim(),
    mood,
  });
  const extras: string[] = [];
  if (g.phase === 'over') {
    const verdict = blackjackVerdict(g.dealer, g.hands);
    const step =
      e.kind === 'dealer-bust'
        ? fillLine(pickLine(DEALER_LINES.dealerBust, key), {
            card: cardName(e.card ?? dealer.at(-1) ?? 0),
            total: e.total ?? dv.total,
            extra: '',
          })
        : e.kind === 'dealer-stand'
          ? dealer.length === 2 // stood on the first two: the reveal said so
            ? ''
            : fillLine(pickLine(DEALER_LINES.dealerStand, key), {
                total: dealerLabel,
              })
          : e.kind === 'dealer-skip'
            ? g.hands.every((hs) => hs.every((h) => h.status === 'blackjack'))
              ? '모두 블랙잭이라 카드를 더 받지 않을게요.'
              : g.hands.every((hs) => hs.every((h) => h.status === 'bust'))
                ? '모두 버스트해서 카드를 더 받지 않을게요.'
                : '남은 손이 모두 블랙잭이거나 버스트라 카드를 더 받지 않을게요.'
            : '';
    // A dealer bust already says so in the step; keep the rule part only.
    const rule = e.kind === 'dealer-bust' ? '버스트하지 않은 손은 모두 이겨요.' : verdict;
    const me = seat >= 0 ? (g.result[seat] ?? 0) : 0;
    if (ctx.memory && dv.bust && ctx.memory.dealerBusts >= 2)
      extras.push(pickLine(DEALER_LINES.dealerBustStreak, key + ':streak'));
    else if (
      ctx.memory &&
      seat >= 0 &&
      me < 0 &&
      (ctx.memory.losses[names[seat]] ?? 0) >= 3
    )
      extras.push(pickLine(DEALER_LINES.consolation, key + ':sorry'));
    return say(
      [step, rule, ...extras].filter(Boolean).join(' '),
      dv.bust ? 'wow' : me < 0 ? 'sorry' : me > 0 ? 'smile' : 'calm',
    );
  }
  if (g.phase === 'reveal')
    return say(
      e.kind === 'deal'
        ? '딜러의 첫 두 장을 확인했어요. 숨긴 카드를 바로 열게요.'
        : '모두 선택을 마쳤어요. 이제 숨긴 카드를 열게요.',
      'focus',
    );
  if (g.phase === 'dealer' || g.phase === 'settling') {
    if (e.kind === 'reveal') {
      const next =
        dealer.length === 2 && dv.total === 21
          ? '딜러 블랙잭이에요!'
          : g.hands.every((hs) =>
                hs.every((h) => h.status === 'bust' || h.status === 'blackjack'),
              )
            ? '남은 손이 없어 카드를 더 받지 않아요.'
            : dv.total < 17
              ? '16 이하라 한 장 더 받을게요.'
              : '17 이상이라 여기서 멈춰요.';
      return say(
        `숨긴 카드는 ${cardName(dealer[1] ?? 0)}. 딜러 ${josa(dealerLabel, '이에요/예요')}. ${next}`,
        dealer.length === 2 && dv.total === 21 ? 'wow' : 'focus',
      );
    }
    if (e.kind === 'dealer-hit' || e.kind === 'dealer')
      return say(
        fillLine(pickLine(DEALER_LINES.dealerHit, key), {
          card: cardName(e.card ?? dealer.at(-1) ?? 0),
          total: dealerLabel,
          extra: '',
        }) + (dv.total < 17 ? ' 한 장 더 받을게요.' : ''),
        'focus',
      );
    return say('각 손을 딜러와 비교하고 있어요.', 'focus');
  }
  // Players' phase.
  if (e.kind === 'deal') {
    const pool =
      ctx.round && ctx.round > 1 ? DEALER_LINES.greetRound : DEALER_LINES.greet;
    return say(
      `${fillLine(pickLine(pool, key), { names: listNames(names), round: ctx.round ?? 1 })} ${turnLine()}`,
      'smile',
    );
  }
  const h = g.hands[e.seat]?.[e.hand] ?? g.hands[e.seat]?.[0];
  const label = h ? blackjackTotalLabel(h.cards, h.split) : '';
  const handTag = handName(e.seat, e.hand) ? ` ${handName(e.seat, e.hand)}` : '';
  let done = '';
  let mood: DealerMood = 'calm';
  if (e.kind === 'hit') {
    const last = h?.cards.at(-1);
    const got = last !== undefined ? cardName(last) + ', ' : '';
    done = `${subj}${handTag ? handTag + '에' : ''} 한 장 더 받았어요. ${got}${josa(label, '이에요/예요')}.`;
    if (h?.status === 'bust') mood = 'sorry';
  } else if (e.kind === 'stand')
    done = `${subj}${handTag ? handTag + '을' : ''} ${label}에서 멈췄어요.`;
  else if (e.kind === 'double')
    done = `${subj}${handTag ? handTag + '을' : ''} 더블다운했어요. 베팅 ${formatBeom(h?.bet ?? g.stake * 2)}, 한 장만 받아 ${josa(label, '이에요/예요')}.`;
  else if (e.kind === 'split')
    done = `${subj} 스플릿했어요. 두 손으로 나눠 한 손씩 진행해요.`;
  return say(`${done} ${turnLine()}`, mood);
}

// ---------------------------------------------------------------------------
// Hold'em
const STREET_NAMES = { preflop: '프리플롭', flop: '플롭', turn: '턴', river: '리버' };
export type PokerPotReport = {
  kind: 'main' | 'side' | 'refund';
  amount: number;
  winners: number[];
  /** Winning hand name (showdown) or '' (everyone else folded / refund). */
  hand: string;
};
/** Pots of a finished hand, in order, with returned bets kept separate. */
export function pokerPotReports(g: PokerView): PokerPotReport[] {
  const ranks = new Map(g.revealed.map((r) => [r.seat, r.rank.label]));
  let contested = 0;
  return g.pots.map((p) => {
    const kind = p.refund ? 'refund' : contested++ === 0 ? 'main' : 'side';
    return {
      kind,
      amount: p.amount,
      winners: [...p.winners],
      hand: p.refund ? '' : (ranks.get(p.winners[0]) ?? ''),
    };
  });
}
/** Result explanation lines for the settlement panel and Lumi (H2). */
export function pokerResultLines(g: PokerView, names: string[]): string[] {
  const who = (seats: number[]) => seats.map((i) => sir(names[i])).join('·');
  const reports = pokerPotReports(g),
    pots = reports.filter((r) => r.kind !== 'refund'),
    lines: string[] = [];
  const folded = g.revealed.length === 0;
  pots.forEach((p, i) => {
    const potName =
      pots.length === 1 ? '팟' : i === 0 ? '메인 팟' : `사이드 팟${pots.length > 2 ? ' ' + i : ''}`;
    const winners = who(p.winners),
      split = p.winners.length > 1;
    lines.push(
      folded
        ? `모두 폴드해서 ${josa(winners, '이/가')} ${potName} ${josa(formatBeom(p.amount), '을/를')} 가져가요.`
        : split
          ? `${josa(winners, '이/가')} ${josa(p.hand, '으로/로')} 비겨서 ${potName} ${josa(formatBeom(p.amount), '을/를')} 나눠요.`
          : `${josa(winners, '이/가')} ${josa(p.hand, '으로/로')} ${potName} ${josa(formatBeom(p.amount), '을/를')} 가져가요.`,
    );
  });
  for (const r of reports.filter((r) => r.kind === 'refund'))
    lines.push(
      `받지 않은 베팅 ${josa(formatBeom(r.amount), '은/는')} ${sir(names[r.winners[0]])}께 돌려드렸어요.`,
    );
  return lines;
}
/** Short meaning of a hand name for the beginner tip. */
export const POKER_RANK_TIPS: Record<string, string> = {
  '하이 카드': '짝이 없으면 가장 높은 카드로 겨뤄요',
  '원 페어': '같은 숫자 2장',
  '투 페어': '같은 숫자 2장이 두 쌍',
  트리플: '같은 숫자 3장',
  스트레이트: '숫자 5장이 연속',
  플러시: '같은 무늬 5장',
  '풀 하우스': '트리플 + 원 페어',
  포카드: '같은 숫자 4장',
  '스트레이트 플러시': '같은 무늬로 숫자 5장이 연속',
  '로열 플러시': '같은 무늬 10·J·Q·K·A',
};
export function pokerLine(
  g: PokerView,
  seat: number,
  names: string[],
  ctx: DealerContext = {},
): DealerLine {
  const e = g.events.at(-1),
    key = `${g.id}:${g.revision}:${e?.kind ?? 'none'}`,
    subj = e && e.seat >= 0 ? subject(e.seat, seat, names) : '친구가',
    say = (text: string, mood: DealerMood = 'calm'): DealerLine => ({
      text: text.replace(/\s+/g, ' ').trim(),
      mood,
    });
  const turnLine = () =>
    g.turn < 0
      ? ''
      : g.turn === seat
        ? '내 차례예요. 천천히 골라 주세요.'
        : `이제 ${sir(names[g.turn])} 차례예요.`;
  if (g.phase === 'over') {
    const lines = pokerResultLines(g, names),
      extras: string[] = [];
    const me = seat >= 0 ? (g.result[seat] ?? 0) : 0;
    if (
      ctx.memory &&
      seat >= 0 &&
      me < 0 &&
      (ctx.memory.losses[names[seat]] ?? 0) >= 3
    )
      extras.push(pickLine(DEALER_LINES.consolation, key + ':sorry'));
    return say(
      [...lines.slice(0, 3), ...extras].join(' '),
      me > 0 ? 'smile' : me < 0 ? 'sorry' : 'calm',
    );
  }
  if (g.phase === 'showdown')
    return say('쇼다운! 남은 패를 모두 공개하고 팟별로 승자를 가릴게요.', 'focus');
  const runout = g.events.some((x) => x.kind === 'runout');
  if (g.phase === 'dealing') {
    const next =
      g.street === 'preflop' ? '플롭 세 장' : g.street === 'flop' ? '턴 카드' : '리버 카드';
    if (e?.kind === 'runout' || (runout && e?.kind !== 'deal'))
      return say(
        `올인! 더 베팅할 수 있는 사람이 없어서 패를 모두 공개하고 보드를 끝까지 깔게요. ${pickLine(DEALER_LINES.allIn, key)}`,
        'wow',
      );
    if (runout) return say(`${josa(next, '을/를')} 열게요.`, 'focus');
    return say(`베팅을 마쳤어요. ${josa(next, '을/를')} 열게요.`, 'focus');
  }
  if (!e) return say('카드를 나눠 드릴게요.', 'smile');
  const pot = g.committed.reduce((a, b) => a + b, 0),
    bigPot = pot >= g.bigBlind * 20;
  let done = '';
  let mood: DealerMood = 'calm';
  if (e.kind === 'blind') {
    const blinds = g.events.filter((x) => x.kind === 'blind');
    const [sb, bb] = [blinds.at(-2), blinds.at(-1)];
    const pool =
      ctx.round && ctx.round > 1 ? DEALER_LINES.greetRound : DEALER_LINES.greet;
    const greet = fillLine(pickLine(pool, key), {
      names: listNames(names),
      round: ctx.round ?? 1,
    });
    const blindText =
      sb && bb
        ? `블라인드는 ${sir(names[sb.seat])} ${formatBeom(sb.amount)}, ${sir(names[bb.seat])} ${josa(formatBeom(bb.amount), '이에요/예요')}.`
        : '';
    const first =
      g.turn < 0
        ? ''
        : g.turn === seat
          ? '내 차례부터 시작해요.'
          : `${sir(names[g.turn])}부터 시작해요.`;
    return say(`${greet} ${blindText} ${first}`, 'smile');
  }
  if (e.kind === 'deal')
    done = `${STREET_NAMES[g.street]} 카드를 열었어요.`;
  else if (e.kind === 'raise') {
    if (e.allIn) {
      done = `${subj} 올인했어요! ${formatBeom(e.to ?? e.amount)}.`;
      mood = 'wow';
    } else if (e.to === undefined)
      done = `${subj} ${josa(formatBeom(e.amount), '을/를')} 더 걸었어요.`;
    else if (e.open)
      done = `${subj} ${formatBeom(e.to)} 베팅했어요.`;
    else done = `${subj} ${josa(formatBeom(e.to), '으로/로')} 레이즈했어요.`;
  } else if (e.kind === 'call') {
    done = e.allIn
      ? `${subj} ${formatBeom(e.amount)} 콜로 올인했어요!`
      : `${subj} ${formatBeom(e.amount)} 콜했어요.`;
    if (e.allIn) mood = 'wow';
  } else if (e.kind === 'fold') done = `${subj} 폴드했어요.`;
  else if (e.kind === 'check') done = `${subj} 체크했어요.`;
  const aside =
    mood === 'wow'
      ? pickLine(DEALER_LINES.allIn, key + ':aside')
      : bigPot && (e.kind === 'raise' || e.kind === 'call')
        ? pickLine(DEALER_LINES.bigPot, key + ':pot')
        : '';
  let tip = '';
  if (ctx.tips && g.turn === seat && seat >= 0 && g.hand.length === 2) {
    const label =
      g.board.length >= 3
        ? g.revealed.find((r) => r.seat === seat)?.rank.label
        : undefined;
    if (label && POKER_RANK_TIPS[label])
      tip = `팁: ${label} = ${POKER_RANK_TIPS[label]}.`;
  }
  return say([done, aside, turnLine(), tip].filter(Boolean).join(' '), mood);
}

// ---------------------------------------------------------------------------
// Reactions (stickers): a short reply, the same on every client.
export type TableReaction = { seat: number; id: string; at: number };
export function reactionLine(
  matchId: string,
  reaction: TableReaction,
  names: string[],
): string {
  const pool =
    DEALER_LINES.reaction[reaction.id as keyof typeof DEALER_LINES.reaction];
  if (!pool) return '';
  return fillLine(pickLine(pool, `${matchId}:${reaction.at}:${reaction.id}`), {
    who: sir(names[reaction.seat]),
  });
}

// ---------------------------------------------------------------------------
// 섯다 · 매화
export function seotdaLine(
  g: SeotdaView,
  seat: number,
  names: string[],
): DealerLine {
  const winners = g.winners.map((i) => sir(names[i])).join('·');
  if (g.phase === 'over') {
    const pot = g.events.findLast((e) => e.kind === 'win')?.amount ?? 0,
      take = pot
        ? ` 판돈 ${josa(formatBeom(pot), '을/를')} ${g.winners.length > 1 ? '나눠요' : '가져가요'}.`
        : '';
    const hand = g.reason.replace(/ 승리!$/, '');
    const text =
      (g.reason.endsWith('승리!')
        ? `${josa(winners, '이/가')} ${hand}${particle(hand, '으로/로')} 이겼어요!`
        : `${josa(winners, '이/가')} 이겼어요. ${g.reason}`) + take;
    return { text, mood: seat >= 0 && g.winners.includes(seat) ? 'smile' : 'calm' };
  }
  if (g.phase === 'redeal') return { text: g.reason, mood: 'wow' };
  if (g.phase === 'showdown')
    return { text: '패를 공개할게요. 두 장에 담긴 승부를 확인해 보세요.', mood: 'focus' };
  const e = g.events.at(-1),
    subj = e ? subject(e.seat, seat, names) : '친구가';
  const action =
    e?.kind === 'raise'
      ? `${subj} ${josa(formatBeom(e.amount), '을/를')} 더 걸었어요.`
      : e?.kind === 'call'
        ? `${subj} 콜했어요.`
        : e?.kind === 'fold'
          ? `${subj} 다이했어요.`
          : e?.kind === 'check'
            ? `${subj} 체크했어요.`
            : '두 장씩 나눠 드렸어요.';
  const turn =
    g.turn < 0
      ? ''
      : g.turn === seat
        ? '내 차례예요.'
        : `이제 ${sir(names[g.turn])} 차례예요.`;
  return { text: `${action} ${turn}`.trim(), mood: 'calm' };
}

// ---------------------------------------------------------------------------
// 고스톱 · 매화 (light)
export function gostopHostLine(
  g: { id: string; phase: string; turn: number; ply?: number },
  seat: number,
  names: string[],
): DealerLine {
  const key = `${g.id}:${g.ply ?? 0}:${g.phase}`,
    L = DEALER_LINES.gostop;
  if (g.phase === 'over') return { text: pickLine(L.over, key), mood: 'smile' };
  if ((g.ply ?? 0) === 0)
    return {
      text: fillLine(pickLine(L.start, key), { names: listNames(names) }),
      mood: 'smile',
    };
  if (g.phase === 'decide')
    return {
      text:
        g.turn === seat
          ? '고 할지 스톱할지 정해 주세요.'
          : fillLine(pickLine(L.decide, key), { who: sir(names[g.turn]) }),
      mood: 'focus',
    };
  return {
    text:
      g.turn === seat
        ? pickLine(L.mine, key)
        : fillLine(pickLine(L.turn, key), { who: sir(names[g.turn]) }),
    mood: 'calm',
  };
}

/**
 * The newest sticker a seated player sent at this match (for the host's
 * reply), or null. `players` is the room view's player list.
 */
export function latestTableReaction(
  players: readonly {
    id: string;
    reaction?: { id: string; at: number; scope: string; matchId?: string };
  }[],
  seats: readonly (string | null)[],
  scope: string,
  matchId: string | undefined,
): TableReaction | null {
  let best: TableReaction | null = null;
  seats.forEach((id, seat) => {
    const r = id ? players.find((p) => p.id === id)?.reaction : undefined;
    if (!r || r.scope !== scope || (matchId && r.matchId !== matchId)) return;
    if (!best || r.at > best.at) best = { seat, id: r.id, at: r.at };
  });
  return best;
}
