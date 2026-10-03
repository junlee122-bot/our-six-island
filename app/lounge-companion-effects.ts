// 주민 동행 효과 (design-npc-companion.md 1-3): the small hooks other engines
// call — skill XP (lounge-growth.ts xpMultiplier), a cast and a hooked fish
// (lounge-fish-engine.ts), shop prices at the 행상·장터 (lounge-life-plus.ts,
// lounge-town.ts) and the mine ladder (lounge-growth.ts ladderFound). Effects
// that add or change items after an action (채집·요리·광석·나무·수확·심기·
// 과일·제작·동물·축제·먼바다) run in lounge-companion.ts companionAfterAction.
//
// Every effect applies only while the outing is on and only to its activity.
// None of them makes 범 (a discount only lowers what is paid through the
// ordinary ledger path) or touches a table game.
//
// Leaf module (data and the calendar only): safe to import from any engine.
import { NPCS, type NpcId } from './lounge-npc-data.ts';
import { isNighttime, weatherOf } from './lounge-calendar.ts';
import { kstDay } from './lounge-economy.ts';
import { xpMultOf } from './lounge-mood-data.ts';

/** Every number of the effect table in one place (lounge-companion-data.ts has the words). */
export const COMPANION_NUMBERS = {
  forageCurio: 0.1,
  firstsXp: 0.3,
  nightWindow: 1.05,
  goldPts: 3,
  tradeMult: 0.95,
  cookExtra: 0.1,
  fruitCooldown: 0.8,
  riverRare: 1.05,
  nightXp: 1.15,
  treasureMult: 1.3,
  craftRefund: 0.1,
  plantSpeed: 5,
  nightRare: 1.15,
  walkSpeed: 1.1,
  ladderEarly: 1,
  weatherXp: 1.1,
  reelLoss: 0.9,
  fishXp: 1.15,
  animalLove: 1,
  oreExtra: 0.15,
  woodExtra: 1,
  festivalScore: 1.1,
  voyageGameHours: 1,
  socialPoints: 1,
} as const;

/** The outing as the effect hooks need it (lounge-companion.ts keeps the rest). */
export type CompanionOutingLike = { npc: NpcId; at: number; until: number };
type WithCompanions = { companions?: Record<string, { out?: CompanionOutingLike } | undefined> };

/** The resident walking with `uid` right now (null when none). */
export function companionNow(life: WithCompanions, uid: string, now: number): NpcId | null {
  const out = life.companions?.[uid]?.out;
  return out && out.at <= now && now < out.until && Object.prototype.hasOwnProperty.call(NPCS, out.npc) ? out.npc : null;
}

const rainy = (now: number) => ['rain', 'storm'].includes(weatherOf(kstDay(now)));

/**
 * Skill XP multiplier (1 = none): 럭스 낚시, 무잔 밤, 잔나 비·폭풍 날,
 * 메르시 cancels the 지쳤어요 −10% (the mood's own multiplier stays as it is).
 */
export function companionXpMult(life: WithCompanions & { mood?: Record<string, { v: number } | undefined> }, uid: string, skill: string, now: number): number {
  const npc = companionNow(life, uid, now);
  if (!npc) return 1;
  if (npc === 'lux' && skill === 'fish') return COMPANION_NUMBERS.fishXp;
  if (npc === 'muzan' && isNighttime(now)) return COMPANION_NUMBERS.nightXp;
  if (npc === 'janna' && rainy(now)) return COMPANION_NUMBERS.weatherXp;
  if (npc === 'mercy') {
    const v = life.mood?.[uid]?.v;
    const m = typeof v === 'number' ? xpMultOf(v) : 1;
    return m < 1 ? 1 / m : 1;
  }
  return 1;
}

const RIVER_SPOTS = ['river', 'rapids', 'falls', 'bridge'];
const SEA_SPOTS = ['sea', 'rocks', 'harbor', 'breakwater', 'pier', 'offshore'];
export type CompanionFishMods = { rare: number; window: number; treasure: number; loss: number };
/**
 * One cast / one hooked fish: rare-fish weight (하쿠 강, 쓰레쉬 밤), the bite
 * window (봇치 밤, alone at the spot), treasure chance (미스 포츈 먼바다) and the
 * reel gauge's loss (가붕 바다).
 */
export function companionFishMods(life: WithCompanions, uid: string, spot: string, now: number, coop = 0): CompanionFishMods {
  const out = { rare: 1, window: 1, treasure: 1, loss: 1 };
  const npc = companionNow(life, uid, now);
  if (npc === 'haku' && RIVER_SPOTS.includes(spot)) out.rare = COMPANION_NUMBERS.riverRare;
  if (npc === 'thresh' && isNighttime(now)) out.rare = COMPANION_NUMBERS.nightRare;
  if (npc === 'bocchi' && isNighttime(now) && coop === 0) out.window = COMPANION_NUMBERS.nightWindow;
  if (npc === 'rose' && spot === 'offshore') out.treasure = COMPANION_NUMBERS.treasureMult;
  if (npc === 'gabung' && SEA_SPOTS.includes(spot)) out.loss = COMPANION_NUMBERS.reelLoss;
  return out;
}

/** 마키마: a unit price at the 행상 (`peddler`) or a market-day stall, 5% off (rounded up to whole 범). */
export function companionPrice(life: WithCompanions, uid: string, at: string | undefined, price: number, now: number): number {
  if (!(price > 0) || companionNow(life, uid, now) !== 'makima') return price;
  if (at !== 'peddler' && !(typeof at === 'string' && at.startsWith('stall'))) return price;
  return Math.max(1, Math.ceil(price * COMPANION_NUMBERS.tradeMult));
}

/** 볼리바스: the mine ladder shows after this many fewer rocks. */
export const companionLadderEarly = (life: WithCompanions, uid: string, now: number) =>
  companionNow(life, uid, now) === 'volibas' ? COMPANION_NUMBERS.ladderEarly : 0;

/** 신짜장: walking speed multiplier (client movement). */
export const companionWalkMult = (npc: NpcId | null | undefined) => (npc === 'sinjjajang' ? COMPANION_NUMBERS.walkSpeed : 1);
