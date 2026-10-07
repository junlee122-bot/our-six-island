// Recorded sound effects (Kenney CC0: Casino Audio, Interface Sounds; see
// public/assets/lounge/sfx/LICENSE-KENNEY.txt and ASSETS.md). The life and UI
// samples (life-*, ui-click: Kenney and OpenGameArt, all CC0) list their
// sources in public/assets/lounge/sfx/life-sources.json. Each id lists
// its files best first (Ogg Vorbis original, AAC copy for Safari); the audio
// engine plays the first one the browser decodes and falls back to its
// synthesized cue when none loads. scripts/build-standalone.mjs content-hashes
// these literal paths (and blanks missing ones). Pure data: no AudioContext.
export type SfxId =
  | 'dice-shake'
  | 'dice-throw'
  | 'dice-grab'
  | 'die-throw'
  | 'card-slide'
  | 'card-place'
  | 'tick'
  | 'bong'
  | 'question'
  | 'drop'
  | 'confirm'
  | 'error'
  | 'select'
  // I2-world D6: life and UI samples (the oscillator cues stay as fallback).
  | 'harvest'
  | 'water'
  | 'hoe'
  | 'splash'
  | 'coin'
  | 'door'
  | 'click';

/**
 * Files and level under the sfx channel. The files peak near full scale, so
 * the levels bring them to the synthesized table sounds' loudness.
 */
export const SFX_FILES: Record<SfxId, { files: readonly string[]; gain: number }> = {
  'dice-shake': { files: ['/assets/lounge/sfx/dice-shake.ogg', '/assets/lounge/sfx/dice-shake.m4a'], gain: 0.32 },
  'dice-throw': { files: ['/assets/lounge/sfx/dice-throw.ogg', '/assets/lounge/sfx/dice-throw.m4a'], gain: 0.36 },
  'dice-grab': { files: ['/assets/lounge/sfx/dice-grab.ogg', '/assets/lounge/sfx/dice-grab.m4a'], gain: 0.3 },
  'die-throw': { files: ['/assets/lounge/sfx/die-throw.ogg', '/assets/lounge/sfx/die-throw.m4a'], gain: 0.36 },
  'card-slide': { files: ['/assets/lounge/sfx/card-slide.ogg', '/assets/lounge/sfx/card-slide.m4a'], gain: 0.34 },
  'card-place': { files: ['/assets/lounge/sfx/card-place.ogg', '/assets/lounge/sfx/card-place.m4a'], gain: 0.34 },
  tick: { files: ['/assets/lounge/sfx/tick.ogg', '/assets/lounge/sfx/tick.m4a'], gain: 0.22 },
  bong: { files: ['/assets/lounge/sfx/bong.ogg', '/assets/lounge/sfx/bong.m4a'], gain: 0.2 },
  question: { files: ['/assets/lounge/sfx/question.ogg', '/assets/lounge/sfx/question.m4a'], gain: 0.16 },
  drop: { files: ['/assets/lounge/sfx/drop.ogg', '/assets/lounge/sfx/drop.m4a'], gain: 0.26 },
  confirm: { files: ['/assets/lounge/sfx/confirm.ogg', '/assets/lounge/sfx/confirm.m4a'], gain: 0.16 },
  error: { files: ['/assets/lounge/sfx/error.ogg', '/assets/lounge/sfx/error.m4a'], gain: 0.2 },
  select: { files: ['/assets/lounge/sfx/select.ogg', '/assets/lounge/sfx/select.m4a'], gain: 0.18 },
  harvest: { files: ['/assets/lounge/sfx/life-harvest.ogg', '/assets/lounge/sfx/life-harvest.m4a'], gain: 0.2 },
  water: { files: ['/assets/lounge/sfx/life-water.ogg', '/assets/lounge/sfx/life-water.m4a'], gain: 0.3 },
  hoe: { files: ['/assets/lounge/sfx/life-hoe.ogg', '/assets/lounge/sfx/life-hoe.m4a'], gain: 0.42 },
  splash: { files: ['/assets/lounge/sfx/life-splash.ogg', '/assets/lounge/sfx/life-splash.m4a'], gain: 0.3 },
  coin: { files: ['/assets/lounge/sfx/life-coin.ogg', '/assets/lounge/sfx/life-coin.m4a'], gain: 0.34 },
  door: { files: ['/assets/lounge/sfx/life-door.ogg', '/assets/lounge/sfx/life-door.m4a'], gain: 0.26 },
  click: { files: ['/assets/lounge/sfx/ui-click.ogg', '/assets/lounge/sfx/ui-click.m4a'], gain: 0.22 },
};
