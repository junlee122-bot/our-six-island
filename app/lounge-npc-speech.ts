// The resident speech box (app/lounge/NpcTalkDialog.tsx) as pure functions:
// hearts from relation points, the small status on the right of the name,
// and the choices offered after the lines. The rules themselves (one talk
// and one gift a day, where they can be met) stay in lounge-romance.ts;
// this only says what the box shows.
import { NPCS, NPC_POINTS_MAX, NPC_TALK_POINTS, type NpcId, type NpcLove } from './lounge-npc-data.ts';
import type { NpcSpot } from './lounge-npc-schedule.ts';

/** Relation points (0–120) as the ten hearts a friend shows: one heart per 12 points. */
export function npcHearts(points: number) {
  if (!Number.isFinite(points)) return 0;
  return Math.max(0, Math.min(10, Math.floor(points / (NPC_POINTS_MAX / 10))));
}

/**
 * "빵집 카페 사장 · 광장 벤치에서 별 보는 중": their job, then what they are
 * doing. A label that only repeats their workplace ("빵집 카페" for the
 * bakery owner) reads "일하는 중" instead.
 */
export function npcTalkStatus(npc: NpcId, spot: Pick<NpcSpot, 'label' | 'activity'>) {
  const role = NPCS[npc].role;
  const label = spot.label.trim();
  if (!label) return role;
  if (!role.includes(label) && !label.startsWith(role)) return `${role} · ${label}`;
  return spot.activity === 'work' || spot.activity === 'stall' ? `${role} · 일하는 중` : role;
}

export type NpcTalkChoiceId = 'talk' | 'gift' | 'ask' | 'propose' | 'wedding' | 'homeGift' | 'book' | 'request' | 'bye';
export type NpcTalkChoice = { id: NpcTalkChoiceId; label: string; disabled: boolean };

/**
 * The choices after the lines, in this order: talk, gift, 주민 수첩, today's
 * request (only where the board can be opened), leave. Talk and gift stay
 * listed once done or out of reach, but cannot be picked.
 */
export function npcTalkChoices(o: {
  talked: boolean;
  gifted: boolean;
  /** A talk or gift is on its way to the server. */
  busy: boolean;
  /** Why talking and giving are not possible right now ('' when they are). */
  blocked: string;
  /** Today's request ("당근 3개") when it is open and the board is reachable. */
  request?: string | null;
  /** 연애·결혼 choices that apply right now (npcLoveChoices). */
  love?: readonly NpcLoveChoice[];
}): NpcTalkChoice[] {
  const off = o.busy || !!o.blocked;
  const loveLabel: Record<NpcLoveChoice, string> = { ask: '꽃다발 건네기', propose: '청혼 반지 건네기', wedding: '결혼식 올리기', homeGift: '아침 선물 받기' };
  return [
    { id: 'talk', label: o.talked ? '오늘 대화 완료' : `이야기 나누기 · +${NPC_TALK_POINTS}`, disabled: off || o.talked },
    { id: 'gift', label: o.gifted ? '오늘 선물 완료' : '선물 주기', disabled: off || o.gifted },
    ...(o.love ?? []).map((id) => ({ id, label: loveLabel[id], disabled: o.busy || (id !== 'wedding' && !!o.blocked) })),
    { id: 'book', label: '주민 수첩', disabled: false },
    ...(o.request ? [{ id: 'request' as const, label: `부탁 보기 · ${o.request}`, disabled: false }] : []),
    { id: 'bye', label: '그만 가기', disabled: false },
  ];
}

/**
 * Where the cursor starts when the choices appear. Holding E through a talk
 * should never hand over an item or open another window: the cursor starts
 * on talking while that is possible, else on leaving; after a reply it goes
 * to leaving (like a friend's box, which closes after their reply), and back
 * from the gift picker it returns to "선물 주기".
 */
export function npcTalkFocus(choices: readonly NpcTalkChoice[], after: 'open' | 'reply' | 'picker' = 'open') {
  const at = (id: NpcTalkChoiceId) => choices.findIndex((c) => c.id === id && !c.disabled);
  if (after === 'picker' && at('gift') >= 0) return at('gift');
  if (after === 'open' && at('talk') >= 0) return at('talk');
  return choices.findIndex((c) => c.id === 'bye');
}

export type NpcLoveChoice = 'ask' | 'propose' | 'wedding' | 'homeGift';
type LoveRow = { npc: NpcId; points: number; love?: NpcLove; since?: number; weddingDay?: number; atHome?: boolean; homeGifted?: boolean };
/**
 * The love choices in a resident's box: a 꽃다발 while I have one and no
 * partner, a 청혼 반지 to my partner while I have one, the wedding once its
 * day has come, the spouse's morning present at home. Whether they say yes is
 * the server's call (lounge-romance.ts); a box shows their answer either way.
 */
export function npcLoveChoices(o: { npc: NpcId; rows: readonly LoveRow[]; day: number; bouquets: number; rings: number; area: string }): NpcLoveChoice[] {
  const row = o.rows.find((r) => r.npc === o.npc);
  const partner = o.rows.find((r) => r.love);
  const out: NpcLoveChoice[] = [];
  if (!partner && o.bouquets > 0) out.push('ask');
  if (row?.love === 'dating' && o.rings > 0) out.push('propose');
  if (row?.love === 'engaged' && o.day >= (row.weddingDay ?? o.day) && o.area === 'village') out.push('wedding');
  if (row?.love === 'married' && row.atHome && !row.homeGifted) out.push('homeGift');
  return out;
}
/** What a talk needs about my love life with `npc` (npcTalk's love fields). */
export function npcLoveTalk(rows: readonly LoveRow[], npc: NpcId, day: number) {
  const row = rows.find((r) => r.npc === npc);
  const partner = rows.find((r) => r.love && r.npc !== npc);
  const love = row?.love;
  const from = love === 'married' ? row?.weddingDay : row?.since;
  return {
    ...(love ? { love, days: Math.max(0, day - (from ?? day)), atHome: !!row?.atHome } : {}),
    ...(partner ? { otherPartner: NPCS[partner.npc].name, otherNpc: partner.npc, otherLove: partner.love } : {}),
  };
}
/** "연인 · 3일째", "약혼 · 결혼식까지 2일", "결혼 · 함께한 지 40일" (null: friends). */
export function npcLoveStatus(row: LoveRow | undefined, day: number): string | null {
  if (!row?.love) return null;
  if (row.love === 'dating') return `연인 · ${Math.max(0, day - (row.since ?? day)) + 1}일째`;
  if (row.love === 'engaged') {
    const left = (row.weddingDay ?? day) - day;
    return left > 0 ? `약혼 · 결혼식까지 ${left}일` : '약혼 · 오늘 광장에서 결혼식을 올릴 수 있어요';
  }
  return `결혼 · 함께한 지 ${Math.max(0, day - (row.weddingDay ?? day))}일`;
}
