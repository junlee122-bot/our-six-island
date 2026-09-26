// kArchive props of the hall's friends' tables (자료: kArchive · 출처: 쓰레드
// dogfooter): measured model sizes (model units, origin at the bottom centre;
// public/models/lounge/friends/assets.json has the full bounds) and the size
// each is drawn at in the 3D hall (world units ≈ metres). The holiday-set
// calendar and pencil are normalized to a 2 m longest side, so they are
// scaled down to desk size. Pure data shared by lounge-interior-scene.ts and
// the tests.
export const FRIEND_MODELS = {
  ovalTable: { w: 1.2, d: 0.754, top: 0.511, h: 0.511 },
  serviceBell: { h: 0.08, w: 0.1 },
  serviceBellPressed: { h: 0.067, w: 0.1 },
  lectern: { h: 0.997, w: 0.55 },
  ballotBox: { h: 1.1, w: 0.606 },
  deskCalendar: { h: 2, w: 1.782 },
  pencil: { h: 0.633, w: 2 },
} as const;
export type FriendModel = keyof typeof FRIEND_MODELS;

/** Drawn sizes (world units): the longest side / height each prop gets. */
export const FRIEND_PROP_SIZE = {
  /** Bell on the 라이어 table: a little larger than life so it reads. */
  bell: 0.16,
  /** Lectern and ballot box beside the 라이어 table (height). */
  lectern: 0.82,
  ballotBox: 0.78,
  /** Score-pad calendar and pencil on the 야추 table (longest side). */
  calendar: 0.2,
  pencil: 0.2,
} as const;
