// Procedural village audio for 범타듀 밸리 (no audio files):
// - a gentle generative music-box loop (major pentatonic by day, a slower
//   minor variant at night),
// - ambient water near the river and birds by day (crickets at night),
// - footsteps while walking and soft UI clicks.
// Starts only after the first user gesture, suspends while the tab is hidden,
// and follows the sound / music / volume settings in lounge-settings.ts.
// The Esc menu (scene.paused) ducks music and ambience while it is open.
// This is the app's single AudioContext. Channels under the master volume:
// music (music box + ambience), sfx (footsteps, tables, life cues) and ui
// (feedback.ts playCue, button clicks), each with its own settings level.
// In 별빛 카지노 / 범마을 회관 (scene.place) the room has its own music: a looping
// file when one exists (lounge-music-tracks.ts), otherwise the room's generative
// noir piece (lounge-music-synth.ts), crossfaded with the music box; at game
// tables it continues quietly when 게임 중 배경음 is on (settings.gameMusic) and
// steps aside otherwise. Table hooks add a tension layer during a hand and
// short stings for big moments (tableTension / sting).
import {
  getSettings,
  onSettingsChange,
  updateSettings,
} from './lounge-settings';
import { NoirEngine } from './lounge-music-synth';
import { SFX_FILES, type SfxId } from './lounge-sfx-files';
import type { StingKind } from './lounge-music-score';
import {
  MUSIC_PLACES,
  MUSIC_TRACKS,
  PIECE_LEVEL,
  TRACK_LEVEL,
  TRACK_RELEASE_MS,
  loopPoints,
  musicMix,
  trackCandidates,
  type MusicPlace,
} from './lounge-music-tracks';

type Scene = {
  /** Village screen is showing (ambience and footsteps). */
  village: boolean;
  night: boolean;
  /** 0..1 closeness to the river. */
  water: number;
  /** A game table is showing: the music quiets down (or steps aside). */
  game: boolean;
  /** 별빛 카지노 / 범마을 회관 (inside, or at one of its tables): its location track. */
  place: MusicPlace | null;
  /** The Esc menu is open: ambience and music step back (the world goes on). */
  paused: boolean;
};

const DAY_SCALE = [0, 2, 4, 7, 9]; // major pentatonic
const NIGHT_SCALE = [0, 3, 5, 7, 10]; // minor pentatonic
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

/** One location track: fetched and decoded on first entry, looped seamlessly. */
type TrackSlot = {
  status: 'idle' | 'loading' | 'ready' | 'missing';
  buffer: AudioBuffer | null;
  gain: GainNode | null;
  source: AudioBufferSourceNode | null;
  /** Context time to stop a faded-out source (0 = playing or none). */
  stopAt: number;
  /** Date.now() when last heard (idle buffers are released). */
  heard: number;
};
const emptySlot = (): TrackSlot => ({
  status: 'idle',
  buffer: null,
  gain: null,
  source: null,
  stopAt: 0,
  heard: 0,
});

class LoungeAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  /** The music box under the music channel (crossfades with location tracks). */
  private box: GainNode | null = null;
  private boxOn = false;
  private tracks: Record<MusicPlace, TrackSlot> = { casino: emptySlot(), hall: emptySlot(), tavern: emptySlot() };
  /** The generative room pieces (made on first need, then reused). */
  private noir: NoirEngine | null = null;
  private tension = false;
  private ambient: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private sfx: GainNode | null = null;
  /** UI cues and clicks (settings 소리 → 알림·버튼 소리). */
  private ui: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private step = 0;
  private phrase: number[] = [];
  private nextChirp = 0;
  private lastStep = 0;
  private attached = 0;
  private gestured = false;
  private scene: Scene = {
    village: false,
    night: false,
    water: 0,
    game: false,
    place: null,
    paused: false,
  };
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
    this.master = this.music = this.box = this.ambient = this.sfx = this.ui = this.waterGain = null;
    this.tracks = { casino: emptySlot(), hall: emptySlot(), tavern: emptySlot() };
    this.noir?.dispose();
    this.noir = null;
    this.boxOn = false;
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
      before.place === this.scene.place &&
      before.paused === this.scene.paused &&
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
        this.box = ctx.createGain();
        this.box.gain.value = 0;
        this.box.connect(this.music);
        this.ambient = ctx.createGain();
        this.ambient.connect(this.master);
        this.sfx = ctx.createGain();
        this.sfx.connect(this.master);
        this.ui = ctx.createGain();
        this.ui.connect(this.master);
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
    // The Esc menu ducks music and ambience; the shared world keeps going.
    const duck = this.scene.paused ? 0.35 : 1;
    // Fetch the place's file on first entry (its synth piece plays meanwhile).
    if (musicOn && this.scene.place) this.loadTrack(this.scene.place);
    const mix = musicMix(
      this.scene,
      settings.gameMusic,
      (place) => this.tracks[place].status === 'ready',
    );
    this.boxOn = musicOn && mix.box > 0;
    const targets = [
      audible ? settings.volume : 0,
      musicOn ? mix.channel * settings.musicVolume * duck : 0,
      ambientOn ? settings.musicVolume * duck : 0,
      Math.round(Math.max(0, Math.min(1, this.scene.water)) * 50) / 50,
      audible ? settings.effectsVolume : 0,
      audible ? settings.uiVolume : 0,
      this.boxOn ? mix.box : 0,
    ];
    const key = targets.join(',');
    if (key !== this.applied) {
      this.applied = key;
      this.master.gain.setTargetAtTime(targets[0], t, 0.08);
      this.music!.gain.setTargetAtTime(targets[1], t, this.scene.game ? 0.25 : 0.8);
      this.ambient!.gain.setTargetAtTime(targets[2], t, 0.4);
      this.waterGain?.gain.setTargetAtTime(0.05 + 0.3 * targets[3], t, 0.5);
      this.sfx!.gain.setTargetAtTime(targets[4], t, 0.02);
      this.ui!.gain.setTargetAtTime(targets[5], t, 0.02);
      this.box!.gain.setTargetAtTime(targets[6], t, 0.5);
    }
    for (const place of MUSIC_PLACES)
      this.fadeTrack(place, musicOn && mix.track === place, t);
    const synth = musicOn ? mix.synth : null;
    if (synth || this.noir) this.noirEngine()?.setPiece(synth, t);
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

  private noirEngine() {
    if (!this.noir && this.ctx && this.noise && this.music) {
      this.noir = new NoirEngine(this.ctx, this.noise, PIECE_LEVEL);
      this.noir.output.connect(this.music);
      this.noir.setTension(this.tension);
    }
    return this.noir;
  }
  /** A hand is being played at a casino / hall table: the piece's tension layer. */
  tableTension(on: boolean) {
    this.tension = on;
    this.noir?.setTension(on);
  }
  /** A short sting for a big table moment (all-in, blackjack, a big win). */
  sting(kind: StingKind) {
    if (!getSettings().sound) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx || !this.sfx || ctx.state !== 'running') return;
    this.noirEngine()?.sting(kind, this.sfx, ctx.currentTime + 0.03);
  }

  /** Fetches and decodes a place's track once (a missing file stays missing). */
  private loadTrack(place: MusicPlace) {
    const ctx = this.ctx,
      slot = this.tracks[place];
    if (!ctx || slot.status !== 'idle') return;
    const probe = typeof Audio === 'function' ? new Audio() : null;
    const urls = trackCandidates(MUSIC_TRACKS[place], (mime) =>
      probe ? probe.canPlayType(mime) : 'maybe',
    );
    if (!urls.length) {
      slot.status = 'missing';
      return;
    }
    slot.status = 'loading';
    void (async () => {
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
          if (this.ctx !== ctx || slot !== this.tracks[place]) return;
          slot.buffer = buffer;
          slot.status = 'ready';
          slot.heard = Date.now();
          this.applyState();
          return;
        } catch {}
      }
      if (slot === this.tracks[place]) slot.status = 'missing';
    })();
  }
  /** Fades a location track in (starting its loop) or out (stopping it later). */
  private fadeTrack(place: MusicPlace, on: boolean, t: number) {
    const ctx = this.ctx,
      slot = this.tracks[place];
    if (!ctx || !this.music) return;
    if (on && slot.buffer) {
      slot.heard = Date.now();
      if (!slot.source) {
        slot.gain ??= ctx.createGain();
        slot.gain.connect(this.music);
        slot.gain.gain.cancelScheduledValues(t);
        slot.gain.gain.setValueAtTime(0, t);
        const source = ctx.createBufferSource();
        source.buffer = slot.buffer;
        source.loop = true;
        const loop = loopPoints(MUSIC_TRACKS[place], slot.buffer.duration);
        source.loopStart = loop.start;
        source.loopEnd = loop.end;
        source.connect(slot.gain);
        source.start(t + 0.02);
        slot.source = source;
      } else if (!slot.stopAt) return;
      slot.stopAt = 0;
      slot.gain!.gain.setTargetAtTime(TRACK_LEVEL, t, 0.6);
    } else if (!on && slot.source && !slot.stopAt) {
      slot.gain!.gain.setTargetAtTime(0, t, 0.4);
      slot.stopAt = t + 2.5;
    }
  }
  /** Stops faded tracks and releases decoded buffers not heard for a while. */
  private tickTracks(now: number) {
    for (const place of MUSIC_PLACES) {
      const slot = this.tracks[place];
      if (slot.source && slot.stopAt && now >= slot.stopAt) {
        try {
          slot.source.stop();
        } catch {}
        slot.source.disconnect();
        slot.gain?.disconnect();
        slot.source = null;
        slot.stopAt = 0;
      }
      if (
        !slot.source &&
        slot.status === 'ready' &&
        Date.now() - slot.heard > TRACK_RELEASE_MS
      )
        this.tracks[place] = emptySlot();
    }
  }

  /** Lookahead scheduler for the music box and ambient chirps. */
  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    this.tickTracks(ctx.currentTime);
    if (this.noir?.busy) this.noir.schedule(ctx.currentTime, ctx.currentTime + 0.6);
    // No notes (and no oscillators) while the box is not heard: music off,
    // a location track playing, or a game table without 게임 중 배경음.
    if (!this.boxOn) {
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
    g.connect(this.box!);
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
    o.connect(g).connect(this.box!);
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
    o.connect(g).connect(this.ui!);
    o.start(t);
    o.stop(t + 0.06);
  }
  /**
   * A short cue on the shared engine: world sounds on the sfx bus, UI cues
   * (invites, turns, results; `bus: 'ui'`) on the UI bus. `peak` is before
   * the channel and master volume. Returns false when audio is not running yet.
   */
  cue(
    notes: readonly number[],
    step: number,
    type: OscillatorType,
    peak = 0.09,
    bus: 'sfx' | 'ui' = 'sfx',
  ) {
    this.ensure();
    const ctx = this.ctx;
    const out = bus === 'ui' ? this.ui : this.sfx;
    if (!ctx || !out) return false;
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
      o.connect(g).connect(out);
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
  /**
   * 허풍 카드 sounds (all synthesized, no files): `bell` the "거짓말!" bell
   * (two sines, 1,320 / 1,980 Hz), `pop` the toy cork gun (a 20 ms noise burst
   * and a 420 → 90 Hz sweep, then paper), `click` a dry trigger click,
   * `heart` one heartbeat (two low thumps), `ratchet` the cylinder turning.
   */
  tavern(kind: 'bell' | 'pop' | 'click' | 'heart' | 'ratchet') {
    if (!getSettings().sound) return;
    this.ensure();
    const ctx = this.ctx,
      out = this.sfx;
    if (!ctx || !out || ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const tone = (f: number, at: number, peak: number, decay: number, type: OscillatorType = 'sine', to?: number) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, at);
      if (to) o.frequency.exponentialRampToValueAtTime(to, at + decay * 0.8);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(peak, at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0005, at + decay);
      o.connect(g).connect(out);
      o.start(at);
      o.stop(at + decay + 0.05);
    };
    const noise = (at: number, length: number, peak: number, type: BiquadFilterType, f: number) => {
      if (!this.noise) return;
      const source = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter(),
        g = ctx.createGain();
      source.buffer = this.noise;
      filter.type = type;
      filter.frequency.value = f;
      g.gain.setValueAtTime(peak, at);
      g.gain.exponentialRampToValueAtTime(0.0005, at + length);
      source.connect(filter).connect(g).connect(out);
      source.start(at, 0.3, length + 0.02);
    };
    if (kind === 'bell') {
      tone(1320, t0, 0.07, 0.6);
      tone(1980, t0, 0.035, 0.45);
    } else if (kind === 'pop') {
      noise(t0, 0.02, 0.25, 'highpass', 900);
      tone(420, t0, 0.2, 0.14, 'triangle', 90);
      noise(t0 + 0.08, 0.35, 0.05, 'bandpass', 3200);
    } else if (kind === 'click') {
      noise(t0, 0.03, 0.14, 'highpass', 2400);
      tone(1800, t0, 0.03, 0.04, 'square');
    } else if (kind === 'heart') {
      tone(60, t0, 0.22, 0.16);
      tone(55, t0 + 0.2, 0.15, 0.14);
    } else
      for (let i = 0; i < 6; i++) {
        noise(t0 + i * 0.05, 0.025, 0.08, 'highpass', 3000);
        tone(900 - i * 40, t0 + i * 0.05, 0.02, 0.03, 'square');
      }
  }
  /** Recorded effects (lounge-sfx-files.ts): decoded buffers, or 'missing'. */
  private samples = new Map<SfxId, AudioBuffer | 'loading' | 'missing'>();
  /**
   * Plays a recorded effect on the sfx channel. Until it has loaded (the first
   * call starts the download), or when no file decodes (e.g. no Vorbis and no
   * AAC), `fallback` plays the synthesized cue instead.
   */
  sample(id: SfxId, fallback?: () => void, level = 1) {
    if (!getSettings().sound) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx || !this.sfx || ctx.state !== 'running') return;
    const state = this.samples.get(id);
    if (state instanceof AudioBuffer) {
      const source = ctx.createBufferSource(),
        g = ctx.createGain();
      source.buffer = state;
      g.gain.value = SFX_FILES[id].gain * level;
      source.connect(g).connect(this.sfx);
      source.start();
      return;
    }
    fallback?.();
    if (state) return;
    this.samples.set(id, 'loading');
    const probe = typeof Audio === 'function' ? new Audio() : null;
    const urls = trackCandidates({ files: SFX_FILES[id].files }, (mime) =>
      probe ? probe.canPlayType(mime) : 'maybe',
    );
    void (async () => {
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
          this.samples.set(id, buffer);
          return;
        } catch {}
      }
      this.samples.set(id, 'missing');
    })();
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
