// 연애·결혼 대사 고르기 (handover/design/design-romance.md). Which love
// lines a resident says to a friend: the heart band (or 연인 · 약혼 · 결혼),
// partner greetings by time of day, weather and season, the answers to a
// 꽃다발 or a 청혼 반지, the wedding vows, married life at home, and jealousy
// or teasing when the friend is with someone else. Deterministic like the
// rest of the dialogue (lounge-npc-dialog.ts): same person, day and
// situation give the same line on every screen.
import { hash32, timeOfDay, type Season, type Weather } from './lounge-calendar.ts';
import { NPC_HEART_POINTS, NPC_SISTER_FRIENDS, NPCS, type NpcId, type NpcLove } from './lounge-npc-data.ts';
import type { NpcBanter } from './lounge-npc-line-types.ts';
import type { NpcLoveSet, NpcLoveTier, NpcMarriedSet } from './lounge-npc-love-types.ts';
import { NPC_LOVE_BANTER_A } from './lounge-npc-love-banter-a.ts';
import { NPC_LOVE_BANTER_B } from './lounge-npc-love-banter-b.ts';
import { NPC_LOVE_BANTER_C } from './lounge-npc-love-banter-c.ts';
import { NPC_LOVE_BANTER_D } from './lounge-npc-love-banter-d.ts';
import { NPC_LOVE_BANTER_E } from './lounge-npc-love-banter-e.ts';
import { NPC_LOVE_BANTER_F } from './lounge-npc-love-banter-f.ts';
import { NILAH_LOVE } from './lounge-npc-love-nilah.ts';
import { HAKU_LOVE } from './lounge-npc-love-haku.ts';
import { ORNN_LOVE } from './lounge-npc-love-ornn.ts';
import { MERCY_LOVE } from './lounge-npc-love-mercy.ts';
import { SHINICHI_LOVE } from './lounge-npc-love-shinichi.ts';
import { LUMI_LOVE } from './lounge-npc-love-lumi.ts';
import { MAEHWA_LOVE } from './lounge-npc-love-maehwa.ts';
import { CAPTAIN_LOVE } from './lounge-npc-love-captain.ts';
import { ROSE_LOVE } from './lounge-npc-love-rose.ts';
import { NYAMO_LOVE } from './lounge-npc-love-nyamo.ts';
import { GWEN_LOVE } from './lounge-npc-love-gwen.ts';
import { NASERA_LOVE } from './lounge-npc-love-nasera.ts';
import { FRIEREN_LOVE } from './lounge-npc-love-frieren.ts';
import { THRESH_LOVE } from './lounge-npc-love-thresh.ts';
import { SINJJAJANG_LOVE } from './lounge-npc-love-sinjjajang.ts';
import { VOLIBAS_LOVE } from './lounge-npc-love-volibas.ts';
import { JANNA_LOVE } from './lounge-npc-love-janna.ts';
import { GABUNG_LOVE } from './lounge-npc-love-gabung.ts';
import { LUX_LOVE } from './lounge-npc-love-lux.ts';
import { HIMMEL_LOVE } from './lounge-npc-love-himmel.ts';
import { BEATRICE_LOVE } from './lounge-npc-love-beatrice.ts';
import { BOCCHI_LOVE } from './lounge-npc-love-bocchi.ts';
import { TSUNADE_LOVE } from './lounge-npc-love-tsunade.ts';
import { MAKIMA_LOVE } from './lounge-npc-love-makima.ts';
import { YANINEKO_LOVE } from './lounge-npc-love-yanineko.ts';
import { CARPENTER_LOVE } from './lounge-npc-love-carpenter.ts';
import { REALTOR_LOVE } from './lounge-npc-love-realtor.ts';
import { MISUN_LOVE } from './lounge-npc-love-misun.ts';
import { MUZAN_LOVE } from './lounge-npc-love-muzan.ts';

export type { NpcLoveSet, NpcLoveTier, NpcMarriedSet };
export { NPC_LOVE_TIERS } from './lounge-npc-love-types.ts';

/**
 * Every resident's love lines. The realty couple 신형만 · 봉미선 (realtor,
 * misun) are married to each other and have friendship lines instead
 * (NPC_LOVE_MARRIED).
 */
export const NPC_LOVE: Partial<Record<NpcId, NpcLoveSet>> = {
  lumi: LUMI_LOVE,
  maehwa: MAEHWA_LOVE,
  captain: CAPTAIN_LOVE,
  rose: ROSE_LOVE,
  nyamo: NYAMO_LOVE,
  gwen: GWEN_LOVE,
  nasera: NASERA_LOVE,
  frieren: FRIEREN_LOVE,
  thresh: THRESH_LOVE,
  sinjjajang: SINJJAJANG_LOVE,
  volibas: VOLIBAS_LOVE,
  janna: JANNA_LOVE,
  gabung: GABUNG_LOVE,
  lux: LUX_LOVE,
  himmel: HIMMEL_LOVE,
  beatrice: BEATRICE_LOVE,
  bocchi: BOCCHI_LOVE,
  tsunade: TSUNADE_LOVE,
  makima: MAKIMA_LOVE,
  yanineko: YANINEKO_LOVE,
  carpenter: CARPENTER_LOVE,
  muzan: MUZAN_LOVE,
  nilah: NILAH_LOVE,
  haku: HAKU_LOVE,
  ornn: ORNN_LOVE,
  mercy: MERCY_LOVE,
  shinichi: SHINICHI_LOVE,
};

/** The married couple's lines (NPC_SPOUSES): friendship, refusals, cheering friends on. */
export const NPC_LOVE_MARRIED: Partial<Record<NpcId, NpcMarriedSet>> = {
  realtor: REALTOR_LOVE,
  misun: MISUN_LOVE,
};

/** Plain 해요체 lines for a resident without a love file yet. */
export const NPC_LOVE_FALLBACK: NpcLoveSet = {
  tier: {
    h0: ['{me}, 반가워요. 오늘도 좋은 하루예요.'],
    h3: ['{me}, 요즘 자주 보네요. 기분 좋아요.'],
    h5: ['{me}, 오면 괜히 웃음이 나요.'],
    h7: ['{me}, 요즘 자꾸 생각나요. 이상하죠.'],
    dating: ['{me}, 오늘도 보러 와 줬네요. 고마워요.'],
    engaged: ['결혼식 날까지 손꼽아 세고 있어요.'],
    married: ['{me}, 오늘도 같이 집에 가요.'],
  },
  greet: { dawn: ['{me}, 일찍 일어났네요.'], day: ['{me}, 점심은 먹었어요?'], evening: ['{me}, 오늘 하루 수고했어요.'], night: ['{me}, 늦었어요. 같이 들어가요.'] },
  weather: { rain: ['비 오는 날엔 우산 하나로 같이 걸어요.'], snow: ['눈 오는 날, 손 시리면 내 주머니에 넣어요.'], sunny: ['날이 좋네요. 같이 걸을래요?'] },
  season: { spring: ['봄이에요. 꽃 보러 가요.'], summer: ['여름밤엔 바람 쐬러 가요.'], autumn: ['가을엔 같이 낙엽 길을 걸어요.'], winter: ['겨울엔 따뜻한 차 한 잔 해요.'] },
  ask: { accept: ['…네. 저도 같은 마음이었어요.'], decline: ['고마워요. 그래도 조금만 더 친해진 다음에요.'], taken: ['미안해요. 마음을 정한 사람이 있어요.'], cool: ['지금은 마음부터 쉬어요. 꽃다발은 나중에요.'] },
  propose: { accept: ['네. 평생 옆에 있을게요.'], decline: ['조금만 더 기다려 줘요. 진심이니까요.'] },
  wedding: ['오늘 이 광장에서 약속해요.', '좋은 날도 궂은 날도 {me} 옆에 있을게요.', '앞으로 잘 부탁해요.'],
  home: {
    morning: ['좋은 아침이에요. 아침 차려 뒀어요.'],
    evening: ['다녀왔어요. 오늘 이야기 들려줘요.'],
    anniversary: ['함께한 지 {days}일이에요. 고마워요.'],
    gift: ['나가기 전에 이거 받아요. {item} 하나예요.'],
    night: ['잘 자요. 내일 또 봐요.'],
  },
  jealous: ['요즘 {partner}, 그 사람이랑 잘 지낸다면서요. 좋겠네요.'],
  tease: ['{partner}, 그 사람이랑 잘돼 간다며요? 축하해요.'],
  breakup: ['알겠어요. 그동안 고마웠어요.'],
};

/** Love banter between residents (bubbles), merged with the everyday banter by pair. */
export const NPC_LOVE_BANTER: readonly NpcBanter[] = [
  ...NPC_LOVE_BANTER_A,
  ...NPC_LOVE_BANTER_B,
  ...NPC_LOVE_BANTER_C,
  ...NPC_LOVE_BANTER_D,
  ...NPC_LOVE_BANTER_E,
  ...NPC_LOVE_BANTER_F,
];

export const npcLoveSet = (npc: NpcId): NpcLoveSet => NPC_LOVE[npc] ?? NPC_LOVE_FALLBACK;
/** 발키리 talks to these friends as 언니·동생 (NPC_SISTER_FRIENDS). */
const sisterSet = (npc: NpcId, me: string | undefined) => (me !== undefined && NPC_SISTER_FRIENDS.includes(me) ? npcLoveSet(npc).sister : undefined);

/** The heart band (0–2, 3–4, 5–6, 7+) or the partner state. */
export function npcLoveTier(points: number, love?: NpcLove): NpcLoveTier {
  if (love) return love;
  const hearts = Math.floor(Math.max(0, points) / NPC_HEART_POINTS);
  return hearts >= 7 ? 'h7' : hearts >= 5 ? 'h5' : hearts >= 3 ? 'h3' : 'h0';
}

/** A milestone of days together (7, 30, every 100, every 365) or null. */
export function npcAnniversary(days: number): number | null {
  if (!Number.isSafeInteger(days) || days <= 0) return null;
  return days === 7 || days === 30 || days % 100 === 0 || days % 365 === 0 ? days : null;
}

/** What a talk needs to know about the friend's love life. */
export type NpcLoveContext = {
  npc: NpcId;
  points: number;
  /** This resident and the friend. */
  love?: NpcLove;
  /** Days since dating began (or since the wedding when married). */
  days?: number;
  /** A married spouse at home in the friend's room. */
  atHome?: boolean;
  /** The friend's partner when it is someone else (their name). */
  otherPartner?: string;
  /** That partner's resident id and how far the friend is with them. */
  otherNpc?: NpcId;
  otherLove?: NpcLove;
  /** The friend's name (발키리's 언니·동생 lines). */
  me?: string;
};

/**
 * The love pools a talk mixes in: the band's lines (twice, so they come up
 * often), married life at home, a milestone, and jealousy (5+ hearts) or
 * teasing when the friend is with someone else.
 */
export function npcLovePools(ctx: NpcLoveContext, now: number): string[][] {
  const M = NPC_LOVE_MARRIED[ctx.npc];
  if (M) return marriedPools(M, ctx);
  const L = npcLoveSet(ctx.npc);
  const tier = npcLoveTier(ctx.points, ctx.love);
  const band = sisterSet(ctx.npc, ctx.me)?.tier[tier] ?? L.tier[tier];
  const pools: string[][] = [band, band];
  if (ctx.love === 'married' && ctx.atHome) {
    const t = timeOfDay(now);
    pools.push(t === 'dawn' || t === 'day' ? L.home.morning : t === 'evening' ? L.home.evening : L.home.night);
  }
  if (ctx.love && npcAnniversary(ctx.days ?? 0)) pools.push(L.home.anniversary, L.home.anniversary, L.home.anniversary);
  if (!ctx.love && ctx.otherPartner) pools.push(ctx.points >= 5 * NPC_HEART_POINTS ? L.jealous : L.tease);
  return pools.filter((p) => p.length > 0);
}

/**
 * A married resident's pools: the friendship band (twice), their spouse,
 * 발키리 now and then, and cheering when the friend is with someone (a word
 * about 발키리 when it is her, a married senior's advice once engaged).
 */
function marriedPools(M: NpcMarriedSet, ctx: NpcLoveContext): string[][] {
  const tier = npcLoveTier(ctx.points);
  const band = M.tier[tier === 'h0' || tier === 'h3' || tier === 'h5' ? tier : 'h7'];
  const pools: string[][] = [band, band, M.spouse, M.carpenter];
  if (ctx.otherPartner) {
    const stage = ctx.otherLove ?? 'dating';
    pools.push(M.news[stage], M.news[stage]);
    if (ctx.otherNpc === 'carpenter') pools.push(M.newsCarpenter);
    if (stage !== 'dating') pools.push(M.advice);
  }
  return pools.filter((p) => p.length > 0);
}

/** An opener for a partner: time of day, or the weather / season now and then. */
export function npcLoveOpener(npc: NpcId, now: number, weather: Weather, season: Season, key: string): string | undefined {
  const L = npcLoveSet(npc);
  const slot = hash32(`${key}:love-opener`) % 10;
  const pool =
    slot < 3 && (weather === 'rain' || weather === 'storm') ? L.weather.rain
    : slot < 3 && weather === 'snow' ? L.weather.snow
    : slot < 2 && weather === 'sunny' ? L.weather.sunny
    : slot >= 8 ? L.season[season]
    : L.greet[timeOfDay(now)];
  return pick(pool, `${key}:love-open`);
}

const pick = (pool: readonly string[] | undefined, key: string) => (pool && pool.length ? pool[hash32(key) % pool.length] : undefined);

export type NpcLoveMoment = 'ask-accept' | 'ask-decline' | 'ask-taken' | 'ask-cool' | 'propose-accept' | 'propose-decline' | 'breakup' | 'gift';
/**
 * One line for a moment (a 꽃다발, a 청혼 반지, a breakup, the morning
 * present). The refusals (npcLoveRefusal says which) are in the resident's
 * own voice: not yet, already promised to another friend, or 'ask-cool'
 * while my breakup cooldown runs. A married resident (NPC_LOVE_MARRIED)
 * turns every 꽃다발 and ring down; `me` picks 발키리's 언니·동생 answers.
 */
export function npcLoveLine(npc: NpcId, moment: NpcLoveMoment, key: string, me?: string): string {
  const M = NPC_LOVE_MARRIED[npc];
  if (M && moment.startsWith('ask-')) return pick(M.refuse.bouquet, `${npc}:love:${moment}:${key}`)!;
  if (M && moment.startsWith('propose-')) return pick(M.refuse.ring, `${npc}:love:${moment}:${key}`)!;
  const L = npcLoveSet(npc);
  const S = sisterSet(npc, me);
  const pool =
    moment === 'ask-accept' ? S?.ask.accept ?? L.ask.accept
    : moment === 'ask-decline' ? S?.ask.decline ?? L.ask.decline
    : moment === 'ask-taken' ? L.ask.taken
    : moment === 'ask-cool' ? L.ask.cool ?? L.ask.decline
    : moment === 'propose-accept' ? S?.propose.accept ?? L.propose.accept
    : moment === 'propose-decline' ? S?.propose.decline ?? L.propose.decline
    : moment === 'breakup' ? L.breakup
    : L.home.gift;
  return pick(pool, `${npc}:love:${moment}:${key}`) ?? pick(NPC_LOVE_FALLBACK.ask.accept, key)!;
}
/** The wedding vows, in order (one page each). */
export const npcWeddingLines = (npc: NpcId, me?: string) => [...(sisterSet(npc, me)?.wedding ?? npcLoveSet(npc).wedding)];

/** Fills the love placeholders ({me} {name} {item} {partner} {days} …); unknown keys stay visible. */
export function fillLoveLine(template: string, vars: Record<string, string | number | undefined>, npc: NpcId) {
  const all = { name: NPCS[npc].name, ...vars };
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (all[key as keyof typeof all] === undefined ? whole : String(all[key as keyof typeof all])));
}

/** Every love line of a resident (tests). */
export function allNpcLoveLines(npc: NpcId): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(NPC_LOVE[npc] ?? NPC_LOVE_MARRIED[npc]);
  return out;
}
