// 주민 관계도: who is what to whom (friends, rivals, family, crushes, the
// married 부동산 couple). It starts from NPC_BONDS (lounge-npc-data.ts, which
// the meeting banter already uses) and adds the ties that bond list does not
// spell out: family, marriage, and more friends for the 3단계 residents and
// 무잔. Ties drive who meets whom in lounge-npc-social.ts and the 관계 page in
// 주민 수첩. 발키리 is 언니 to 도원 · 민서 (NPC_SISTER_FRIENDS): a tie with
// friends, shown on her page.
import { NPC_BONDS, NPC_SISTER_FRIENDS, NPC_SPOUSES, type NpcBond, type NpcId } from './lounge-npc-data.ts';

export type NpcTieKind = 'married' | 'family' | 'crush' | 'friend' | 'mentor' | 'regular' | 'partner' | 'rival';
export type NpcTie = { a: NpcId; b: NpcId; kind: NpcTieKind; note: string };

/** What the 관계 page calls each tie (from a's side and b's side when they differ). */
export const NPC_TIE_WORD: Record<NpcTieKind, string> = {
  married: '부부',
  family: '가족',
  crush: '짝사랑',
  friend: '친구',
  mentor: '스승과 제자',
  regular: '단골',
  partner: '동업자',
  rival: '맞수',
};

/** Ties the bond list does not carry, or carries as something milder. */
const EXTRA_TIES: readonly NpcTie[] = [
  { a: 'gabung', b: 'lux', kind: 'family', note: '오빠와 여동생. 오빠는 과보호, 동생은 도시락 담당' },
  // The bond list has 하쿠 first; the teacher is 츠나데 (mentor ties read a = 스승).
  { a: 'tsunade', b: 'haku', kind: 'mentor', note: '과일나무에 좋은 약초 거름을 가르쳐 준 스승' },
  // 3단계 주민과 무잔에게 친구·맞수를 더해요.
  { a: 'nilah', b: 'yanineko', kind: 'friend', note: '들길 달리기 내기 상대. 지는 쪽이 우유 한 통' },
  { a: 'nilah', b: 'volibas', kind: 'rival', note: '팔씨름 판정 시비. 순경은 늘 무승부라고 우김' },
  { a: 'haku', b: 'nasera', kind: 'regular', note: '과수원 과일을 농협에 대는 사이' },
  { a: 'haku', b: 'bocchi', kind: 'friend', note: '원두막에서 조용히 기타 소리를 듣는 사이' },
  { a: 'ornn', b: 'volibas', kind: 'friend', note: '말없이 통하는 덩치 둘. 대화는 세 마디면 끝' },
  { a: 'ornn', b: 'nilah', kind: 'friend', note: '모루 소리와 웃음소리가 들길을 건너 오가는 사이' },
  { a: 'mercy', b: 'gwen', kind: 'friend', note: '의원과 미용실, 마을 소문이 제일 먼저 닿는 두 곳' },
  { a: 'mercy', b: 'shinichi', kind: 'friend', note: '사건 현장에서 늘 다시 만나는 의사와 탐정' },
  { a: 'shinichi', b: 'beatrice', kind: 'friend', note: '추리소설을 빌려 가서 결말을 먼저 말해 버리는 손님' },
  { a: 'shinichi', b: 'thresh', kind: 'rival', note: '등불 상점의 수상한 장부를 늘 들여다봄' },
  { a: 'muzan', b: 'nyamo', kind: 'rival', note: '예금이냐 투자냐, 창구 둘의 끝없는 금리 논쟁' },
  { a: 'muzan', b: 'makima', kind: 'rival', note: '속을 읽을 수 없는 두 큰손. 웃으며 값을 겨룸' },
  { a: 'muzan', b: 'shinichi', kind: 'rival', note: '지점장의 나이를 추리하는 탐정, 영업 비밀이라는 지점장' },
  { a: 'muzan', b: 'mercy', kind: 'regular', note: '햇볕 좀 쬐라고 잔소리하는 의사와 차양 밑의 단골' },
  { a: 'muzan', b: 'haku', kind: 'regular', note: '과수원 매출을 묻는 지점장, 대답 대신 사과를 건네는 하쿠' },
  { a: 'lumi', b: 'bocchi', kind: 'friend', note: '공연 밤마다 카지노 앞에서 박수를 쳐 주는 딜러' },
  { a: 'misun', b: 'gwen', kind: 'regular', note: '파마 값을 깎는 실장과 절대 안 깎는 원장' },
];

/** Bond kinds read as ties (a bond's kind stays unless EXTRA_TIES or a marriage overrides it). */
const fromBond = (b: NpcBond): NpcTie => ({ a: b.a, b: b.b, kind: b.kind, note: b.note });
const same = (x: { a: string; b: string }, y: { a: string; b: string }) => (x.a === y.a && x.b === y.b) || (x.a === y.b && x.b === y.a);

/** Every tie, one per pair (married first, then the extras, then the bond list). */
export const NPC_TIES: readonly NpcTie[] = (() => {
  const out: NpcTie[] = [];
  const add = (t: NpcTie) => {
    if (t.a !== t.b && !out.some((x) => same(x, t))) out.push(t);
  };
  for (const [a, b] of Object.entries(NPC_SPOUSES) as [NpcId, NpcId][])
    if (a < b) add({ a, b, kind: 'married', note: NPC_BONDS.find((x) => same(x, { a, b }))?.note ?? '결혼한 부부' });
  EXTRA_TIES.forEach(add);
  NPC_BONDS.map(fromBond).forEach(add);
  return out;
})();

/** Ties of residents with friends (by roster name), shown on the resident's page. */
export const NPC_FRIEND_TIES: readonly { npc: NpcId; friend: string; kind: NpcTieKind; note: string }[] = NPC_SISTER_FRIENDS.map((friend) => ({
  npc: 'carpenter' as const,
  friend,
  kind: 'family' as const,
  note: `${friend}에게는 시비 대신 언니 노릇을 하는 동네 언니`,
}));

const tieIndex = new Map<string, NpcTie>();
for (const t of NPC_TIES) tieIndex.set(t.a < t.b ? `${t.a}:${t.b}` : `${t.b}:${t.a}`, t);
/** The tie between two residents (either order), or null. */
export const npcTie = (a: NpcId, b: NpcId): NpcTie | null => tieIndex.get(a < b ? `${a}:${b}` : `${b}:${a}`) ?? null;
/** Every tie of one resident, with the other resident first. */
export const npcTiesOf = (id: NpcId): { other: NpcId; tie: NpcTie }[] =>
  NPC_TIES.filter((t) => t.a === id || t.b === id).map((tie) => ({ other: tie.a === id ? tie.b : tie.a, tie }));
/** The tie's name as seen from `id` (짝사랑 reads "짝사랑 중" / "짝사랑 받는 중"). */
export function npcTieWord(tie: NpcTie, id: NpcId): string {
  if (tie.kind === 'crush') return tie.a === id ? '짝사랑 중' : '짝사랑 받는 중';
  if (tie.kind === 'mentor') return tie.a === id ? '스승' : '제자';
  return NPC_TIE_WORD[tie.kind];
}
/** A stable key for a pair (sorted ids). */
export const pairKey = (a: NpcId, b: NpcId) => (a < b ? `${a}:${b}` : `${b}:${a}`);

/** Every pair key that has a tie (the only keys a member's 관계 page may store). */
export const NPC_TIE_KEYS: ReadonlySet<string> = new Set(tieIndex.keys());
/** A stored list of found-out pairs, cleaned: known tie keys only, no repeats, at most one per tie. */
export function readTiesSeen(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return;
  const out = [...new Set(value.filter((k): k is string => typeof k === 'string' && NPC_TIE_KEYS.has(k)))].slice(0, NPC_TIE_KEYS.size);
  return out.length ? out : undefined;
}
/**
 * `list` with the valid new `keys` added, or null when nothing changes.
 * Unknown keys are ignored; at most NPC_TIE_KEYS.size keys are looked at.
 */
export function addTiesSeen(list: readonly string[] | undefined, keys: readonly unknown[]): string[] | null {
  const seen = new Set(list ?? []);
  const size = seen.size;
  for (const k of keys.slice(0, NPC_TIE_KEYS.size)) if (typeof k === 'string' && NPC_TIE_KEYS.has(k)) seen.add(k);
  return seen.size === size ? null : [...seen];
}
