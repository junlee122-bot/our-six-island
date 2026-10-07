// 우리 농장 손맛 (D4): the world-pop helpers (lounge-world-pops.ts) — what a
// field change becomes, the particles each pop throws, reduced motion and
// the capped queue.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FX_BATCH_MAX,
  POP_MAX,
  farmFxDiff,
  isGoldHarvest,
  makePops,
  particleSpec,
  popLifetime,
  queuePops,
} from '../app/lounge-world-pops.ts';

const NOW = 1_000_000;
const bare = () => ({ crop: null, readyAt: null, wateredAt: null, quality: 0 });

test('a ripe crop gone (or regrowing) is a harvest with its crop and quality', () => {
  const prev = [
    { crop: 'turnip', t: 1, readyAt: NOW - 5, wateredAt: null, quality: 2 },
    { crop: 'berry', t: 1, readyAt: NOW - 5, wateredAt: null, quality: 0 },
    { crop: 'corn', t: 1, readyAt: NOW + 50, wateredAt: null, quality: 0 },
  ];
  const next = [
    { crop: null, t: 1, readyAt: null, wateredAt: null, quality: 0 },
    { crop: 'berry', t: 1, readyAt: NOW + 9_000, wateredAt: null, quality: 0 },
    { crop: null, t: 1, readyAt: null, wateredAt: null, quality: 0 },
  ];
  assert.deepEqual(farmFxDiff(prev, next, NOW), [
    { kind: 'harvest', tile: 0, crop: 'turnip', quality: 2 },
    { kind: 'harvest', tile: 1, crop: 'berry', quality: 0 },
  ]);
});

test('bare soil tilled is dust; a crop wet again is droplets; nothing else pops', () => {
  const prev = [bare(), { crop: 'pea', t: 1, readyAt: null, wateredAt: null, quality: 0 }, { crop: 'pea', t: 1, readyAt: NOW + 9, wateredAt: NOW + 50, quality: 0 }, { ...bare(), locked: true }];
  const next = [
    { ...bare(), t: 1 },
    { crop: 'pea', t: 1, readyAt: NOW + 900, wateredAt: NOW + 5_000, quality: 0 },
    { crop: 'pea', t: 1, readyAt: NOW + 9, wateredAt: NOW + 50, quality: 0 },
    { ...bare(), t: 1 },
    { ...bare(), t: 1 },
  ];
  assert.deepEqual(farmFxDiff(prev, next, NOW), [
    { kind: 'till', tile: 0 },
    { kind: 'water', tile: 1 },
  ]);
});

test('a big batch is capped, harvests first', () => {
  const prev = Array.from({ length: 30 }, (_, i) => (i === 29 ? { crop: 'kale', readyAt: NOW - 1, wateredAt: null, quality: 1 } : bare()));
  const next = Array.from({ length: 30 }, () => ({ ...bare(), t: 1 }));
  const fx = farmFxDiff(prev, next, NOW);
  assert.equal(fx.length, FX_BATCH_MAX);
  assert.equal(fx[0].kind, 'harvest');
});

test('particles: dust and drops always, sparkle only for gold, none with reduced motion; stable per seed', () => {
  assert.equal(particleSpec('till', 1).length, 6);
  assert.equal(particleSpec('water', 1).length, 7);
  assert.equal(particleSpec('harvest', 1).length, 0);
  assert.equal(particleSpec('harvest', 1, { gold: true }).length, 8);
  assert.deepEqual(particleSpec('till', 1, { reduced: true }), []);
  assert.deepEqual(particleSpec('water', 42), particleSpec('water', 42));
  for (const p of particleSpec('till', 7)) assert.ok(p.dy < 0 && Math.abs(p.dx) >= 10 && p.ms > 0, 'dust puffs up and out');
  assert.ok(isGoldHarvest(2) && isGoldHarvest(3) && !isGoldHarvest(1) && !isGoldHarvest(undefined));
});

test('pops: reduced motion keeps only a still harvest; batches stagger; the queue keeps the newest', () => {
  const born = [
    { kind: 'till', x: 10.4, y: 20 },
    { kind: 'harvest', x: 5, y: 6, crop: 'turnip', quality: 2 },
  ];
  const moving = makePops(born, false, 1);
  assert.deepEqual(moving.map((p) => [p.kind, p.delay, p.still]), [['till', 0, false], ['harvest', 70, false]]);
  assert.equal(moving[0].x, 10);
  assert.ok(moving[1].gold && moving[1].parts.length === 8);
  assert.ok(popLifetime(moving[1]) >= 1350 + 70);
  const still = makePops(born, true, 2);
  assert.deepEqual(still.map((p) => [p.kind, p.still, p.gold, p.parts.length]), [['harvest', true, true, 0]]);
  const many = makePops(Array.from({ length: 20 }, () => born[0]), false, 3);
  const q = queuePops(moving, many);
  assert.equal(q.length, POP_MAX);
  assert.equal(q.at(-1), many.at(-1));
});
