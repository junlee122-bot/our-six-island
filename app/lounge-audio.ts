// Procedural village audio for 범타듀 밸리 (no audio files):
// - a gentle generative music-box loop (major pentatonic by day, a slower
//   minor variant at night),
// - ambient water near the river and birds by day (crickets at night),
// - footsteps while walking and soft UI clicks.
// Starts only after the first user gesture, suspends while the tab is hidden,
// and follows the sound / music / volume settings in lounge-settings.ts.
// This is the app's single AudioContext: UI cues (feedback.ts playCue) and
// the go-table stone tap play through its sfx bus. The music box fades out at
// game tables (scene.game) and comes back in the village.
import {
  getSettings,
  onSettingsChange,
  updateSettings,
} from './lounge-settings';

type Scene = {
  /** Village screen is showing (ambience and footsteps). */
  village: boolean;
  night: boolean;
  /** 0..1 closeness to the river. */
  water: number;
  /** A game table is showing: the music box steps aside for game sounds. */
  game: boolean;
};

const DAY_SCALE = [0, 2, 4, 7, 9]; // major pentatonic
const NIGHT_SCALE = [0, 3, 5, 7, 10]; // minor pentatonic
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

class LoungeAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private ambient: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private sfx: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private step = 0;
  private phrase: number[] = [];
  private nextChirp = 0;
  private lastStep = 0;
  private attached = 0;
  private gestured = false;
  private scene: Scene = { village: false, night: false, water: 0, game: false };
  private cleanup: (() => void) | null = null;
  /** Running water loop (only while the village is showing). */
  private waterNodes: { source: AudioBufferSourceNode; lfo: OscillatorNode } | null =
    null;
  /** Last applied gain targets, so repeated setScene calls are free. */
  private applied = '';

  /** Installs gesture/visibility/settings listeners (ref-counted). */
  attach() {
    this.attached++;
    if (this.attached > 1 || typeof window === 'undefined')
      return () => this.detach();
    const gesture = () => {
      this.gestured = true;
      this.ensure();
      window.removeEventListener('pointerdown', gesture, true);
      window.removeEventListener('keydown', gesture, true);
    };
    const visibility = () => this.applyState();
    const click = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.('button, [role=button], summary')) this.click();
    };
    window.addEventListener('pointerdown', gesture, true);
    window.addEventListener('keydown', gesture, true);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('click', click, true);
    // Settings may change in the settings modal or another tab.
    const unsubscribe = onSettingsChange(() => this.applyState());
    this.cleanup = () => {
      window.removeEventListener('pointerdown', gesture, true);
      window.removeEventListener('keydown', gesture, true);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('click', click, true);
      unsubscribe();
    };
    return () => this.detach();
  }
  private detach() {
    this.attached = Math.max(0, this.attached - 1);
    if (this.attached) return;
    this.cleanup?.();
    this.cleanup = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.master = this.music = this.ambient = this.sfx = this.waterGain = null;
    this.waterNodes = null;
    this.applied = '';
  }

  setScene(patch: Partial<Scene>) {
    const before = this.scene;
    this.scene = { ...this.scene, ...patch };
    if (before.night !== this.scene.night) this.phrase = [];
    // The village calls this every 700 ms; only a real change touches audio.
    if (
      before.village === this.scene.village &&
      before.night === this.scene.night &&
      before.game === this.scene.game &&
      Math.abs(before.water - this.scene.water) < 0.02
    )
      return;
    this.applyState();
  }

  /** Exposes the engine state for QA (data-audio on <html>). */
  private flag() {
    if (typeof document !== 'undefined')
      document.documentElement.dataset.audio = this.ctx?.state ?? 'off';
  }
  /** True when the context is running (for tests / harness). */
  get running() {
    return this.ctx?.state === 'running';
  }

  private ensure() {
    const settings = getSettings();
    if (!this.gestured || !settings.sound) return;
    if (!this.ctx) {
      try {
        const Ctor =
          globalThis.AudioContext ??
          (globalThis as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return;
        const ctx = new Ctor();
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.connect(ctx.destination);
        this.music = ctx.createGain();
        this.music.connect(this.master);
        this.ambient = ctx.createGain();
        this.ambient.connect(this.master);
        this.sfx = ctx.createGain();
        this.sfx.connect(this.master);
        this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      } catch {
        this.ctx = null;
        return;
      }
    }
    this.applyState();
  }

  private applyState() {
    const ctx = this.ctx;
    if (!ctx || !this.master) {
      if (this.gestured && getSettings().sound) this.ensure();
      return;
    }
    const settings = getSettings();
    const hidden =
      typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const audible = settings.sound && settings.volume > 0 && !hidden;
    const t = ctx.currentTime;
    const musicOn = audible && settings.music;
    const ambientOn = musicOn && this.scene.village && !this.scene.game;
    const targets = [
      audible ? settings.volume : 0,
      musicOn && !this.scene.game ? (this.scene.night ? 0.16 : 0.2) : 0,
      ambientOn ? 1 : 0,
      Math.round(Math.max(0, Math.min(1, this.scene.water)) * 50) / 50,
      audible ? 1 : 0,
    ];
    const key = targets.join(',');
    if (key !== this.applied) {
      this.applied = key;
      this.master.gain.setTargetAtTime(targets[0], t, 0.08);
      this.music!.gain.setTargetAtTime(targets[1], t, this.scene.game ? 0.25 : 0.8);
      this.ambient!.gain.setTargetAtTime(targets[2], t, 0.4);
      this.waterGain?.gain.setTargetAtTime(0.05 + 0.3 * targets[3], t, 0.5);
      this.sfx!.gain.setTargetAtTime(targets[4], t, 0.02);
    }
    // The water loop (noise + filter + LFO) only runs in the village.
    if (ambientOn && !this.waterNodes) this.startWater();
    else if (!ambientOn && this.waterNodes) this.stopWater();
    if (hidden || !settings.sound) {
      if (ctx.state === 'running')
        void ctx
          .suspend()
          .then(() => this.flag())
          .catch(() => {});
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      return;
    }
    if (ctx.state !== 'running')
      void ctx
        .resume()
        .then(() => this.flag())
        .catch(() => {});
    this.flag();
    if (!this.timer) {
      this.nextNote = ctx.currentTime + 0.2;
      this.timer = setInterval(() => this.schedule(), 150);
    }
  }

  private startWater() {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 700;
    band.Q.value = 0.6;
    const lfo = ctx.createOscillator(),
      depth = ctx.createGain();
    lfo.frequency.value = 0.17;
    depth.gain.value = 260;
    lfo.connect(depth).connect(band.frequency);
    this.waterGain = ctx.createGain();
    this.waterGain.gain.value = 0.05;
    source.connect(band).connect(this.waterGain).connect(this.ambient!);
    source.start();
    lfo.start();
    this.waterNodes = { source, lfo };
  }
  private stopWater() {
    const nodes = this.waterNodes;
    this.waterNodes = null;
    if (!nodes || !this.ctx) return;
    // Let the ambient gain fade first, then stop the sources.
    const at = this.ctx.currentTime + 1.5;
    try {
      nodes.source.stop(at);
      nodes.lfo.stop(at);
    } catch {}
  }

  /** Lookahead scheduler for the music box and ambient chirps. */
  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const settings = getSettings();
    // No notes (and no oscillators) while the music is off or a game is on.
    if (!settings.music || this.scene.game) {
      this.nextNote = ctx.currentTime + 0.2;
      return;
    }
    const night = this.scene.night;
    const beat = night ? 0.62 : 0.42;
    while (this.nextNote < ctx.currentTime + 0.6) {
      this.playStep(this.nextNote, night);
      this.nextNote += beat;
      this.step++;
    }
    if (this.scene.village && ctx.currentTime > this.nextChirp) {
      if (night) this.cricket(ctx.currentTime + 0.05);
      else this.bird(ctx.currentTime + 0.05);
      this.nextChirp = ctx.currentTime + (night ? 1.2 : 2.5) + Math.random() * 4;
    }
  }

  private playStep(t: number, night: boolean) {
    const scale = night ? NIGHT_SCALE : DAY_SCALE;
    const root = night ? 69 : 72; // A4 at night, C5 by day
    // A new 16-step phrase each loop: a gentle random walk on the scale,
    // repeated once so the ear finds a motif.
    if (!this.phrase.length || this.step % 32 === 0) {
      const phrase: number[] = [];
      let degree = 2;
      for (let i = 0; i < 16; i++) {
        degree = Math.max(0, Math.min(9, degree + Math.round((Math.random() - 0.5) * 3)));
        phrase.push(Math.random() < (night ? 0.45 : 0.3) ? -1 : degree);
      }
      this.phrase = phrase;
    }
    const degree = this.phrase[this.step % 16];
    if (degree >= 0) {
      const note =
        root + scale[degree % 5] + 12 * Math.floor(degree / 5) - (night ? 12 : 0);
      this.musicBox(t, midi(note), night ? 0.09 : 0.11, night ? 2.2 : 1.4);
    }
    // Soft bass on every fourth step.
    if (this.step % 4 === 0) {
      const bassDegree = [0, 3, 4, 3][Math.floor(this.step / 4) % 4];
      this.pad(t, midi(root - 24 + scale[bassDegree % 5]), night ? 0.05 : 0.045, night ? 2.4 : 1.6);
    }
  }

  private musicBox(t: number, frequency: number, peak: number, decay: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0005, t + decay);
    g.connect(this.music!);
    for (const [ratio, level, type] of [
      [1, 1, 'sine'],
      [2, 0.28, 'sine'],
      [3.01, 0.12, 'triangle'],
    ] as const) {
      const o = ctx.createOscillator(),
        partial = ctx.createGain();
      o.type = type;
      o.frequency.value = frequency * ratio;
      partial.gain.value = level;
      o.connect(partial).connect(g);
      o.start(t);
      o.stop(t + decay + 0.05);
    }
  }
  private pad(t: number, frequency: number, peak: number, length: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = frequency;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0005, t + length);
    o.connect(g).connect(this.music!);
    o.start(t);
    o.stop(t + length + 0.05);
  }
  private bird(t: number) {
    const ctx = this.ctx!;
    const notes = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notes; i++) {
      const start = t + i * 0.13,
        o = ctx.createOscillator(),
        g = ctx.createGain(),
        base = 2400 + Math.random() * 1400;
      o.type = 'sine';
      o.frequency.setValueAtTime(base, start);
      o.frequency.exponentialRampToValueAtTime(base * 1.35, start + 0.06);
      o.frequency.exponentialRampToValueAtTime(base * 0.9, start + 0.1);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.022, start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0004, start + 0.11);
      o.connect(g).connect(this.ambient!);
      o.start(start);
      o.stop(start + 0.12);
    }
  }
  private cricket(t: number) {
    const ctx = this.ctx!;
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.07,
        o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 4300;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.01, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0003, start + 0.05);
      o.connect(g).connect(this.ambient!);
      o.start(start);
      o.stop(start + 0.06);
    }
  }

  /** One footstep (rate-limited); `run` makes it a little brighter. */
  footstep(run = false) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !getSettings().music) return;
    const now = ctx.currentTime;
    if (now - this.lastStep < (run ? 0.2 : 0.3)) return;
    this.lastStep = now;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = (run ? 1100 : 750) + Math.random() * 200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.07);
    source.connect(filter).connect(g).connect(this.sfx!);
    source.start(now, Math.random() * 1.5, 0.08);
  }
  /** A soft UI click. */
  click() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1250, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.03);
    g.gain.setValueAtTime(0.035, t);
    g.gain.exponentialRampToValueAtTime(0.0004, t + 0.05);
    o.connect(g).connect(this.sfx!);
    o.start(t);
    o.stop(t + 0.06);
  }
  /**
   * A short UI cue (invites, turns, results) on the shared sfx bus. `peak` is
   * before the master volume. Returns false when audio is not running yet.
   */
  cue(notes: readonly number[], step: number, type: OscillatorType, peak = 0.09) {
    this.ensure();
    const ctx = this.ctx;
    if (!ctx || !this.sfx) return false;
    if (ctx.state !== 'running') void ctx.resume().catch(() => {});
    notes.forEach((frequency, i) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain(),
        t = ctx.currentTime + i * step;
      o.type = type;
      o.frequency.value = frequency;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.35);
      o.connect(g).connect(this.sfx!);
      o.start(t);
      o.stop(t + 0.4);
    });
    return true;
  }
  /** Go stone tap (lounge-go-table). */
  tap() {
    this.ensure();
    const ctx = this.ctx;
    if (!ctx || !this.sfx) return;
    const t = ctx.currentTime,
      o = ctx.createOscillator(),
      gain = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(310, t);
    o.frequency.exponentialRampToValueAtTime(100, t + 0.075);
    gain.gain.setValueAtTime(0.055, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(gain).connect(this.sfx);
    o.start(t);
    o.stop(t + 0.1);
  }
  /**
   * Card-table sounds (blackjack / hold'em): `deal` a soft card swish per
   * card (`count` cards, `gap` seconds apart, matching the deal stagger),
   * `flip` a short paper snap for a revealed hole card, `chips` a little
   * clatter when a pot or payout moves. Quiet, and silent when sound is off.
   */
  table(kind: 'deal' | 'flip' | 'chips', count = 1, gap = 0.09) {
    if (!getSettings().sound) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx || !this.sfx || !this.noise || ctx.state !== 'running') return;
    const n = Math.max(1, Math.min(kind === 'chips' ? 5 : 10, count));
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * (kind === 'chips' ? 0.045 : gap);
      if (kind === 'chips') {
        // Two bright partials, slightly detuned per chip.
        const o = ctx.createOscillator(),
          g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 2400 + ((i * 373) % 700);
        g.gain.setValueAtTime(0.03, t);
        g.gain.exponentialRampToValueAtTime(0.0004, t + 0.05);
        o.connect(g).connect(this.sfx);
        o.start(t);
        o.stop(t + 0.06);
        continue;
      }
      const source = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter(),
        g = ctx.createGain(),
        length = kind === 'flip' ? 0.05 : 0.09;
      source.buffer = this.noise;
      filter.type = kind === 'flip' ? 'highpass' : 'bandpass';
      filter.frequency.value = kind === 'flip' ? 2600 : 1800 + ((i * 211) % 500);
      g.gain.setValueAtTime(kind === 'flip' ? 0.09 : 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + length);
      source.connect(filter).connect(g).connect(this.sfx);
      source.start(t, (i * 0.137) % 1.5, length + 0.02);
    }
  }
  /** Little rewards: plant, water, harvest, coin. */
  chime(kind: 'plant' | 'water' | 'harvest' | 'coin' | 'mail') {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const sets = {
      plant: [523.25, 659.25],
      water: [880, 783.99, 698.46],
      harvest: [659.25, 783.99, 1046.5],
      coin: [1318.5, 1760],
      mail: [783.99, 987.77],
    } as const;
    sets[kind].forEach((f, i) =>
      this.musicBoxTo(this.sfx!, ctx.currentTime + i * 0.08, f, 0.06, 0.6),
    );
  }
  private musicBoxTo(
    out: AudioNode,
    t: number,
    frequency: number,
    peak: number,
    decay: number,
  ) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = frequency;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, t + decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + decay + 0.05);
  }
}

/** One shared audio engine for the lounge app. */
export const loungeAudio = new LoungeAudio();
/** Convenience for the settings UI. */
export const setMusic = (music: boolean) => updateSettings({ music });
