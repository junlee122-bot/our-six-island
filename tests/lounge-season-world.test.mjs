// I2-world D1 / D3: the season palette shared by the hub and every district.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SNOW_GROUND, SeasonPalette, mottleAt, seasonMix } from '../app/lounge-season-world.ts';
import { SEASON_TINT, ambienceOf } from '../app/lounge-life-ui.ts';
import { REGIONS } from '../app/lounge-areas.ts';

const DISTRICTS = ['farm', 'market', 'harbor', 'ranch', 'hillside', 'foothill'];
/** How green a colour reads: green above the larger of red and blue (sRGB 0..1). */
const greenness = (c) => {
  const s = c.clone().convertLinearToSRGB();
  return s.g - Math.max(s.r, s.b);
};

test('winter grass in every district no longer reads green (겨울인데 풀이 초록)', () => {
  for (const weather of ['sunny', 'cloudy', 'snow']) {
    for (const id of DISTRICTS) {
      const look = REGIONS[id].look;
      const palette = new SeasonPalette();
      const ground = palette.add(new THREE.MeshStandardMaterial({ color: look.ground }), 'grass');
      const far = palette.add(new THREE.MeshStandardMaterial({ color: look.groundFar }), 'grassFar');
      palette.apply('winter', weather);
      assert.ok(greenness(ground.color) < 0.06, `${id} ${weather}: ${ground.color.getHexString()}`);
      assert.ok(greenness(far.color) < 0.07, `${id} far ${weather}: ${far.color.getHexString()}`);
      // Snow lies almost white.
      if (weather === 'snow') assert.ok(ground.color.clone().convertLinearToSRGB().r > 0.8, id);
    }
  }
  assert.ok(seasonMix('winter', 'cloudy').grass > seasonMix('autumn', 'sunny').grass);
  assert.equal(SNOW_GROUND.length, 7);
});

test('summer keeps the meadow green and paving only takes snow in winter', () => {
  const palette = new SeasonPalette();
  const ground = palette.add(new THREE.MeshStandardMaterial({ color: REGIONS.market.look.ground }), 'grass');
  const road = palette.add(new THREE.MeshStandardMaterial({ color: '#9f8664' }), 'paving');
  palette.apply('summer', 'sunny');
  assert.ok(greenness(ground.color) > 0.08);
  assert.equal(road.color.getHexString(), '9f8664');
  palette.apply('winter', 'snow');
  assert.notEqual(road.color.getHexString(), '9f8664');
  // A material added later takes the current season at once.
  const late = palette.add(new THREE.MeshStandardMaterial({ color: REGIONS.farm.look.ground }), 'grass');
  assert.ok(greenness(late.color) < 0.06);
  // Same season and weather again: nothing to redo.
  assert.equal(palette.apply('winter', 'snow'), false);
});

test('ground mottling stays subtle and deterministic', () => {
  let lo = 9,
    hi = 0;
  for (let x = -40; x <= 40; x += 0.7)
    for (let z = -40; z <= 40; z += 0.9) {
      const m = mottleAt(x, z);
      lo = Math.min(lo, m.light);
      hi = Math.max(hi, m.light);
      assert.ok(Math.abs(m.warm) <= 0.04);
    }
  assert.ok(lo >= 0.9 && hi <= 1.05 && hi - lo > 0.05, `${lo}..${hi}`);
  assert.deepEqual(mottleAt(3.3, -7.1), mottleAt(3.3, -7.1));
});

test('weather particles per season and weather', () => {
  assert.equal(ambienceOf('winter', 'snow'), 'snow');
  assert.equal(ambienceOf('summer', 'storm'), 'rain');
  assert.equal(ambienceOf('autumn', 'sunny'), 'leaves');
  assert.equal(ambienceOf('spring', 'cloudy'), 'petals');
  assert.equal(ambienceOf('summer', 'sunny'), null);
  for (const s of ['spring', 'summer', 'autumn', 'winter']) assert.match(SEASON_TINT[s].particle, /^#[0-9a-f]{6}$/);
});
