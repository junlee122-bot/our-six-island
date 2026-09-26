// Korean text helpers shared by all lounge UI: particles (josa), a names glossary and currency formatting.

export type JosaPair =
  | '은/는'
  | '이/가'
  | '을/를'
  | '과/와'
  | '으로/로'
  | '이에요/예요'
  | '이랑/랑'
  | '아/야';

const HANGUL_START = 0xac00,
  HANGUL_END = 0xd7a3;
// Final-consonant readings for trailing digits / latin letters (Korean pronunciation).
const DIGIT_BATCHIM: Record<string, number> = {
  '0': 1,
  '1': 8,
  '2': 0,
  '3': 1,
  '4': 0,
  '5': 0,
  '6': 1,
  '7': 8,
  '8': 8,
  '9': 0,
}; // 0: none, 8: ㄹ, 1: other
const LATIN_BATCHIM: Record<string, number> = {
  l: 8,
  m: 1,
  n: 1,
  r: 0,
  b: 0,
  c: 0,
  d: 0,
  f: 0,
  g: 0,
  h: 0,
  i: 0,
  j: 0,
  k: 0,
  o: 0,
  p: 0,
  q: 0,
  s: 0,
  t: 0,
  u: 0,
  v: 0,
  w: 0,
  x: 0,
  y: 0,
  z: 0,
  a: 0,
  e: 0,
};

/** 0 = no final consonant, 8 = final ㄹ, other positive = some other final consonant. -1 = unknown. */
export function finalConsonant(word: string): number {
  const trimmed = String(word ?? '').replace(/[\s)\]}"'’”.,!?·…~]+$/u, '');
  const ch = trimmed.slice(-1);
  if (!ch) return -1;
  const code = ch.charCodeAt(0);
  if (code >= HANGUL_START && code <= HANGUL_END) {
    const jong = (code - HANGUL_START) % 28;
    return jong;
  }
  if (ch in DIGIT_BATCHIM) return DIGIT_BATCHIM[ch];
  const lower = ch.toLowerCase();
  if (lower in LATIN_BATCHIM) return LATIN_BATCHIM[lower];
  return -1;
}

/** Particle only (without the word). */
export function particle(word: string, pair: JosaPair): string {
  const [withBatchim, without] = pair.split('/') as [string, string];
  const jong = finalConsonant(word);
  if (jong < 0) return withBatchim; // unknown ending: the batchim form reads acceptably
  if (pair === '으로/로')
    return jong === 0 || jong === 8 ? without : withBatchim;
  return jong === 0 ? without : withBatchim;
}

/** word + correct particle, e.g. josa('도원','으로/로') => '도원으로', josa('체스','은/는') => '체스는'. */
export function josa(word: string | number, pair: JosaPair): string {
  const w = String(word);
  return w + particle(w, pair);
}

export const NAMES = {
  app: '범타듀 밸리',
  region: '호현지방',
  hall: '범마을 회관',
  casino: '별빛 카지노',
  tavern: '허풍 주점',
  realty: '범마을 부동산',
  furniture: '나무결 가구점',
  wardrobe: '분장실',
  home: '내 방',
  village: '마을',
  chatVillage: '마을 수다',
  chatHall: '회관 수다',
  chatCasino: '카지노 수다',
  chatTavern: '주점 수다',
  currency: '범',
  players: '2–7명',
} as const;

/** 12345 => '12,345범' (no space). Non-finite => '0범'. */
export function formatBeom(n: number): string {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0;
  return `${v.toLocaleString('ko-KR')}${NAMES.currency}`;
}
