// Original generative scores for the two game rooms (no audio files needed):
// - 별빛 카지노: a noir tango in D minor, 104 bpm, habanera bass (dotted-8th ·
//   16th · 8th), bandoneon-like reeds, brushes, violin / muted brass / string
//   ostinato colour, harmonic-minor lines (the B♭–C♯ augmented second) and
//   chromatic descents. Sections A · B · A' · C (dominant pedal) · turnaround.
// - 범마을 회관: the same film in 12/8 굿거리 (dotted quarter 66): 장구 덩·기덕·쿵·더러러,
//   가야금-like plucks on the D 계면조 pentatonic with 농현 bends, a 대금-like flute,
//   and the casino's pizzicato bass and reeds underneath.
// All melodies are generated from generic tango / 산조 idioms (seeded random
// walks over chord tones) — no existing theme is quoted.
// Pure data only: lounge-music-synth.ts turns events into sound.
import type { MusicPlace } from './lounge-music-tracks.ts';

export type Rng = () => number;
/** Small seeded PRNG (mulberry32): same seed, same music. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Inst =
  | 'bass'
  | 'reed'
  | 'lead'
  | 'piano'
  | 'strings'
  | 'violin'
  | 'brass'
  | 'kick'
  | 'brush'
  | 'snare'
  | 'rim'
  | 'swell'
  | 'heart'
  | 'pulse'
  | 'gayageum'
  | 'daegeum'
  | 'kung'
  | 'deok';
/** 농현 on a held note: vibrato, a scoop up into it, or a drop at its end. */
export type Bend = 'vib' | 'up' | 'down';
export type NoteEvent = {
  /** Position in the bar in steps (16ths / 12/8 eighths); may be fractional. */
  step: number;
  inst: Inst;
  midi: number;
  /** 0..1 */
  vel: number;
  /** Length in steps. */
  dur: number;
  bend?: Bend;
};

export type Chord = { root: number; tones: readonly number[]; bass?: number };
export type Section = 'A' | 'B' | 'A2' | 'C' | 'T';
export type PieceSpec = {
  id: MusicPlace;
  /** Beats per minute (quarter in the casino, dotted quarter in the hall). */
  bpm: number;
  stepsPerBeat: number;
  stepsPerBar: number;
  sections: Record<Section, readonly Chord[]>;
  /** Section orders; the first cycle plays forms[0], later cycles pick one. */
  forms: readonly (readonly Section[])[];
};
export type BarPlan = {
  section: Section;
  /** Bar within its section, and the section's length. */
  bar: number;
  of: number;
  chord: Chord;
  next: Chord;
  cycle: number;
};
/** Motifs kept for the cycle (A' answers A) and the voices' last pitches. */
export type ScoreState = {
  motifs: Map<string, NoteEvent[]>;
  /** The A section's opening rhythm cell (bar 5 echoes bar 1). */
  cell: Rhythm | null;
  lead: number;
  high: number;
};
export const newScoreState = (): ScoreState => ({
  motifs: new Map(),
  cell: null,
  lead: 69,
  high: 76,
});

const ch = (root: number, tones: readonly number[], bass?: number): Chord => ({
  root,
  tones,
  bass,
});
// Pitch classes: C0 C♯1 D2 E♭3 E4 F5 F♯6 G7 A♭8 A9 B♭10 B11.
const Dm = ch(2, [0, 3, 7]),
  DmMaj7 = ch(2, [0, 3, 7, 11], 1),
  Dm7C = ch(2, [0, 3, 7, 10], 0),
  Dm6B = ch(2, [0, 3, 7, 9], 11),
  Dm7 = ch(2, [0, 3, 7, 10]),
  DmF = ch(2, [0, 3, 7], 5),
  Gm6 = ch(7, [0, 3, 7, 9]),
  Gm7 = ch(7, [0, 3, 7, 10]),
  A7 = ch(9, [0, 4, 7, 10]),
  A7b9 = ch(9, [0, 4, 7, 10, 13]),
  A7sus = ch(9, [0, 5, 7, 10]),
  Am7 = ch(9, [0, 3, 7, 10]),
  BbMaj7 = ch(10, [0, 4, 7, 11]),
  Bb7 = ch(10, [0, 4, 7, 10]),
  BbA = ch(10, [0, 4, 7], 9),
  BbD = ch(10, [0, 4, 7], 2),
  Em7b5 = ch(4, [0, 3, 6, 10]),
  EbMaj7 = ch(3, [0, 4, 7, 11]),
  GmA = ch(7, [0, 3, 7], 9),
  GmD = ch(7, [0, 3, 7], 2),
  FA = ch(5, [0, 4, 7], 9),
  E7Gs = ch(4, [0, 4, 7, 10], 8),
  C = ch(0, [0, 4, 7]),
  CD = ch(0, [0, 4, 7], 2);

export const CASINO: PieceSpec = {
  id: 'casino',
  bpm: 104,
  stepsPerBeat: 4,
  stepsPerBar: 16,
  sections: {
    // The minor line cliché (D–C♯–C–B in the bass), then the cadence.
    A: [Dm, DmMaj7, Dm7C, Dm6B, Gm6, A7b9, Dm, A7],
    B: [BbMaj7, Gm7, Em7b5, A7b9, DmF, Gm6, EbMaj7, A7],
    A2: [Dm, DmMaj7, Dm7C, Dm6B, Gm6, A7b9, Dm, Dm],
    // Dominant pedal: B♭ over A, the half-step that won't resolve.
    C: [A7b9, BbA, A7b9, BbA, GmA, FA, E7Gs, A7],
    T: [Dm, Bb7, Em7b5, A7b9],
  },
  forms: [
    ['A', 'B', 'A2', 'C', 'T'],
    ['A', 'B', 'C', 'A2', 'T'],
    ['A', 'A2', 'B', 'C', 'T'],
  ],
};

export const HALL: PieceSpec = {
  id: 'hall',
  bpm: 66,
  stepsPerBeat: 3,
  stepsPerBar: 12,
  sections: {
    A: [Dm7, Dm7, C, Dm7, BbMaj7, Am7, Gm7, A7b9],
    B: [Gm7, Gm7, Dm7, Dm7, BbMaj7, C, A7sus, A7],
    A2: [Dm7, Dm7, C, Dm7, BbMaj7, Am7, A7, Dm7],
    C: [Dm7, Dm7, GmD, Dm7, BbD, CD, Dm7, A7],
    T: [Dm7, Bb7, A7, A7],
  },
  forms: [
    ['A', 'B', 'A2', 'C', 'T'],
    ['A', 'C', 'B', 'A2', 'T'],
    ['A', 'A2', 'B', 'C', 'T'],
  ],
};

export const PIECES: Record<MusicPlace, PieceSpec> = { casino: CASINO, hall: HALL };
/** Seconds per step. */
export const stepSeconds = (spec: PieceSpec) => 60 / spec.bpm / spec.stepsPerBeat;

/** The bars of one pass through a form (at least 32 bars). */
export function planCycle(spec: PieceSpec, cycle: number, rng: Rng): BarPlan[] {
  const form =
    cycle === 0 ? spec.forms[0] : spec.forms[Math.floor(rng() * spec.forms.length)];
  const bars: BarPlan[] = [];
  for (const section of form) {
    const chords = spec.sections[section];
    chords.forEach((chord, bar) =>
      bars.push({ section, bar, of: chords.length, chord, next: chord, cycle }),
    );
  }
  bars.forEach((b, i) => {
    b.next = i + 1 < bars.length ? bars[i + 1].chord : spec.sections.A[0];
  });
  return bars;
}

// ---- pitch helpers ------------------------------------------------------
export const pcsOf = (c: Chord) => c.tones.map((t) => (c.root + t) % 12);
const mod12 = (n: number) => ((n % 12) + 12) % 12;
/** The pitch nearest `target` whose class is in `pcs`, kept within lo..hi. */
export function nearest(target: number, pcs: readonly number[], lo: number, hi: number) {
  const t = Math.max(lo, Math.min(hi, Math.round(target)));
  for (let d = 0; d < 24; d++) {
    if (t - d >= lo && pcs.includes(mod12(t - d))) return t - d;
    if (t + d <= hi && pcs.includes(mod12(t + d))) return t + d;
  }
  return t;
}
/** One scale step up or down from `from`, turning back at the range edges. */
function stepScale(from: number, dir: number, pcs: readonly number[], lo: number, hi: number) {
  let m = from + dir;
  while (!pcs.includes(mod12(m)) && Math.abs(m - from) < 4) m += dir;
  if (m < lo || m > hi) return stepScale(from, -dir, pcs, lo, hi);
  return m;
}
/** Close voicing around the middle of the reed range (up to 4 notes). */
export function voicing(c: Chord, center = 64, lo = 57, hi = 72): number[] {
  const notes = [...new Set(pcsOf(c).map((pc) => nearest(center, [pc], lo, hi)))];
  return notes.sort((a, b) => a - b).slice(0, 4);
}
export const bassOf = (c: Chord) => nearest(40, [c.bass ?? c.root], 33, 47);
const fifthOf = (c: Chord) => nearest(bassOf(c) + 7, [(c.root + 7) % 12], 33, 52);
/** A chromatic neighbour leading into the next bar's bass. */
const approach = (next: Chord, rng: Rng) => bassOf(next) + (rng() < 0.5 ? 1 : -1);
/** D natural minor, or harmonic minor (C♯, the augmented second) when the chord has C♯. */
export function casinoScale(c: Chord): number[] {
  return pcsOf(c).includes(1) ? [2, 4, 5, 7, 9, 10, 1] : [2, 4, 5, 7, 9, 10, 0];
}
/** D 계면조 pentatonic (D F G A C); C♯ replaces C over the dominant. */
export function hallScale(c: Chord): number[] {
  return pcsOf(c).includes(1) ? [2, 5, 7, 9, 1] : [2, 5, 7, 9, 0];
}

type Rhythm = readonly (readonly [number, number])[];
/** Tango rhythm cells for the lead (step, length in 16ths). */
export const CASINO_RHYTHMS: readonly Rhythm[] = [
  [[0, 3], [3, 1], [4, 2], [6, 2], [8, 8]],
  [[0, 6], [6, 2], [8, 3], [11, 1], [12, 4]],
  [[2, 2], [4, 2], [6, 1], [7, 1], [8, 6], [14, 2]],
  [[0, 12], [12, 2], [14, 2]],
  [[0, 3], [3, 1], [4, 4], [8, 3], [11, 1], [12, 4]],
  [[0, 2], [2, 2], [4, 2], [6, 2], [8, 1], [9, 1], [10, 1], [11, 1], [12, 4]],
];
/** 12/8 cells for the 가야금 (step, length in eighths). */
export const HALL_RHYTHMS: readonly Rhythm[] = [
  [[0, 3], [3, 2], [5, 1], [6, 6]],
  [[0, 1], [1, 1], [2, 1], [3, 3], [6, 3], [9, 3]],
  [[0, 6], [6, 3], [9, 2], [11, 1]],
  [[0, 2], [2, 1], [3, 3], [6, 2], [8, 1], [9, 3]],
  [[0, 9], [9, 1], [10, 1], [11, 1]],
];

/** A melodic bar: chord tones on strong steps, scale steps between. */
function melody(
  inst: Inst,
  chord: Chord,
  rhythm: Rhythm,
  scale: readonly number[],
  from: number,
  lo: number,
  hi: number,
  rng: Rng,
  opts: { cadence?: boolean; chromatic?: boolean; strong: number },
): NoteEvent[] {
  const out: NoteEvent[] = [];
  const tones = pcsOf(chord);
  let cur = from,
    dir = rng() < 0.5 ? -1 : 1;
  rhythm.forEach(([step, dur], i) => {
    let m: number;
    if (opts.cadence && i === rhythm.length - 1) m = nearest(cur, [chord.root], lo, hi);
    else if (opts.chromatic && i > 0 && step >= opts.strong && rhythm[i - 1][1] === 1)
      m = Math.max(lo, cur - 1); // chromatic descent
    else if (step % opts.strong === 0 || dur >= 4) m = nearest(cur + dir * 2, tones, lo, hi);
    else m = stepScale(cur, dir, scale, lo, hi);
    if (m >= hi - 1) dir = -1;
    else if (m <= lo + 1) dir = 1;
    else if (rng() < 0.25) dir = -dir;
    const accent = step % opts.strong === 0 ? 0.78 : 0.62;
    out.push({ step, inst, midi: m, vel: accent + rng() * 0.1, dur });
    cur = m;
  });
  return out;
}

const hit = (step: number, inst: Inst, vel: number, dur = 1, midi = 0): NoteEvent => ({
  step,
  inst,
  midi,
  vel,
  dur,
});
const chordAt = (step: number, inst: Inst, notes: number[], vel: number, dur: number) =>
  notes.map((midi) => ({ step, inst, midi, vel, dur }));
const last = (list: NoteEvent[]) => list[list.length - 1];

/** One bar of the casino tango. */
export function casinoBar(plan: BarPlan, state: ScoreState, rng: Rng): NoteEvent[] {
  const { section: s, bar, chord, next } = plan;
  const end = bar === plan.of - 1;
  const ev: NoteEvent[] = [];
  const b = bassOf(chord),
    f = fifthOf(chord),
    reeds = voicing(chord);
  // Pizzicato bass.
  if (s === 'A' || s === 'A2') {
    // Habanera: dotted eighth, sixteenth, eighth (twice).
    ev.push(
      { step: 0, inst: 'bass', midi: b, vel: 0.9, dur: 3 },
      { step: 3, inst: 'bass', midi: b, vel: 0.45, dur: 1 },
      { step: 4, inst: 'bass', midi: f, vel: 0.7, dur: 2 },
      { step: 8, inst: 'bass', midi: b, vel: 0.8, dur: 3 },
      { step: 11, inst: 'bass', midi: b, vel: 0.4, dur: 1 },
      { step: 12, inst: 'bass', midi: f, vel: 0.65, dur: 2 },
      { step: 14, inst: 'bass', midi: approach(next, rng), vel: 0.6, dur: 2 },
    );
  } else if (s === 'B') {
    // Walking quarters with a chromatic approach.
    const third = nearest(b + 4, pcsOf(chord), 33, 52);
    ev.push(
      { step: 0, inst: 'bass', midi: b, vel: 0.85, dur: 4 },
      { step: 4, inst: 'bass', midi: third, vel: 0.65, dur: 4 },
      { step: 8, inst: 'bass', midi: f, vel: 0.7, dur: 4 },
      { step: 12, inst: 'bass', midi: approach(next, rng), vel: 0.65, dur: 4 },
    );
    if (rng() < 0.4) ev.push({ step: 11, inst: 'bass', midi: f, vel: 0.35, dur: 1 });
  } else {
    // 3-3-2 (the tango marcato), on the pedal in C.
    const pedal = s === 'C' ? 33 : b;
    ev.push(
      { step: 0, inst: 'bass', midi: pedal, vel: 0.9, dur: 3 },
      { step: 6, inst: 'bass', midi: s === 'C' ? pedal : f, vel: 0.7, dur: 3 },
      { step: 12, inst: 'bass', midi: s === 'C' ? pedal + 12 : approach(next, rng), vel: 0.7, dur: 2 },
    );
    if (s === 'C' && rng() < 0.5) ev.push({ step: 15, inst: 'bass', midi: 34, vel: 0.4, dur: 1 });
  }
  // Bandoneon reeds.
  if (s === 'A' || s === 'A2' || s === 'T') {
    ev.push(...chordAt(0, 'reed', reeds, 0.4, 7.5), ...chordAt(8, 'reed', reeds, 0.33, 7.5));
  } else if (s === 'B') {
    if (end) ev.push(...chordAt(0, 'reed', reeds, 0.45, 15));
    else for (const at of [0, 6, 12]) ev.push(...chordAt(at, 'reed', reeds, 0.55, 2));
  } else if (bar % 2 === 0) {
    ev.push(...chordAt(0, 'reed', reeds, 0.3, 31));
  }
  // Lead: the A melody, answered in A'.
  if (s === 'A' || (s === 'A2' && bar < 6)) {
    const key = 'A' + bar;
    let line = state.motifs.get(key);
    if (!line) {
      const scale = casinoScale(chord);
      if (chord.root === 9 && rng() < 0.6) {
        // The harmonic-minor turn: A B♭ C♯ D (augmented second), falling back.
        line = [
          [0, 3, 69],
          [3, 1, 70],
          [4, 2, 73],
          [6, 2, 74],
          [8, 4, 76],
          [12, 4, 73],
        ].map(([step, dur, midi]) => ({ step, inst: 'lead', midi, vel: 0.7, dur }));
      } else {
        const cell =
          bar === 0 || bar === 4
            ? (state.cell ?? CASINO_RHYTHMS[Math.floor(rng() * 3)])
            : CASINO_RHYTHMS[Math.floor(rng() * CASINO_RHYTHMS.length)];
        if (bar === 0) state.cell = cell;
        line = melody('lead', chord, cell, scale, state.lead, 62, 81, rng, {
          chromatic: cell === CASINO_RHYTHMS[5] || rng() < 0.2,
          strong: 8,
        });
      }
      state.motifs.set(key, line);
    }
    state.lead = last(line).midi;
    ev.push(...line.map((e) => (s === 'A2' ? { ...e, vel: e.vel * 0.95 } : e)));
    // In A' the piano doubles the strong notes an octave up.
    if (s === 'A2')
      for (const e of line)
        if (e.step % 8 === 0) ev.push({ ...e, inst: 'piano', midi: e.midi + 12, vel: 0.35 });
  } else if (s === 'A2') {
    // A' cadence, new each time.
    const cell: Rhythm = bar === 6 ? CASINO_RHYTHMS[4] : [[0, 3], [3, 1], [4, 12]];
    const line = melody('lead', chord, cell, casinoScale(chord), state.lead, 62, 81, rng, {
      cadence: bar === 7,
      strong: 8,
    });
    state.lead = last(line).midi;
    ev.push(...line);
  } else if (s === 'B') {
    // Violin long tones on the guide tones; string ostinato in the second half.
    const tones = pcsOf(chord);
    const guide = [tones[1], tones[tones.length - 1]];
    state.high = nearest(state.high + (rng() < 0.5 ? -2 : 2), guide, 72, 84);
    ev.push({ step: 0, inst: 'violin', midi: state.high, vel: 0.5, dur: end ? 16 : 14 });
    if (bar >= 4) {
      const p = nearest(57, [(chord.root + 7) % 12], 52, 62);
      for (let i = 0; i < 16; i++)
        ev.push({
          step: i,
          inst: 'strings',
          midi: [p, p + 1, p, p - 1][i % 4],
          vel: i % 6 === 0 ? 0.5 : 0.32,
          dur: 1,
        });
    }
    // Muted brass stabs: an anticipation, or the 3-3-2 at the end.
    if (end) for (const at of [0, 6, 12]) ev.push(...chordAt(at, 'brass', reeds, 0.55, 1.5));
    else if (bar % 2 === 1) ev.push(...chordAt(14, 'brass', voicing(next), 0.5, 1.5));
  } else if (s === 'C') {
    // Tense string ostinato on A–B♭, rising in the second half.
    const cell = bar < 4 ? [57, 58, 57, 58] : [57, 58, 61, 62];
    for (let i = 0; i < 16; i++)
      ev.push({
        step: i,
        inst: 'strings',
        midi: cell[i % 4],
        vel: (i % 6 === 0 ? 0.42 : 0.26) + bar * 0.03,
        dur: 1,
      });
    if (bar === 0 || bar === 4)
      ev.push(...chordAt(0, 'piano', [b + 12, b + 13], 0.5, 8));
    if (bar === 2 || bar === 6)
      ev.push({ step: 0, inst: 'violin', midi: bar === 2 ? 81 : 82, vel: 0.35, dur: 16 });
    if (end) ev.push(...chordAt(0, 'brass', reeds, 0.6, 2));
  } else {
    // Turnaround: a chromatic piano fall, then the dominant arpeggio.
    if (bar === 2)
      for (let i = 0; i < 8; i++)
        ev.push({ step: 8 + i, inst: 'piano', midi: 81 - i, vel: 0.42 - i * 0.02, dur: 1 });
    if (bar === 3)
      [57, 61, 64, 67, 70].forEach((midi, i) =>
        ev.push({ step: i * 2, inst: 'piano', midi, vel: 0.4, dur: 6 }),
      );
  }
  // Sparse piano colour.
  if ((s === 'A' || s === 'B') && rng() < 0.25) {
    const at = rng() < 0.5 ? 10 : 14;
    const top = nearest(78 + Math.floor(rng() * 6), pcsOf(chord), 72, 88);
    ev.push({ step: at, inst: 'piano', midi: top, vel: 0.3, dur: 4 });
  }
  // Brushes, rim and a soft kick.
  const drums: NoteEvent[] = [];
  if (s === 'C') {
    drums.push(hit(0, 'kick', 0.7), hit(3, 'kick', 0.45), hit(0, 'brush', 0.2, 3), hit(8, 'brush', 0.2, 3));
    for (const at of [0, 6, 12]) drums.push(hit(at, 'rim', 0.33));
  } else {
    for (const at of [0, 4, 8, 12]) drums.push(hit(at, 'brush', 0.22, 3));
    drums.push(hit(4, 'snare', 0.4), hit(12, 'snare', 0.42));
    if (s === 'B') {
      drums.push(hit(0, 'kick', 0.6), hit(6, 'kick', 0.45), hit(12, 'kick', 0.5), hit(6, 'rim', 0.38));
    } else {
      drums.push(hit(0, 'kick', 0.65));
      if (rng() < 0.6) drums.push(hit(8, 'kick', 0.4));
      if (rng() < 0.6) drums.push(hit(6, 'rim', 0.3), hit(14, 'rim', 0.25));
    }
  }
  // Fills at phrase ends (always into the top of the form).
  if (s === 'T' && end) {
    for (let i = 8; i < 16; i++) drums.push(hit(i, 'snare', 0.16 + (i - 8) * 0.05));
    drums.push(hit(8, 'swell', 0.5, 8));
  } else if (s === 'C' && end) {
    for (let i = 8; i < 16; i++) drums.push(hit(i, 'snare', 0.14 + (i - 8) * 0.045));
  } else if (end && rng() < 0.55) {
    if (rng() < 0.5)
      for (let i = 12; i < 16; i++) drums.push(hit(i, 'snare', 0.2 + (i - 12) * 0.08));
    else for (const at of [12, 13 + 1 / 3, 14 + 2 / 3]) drums.push(hit(at, 'rim', 0.34));
  }
  return [...ev, ...drums];
}

/** 장구 굿거리 (12/8): 덩 · 기덕 · 쿵 · 더러러, per dotted-quarter beat. */
export function janggu(plan: BarPlan): NoteEvent[] {
  const { section: s, bar } = plan;
  const end = bar === plan.of - 1;
  const out: NoteEvent[] = [];
  const deong = (step: number, vel: number) =>
    out.push(hit(step, 'kung', vel), hit(step, 'deok', vel * 0.85));
  const gideok = (step: number, vel: number) =>
    out.push(hit(step - 0.4, 'deok', vel * 0.4), hit(step, 'deok', vel));
  const deoreoreo = (step: number, vel: number) =>
    out.push(hit(step, 'deok', vel), hit(step + 1 / 3, 'deok', vel * 0.6), hit(step + 2 / 3, 'deok', vel * 0.8));
  if (s === 'T' && end) {
    // 휘모리 fill into the top.
    for (let i = 0; i < 12; i++) out.push(hit(i, 'deok', 0.35 + i * 0.03));
    for (const at of [0, 3, 6, 9]) out.push(hit(at, 'kung', 0.6 + at * 0.02));
    return out;
  }
  if (s === 'C') {
    deong(0, 0.6);
    out.push(hit(6, 'kung', 0.45));
    if (bar % 2 === 1) gideok(8, 0.4);
    return out;
  }
  deong(0, 0.85);
  gideok(2, 0.55);
  out.push(hit(3, 'kung', 0.55));
  deoreoreo(5, 0.45);
  if (bar % 4 === 2) deong(6, 0.65);
  else out.push(hit(6, 'kung', 0.65));
  gideok(8, 0.55);
  out.push(hit(9, 'kung', 0.55));
  deoreoreo(11, 0.45);
  return out;
}

/** One bar of the hall piece (12 eighths). */
export function hallBar(plan: BarPlan, state: ScoreState, rng: Rng): NoteEvent[] {
  const { section: s, bar, chord, next } = plan;
  const end = bar === plan.of - 1;
  const ev: NoteEvent[] = [...janggu(plan)];
  const b = bassOf(chord),
    f = fifthOf(chord),
    reeds = voicing(chord);
  const scale = hallScale(chord);
  // The noir bass, in 12/8.
  if (s === 'C') {
    ev.push({ step: 0, inst: 'bass', midi: 38, vel: 0.65, dur: 6 });
    ev.push({ step: 6, inst: 'bass', midi: f, vel: 0.4, dur: 5 });
  } else {
    ev.push(
      { step: 0, inst: 'bass', midi: b, vel: 0.85, dur: 5 },
      { step: 6, inst: 'bass', midi: f, vel: 0.6, dur: 3 },
      { step: 11, inst: 'bass', midi: approach(next, rng), vel: 0.5, dur: 1 },
    );
    if (rng() < 0.5) ev.push({ step: 9, inst: 'bass', midi: b + 12, vel: 0.4, dur: 2 });
  }
  // Reeds (softer than the casino), brushes as the film's thread.
  if ((s === 'A' && bar % 4 === 0) || s === 'A2' || s === 'B')
    ev.push(...chordAt(0, 'reed', reeds, s === 'A' ? 0.22 : 0.28, 11.5));
  if (s === 'T') ev.push(...chordAt(0, 'reed', reeds, 0.35, 5.5), ...chordAt(6, 'reed', reeds, 0.3, 5.5));
  if (s !== 'C') ev.push(hit(0, 'brush', 0.14, 3), hit(6, 'brush', 0.14, 3));
  if (s === 'B') ev.push(hit(9, 'rim', 0.2));
  // 가야금 melody with 농현.
  const bendFor = (e: NoteEvent, i: number): Bend | undefined => {
    const pc = e.midi % 12;
    if (e.dur >= 3 && pc === 9) return 'vib';
    if (e.dur >= 3 && (pc === 7 || pc === 0 || pc === 2) && rng() < 0.5) return 'down';
    if (e.dur >= 6) return 'vib';
    if (i > 0 && e.dur <= 2 && rng() < 0.3) return 'up';
    return undefined;
  };
  const pluck = (line: NoteEvent[]) => line.map((e, i) => ({ ...e, bend: bendFor(e, i) }));
  if (s === 'A' || (s === 'A2' && bar < 6)) {
    const key = 'A' + bar;
    let line = state.motifs.get(key);
    if (!line) {
      const cell =
        bar === 0 || bar === 4 ? HALL_RHYTHMS[0] : HALL_RHYTHMS[Math.floor(rng() * HALL_RHYTHMS.length)];
      line = pluck(melody('gayageum', chord, cell, scale, state.lead, 62, 84, rng, { strong: 6 }));
      state.motifs.set(key, line);
    }
    state.lead = last(line).midi;
    ev.push(...line);
  } else if (s === 'A2') {
    const cell: Rhythm = bar === 6 ? HALL_RHYTHMS[3] : [[0, 3], [3, 9]];
    const line = pluck(
      melody('gayageum', chord, cell, scale, state.lead, 62, 84, rng, { cadence: bar === 7, strong: 6 }),
    );
    state.lead = last(line).midi;
    ev.push(...line);
  } else if (s === 'B') {
    // 가야금 accompaniment and a 대금 line above it.
    const tones = voicing(chord, 64, 60, 76);
    [0, 3, 6, 9].forEach((step, i) =>
      ev.push({ step, inst: 'gayageum', midi: tones[i % tones.length], vel: 0.32, dur: 3 }),
    );
    const shared = pcsOf(chord).filter((pc) => scale.includes(pc));
    state.high = nearest(state.high + (rng() < 0.5 ? -2 : 3), shared.length ? shared : scale, 69, 84);
    if (bar % 4 === 3) {
      const second = stepScale(state.high, -1, scale, 69, 84);
      ev.push({ step: 0, inst: 'daegeum', midi: state.high, vel: 0.5, dur: 6 });
      ev.push({ step: 6, inst: 'daegeum', midi: second, vel: 0.45, dur: 6 });
      state.high = second;
    } else ev.push({ step: 0, inst: 'daegeum', midi: state.high, vel: 0.5, dur: 12 });
  } else if (s === 'C') {
    // 산조-like: sparse, low, bent.
    if (bar % 2 === 0) {
      const m = nearest(state.lead - 3, scale, 60, 74);
      ev.push(
        { step: 0, inst: 'gayageum', midi: m, vel: 0.62, dur: 6, bend: 'vib' },
        { step: 6, inst: 'gayageum', midi: stepScale(m, 1, scale, 60, 74), vel: 0.5, dur: 3, bend: 'down' },
        { step: 9, inst: 'gayageum', midi: m, vel: 0.45, dur: 3 },
      );
      state.lead = m;
    } else ev.push({ step: 6, inst: 'gayageum', midi: nearest(state.lead + 5, scale, 62, 79), vel: 0.55, dur: 6, bend: 'vib' });
    if (bar === 0 || bar === 4) ev.push(...chordAt(0, 'piano', [38, 45], 0.4, 12));
  } else {
    if (bar < 2) {
      // A falling pentatonic run.
      let m = bar === 0 ? 86 : 79;
      for (let i = 0; i < 12; i++) {
        ev.push({ step: i, inst: 'gayageum', midi: m, vel: 0.5 - i * 0.015, dur: 1 });
        m = stepScale(m, -1, scale, 60, 88);
      }
    } else if (bar === 2) ev.push({ step: 0, inst: 'gayageum', midi: 69, vel: 0.62, dur: 12, bend: 'vib' });
    else ev.push({ step: 6, inst: 'daegeum', midi: 73, vel: 0.4, dur: 6 });
  }
  if (!end && (s === 'A' || s === 'A2') && rng() < 0.2)
    ev.push({ step: 9, inst: 'piano', midi: nearest(79, pcsOf(chord), 72, 86), vel: 0.26, dur: 3 });
  return ev;
}

export function barEvents(spec: PieceSpec, plan: BarPlan, state: ScoreState, rng: Rng) {
  return spec.id === 'casino' ? casinoBar(plan, state, rng) : hallBar(plan, state, rng);
}

/** Tension level after `bars` bars of a hand (rises, then holds). */
export const tensionLevel = (bars: number) => Math.min(1, 0.3 + 0.1 * Math.max(0, bars));

/**
 * The tension layer during a hand: a heartbeat (lub-dub) and a muted pulse on
 * the dominant A, both growing with `level` (the heartbeat doubles past 0.6).
 */
export function tensionBar(spec: PieceSpec, level: number): NoteEvent[] {
  const out: NoteEvent[] = [];
  const half = spec.stepsPerBar / 2;
  const lub = spec.stepsPerBeat === 4 ? 3 : 2;
  for (const at of level > 0.6 ? [0, half] : [0]) {
    out.push(hit(at, 'heart', 0.45 + 0.35 * level), hit(at + lub, 'heart', 0.3 + 0.3 * level));
  }
  const every = spec.stepsPerBeat === 4 ? 2 : 1;
  for (let i = 0; i < spec.stepsPerBar; i += every)
    out.push({ step: i, inst: 'pulse', midi: 33, vel: (0.2 + 0.4 * level) * (i % (every * 2) ? 0.7 : 1), dur: every * 0.8 });
  return out;
}

export type StingKind = 'allin' | 'blackjack' | 'bigwin';
export type StingNote = { at: number; inst: Inst; midi: number; vel: number; dur: number };
/** Short one-off stings in D (seconds): all-in, blackjack, a big win. */
export function stingNotes(kind: StingKind): StingNote[] {
  const n = (at: number, inst: Inst, midi: number, vel: number, dur: number) => ({ at, inst, midi, vel, dur });
  if (kind === 'allin')
    // A cluster that won't resolve: B♭ against A, over a low D.
    return [
      n(0, 'kick', 0, 0.8, 0.3),
      n(0, 'bass', 38, 0.95, 1.2),
      ...[57, 58, 62].map((m) => n(0, 'brass', m, 0.75, 0.22)),
      ...[56, 57, 61].map((m) => n(0.27, 'brass', m, 0.8, 0.6)),
      n(0.27, 'rim', 0, 0.6, 0.05),
      ...[74, 75].map((m) => n(0.27, 'piano', m, 0.55, 1.4)),
      ...[57, 58, 57, 58, 57, 58].map((m, i) => n(0.4 + i * 0.07, 'strings', m, 0.45, 0.08)),
    ];
  if (kind === 'blackjack')
    // D major (the minor key's bright ending), up and out.
    return [
      n(0, 'rim', 0, 0.55, 0.05),
      ...[62, 66, 69, 74].map((m, i) => n(i * 0.08, 'piano', m, 0.6, 1.2)),
      ...[62, 66, 69].map((m) => n(0.32, 'reed', m, 0.55, 0.9)),
      ...[66, 69, 74].map((m) => n(0.32, 'brass', m, 0.6, 0.35)),
      n(0.32, 'kick', 0, 0.6, 0.3),
      n(0.32, 'bass', 38, 0.8, 0.9),
    ];
  // The augmented-second flourish, landing on Dm(add9).
  return [
    ...[69, 70, 73, 74].map((m, i) => n(i * 0.09, 'lead', m, 0.7, 0.12)),
    ...[62, 65, 69, 76].map((m) => n(0.36, 'piano', m, 0.55, 1.5)),
    ...[62, 65, 69].map((m) => n(0.36, 'reed', m, 0.45, 1)),
    n(0.36, 'kick', 0, 0.6, 0.3),
    n(0.36, 'bass', 38, 0.85, 1),
    n(0.36, 'rim', 0, 0.45, 0.05),
  ];
}
