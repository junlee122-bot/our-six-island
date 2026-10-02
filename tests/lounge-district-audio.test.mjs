import test from 'node:test';
import assert from 'node:assert/strict';
import { barEvents, mulberry32, newScoreState, planCycle, stepSeconds } from '../app/lounge-music-score.ts';
import { HARBOR, HILLSIDE, MARKET, harborScale, marketScale } from '../app/lounge-music-districts.ts';
import { PIECES } from '../app/lounge-music-pieces.ts';
import { AREA_SOUND, MUSIC_PLACES, MUSIC_TRACKS, areaSound, musicMix } from '../app/lounge-music-tracks.ts';
import { DISTRICT_AREAS } from '../app/lounge-areas.ts';
import { VENUES } from '../app/lounge-venues.ts';
import { SHOP_AREAS, SHOP_INTERIORS } from '../app/lounge-shop-interiors.ts';
import { STEP_SOUNDS, SURFACES, areaSurface } from '../app/lounge-footsteps.ts';
import { HARBOR_PIER, HARBOR_LIGHTHOUSE } from '../app/lounge-harbor-layout.ts';

const DISTRICT_PIECES = [MARKET, HARBOR, HILLSIDE];
const play = (spec, seed, { cycles = 2, night = false } = {}) => {
  const rng = mulberry32(seed);
  const out = [];
  for (let c = 0; c < cycles; c++) {
    const state = { ...newScoreState(), night };
    for (const plan of planCycle(spec, c, rng)) out.push({ plan, events: barEvents(spec, plan, state, rng) });
  }
  return out;
};

test('every music slot has a piece and a track entry; every built district has its own sound', () => {
  for (const place of MUSIC_PLACES) {
    assert.ok(PIECES[place], place);
    assert.equal(PIECES[place].id, place);
    assert.ok(Array.isArray(MUSIC_TRACKS[place].files), place);
  }
  for (const area of DISTRICT_AREAS) {
    const sound = areaSound(area);
    assert.ok(sound, area);
    // 우리 농장 borrows the ranch's pastoral piece until it has a track of its own.
    assert.equal(sound.music, area === 'farm' ? 'ranch' : area);
    assert.ok(!['hall', 'casino', 'tavern'].includes(sound.music), 'districts never reuse a room piece');
  }
  assert.equal(areaSound('village'), null);
  assert.equal(areaSound(null), null);
  assert.equal(AREA_SOUND.harbor.ambience.day, 'gulls');
  assert.ok(AREA_SOUND.harbor.ambience.waves);
});

test('district shops play their district piece (no restart walking in or out)', () => {
  for (const area of SHOP_AREAS) assert.equal(VENUES[area].music, SHOP_INTERIORS[area].district);
  assert.equal(VENUES.casino.music, 'casino');
  assert.equal(VENUES.lounge.music, 'hall');
});

test('a district place plays its generative piece instead of the hub music box', () => {
  const mix = musicMix({ place: 'harbor', game: false, night: false }, true, () => false);
  assert.deepEqual(mix, { channel: 1, box: 0, track: null, synth: 'harbor' });
  assert.equal(musicMix({ place: null, game: false, night: true }, true, () => false).box, 0.16);
});

test('district pieces: distinct tempo and metre, long cycles, sane events, deterministic', () => {
  const metres = new Set(DISTRICT_PIECES.map((p) => `${p.bpm}/${p.stepsPerBar}`));
  assert.equal(metres.size, 3);
  assert.equal(HARBOR.stepsPerBar / HARBOR.stepsPerBeat, 3, 'the harbor is a waltz');
  for (const spec of DISTRICT_PIECES) {
    assert.ok(spec.nightTempo > 0.8 && spec.nightTempo < 1, spec.id);
    const cycleSeconds = planCycle(spec, 0, mulberry32(1)).length * spec.stepsPerBar * stepSeconds(spec);
    assert.ok(cycleSeconds > 45, `${spec.id} cycle ${cycleSeconds.toFixed(1)} s`);
    for (const night of [false, true])
      for (const { events } of play(spec, 7, { cycles: 3, night }))
        for (const e of events) {
          assert.ok(e.step >= 0 && e.step < spec.stepsPerBar, `${spec.id} ${e.inst} step ${e.step}`);
          assert.ok(e.vel > 0 && e.vel <= 1.2, `${spec.id} ${e.inst} vel ${e.vel}`);
          assert.ok(e.dur > 0 && e.dur <= spec.stepsPerBar * 2, `${spec.id} ${e.inst} dur ${e.dur}`);
          assert.ok(e.midi >= 0 && e.midi <= 96, `${spec.id} ${e.inst} midi ${e.midi}`);
        }
    const a = JSON.stringify(play(spec, 42).map((b) => b.events));
    assert.equal(a, JSON.stringify(play(spec, 42).map((b) => b.events)));
    assert.notEqual(a, JSON.stringify(play(spec, 43).map((b) => b.events)));
  }
});

test('night variants drop the drums and thin out; the hillside never drums', () => {
  const drums = new Set(['kick', 'rim', 'snare', 'brush']);
  for (const spec of DISTRICT_PIECES) {
    const day = play(spec, 3).flatMap((b) => b.events);
    const night = play(spec, 3, { night: true }).flatMap((b) => b.events);
    assert.equal(night.filter((e) => drums.has(e.inst)).length, 0, spec.id);
    assert.ok(night.length < day.length, `${spec.id}: ${night.length} < ${day.length}`);
  }
  assert.equal(play(HILLSIDE, 5).flatMap((b) => b.events).filter((e) => drums.has(e.inst)).length, 0);
  assert.ok(play(MARKET, 5).flatMap((b) => b.events).some((e) => e.inst === 'kick'));
});

test('tunes stay in key: G major market, A dorian harbor', () => {
  for (const [spec, scale, inst] of [[MARKET, marketScale, 'gayageum'], [HARBOR, harborScale, 'reed']]) {
    let inKey = 0,
      total = 0;
    for (const { plan, events } of play(spec, 9, { cycles: 3 }))
      for (const e of events.filter((x) => x.inst === inst && x.dur < 8)) {
        total++;
        if (scale(plan.chord).includes(e.midi % 12)) inKey++;
      }
    assert.ok(total > 40, `${spec.id} ${total}`);
    assert.ok(inKey / total > 0.9, `${spec.id} ${inKey}/${total}`);
  }
});

test('footstep surfaces: paving is stone, the pier is planks, the beach is sand', () => {
  for (const s of SURFACES) assert.ok(STEP_SOUNDS[s].layers.length > 0, s);
  assert.equal(areaSurface('market', { x: 0, z: -6.2 }), 'stone');
  assert.equal(areaSurface('market', { x: -20, z: 18 }), 'grass');
  assert.equal(areaSurface('harbor', { x: HARBOR_PIER.x, z: HARBOR_PIER.z }), 'planks');
  assert.equal(areaSurface('harbor', { x: HARBOR_LIGHTHOUSE.door.x, z: HARBOR_LIGHTHOUSE.door.z }), 'stone');
  assert.equal(areaSurface('harbor', { x: -20, z: -16 }), 'sand');
  assert.equal(areaSurface('hillside', { x: 0, z: 5 }), 'stone');
  assert.equal(areaSurface('hillside', { x: -20, z: 18 }), 'grass');
  assert.equal(areaSurface('mine', { x: 0, z: 0 }), 'gravel');
  assert.equal(areaSurface('village', { x: 0, z: 0 }), 'dirt');
});
