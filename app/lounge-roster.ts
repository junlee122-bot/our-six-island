// The friends of 범타듀 밸리 (names and name-tag colors). Server engines
// (lounge-room, lounge-accounts, economy report) and the UI all import it.
export const ACTORS = [
  '도원',
  '강재',
  '민서',
  '승준',
  '민재',
  '재민',
  '호현',
  '유찬',
] as const;
/** Actor ids are stable save identities: add friends only at the end. */
export const ACTOR_COUNT = ACTORS.length;
export const isActor = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < ACTOR_COUNT;
/** Canonical actor keys in saved maps; reject aliases such as '07'. */
export const isActorKey = (value: unknown): value is string =>
  typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value) && isActor(Number(value));
export const ACTOR_IDS: readonly number[] = Array.from({ length: ACTOR_COUNT }, (_, actor) => actor);
/** Fixed sign-in names in the same stable order as ACTORS. */
export const ACCOUNT_IDS = [
  'dowon',
  'gangjae',
  'minseo',
  'seungjun',
  'minjae',
  'jaemin',
  'hohyeon',
  'yuchan',
] as const;
export const ACTOR_COLORS = [
  '#d98692',
  '#ccaa7b',
  '#86adb0',
  '#8aaacb',
  '#adad83',
  '#c99773',
  '#b4a0d0',
  '#9fb7c4',
];
export type ActorName = (typeof ACTORS)[number];
