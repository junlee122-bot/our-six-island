import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CASINO,
  HALL,
  barEvents,
  casinoScale,
  janggu,
  mulberry32,
  nearest,
  newScoreState,
  planCycle,
  stepSeconds,
  stingNotes,
  tensionBar,
  tensionLevel,
  voicing,
} from '../app/lounge-music-score.ts';

const play = (spec, seed, cycles = 1) => {
  const rng = mulberry32(seed);
  const out = [];
  for (let c = 0; c < cycles; c++) {
    const state = newScoreState();
    for (const plan of planCycle(spec, c, rng)) out.push({ plan, events: barEvents(spec, plan, state, rng) });
  }
  return out;
};

test('both pieces have at least 32 bars per pass, A · B · A2 · C · T', () => {
  for (const spec of [CASINO, HALL]) {
    for (let c = 0; c < 6; c++) {
      const bars = planCycle(spec, c, mulberry32(c + 1));
      assert.ok(bars.length >= 32, `${spec.id} cycle ${c}: ${bars.length}`);
      assert.deepEqual(new Set(bars.map((b) => b.section)), new Set(['A', 'B', 'A2', 'C', 'T']));
      assert.equal(bars.at(-1).section, 'T');
      assert.equal(bars.at(-1).next, spec.sections.A[0]);
    }
    assert.deepEqual(planCycle(spec, 0, mulberry32(9)).map((b) => b.section).slice(0, 9).join(''), 'AAAAAAAAB');
  }
  assert.equal(stepSeconds(CASINO).toFixed(4), (60 / 104 / 4).toFixed(4));
  assert.equal(stepSeconds(HALL).toFixed(4), (60 / 66 / 3).toFixed(4));
});

test('scores are deterministic per seed and vary between seeds', () => {
  const a = JSON.stringify(play(CASINO, 42).map((b) => b.events));
  assert.equal(a, JSON.stringify(play(CASINO, 42).map((b) => b.events)));
  assert.notEqual(a, JSON.stringify(play(CASINO, 43).map((b) => b.events)));
});

test('every event sits inside its bar with sane pitch, velocity and length', () => {
  for (const spec of [CASINO, HALL])
    for (const { events } of play(spec, 5, 3))
      for (const e of events) {
        assert.ok(e.step >= -0.5 && e.step < spec.stepsPerBar, `${spec.id} ${e.inst} step ${e.step}`);
        assert.ok(e.vel > 0 && e.vel <= 1.2, `${e.inst} vel ${e.vel}`);
        assert.ok(e.dur > 0 && e.dur <= spec.stepsPerBar * 2, `${e.inst} dur ${e.dur}`);
        assert.ok(e.midi >= 0 && e.midi <= 96);
      }
});

test('the casino A section rides the habanera bass (dotted 8th, 16th, 8th)', () => {
  for (const { plan, events } of play(CASINO, 11)) {
    if (plan.section !== 'A') continue;
    const bass = events.filter((e) => e.inst === 'bass').map((e) => e.step);
    assert.deepEqual(bass.slice(0, 3), [0, 3, 4]);
    assert.deepEqual(bass.slice(3, 6), [8, 11, 12]);
  }
});

test('the casino lead stays in D minor (natural / harmonic) plus chromatic passing tones', () => {
  let inKey = 0,
    total = 0;
  for (const { plan, events } of play(CASINO, 3, 4))
    for (const e of events.filter((x) => x.inst === 'lead')) {
      total++;
      if ([...casinoScale(plan.chord), 1].includes(e.midi % 12)) inKey++;
    }
  assert.ok(total > 50);
  assert.ok(inKey / total > 0.85, `${inKey}/${total}`);
  // The harmonic-minor colour appears (C♯ over the dominant).
  assert.deepEqual(casinoScale(CASINO.sections.A[5]), [2, 4, 5, 7, 9, 10, 1]);
});

test("A' answers A: its first six bars repeat the A melody", () => {
  const bars = play(CASINO, 8);
  const lead = (section, bar) =>
    bars
      .find((b) => b.plan.section === section && b.plan.bar === bar)
      .events.filter((e) => e.inst === 'lead')
      .map((e) => [e.step, e.midi]);
  for (let bar = 0; bar < 6; bar++) assert.deepEqual(lead('A2', bar), lead('A', bar));
});

test('the hall keeps a 굿거리 장구 pattern and a 가야금 line with 농현', () => {
  const plan = { section: 'A', bar: 0, of: 8, chord: HALL.sections.A[0], next: HALL.sections.A[1], cycle: 0 };
  const hits = janggu(plan);
  const kung = hits.filter((e) => e.inst === 'kung').map((e) => e.step);
  assert.deepEqual(kung, [0, 3, 6, 9]); // 덩 · 쿵 · 쿵 · 쿵 on the four dotted-quarter beats
  assert.ok(hits.some((e) => e.inst === 'deok' && e.step === 5 + 1 / 3)); // 더러러
  const bars = play(HALL, 4, 2);
  const plucks = bars.flatMap((b) => b.events.filter((e) => e.inst === 'gayageum'));
  assert.ok(plucks.length > 40);
  assert.ok(plucks.some((e) => e.bend === 'vib') && plucks.some((e) => e.bend === 'down'));
  // Melody notes (outside the dominant) keep to D 계면조: D F G A C.
  for (const b of bars)
    if (!b.plan.chord.tones.includes(13) && b.plan.chord.root !== 9)
      for (const e of b.events.filter((x) => x.inst === 'gayageum' && x.dur > 1))
        assert.ok([2, 5, 7, 9, 0].includes(e.midi % 12), `${e.midi}`);
});

test('tension rises then holds, and its heartbeat doubles when high', () => {
  assert.equal(tensionLevel(0), 0.3);
  assert.ok(tensionLevel(3) > tensionLevel(1));
  assert.equal(tensionLevel(50), 1);
  const calm = tensionBar(CASINO, 0.3).filter((e) => e.inst === 'heart');
  const tense = tensionBar(CASINO, 0.9).filter((e) => e.inst === 'heart');
  assert.equal(calm.length, 2);
  assert.equal(tense.length, 4);
  assert.ok(tensionBar(HALL, 0.5).every((e) => e.step < HALL.stepsPerBar));
});

test('stings are short and in D', () => {
  for (const kind of ['allin', 'blackjack', 'bigwin']) {
    const notes = stingNotes(kind);
    assert.ok(notes.length >= 5);
    assert.ok(Math.max(...notes.map((n) => n.at + n.dur)) < 2);
  }
  assert.ok(stingNotes('blackjack').some((n) => n.midi % 12 === 6)); // F♯: D major
});

test('pitch helpers', () => {
  assert.equal(nearest(61, [2], 50, 80), 62);
  assert.equal(nearest(90, [2], 50, 80), 74);
  const v = voicing(CASINO.sections.A[0]);
  assert.ok(v.length === 3 && v.every((m) => m >= 57 && m <= 72));
});
