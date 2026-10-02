// Original generative pieces for the districts (lounge-districts.ts), one per
// map, each unlike the hub's music box and the rooms' pieces:
// - ① 시장 거리: a bouncy G-major market polka, 120 bpm: oom-pah bass, off-beat
//   piano stabs, kick / rim / brushes, a plucked lead (가야금 voice, no bends)
//   that the piano and the accordion (reeds) answer.
// - ② 항구 구역: a breezy A-dorian sea waltz (3/4, 132 bpm): bass on one,
//   pizzicato chords on two and three, an accordion tune with a 대금 (tin
//   whistle) answer, string swells and a surf-like noise swell every few bars.
// - ③ 언덕 주택가: a calm F-major pastoral, 72 bpm, no drums: soft piano broken
//   chords, a 대금 flute line and a quiet violin counter-line (library-quiet).
// - ④ 목장·과수원 "들길의 오후": a lilting D-major 6/8 country tune, 104 bpm:
//   a strummed pluck (가야금 voice in short chord strums like a ukulele), a
//   dotted bass, a 대금 pipe tune with a reed answer and a soft brush on two.
// - ⑤ 산기슭 마을 "풀무와 산바람": a D-dorian work song, 92 bpm in 4/4: the
//   anvil rings on the beat with a hammer pickup, low strings and a bass
//   drone, a brass call answered by the 대금, a mountain-wind swell. At night
//   the hammer rests and only the wind, the drone and a slow pipe stay.
// Every piece has a night variant (state.night: no drums, sparser, softer, and
// `nightTempo` slows it a little). Melodies are seeded random walks over chord
// tones (lounge-music-score.ts melody), so no existing tune is quoted.
// Pure data: the NoirEngine (lounge-music-synth.ts) plays them.
import {
  approach,
  bassOf,
  ch,
  chordAt,
  hit,
  last,
  melody,
  nearest,
  pcsOf,
  stepScale,
  voicing,
  type BarPlan,
  type NoteEvent,
  type PieceSpec,
  type Rhythm,
  type Rng,
  type ScoreState,
} from './lounge-music-score.ts';

/** A major / modal scale from its pitch classes, with a raised note over a chord that has it. */
const scaleOver = (base: readonly number[], swap: readonly (readonly [number, number])[], chordPcs: readonly number[]) =>
  base.map((pc) => {
    const s = swap.find(([from, to]) => pc === from && chordPcs.includes(to));
    return s ? s[1] : pc;
  });
/** Keeps a remembered A-section line for A2 (the ear finds the tune again). */
function motif(state: ScoreState, key: string, plan: BarPlan, make: () => NoteEvent[]): NoteEvent[] {
  let line = state.motifs.get(key);
  if (!line || plan.section !== 'A2' || plan.bar >= plan.of - 2) {
    line = make();
    if (plan.section === 'A') state.motifs.set(key, line);
  }
  return line;
}
const soften = (list: NoteEvent[], by: number) => list.map((e) => ({ ...e, vel: e.vel * by }));

// ------------------------------------------------------------ ① 시장 거리
// Pitch classes: C0 C♯1 D2 E♭3 E4 F5 F♯6 G7 A♭8 A9 B♭10 B11.
const G = ch(7, [0, 4, 7]),
  GB = ch(7, [0, 4, 7], 11),
  C = ch(0, [0, 4, 7]),
  D7 = ch(2, [0, 4, 7, 10]),
  Em = ch(4, [0, 3, 7]),
  Am7 = ch(9, [0, 3, 7, 10]),
  A7 = ch(9, [0, 4, 7, 10]);
const G_MAJOR = [7, 9, 11, 0, 2, 4, 6];
export const marketScale = (c: { root: number; tones: readonly number[] }) => scaleOver(G_MAJOR, [[0, 1]], pcsOf(c));
/** Bouncy 16th cells (step, length). */
export const MARKET_RHYTHMS: readonly Rhythm[] = [
  [[0, 2], [2, 2], [4, 1], [6, 2], [8, 4], [12, 2], [14, 2]],
  [[0, 3], [3, 1], [4, 2], [6, 2], [8, 2], [10, 2], [12, 4]],
  [[2, 2], [4, 2], [6, 2], [8, 6], [14, 2]],
  [[0, 1], [2, 1], [4, 2], [6, 1], [8, 3], [11, 1], [12, 4]],
];

export function marketBar(plan: BarPlan, state: ScoreState, rng: Rng): NoteEvent[] {
  const { section: s, bar, chord, next } = plan;
  const night = state.night;
  const ev: NoteEvent[] = [];
  const b = bassOf(chord),
    f = nearest(b + 7, pcsOf(chord), 33, 52),
    scale = marketScale(chord),
    end = bar === plan.of - 1;
  // Oom-pah bass (a walk-up into the next bar by day).
  ev.push({ step: 0, inst: 'bass', midi: b, vel: night ? 0.6 : 0.85, dur: 3 }, { step: 8, inst: 'bass', midi: f, vel: night ? 0.45 : 0.7, dur: 3 });
  if (!night && !end && s !== 'C') ev.push({ step: 14, inst: 'bass', midi: approach(next, rng), vel: 0.42, dur: 2 });
  const comp = voicing(chord, 64, 57, 72);
  if (night) ev.push(...chordAt(0, 'piano', comp, 0.2, 14));
  else {
    for (const step of [4, 12]) ev.push(...chordAt(step, 'piano', comp, 0.26, 1.5));
    // Kick on one and three, rim on the off-beats, light brushes.
    if (s !== 'C') ev.push(hit(0, 'kick', 0.48), hit(8, 'kick', 0.42), hit(4, 'rim', 0.3), hit(12, 'rim', 0.34));
    for (const step of [2, 6, 10, 14]) ev.push(hit(step, 'brush', 0.08, 1));
  }
  // The tune: a plucked lead in A / A2, piano answers in B, the accordion in C.
  if (s === 'A' || s === 'A2') {
    const line = motif(state, 'M' + bar, plan, () =>
      melody('gayageum', chord, MARKET_RHYTHMS[bar % MARKET_RHYTHMS.length], scale, state.lead, 67, 84, rng, {
        cadence: s === 'A2' && end,
        strong: 4,
      }),
    );
    state.lead = last(line).midi;
    ev.push(...soften(night ? line.filter((e) => e.step % 4 === 0).map((e) => ({ ...e, inst: 'piano' as const })) : line, night ? 0.55 : 0.82));
  } else if (s === 'B') {
    const line = melody('piano', chord, MARKET_RHYTHMS[(bar + 2) % MARKET_RHYTHMS.length], scale, state.high, 69, 86, rng, { strong: 4 });
    state.high = last(line).midi;
    ev.push(...soften(night ? line.filter((_, i) => i % 2 === 0) : line, night ? 0.5 : 0.7));
    // Pizzicato arpeggio under it by day.
    if (!night) pcsOf(chord).slice(0, 4).forEach((pc, i) => ev.push({ step: 1 + i * 4, inst: 'strings', midi: nearest(60 + i * 3, [pc], 55, 76), vel: 0.4, dur: 1 }));
  } else if (s === 'C') {
    if (bar % 2 === 0) {
      const line = melody('reed', chord, [[0, 6], [6, 2], [8, 8]], scale, state.lead, 62, 76, rng, { strong: 8 });
      state.lead = last(line).midi;
      ev.push(...soften(line, night ? 0.4 : 0.55));
    }
  } else if (end) ev.push(...chordAt(0, 'piano', voicing(chord, 67, 60, 79), night ? 0.22 : 0.32, 12));
  else ev.push({ step: 0, inst: night ? 'piano' : 'gayageum', midi: nearest(state.lead, pcsOf(chord), 67, 84), vel: 0.5, dur: 8 });
  return ev;
}

export const MARKET: PieceSpec = {
  id: 'market',
  bpm: 120,
  stepsPerBeat: 4,
  stepsPerBar: 16,
  sections: {
    A: [G, GB, C, D7, G, Em, Am7, D7],
    B: [C, C, G, Em, Am7, D7, G, D7],
    A2: [G, GB, C, D7, G, Em, D7, G],
    C: [Em, Em, C, C, A7, A7, Am7, D7],
    T: [G, C, D7, G],
  },
  forms: [
    ['A', 'B', 'A2', 'C', 'T'],
    ['A', 'A2', 'B', 'C', 'T'],
    ['A', 'C', 'B', 'A2', 'T'],
  ],
  bar: marketBar,
  nightTempo: 0.86,
};

// ------------------------------------------------------------ ② 항구 구역
const Am = ch(9, [0, 3, 7]),
  Gh = ch(7, [0, 4, 7]),
  Dh = ch(2, [0, 4, 7]),
  Emh = ch(4, [0, 3, 7]),
  Ch = ch(0, [0, 4, 7]),
  E7 = ch(4, [0, 4, 7, 10]);
const A_DORIAN = [9, 11, 0, 2, 4, 6, 7];
/** A dorian; G♯ over E7 (the leading note home). */
export const harborScale = (c: { root: number; tones: readonly number[] }) => scaleOver(A_DORIAN, [[7, 8]], pcsOf(c));
/** Waltz cells in eighths (6 per bar). */
export const HARBOR_RHYTHMS: readonly Rhythm[] = [
  [[0, 3], [3, 1], [4, 2]],
  [[0, 2], [2, 2], [4, 2]],
  [[0, 4], [4, 1], [5, 1]],
  [[0, 1], [1, 1], [2, 2], [4, 2]],
  [[0, 6]],
];

export function harborBar(plan: BarPlan, state: ScoreState, rng: Rng): NoteEvent[] {
  const { section: s, bar, chord } = plan;
  const night = state.night;
  const ev: NoteEvent[] = [];
  const b = bassOf(chord),
    scale = harborScale(chord),
    end = bar === plan.of - 1;
  // Oom-pah-pah: bass on one, pizzicato chords on two and three.
  ev.push({ step: 0, inst: 'bass', midi: b, vel: night ? 0.6 : 0.82, dur: night ? 5 : 2 });
  const comp = voicing(chord, 64, 57, 72);
  if (night) ev.push(...chordAt(2, 'piano', comp, 0.16, 4));
  else {
    ev.push(...chordAt(2, 'strings', comp, 0.34, 1), ...chordAt(4, 'strings', comp, 0.28, 1));
    ev.push(hit(0, 'kick', 0.32), hit(2, 'brush', 0.07, 1), hit(4, 'brush', 0.06, 1));
  }
  // A surf-like swell every four bars.
  if (bar % 4 === 0) ev.push({ step: 0, inst: 'swell', midi: 0, vel: night ? 0.28 : 0.36, dur: 5 });
  if (s === 'A' || s === 'A2') {
    const line = motif(state, 'H' + bar, plan, () =>
      melody('reed', chord, HARBOR_RHYTHMS[bar % 4], scale, state.lead, 64, 79, rng, { cadence: s === 'A2' && end, strong: 2 }),
    );
    state.lead = last(line).midi;
    ev.push(...soften(night ? line.map((e) => ({ ...e, inst: 'daegeum' as const })) : line, night ? 0.5 : 0.62));
  } else if (s === 'B') {
    // The whistle answers, high and long.
    if (!night || bar % 2 === 0) {
      const line = melody('daegeum', chord, HARBOR_RHYTHMS[bar % 2 ? 4 : 2], scale, state.high, 72, 86, rng, { strong: 2 });
      state.high = last(line).midi;
      ev.push(...soften(line, night ? 0.45 : 0.6));
    }
  } else if (s === 'C') {
    ev.push({ step: 0, inst: 'violin', midi: nearest(state.lead + 3, pcsOf(chord), 62, 79), vel: night ? 0.4 : 0.6, dur: 6 });
    if (!night && bar % 2) ev.push({ step: 3, inst: 'reed', midi: stepScale(state.lead, -1, scale, 60, 79), vel: 0.4, dur: 3 });
  } else if (end) ev.push(...chordAt(0, 'piano', voicing(chord, 67, 60, 79), 0.26, 6));
  else ev.push({ step: 0, inst: 'reed', midi: nearest(state.lead, pcsOf(chord), 64, 79), vel: night ? 0.3 : 0.45, dur: 5 });
  return ev;
}

export const HARBOR: PieceSpec = {
  id: 'harbor',
  bpm: 132,
  stepsPerBeat: 2,
  stepsPerBar: 6,
  sections: {
    A: [Am, Am, Gh, Gh, Am, Dh, Emh, Am],
    B: [Ch, Ch, Gh, Gh, Am, Am, E7, E7],
    A2: [Am, Am, Gh, Gh, Am, Dh, E7, Am],
    C: [Dh, Dh, Am, Am, Ch, Gh, E7, E7],
    T: [Am, Gh, E7, Am],
  },
  forms: [
    ['A', 'B', 'A2', 'C', 'T'],
    ['A', 'C', 'A2', 'B', 'T'],
    ['A', 'A2', 'B', 'C', 'T'],
  ],
  bar: harborBar,
  nightTempo: 0.88,
};

// ------------------------------------------------------------ ③ 언덕 주택가
const Fmaj7 = ch(5, [0, 4, 7, 11]),
  FA = ch(5, [0, 4, 7], 9),
  Am7h = ch(9, [0, 3, 7, 10]),
  Bbmaj7 = ch(10, [0, 4, 7, 11]),
  Cc = ch(0, [0, 4, 7]),
  Csus = ch(0, [0, 5, 7]),
  Dm7 = ch(2, [0, 3, 7, 10]),
  Gm7 = ch(7, [0, 3, 7, 10]);
export const F_MAJOR = [5, 7, 9, 10, 0, 2, 4];
/** Gentle cells in eighths (8 per bar). */
export const HILLSIDE_RHYTHMS: readonly Rhythm[] = [
  [[0, 4], [4, 2], [6, 2]],
  [[0, 6], [6, 2]],
  [[2, 2], [4, 4]],
  [[0, 3], [3, 1], [4, 4]],
];
/** The broken-chord shape (indices into the voicing), one per eighth. */
const ARPEGGIO = [0, 1, 2, 3, 2, 1, 2, 1];

export function hillsideBar(plan: BarPlan, state: ScoreState, rng: Rng): NoteEvent[] {
  const { section: s, bar, chord } = plan;
  const night = state.night;
  const ev: NoteEvent[] = [];
  const end = bar === plan.of - 1;
  ev.push({ step: 0, inst: 'bass', midi: bassOf(chord), vel: night ? 0.5 : 0.52, dur: 7 });
  const v = voicing(chord, 64, 57, 76);
  ARPEGGIO.forEach((i, step) => {
    if (night && step % 2) return;
    ev.push({ step, inst: 'piano', midi: v[Math.min(i, v.length - 1)], vel: (step % 4 === 0 ? 0.3 : 0.22) * (night ? 1.05 : 1), dur: night ? 2.5 : 1.5 });
  });
  if (s === 'A' || s === 'A2') {
    const line = motif(state, 'L' + bar, plan, () =>
      melody('daegeum', chord, HILLSIDE_RHYTHMS[bar % HILLSIDE_RHYTHMS.length], F_MAJOR, state.lead, 69, 84, rng, {
        cadence: s === 'A2' && end,
        strong: 2,
      }),
    );
    state.lead = last(line).midi;
    ev.push(...soften(night ? line.filter((e) => e.dur >= 2).map((e) => ({ ...e, inst: 'piano' as const, midi: e.midi + 12 })) : line, night ? 0.4 : 0.55));
  } else if (s === 'B') {
    if (!night) ev.push({ step: 0, inst: 'violin', midi: nearest(state.high - 2, pcsOf(chord), 64, 79), vel: 0.45, dur: bar % 2 ? 7 : 4 });
    if (bar % 2 === 0) ev.push({ step: 4, inst: night ? 'piano' : 'violin', midi: nearest(state.high, pcsOf(chord), 64, 81), vel: 0.4, dur: 4 });
    state.high = nearest(state.high + (rng() < 0.5 ? -2 : 2), pcsOf(chord), 67, 81);
  } else if (s === 'C') {
    const line = melody('piano', chord, [[0, 3], [3, 1], [4, 4]], F_MAJOR, state.high, 72, 88, rng, { strong: 4 });
    state.high = last(line).midi;
    ev.push(...soften(line, night ? 0.35 : 0.45));
  } else if (end) ev.push(...chordAt(0, 'piano', voicing(chord, 67, 60, 79), 0.24, 8));
  return ev;
}

export const HILLSIDE: PieceSpec = {
  id: 'hillside',
  bpm: 72,
  stepsPerBeat: 2,
  stepsPerBar: 8,
  sections: {
    A: [Fmaj7, Am7h, Bbmaj7, Cc, Fmaj7, Dm7, Gm7, Csus],
    B: [Bbmaj7, Bbmaj7, Am7h, Dm7, Gm7, Gm7, Csus, Cc],
    A2: [Fmaj7, Am7h, Bbmaj7, Cc, Fmaj7, Dm7, Gm7, Fmaj7],
    C: [Dm7, Am7h, Bbmaj7, FA, Gm7, Dm7, Bbmaj7, Csus],
    T: [Fmaj7, Bbmaj7, Fmaj7, Cc],
  },
  forms: [
    ['A', 'B', 'A2', 'C', 'T'],
    ['A', 'C', 'B', 'A2', 'T'],
    ['A', 'A2', 'C', 'B', 'T'],
  ],
  bar: hillsideBar,
  nightTempo: 0.9,
};

// ------------------------------------------------------------ ④ 목장·과수원
const Dr = ch(2, [0, 4, 7]),
  Gr = ch(7, [0, 4, 7]),
  Ar = ch(9, [0, 4, 7]),
  A7r = ch(9, [0, 4, 7, 10]),
  Bmr = ch(11, [0, 3, 7]),
  Emr = ch(4, [0, 3, 7]),
  F7r = ch(6, [0, 3, 7]),
  DGr = ch(2, [0, 4, 7], 7);
export const D_MAJOR = [2, 4, 6, 7, 9, 11, 1];
/** Lilting 6/8 cells (eighths). */
export const RANCH_RHYTHMS: readonly Rhythm[] = [
  [[0, 2], [2, 1], [3, 2], [5, 1]],
  [[0, 3], [3, 3]],
  [[0, 1], [1, 1], [2, 1], [3, 3]],
  [[0, 2], [2, 1], [3, 3]],
];

export function ranchBar(plan: BarPlan, state: ScoreState, rng: Rng): NoteEvent[] {
  const { section: s, bar, chord } = plan;
  const night = state.night;
  const ev: NoteEvent[] = [];
  const b = bassOf(chord),
    fifth = nearest(b + 7, pcsOf(chord), 33, 52),
    end = bar === plan.of - 1;
  // A dotted country bass: root on one, fifth on four.
  ev.push({ step: 0, inst: 'bass', midi: b, vel: night ? 0.55 : 0.78, dur: 2.5 });
  if (!night) ev.push({ step: 3, inst: 'bass', midi: fifth, vel: 0.6, dur: 2.5 });
  // The strum: short chords on one and four, a lighter off-beat by day.
  const strum = voicing(chord, 62, 55, 74);
  for (const [step, vel] of night ? ([[0, 0.16]] as const) : ([[0, 0.24], [2, 0.14], [3, 0.2], [5, 0.12]] as const))
    strum.forEach((m, i) => ev.push({ step: step + i * 0.06, inst: 'gayageum', midi: m, vel: vel * (night ? 1 : 0.9), dur: night ? 5 : 1.2 }));
  if (!night) ev.push(hit(3, 'brush', 0.08, 1));
  if (s === 'A' || s === 'A2') {
    const line = motif(state, 'R' + bar, plan, () =>
      melody('daegeum', chord, RANCH_RHYTHMS[bar % RANCH_RHYTHMS.length], D_MAJOR, state.lead, 69, 86, rng, { cadence: s === 'A2' && end, strong: 3 }),
    );
    state.lead = last(line).midi;
    ev.push(...soften(line, night ? 0.42 : 0.6));
  } else if (s === 'B') {
    // The reed answers a third lower, every other bar the pipe returns.
    const inst = bar % 2 ? 'daegeum' : 'reed';
    const line = melody(inst, chord, RANCH_RHYTHMS[(bar + 1) % RANCH_RHYTHMS.length], D_MAJOR, state.high, 64, 81, rng, { strong: 3 });
    state.high = last(line).midi;
    ev.push(...soften(line, night ? 0.36 : 0.5));
  } else if (s === 'C') {
    ev.push({ step: 0, inst: 'violin', midi: nearest(state.lead - 3, pcsOf(chord), 62, 78), vel: night ? 0.35 : 0.5, dur: 6 });
  } else if (end) ev.push(...chordAt(0, 'piano', voicing(chord, 67, 60, 79), 0.24, 6));
  else ev.push({ step: 0, inst: 'daegeum', midi: nearest(state.lead, pcsOf(chord), 69, 84), vel: night ? 0.3 : 0.42, dur: 5 });
  return ev;
}

export const RANCH: PieceSpec = {
  id: 'ranch',
  bpm: 104,
  stepsPerBeat: 2,
  stepsPerBar: 6,
  sections: {
    A: [Dr, Gr, Dr, Ar, Dr, Gr, A7r, Dr],
    B: [Gr, Gr, Dr, Bmr, Emr, Emr, A7r, A7r],
    A2: [Dr, Gr, Dr, Ar, Bmr, Gr, A7r, Dr],
    C: [Bmr, F7r, Gr, Dr, Emr, Ar, DGr, A7r],
    T: [Dr, Gr, A7r, Dr],
  },
  forms: [
    ['A', 'B', 'A2', 'C', 'T'],
    ['A', 'A2', 'C', 'B', 'T'],
    ['A', 'C', 'A2', 'B', 'T'],
  ],
  bar: ranchBar,
  nightTempo: 0.88,
};

// ------------------------------------------------------------ ⑤ 산기슭 마을
const Dmf = ch(2, [0, 3, 7]),
  Dm7f = ch(2, [0, 3, 7, 10]),
  Gf = ch(7, [0, 4, 7]),
  Cf = ch(0, [0, 4, 7]),
  Fmf = ch(5, [0, 4, 7]),
  Amf = ch(9, [0, 3, 7]),
  Bbf = ch(10, [0, 4, 7]);
export const D_DORIAN = [2, 4, 5, 7, 9, 11, 0];
/** Work-song cells (16ths). */
export const FOOTHILL_RHYTHMS: readonly Rhythm[] = [
  [[0, 4], [4, 2], [6, 2], [8, 8]],
  [[0, 6], [6, 2], [8, 4], [12, 4]],
  [[0, 2], [2, 2], [4, 4], [8, 8]],
  [[0, 8], [8, 4], [12, 4]],
];
/** The anvil's pattern by day: on the beats, with a hammer pickup before three. */
const ANVIL_STEPS: readonly (readonly [number, number])[] = [
  [0, 0.5],
  [4, 0.32],
  [7, 0.2],
  [8, 0.44],
  [12, 0.3],
];

export function foothillBar(plan: BarPlan, state: ScoreState, rng: Rng): NoteEvent[] {
  const { section: s, bar, chord } = plan;
  const night = state.night;
  const ev: NoteEvent[] = [];
  const b = bassOf(chord),
    end = bar === plan.of - 1;
  // A low drone under everything.
  ev.push({ step: 0, inst: 'bass', midi: b, vel: night ? 0.5 : 0.7, dur: night ? 15 : 7 });
  if (!night) ev.push({ step: 8, inst: 'bass', midi: b, vel: 0.55, dur: 7 });
  // The anvil (the smith's hammer) — resting in section C and at night.
  if (!night && s !== 'C') for (const [step, vel] of ANVIL_STEPS) ev.push({ step, inst: 'anvil', midi: 84, vel, dur: 1 });
  if (!night && s !== 'C') ev.push(hit(0, 'kick', 0.36), hit(8, 'kick', 0.3));
  // Low strings hold the chord.
  ev.push(...chordAt(0, 'strings', voicing(chord, 55, 48, 67), night ? 0.16 : 0.24, 15));
  // Mountain wind every four bars.
  if (bar % 4 === 0) ev.push({ step: 0, inst: 'swell', midi: 0, vel: night ? 0.34 : 0.26, dur: 12 });
  if (s === 'A' || s === 'A2') {
    const inst = night ? 'daegeum' : 'brass';
    const line = motif(state, 'F' + bar, plan, () =>
      melody(inst, chord, FOOTHILL_RHYTHMS[bar % FOOTHILL_RHYTHMS.length], D_DORIAN, state.lead, 62, 77, rng, { cadence: s === 'A2' && end, strong: 8 }),
    );
    state.lead = last(line).midi;
    ev.push(...soften(line, night ? 0.4 : 0.5));
  } else if (s === 'B') {
    const line = melody('daegeum', chord, FOOTHILL_RHYTHMS[(bar + 2) % FOOTHILL_RHYTHMS.length], D_DORIAN, state.high, 69, 84, rng, { strong: 8 });
    state.high = last(line).midi;
    ev.push(...soften(line, night ? 0.38 : 0.55));
  } else if (s === 'C') {
    if (bar % 2 === 0) ev.push({ step: 0, inst: 'daegeum', midi: nearest(state.high, pcsOf(chord), 69, 84), vel: night ? 0.3 : 0.4, dur: 14 });
  } else if (end) ev.push(...chordAt(0, 'piano', voicing(chord, 62, 55, 74), 0.22, 14));
  else ev.push({ step: 0, inst: 'violin', midi: nearest(state.lead, pcsOf(chord), 62, 77), vel: night ? 0.3 : 0.42, dur: 12 });
  return ev;
}

export const FOOTHILL: PieceSpec = {
  id: 'foothill',
  bpm: 92,
  stepsPerBeat: 4,
  stepsPerBar: 16,
  sections: {
    A: [Dmf, Dmf, Cf, Gf, Dmf, Fmf, Cf, Dmf],
    B: [Fmf, Cf, Gf, Dm7f, Bbf, Fmf, Amf, Amf],
    A2: [Dmf, Dmf, Cf, Gf, Dmf, Fmf, Amf, Dmf],
    C: [Bbf, Bbf, Fmf, Fmf, Gf, Gf, Amf, Amf],
    T: [Dmf, Cf, Amf, Dmf],
  },
  forms: [
    ['A', 'B', 'A2', 'C', 'T'],
    ['A', 'A2', 'B', 'C', 'T'],
    ['A', 'C', 'B', 'A2', 'T'],
  ],
  bar: foothillBar,
  nightTempo: 0.86,
};
