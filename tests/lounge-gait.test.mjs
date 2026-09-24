import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gaitFrame,
  gaitCycle,
  rigPoseIndex,
  RIG_POSES,
  GAIT_CYCLES_PER_PHASE,
  legAngles,
  solveGait,
  SOLE_TILT,
} from '../app/lounge-gait.ts';
import { RUN_SPEED_MULTIPLIER } from '../app/lounge-locomotion.ts';

test('walk and run cycle through all poses with safe clocks and static reduced motion', () => {
  for (const motion of ['walk', 'run']) {
    assert.equal(
      new Set(Array.from({ length: 100 }, (_, i) => gaitFrame(motion, i / 30)))
        .size,
      6,
    );
    assert.equal(gaitFrame(motion, NaN), 0);
    assert.equal(gaitFrame(motion, -1), 0);
    assert.equal(gaitFrame(motion, 123, 6, true), 0);
  }
  assert.equal(gaitFrame('idle', 12), 0);
  assert.notEqual(gaitFrame('walk', 0.12), gaitFrame('run', 0.12));
});

test('hand-drawn frames and rig poses share one distance-driven cycle', () => {
  for (const motion of ['walk', 'run']) {
    for (let i = 0; i < 400; i++) {
      const phase = i * 0.037;
      const u = gaitCycle(motion, phase);
      assert.ok(u >= 0 && u < 1);
      // Both renderers derive their index from the same cycle position.
      assert.equal(gaitFrame(motion, phase), Math.floor(u * 6) % 6);
      assert.equal(rigPoseIndex(motion, phase), Math.floor(u * RIG_POSES) % RIG_POSES);
    }
    assert.equal(
      new Set(Array.from({ length: 200 }, (_, i) => rigPoseIndex(motion, i / 50))).size,
      RIG_POSES,
    );
    // One full cycle per 1 / rate phase units (phase = distance / walk speed).
    const period = 1 / GAIT_CYCLES_PER_PHASE[motion];
    assert.ok(Math.abs(gaitCycle(motion, 0.3) - gaitCycle(motion, 0.3 + period)) < 1e-9);
  }
  assert.equal(rigPoseIndex('idle', 3), -1);
  assert.equal(rigPoseIndex('walk', 3, true), -1);
  // Cadence in real time: running covers 1.65x the distance per second and
  // steps faster, but not absurdly (2–6 steps per second).
  const steps = (motion) =>
    2 * GAIT_CYCLES_PER_PHASE[motion] * (motion === 'run' ? RUN_SPEED_MULTIPLIER : 1);
  assert.ok(steps('walk') >= 2 && steps('walk') <= 3.5);
  assert.ok(steps('run') > steps('walk') && steps('run') <= 6);
});

const geometry = (hem = false) => ({
  height: 450,
  hem,
  legs: [
    { hip: [160, 330], knee: hem ? null : [160, 380], foot: [160, 450], footHalf: 18 },
    { hip: [240, 330], knee: hem ? null : [240, 380], foot: [240, 450], footHalf: 18 },
  ],
});
const rotate = ([x, y], [cx, cy], a) => [
  cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a),
  cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a),
];

test('legs alternate, fold the knee in swing and stay in the style ranges', () => {
  for (const motion of ['walk', 'run']) {
    for (let i = 0; i < 64; i++) {
      const u = i / 64;
      const a = legAngles(motion, u),
        b = legAngles(motion, u + 0.5);
      const deg = (r) => (r * 180) / Math.PI;
      assert.ok(Math.abs(deg(a.thigh)) <= 25 + 1e-9);
      assert.ok(a.knee >= 0 && deg(a.knee) <= 80);
      // Never both feet in swing at once while walking.
      if (motion === 'walk') assert.ok(!(a.swing > 0 && b.swing > 0));
    }
    // Heel strike: leg 0 forward, leg 1 back.
    const s = solveGait(motion, 0, geometry());
    assert.ok(s.legs[0].thigh < 0 && s.legs[1].thigh > 0);
    // Arms counter-swing against the same-side leg.
    assert.ok(s.arms[0] > 0 && s.arms[1] < 0);
    assert.ok(Math.abs(legAngles(motion, 0.75).knee) > Math.abs(legAngles(motion, 0.25).knee));
  }
});

test('rest pose is the untouched idle art', () => {
  for (const motion of ['walk', 'run'])
    for (const hem of [false, true]) {
      const s = solveGait(motion, 0.37, geometry(hem), 0);
      assert.equal(s.drop, 0);
      assert.equal(s.lean, 0);
      for (const leg of s.legs) {
        assert.equal(leg.thigh + 0, 0);
        assert.equal(leg.lift, 0);
      }
    }
});

test('soles stay grounded: no sinking, a planted foot while walking, flight while running', () => {
  for (const hem of [false, true]) {
    const g = geometry(hem);
    for (const motion of ['walk', 'run']) {
      let airborne = 0;
      const drops = [];
      for (let i = 0; i < 96; i++) {
        const u = i / 96;
        const s = solveGait(motion, u, g);
        const soles = s.legs.map(
          (leg, k) => leg.foot[1] + Math.abs(Math.sin(leg.shin)) * g.legs[k].footHalf * SOLE_TILT + s.drop,
        );
        assert.ok(Math.max(...soles) <= 450 + 1e-6, `${motion} ${u} sinks`);
        if (Math.max(...soles) < 450 - 1) airborne++;
        drops.push(s.drop);
      }
      if (motion === 'walk') assert.equal(airborne, 0);
      else assert.ok(airborne > 0 && airborne < 56, `run airborne ${airborne}/96`);
      if (motion === 'walk' && !hem) {
        // Two pelvis bobs per cycle: lowest at each double support (legs
        // spread, u = 0 and 0.5), highest while passing (u ≈ 0.25, 0.75).
        const at = (u) => drops[Math.round(u * 96) % 96];
        assert.ok(at(0) > at(0.25) + 2 && at(0.5) > at(0.75) + 2);
        assert.ok(Math.abs(at(0) - at(0.5)) < 0.5, 'both steps bob alike');
      }
    }
  }
});

test('the planted foot sweeps backward through stance (no forward slide)', () => {
  const g = geometry();
  for (const motion of ['walk', 'run']) {
    let last = Infinity;
    const stance = motion === 'walk' ? 0.5 : 0.4;
    for (let i = 0; i <= 20; i++) {
      const u = (i / 20) * stance * 0.999;
      const x = solveGait(motion, u, g).legs[0].foot[0];
      // Heel-off may roll the shoe forward slightly (under 1% of the height).
      assert.ok(x < last + 0.01 * g.height, `${motion} foot slides forward at ${u}`);
      last = x;
    }
    // Forward kinematics agree with the renderer's transform order.
    const s = solveGait(motion, 0.1, g);
    const knee = rotate(g.legs[0].knee, g.legs[0].hip, s.legs[0].thigh);
    const foot = rotate(
      [knee[0] + g.legs[0].foot[0] - g.legs[0].knee[0], knee[1] + g.legs[0].foot[1] - g.legs[0].knee[1]],
      knee,
      s.legs[0].shin,
    );
    assert.ok(Math.hypot(foot[0] - s.legs[0].foot[0], foot[1] - s.legs[0].foot[1]) < 1e-6);
  }
  // Running leans forward (clockwise canvas rotation = toward +x).
  assert.ok(solveGait('run', 0.2, g).lean > solveGait('walk', 0.2, g).lean);
});
