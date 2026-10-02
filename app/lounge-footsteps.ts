// Footstep surfaces (no audio files: the audio engine shapes its noise
// buffer per surface, lounge-audio.ts footstep). `areaSurface` says what is
// underfoot at a point of an outdoor map from the maps' own paving data, so a
// new district only needs its paving rectangles. Pure data and helpers.
import { HARBOR_BREAKWATER, HARBOR_PAVING, HARBOR_PIER, HARBOR_POINT, HARBOR_SHORE_Z } from './lounge-harbor-layout.ts';
import { HILLSIDE_PAVING } from './lounge-hillside-layout.ts';
import { MARKET_PAVING } from './lounge-market-layout.ts';
import { RANCH_BRIDGE, RANCH_PAVING, RANCH_STONES } from './lounge-ranch-layout.ts';
import { FOOTHILL_PAVING } from './lounge-foothill-layout.ts';
import type { WalkPoint } from './lounge-walk-world.ts';

export type Surface = 'dirt' | 'grass' | 'stone' | 'wood' | 'planks' | 'sand' | 'gravel';
export const SURFACES: readonly Surface[] = ['dirt', 'grass', 'stone', 'wood', 'planks', 'sand', 'gravel'];

/** One filtered noise burst of a step. */
export type StepLayer = { filter: BiquadFilterType; freq: number; q?: number; gain: number; attack?: number; decay: number };
/** A surface's step: noise layers, plus a hollow knock for boards. */
export type StepSound = { layers: readonly StepLayer[]; knock?: { freq: number; gain: number; decay: number }; spread: number };

/**
 * Gains are before the sfx channel (the hub's original step peaks at 0.1);
 * `spread` is the random pitch range of the main layer (Hz).
 */
export const STEP_SOUNDS: Record<Surface, StepSound> = {
  // The hub's packed earth (the original step).
  dirt: { layers: [{ filter: 'lowpass', freq: 750, gain: 0.1, decay: 0.07 }], spread: 200 },
  // A soft brush of grass over a dull thud.
  grass: {
    layers: [
      { filter: 'highpass', freq: 2400, gain: 0.035, attack: 0.012, decay: 0.09 },
      { filter: 'lowpass', freq: 420, gain: 0.07, decay: 0.05 },
    ],
    spread: 400,
  },
  // Paving: a short, crisp heel tap.
  stone: {
    layers: [
      { filter: 'bandpass', freq: 1900, q: 1.1, gain: 0.09, decay: 0.035 },
      { filter: 'lowpass', freq: 520, gain: 0.06, decay: 0.05 },
    ],
    spread: 300,
  },
  // Shop and room floors: a knock on boards.
  wood: {
    layers: [{ filter: 'bandpass', freq: 1100, q: 0.9, gain: 0.05, decay: 0.04 }],
    knock: { freq: 165, gain: 0.07, decay: 0.07 },
    spread: 150,
  },
  // The pier: hollow planks over water.
  planks: {
    layers: [{ filter: 'bandpass', freq: 800, q: 0.8, gain: 0.05, decay: 0.05 }],
    knock: { freq: 112, gain: 0.085, decay: 0.12 },
    spread: 120,
  },
  // Sand: a slow, soft crunch.
  sand: {
    layers: [
      { filter: 'lowpass', freq: 520, gain: 0.08, attack: 0.02, decay: 0.12 },
      { filter: 'highpass', freq: 3200, gain: 0.018, attack: 0.02, decay: 0.1 },
    ],
    spread: 120,
  },
  // The mine's grit.
  gravel: {
    layers: [
      { filter: 'bandpass', freq: 1300, q: 0.7, gain: 0.08, decay: 0.07 },
      { filter: 'highpass', freq: 3600, gain: 0.03, decay: 0.05 },
    ],
    spread: 500,
  },
};

/** Seconds between steps (walking / running). */
export const STEP_GAP = { walk: 0.3, run: 0.2 } as const;
/** The rooms (shop and hub interiors, bedrooms) all have board floors. */
export const INTERIOR_SURFACE: Surface = 'wood';

type Rect = { x: number; z: number; w: number; d: number };
const inRect = (p: WalkPoint, r: Rect, pad = 0) => Math.abs(p.x - r.x) <= r.w / 2 + pad && Math.abs(p.z - r.z) <= r.d / 2 + pad;

/** What is underfoot at `p` in an outdoor map (region coordinates). */
export function areaSurface(area: string, p: WalkPoint): Surface {
  switch (area) {
    case 'market':
      return MARKET_PAVING.some((r) => inRect(p, r, 0.1)) ? 'stone' : 'grass';
    case 'hillside':
      return HILLSIDE_PAVING.some((r) => inRect(p, r, 0.1)) ? 'stone' : 'grass';
    case 'harbor':
      if (inRect(p, HARBOR_PIER, 0.1) && p.z > HARBOR_SHORE_Z - 0.2) return 'planks';
      if (inRect(p, HARBOR_BREAKWATER, 0.1) || Math.hypot(p.x - HARBOR_POINT.x, p.z - HARBOR_POINT.z) <= HARBOR_POINT.r) return 'stone';
      return HARBOR_PAVING.some((r) => inRect(p, r, 0.1)) ? 'stone' : 'sand';
    case 'ranch':
      // The timber bridge and the stepping stones over the stream; dirt roads and yards; grass.
      if (inRect(p, RANCH_BRIDGE, 0.1)) return 'planks';
      if (inRect(p, RANCH_STONES, 0.1)) return 'stone';
      return RANCH_PAVING.some((r) => r.tone !== 'wood' && inRect(p, r, 0.1)) ? 'dirt' : 'grass';
    case 'foothill': {
      // The 산길 and the paths are gravel, the plaza and the forge yard stone.
      const r = FOOTHILL_PAVING.find((q) => inRect(p, q, 0.1));
      return r ? (r.tone === 'gravel' ? 'gravel' : 'stone') : 'grass';
    }
    case 'mine':
      return 'gravel';
    case 'hill':
    case 'woods':
      return 'grass';
    default:
      return 'dirt';
  }
}
