import { LOUNGE_ASSETS } from './lounge-assets';
import motionLayouts from './lounge-motion-layout.json';

/**
 * Hand-drawn locomotion sheets. A look with an entry here uses its real walk
 * and run frames; every other look falls back to the cut-out rig
 * (app/lounge-rig.ts). To add a generated sheet, drop the image under
 * public/assets/lounge/motion/ and append an entry to EXTRA_MOTION_SHEETS —
 * see GENERATION-PROMPTS.md / ASSETS.md for the exact layout.
 */
export type FrameRect = { x: number; y: number; w: number; h: number };
export type MotionSheet = {
  id: string;
  actor: number;
  collection: string;
  hairstyle: 'signature' | 'buns';
  url: string;
  walk: FrameRect[];
  run: FrameRect[];
  /** 'magenta' keys out a flat #ff00ff backdrop; 'alpha' keeps the PNG/WebP alpha. */
  keying: 'alpha' | 'magenta';
  /** Dye every blue pixel as hair (outfits with no blue garment channel). */
  blueHairOnly?: boolean;
};

/** Standard sheet: row 0 = walk, row 1 = run, `columns` cells of 320×400. */
export function motionGrid(columns = 6, cellWidth = 320, cellHeight = 400) {
  const row = (y: number) =>
    Array.from({ length: columns }, (_, i) => ({
      x: i * cellWidth,
      y: y * cellHeight,
      w: cellWidth,
      h: cellHeight,
    }));
  return { walk: row(0), run: row(1) };
}

const ACTOR_FILES = [
  'Dowon',
  'Gangjae',
  'Minseo',
  'Seungjun',
  'Minjae',
  'Jaemin',
  'Hohyeon',
] as const;

const CLASSIC: MotionSheet[] = ACTOR_FILES.map((name, actor) => ({
  id: `classic-signature-${actor}`,
  actor,
  collection: 'classic',
  hairstyle: 'signature',
  url: LOUNGE_ASSETS[`locomotion${name}`],
  walk: motionLayouts[actor].rows.walk,
  run: motionLayouts[actor].rows.run,
  keying: 'alpha',
  // Minseo's white/black outfit has no blue garment channel; detached
  // wind-blown hair strands below the arm must keep the chosen hair dye.
  blueHairOnly: actor === 2,
}));

/**
 * Drop-in sheets, e.g.
 *   { id: 'street-signature-1', actor: 1, collection: 'street',
 *     hairstyle: 'signature', url: '/assets/lounge/motion/street/gangjae.webp',
 *     ...motionGrid(), keying: 'magenta' }
 */
export const EXTRA_MOTION_SHEETS: MotionSheet[] = [];

export function motionSheetFor(
  actor: number,
  look: { collection: string; hairstyle: string },
) {
  // Drop-in sheets win over the built-in ones for the same look.
  return [...EXTRA_MOTION_SHEETS, ...CLASSIC].find(
    (sheet) =>
      sheet.actor === actor &&
      sheet.collection === look.collection &&
      sheet.hairstyle === look.hairstyle,
  );
}
