// 주민 동행 engine (handover/design/design-npc-companion.md 1부 + 결정됨).
//
//   같이 다닐래요? (2 hearts)  →  18 game hours together  →  parting line
//
// One companion per friend, one friend per resident. Shopkeepers stay in their
// shop in its hours (and go back when it opens); 무잔 comes along only at
// night. Each game hour together is +1 relation point (+6 a KST day at most);
// with a partner (연인·약혼·결혼) the hours go to their own record instead.
// The first outing with a resident is kept in the memory album. The outing
// ends by 보내기, by the clock, at the shop's opening or when I log out
// (lounge-cloud-engine.ts calls companionLogout).
//
// The effects (lounge-companion-effects.ts) apply only to the matching
// activity; the ones that add or change items run here after the action
// (companionAfterAction), by comparing the life before and after it. None of
// them makes 범: items and relation points only, through the existing paths.
//
// Server-authoritative and `now`-injected like the other life modules; the
// view tells every friend who walks with whom (they draw the resident beside
// that friend and on the minimap).
import { kstDay } from './lounge-economy.ts';
import { GAME_HOUR_MS, birthdayActors, hash32, inGameHours, isNighttime, timeOfDay, weatherOf } from './lounge-calendar.ts';
import { NPCS, NPC_DATING_POINTS, NPC_POINTS_MAX, isNpcId, npcVisible, type NpcId } from './lounge-npc-data.ts';
import { npcSpot, type NpcWorld } from './lounge-npc-schedule.ts';
import { ACTORS } from './lounge-roster.ts';
import { josa } from './lounge-text.ts';
import { LifeError, CROPS, FRUIT_COOLDOWN_MS, MAX_SPEED, type Crop, type LifeState, type LifeAction, type Quality } from './lounge-life.ts';
import { addCropQ, addInv, addMemory, bump, cropQCount } from './lounge-life-plus.ts';
import { gainXp, skillXp } from './lounge-growth.ts';
import { SKILLS, ORE_ITEMS, type SkillId } from './lounge-growth-data.ts';
import { ANIMAL_LOVE_MAX } from './lounge-stage3-data.ts';
import { moodTouch } from './lounge-mood.ts';
import {
  COMPANION_BOND_DAY_CAP,
  COMPANION_BOND_PER_HOUR,
  COMPANION_MIN_POINTS,
  COMPANION_MS,
  COMPANION_NIGHT_ONLY,
  COMPANION_SAID_MAX,
  COMPANION_SHOPKEEPERS,
  COMPANION_SHOP_HOURS,
  COMPANION_HEARTS,
  COMPANION_PLACES_OF,
  type CompanionEnd,
} from './lounge-companion-data.ts';
import { COMPANION_NUMBERS, companionNow } from './lounge-companion-effects.ts';
import {
  COMPANION_MOMENTS,
  COMPANION_REACTS,
  isCompanionPlace,
  type CompanionMoment,
  type CompanionReact,
} from './lounge-npc-companion-line-types.ts';

// ---------------------------------------------------------------- types
export type CompanionOuting = {
  npc: NpcId;
  /** When they came along. */
  at: number;
  /** When they will go back (the clock, the shop's opening or dawn for 무잔). */
  until: number;
  /** Why they will go back at `until`. */
  end: CompanionEnd;
  /** Game hours already counted toward the bond. */
  h: number;
};
export type CompanionUser = {
  out?: CompanionOuting;
  /** KST day of `b`, and relation points earned walking together that day. */
  d?: number;
  b?: number;
  /** Residents I have walked with (the first outing goes to the memory album). */
  met?: NpcId[];
  /** One-off moments already said ('npc:moment'). */
  said?: string[];
  /** Moments the server saw on this outing, waiting for the companion talk. */
  pend?: CompanionMoment[];
  /** The last thing that happened (the companion's speech bubble). */
  ev?: { k: CompanionReact; at: number };
  /** Game hours walked with my partner, per resident (연인·배우자 기록). */
  lh?: Partial<Record<NpcId, number>>;
  /** The last parting (the parting line and the toast). */
  last?: { npc: NpcId; at: number; end: CompanionEnd };
  /** KST day 닐라's +1 for the animals was used. */
  nd?: number;
};
export type CompanionState = Record<string, CompanionUser>;
export type CompanionExt = { companions?: CompanionState };
export type CompanionAction =
  | { kind: 'companion'; op: 'invite'; npc: NpcId }
  | { kind: 'companion'; op: 'dismiss' }
  /** The companion talk (E) said a one-off moment: it is noted so it is never said again. */
  | { kind: 'companion'; op: 'moment'; moment: CompanionMoment; /** Filled by the server: where I stand. */ where?: string };
export { COMPANION_ACTION_KINDS } from './lounge-companion-data.ts';

export const COMPANION_REJECT = {
  action: '같이 다닐 주민을 다시 골라 주세요.',
  hearts: (n: number) => `아직은 어색한가 봐요. 하트 ${COMPANION_HEARTS}개부터 같이 다녀요(지금 ${n}하트).`,
  already: '이미 같이 다니는 중이에요.',
  one: (name: string) => `지금은 ${josa(name, '과/와')} 다니는 중이에요. 먼저 보내 주세요.`,
  taken: (friend: string) => `지금 ${josa(friend, '이랑/랑')} 다니는 중이에요. 다음에 같이 가요.`,
  shop: '가게 봐야 해서요. 영업이 끝나면 같이 가요.',
  night: '해가 진 뒤에만 함께 다녀요.',
  away: '지금은 만날 수 없어요.',
  none: '같이 다니는 주민이 없어요.',
  moment: '지금은 할 수 없는 이야기예요.',
} as const;
const fail = (message: string): never => {
  throw new LifeError(message);
};

// ---------------------------------------------------------------- reading
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nat = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const ENDS: readonly CompanionEnd[] = ['dismiss', 'time', 'shop', 'night', 'logout'];
const isEnd = (e: unknown): e is CompanionEnd => (ENDS as readonly unknown[]).includes(e);
const isMoment = (m: unknown): m is CompanionMoment => (COMPANION_MOMENTS as readonly unknown[]).includes(m);
const isReact = (k: unknown): k is CompanionReact => (COMPANION_REACTS as readonly unknown[]).includes(k);
const SAID = /^[a-z]{2,12}:[a-zA-Z]{3,12}$/;

function readUser(v: unknown): CompanionUser | undefined {
  const x = obj(v),
    out: CompanionUser = {};
  const o = obj(x.out);
  if (isNpcId(o.npc) && nat(o.at) && nat(o.until) && o.until > o.at && o.until - o.at <= COMPANION_MS && isEnd(o.end) && nat(o.h))
    out.out = { npc: o.npc, at: o.at, until: o.until, end: o.end, h: Math.min(o.h, 24) };
  if (nat(x.d) && nat(x.b)) {
    out.d = x.d;
    out.b = Math.min(x.b, COMPANION_BOND_DAY_CAP);
  }
  if (Array.isArray(x.met)) {
    const met = [...new Set(x.met.filter(isNpcId))];
    if (met.length) out.met = met;
  }
  if (Array.isArray(x.said)) {
    const said = [...new Set(x.said.filter((s): s is string => typeof s === 'string' && SAID.test(s)))].slice(-COMPANION_SAID_MAX);
    if (said.length) out.said = said;
  }
  if (out.out && Array.isArray(x.pend)) {
    const pend = [...new Set(x.pend.filter(isMoment))];
    if (pend.length) out.pend = pend;
  }
  const ev = obj(x.ev);
  if (isReact(ev.k) && nat(ev.at)) out.ev = { k: ev.k, at: ev.at };
  const lh: Partial<Record<NpcId, number>> = {};
  for (const [k, n] of Object.entries(obj(x.lh))) if (isNpcId(k) && nat(n) && n > 0) lh[k] = Math.min(n, 1_000_000);
  if (Object.keys(lh).length) out.lh = lh;
  const last = obj(x.last);
  if (isNpcId(last.npc) && nat(last.at) && isEnd(last.end)) out.last = { npc: last.npc, at: last.at, end: last.end };
  if (nat(x.nd)) out.nd = x.nd;
  return Object.keys(out).length ? out : undefined;
}
/** Normalizes `world.life.companions` (absent in older worlds: read back unchanged). */
export function readCompanions(value: unknown): CompanionExt {
  const out: CompanionState = {};
  for (const [uid, v] of Object.entries(obj(value)).slice(0, 16)) {
    if (!UUID.test(uid)) continue;
    const u = readUser(v);
    if (u) out[uid] = u;
  }
  return Object.keys(out).length ? { companions: out } : {};
}

// ---------------------------------------------------------------- rules
/** Whether `npc` keeps their shop at `t` (they do not come along then). */
export function companionOnDuty(npc: NpcId, t: number, world: NpcWorld = {}): boolean {
  if (!COMPANION_SHOPKEEPERS.includes(npc)) return false;
  const hours = COMPANION_SHOP_HOURS[npc];
  if (hours) return inGameHours(t, hours[0], hours[1]);
  const a = npcSpot(npc, t, world).activity;
  return a === 'work' || a === 'stall';
}
/** Why `npc` cannot come along at `t` ('shop' · 'night'), or null when they can. */
export function companionBusy(npc: NpcId, t: number, world: NpcWorld = {}): 'shop' | 'night' | null {
  if (COMPANION_NIGHT_ONLY.includes(npc) && !isNighttime(t)) return 'night';
  return companionOnDuty(npc, t, world) ? 'shop' : null;
}
/** Steps the end of an outing is looked for in (a quarter game hour). */
const STEP = GAME_HOUR_MS / 4;
/** When an outing that starts at `now` ends, and why. */
export function companionUntil(npc: NpcId, now: number, world: NpcWorld = {}): { until: number; end: CompanionEnd } {
  const last = now + COMPANION_MS;
  for (let t = Math.ceil((now + 1) / STEP) * STEP; t < last; t += STEP) {
    const why = companionBusy(npc, t, world);
    if (why) return { until: t, end: why };
  }
  return { until: last, end: 'time' };
}
/** Who (uid) is walking with `npc` right now, if anyone. */
export function companionHolder(life: Pick<LifeState, 'companions'>, npc: NpcId, now: number): string | null {
  for (const [uid, u] of Object.entries(life.companions ?? {})) if (u?.out?.npc === npc && u.out.at <= now && now < u.out.until) return uid;
  return null;
}
/**
 * Why I cannot invite `npc` right now ('' when I can): hearts, my own
 * companion, another friend's, the shop's hours, 무잔's daylight. Shared by the
 * server and the talk box (the button shows the reason).
 */
export function companionWhyNot(o: {
  npc: NpcId;
  points: number;
  /** My companion now (null: none). */
  mine: NpcId | null;
  /** The friend's name walking with them (null: nobody). */
  holder: string | null;
  now: number;
  world?: NpcWorld;
}): string {
  if (o.mine === o.npc) return COMPANION_REJECT.already;
  if (o.mine) return COMPANION_REJECT.one(NPCS[o.mine].name);
  if (o.points < COMPANION_MIN_POINTS) return COMPANION_REJECT.hearts(Math.floor(o.points / 12));
  if (o.holder) return COMPANION_REJECT.taken(o.holder);
  const busy = companionBusy(o.npc, o.now, o.world ?? {});
  if (busy) return COMPANION_REJECT[busy];
  return '';
}
/** The invite button's short note for a reason from companionWhyNot ('' when they can come). */
export function companionWhyShort(why: string, npc: NpcId, holder?: string | null): string {
  if (!why) return '';
  if (why === COMPANION_REJECT.already) return '같이 다니는 중';
  if (why === COMPANION_REJECT.shop) return '영업 중';
  if (why === COMPANION_REJECT.night) return '밤에만';
  if (holder && why === COMPANION_REJECT.taken(holder)) return `${josa(holder, '과/와')} 동행 중`;
  if (why.startsWith('아직은 어색한가 봐요')) return `하트 ${COMPANION_HEARTS}개부터`;
  void npc;
  // One companion at a time: the one with me goes home first.
  return '지금 동행을 먼저 보내 주세요';
}

// ---------------------------------------------------------------- bond and endings
const userOf = (life: LifeState, uid: string): CompanionUser => ((life.companions ??= {})[uid] ??= {});
const actorName = (life: LifeState, uid: string) => ACTORS[life.actors?.[uid] ?? -1] ?? '친구';
/** Adds relation points the way talks do: without dating, they stop at 8 hearts. */
function addPoints(life: LifeState, uid: string, npc: NpcId, n: number) {
  const user = ((life.ext ??= {})[uid] ??= {});
  const rel = ((user.npcRelations ??= {})[npc] ??= { points: 0 });
  const cap = rel.love ? NPC_POINTS_MAX : Math.min(NPC_POINTS_MAX, Math.max(NPC_DATING_POINTS, rel.points));
  const before = rel.points;
  rel.points = Math.max(0, Math.min(cap, rel.points + n));
  return rel.points - before;
}
/**
 * Brings my outing up to `now`: whole game hours together become relation
 * points (or partner hours), and an outing past its `until` ends.
 */
export function settleCompanion(life: LifeState, uid: string, now: number) {
  const u = life.companions?.[uid];
  const out = u?.out;
  if (!u || !out) return;
  const stop = Math.min(now, out.until);
  const hours = Math.max(0, Math.floor((stop - out.at) / GAME_HOUR_MS));
  const fresh = hours - out.h;
  if (fresh > 0) {
    out.h = hours;
    const love = life.ext?.[uid]?.npcRelations?.[out.npc]?.love;
    if (love) (u.lh ??= {})[out.npc] = Math.min(1_000_000, (u.lh?.[out.npc] ?? 0) + fresh);
    else {
      const day = kstDay(stop);
      if (u.d !== day) {
        u.d = day;
        u.b = 0;
      }
      const room = COMPANION_BOND_DAY_CAP - (u.b ?? 0);
      const got = room > 0 ? addPoints(life, uid, out.npc, Math.min(room, fresh * COMPANION_BOND_PER_HOUR)) : 0;
      u.b = (u.b ?? 0) + got;
    }
    // Walking together is good company; 힘멜 cheers, 메르시 keeps me from tiring out.
    const mood = moodTouch(life, uid, stop);
    if (mood) {
      mood.n[3] = Math.min(100, mood.n[3] + 2 * fresh);
      if (out.npc === 'himmel') mood.n[2] = Math.min(100, mood.n[2] + 4 * fresh);
      if (out.npc === 'mercy') mood.n[1] = Math.max(mood.n[1], 60);
    }
  }
  if (now >= out.until) endCompanion(life, uid, out.until, out.end);
}
function endCompanion(life: LifeState, uid: string, at: number, end: CompanionEnd) {
  const u = life.companions?.[uid];
  if (!u?.out) return;
  u.last = { npc: u.out.npc, at, end };
  delete u.out;
  delete u.pend;
}
/** Logging out (or the lease running out): the companion goes home. */
export function companionLogout(life: LifeState, uid: string, now: number): boolean {
  if (!life.companions?.[uid]?.out) return false;
  settleCompanion(life, uid, now);
  if (life.companions[uid]?.out) endCompanion(life, uid, now, 'logout');
  return true;
}

// ---------------------------------------------------------------- moments
/** Whether a moment can be said right now (the time/place/weather ones; the event ones come from `pend`). */
export function companionMomentNow(o: { moment: CompanionMoment; npc: NpcId; actor: number; now: number; where?: string; fav?: string; bad?: string }): boolean {
  const day = kstDay(o.now),
    sky = weatherOf(day),
    tod = timeOfDay(o.now),
    outside = isCompanionPlace(o.where);
  switch (o.moment) {
    case 'rain':
      return outside && (sky === 'rain' || sky === 'storm');
    case 'snow':
      return outside && sky === 'snow';
    case 'sunrise':
      return outside && tod === 'dawn';
    case 'sunset':
      return outside && tod === 'evening';
    case 'birthday':
      return birthdayActors(day).includes(o.actor);
    case 'favPlace':
      return !!o.fav && o.where === o.fav;
    case 'badPlace':
      return !!o.bad && o.where === o.bad;
    default:
      return false;
  }
}
export const momentKey = (npc: NpcId, m: CompanionMoment) => `${npc}:${m}`;

// ---------------------------------------------------------------- actions
/**
 * Runs on a cloned LifeState (lounge-life.ts lifeActionCore). `world`: which
 * districts are open (where residents are).
 */
export function companionAction(
  life: LifeState,
  member: { id: string; actor: number },
  action: CompanionAction,
  now: number,
  world: NpcWorld = {},
): { first: boolean } {
  const uid = member.id;
  if (!action || action.kind !== 'companion') fail(COMPANION_REJECT.action);
  settleCompanion(life, uid, now);
  const u = userOf(life, uid);
  switch (action.op) {
    case 'invite': {
      const npc = action.npc;
      if (!isNpcId(npc) || !npcVisible(npc)) fail(COMPANION_REJECT.action);
      const points = life.ext?.[uid]?.npcRelations?.[npc]?.points ?? 0;
      const holderUid = companionHolder(life, npc, now);
      const why = companionWhyNot({
        npc,
        points,
        mine: u.out ? u.out.npc : null,
        holder: holderUid && holderUid !== uid ? actorName(life, holderUid) : null,
        now,
        world,
      });
      if (why) fail(why);
      const { until, end } = companionUntil(npc, now, world);
      u.out = { npc, at: now, until, end, h: 0 };
      delete u.pend;
      delete u.ev;
      const first = !u.met?.includes(npc);
      if (first) {
        u.met = [...(u.met ?? []), npc];
        const actor = life.actors?.[uid];
        const actors = typeof actor === 'number' ? [actor] : [];
        addMemory(life, now, 'companion', actors, `${josa(actorName(life, uid), '이/가')} ${josa(NPCS[npc].name, '과/와')} 처음으로 같이 다녔어요`);
      }
      return { first };
    }
    case 'dismiss':
      if (!u.out) fail(COMPANION_REJECT.none);
      endCompanion(life, uid, now, 'dismiss');
      return { first: false };
    case 'moment': {
      const out = u.out;
      if (!out) fail(COMPANION_REJECT.none);
      const m = action.moment;
      if (!isMoment(m)) fail(COMPANION_REJECT.moment);
      const key = momentKey(out!.npc, m);
      if (u.said?.includes(key)) fail(COMPANION_REJECT.moment);
      const pending = !!u.pend?.includes(m);
      const places = COMPANION_PLACES_OF[out!.npc];
      if (!pending && !companionMomentNow({ moment: m, npc: out!.npc, actor: member.actor, now, where: action.where, fav: places.fav, bad: places.bad }))
        fail(COMPANION_REJECT.moment);
      u.said = [...(u.said ?? []), key].slice(-COMPANION_SAID_MAX);
      if (u.pend) {
        u.pend = u.pend.filter((p) => p !== m);
        if (!u.pend.length) delete u.pend;
      }
      return { first: false };
    }
  }
  return fail(COMPANION_REJECT.action);
}

// ---------------------------------------------------------------- after an action
const roll = (key: string, chance: number) => chance > 0 && hash32(key) % 10_000 < Math.round(chance * 10_000);
const ORE_IDS = ORE_ITEMS.map((o) => o.id as string);
/** The odd little things 프리렌 picks up (마법 도구 같은 것), by what the season leaves around. */
const CURIOS = ['pinecone', 'shell', 'stone', 'icicle'] as const;
const invDelta = (before: LifeState, after: LifeState, uid: string) => {
  const a = before.ext?.[uid]?.inv ?? {},
    b = after.ext?.[uid]?.inv ?? {};
  const out: Record<string, number> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const d = (b[k] ?? 0) - (a[k] ?? 0);
    if (d) out[k] = d;
  }
  return out;
};
const statOf = (life: LifeState, uid: string, k: string) => (life.ext?.[uid]?.stats as Record<string, number> | undefined)?.[k] ?? 0;
function note(u: CompanionUser, k: CompanionReact, now: number) {
  u.ev = { k, at: now };
}
function pend(u: CompanionUser, npc: NpcId, m: CompanionMoment) {
  if (u.said?.includes(momentKey(npc, m)) || u.pend?.includes(m)) return;
  u.pend = [...(u.pend ?? []), m];
}

/**
 * After any life action of `member` (lounge-life.ts lifeAction): settles the
 * outing, notes what happened for the companion's bubble and moments, and
 * applies the item effects of the resident walking along — only for the
 * activity the action was. `before` is the life the action started from.
 */
export function companionAfterAction(before: LifeState, after: LifeState, member: { id: string; actor: number }, action: LifeAction | { kind: string }, now: number) {
  const uid = member.id;
  if (!after.companions?.[uid]) return;
  settleCompanion(after, uid, now);
  const npc = companionNow(after, uid, now);
  if (!npc || (action as { kind: string }).kind === 'companion') return;
  const u = userOf(after, uid);
  const kind = (action as { kind: string }).kind;
  const a = action as Record<string, unknown>;
  const key = `cmp:${uid}:${after.seq}:${now}:${kind}`;
  const inv = invDelta(before, after, uid);
  const gained = (ids: readonly string[]) => ids.filter((id) => (inv[id] ?? 0) > 0);

  // --- what happened (bubbles and the event moments)
  const aBefore = before.angling?.u?.[uid],
    aAfter = after.angling?.u?.[uid];
  if (kind === 'anglerHook' && aAfter?.fight) note(u, 'bite', now);
  if (kind === 'anglerLand' && aAfter?.last?.ok && aAfter.last.at === now) {
    const last = aAfter.last;
    note(u, last.treasure ? 'treasure' : 'bigFish', now);
    if (last.legend && (aAfter.legends?.length ?? 0) > (aBefore?.legends?.length ?? 0)) pend(u, npc, 'firstLegend');
  }
  const goldBefore = statOf(before, uid, 'gold'),
    goldAfter = statOf(after, uid, 'gold');
  if (statOf(after, uid, 'harvest') > statOf(before, uid, 'harvest')) {
    note(u, goldAfter > goldBefore ? 'goldStar' : 'harvest', now);
    if (goldAfter > goldBefore) pend(u, npc, 'firstGold');
  }
  const deepBefore = before.growth?.u?.[uid]?.mine?.deep ?? 0,
    deepAfter = after.growth?.u?.[uid]?.mine?.deep ?? 0;
  if (kind === 'mineGo' && deepAfter > deepBefore) {
    note(u, 'mineFloor', now);
    pend(u, npc, 'deepest');
  }
  if (kind === 'cook' && statOf(after, uid, 'cook') > statOf(before, uid, 'cook')) note(u, 'cook', now);

  // --- the effects (each only for its own activity)
  const ext = ((after.ext ??= {})[uid] ??= {});
  switch (npc) {
    case 'frieren':
      if (kind === 'forage' && Object.values(inv).some((n) => n > 0) && roll(`${key}:curio`, COMPANION_NUMBERS.forageCurio))
        addInv(after, uid, CURIOS[hash32(`${key}:curio-item`) % CURIOS.length], 1);
      break;
    case 'beatrice': {
      // Something new in the 도감: a third more of the XP this action gave.
      if ((ext.dex?.length ?? 0) > (before.ext?.[uid]?.dex?.length ?? 0))
        for (const s of SKILLS as readonly SkillId[]) {
          const d = skillXp(after, uid, s) - skillXp(before, uid, s);
          if (d > 0) gainXp(after, uid, s, d * COMPANION_NUMBERS.firstsXp, now);
        }
      break;
    }
    case 'tsunade': {
      // A harvest: each plain or 은별 crop just picked may come up 금별 instead.
      if (statOf(after, uid, 'harvest') <= statOf(before, uid, 'harvest')) break;
      for (const crop of CROPS as Crop[]) {
        const fresh = (q: Quality) => cropQCount(after, uid, crop, q) - cropQCount(before, uid, crop, q);
        let left = Math.max(0, fresh(1)) + Math.max(0, fresh(0));
        let silver = Math.max(0, fresh(1));
        for (let i = 0; left > 0 && i < 12; i++, left--) {
          if (!roll(`${key}:gold:${crop}:${i}`, COMPANION_NUMBERS.goldPts / 100)) continue;
          const from: Quality = silver > 0 ? 1 : 0;
          if (from === 1) silver--;
          addCropQ(after, uid, crop, from, -1);
          addCropQ(after, uid, crop, 2, 1);
          bump(after, uid, 'gold', 1);
          note(u, 'goldStar', now);
          pend(u, npc, 'firstGold');
        }
      }
      break;
    }
    case 'yanineko':
      if (kind === 'cook' && typeof a.recipe === 'string') {
        const made = gained(Object.keys(inv));
        if (made.length && roll(`${key}:cook`, COMPANION_NUMBERS.cookExtra)) addInv(after, uid, made[0], 1);
      }
      break;
    case 'haku':
      // The hub's fruit trees: the next fruit comes a fifth sooner.
      if (kind === 'pick' && typeof a.tree === 'string') {
        const picked = after.fruitPickedAt[uid];
        if (picked?.[a.tree] === now) picked[a.tree] = now - Math.round(FRUIT_COOLDOWN_MS * (1 - COMPANION_NUMBERS.fruitCooldown));
      }
      break;
    case 'gwen':
      // Crafting: a tenth of the materials used comes back (the rest by chance).
      if (kind === 'craft') {
        for (const [id, d] of Object.entries(inv)) {
          if (d >= 0) continue;
          const back = -d * COMPANION_NUMBERS.craftRefund;
          const n = Math.floor(back) + (roll(`${key}:craft:${id}`, back - Math.floor(back)) ? 1 : 0);
          if (n > 0) addInv(after, uid, id, n);
        }
      }
      break;
    case 'nasera':
      // Planting: the plots just sown grow a little faster.
      if (kind === 'plant' || kind === 'farmPlant') {
        for (const p of after.farms[uid] ?? []) if (p.crop && p.plantedAt === now) p.speed = Math.min(MAX_SPEED, (p.speed ?? 0) + COMPANION_NUMBERS.plantSpeed);
      }
      break;
    case 'nilah': {
      if (kind !== 'animalCare') break;
      const day = kstDay(now);
      if (u.nd === day) break;
      const animals = (ext as { s3?: { a?: { love: number; last?: number }[] } }).s3?.a ?? [];
      const cared = animals.filter((x) => x.last === day && x.love < ANIMAL_LOVE_MAX);
      if (!cared.length) break;
      for (const x of cared) x.love = Math.min(ANIMAL_LOVE_MAX, x.love + COMPANION_NUMBERS.animalLove);
      u.nd = day;
      break;
    }
    case 'ornn':
      if (kind === 'mineRock') {
        const ores = gained(ORE_IDS);
        if (ores.length && roll(`${key}:ore`, COMPANION_NUMBERS.oreExtra)) addInv(after, uid, ores[0], 1);
      }
      break;
    case 'carpenter':
      if (kind === 'chop' && (inv.wood ?? 0) > 0) addInv(after, uid, 'wood', COMPANION_NUMBERS.woodExtra);
      break;
    case 'himmel':
      // Everyone likes a hero: a resident I talk to or give to gets +1 more.
      if (kind === 'npcSocial' && isNpcId(a.npc) && a.npc !== 'himmel' && ['talk', 'gift', 'join'].includes(a.op as string)) {
        const pts = (r: LifeState) => r.ext?.[uid]?.npcRelations?.[a.npc as NpcId]?.points ?? 0;
        if (pts(after) !== pts(before) || a.op === 'talk') addPoints(after, uid, a.npc, COMPANION_NUMBERS.socialPoints);
      }
      break;
    case 'lumi': {
      // Festival minigames: the score just set counts a tenth more.
      if (kind !== 'fete') break;
      const best = after.social?.fete?.best?.[String(member.actor)];
      if (best && best.at === now) best.s = Math.min(100_000, Math.round(best.s * COMPANION_NUMBERS.festivalScore));
      break;
    }
    case 'captain': {
      // 먼바다: one more game hour at sea (the trip's own extra time).
      if (kind !== 'voyageBoard') break;
      const trip = after.voyage?.u?.[uid]?.trip;
      if (trip && trip.id !== before.voyage?.u?.[uid]?.trip?.id) trip.x = COMPANION_NUMBERS.voyageGameHours * GAME_HOUR_MS;
      break;
    }
  }
}

// ---------------------------------------------------------------- view
export type CompanionView = {
  /** Who walks with whom right now: uid → { actor, npc, until }. */
  all: Record<string, { actor: number; npc: NpcId; at: number; until: number }>;
  me: {
    out: (CompanionOuting & { hours: number }) | null;
    /** Relation points from walking together today, and the cap. */
    bondToday: number;
    bondCap: number;
    met: NpcId[];
    said: string[];
    pend: CompanionMoment[];
    ev: { k: CompanionReact; at: number } | null;
    last: { npc: NpcId; at: number; end: CompanionEnd } | null;
    loveHours: Partial<Record<NpcId, number>>;
  };
};
export function companionView(life: LifeState, uid: string, now: number): CompanionView {
  const all: CompanionView['all'] = {};
  for (const [id, u] of Object.entries(life.companions ?? {})) {
    const out = u?.out;
    const actor = life.actors?.[id];
    if (out && out.at <= now && now < out.until && typeof actor === 'number') all[id] = { actor, npc: out.npc, at: out.at, until: out.until };
  }
  const u = life.companions?.[uid];
  const live = u?.out && now < u.out.until ? u.out : null;
  const day = kstDay(now);
  return {
    all,
    me: {
      out: live ? { ...live, hours: Math.floor((now - live.at) / GAME_HOUR_MS) } : null,
      bondToday: u?.d === day ? (u.b ?? 0) : 0,
      bondCap: COMPANION_BOND_DAY_CAP,
      met: [...(u?.met ?? [])],
      said: [...(u?.said ?? [])],
      pend: live ? [...(u?.pend ?? [])] : [],
      ev: u?.ev && live && u.ev.at >= live.at ? { ...u.ev } : null,
      last: u?.last ? { ...u.last } : null,
      loveHours: { ...u?.lh },
    },
  };
}
