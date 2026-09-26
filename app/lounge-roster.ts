// The seven friends of 범타듀 밸리 (names and name-tag colors). Server engines
// (lounge-room, lounge-accounts, economy report) and the UI all import it.
export const ACTORS = [
  '도원',
  '강재',
  '민서',
  '승준',
  '민재',
  '재민',
  '호현',
] as const;
export const ACTOR_COLORS = [
  '#d98692',
  '#ccaa7b',
  '#86adb0',
  '#8aaacb',
  '#adad83',
  '#c99773',
  '#b4a0d0',
];
export type ActorName = (typeof ACTORS)[number];
