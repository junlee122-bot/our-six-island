// Friend-life engine (design audit C-3..C-7, C-10): small talk with friends'
// NPCs and the lines friends write for their own NPC, heart-level rewards,
// museum co-donation stamps and shared milestones, participatory festivals
// (추석 송편 빚기 + 달맞이 등, 봄 꽃놀이 화관 + 단체 사진), the "마을 적응하기"
// checklist and the "내일 예고" lines of the daily digest.
//
// Pure and `now`-injected like lounge-life.ts. Server-authoritative: the
// hohyeon-api Edge function runs lifeAction → socialAction. Every grant goes
// through the existing paths (inventory, owned furniture, mail, memories) and
// 범 only through grantBeom (the ledger invariant holds).
//
// Cycle-safe: lounge-life.ts and lounge-life-plus.ts import this module and
// it imports them back, so it only uses their bindings inside functions.
// Top-level constants come from leaf modules (lounge-social-defs.ts,
// lounge-calendar.ts, lounge-items.ts, lounge-friend-lines.ts).
import { cleanText, hasUnsafeText, textLength } from './text-clean.ts';
import { grantBeom, kstDay, type LoungeLedger } from './lounge-economy.ts';
import {
  ACTOR_NAMES,
  FRIEND_PROFILES,
  SEASON_INFO,
  WEATHER_INFO,
  birthdayActors,
  dayStart,
  hash32,
  holidaysOn,
  seasonOfDay,
  timeOfDay,
  weatherOf,
  weekdayOf,
  WEEKLY_EVENTS,
} from './lounge-calendar.ts';
import { DISH_BY_ID, FURNITURE_BY_REF, ITEM_BY_ID, isFurnitureRef, isItemId } from './lounge-items.ts';
import {
  ADAPT_DONE_FURNITURE,
  ADAPT_STEPS,
  BOND_DECAY_FLOOR,
  BOND_DECAY_KEEP,
  BOND_GRACE_DAYS,
  CROWN_FLOWERS,
  FETES,
  FETE_PLAY_MS,
  FRIEND_GIFTS,
  HEART_REWARD_KIND,
  HEART_REWARD_LEVELS,
  LANTERN_TEXT_MAX,
  MUSEUM_MILESTONES,
  MY_LINES_MAX,
  MY_LINE_TEXT_MAX,
  RECIPE_GIFT_N,
  SONGPYEON_MISS_MS,
  SONGPYEON_ROUNDS,
  SONGPYEON_ROUND_MS,
  TALK_POINTS,
  feteEndsAt,
  feteOn,
  nextFete,
  songpyeonRound,
  type AdaptStepId,
  type FeteKind,
  type FeteSlot,
} from './lounge-social-defs.ts';
import { FRIEND_LINES } from './lounge-friend-lines.ts';
import { LifeError, MAIL_MAX, TEXT_COOLDOWN_MS, uidOf, CROP_INFO, plotReadyAt, type LifeState, type MailItem } from './lounge-life.ts';
import { addBond, addInv, addMemory, addNews, bondGate, bondLevel, bondPoints, invCount } from './lounge-life-plus.ts';

// ---------------------------------------------------------------- types
export type FeteState = {
  id: string;
  kind: FeteKind;
  start: number;
  end: number;
  /** Best score per actor ('0'…'6') and when it was set (ties: earlier wins). */
  best?: Record<string, { s: number; at: number }>;
  /** Leaderboard plays used per actor. */
  tries?: Record<string, number>;
  /** Actors who got the participation reward. */
  joined?: number[];
  /** 추석 달맞이 등: one per actor. */
  lanterns?: { actor: number; text: string; at: number }[];
  /** 봄 꽃놀이 단체 사진: actors in the photo. */
  photo?: number[];
  /** A started 송편 game per actor. */
  play?: Record<string, { token: string; at: number }>;
  settled?: boolean;
};
/** `world.life.social` (absent in older worlds; every key optional and bounded). */
export type SocialState = {
  /** Lines each friend wrote for their own NPC (actor → ≤10 lines). */
  lines?: Record<string, string[]>;
  /** 'a>b' → highest heart-reward level friend b has given to a. */
  hr?: Record<string, number>;
  /** 'a-b' (a < b) → last KST day a friendship source counted (decay). */
  bondAt?: Record<string, number>;
  /** Museum items an actor stamped after someone else donated them first. */
  stamps?: Record<string, string[]>;
  /** Museum milestones an actor has been rewarded for (count of MUSEUM_MILESTONES). */
  mm?: Record<string, number>;
  /** 마을 적응하기 steps claimed per actor. */
  adapt?: Record<string, AdaptStepId[]>;
  /** The current (or last) participatory festival. */
  fete?: FeteState;
};
export type SocialAction =
  | { kind: 'npcTalk'; to: number; topic?: number }
  | { kind: 'myLines'; lines: string[] }
  | {
      kind: 'fete';
      op: 'start' | 'finish' | 'lantern' | 'crown' | 'photo';
      token?: string;
      marks?: number[];
      text?: string;
      items?: string[];
    }
  | { kind: 'adapt'; step: AdaptStepId };

export const SOCIAL_REJECT = {
  friend: '말을 걸 친구를 확인해 주세요.',
  lines: `대사는 ${MY_LINES_MAX}줄, 한 줄에 ${MY_LINE_TEXT_MAX}자까지 쓸 수 있어요.`,
  text: '글자를 확인해 주세요.',
  textRate: '잠시 후에 다시 써 주세요.',
  noFete: '오늘은 축제 날이 아니에요.',
  feteKind: '이 축제에서는 할 수 없는 활동이에요.',
  tries: '이번 축제에서 할 수 있는 만큼 다 했어요. 순위표를 확인해 봐요.',
  token: '송편 빚기를 처음부터 다시 시작해 주세요.',
  tooFast: '너무 빨리 끝났어요. 다시 빚어 주세요.',
  marks: '점수를 확인할 수 없어요. 다시 빚어 주세요.',
  night: '달맞이 등은 해가 진 뒤(저녁 5시~새벽 5시)에 띄울 수 있어요.',
  lanternDone: '등은 한 사람에 하나씩 띄워요. 이미 띄웠어요.',
  photoDone: '이미 단체 사진에 들어갔어요.',
  flowers: `꽃 ${CROWN_FLOWERS}송이를 골라 주세요.`,
  noFlowers: '가방에 고른 꽃이 모자라요.',
  step: '적응하기 단계를 확인해 주세요.',
  stepDone: '이미 받은 보상이에요.',
  stepNotYet: '아직 해 보지 않았어요. 먼저 해 보고 받아요.',
} as const;
function fail(message: string): never {
  throw new LifeError(message);
}

// ---------------------------------------------------------------- reading
const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const actorValid = (a: unknown): a is number => safe(a) && a >= 0 && a < 7;
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const ACTOR_KEY = /^[0-6]$/;
const museumOk = (id: string) => isItemId(id) ? !!ITEM_BY_ID[id].museum : own(CROP_INFO, id);
const actorList = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter(actorValid))].slice(0, 7) : []);
function byActor<T>(v: unknown, read: (x: unknown) => T | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, x] of Object.entries(obj(v)).slice(0, 16)) {
    if (!ACTOR_KEY.test(k)) continue;
    const r = read(x);
    if (r !== undefined) out[k] = r;
  }
  return out;
}
const nonEmpty = (o: object) => Object.keys(o).length > 0;
function readFete(v: unknown): FeteState | undefined {
  const f = obj(v);
  if (typeof f.id !== 'string' || !/^[a-z]+-[0-9]{1,6}$/.test(f.id) || !own(FETES, f.kind as string)) return;
  if (!safe(f.start) || !safe(f.end) || f.end < f.start || f.end - f.start > 7) return;
  const out: FeteState = { id: f.id, kind: f.kind as FeteKind, start: f.start, end: f.end };
  const best = byActor(f.best, (b) => {
    const x = obj(b);
    return safe(x.s) && x.s >= 0 && x.s <= 100_000 && safe(x.at) ? { s: x.s, at: x.at } : undefined;
  });
  if (nonEmpty(best)) out.best = best;
  const tries = byActor(f.tries, (n) => (safe(n) && n > 0 ? Math.min(n, 99) : undefined));
  if (nonEmpty(tries)) out.tries = tries;
  const joined = actorList(f.joined);
  if (joined.length) out.joined = joined;
  const lanterns = Array.isArray(f.lanterns)
    ? f.lanterns
        .slice(0, 7)
        .map((l) => {
          const x = obj(l),
            text = cleanText(x.text, LANTERN_TEXT_MAX);
          return actorValid(x.actor) && text ? { actor: x.actor, text, at: safe(x.at) ? x.at : 0 } : null;
        })
        .filter((l): l is { actor: number; text: string; at: number } => !!l)
        .filter((l, i, all) => all.findIndex((o) => o.actor === l.actor) === i)
    : [];
  if (lanterns.length) out.lanterns = lanterns;
  const photo = actorList(f.photo);
  if (photo.length) out.photo = photo;
  const play = byActor(f.play, (p) => {
    const x = obj(p);
    return typeof x.token === 'string' && /^[a-z0-9]{1,16}$/.test(x.token) && safe(x.at) ? { token: x.token, at: x.at } : undefined;
  });
  if (nonEmpty(play)) out.play = play;
  if (f.settled === true) out.settled = true;
  return out;
}
/** Normalizes `world.life.social`; undefined when empty (older worlds read back unchanged). */
export function readSocial(value: unknown): SocialState | undefined {
  const v = obj(value),
    out: SocialState = {};
  const lines = byActor(v.lines, (l) => {
    if (!Array.isArray(l)) return undefined;
    const list = l
      .slice(0, MY_LINES_MAX)
      .map((t) => cleanText(t, MY_LINE_TEXT_MAX))
      .filter(Boolean);
    return list.length ? list : undefined;
  });
  if (nonEmpty(lines)) out.lines = lines;
  const hr: Record<string, number> = {};
  for (const [k, n] of Object.entries(obj(v.hr)).slice(0, 64)) {
    const m = /^([0-6])>([0-6])$/.exec(k);
    if (m && m[1] !== m[2] && safe(n) && n > 0 && n <= 10) hr[k] = n;
  }
  if (nonEmpty(hr)) out.hr = hr;
  const bondAt: Record<string, number> = {};
  for (const [k, d] of Object.entries(obj(v.bondAt)).slice(0, 32)) {
    const m = /^([0-6])-([0-6])$/.exec(k);
    if (m && Number(m[1]) < Number(m[2]) && safe(d) && d > 0) bondAt[k] = d;
  }
  if (nonEmpty(bondAt)) out.bondAt = bondAt;
  const stamps = byActor(v.stamps, (l) => {
    if (!Array.isArray(l)) return undefined;
    const list = [...new Set(l.filter((id): id is string => typeof id === 'string' && id.length <= 48 && museumOk(id)))].slice(0, 200);
    return list.length ? list : undefined;
  });
  if (nonEmpty(stamps)) out.stamps = stamps;
  const mm = byActor(v.mm, (n) => (safe(n) && n > 0 ? Math.min(n, MUSEUM_MILESTONES.length) : undefined));
  if (nonEmpty(mm)) out.mm = mm;
  const ids = ADAPT_STEPS.map((s) => s.id) as string[];
  const adapt = byActor(v.adapt, (l) => {
    if (!Array.isArray(l)) return undefined;
    const list = [...new Set(l.filter((s): s is AdaptStepId => typeof s === 'string' && ids.includes(s)))];
    return list.length ? list : undefined;
  });
  if (nonEmpty(adapt)) out.adapt = adapt;
  const fete = readFete(v.fete);
  if (fete) out.fete = fete;
  return nonEmpty(out) ? out : undefined;
}

// ---------------------------------------------------------------- helpers
const socialOf = (life: LifeState): SocialState => ((life as LifeState & { social?: SocialState }).social ??= {});
/** Read-only access (never creates an empty `social`, so older worlds stay equal). */
const peek = (life: LifeState): SocialState => (life as LifeState & { social?: SocialState }).social ?? {};
const nameOf = (actor: number) => ACTOR_NAMES[actor] ?? '친구';
const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
};
const josaGa = (w: string) => w + (hasBatchim(w) ? '이' : '가');
const josaWa = (w: string) => w + (hasBatchim(w) ? '과' : '와');
const walletOf = (uid: string) => 'wallet-' + uid;
function grant(ledger: LoungeLedger, life: LifeState, uid: string, amount: number, reason: string, now: number) {
  if (amount <= 0 || !own(ledger.accounts, walletOf(uid))) return ledger;
  return grantBeom(ledger, walletOf(uid), amount, `life-${reason}-${uid}-${++life.seq}`, now, reason);
}
function giveFurniture(life: LifeState, uid: string, ref: string, n = 1) {
  if (!isFurnitureRef(ref)) return;
  const x = ((life.ext ??= {})[uid] ??= {}),
    furn = (x.furn ??= {});
  furn[ref] = Math.min(99_999, (furn[ref] ?? 0) + n);
}
/** A letter into `to`'s mailbox from friend `fromActor` (their uid when known). */
function sendMail(life: LifeState, to: string, fromActor: number, text: string, now: number, gift?: MailItem['gift']) {
  const from = uidOf(life, fromActor) ?? to;
  const mail: MailItem = {
    id: `m${now.toString(36)}-${++life.seq}`,
    from,
    actor: fromActor,
    text: cleanText(text, 80),
    ...(gift ? { gift } : {}),
    at: now,
    read: false,
  };
  life.mail[to] = [...(life.mail[to] ?? []), mail].slice(-MAIL_MAX);
}
/** Rejects unsafe text (never silently changes it) and bounds its length. */
function checkText(value: unknown, max: number) {
  if (typeof value !== 'string') fail(SOCIAL_REJECT.text);
  const text = (value as string).trim().replace(/\s+/g, ' ');
  if (!text || hasUnsafeText(text)) fail(SOCIAL_REJECT.text);
  if (textLength(text) > max) fail(SOCIAL_REJECT.lines);
  return text;
}
function textGate(life: LifeState, uid: string, now: number) {
  if (now - (life.lastText[uid] ?? 0) < TEXT_COOLDOWN_MS) fail(SOCIAL_REJECT.textRate);
  life.lastText[uid] = now;
}

// ---------------------------------------------------------------- hearts
/** Points after decay: past BOND_GRACE_DAYS idle days, the part above ♥5 fades 1%/day. */
export function decayedBond(points: number, lastDay: number | undefined, day: number) {
  if (lastDay === undefined || points <= BOND_DECAY_FLOOR) return points;
  const idle = day - lastDay - BOND_GRACE_DAYS;
  if (idle <= 0) return points;
  return Math.max(BOND_DECAY_FLOOR, Math.floor(BOND_DECAY_FLOOR + (points - BOND_DECAY_FLOOR) * BOND_DECAY_KEEP ** Math.min(idle, 365)));
}
/** Last KST day a friendship source counted for a pair (undefined = never tracked). */
export const bondLastDay = (life: LifeState, key: string) =>
  (life as LifeState & { social?: SocialState }).social?.bondAt?.[key];
export function touchBond(life: LifeState, key: string, day: number) {
  (socialOf(life).bondAt ??= {})[key] = day;
}
function heartText(to: number, from: number, levels: number[]) {
  const g = FRIEND_GIFTS[from];
  const parts = levels.flatMap((l) => {
    const kind = HEART_REWARD_KIND[l as 2];
    if (kind === 'recipe') return [`${DISH_BY_ID[g.dish]?.name ?? '요리'} 레시피`];
    if (kind === 'furniture') return [FURNITURE_BY_REF[g.furniture]?.name ?? '가구'];
    if (kind === 'room') return [FURNITURE_BY_REF[g.room]?.name ?? '가구'];
    if (kind === 'signature') return [FURNITURE_BY_REF[g.signature]?.name ?? '선물'];
    return [];
  });
  const top = levels[levels.length - 1];
  return `${nameOf(to)}에게. 우리 벌써 ♥${top}이야! 고마운 마음에 ${parts.join(', ')}${parts.length ? '을(를) 보내' : '마음을 전해'}. 방에서 확인해 줘. - ${nameOf(from)}`;
}
/**
 * Gives friend `to` every heart reward from friend `from` that their current
 * hearts reached and that was not given yet (idempotent via social.hr). One
 * letter per call, so a retroactive catch-up never floods the mailbox.
 */
export function grantHeartRewards(life: LifeState, to: number, from: number, now: number) {
  if (!actorValid(to) || !actorValid(from) || to === from) return;
  const uid = uidOf(life, to);
  if (!uid) return;
  const key = `${to}>${from}`,
    granted = peek(life).hr?.[key] ?? 0,
    level = bondLevel(bondPoints(life, to, from, now));
  const due = HEART_REWARD_LEVELS.filter((l) => l > granted && l <= level);
  if (!due.length) return;
  const social = socialOf(life),
    gifts = FRIEND_GIFTS[from];
  let dish: string | null = null;
  for (const l of due) {
    const kind = HEART_REWARD_KIND[l];
    if (kind === 'recipe' && DISH_BY_ID[gifts.dish]) {
      addInv(life, uid, gifts.dish, RECIPE_GIFT_N);
      dish = gifts.dish;
    } else if (kind === 'furniture') giveFurniture(life, uid, gifts.furniture);
    else if (kind === 'room') giveFurniture(life, uid, gifts.room);
    else if (kind === 'signature') giveFurniture(life, uid, gifts.signature);
    // ♥6 and ♥10 leave one memory per pair (whichever direction comes first).
    if ((kind === 'memory' || kind === 'signature') && (social.hr?.[`${from}>${to}`] ?? 0) < l)
      addMemory(
        life,
        now,
        'bond',
        [Math.min(to, from), Math.max(to, from)],
        kind === 'memory'
          ? `${josaWa(nameOf(to))} ${nameOf(from)}, 둘만의 특별한 이야기를 나눴어요 (♥6)`
          : `${josaWa(nameOf(to))} ${nameOf(from)}, 서로의 단짝이 됐어요 (♥10)`,
      );
  }
  (social.hr ??= {})[key] = due[due.length - 1];
  sendMail(life, uid, from, heartText(to, from, due), now, dish ? { kind: 'item', item: dish, n: RECIPE_GIFT_N } : undefined);
}
/** Titles earned from ♥10 friends (lounge-friend-lines.ts FriendLineSet.title). */
export const titlesOf = (life: LifeState, actor: number, now: number) =>
  [0, 1, 2, 3, 4, 5, 6]
    .filter((b) => b !== actor && bondLevel(bondPoints(life, actor, b, now)) >= 10)
    .map((b) => FRIEND_LINES[b]?.title ?? `${nameOf(b)}의 단짝`);

// ---------------------------------------------------------------- museum
/** Whether an actor already has their stamp on a museum item (first donor or co-donor). */
export function museumStamped(life: LifeState, actor: number, id: string) {
  return life.museum?.[id]?.actor === actor || !!(life as LifeState & { social?: SocialState }).social?.stamps?.[String(actor)]?.includes(id);
}
export function addStamp(life: LifeState, actor: number, id: string) {
  const stamps = (socialOf(life).stamps ??= {}),
    list = (stamps[String(actor)] ??= []);
  if (!list.includes(id) && list.length < 200) list.push(id);
}
/** Actors who ever donated (first or co-donation). */
function museumContributors(life: LifeState) {
  const set = new Set<number>();
  for (const m of Object.values(life.museum ?? {})) set.add(m.actor);
  for (const [a, list] of Object.entries(peek(life).stamps ?? {})) if (list.length) set.add(Number(a));
  return [...set].filter(actorValid).sort((p, q) => p - q);
}
/**
 * Museum milestone rewards: every contributor gets each reached milestone
 * once (idempotent via social.mm). `announceFrom` = display count before the
 * donation, so crossing a threshold leaves one memory and a news line.
 */
export function settleMuseum(life: LifeState, ledger: LoungeLedger, now: number, announceFrom?: number) {
  const count = Object.keys(life.museum ?? {}).length;
  let next = ledger;
  if (announceFrom !== undefined)
    for (const m of MUSEUM_MILESTONES)
      if (announceFrom < m.n && count >= m.n) {
        const text = `마을 박물관 전시 ${m.n}종 달성! “${m.name}” 보상이 기증한 모두에게 갔어요`;
        addMemory(life, now, 'museum', museumContributors(life), text);
        addNews(life, now, `museum-ms:${m.n}`, 'museum', text, museumContributors(life));
      }
  const reached = MUSEUM_MILESTONES.filter((m) => count >= m.n).length;
  if (!reached) return next;
  for (const actor of museumContributors(life)) {
    const uid = uidOf(life, actor);
    if (!uid) continue;
    const done = peek(life).mm?.[String(actor)] ?? 0;
    for (let i = done; i < reached; i++) {
      const m = MUSEUM_MILESTONES[i];
      next = grant(next, life, uid, m.beom, 'museum-ms', now);
      if (m.item) addInv(life, uid, m.item[0], m.item[1]);
      if (m.furniture) giveFurniture(life, uid, m.furniture);
    }
    if (reached > done) (socialOf(life).mm ??= {})[String(actor)] = reached;
  }
  return next;
}

// ---------------------------------------------------------------- festivals
/** The festival state for today's slot (a new festival replaces the last one after settling it). */
function feteFor(life: LifeState, ledger: LoungeLedger, slot: FeteSlot, now: number) {
  const social = socialOf(life);
  let next = ledger;
  if (social.fete?.id !== slot.id) {
    next = settleFete(life, next, now, true);
    social.fete = { id: slot.id, kind: slot.kind, start: slot.start, end: slot.end };
  }
  return { fete: social.fete!, ledger: next };
}
/** Leaderboard of a festival: best score first, earlier on ties. */
export function feteBoard(fete: FeteState | undefined) {
  return Object.entries(fete?.best ?? {})
    .map(([a, b]) => ({ actor: Number(a), score: b.s, at: b.at }))
    .sort((p, q) => q.score - p.score || p.at - q.at || p.actor - q.actor);
}
/**
 * Closes a finished festival once: the winner's trophy furniture and memory,
 * the 단체 사진 / 달맞이 memories. `force` settles even before its last day
 * (used when a different festival replaces it).
 */
export function settleFete(life: LifeState, ledger: LoungeLedger, now: number, force = false) {
  const fete = peek(life).fete;
  if (!fete || fete.settled || (!force && kstDay(now) <= fete.end)) return ledger;
  fete.settled = true;
  delete fete.play;
  const def = FETES[fete.kind],
    board = feteBoard(fete);
  if (board.length) {
    const top = board[0],
      uid = uidOf(life, top.actor);
    if (uid) giveFurniture(life, uid, def.winnerFurniture);
    const podium = board
      .slice(0, 3)
      .map((r, i) => `${i + 1}등 ${nameOf(r.actor)}(${r.score}점)`)
      .join(', ');
    addMemory(life, now, 'festival', board.slice(0, 3).map((r) => r.actor), `${def.name} ${def.game} ${podium}`);
  }
  if (fete.photo?.length)
    addMemory(life, now, 'festival', [...fete.photo].sort((p, q) => p - q), `${def.name} 꽃길 단체 사진 · ${fete.photo.map(nameOf).join(', ')}`);
  if (fete.lanterns?.length)
    addMemory(
      life,
      now,
      'festival',
      fete.lanterns.map((l) => l.actor).sort((p, q) => p - q),
      `한가위 밤하늘에 달맞이 등 ${fete.lanterns.length}개가 떠올랐어요`,
    );
  return ledger;
}
/** The participation reward (once per friend per festival). */
function joinFete(life: LifeState, ledger: LoungeLedger, fete: FeteState, member: { id: string; actor: number }, now: number) {
  if (fete.joined?.includes(member.actor)) return ledger;
  (fete.joined ??= []).push(member.actor);
  const def = FETES[fete.kind];
  giveFurniture(life, member.id, def.joinFurniture);
  if (def.joinItem && isItemId(def.joinItem[0])) addInv(life, member.id, def.joinItem[0], def.joinItem[1]);
  addNews(life, now, `fete:${fete.id}:${member.actor}`, 'festival', `${josaGa(nameOf(member.actor))} ${def.name}에 함께했어요`, [member.actor]);
  return grant(ledger, life, member.id, def.joinBeom, 'fete', now);
}
function feteAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: Extract<SocialAction, { kind: 'fete' }>,
  now: number,
) {
  const slot = feteOn(kstDay(now));
  if (!slot) fail(SOCIAL_REJECT.noFete);
  const opened = feteFor(life, ledger, slot!, now),
    fete = opened.fete;
  let next = opened.ledger;
  const def = FETES[fete.kind],
    key = String(member.actor);
  const needKind = (kind: FeteKind) => {
    if (fete.kind !== kind) fail(SOCIAL_REJECT.feteKind);
  };
  const triesLeft = () => {
    if ((fete.tries?.[key] ?? 0) >= def.tries) fail(SOCIAL_REJECT.tries);
  };
  const score = (s: number) => {
    (fete.tries ??= {})[key] = (fete.tries[key] ?? 0) + 1;
    const prev = fete.best?.[key];
    if (!prev || s > prev.s) (fete.best ??= {})[key] = { s, at: now };
  };
  switch (a.op) {
    case 'start': {
      needKind('chuseok');
      triesLeft();
      const token = (hash32(`fete:${member.id}:${now}:${++life.seq}`) >>> 0).toString(36);
      (fete.play ??= {})[key] = { token, at: now };
      break;
    }
    case 'finish': {
      needKind('chuseok');
      const play = fete.play?.[key];
      if (!play || typeof a.token !== 'string' || a.token !== play.token || now - play.at > FETE_PLAY_MS) fail(SOCIAL_REJECT.token);
      if (now - play!.at < SONGPYEON_ROUNDS * SONGPYEON_ROUND_MS * 0.8) fail(SOCIAL_REJECT.tooFast);
      const marks = a.marks;
      if (!Array.isArray(marks) || marks.length !== SONGPYEON_ROUNDS || !marks.every((m) => safe(m) && Math.abs(m) <= SONGPYEON_MISS_MS))
        fail(SOCIAL_REJECT.marks);
      triesLeft();
      delete fete.play![key];
      if (!nonEmpty(fete.play!)) delete fete.play;
      const s = marks!.reduce((sum, m) => sum + songpyeonRound(m), 0);
      score(s);
      next = joinFete(life, next, fete, member, now);
      break;
    }
    case 'lantern': {
      needKind('chuseok');
      const tod = timeOfDay(now);
      if (tod !== 'evening' && tod !== 'night') fail(SOCIAL_REJECT.night);
      if (fete.lanterns?.some((l) => l.actor === member.actor)) fail(SOCIAL_REJECT.lanternDone);
      const text = checkText(a.text, LANTERN_TEXT_MAX);
      textGate(life, member.id, now);
      (fete.lanterns ??= []).push({ actor: member.actor, text, at: now });
      next = joinFete(life, next, fete, member, now);
      break;
    }
    case 'crown': {
      needKind('blossom');
      triesLeft();
      const items = a.items;
      if (!Array.isArray(items) || items.length !== CROWN_FLOWERS || !items.every((id) => isItemId(id) && ITEM_BY_ID[id].cat === 'flower'))
        fail(SOCIAL_REJECT.flowers);
      const need: Record<string, number> = {};
      for (const id of items!) need[id] = (need[id] ?? 0) + 1;
      for (const [id, n] of Object.entries(need)) if (invCount(life, member.id, id) < n) fail(SOCIAL_REJECT.noFlowers);
      for (const [id, n] of Object.entries(need)) addInv(life, member.id, id, -n);
      const s = items!.reduce((sum, id) => sum + ITEM_BY_ID[id].sell, 0) + Object.keys(need).length * 40;
      score(s);
      next = joinFete(life, next, fete, member, now);
      break;
    }
    case 'photo': {
      needKind('blossom');
      if (fete.photo?.includes(member.actor)) fail(SOCIAL_REJECT.photoDone);
      (fete.photo ??= []).push(member.actor);
      next = joinFete(life, next, fete, member, now);
      break;
    }
    default:
      fail(SOCIAL_REJECT.feteKind);
  }
  return next;
}

// ---------------------------------------------------------------- actions
/**
 * Applies one social action on an already-cloned life (lounge-life.ts
 * lifeAction clones and registers the member first, then runs the shared
 * after-action settle).
 */
export function socialAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: SocialAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const actor = member.actor,
    key = String(actor);
  let next = ledger;
  switch (a.kind) {
    case 'npcTalk': {
      if (!actorValid(a.to) || a.to === actor) fail(SOCIAL_REJECT.friend);
      // Small talk counts once per friend per day; later talks are just talks.
      if (bondGate(life, `c:${actor}>${a.to}`, now)) addBond(life, actor, a.to, TALK_POINTS, now);
      break;
    }
    case 'myLines': {
      if (!Array.isArray(a.lines) || a.lines.length > MY_LINES_MAX) fail(SOCIAL_REJECT.lines);
      const lines = a.lines
        .filter((t) => typeof t !== 'string' || t.trim())
        .map((t) => checkText(t, MY_LINE_TEXT_MAX));
      textGate(life, member.id, now);
      const social = socialOf(life);
      if (lines.length) (social.lines ??= {})[key] = lines;
      else if (social.lines) {
        delete social.lines[key];
        if (!nonEmpty(social.lines)) delete social.lines;
      }
      break;
    }
    case 'fete':
      next = feteAction(life, next, member, a, now);
      break;
    case 'adapt': {
      const step = ADAPT_STEPS.find((s) => s.id === a.step);
      if (!step) fail(SOCIAL_REJECT.step);
      const social = socialOf(life),
        claimed = social.adapt?.[key] ?? [];
      if (claimed.includes(step!.id)) fail(SOCIAL_REJECT.stepDone);
      const stats = life.ext?.[member.id]?.stats ?? {};
      if ((step!.id === 'sell' && !(stats.earned ?? 0)) || (step!.id === 'fish' && !(stats.fish ?? 0))) fail(SOCIAL_REJECT.stepNotYet);
      const list = [...claimed, step!.id];
      (social.adapt ??= {})[key] = list;
      next = grant(next, life, member.id, step!.reward, 'adapt', now);
      if (ADAPT_STEPS.every((s) => list.includes(s.id))) {
        giveFurniture(life, member.id, ADAPT_DONE_FURNITURE);
        addMemory(life, now, 'adapt', [actor], `${josaGa(nameOf(actor))} 마을 적응하기를 모두 마쳤어요`);
      }
      break;
    }
    default:
      fail(SOCIAL_REJECT.step);
  }
  return { life, ledger: next };
}
/**
 * Runs after every life action of `member` (lounge-life-plus afterCoreAction):
 * retroactive heart rewards, a finished festival's results, museum milestones.
 */
export function settleSocial(life: LifeState, ledger: LoungeLedger, member: { id: string; actor: number }, now: number) {
  if (!actorValid(member.actor)) return ledger;
  for (let b = 0; b < 7; b++) if (b !== member.actor) grantHeartRewards(life, member.actor, b, now);
  let next = settleFete(life, ledger, now);
  if (MUSEUM_MILESTONES.some((m) => Object.keys(life.museum ?? {}).length >= m.n)) next = settleMuseum(life, next, now);
  return next;
}

// ---------------------------------------------------------------- views
export type FeteView = {
  id: string;
  kind: FeteKind;
  name: string;
  game: string;
  extra: string;
  start: number;
  end: number;
  endsAt: number;
  /** Today is one of its days. */
  active: boolean;
  board: { actor: number; score: number }[];
  triesLeft: number;
  joined: boolean;
  lanterns: { actor: number; text: string }[];
  photo: number[];
  /** My started 송편 game (token for finish). */
  play: { token: string; at: number } | null;
};
export type SocialView = {
  /** Lines each friend wrote for their own NPC (actor → lines). */
  lines: Record<number, string[]>;
  /** Friends I had small talk with today. */
  talked: number[];
  /** Heart rewards and decay per friend. */
  hearts: Record<number, { granted: number; lastDay: number | null; idle: number; fading: boolean }>;
  titles: string[];
  museum: {
    /** Item → actors who stamped it (first donor first). */
    donors: Record<string, number[]>;
    stats: { actor: number; first: number; total: number }[];
    count: number;
    milestones: { n: number; name: string; reached: boolean }[];
    /** Items I have stamped. */
    mine: string[];
  };
  fete: FeteView | null;
  nextFete: { kind: FeteKind; name: string; start: number } | null;
  adapt: AdaptStepId[];
  /** "내일 예고" lines. */
  tomorrow: string[];
};
function feteView(life: LifeState, actor: number, day: number): FeteView | null {
  const slot = feteOn(day),
    stored = peek(life).fete;
  // Today's festival, or the one that just ended (results until the next starts).
  const fete: FeteState | null =
    slot && stored?.id === slot.id
      ? stored
      : slot
        ? { id: slot.id, kind: slot.kind, start: slot.start, end: slot.end }
        : stored && day - stored.end <= 3
          ? stored
          : null;
  if (!fete) return null;
  const def = FETES[fete.kind],
    key = String(actor);
  return {
    id: fete.id,
    kind: fete.kind,
    name: def.name,
    game: def.game,
    extra: def.extra,
    start: fete.start,
    end: fete.end,
    endsAt: feteEndsAt({ kind: fete.kind, id: fete.id, start: fete.start, end: fete.end }),
    active: !!slot && slot.id === fete.id,
    board: feteBoard(fete).map(({ actor: a, score }) => ({ actor: a, score })),
    triesLeft: Math.max(0, def.tries - (fete.tries?.[key] ?? 0)),
    joined: !!fete.joined?.includes(actor),
    lanterns: (fete.lanterns ?? []).map((l) => ({ actor: l.actor, text: l.text })),
    photo: [...(fete.photo ?? [])],
    play: fete.play?.[key] ? { ...fete.play[key] } : null,
  };
}
/** "내일 예고": what tomorrow brings (weather, festivals, holidays, birthdays, crops). */
export function tomorrowLines(life: LifeState, uid: string, actor: number, now: number): string[] {
  const day = kstDay(now),
    tomorrow = day + 1,
    out: string[] = [];
  const fete = feteOn(tomorrow);
  if (fete && fete.start === tomorrow) out.push(`내일은 ${FETES[fete.kind].name}! 광장에서 ${FETES[fete.kind].game}를 해요.`);
  const today = feteOn(day);
  if (today && today.end === day) out.push(`오늘이 ${FETES[today.kind].name} 마지막 날이에요. 내일 순위가 추억 앨범에 남아요.`);
  for (const h of holidaysOn(tomorrow)) if (!holidaysOn(day).some((x) => x.key === h.key)) out.push(`내일은 ${h.name}이에요. ${h.text}.`);
  for (const b of birthdayActors(tomorrow, FRIEND_PROFILES)) out.push(`내일은 ${nameOf(b)}의 생일이에요. 선물을 준비해 볼까요?`);
  if (seasonOfDay(tomorrow) !== seasonOfDay(day)) out.push(`내일부터 ${SEASON_INFO[seasonOfDay(tomorrow)].name}이에요. 제철 씨앗을 확인해요.`);
  const w = weatherOf(tomorrow);
  out.push(
    WEATHER_INFO[w].waters
      ? `내일은 ${WEATHER_INFO[w].name} 소식이 있어요. 밭에 물을 안 줘도 돼요.`
      : `내일 날씨는 ${WEATHER_INFO[w].name}이에요.`,
  );
  const weekly = WEEKLY_EVENTS.find((e) => e.weekday === weekdayOf(tomorrow));
  if (weekly) out.push(`내일은 ${weekly.name} · ${weekly.text}.`);
  const morning = dayStart(tomorrow) + 9 * 3_600_000;
  const ripe = (life.farms[uid] ?? []).filter((p) => {
    const at = plotReadyAt(p, now);
    return at !== null && at > now && at <= morning;
  }).length;
  if (ripe) out.push(`내 밭 ${ripe}칸이 내일 아침까지 다 자라요.`);
  void actor;
  return out.slice(0, 4);
}
export function socialView(life: LifeState, uid: string, actor: number, now: number): SocialView {
  const day = kstDay(now),
    social = (life as LifeState & { social?: SocialState }).social ?? {};
  const lines: Record<number, string[]> = {};
  for (const [a, l] of Object.entries(social.lines ?? {})) lines[Number(a)] = [...l];
  const talked = (life.bondDay?.day === day ? life.bondDay.keys : [])
    .map((k) => /^c:([0-6])>([0-6])$/.exec(k))
    .filter((m): m is RegExpExecArray => !!m && Number(m[1]) === actor)
    .map((m) => Number(m[2]));
  const hearts: SocialView['hearts'] = {};
  for (let b = 0; b < 7; b++) {
    if (b === actor) continue;
    const pair = actor < b ? `${actor}-${b}` : `${b}-${actor}`,
      last = social.bondAt?.[pair];
    const idle = last === undefined ? 0 : Math.max(0, day - last);
    hearts[b] = {
      granted: social.hr?.[`${actor}>${b}`] ?? 0,
      lastDay: last ?? null,
      idle,
      fading: idle > BOND_GRACE_DAYS && (life.bonds?.[pair] ?? 0) > BOND_DECAY_FLOOR,
    };
  }
  const donors: Record<string, number[]> = {};
  for (const [id, m] of Object.entries(life.museum ?? {})) donors[id] = [m.actor];
  for (const [a, list] of Object.entries(social.stamps ?? {}))
    for (const id of list) if (donors[id] && !donors[id].includes(Number(a))) donors[id].push(Number(a));
  const count = Object.keys(life.museum ?? {}).length;
  const stats = [0, 1, 2, 3, 4, 5, 6].map((a) => {
    const first = Object.values(life.museum ?? {}).filter((m) => m.actor === a).length;
    return { actor: a, first, total: first + (social.stamps?.[String(a)]?.filter((id) => life.museum?.[id]).length ?? 0) };
  });
  const next = nextFete(day);
  return {
    lines,
    talked,
    hearts,
    titles: titlesOf(life, actor, now),
    museum: {
      donors,
      stats,
      count,
      milestones: MUSEUM_MILESTONES.map((m) => ({ n: m.n, name: m.name, reached: count >= m.n })),
      mine: Object.keys(life.museum ?? {}).filter((id) => museumStamped(life, actor, id)),
    },
    fete: feteView(life, actor, day),
    nextFete: next ? { kind: next.kind, name: FETES[next.kind].name, start: next.start } : null,
    adapt: [...(social.adapt?.[String(actor)] ?? [])],
    tomorrow: tomorrowLines(life, uid, actor, now),
  };
}
