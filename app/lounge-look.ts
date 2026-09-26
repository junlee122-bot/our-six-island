import {
  HAIR_COLORS,
  TOP_COLORS,
  HATS as ORIGINAL_HATS,
  GLASSES,
  type Appearance,
} from './character-style.ts';
import {
  BedroomError,
  defaultBedroom,
  readBedroom,
  readBedroomStrict,
  type Bedroom,
} from './lounge-bedroom-data.ts';
import { readColorHex } from './lounge-color.ts';
export { HAIR_COLORS, TOP_COLORS, GLASSES };
/**
 * Headwear is only 도원's 응원 머리띠 now. The cap, straw hat, bucket hat,
 * beanie and 재민's own cap were removed: readLook reads those old values
 * (saves, remote players, old clients) as 'none'. The field is kept (not
 * dropped) so an old client or server never falls back to a default hat.
 */
export const HATS = [
  ...ORIGINAL_HATS,
  { id: 'hachimaki', name: '응원 머리띠', cell: 9 },
] as const;
export type Look = Appearance & {
  collection:
    | 'original'
    | 'classic'
    | 'street'
    | 'smart'
    | 'wide-pants'
    | 'denim'
    | 'miku'
    | 'shampoo'
    | 'akatsuki'
    | 'gold-braid'
    | 'cape-coat'
    | 'maid';
  hairstyle: 'signature' | 'buns';
  hairColor?: string;
  skinColor?: string;
};
export const COLLECTIONS = [
  { id: 'original', name: '처음 만난 우리', note: '기존 캐릭터의 일상복' },
  { id: 'classic', name: '우리다운 하루', note: '친구마다 다른 시그니처 룩' },
  { id: 'street', name: '느긋한 주말', note: '후드와 여유로운 실루엣' },
  { id: 'smart', name: '오늘의 약속', note: '셔츠 · 가디건 · 재킷' },
  {
    id: 'wide-pants',
    name: '와이드 팬츠',
    note: '검정 긴바지 · 편안한 티셔츠',
  },
  { id: 'denim', name: '데님 산책', note: '청바지 · 캐주얼 재킷' },
  { id: 'miku', name: '하츠네 미쿠', note: '민트 넥타이 · 플리츠 스커트' },
  { id: 'shampoo', name: '샴푸의 중국풍', note: '차이나 칼라 · 매듭 장식' },
  { id: 'akatsuki', name: '아카츠키', note: '검은 망토 · 붉은 구름' },
  { id: 'gold-braid', name: '금빛 브레이드', note: '검정 폴로 · 금빛 장식 끈' },
  { id: 'cape-coat', name: '케이프 코트', note: '더블 코트 · 티어드 스커트' },
  { id: 'maid', name: '메이드', note: '흰 러플 앞치마 · 긴 소매' },
] as const;
export const COSTUME_COLLECTIONS: readonly Look['collection'][] = [
  'miku',
  'shampoo',
  'akatsuki',
  'maid',
];
export const DAOWON_COLLECTIONS: readonly Look['collection'][] = [
  'wide-pants',
  'denim',
  'miku',
  'shampoo',
];
/** 금빛 브레이드 · 케이프 코트: drawn only for 도원 (0) and 민서 (2). */
export const FEMALE_ACTORS: readonly number[] = [0, 2];
export const WOMEN_COLLECTIONS: readonly Look['collection'][] = [
  'gold-braid',
  'cape-coat',
];
/**
 * '처음 만난 우리' is kept only where its art holds up: the six legacy chibi
 * figures (actors 0–5, one shared motion sheet) have oversized heads and a
 * different drawing style from every other collection, and their walk is a
 * stiff cut-out. Their saved or remote looks read as '우리다운 하루' instead.
 * 호현 (6) has his own full-proportion drawing and keeps it.
 */
export const ORIGINAL_ACTORS: readonly number[] = [6];
export const collectionsFor = (actor: number) =>
  COLLECTIONS.filter(
    (c) =>
      (actor === 0 || !DAOWON_COLLECTIONS.includes(c.id)) &&
      (FEMALE_ACTORS.includes(actor) || !WOMEN_COLLECTIONS.includes(c.id)) &&
      (c.id !== 'original' || ORIGINAL_ACTORS.includes(actor)),
  );
export const hatsFor = (actor: number) =>
  HATS.filter((h) => actor === 0 || h.id !== 'hachimaki');
export const defaultLook = (actor: number): Look => ({
  collection: 'classic',
  hairstyle: 'signature',
  hair: actor === 0 ? 'wine' : 'ink',
  top:
    actor === 2 || actor === 3 ? 'cream' : actor === 6 ? 'ocean' : 'charcoal',
  hat: 'none',
  glasses:
    actor === 1 || actor === 4 ? 'round' : actor === 2 ? 'silver' : 'none',
  clip: false,
});
export function readLook(value: unknown, actor: number): Look {
  const d = defaultLook(actor),
    v = (value && typeof value === 'object' ? value : {}) as Partial<Look>,
    hairColor = readColorHex(v.hairColor),
    skinColor = readColorHex(v.skinColor);
  return {
    collection: collectionsFor(actor).some((c) => c.id === v.collection)
      ? v.collection!
      : d.collection,
    hairstyle: actor === 0 && v.hairstyle === 'buns' ? 'buns' : 'signature',
    hair: HAIR_COLORS.some((c) => c.id === v.hair) ? v.hair! : d.hair,
    top: TOP_COLORS.some((c) => c.id === v.top) ? v.top! : d.top,
    hat: hatsFor(actor).some((c) => c.id === v.hat) ? v.hat! : 'none',
    glasses: GLASSES.some((c) => c.id === v.glasses) ? v.glasses! : d.glasses,
    clip: v.clip === true,
    ...(hairColor ? { hairColor } : {}),
    ...(skinColor ? { skinColor } : {}),
  };
}
export const LOUNGE_SAVE_KEY = 'hohyeon-lounge-v1';
export type LoungeSave = {
  version: 1;
  actor: number;
  looks: Look[];
  saved: { id: string; actor: number; look: Look; name: string }[];
  visits: number;
  bedroom: Bedroom;
};
export function freshLounge(actor = 6): LoungeSave {
  const identity =
    Number.isInteger(actor) && actor >= 0 && actor < 7 ? actor : 6;
  return {
    version: 1,
    actor: identity,
    looks: Array.from({ length: 7 }, (_, i) => defaultLook(i)),
    saved: [],
    visits: 0,
    bedroom: defaultBedroom(identity),
  };
}
/** Current `LoungeSave.version`. Bump it together with a LOUNGE_MIGRATIONS entry. */
export const LOUNGE_SAVE_VERSION = 1;
/**
 * Upgrade steps keyed by the version they upgrade FROM. Each step receives a
 * plain object at version `n` and must return an object at version `n + 1`.
 * Example for a future v2: `1: (s) => ({ ...s, version: 2, pets: [] })`.
 * Steps must be pure and total; the server rejects a save no step can reach.
 */
export const LOUNGE_MIGRATIONS: Readonly<
  Record<number, (save: Record<string, unknown>) => Record<string, unknown>>
> = {};
/** Thrown by the strict reader. `reason` tells callers what to report. */
export class LoungeSaveError extends Error {
  /** 'room': a v3 room is present but malformed (see readBedroomStrict). */
  reason: 'parse' | 'version' | 'newer' | 'room';
  constructor(reason: 'parse' | 'version' | 'newer' | 'room', message: string) {
    super(message);
    this.name = 'LoungeSaveError';
    this.reason = reason;
  }
}
/**
 * Brings a parsed save up to LOUNGE_SAVE_VERSION. Throws LoungeSaveError for a
 * non-object, a missing/unknown version, a version newer than this build, or a
 * migration chain with a gap.
 */
export function migrateLoungeSave(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new LoungeSaveError('parse', 'Save is not an object');
  let s = value as Record<string, unknown>;
  const version = s.version;
  if (!Number.isSafeInteger(version) || (version as number) < 1)
    throw new LoungeSaveError('version', 'Unknown save version');
  if ((version as number) > LOUNGE_SAVE_VERSION)
    throw new LoungeSaveError('newer', 'Save is newer than this build');
  for (let v = version as number; v < LOUNGE_SAVE_VERSION; v++) {
    const step = LOUNGE_MIGRATIONS[v];
    if (!step) throw new LoungeSaveError('version', 'No migration from v' + v);
    s = step(s);
    if (!s || typeof s !== 'object' || s.version !== v + 1)
      throw new LoungeSaveError('version', 'Migration from v' + v + ' failed');
  }
  return s;
}
/** An untrusted saved-look entry; every field is checked before use. */
type RawSaved = { id?: unknown; name?: unknown; actor?: unknown; look?: unknown };
type CheckedSaved = { id: string; name: string; actor: number; look?: unknown };
const isSavedEntry = (x: RawSaved | null | undefined): x is CheckedSaved =>
  !!x &&
  typeof x.id === 'string' &&
  typeof x.name === 'string' &&
  Number.isInteger(x.actor) &&
  (x.actor as number) >= 0 &&
  (x.actor as number) < 7;
function normalizeLounge(
  s: Record<string, unknown>,
  trustedActor: number | undefined,
  strict = false,
): LoungeSave {
  const rawActor = s.actor,
    looks = Array.isArray(s.looks) ? (s.looks as unknown[]) : [];
  const actor =
    trustedActor ??
    (Number.isInteger(rawActor) && (rawActor as number) >= 0 && (rawActor as number) < 7
      ? (rawActor as number)
      : 6);
  return {
    version: 1,
    actor,
    looks: Array.from({ length: 7 }, (_, i) => readLook(looks[i], i)),
    saved: Array.isArray(s.saved)
      ? (s.saved as (RawSaved | null)[])
          .filter(isSavedEntry)
          .slice(0, 28)
          .map((x) => ({
            id: x.id.slice(0, 80),
            actor: x.actor,
            name: x.name.slice(0, 50),
            look: readLook(x.look, x.actor),
          }))
      : [],
    visits: Math.max(0, Math.min(1e5, Number(s.visits) || 0)),
    bedroom: strict
      ? readBedroomStrict(s.bedroom, actor)
      : readBedroom(s.bedroom, actor),
  };
}
const trusted = (accountActor?: number) =>
  Number.isInteger(accountActor) && accountActor! >= 0 && accountActor! < 7
    ? accountActor
    : undefined;
/**
 * Fail-closed reader for the SERVER save path. Parse failures, unknown or newer
 * versions throw LoungeSaveError instead of silently becoming a fresh save.
 */
export function readLoungeStrict(
  raw: string | null,
  accountActor?: number,
): LoungeSave {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? 'null');
  } catch {
    throw new LoungeSaveError('parse', 'Save is not valid JSON');
  }
  const s = migrateLoungeSave(parsed);
  try {
    return normalizeLounge(s, trusted(accountActor), true);
  } catch (e) {
    if (e instanceof BedroomError)
      throw new LoungeSaveError('room', 'Room is malformed: ' + e.message);
    throw new LoungeSaveError('parse', 'Save could not be normalized');
  }
}
/**
 * Lenient reader for local/legacy browser data: anything unreadable becomes a
 * fresh save. Never use it to decide what the server stores.
 */
export function readLounge(
  raw: string | null,
  accountActor?: number,
): LoungeSave {
  try {
    return readLoungeStrict(raw, accountActor);
  } catch (e) {
    // A malformed room alone must not wipe looks and saved outfits.
    if (e instanceof LoungeSaveError && e.reason === 'room')
      try {
        return normalizeLounge(migrateLoungeSave(JSON.parse(raw ?? 'null')), trusted(accountActor));
      } catch {
        /* fall through to a fresh save */
      }
    return freshLounge(trusted(accountActor));
  }
}
