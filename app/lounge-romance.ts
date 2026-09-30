// Private relationships with the village's adult residents (all of them since
// 2026-09-30; lounge-npc-data.ts is the registry). These never use the seven
// friends' actor ids or shared friendship scores. Points, one talk and one
// gift a day, gift tastes, level presents, invitations home and dates.
//
// Saved rows: life.ext[uid].npcRelations[npc]. Older worlds only had 루미 and
// 매화; their rows load unchanged and every other resident starts at 0.
// Unknown ids and malformed fields are dropped by readNpcRelations.
import { kstDay } from './lounge-economy.ts';
import { ITEM_BY_ID } from './lounge-items.ts';
import { CROPS, LifeError, type LifeState } from './lounge-life.ts';
import { addInv, itemCount, takeItem } from './lounge-life-plus.ts';
import {
  NPCS,
  NPC_DATE_POINTS,
  NPC_GIFT_POINTS,
  NPC_IDS,
  NPC_INVITE_POINTS,
  NPC_POINTS_MAX,
  NPC_REGULAR_POINTS,
  NPC_SPECIAL_POINTS,
  NPC_TALK_POINTS,
  giftReaction,
  isNpcId,
  npcLevel,
  type GiftReaction,
  type NpcId,
} from './lounge-npc-data.ts';
import { npcSpot } from './lounge-npc-schedule.ts';
import { regionFromNetwork } from './lounge-areas.ts';
import { villageFromNetwork, VILLAGE_PLACES } from './lounge-village-layout.ts';
import { josa } from './lounge-text.ts';

export { NPCS, NPC_IDS, NPC_INVITE_POINTS, NPC_DATE_POINTS, NPC_POINTS_MAX, isNpcId, npcLevel };
export type { NpcId };
export const NPC_INVITE_MS = 20 * 60_000;
/** How far (world units) you may stand from a walking resident to talk or give. */
export const NPC_SOCIAL_REACH = 6;
export type NpcSocialAction =
  | { kind: 'npcSocial'; npc: NpcId; op: 'talk' | 'date' | 'invite' | 'dismiss' }
  | { kind: 'npcSocial'; npc: NpcId; op: 'gift'; item: string; q?: 0 | 1 | 2 };
export type NpcRelation = {
  points: number;
  talkedDay?: number;
  giftedDay?: number;
  datedDay?: number;
  dates?: number;
  invitedUntil?: number;
  /** The last thing I gave (they remember it). */
  lastGift?: string;
  /** Level presents received: bit 1 = 단골 (40), bit 2 = 특별한 사이 (100). */
  rw?: number;
};
export type NpcRelations = Partial<Record<NpcId, NpcRelation>>;
export type NpcGuest = { npc: NpcId; until: number };
export type NpcRelationView = NpcRelation & { npc: NpcId; level: string; talked: boolean; gifted: boolean; dated: boolean; visiting: boolean };
export type NpcSocialContext = { area: string; home?: number | null; actor: number; fishing: boolean; x?: number; y?: number };
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
    for (const field of ['talkedDay', 'giftedDay', 'datedDay', 'invitedUntil'] as const) if (safe(v[field])) relation[field] = v[field];
    if (safe(v.dates)) relation.dates = Math.min(10000, v.dates);
    if (typeof v.lastGift === 'string' && npcGiftable(v.lastGift)) relation.lastGift = v.lastGift;
    if (safe(v.rw) && v.rw > 0) relation.rw = v.rw & 3;
    out[npc] = relation;
  }
  return Object.keys(out).length ? out : undefined;
}
export function npcRelationsView(relations: NpcRelations | undefined, now: number): NpcRelationView[] {
  const day = kstDay(now);
  return NPC_IDS.map((npc) => {
    const relation = relations?.[npc] ?? { points: 0 };
    return {
      ...relation,
      npc,
      level: npcLevel(relation.points),
      talked: relation.talkedDay === day,
      gifted: relation.giftedDay === day,
      dated: relation.datedDay === day,
      visiting: (relation.invitedUntil ?? 0) > now,
    };
  });
}
export function npcGuestOf(relations: NpcRelations | undefined, now: number): NpcGuest | undefined {
  for (const npc of NPC_IDS) {
    const until = relations?.[npc]?.invitedUntil ?? 0;
    if (until > now) return { npc, until };
  }
}
function validAction(action: NpcSocialAction) {
  if (!action || !isNpcId(action.npc) || !['talk', 'gift', 'date', 'invite', 'dismiss'].includes(action.op)) fail('마을 주민과 할 일을 다시 골라 주세요.');
}

/** Where a resident can be met right now: area (and, when they walk about, a point). */
export function npcMeetAt(npc: NpcId, now: number): { area: string; point?: { x: number; z: number }; label: string; away: boolean } {
  const s = npcSpot(npc, now);
  // Counter shops (부동산·가구점) open from the village; you meet them at the door.
  if (s.area === 'realty' || s.area === 'furniture') {
    const door = VILLAGE_PLACES.find((p) => p.id === s.area)!.entry;
    return { area: 'village', point: door, label: NPCS[npc].place, away: false };
  }
  const walking = s.area === 'village' || s.area === 'market' || (s.area === 'tavern' && s.visible);
  if (!s.visible && !['casino', 'lounge', 'bank', 'salon', 'tavern'].includes(s.area)) return { area: s.area, label: s.label, away: true };
  return { area: s.area, point: walking ? { x: s.x, z: s.z } : undefined, label: s.label, away: false };
}
/** A network point (0–100) in an area → that area's world coordinates (null when it has none). */
function areaPoint(area: string, x?: number, y?: number) {
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  if (area === 'village') return villageFromNetwork({ x, y });
  if (area === 'market') return regionFromNetwork('market', { x, y });
  return null;
}

/** Cloud calls this with the authoritative player, never client coordinates. */
export function assertNpcSocialContext(action: NpcSocialAction, relations: NpcRelations | undefined, ctx: NpcSocialContext, now: number) {
  validAction(action);
  if (ctx.fishing) fail('낚싯대를 거둔 뒤 주민을 만나 주세요.');
  if (action.op === 'dismiss') return;
  const ownHome = ctx.area === 'home' && (ctx.home ?? ctx.actor) === ctx.actor;
  const invited = (relations?.[action.npc]?.invitedUntil ?? 0) > now;
  if (action.op === 'invite') {
    if (!ownHome) fail('내 방에 들어간 뒤 초대해 주세요.');
    return;
  }
  if (action.op === 'date') {
    if (!ownHome || !invited) fail('내 방에 초대한 주민과 시간을 보내 주세요.');
    return;
  }
  if (ownHome && invited) return;
  const meet = npcMeetAt(action.npc, now);
  const def = NPCS[action.npc];
  if (meet.away) fail(`${josa(def.name, '은/는')} 지금 ${meet.label}이라 만날 수 없어요. 조금 뒤에 찾아와 주세요.`);
  if (ctx.area !== meet.area) fail(`${placeOf(action.npc, meet.area)}에서 만나거나 내 방에 초대해 주세요.`);
  const me = areaPoint(ctx.area, ctx.x, ctx.y);
  if (meet.point && me && Math.hypot(me.x - meet.point.x, me.z - meet.point.z) > NPC_SOCIAL_REACH)
    fail(`${def.name}에게 조금 더 가까이 가서 말을 걸어 주세요.`);
}
const AREA_WORD: Record<string, string> = { village: '마을 중심', market: '시장 거리', tavern: '허풍 주점' };
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

/** Runs on a cloned LifeState; currency and friend bonds are untouched. Returns the gift reaction (gifts) and presents given. */
export function npcSocialAction(life: LifeState, uid: string, action: NpcSocialAction, now: number) {
  validAction(action);
  const user = ((life.ext ??= {})[uid] ??= {});
  const relations = (user.npcRelations ??= {});
  const relation = (relations[action.npc] ??= { points: 0 });
  const day = kstDay(now);
  const add = (n: number) => {
    relation.points = Math.max(0, Math.min(NPC_POINTS_MAX, relation.points + n));
  };
  let reaction: GiftReaction | undefined;
  switch (action.op) {
    case 'talk':
      if (relation.talkedDay === day) fail('오늘 이야기는 나눴어요. 내일 또 만나 주세요.');
      relation.talkedDay = day;
      add(NPC_TALK_POINTS);
      break;
    case 'gift': {
      if (relation.giftedDay === day) fail('오늘 선물은 받았어요. 다음 선물은 내일 전해 주세요.');
      if (typeof action.item !== 'string' || !npcGiftable(action.item)) fail('꽃이나 요리, 작물처럼 선물할 수 있는 물건을 골라 주세요.');
      const q = action.q === 1 || action.q === 2 ? action.q : 0;
      if (action.q !== undefined && action.q !== 0 && action.q !== 1 && action.q !== 2) fail('꽃이나 요리, 작물처럼 선물할 수 있는 물건을 골라 주세요.');
      if (itemCount(life, uid, action.item, q) < 1) fail('선물할 물건이 주머니에 없어요.');
      takeItem(life, uid, action.item, 1, q);
      relation.giftedDay = day;
      relation.lastGift = action.item;
      reaction = npcGiftReaction(action.npc, action.item, q);
      add(NPC_GIFT_POINTS[reaction]);
      break;
    }
    case 'invite': {
      if (relation.points < NPC_INVITE_POINTS) fail('친밀도 20부터 내 방에 초대할 수 있어요.');
      const guest = npcGuestOf(relations, now);
      if (guest && guest.npc !== action.npc) fail('지금 방문한 주민을 배웅한 뒤 초대해 주세요.');
      if (!guest) relation.invitedUntil = now + NPC_INVITE_MS;
      break;
    }
    case 'date':
      if ((relation.invitedUntil ?? 0) <= now) fail('내 방에 초대한 주민과 시간을 보내 주세요.');
      if (relation.points < NPC_DATE_POINTS) fail('친밀도 60부터 데이트를 제안할 수 있어요.');
      if (relation.datedDay === day) fail('오늘 데이트는 함께했어요. 다음 약속은 내일 잡아요.');
      relation.datedDay = day;
      relation.dates = Math.min(10000, (relation.dates ?? 0) + 1);
      add(10);
      break;
    case 'dismiss':
      delete relation.invitedUntil;
      break;
  }
  // Level presents: once each, the first time the points reach the tier.
  const presents: [string, number][] = [];
  for (const [points, bit, tier] of LEVEL_REWARDS)
    if (relation.points >= points && !((relation.rw ?? 0) & bit)) {
      relation.rw = (relation.rw ?? 0) | bit;
      const [item, n] = NPCS[action.npc].rewards[tier];
      addInv(life, uid, item, n);
      presents.push([item, n]);
    }
  return { reaction, presents };
}
/** A short fallback reply per action (dialogue files have the full lines). */
export function npcReply(npc: NpcId, op: NpcSocialAction['op']) {
  const lines: Partial<Record<NpcId, Record<NpcSocialAction['op'], string>>> = {
    lumi: {
      talk: '오늘 꽃집 앞을 지나는데 네가 생각났어. 다음에는 같이 걸을래?',
      gift: '나를 생각하면서 골라 준 거지? 고마워. 오래 기억할게!',
      invite: '초대해 줘서 고마워! 스무 분쯤 쉬었다 가도 될까?',
      date: '이렇게 나란히 앉아 있으니 좋다. 다음 쉬는 날도 함께하자.',
      dismiss: '오늘 즐거웠어. 카지노에서 또 만나!',
    },
    maehwa: {
      talk: '마을이 조용해지는 저녁을 좋아해. 너는 어떤 때가 제일 좋아?',
      gift: '정성이 느껴지는 선물이네. 고맙게 받을게.',
      invite: '차 한 잔 마시며 이야기하자. 스무 분쯤 머물게.',
      date: '너와 이야기하면 시간이 빨리 가네. 오늘을 기억해 둘게.',
      dismiss: '편히 쉬어. 회관에 오면 반갑게 맞아 줄게.',
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
    }[op]
  );
}
