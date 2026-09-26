// kArchive club furniture in the 3D hall and casino (자료: kArchive · 출처:
// 쓰레드 dogfooter): measured model sizes and where the casino's VIP corner
// stands. Pure data shared by lounge-interior-scene.ts and the tests.

/**
 * Measured kArchive club models (model units, origin at the bottom centre,
 * +z the front): the banquet chair's cushion top, the card table's top, the
 * bar stool's seat, and the queue post's centre (its loose rope end hangs
 * toward -x). public/models/lounge/club/assets.json records the full bounds;
 * tests/lounge-karchive-civic.test.mjs re-measures them from the GLBs.
 */
export const CLUB_MODELS = {
  banquetChair: { seat: 0.56, w: 0.585, d: 0.656, h: 1 },
  cardTable: { top: 0.523, w: 0.802, d: 0.8 },
  barStool: { seat: 0.8 },
  queueRope: { post: 0.07 },
} as const;
export type ClubModel = keyof typeof CLUB_MODELS;

/**
 * The casino's VIP corner (world units): back right, behind the walkable
 * floor (the floor's back edge, network y 42, is world z -4.6), so its rope
 * line and table never stand where anyone walks. Bar stools stand behind
 * that edge too.
 */
export const VIP_CORNER = { x0: 3.5, x1: 7.3, z0: -5.95, z1: -4.75 } as const;
export const BAR_STOOL_Z = -5.0;
