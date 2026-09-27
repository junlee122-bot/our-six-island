// Private relationships with two fictional adult residents. These never use
// the seven friends' actor ids or shared friendship scores.
import { kstDay } from './lounge-economy.ts';
import { ITEM_BY_ID } from './lounge-items.ts';
import { LifeError, type LifeState } from './lounge-life.ts';
import { addInv, invCount } from './lounge-life-plus.ts';

export const NPC_IDS = ['lumi', 'maehwa'] as const;
export type NpcId = (typeof NPC_IDS)[number];
export const NPCS = {
  lumi: { name: '루미', age: 25, area: 'casino', place: '별빛 카지노', likes: '꽃', intro: '쉬는 날에는 꽃을 구경하고 작은 카페를 찾아다녀요.', likeKind: 'flower' },
  maehwa: { name: '매화', age: 27, area: 'lounge', place: '범마을 회관', likes: '직접 만든 요리', intro: '따뜻한 차와 정성껏 차린 한 끼를 좋아해요.', likeKind: 'dish' },
} as const;
export const NPC_INVITE_MS = 20 * 60_000;
export const NPC_INVITE_POINTS = 20;
export const NPC_DATE_POINTS = 60;
export const NPC_POINTS_MAX = 120;
export type NpcSocialAction = { kind: 'npcSocial'; npc: NpcId; op: 'talk' | 'date' | 'invite' | 'dismiss' }
  | { kind: 'npcSocial'; npc: NpcId; op: 'gift'; item: string };
export type NpcRelation = { points: number; talkedDay?: number; giftedDay?: number; datedDay?: number; dates?: number; invitedUntil?: number };
export type NpcRelations = Partial<Record<NpcId, NpcRelation>>;
export type NpcGuest = { npc: NpcId; until: number };
export type NpcRelationView = NpcRelation & { npc: NpcId; level: string; talked: boolean; gifted: boolean; dated: boolean; visiting: boolean };
export type NpcSocialContext = { area: string; home?: number | null; actor: number; fishing: boolean };
const fail = (text: string): never => { throw new LifeError(text); };
export const isNpcId = (id: unknown): id is NpcId => id === 'lumi' || id === 'maehwa';
const safe = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function readNpcRelations(value: unknown): NpcRelations | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const out: NpcRelations = {};
  for (const npc of NPC_IDS) {
    const row = (value as Record<string, unknown>)[npc];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const v = row as Record<string, unknown>;
    if (!safe(v.points)) continue;
    const relation: NpcRelation = { points: Math.min(NPC_POINTS_MAX, v.points) };
    for (const field of ['talkedDay', 'giftedDay', 'datedDay', 'invitedUntil'] as const)
      if (safe(v[field])) relation[field] = v[field];
    if (safe(v.dates)) relation.dates = Math.min(10000, v.dates);
    out[npc] = relation;
  }
  return Object.keys(out).length ? out : undefined;
}
export const npcLevel = (points: number) => points >= 100 ? '특별한 사이' : points >= NPC_DATE_POINTS ? '설레는 사이' : points >= NPC_INVITE_POINTS ? '친구' : '인사하는 사이';
export function npcRelationsView(relations: NpcRelations | undefined, now: number): NpcRelationView[] {
  const day = kstDay(now);
  return NPC_IDS.map((npc) => {
    const relation = relations?.[npc] ?? { points: 0 };
    return { ...relation, npc, level: npcLevel(relation.points), talked: relation.talkedDay === day, gifted: relation.giftedDay === day, dated: relation.datedDay === day, visiting: (relation.invitedUntil ?? 0) > now };
  });
}
export function npcGuestOf(relations: NpcRelations | undefined, now: number): NpcGuest | undefined {
  for (const npc of NPC_IDS) {
    const until = relations?.[npc]?.invitedUntil ?? 0;
    if (until > now) return { npc, until };
  }
}
function validAction(action: NpcSocialAction) {
  if (!isNpcId(action.npc) || !['talk', 'gift', 'date', 'invite', 'dismiss'].includes(action.op)) fail('마을 주민과 할 일을 다시 골라 주세요.');
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
  } else if (action.op === 'date') {
    if (!ownHome || !invited) fail('내 방에 초대한 주민과 시간을 보내 주세요.');
  } else if (ctx.area !== NPCS[action.npc].area && !(ownHome && invited)) fail(`${NPCS[action.npc].place}에서 만나거나 내 방에 초대해 주세요.`);
}
export function npcGiftable(item: string) {
  const def = ITEM_BY_ID[item];
  return !!def && (def.kind === 'flower' || def.kind === 'dish');
}
/** Runs on a cloned LifeState; currency and friend bonds are untouched. */
export function npcSocialAction(life: LifeState, uid: string, action: NpcSocialAction, now: number) {
  validAction(action);
  const user = ((life.ext ??= {})[uid] ??= {});
  const relations = (user.npcRelations ??= {});
  const relation = (relations[action.npc] ??= { points: 0 });
  const day = kstDay(now);
  const add = (n: number) => { relation.points = Math.min(NPC_POINTS_MAX, relation.points + n); };
  switch (action.op) {
    case 'talk':
      if (relation.talkedDay === day) fail('오늘 이야기는 나눴어요. 내일 또 만나 주세요.');
      relation.talkedDay = day;
      add(6);
      break;
    case 'gift': {
      if (relation.giftedDay === day) fail('오늘 선물은 받았어요. 다음 선물은 내일 전해 주세요.');
      if (typeof action.item !== 'string' || !npcGiftable(action.item)) fail('꽃이나 만든 요리를 선물해 주세요.');
      if (invCount(life, uid, action.item) < 1) fail('선물할 물건이 주머니에 없어요.');
      addInv(life, uid, action.item, -1);
      relation.giftedDay = day;
      add(ITEM_BY_ID[action.item].kind === NPCS[action.npc].likeKind ? 12 : 8);
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
}
export function npcReply(npc: NpcId, op: NpcSocialAction['op']) {
  const lines = {
    lumi: { talk: '오늘 꽃집 앞을 지나는데 네가 생각났어. 다음에는 같이 걸을래?', gift: '나를 생각하면서 골라 준 거지? 고마워. 오래 기억할게!', invite: '초대해 줘서 고마워! 스무 분쯤 쉬었다 가도 될까?', date: '이렇게 나란히 앉아 있으니 좋다. 다음 쉬는 날도 함께하자.', dismiss: '오늘 즐거웠어. 카지노에서 또 만나!' },
    maehwa: { talk: '마을이 조용해지는 저녁을 좋아해. 너는 어떤 때가 제일 좋아?', gift: '정성이 느껴지는 선물이네. 고맙게 받을게.', invite: '차 한 잔 마시며 이야기하자. 스무 분쯤 머물게.', date: '너와 이야기하면 시간이 빨리 가네. 오늘을 기억해 둘게.', dismiss: '편히 쉬어. 회관에 오면 반갑게 맞아 줄게.' },
  };
  return lines[npc][op];
}
