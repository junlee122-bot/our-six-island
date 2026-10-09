// Private relationships with the village's adult residents (all of them since
// 2026-09-30; lounge-npc-data.ts is the registry). These never use the seven
// friends' actor ids or shared friendship scores. Points, one talk and one
// gift a day, gift tastes, level presents, invitations home and dates.
//
// Saved rows: life.ext[uid].npcRelations[npc]. Older worlds only had lumi and
// maehwa (now 미쿠 and 예림이); their rows load unchanged and every other resident starts at 0.
// Unknown ids and malformed fields are dropped by readNpcRelations.
//
// 연애·결혼 (handover/design/design-romance.md): 친구 → 연인 (8 hearts + a
// 꽃다발) → 약혼 (10 hearts, 3 days of dating + a 청혼 반지) → 결혼 (the
// ceremony at the plaza 3 days later; the village news tells everyone). One
// partner per friend at a time; an engaged or married resident belongs to one
// friend only. Without dating, points stop at 8 hearts. Breaking up costs
// hearts and starts a cooldown. A spouse sleeps in the friend's room and
// hands over a small present once a day. Currency is never touched.
import { myDay } from './lounge-myday.ts';
import { kstDay } from './lounge-economy.ts';
import { ITEM_BY_ID } from './lounge-items.ts';
import { CROPS, LifeError, type LifeState } from './lounge-life.ts';
import { addInv, addMemory, addNews, itemCount, takeItem } from './lounge-life-plus.ts';
import { charmPoints } from './lounge-food-data.ts';
import { giftMult } from './lounge-growth.ts';
import {
  NPCS,
  NPC_BREAKUP,
  NPC_DATE_POINTS,
  NPC_DATING_DAYS,
  NPC_DATING_POINTS,
  NPC_DIVORCE,
  NPC_HEART_POINTS,
  NPC_PROPOSE_POINTS,
  NPC_WEDDING_DAYS,
  NPC_GIFT_POINTS,
  NPC_IDS,
  NPC_INVITE_POINTS,
  NPC_POINTS_MAX,
  NPC_REGULAR_POINTS,
  NPC_SPECIAL_POINTS,
  NPC_TALK_POINTS,
  giftReaction,
  npcSpouseOf,
  isNpcId,
  npcLevel,
  type GiftReaction,
  type NpcId,
  type NpcLove,
} from './lounge-npc-data.ts';
import { GAME_MINUTE_MS, birthdayActors, gameHour, hash32 } from './lounge-calendar.ts';
import { ACTORS } from './lounge-roster.ts';
import { npcSpot, type NpcWorld } from './lounge-npc-schedule.ts';
import { npcSocialOf, npcSocialSpot } from './lounge-npc-social.ts';
import { addTiesSeen } from './lounge-npc-social-ties.ts';
import { isDistrictArea, regionFromNetwork } from './lounge-areas.ts';
import { villageFromNetwork, VILLAGE_PLACES } from './lounge-village-layout.ts';
import { josa } from './lounge-text.ts';
import { SHOP_AREAS, SHOP_INTERIORS, isShopArea, shopWorld } from './lounge-shop-interiors.ts';
import { readMemories, talkDays } from './lounge-npc-talk.ts';

/** More chapters than any resident has (a saved `ch` / `vis` above this is clipped). */
const TALK_CHAPTERS_MAX = 8;
/** A relation row made now: the story starts at its first chapter (old rows without `ch` are placed by points). */
export const newNpcRelation = (): NpcRelation => ({ points: 0, ch: 0 });

export { NPCS, NPC_IDS, NPC_INVITE_POINTS, NPC_DATE_POINTS, NPC_POINTS_MAX, isNpcId, npcLevel };
export type { NpcId, NpcLove };
export { NPC_DATING_POINTS, NPC_PROPOSE_POINTS, NPC_DATING_DAYS, NPC_WEDDING_DAYS, NPC_BREAKUP, NPC_DIVORCE, NPC_HEART_POINTS };
export const NPC_INVITE_MS = 20 * 60_000;
/** How far (world units) you may stand from a walking resident to talk or give. */
export const NPC_SOCIAL_REACH = 6;
export type NpcSocialAction =
  | { kind: 'npcSocial'; npc: NpcId; op: 'talk' | 'date' | 'invite' | 'dismiss' | 'bdayGift' | NpcLoveOp }
  | { kind: 'npcSocial'; npc: NpcId; op: 'gift'; item: string; q?: 0 | 1 | 2 }
  /** 끼어들기: join `npc`'s meeting with `with` (lounge-npc-social.ts); a little with both, once a day each. */
  | { kind: 'npcSocial'; npc: NpcId; op: 'join'; with: NpcId }
  /** 엿듣기: overhear `npc`'s meeting with `with`; no points, the pair's tie is noted on the 관계 page. */
  | { kind: 'npcSocial'; npc: NpcId; op: 'overhear'; with: NpcId };
/** Points for joining two residents' chat (each of them, once a KST day). */
export const NPC_JOIN_POINTS = 2;
/** 꽃다발 · 청혼 반지 · 결혼식 · 헤어지기 · 배우자의 아침 선물. */
export type NpcLoveOp = 'ask' | 'propose' | 'wedding' | 'breakup' | 'homeGift';
export const NPC_LOVE_OPS: readonly NpcLoveOp[] = ['ask', 'propose', 'wedding', 'breakup', 'homeGift'];
const NPC_OPS = ['talk', 'gift', 'date', 'invite', 'dismiss', 'join', 'overhear', 'bdayGift', ...NPC_LOVE_OPS];
export type NpcRelation = {
  points: number;
  talkedDay?: number;
  giftedDay?: number;
  /** KST day I last joined their chat with another resident. */
  joinedDay?: number;
  datedDay?: number;
  dates?: number;
  invitedUntil?: number;
  /** The last thing I gave (they remember it). */
  lastGift?: string;
  /** Level presents received: bit 1 = 단골 (40), bit 2 = 특별한 사이 (100). */
  rw?: number;
  /** 연인 · 약혼 · 결혼 (absent: friends). */
  love?: NpcLove;
  /** KST day the dating began. */
  since?: number;
  /** KST day of the wedding (planned while engaged, held once married). */
  weddingDay?: number;
  /** KST day the spouse's morning present was taken. */
  homeGiftDay?: number;
  /** KST day my partner handed over my birthday present (op 'bdayGift'). */
  bdayGiftDay?: number;
  /** After a breakup: no new 꽃다발 (for anyone) before this KST day. */
  coolUntil?: number;
  /** 주민과 진짜 대화 (lounge-npc-talk.ts): talks on different days (absent on old rows: points / 6). */
  tc?: number;
  /** Story chapters done (absent on old rows: placed by points). */
  ch?: number;
  /** Memory tags, oldest first (≤ 20). */
  mem?: string[];
  /** The chapter whose place-and-time visit is done. */
  vis?: number;
};
export type NpcRelations = Partial<Record<NpcId, NpcRelation>>;
export type NpcGuest = { npc: NpcId; until: number; /** My spouse, at home (not an invitation). */ spouse?: true };
export type NpcRelationView = NpcRelation & {
  npc: NpcId;
  level: string;
  talked: boolean;
  gifted: boolean;
  dated: boolean;
  visiting: boolean;
  /** 0–10. */
  hearts: number;
  /** The spouse is home in my room right now. */
  atHome?: boolean;
  homeGifted?: boolean;
};
export type NpcSocialContext = { area: string; home?: number | null; actor: number; fishing: boolean; x?: number; y?: number; /** ③ 언덕 주택가 is open (residents sleep up there). */ hill?: boolean; /** ④ / ⑤ are open (their residents are out). */ ranch?: boolean; foothill?: boolean; /** 주민 동행: the resident walking with me (always beside me, lounge-companion.ts). */ companion?: NpcId | null };
const fail = (text: string): never => {
  throw new LifeError(text);
};
const safe = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isCrop = (id: string) => (CROPS as readonly string[]).includes(id);

export function readNpcRelations(value: unknown): NpcRelations | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const out: NpcRelations = {};
  for (const npc of NPC_IDS) {
    if (!Object.prototype.hasOwnProperty.call(value, npc)) continue;
    const row = (value as Record<string, unknown>)[npc];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const v = row as Record<string, unknown>;
    if (!safe(v.points)) continue;
    const relation: NpcRelation = { points: Math.min(NPC_POINTS_MAX, v.points) };
    for (const field of ['talkedDay', 'giftedDay', 'joinedDay', 'datedDay', 'invitedUntil'] as const) if (safe(v[field])) relation[field] = v[field];
    if (safe(v.dates)) relation.dates = Math.min(10000, v.dates);
    if (typeof v.lastGift === 'string' && npcGiftable(v.lastGift)) relation.lastGift = v.lastGift;
    if (safe(v.rw) && v.rw > 0) relation.rw = v.rw & 3;
    // The realty couple are married to each other: an old row's love state (from before 신형만 · 봉미선) is dropped.
    if (!npcSpouseOf(npc)) {
      if (v.love === 'dating' || v.love === 'engaged' || v.love === 'married') relation.love = v.love;
      for (const field of ['since', 'weddingDay', 'homeGiftDay', 'bdayGiftDay'] as const) if (safe(v[field])) relation[field] = v[field];
    }
    if (safe(v.coolUntil)) relation.coolUntil = v.coolUntil;
    if (safe(v.tc)) relation.tc = Math.min(100_000, v.tc);
    for (const field of ['ch', 'vis'] as const) if (safe(v[field])) relation[field] = Math.min(TALK_CHAPTERS_MAX, v[field]);
    const mem = readMemories(v.mem);
    if (mem) relation.mem = mem;
    out[npc] = relation;
  }
  return Object.keys(out).length ? out : undefined;
}
/** `pday`: my 나의 하루 (lounge-myday.ts) — talked, gifted and dated count on it. */
export function npcRelationsView(relations: NpcRelations | undefined, now: number, pday = kstDay(now)): NpcRelationView[] {
  const day = kstDay(now);
  return NPC_IDS.map((npc) => {
    const relation = relations?.[npc] ?? { points: 0 };
    return {
      ...relation,
      npc,
      level: npcLevel(relation.points),
      talked: relation.talkedDay === pday,
      gifted: relation.giftedDay === pday,
      dated: relation.datedDay === pday,
      visiting: (relation.invitedUntil ?? 0) > now,
      hearts: npcHeartsOf(relation.points),
      ...(relation.love === 'married' ? { atHome: spouseAtHome(npc, now), homeGifted: relation.homeGiftDay === day } : {}),
    };
  });
}
/** Points (0–120) → hearts (0–10). */
export const npcHeartsOf = (points: number) => Math.max(0, Math.min(10, Math.floor((Number.isFinite(points) ? points : 0) / NPC_HEART_POINTS)));
/** The friend's partner (dating, engaged or married), if any. */
export function npcPartnerOf(relations: NpcRelations | undefined): { npc: NpcId; love: NpcLove } | undefined {
  for (const npc of NPC_IDS) {
    const love = relations?.[npc]?.love;
    if (love) return { npc, love };
  }
}
/**
 * A spouse sleeps in the friend's room: whenever their day plan says they
 * sleep, and always 01:00–08:00 on the game clock. The rest of the day they
 * work and walk about as before (npcSpot is the same for everyone).
 */
export function spouseAtHome(npc: NpcId, now: number) {
  const h = gameHour(now);
  return (h >= 1 && h < 8) || npcSpot(npc, now).activity === 'sleep';
}
/** Who (actor) an engaged or married resident belongs to, per resident. */
export function npcSpouses(life: Pick<LifeState, 'ext' | 'actors'>): Partial<Record<NpcId, number>> {
  const out: Partial<Record<NpcId, number>> = {};
  for (const [uid, ext] of Object.entries(life.ext ?? {})) {
    const partner = npcPartnerOf(ext?.npcRelations);
    const actor = life.actors?.[uid];
    if (partner && partner.love !== 'dating' && typeof actor === 'number') out[partner.npc] = actor;
  }
  return out;
}
/** A partner's birthday present (op 'bdayGift'): from the same favourites, its own pick. */
export const birthdayGiftOf = (npc: NpcId, uid: string, day: number) => spouseGiftOf(npc, uid, day, 'bday-gift');
/** The spouse's present today: one of their own favourite things, the same all day. */
export function spouseGiftOf(npc: NpcId, uid: string, day: number, salt = 'spouse-gift'): string {
  const def = NPCS[npc];
  const pool = [def.rewards[40][0], ...def.gifts.loved, ...def.gifts.liked].filter((id) => npcGiftable(id) && Object.prototype.hasOwnProperty.call(ITEM_BY_ID, id));
  const list = pool.length ? [...new Set(pool)] : ['flowertea'];
  return list[hash32(`${salt}:${npc}:${uid}:${day}`) % list.length];
}
export function npcGuestOf(relations: NpcRelations | undefined, now: number): NpcGuest | undefined {
  for (const npc of NPC_IDS) {
    const until = relations?.[npc]?.invitedUntil ?? 0;
    if (until > now) return { npc, until };
  }
  // The spouse, home for the night and the morning (until they leave for work).
  const partner = npcPartnerOf(relations);
  if (partner?.love === 'married' && spouseAtHome(partner.npc, now)) {
    const step = 15 * GAME_MINUTE_MS;
    let until = (Math.floor(now / step) + 1) * step;
    for (let i = 0; i < 96 && spouseAtHome(partner.npc, until); i++) until += step;
    return { npc: partner.npc, until, spouse: true };
  }
}
function validAction(action: NpcSocialAction) {
  if (!action || !isNpcId(action.npc) || !NPC_OPS.includes(action.op)) fail('마을 주민과 할 일을 다시 골라 주세요.');
  if ((action.op === 'join' || action.op === 'overhear') && (!isNpcId(action.with) || action.with === action.npc)) fail('마을 주민과 할 일을 다시 골라 주세요.');
}

/** Where a resident can be met right now: area (and, when they walk about, a point). */
export function npcMeetAt(npc: NpcId, now: number, world: NpcWorld = {}): { area: string; point?: { x: number; z: number }; label: string; away: boolean } {
  // A resident in a meeting stands beside the other one (lounge-npc-social.ts).
  const s = npcSocialSpot(npcSpot(npc, now, world), now, world);
  // Counter shops (부동산·가구점) open from the village; you meet them at the door.
  if (s.area === 'realty' || s.area === 'furniture') {
    const door = VILLAGE_PLACES.find((p) => p.id === s.area)!.entry;
    return { area: 'village', point: door, label: NPCS[npc].place, away: false };
  }
  const walking = s.area === 'village' || isDistrictArea(s.area) || ((s.area === 'tavern' || isShopArea(s.area)) && s.visible);
  if (!s.visible && !['casino', 'lounge', 'bank', 'salon', 'tavern', ...SHOP_AREAS].includes(s.area)) return { area: s.area, label: s.label, away: true };
  return { area: s.area, point: walking ? { x: s.x, z: s.z } : undefined, label: s.label, away: false };
}
/** A network point (0–100) in an area → that area's world coordinates (null when it has none). */
function areaPoint(area: string, x?: number, y?: number) {
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  if (area === 'village') return villageFromNetwork({ x, y });
  if (isDistrictArea(area)) return regionFromNetwork(area, { x, y });
  // The shop rooms: residents walk about in room world units.
  if (isShopArea(area)) return shopWorld({ x, y });
  return null;
}

/** Cloud calls this with the authoritative player, never client coordinates. */
export function assertNpcSocialContext(action: NpcSocialAction, relations: NpcRelations | undefined, ctx: NpcSocialContext, now: number) {
  validAction(action);
  if (ctx.fishing) fail('낚싯대를 거둔 뒤 주민을 만나 주세요.');
  if (action.op === 'dismiss' || action.op === 'breakup') return;
  const ownHome = ctx.area === 'home' && (ctx.home ?? ctx.actor) === ctx.actor;
  const relation = relations?.[action.npc];
  const invited = (relation?.invitedUntil ?? 0) > now || (relation?.love === 'married' && spouseAtHome(action.npc, now));
  if (action.op === 'wedding') {
    if (ctx.area !== 'village') fail('결혼식은 마을 중심 광장에서 올려요.');
    return;
  }
  if (action.op === 'homeGift') {
    if (!ownHome || !invited) fail('배우자가 집에 있을 때 내 방에서 받아요.');
    return;
  }
  if (action.op === 'invite') {
    if (!ownHome) fail('내 방에 들어간 뒤 초대해 주세요.');
    return;
  }
  if (action.op === 'date') {
    if (!ownHome || !invited) fail('내 방에 초대한 주민과 시간을 보내 주세요.');
    return;
  }
  if (action.op === 'join' || action.op === 'overhear') {
    const world = { hill: !!ctx.hill, ranch: !!ctx.ranch, foothill: !!ctx.foothill };
    const ev = npcSocialOf(action.npc, now, world);
    if (!ev || (ev.a !== action.with && ev.b !== action.with)) fail(`${josa(NPCS[action.npc].name, '과/와')} ${josa(NPCS[action.with].name, '은/는')} 지금 함께 있지 않아요.`);
    const me = areaPoint(ctx.area, ctx.x, ctx.y);
    if (ctx.area !== ev!.area || (me && !Object.values(ev!.pos).some((p) => Math.hypot(me.x - p.x, me.z - p.z) <= NPC_SOCIAL_REACH)))
      fail('두 주민 곁으로 조금 더 가까이 가 주세요.');
    return;
  }
  if (ownHome && invited) return;
  // 주민 동행: the resident walking with me is right here, wherever their day plan says.
  if (ctx.companion && ctx.companion === action.npc) return;
  const meet = npcMeetAt(action.npc, now, { hill: !!ctx.hill, ranch: !!ctx.ranch, foothill: !!ctx.foothill });
  const def = NPCS[action.npc];
  if (meet.away) fail(`${josa(def.name, '은/는')} 지금 ${meet.label}이라 만날 수 없어요. 조금 뒤에 찾아와 주세요.`);
  if (ctx.area !== meet.area) fail(`${placeOf(action.npc, meet.area)}에서 만나거나 내 방에 초대해 주세요.`);
  const me = areaPoint(ctx.area, ctx.x, ctx.y);
  if (meet.point && me && Math.hypot(me.x - meet.point.x, me.z - meet.point.z) > NPC_SOCIAL_REACH)
    fail(`${def.name}에게 조금 더 가까이 가서 말을 걸어 주세요.`);
}
const AREA_WORD: Record<string, string> = {
  village: '마을 중심',
  market: '시장 거리',
  harbor: '항구 구역',
  hillside: '언덕 주택가',
  ranch: '목장·과수원',
  foothill: '산기슭 마을',
  tavern: '허풍 주점',
  ...Object.fromEntries(SHOP_AREAS.map((a) => [a, SHOP_INTERIORS[a].name])),
};
const placeOf = (npc: NpcId, area: string) => (area in AREA_WORD && !['captain'].includes(npc) ? AREA_WORD[area] : NPCS[npc].place);

/** Anything but tools can be a present: crops, fruit, fish, bugs, flowers, dishes, ores, fossils. */
export function npcGiftable(item: string) {
  if (typeof item !== 'string') return false;
  if (isCrop(item) || item === 'fruit') return true;
  const def = Object.prototype.hasOwnProperty.call(ITEM_BY_ID, item) ? ITEM_BY_ID[item] : undefined;
  return !!def && def.kind !== 'tool';
}
/** How `npc` feels about `item` (q 2 = a 금별 crop). */
export function npcGiftReaction(npc: NpcId, item: string, q = 0): GiftReaction {
  return giftReaction(npc, { id: item, kind: ITEM_BY_ID[item]?.kind, crop: isCrop(item), gold: q >= 2 });
}
/** The level presents: [points, bit]. */
const LEVEL_REWARDS = [
  [NPC_REGULAR_POINTS, 1, 40],
  [NPC_SPECIAL_POINTS, 2, 100],
] as const;

/** Notes the pair's tie (when they have one) on the member's 관계 page. */
function noteTieSeen(user: { npcTiesSeen?: string[] }, a: NpcId, b: NpcId) {
  const next = addTiesSeen(user.npcTiesSeen, [a < b ? `${a}:${b}` : `${b}:${a}`]);
  if (next) user.npcTiesSeen = next;
}
/** Runs on a cloned LifeState; currency and friend bonds are untouched. Returns the gift reaction (gifts) and presents given. */
export function npcSocialAction(life: LifeState, uid: string, action: NpcSocialAction, now: number) {
  validAction(action);
  const user = ((life.ext ??= {})[uid] ??= {});
  // 엿듣기 and 끼어들기 note the pair on my 관계 page (kept with my account).
  if (action.op === 'overhear' || action.op === 'join') noteTieSeen(user, action.npc, action.with);
  if (action.op === 'overhear') return { reaction: undefined as GiftReaction | undefined, presents: [] as [string, number][] };
  const relations = (user.npcRelations ??= {});
  const relation = (relations[action.npc] ??= newNpcRelation());
  const day = kstDay(now),
    // 나의 하루 (lounge-myday.ts): a talk, a gift, a date and a join a day are mine.
    pday = myDay(life, uid, now);
  const add = (n: number) => npcAddPoints(life, uid, relation, n, now);
  // An engaged or married resident belongs to one friend.
  const takenBy = () => Object.entries(life.ext ?? {}).find(([id, ext]) => id !== uid && ['engaged', 'married'].includes(ext?.npcRelations?.[action.npc]?.love ?? ''));
  const partner = npcPartnerOf(relations);
  const name = NPCS[action.npc].name;
  // 신형만 · 봉미선 are married to each other: no 꽃다발 or 청혼 반지 (the item stays).
  const married = () => {
    const spouse = npcSpouseOf(action.npc);
    if (spouse) fail(`${josa(name, '은/는')} ${josa(NPCS[spouse].name, '과/와')} 결혼한 사이예요.`);
  };
  let reaction: GiftReaction | undefined;
  switch (action.op) {
    case 'talk':
      if (relation.talkedDay === pday) fail('오늘 이야기는 나눴어요. 내일 또 만나 주세요.');
      relation.talkedDay = pday;
      relation.tc = talkDays(relation) + 1;
      add(NPC_TALK_POINTS);
      break;
    case 'join': {
      // Both of them: a little each, once a KST day each (assertNpcSocialContext checked they are together).
      const other = (relations[action.with] ??= newNpcRelation());
      const fresh = [relation, other].filter((r) => r.joinedDay !== pday);
      if (!fresh.length) fail('오늘은 두 사람 이야기에 이미 끼어들었어요. 내일 또 함께해요.');
      for (const r of fresh) {
        r.joinedDay = pday;
        const cap = r.love ? NPC_POINTS_MAX : Math.min(NPC_POINTS_MAX, Math.max(NPC_DATING_POINTS, r.points));
        r.points = Math.max(0, Math.min(cap, r.points + charmPoints(life, uid, now, NPC_JOIN_POINTS)));
      }
      break;
    }
    case 'gift': {
      if (relation.giftedDay === pday) fail('오늘 선물은 받았어요. 다음 선물은 내일 전해 주세요.');
      if (typeof action.item !== 'string' || !npcGiftable(action.item)) fail('꽃이나 요리, 작물처럼 선물할 수 있는 물건을 골라 주세요.');
      const q = action.q === 1 || action.q === 2 ? action.q : 0;
      if (action.q !== undefined && action.q !== 0 && action.q !== 1 && action.q !== 2) fail('꽃이나 요리, 작물처럼 선물할 수 있는 물건을 골라 주세요.');
      if (itemCount(life, uid, action.item, q) < 1) fail('선물할 물건이 주머니에 없어요.');
      takeItem(life, uid, action.item, 1, q);
      relation.giftedDay = pday;
      relation.lastGift = action.item;
      reaction = npcGiftReaction(action.npc, action.item, q);
      // 재능 꽃말 · 잔칫상: a welcome flower or dish counts more.
      add(NPC_GIFT_POINTS[reaction] > 0 ? Math.round(NPC_GIFT_POINTS[reaction] * giftMult(life, uid, action.item)) : NPC_GIFT_POINTS[reaction]);
      break;
    }
    case 'invite': {
      if (relation.points < NPC_INVITE_POINTS) fail('조금 더 친해지면 내 방에 초대할 수 있어요.');
      const guest = npcGuestOf(relations, now);
      if (guest && guest.npc !== action.npc) fail('지금 방문한 주민을 배웅한 뒤 초대해 주세요.');
      if (!guest) relation.invitedUntil = now + NPC_INVITE_MS;
      break;
    }
    case 'date':
      if ((relation.invitedUntil ?? 0) <= now && !(relation.love === 'married' && spouseAtHome(action.npc, now))) fail('내 방에 초대한 주민과 시간을 보내 주세요.');
      if (relation.points < NPC_DATE_POINTS) fail('더 가까워지면 데이트를 제안할 수 있어요.');
      if (relation.datedDay === pday) fail('오늘 데이트는 함께했어요. 다음 약속은 내일 잡아요.');
      relation.datedDay = pday;
      relation.dates = Math.min(10000, (relation.dates ?? 0) + 1);
      add(10);
      break;
    case 'dismiss':
      delete relation.invitedUntil;
      break;
    case 'ask': {
      married();
      if (partner) fail(partner.npc === action.npc ? `${josa(name, '과/와')}는 이미 ${partner.love === 'dating' ? '사귀는' : '함께하는'} 사이예요.` : `${josa(NPCS[partner.npc].name, '과/와')} 함께하는 동안은 다른 주민에게 꽃다발을 건넬 수 없어요.`);
      const cool = Math.max(0, ...NPC_IDS.map((id) => relations[id]?.coolUntil ?? 0));
      if (cool > day) fail(`마음을 추스르는 중이에요. ${cool - day}일 뒤에 다시 꽃다발을 건넬 수 있어요.`);
      if (itemCount(life, uid, 'bouquet') < 1) fail('꽃다발이 없어요. 등불 잡화점에서 살 수 있어요.');
      if (takenBy()) fail(`${josa(name, '은/는')} 이미 다른 친구와 약속한 사이예요.`);
      if (relation.points < NPC_DATING_POINTS) fail('아직은 이른가 봐요. 조금 더 가까워지면 꽃다발을 받아 줄 거예요.');
      takeItem(life, uid, 'bouquet', 1);
      relation.love = 'dating';
      relation.since = day;
      break;
    }
    case 'propose': {
      married();
      if (relation.love !== 'dating') fail(relation.love ? '이미 약속한 사이예요.' : '먼저 꽃다발을 건네 연인이 되어 주세요.');
      if (itemCount(life, uid, 'pledge-ring') < 1) fail('청혼 반지가 없어요. 등불 잡화점에서 살 수 있어요.');
      if (takenBy()) fail(`${josa(name, '은/는')} 이미 다른 친구와 약속한 사이예요.`);
      if (relation.points < NPC_PROPOSE_POINTS) fail('아직은 이른가 봐요. 마음이 더 깊어지면 청혼해 주세요.');
      if (day - (relation.since ?? day) < NPC_DATING_DAYS) fail(`사귄 지 ${NPC_DATING_DAYS}일이 지나면 청혼할 수 있어요.`);
      takeItem(life, uid, 'pledge-ring', 1);
      relation.love = 'engaged';
      relation.weddingDay = day + NPC_WEDDING_DAYS;
      break;
    }
    case 'wedding': {
      if (relation.love !== 'engaged') fail(relation.love === 'married' ? '이미 결혼했어요.' : '청혼을 받아 준 주민과 결혼식을 올려요.');
      if (day < (relation.weddingDay ?? day)) fail(`결혼식은 ${(relation.weddingDay ?? day) - day}일 뒤에 올려요.`);
      relation.love = 'married';
      relation.weddingDay = day;
      delete relation.invitedUntil;
      const actor = life.actors?.[uid];
      const me = typeof actor === 'number' ? ACTORS[actor] ?? '친구' : '친구';
      const actors = typeof actor === 'number' ? [actor] : [];
      const text = `${josa(me, '과/와')} ${josa(name, '이/가')} 광장에서 결혼식을 올렸어요`;
      addNews(life, now, `wedding:${uid}:${action.npc}:${day}`, 'wedding', text, actors);
      addMemory(life, now, 'wedding', actors, text);
      break;
    }
    case 'breakup': {
      if (!relation.love) fail('헤어질 사이가 아니에요.');
      const cost = relation.love === 'dating' ? NPC_BREAKUP : NPC_DIVORCE;
      // The village hears about it too (decided 2026-10-03), kindly and lightly.
      const actor = life.actors?.[uid];
      const me = typeof actor === 'number' ? ACTORS[actor] ?? '친구' : '친구';
      addNews(life, now, `breakup:${uid}:${action.npc}:${day}`, 'breakup', breakupNewsText(relation.love!, me, name), typeof actor === 'number' ? [actor] : []);
      relation.points = Math.min(relation.points, cost.points);
      relation.coolUntil = day + cost.days;
      for (const field of ['love', 'since', 'weddingDay', 'homeGiftDay', 'bdayGiftDay', 'invitedUntil', 'datedDay'] as const) delete relation[field];
      break;
    }
    case 'bdayGift': {
      // 생일 잔치: a lover, fiancé(e) or spouse has a present on my birthday, once that day.
      const me = life.actors?.[uid];
      if (typeof me !== 'number' || !birthdayActors(day).includes(me)) fail('생일 선물은 내 생일에 받아요.');
      if (!relation.love) fail(`${josa(name, '은/는')} 생일을 축하해 줬어요. 선물은 연인에게 받는 걸로 해요.`);
      if (relation.bdayGiftDay === day) fail('생일 선물은 이미 받았어요.');
      relation.bdayGiftDay = day;
      addInv(life, uid, birthdayGiftOf(action.npc, uid, day), 1);
      break;
    }
    case 'homeGift': {
      if (relation.love !== 'married') fail('결혼한 배우자만 아침 선물을 챙겨 줘요.');
      if (!spouseAtHome(action.npc, now)) fail(`${josa(name, '은/는')} 지금 일하러 나갔어요. 밤이나 아침에 집에서 만나요.`);
      if (relation.homeGiftDay === day) fail('오늘 선물은 받았어요. 내일 아침에 또 챙겨 준대요.');
      relation.homeGiftDay = day;
      const item = spouseGiftOf(action.npc, uid, day);
      addInv(life, uid, item, 1);
      break;
    }
  }
  return { reaction, presents: npcLevelPresents(life, uid, action.npc, relation) };
}
/**
 * Adds relation points: 친화력 (food buff) counts talks and gifts half again,
 * and without dating they stop at 8 hearts (older rows above it keep theirs).
 */
export function npcAddPoints(life: LifeState, uid: string, relation: NpcRelation, n: number, now: number) {
  const cap = relation.love ? NPC_POINTS_MAX : Math.min(NPC_POINTS_MAX, Math.max(NPC_DATING_POINTS, relation.points));
  relation.points = Math.max(0, Math.min(cap, relation.points + charmPoints(life, uid, now, n)));
}
/** Level presents: once each, the first time the points reach the tier. */
export function npcLevelPresents(life: LifeState, uid: string, npc: NpcId, relation: NpcRelation) {
  const presents: [string, number][] = [];
  for (const [points, bit, tier] of LEVEL_REWARDS)
    if (relation.points >= points && !((relation.rw ?? 0) & bit)) {
      relation.rw = (relation.rw ?? 0) | bit;
      const [item, n] = NPCS[npc].rewards[tier];
      addInv(life, uid, item, n);
      presents.push([item, n]);
    }
  return presents;
}
/** The village news line of a breakup (연인 · 약혼 · 결혼): light, never mean. */
export function breakupNewsText(love: NpcLove, me: string, name: string) {
  if (love === 'dating') return `${josa(me, '과/와')} ${josa(name, '이/가')} 연인에서 좋은 친구로 돌아갔어요. 둘 다 씩씩하대요`;
  if (love === 'engaged') return `${josa(me, '과/와')} ${name}의 약혼은 없던 일이 됐어요. 마을은 둘 다 응원해요`;
  return `${josa(me, '과/와')} ${josa(name, '이/가')} 각자의 길을 가기로 했어요. 마을은 둘 다 응원해요`;
}
/** A short fallback reply per action (dialogue files have the full lines). */
export function npcReply(npc: NpcId, op: NpcSocialAction['op']) {
  const lines: Partial<Record<NpcId, Partial<Record<NpcSocialAction['op'], string>>>> = {
    lumi: {
      talk: '오늘 카드 섞다가 새 멜로디가 떠올랐어. 첫 소절은 너한테 먼저 들려줄게!',
      gift: '나 생각하면서 골라 준 거지? 삼구, 땡큐! 오래 기억할게!',
      invite: '초대해 줘서 고마워! 리허설 전까지 스무 분쯤 놀다 가도 돼?',
      date: '이렇게 나란히 앉아 있으니까 박자가 딱 맞는 기분이야. 다음 쉬는 날도 같이하자.',
      dismiss: '오늘 무대 최고였어. 카지노에서 또 만나!',
    },
    maehwa: {
      talk: '판이 끝난 회관은 조용해서 좋아. 사람 속도 그때 제일 잘 보이거든.',
      gift: '고르느라 고민한 티가 나네. 그런 패는 언니가 안 버려.',
      invite: '차 한 잔 내와. 스무 분, 딱 그만큼만 머물다 갈게.',
      date: '너랑 있으면 패를 안 읽어도 돼서 편해. 오늘은 기억해 둘게.',
      dismiss: '들어가. 회관 오면 자리 하나는 늘 비워 둘 테니까.',
    },
  };
  const name = NPCS[npc].name;
  return (
    lines[npc]?.[op] ??
    {
      talk: `${josa(name, '과/와')} 잠깐 이야기를 나눴어요.`,
      gift: `${name}에게 선물을 건넸어요.`,
      invite: `${josa(name, '이/가')} 스무 분쯤 들렀다 가기로 했어요.`,
      date: `${josa(name, '과/와')} 느긋한 시간을 보냈어요.`,
      dismiss: `${josa(name, '을/를')} 배웅했어요.`,
      join: `${josa(name, '과/와')} 함께 이야기를 나눴어요.`,
      overhear: `${name}의 이야기를 살짝 엿들었어요.`,
      ask: `${josa(name, '과/와')} 연인이 됐어요.`,
      propose: `${josa(name, '이/가')} 청혼을 받아 줬어요.`,
      wedding: `${josa(name, '과/와')} 결혼식을 올렸어요.`,
      breakup: `${josa(name, '과/와')} 헤어졌어요.`,
      homeGift: `${name}에게 아침 선물을 받았어요.`,
      bdayGift: `${name}에게 생일 선물을 받았어요.`,
    }[op]
  );
}
