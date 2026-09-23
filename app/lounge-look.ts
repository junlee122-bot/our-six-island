import {
  HAIR_COLORS,
  TOP_COLORS,
  HATS as ORIGINAL_HATS,
  GLASSES,
  type Appearance,
} from './character-style.ts';
import {
  defaultBedroom,
  readBedroom,
  type Bedroom,
} from './lounge-bedroom-data.ts';
import { readColorHex } from './lounge-color.ts';
export { HAIR_COLORS, TOP_COLORS, GLASSES };
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
    | 'akatsuki';
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
] as const;
export const COSTUME_COLLECTIONS: readonly Look['collection'][] = [
  'miku',
  'shampoo',
  'akatsuki',
];
export const DAOWON_COLLECTIONS: readonly Look['collection'][] = [
  'wide-pants',
  'denim',
  'miku',
  'shampoo',
];
export const collectionsFor = (actor: number) =>
  COLLECTIONS.filter((c) => actor === 0 || !DAOWON_COLLECTIONS.includes(c.id));
export const hatsFor = (actor: number) =>
  HATS.filter((h) => actor === 0 || h.id !== 'hachimaki');
export const defaultLook = (actor: number): Look => ({
  collection: 'classic',
  hairstyle: 'signature',
  hair: actor === 0 ? 'wine' : 'ink',
  top:
    actor === 2 || actor === 3 ? 'cream' : actor === 6 ? 'ocean' : 'charcoal',
  hat: actor === 5 ? 'cap' : 'none',
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
    hat: hatsFor(actor).some((c) => c.id === v.hat) ? v.hat! : d.hat,
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
export function readLounge(
  raw: string | null,
  accountActor?: number,
): LoungeSave {
  const trustedActor =
    Number.isInteger(accountActor) && accountActor! >= 0 && accountActor! < 7
      ? accountActor
      : undefined;
  try {
    const s = JSON.parse(raw ?? 'null');
    if (!s || s.version !== 1) return freshLounge(trustedActor);
    const actor =
      trustedActor ??
      (Number.isInteger(s.actor) && s.actor >= 0 && s.actor < 7 ? s.actor : 6);
    return {
      version: 1,
      actor,
      looks: Array.from({ length: 7 }, (_, i) => readLook(s.looks?.[i], i)),
      saved: Array.isArray(s.saved)
        ? s.saved
            .filter(
              (x: any) =>
                x &&
                typeof x.id === 'string' &&
                typeof x.name === 'string' &&
                Number.isInteger(x.actor) &&
                x.actor >= 0 &&
                x.actor < 7,
            )
            .slice(0, 28)
            .map((x: any) => ({
              id: x.id.slice(0, 80),
              actor: x.actor,
              name: x.name.slice(0, 50),
              look: readLook(x.look, x.actor),
            }))
        : [],
      visits: Math.max(0, Math.min(1e5, Number(s.visits) || 0)),
      bedroom: readBedroom(s.bedroom, actor),
    };
  } catch {
    return freshLounge(trustedActor);
  }
}
