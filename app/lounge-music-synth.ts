// WebAudio instruments and a lookahead player for the generative room music
// (lounge-music-score.ts). Works on any BaseAudioContext, so the same code runs
// in the game and in an OfflineAudioContext for render checks. All times are
// passed in (never read from ctx.currentTime).
//
// Graph (built once, reused): instrument buses (shared filters, one tremolo
// and two vibrato LFOs) → mix (+ a short convolver room) → limiter → output.
// `output` is the piece fade: crossfades with the music box / files happen
// on it, and a place change dips it before the new piece starts.
// Per note only the oscillators / noise source and one envelope gain are made.
import {
  PIECES,
  barEvents,
  newScoreState,
  mulberry32,
  planCycle,
  stepSeconds,
  stingNotes,
  tensionBar,
  tensionLevel,
  type BarPlan,
  type Inst,
  type NoteEvent,
  type PieceSpec,
  type Rng,
  type ScoreState,
  type StingKind,
} from './lounge-music-score.ts';
import type { MusicPlace } from './lounge-music-tracks.ts';

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
type Bus =
  | 'bass'
  | 'reed'
  | 'piano'
  | 'strings'
  | 'violin'
  | 'brass'
  | 'drums'
  | 'brush'
  | 'snare'
  | 'rim'
  | 'deok'
  | 'pulse'
  | 'gayageum'
  | 'daegeum'
  | 'breath';

export class NoirEngine {
  /** The piece's level (fades); connect it to the music channel. */
  readonly output: GainNode;
  private readonly ctx: BaseAudioContext;
  private readonly noise: AudioBuffer;
  private readonly level: number;
  private readonly bus: Record<Bus, AudioNode>;
  private readonly pulseFilter: BiquadFilterNode;
  private readonly lfos: OscillatorNode[] = [];
  private readonly violinVibrato: GainNode;
  private readonly flutVibrato: GainNode;
  private readonly limiter: DynamicsCompressorNode;
  private readonly mix: GainNode;

  private spec: PieceSpec | null = null;
  /** The piece asked for (null = fade out). */
  private target: MusicPlace | null = null;
  private stopAt = 0;
  private switchAt = 0;
  private nextStep = 0;
  private step = 0;
  private bars: BarPlan[] = [];
  private barIndex = 0;
  private cycle = 0;
  private events: NoteEvent[] = [];
  private rng: Rng = mulberry32(1);
  private state: ScoreState = newScoreState();
  private tension = false;
  private tensionBars = 0;

  constructor(ctx: BaseAudioContext, noise: AudioBuffer, level: number, seed = Date.now()) {
    this.ctx = ctx;
    this.noise = noise;
    this.level = level;
    this.rng = mulberry32(seed);
    this.output = ctx.createGain();
    this.output.gain.value = 0;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -8;
    this.limiter.knee.value = 3;
    this.limiter.ratio.value = 12;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.2;
    this.limiter.connect(this.output);
    const mix = (this.mix = ctx.createGain());
    mix.gain.value = 0.45;
    mix.connect(this.limiter);
    // A small dark room.
    const room = ctx.createConvolver();
    room.buffer = impulse(ctx, 1.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    room.connect(wet).connect(mix);
    const chain = (send: number, ...nodes: AudioNode[]) => {
      for (let i = 0; i + 1 < nodes.length; i++) nodes[i].connect(nodes[i + 1]);
      const last = nodes[nodes.length - 1];
      last.connect(mix);
      if (send > 0) {
        const s = ctx.createGain();
        s.gain.value = send;
        last.connect(s).connect(room);
      }
      return nodes[0];
    };
    const filter = (type: BiquadFilterType, frequency: number, q = 0.7) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = frequency;
      f.Q.value = q;
      return f;
    };
    const lfo = (rate: number, depth: number, target?: AudioParam) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.frequency.value = rate;
      g.gain.value = depth;
      o.connect(g);
      if (target) g.connect(target);
      o.start();
      this.lfos.push(o);
      return g;
    };
    // Bandoneon: one bandpass and a shared bellows tremolo for every reed voice.
    const tremolo = ctx.createGain();
    tremolo.gain.value = 0.82;
    lfo(5.3, 0.16, tremolo.gain);
    const reed = chain(0.3, filter('bandpass', 1500, 0.6), filter('peaking', 900, 1), tremolo);
    this.violinVibrato = lfo(5.6, 14);
    this.flutVibrato = lfo(4.6, 22);
    const drums = chain(0.14, ctx.createGain());
    this.pulseFilter = filter('lowpass', 300, 5);
    this.bus = {
      bass: chain(0.08, filter('lowpass', 1200, 0.5)),
      reed,
      piano: chain(0.35, ctx.createGain()),
      strings: chain(0.3, filter('lowpass', 2600)),
      violin: chain(0.45, filter('lowpass', 3400)),
      brass: chain(0.2, filter('lowpass', 1300, 2)),
      drums,
      brush: filter('bandpass', 5200, 0.6),
      snare: filter('bandpass', 2300, 0.9),
      rim: filter('highpass', 1600),
      deok: filter('bandpass', 2900, 1.3),
      pulse: chain(0, this.pulseFilter),
      gayageum: chain(0.35, filter('lowpass', 4200)),
      daegeum: chain(0.45, filter('lowpass', 3200)),
      breath: filter('bandpass', 1800, 1.4),
    };
    for (const b of ['brush', 'snare', 'rim', 'deok'] as const) this.bus[b].connect(drums);
    this.bus.breath.connect(this.bus.daegeum);
  }

  /** True while a piece plays or fades (the caller keeps calling schedule). */
  get busy() {
    return !!this.spec || !!this.switchAt;
  }
  get playing(): MusicPlace | null {
    return this.spec?.id ?? null;
  }

  /** Plays a place's piece (crossfade in), or fades out with null. */
  setPiece(id: MusicPlace | null, t: number) {
    if (id === this.target) return;
    this.target = id;
    const g = this.output.gain;
    if (!id) {
      g.cancelScheduledValues(t);
      g.setTargetAtTime(0, t, 0.4);
      this.stopAt = t + 2.5;
      this.switchAt = 0;
      return;
    }
    if (this.spec?.id === id) {
      // Back before the fade finished: carry on.
      this.stopAt = this.switchAt = 0;
      g.cancelScheduledValues(t);
      g.setTargetAtTime(this.level, t, 0.6);
    } else if (this.spec) {
      // Another room: dip out, then start the new piece.
      g.cancelScheduledValues(t);
      g.setTargetAtTime(0, t, 0.25);
      this.stopAt = 0;
      this.switchAt = t + 0.9;
    } else this.start(id, t);
  }
  private start(id: MusicPlace, t: number) {
    this.spec = PIECES[id];
    this.stopAt = this.switchAt = 0;
    this.step = 0;
    this.cycle = 0;
    this.barIndex = 0;
    this.bars = planCycle(this.spec, 0, this.rng);
    this.state = newScoreState();
    this.nextStep = t + 0.08;
    const g = this.output.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.setTargetAtTime(this.level, t, 0.6);
  }

  /** The tension layer during a hand (heartbeat + dominant pulse). */
  setTension(on: boolean) {
    if (on === this.tension) return;
    this.tension = on;
    this.tensionBars = 0;
  }

  /** Schedules every step that starts before `until`. */
  schedule(now: number, until: number) {
    if (this.switchAt && now >= this.switchAt) {
      const id = this.target;
      this.spec = null;
      this.switchAt = 0;
      if (id) this.start(id, now);
    }
    if (this.stopAt && now >= this.stopAt) {
      this.spec = null;
      this.stopAt = 0;
    }
    const spec = this.spec;
    if (!spec) return;
    const stepLength = stepSeconds(spec);
    // After a suspend (hidden tab), pick up from now instead of catching up.
    if (this.nextStep < now - 0.1) this.nextStep = now + 0.05;
    const limit = Math.min(until, this.stopAt || Infinity, this.switchAt || Infinity);
    while (this.nextStep < limit) {
      const inBar = this.step % spec.stepsPerBar;
      if (inBar === 0) this.newBar(spec);
      for (const e of this.events)
        if (Math.floor(e.step) === inBar) {
          const jitter = e.inst === 'kick' || e.inst === 'heart' ? 0 : (this.rng() - 0.5) * 0.008;
          this.play(e, this.nextStep + (e.step - inBar) * stepLength + jitter, e.dur * stepLength);
        }
      this.nextStep += stepLength;
      this.step++;
    }
  }
  private newBar(spec: PieceSpec) {
    if (this.barIndex >= this.bars.length) {
      this.cycle++;
      this.bars = planCycle(spec, this.cycle, this.rng);
      this.barIndex = 0;
      const { lead, high } = this.state;
      this.state = { ...newScoreState(), lead, high };
    }
    const plan = this.bars[this.barIndex++];
    this.events = barEvents(spec, plan, this.state, this.rng);
    if (this.tension) {
      const level = tensionLevel(this.tensionBars++);
      this.events.push(...tensionBar(spec, level));
      this.pulseFilter.frequency.setTargetAtTime(220 + 1100 * level, this.nextStep, 1.5);
    }
  }

  /** A short sting on `out` (the sfx bus), in the key of both pieces. */
  sting(kind: StingKind, out: AudioNode, t: number) {
    const ctx = this.ctx;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.value = 0.13; // peaks near a card flip on the sfx bus
    tone.connect(g).connect(out);
    let end = t;
    for (const n of stingNotes(kind)) {
      const e: NoteEvent = { step: 0, inst: n.inst, midi: n.midi, vel: n.vel, dur: 1 };
      this.play(e, t + n.at, n.dur, tone);
      end = Math.max(end, t + n.at + n.dur + 1.6);
    }
    // Let the temporary chain go once the tails are done.
    const stop = ctx.createConstantSource();
    stop.offset.value = 0;
    stop.connect(g);
    stop.onended = () => {
      tone.disconnect();
      g.disconnect();
    };
    stop.start(t);
    stop.stop(end);
  }

  dispose() {
    for (const o of this.lfos)
      try {
        o.stop();
      } catch {}
    this.output.disconnect();
    this.spec = null;
  }

  // ---- instruments -----------------------------------------------------
  private env(out: AudioNode, t: number, peak: number, attack: number, hold: number, release: number) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    if (hold > attack) g.gain.setValueAtTime(peak, t + hold);
    g.gain.setTargetAtTime(0, t + Math.max(hold, attack), release / 4);
    g.connect(out);
    return { g, end: t + Math.max(hold, attack) + release + 0.05 };
  }
  private decay(out: AudioNode, t: number, peak: number, attack: number, length: number) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0004, t + attack + length);
    g.gain.setValueAtTime(0, t + attack + length + 0.01);
    g.connect(out);
    return { g, end: t + attack + length + 0.02 };
  }
  private osc(type: OscillatorType, frequency: number, out: AudioNode, t: number, end: number, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = frequency;
    o.detune.value = detune;
    o.connect(out);
    o.start(t);
    o.stop(end);
    return o;
  }
  private noiseHit(out: AudioNode, t: number, peak: number, attack: number, length: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const { g, end } = this.decay(out, t, peak, attack, length);
    src.connect(g);
    src.start(t, this.rng() * (this.noise.duration - 1));
    src.stop(end);
  }

  private play(e: NoteEvent, t: number, dur: number, out?: AudioNode) {
    const f = hz(e.midi),
      v = e.vel,
      bus = this.bus;
    switch (e.inst as Inst) {
      case 'bass': {
        const { g, end } = this.decay(out ?? bus.bass, t, 0.13 * v, 0.006, Math.min(1.1, dur + 0.35));
        this.osc('triangle', f, g, t, end);
        const body = this.osc('sine', f, g, t, end);
        body.frequency.setValueAtTime(f * 1.012, t);
        body.frequency.exponentialRampToValueAtTime(f, t + 0.04);
        return;
      }
      case 'reed':
      case 'lead': {
        const lead = e.inst === 'lead';
        const { g, end } = this.env(out ?? bus.reed, t, (lead ? 0.11 : 0.13) * v, lead ? 0.03 : 0.07, dur, 0.14);
        const a = this.osc('sawtooth', f, g, t, end, -7);
        const b = this.osc(lead ? 'square' : 'sawtooth', f, g, t, end, 6);
        if (lead)
          for (const o of [a, b]) {
            o.frequency.setValueAtTime(f * 0.985, t);
            o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
          }
        return;
      }
      case 'piano': {
        const { g, end } = this.decay(out ?? bus.piano, t, 0.3 * v, 0.004, Math.max(0.6, Math.min(2.2, dur + 0.8)));
        this.osc('triangle', f, g, t, end);
        this.osc('sine', f * 2, g, t, end);
        return;
      }
      case 'strings': {
        const { g, end } = this.decay(out ?? bus.strings, t, 0.12 * v, 0.008, 0.16);
        this.osc('sawtooth', f, g, t, end);
        return;
      }
      case 'violin': {
        const { g, end } = this.env(out ?? bus.violin, t, 0.09 * v, 0.4, dur, 0.5);
        for (const d of [-6, 6]) this.vibrato(this.violinVibrato, this.osc('sawtooth', f, g, t, end, d));
        return;
      }
      case 'brass': {
        const { g, end } = this.env(out ?? bus.brass, t, 0.085 * v, 0.012, dur, 0.1);
        this.osc('sawtooth', f, g, t, end, -4);
        this.osc('square', f, g, t, end, 4);
        return;
      }
      case 'kick':
      case 'heart':
      case 'kung': {
        const [start, stop, len, peak] =
          e.inst === 'kick'
            ? [110, 48, 0.22, 0.5]
            : e.inst === 'heart'
              ? [72, 42, 0.2, 0.55]
              : [150, 82, 0.34, 0.32];
        const { g, end } = this.decay(out ?? bus.drums, t, peak * v, 0.003, len);
        const o = this.osc('sine', start, g, t, end);
        o.frequency.exponentialRampToValueAtTime(stop, t + len * 0.6);
        if (e.inst === 'kung') {
          // The 궁편's slap.
          this.noiseHit(out ?? bus.snare, t, 0.12 * v, 0.002, 0.05);
        }
        return;
      }
      case 'brush':
        // A sweep: a slow swell of filtered noise.
        this.noiseHit(out ?? bus.brush, t, 0.1 * v, Math.min(0.12, dur * 0.3), dur * 0.8 + 0.05);
        return;
      case 'snare':
        this.noiseHit(out ?? bus.snare, t, 0.28 * v, 0.002, 0.13);
        {
          const { g, end } = this.decay(out ?? bus.drums, t, 0.1 * v, 0.002, 0.06);
          this.osc('triangle', 195, g, t, end);
        }
        return;
      case 'rim': {
        this.noiseHit(out ?? bus.rim, t, 0.2 * v, 0.001, 0.025);
        const { g, end } = this.decay(out ?? bus.drums, t, 0.14 * v, 0.001, 0.04);
        this.osc('triangle', 830, g, t, end);
        return;
      }
      case 'deok': {
        // 채편: a dry bamboo crack.
        this.noiseHit(out ?? bus.deok, t, 0.3 * v, 0.001, 0.06);
        const { g, end } = this.decay(out ?? bus.drums, t, 0.07 * v, 0.001, 0.05);
        this.osc('triangle', 640, g, t, end);
        return;
      }
      case 'swell': {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noise;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09 * v, t + dur);
        g.gain.linearRampToValueAtTime(0, t + dur + 0.04);
        g.connect(out ?? bus.brush);
        src.connect(g);
        src.start(t, this.rng());
        src.stop(t + dur + 0.06);
        return;
      }
      case 'pulse': {
        const { g, end } = this.decay(out ?? bus.pulse, t, 0.12 * v, 0.004, Math.max(0.08, dur));
        this.osc('square', f, g, t, end);
        return;
      }
      case 'gayageum': {
        // A bright pluck whose brightness dies quickly, with 농현.
        const length = Math.max(0.7, Math.min(2.6, dur * 1.4));
        const main = this.decay(out ?? bus.gayageum, t, 0.16 * v, 0.003, length);
        const bright = this.decay(main.g, t, 0.9, 0.001, 0.18);
        const a = this.osc('sine', f, main.g, t, main.end);
        const b = this.osc('sawtooth', f, bright.g, t, bright.end);
        this.bend(e, [a.frequency, b.frequency], f, t, dur);
        return;
      }
      case 'daegeum': {
        const { g, end } = this.env(out ?? bus.daegeum, t, 0.13 * v, 0.14, dur, 0.35);
        const a = this.osc('sine', f, g, t, end);
        const b = this.osc('triangle', f, g, t, end);
        for (const o of [a, b]) {
          o.frequency.setValueAtTime(f * 0.965, t);
          o.frequency.exponentialRampToValueAtTime(f, t + 0.16);
          this.vibrato(this.flutVibrato, o);
        }
        // Breath.
        const src = this.ctx.createBufferSource();
        src.buffer = this.noise;
        const breath = this.env(out ?? bus.breath, t, 0.05 * v, 0.08, dur, 0.3);
        src.connect(breath.g);
        src.start(t, this.rng());
        src.stop(breath.end);
        return;
      }
    }
  }
  /** Shared vibrato on a note's detune, let go when the note ends. */
  private vibrato(lfo: GainNode, o: OscillatorNode) {
    lfo.connect(o.detune);
    o.onended = () => lfo.disconnect(o.detune);
  }
  /** 농현: vibrato (떠는 소리), a push up into the note, or a drop at its end (꺾는 소리). */
  private bend(e: NoteEvent, params: AudioParam[], f: number, t: number, dur: number) {
    if (!e.bend) return;
    for (const p of params) {
      if (e.bend === 'up') {
        p.setValueAtTime(f * 2 ** (-1.5 / 12), t);
        p.exponentialRampToValueAtTime(f, t + 0.12);
      } else if (e.bend === 'down') {
        const at = t + Math.max(0.15, dur * 0.55);
        p.setValueAtTime(f, at);
        p.exponentialRampToValueAtTime(f * 2 ** (-2 / 12), at + 0.14);
      } else {
        const length = Math.max(0.4, dur - 0.1);
        const curve = new Float32Array(Math.ceil(length * 5.2 * 10) + 2);
        for (let i = 0; i < curve.length; i++) {
          const x = i / (curve.length - 1);
          curve[i] = f * 2 ** ((Math.sin(x * length * 5.2 * 2 * Math.PI) * 0.45 * x) / 12);
        }
        p.setValueCurveAtTime(curve, t + 0.12, length);
      }
    }
  }
}

/** A dark, short stereo room (decaying noise). */
function impulse(ctx: BaseAudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      smooth = smooth * 0.6 + (Math.random() * 2 - 1) * 0.4;
      data[i] = smooth * (1 - i / length) ** 3 * (i < 200 ? i / 200 : 1);
    }
  }
  return buffer;
}
