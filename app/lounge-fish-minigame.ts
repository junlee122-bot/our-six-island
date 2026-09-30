// 손맛 미니게임 (design-fishing-upgrade.md §4): a vertical track where the
// player keeps a catch zone over a moving fish. Pure integer simulation so the
// browser and the Edge function (both run this file) always agree: the client
// plays it live, sends only the hold/release run lengths, and the server
// re-simulates them from the seed it stored when the fish was hooked.
// No floating point beyond integer-valued doubles; no Math.sin/random.
import type { Behaviour } from './lounge-fish-data.ts';

export const TICK_MS = 25;
/** 45 s. A fight that is not over by then is an escape. */
export const MAX_TICKS = 1_800;
export const TRACK = 10_000;
export const FULL = 10_000;
export const START_PROGRESS = 3_000;
/** Runs in one trace (a human toggles far less often). */
export const MAX_RUNS = 600;
/** No progress loss in the first half second (the zone starts at the bottom). */
export const GRACE_TICKS = 20;
export const BAR_ACCEL = 9;
export const BAR_MAX_SPEED = 200;
export const BAR_BASE: Readonly<Record<number, number>> = { 1: 2_500, 2: 2_800, 3: 3_100, 4: 3_300, 5: 3_500 };
export const BAR_MAX = 4_600;
export const GAIN = 42;
export const TREASURE_GAIN = 70;
export const TREASURE_LOSS = 35;

export type FightSetup = {
  /** uint32 */
  seed: number;
  behaviour: Behaviour;
  /** 10–95 */
  difficulty: number;
  /** Catch zone height (track units). */
  bar: number;
  /** Progress per tick with the fish in the zone. */
  gain: number;
  /** Progress lost per tick with the fish outside. */
  loss: number;
  /** A chest that shows up at tick `at` at height `pos` (null: none this time). */
  treasure: null | { at: number; pos: number };
};
export type FightResult = {
  caught: boolean;
  ticks: number;
  /** The fish never left the zone. */
  perfect: boolean;
  treasure: boolean;
};
export type FightState = {
  tick: number;
  barY: number;
  barV: number;
  fishY: number;
  fishV: number;
  target: number;
  progress: number;
  treasure: 'none' | 'hidden' | 'active' | 'got' | 'lost';
  treasureProgress: number;
  perfect: boolean;
  done: null | 'caught' | 'escaped';
};

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);
const div = (a: number, b: number) => Math.trunc(a / b);

/** mulberry32: 32-bit integer PRNG (Math.imul keeps it exact everywhere). */
export function rng32(seed: number) {
  let a = seed >>> 0;
  return (n: number) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const u = (t ^ (t >>> 14)) >>> 0;
    return n > 0 ? u % n : 0;
  };
}

const MOVE_BASE: Record<Behaviour, number> = { calm: 16, dart: 16, sink: 20, float: 20, mixed: 22 };
const PICK: readonly Exclude<Behaviour, 'mixed'>[] = ['calm', 'dart', 'sink', 'float'];

/** Loss per tick for a difficulty (tackle and friends scale it in the engine). */
export const baseLoss = (difficulty: number) => 30 + div(difficulty, 3);

/** One fight. `step(hold)` advances one tick; the same code runs on both sides. */
export class FightSim {
  readonly setup: FightSetup;
  readonly state: FightState;
  private rand: (n: number) => number;
  constructor(setup: FightSetup) {
    this.setup = setup;
    this.rand = rng32(setup.seed);
    const start = 1_000 + this.rand(2_500);
    this.state = {
      tick: 0,
      barY: 0,
      barV: 0,
      fishY: start,
      fishV: 0,
      target: start,
      progress: START_PROGRESS,
      treasure: setup.treasure ? 'hidden' : 'none',
      treasureProgress: 0,
      perfect: true,
      done: null,
    };
  }
  get bar() {
    return this.setup.bar;
  }
  inZone(y = this.state.fishY) {
    return y >= this.state.barY && y <= this.state.barY + this.setup.bar;
  }
  step(hold: boolean): FightState {
    const s = this.state,
      { difficulty: d, behaviour } = this.setup;
    if (s.done) return s;
    s.tick += 1;
    // Fish: now and then a new target; it chases it with limited acceleration.
    const chance = MOVE_BASE[behaviour] + div(d * 2, 5);
    const maxSpeed = 50 + div(d * 22, 10),
      accel = 4 + div(d, 10);
    if (this.rand(1_000) < chance) {
      const b = behaviour === 'mixed' ? PICK[this.rand(4)] : behaviour;
      const surge = this.rand(4) === 0;
      if (b === 'calm') s.target = clamp(s.fishY + this.rand(4_001) - 2_000, 0, TRACK);
      else if (b === 'dart') {
        s.target = this.rand(TRACK + 1);
        s.fishV += s.target > s.fishY ? 20 + div(d, 2) : -(20 + div(d, 2));
      } else if (b === 'sink') s.target = surge ? this.rand(TRACK + 1) : this.rand(5_501);
      else s.target = surge ? this.rand(TRACK + 1) : TRACK - this.rand(5_501);
    }
    const desired = clamp(div(s.target - s.fishY, 4), -maxSpeed, maxSpeed);
    // A little wobble that grows with difficulty (fish never sit still).
    const wobble = div(d, 8);
    s.fishV += clamp(desired - s.fishV, -accel, accel) + (wobble ? this.rand(wobble * 2 + 1) - wobble : 0);
    s.fishV = clamp(s.fishV, -(maxSpeed + 60), maxSpeed + 60);
    s.fishY += s.fishV;
    if (s.fishY <= 0 || s.fishY >= TRACK) {
      s.fishY = clamp(s.fishY, 0, TRACK);
      s.fishV = 0;
    }
    // Catch zone: hold to rise, let go to sink; a soft bounce on the floor.
    s.barV = clamp(s.barV + (hold ? BAR_ACCEL : -BAR_ACCEL), -BAR_MAX_SPEED, BAR_MAX_SPEED);
    s.barY += s.barV;
    const top = TRACK - this.setup.bar;
    if (s.barY < 0) {
      s.barY = 0;
      s.barV = s.barV <= -30 ? div(-s.barV, 3) : 0;
    } else if (s.barY > top) {
      s.barY = top;
      s.barV = 0;
    }
    const inside = this.inZone();
    if (inside) s.progress = Math.min(FULL, s.progress + this.setup.gain);
    else if (s.tick > GRACE_TICKS) {
      s.progress = Math.max(0, s.progress - this.setup.loss);
      s.perfect = false;
    }
    // Treasure: appears once; keep it in the zone until its ring fills.
    const t = this.setup.treasure;
    if (t && s.treasure === 'hidden' && s.tick >= t.at) s.treasure = 'active';
    if (t && s.treasure === 'active') {
      s.treasureProgress = this.inZone(t.pos)
        ? Math.min(FULL, s.treasureProgress + TREASURE_GAIN)
        : Math.max(0, s.treasureProgress - TREASURE_LOSS);
      if (s.treasureProgress >= FULL) s.treasure = 'got';
    }
    if (s.progress >= FULL) s.done = 'caught';
    else if (s.progress <= 0 || s.tick >= MAX_TICKS) s.done = 'escaped';
    if (s.done && s.treasure !== 'got' && s.treasure !== 'none') s.treasure = 'lost';
    return s;
  }
  result(): FightResult {
    const s = this.state;
    return { caught: s.done === 'caught', ticks: s.tick, perfect: s.done === 'caught' && s.perfect, treasure: s.done === 'caught' && s.treasure === 'got' };
  }
}

// ---------------------------------------------------------------- traces
/**
 * Input trace: run lengths in ticks, alternating release/hold and starting
 * with release (the first run may be 0 when the button was already down).
 */
export class TraceRecorder {
  private runs: number[] = [0];
  private holding = false;
  push(hold: boolean) {
    if (hold !== this.holding) {
      this.runs.push(0);
      this.holding = hold;
    }
    this.runs[this.runs.length - 1] += 1;
  }
  get ticks() {
    return this.runs.reduce((a, b) => a + b, 0);
  }
  toRuns(): number[] {
    return [...this.runs];
  }
}
export type TraceCheck =
  | { ok: true; result: FightResult }
  | { ok: false; reason: 'shape' | 'long' | 'inhuman' | 'overrun' };
/** Structure only (no simulation): numbers, bounds and a human toggle rate. */
export function traceShape(runs: unknown): { ok: true; runs: number[]; ticks: number } | { ok: false; reason: 'shape' | 'long' | 'inhuman' } {
  if (!Array.isArray(runs) || runs.length < 1 || runs.length > MAX_RUNS) return { ok: false, reason: 'shape' };
  let ticks = 0;
  for (let i = 0; i < runs.length; i++) {
    const n = runs[i];
    if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < (i === 0 ? 0 : 1) || n > MAX_TICKS) return { ok: false, reason: 'shape' };
    ticks += n;
  }
  if (ticks > MAX_TICKS) return { ok: false, reason: 'long' };
  // Average run of at least two ticks (50 ms): nobody toggles at 40 Hz.
  if (runs.length > 2 + div(ticks, 2)) return { ok: false, reason: 'inhuman' };
  return { ok: true, runs: runs as number[], ticks };
}
/** Replays a trace. A trace that keeps going after the fight ended is refused. */
export function replayTrace(setup: FightSetup, runs: unknown): TraceCheck {
  const shape = traceShape(runs);
  if (!shape.ok) return shape;
  const sim = new FightSim(setup);
  let hold = false,
    used = 0;
  for (const n of shape.runs) {
    for (let k = 0; k < n; k++) {
      if (sim.state.done) break;
      sim.step(hold);
      used += 1;
    }
    hold = !hold;
  }
  // One tick of slack for the frame the result landed on.
  if (shape.ticks - used > 1) return { ok: false, reason: 'overrun' };
  if (!sim.state.done) {
    // The player let go of the rod (closed the window): an escape.
    return { ok: true, result: { caught: false, ticks: used, perfect: false, treasure: false } };
  }
  return { ok: true, result: sim.result() };
}

/**
 * A simple reference player (tests, economy script): holds when the fish is
 * above the zone's middle, adjusted for the zone's speed. Not perfect, which
 * is the point: it shows the fight is winnable, not trivial.
 */
export function botPlay(setup: FightSetup, { react = 3, look = 6 } = {}): { runs: number[]; result: FightResult } {
  const sim = new FightSim(setup),
    rec = new TraceRecorder();
  let lag = 0,
    hold = false;
  while (!sim.state.done) {
    const s = sim.state,
      mid = s.barY + div(setup.bar, 2) + s.barV * look;
    // Reaction: re-decide only every `react` ticks (3 = 75 ms), like a person.
    if (lag <= 0) {
      hold = s.fishY > mid;
      lag = react;
    }
    lag -= 1;
    sim.step(hold);
    rec.push(hold);
  }
  return { runs: rec.toRuns(), result: sim.result() };
}
