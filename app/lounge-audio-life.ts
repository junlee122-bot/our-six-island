// Life-expansion sound cues (fishing, foraging, cooking, museum, bundles) on
// the shared lounge audio engine's sfx bus (loungeAudio.cue / table): no second
// AudioContext, silent when sound is off or before the first gesture.
import { loungeAudio } from './lounge-audio';
import { getSettings } from './lounge-settings';

type LifeSfx =
  | 'cast' | 'bite' | 'reel' | 'miss' | 'pickup' | 'catch' | 'cook' | 'donate' | 'fanfare' | 'eat'
  // VILL-2: harvest pop, gold-star sparkle, reel clicks, a big-catch splash.
  | 'pop' | 'sparkle' | 'tick' | 'splash'
  // 성장 P1: a level-up flourish, chopping, breaking rock, the blacksmith's anvil.
  | 'levelup' | 'chop' | 'smash' | 'anvil';

const NOTES: Record<LifeSfx, { notes: number[]; step: number; type: OscillatorType; peak?: number }> = {
  // A soft whoosh-plop: falling triangle notes.
  cast: { notes: [660, 440, 262], step: 0.07, type: 'triangle', peak: 0.05 },
  // The bite: two quick high blips (plus a splash snap).
  bite: { notes: [1318.5, 1567.98, 1318.5], step: 0.06, type: 'square', peak: 0.05 },
  reel: { notes: [523.25, 659.25, 783.99, 1046.5], step: 0.07, type: 'sine', peak: 0.08 },
  miss: { notes: [392, 329.63], step: 0.12, type: 'triangle', peak: 0.06 },
  pickup: { notes: [880, 1174.66], step: 0.06, type: 'sine', peak: 0.06 },
  catch: { notes: [987.77, 1318.5, 1760], step: 0.05, type: 'sine', peak: 0.06 },
  cook: { notes: [587.33, 739.99, 880, 1174.66], step: 0.08, type: 'sine', peak: 0.07 },
  donate: { notes: [659.25, 830.61, 987.77, 1318.5], step: 0.09, type: 'sine', peak: 0.07 },
  fanfare: { notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5], step: 0.1, type: 'triangle', peak: 0.08 },
  eat: { notes: [440, 554.37, 659.25], step: 0.09, type: 'sine', peak: 0.06 },
  pop: { notes: [392, 784], step: 0.045, type: 'triangle', peak: 0.07 },
  sparkle: { notes: [1567.98, 2093, 2637.02, 3135.96], step: 0.05, type: 'sine', peak: 0.045 },
  tick: { notes: [1318.5], step: 0.02, type: 'square', peak: 0.018 },
  splash: { notes: [293.66, 220, 174.61], step: 0.06, type: 'triangle', peak: 0.06 },
  levelup: { notes: [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093], step: 0.075, type: 'triangle', peak: 0.085 },
  chop: { notes: [233.08, 196], step: 0.05, type: 'triangle', peak: 0.07 },
  smash: { notes: [174.61, 138.59, 110], step: 0.04, type: 'square', peak: 0.04 },
  anvil: { notes: [1760, 2349.32, 1760, 2349.32], step: 0.11, type: 'square', peak: 0.03 },
};

/** Plays one life cue (quietly does nothing when sound is off). */
export function lifeSfx(kind: LifeSfx) {
  if (!getSettings().sound) return;
  const n = NOTES[kind];
  loungeAudio.cue(n.notes, n.step, n.type, n.peak);
  // A short paper-snap stands in for the splash of a cast or a bite.
  if (kind === 'cast' || kind === 'bite' || kind === 'splash') loungeAudio.table('flip', kind === 'bite' ? 2 : 1, 0.05);
  if (kind === 'chop' || kind === 'smash') loungeAudio.table('flip', kind === 'smash' ? 2 : 1, 0.06);
}
