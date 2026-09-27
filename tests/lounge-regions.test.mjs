// 성장 P2: 뒷산, 숲 깊은 곳 and the 광산 (walk world, region registry, mine
// floors and drops, the growth engine's mine / gate / region-node actions).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWalkWorld } from '../app/lounge-walk-world.ts';
import {
  OUTDOOR_AREAS,
  REGIONS,
  VILLAGE_GATE,
  isOutdoorArea,
  nearestExit,
  regionFromNetwork,
  regionToNetwork,
  regionWalk,
} from '../app/lounge-areas.ts';
import { MINE_ARRIVE, MINE_BANDS, MINE_LIFT_AT, floorPick, ladderNeed, mineDrop, mineFloor, veinFloor } from '../app/lounge-mine.ts';
import { GATES, MINE_XP, NODE_SPOTS, REGION_ITEMS, XP } from '../app/lounge-growth-data.ts';
import { GROWTH_REJECT, areaOpen, mineCanGo, nodesFor } from '../app/lounge-growth.ts';
import { ITEM_BY_ID } from '../app/lounge-items.ts';
import { LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView } from '../app/lounge-life.ts';
import { grantBeom, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { AREAS, AREA_DEFAULTS, chatScope } from '../app/lounge-games.ts';
import { MUSEUM_IDS } from '../app/lounge-life-ui.ts';
import { villageCanWalk } from '../app/lounge-village-layout.ts';
import { villageAction } from '../app/lounge-village-actions.ts';

const DAY = 86_400_000;
const kst = (y, m, d, h = 12) => Date.UTC(y, m - 1, d, h - 9);
const T0 = kst(2026, 9, 24);
const uuid = () => crypto.randomUUID();

function world(n = 2, ids = []) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: ids[actor] ?? uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    ledger = grantBeom(ledger, 'wallet-' + m.id, 1000, 't-' + m.id, T0, 'test');
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now = T0) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    validateLedger(s.ledger);
    return r;
  };
  s.fails = (m, action, message, now = T0) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.done = (...ids) => {
    const g = (s.life.growth ??= {});
    for (const id of ids) (g.r ??= {})[id] = { got: 1, mat: {}, by: { 0: 1 }, start: T0 - 2 * DAY, fullAt: T0 - DAY, doneAt: T0 - DAY };
  };
  s.tool = (m, tool, tier) => ((((s.life.growth ??= {}).u ??= {})[m.id] ??= {}).tools ??= {})[tool] = tier;
  s.inv = (m, item) => s.life.ext?.[m.id]?.inv?.[item] ?? 0;
  s.xp = (m, skill) => s.life.growth?.u?.[m.id]?.xp?.[skill] ?? 0;
  s.u = (m) => s.life.growth?.u?.[m.id];
  s.view = (m, now = T0) => lifeView(s.life, m.id, m.actor, now).growth;
  return s;
}

test('walk world: bounds, colliders, sliding and paths around a wall', () => {
  const w = makeWalkWorld({ w: 20, d: 10, margin: 0.5 }, [
    { shape: 'box', x: 0, z: -1, w: 1, d: 8 },
    { shape: 'circle', x: 5, z: 2, r: 1 },
  ]);
  assert.equal(w.canWalk({ x: -5, z: 0 }), true);
  assert.equal(w.canWalk({ x: 0, z: 0 }), false);
  assert.equal(w.canWalk({ x: 5, z: 2.5 }), false);
  assert.equal(w.canWalk({ x: 9.8, z: 0 }), false);
  assert.equal(w.canWalk({ x: NaN, z: 0 }), false);
  // Walking into the wall stops at it; walking diagonally slides along it.
  const stopped = w.step({ x: -3, z: 0 }, 5, 0);
  assert.ok(stopped.x < -0.8 && stopped.x > -1.2, `stopped at ${stopped.x}`);
  const slid = w.step({ x: -1.3, z: 0 }, 0.5, 1);
  assert.ok(slid.z > 0.8 && slid.x <= -0.8);
  // A path goes around the wall's open end (z > 3).
  const path = w.path({ x: -4, z: 0 }, { x: 4, z: 0 });
  assert.ok(path.length >= 2);
  assert.ok(path.some((p) => p.z > 2.8));
  let at = { x: -4, z: 0 };
  for (const p of path) {
    for (let i = 1; i <= 20; i++) assert.ok(w.canWalk({ x: at.x + ((p.x - at.x) * i) / 20, z: at.z + ((p.z - at.z) * i) / 20 }));
    at = p;
  }
  assert.ok(Math.hypot(at.x - 4, at.z) < 0.01);
  assert.equal(w.canWalk(w.near({ x: 0, z: 0 })), true);
});

test('regions: registry, arrivals, exits and every node reachable', () => {
  assert.deepEqual([...OUTDOOR_AREAS], ['hill', 'woods', 'mine']);
  assert.ok(isOutdoorArea('mine') && !isOutdoorArea('village') && !isOutdoorArea('tavern'));
  for (const area of ['hill', 'woods']) {
    for (const logCleared of [false, true]) {
      const w = regionWalk(area, { logCleared });
      const start = REGIONS[area].arrive[area === 'hill' ? 'village' : 'hill'];
      assert.ok(w.canWalk(start), `${area} arrival walkable`);
      for (const e of REGIONS[area].exits) {
        assert.ok(w.canWalk(e.stand), `${area} ${e.id} stand walkable`);
        const end = w.path(start, e.stand).at(-1);
        assert.ok(end && Math.hypot(end.x - e.stand.x, end.z - e.stand.z) < 0.05, `${area} → ${e.id}`);
        const found = nearestExit(area, e.stand);
        assert.equal(found?.id, e.id);
      }
      for (const n of NODE_SPOTS.filter((x) => x.area === area)) {
        const end = w.path(start, n).at(-1);
        assert.ok(end && Math.hypot(end.x - n.x, end.z - n.z) <= 1.3, `${area} node ${n.id} reachable`);
      }
    }
    for (const [from, p] of Object.entries(REGIONS[area].arrive)) {
      const net = regionToNetwork(area, p);
      assert.ok(net.x >= 0 && net.x <= 100 && net.y >= 0 && net.y <= 100, from);
      const back = regionFromNetwork(area, net);
      assert.ok(Math.hypot(back.x - p.x, back.z - p.z) < 0.02);
    }
  }
  // The hill's log blocks the way west until it is cleared.
  const closed = regionWalk('hill', { logCleared: false }),
    open = regionWalk('hill', { logCleared: true });
  assert.equal(closed.canWalk({ x: -26.6, z: -2 }), false);
  assert.equal(open.canWalk({ x: -26.6, z: -2 }), true);
  // The server knows the regions; outdoors shares the village chat.
  for (const a of ['hill', 'woods', 'mine']) {
    assert.ok(AREAS.includes(a));
    assert.equal(chatScope(a), 'village');
    const p = regionFromNetwork(a, AREA_DEFAULTS[a]);
    const arrive = a === 'woods' ? REGIONS.woods.arrive.hill : a === 'hill' ? REGIONS.hill.arrive.village : MINE_ARRIVE;
    assert.ok(Math.hypot(p.x - arrive.x, p.z - arrive.z) < 0.1, `${a} default`);
  }
});

test('village gate: at the north edge, walkable stand, E action once growth exists', () => {
  assert.ok(villageCanWalk(VILLAGE_GATE.stand));
  const s = world(1);
  const [a] = s.members;
  const at = (now = T0) => villageAction(VILLAGE_GATE.stand, a.actor, { life: lifeView(s.life, a.id, a.actor, now), now });
  const act = at();
  assert.equal(act?.target.type === 'spot' && act.target.spot.kind, 'gate');
  assert.match(act.label, /산길 정비/);
  s.done('forge', 'trail');
  assert.equal(at().label, '뒷산 오르기');
});

test('mine floors: deterministic templates, rocks, ladders, bands and veins', () => {
  const day = kstDay(T0);
  assert.deepEqual(mineFloor(day, 3), mineFloor(day, 3));
  const templates = new Set();
  let reachBad = 0;
  for (let d = day; d < day + 30; d++)
    for (let f = 1; f <= 20; f++) {
      const fl = mineFloor(d, f, true);
      templates.add(fl.template);
      assert.ok(fl.rocks.length >= 10 && fl.rocks.length <= 14);
      assert.ok(fl.ladderNeed >= 4 && fl.ladderNeed <= 6 && fl.ladderNeed <= fl.rocks.length);
      const w = regionWalk('mine', { day: d, floor: f, lift: true });
      for (const r of [...fl.rocks, fl.ladder, MINE_LIFT_AT]) {
        const end = w.path(MINE_ARRIVE, r).at(-1);
        if (!end || Math.hypot(end.x - r.x, end.z - r.z) > 1.2) reachBad++;
      }
      assert.equal(fl.rocks.filter((r) => r.vein).length, fl.vein ? 3 : 0);
    }
  assert.equal(reachBad, 0);
  assert.ok(templates.size >= 5);
  assert.ok(veinFloor(day, false) >= 1 && veinFloor(day, false) <= 10);
  assert.deepEqual([1, 5, 6, 10, 11, 15, 16, 20].map(floorPick), [1, 1, 2, 2, 3, 3, 4, 4]);
  for (const b of MINE_BANDS) assert.ok(Math.abs(b.stone + b.copper + b.iron + b.gold + b.gem - 100) < 1e-9);
  assert.ok(ladderNeed(day, 1) >= 4);
  // Drop tables: bands 1–5 never give iron/gold; 16–20 no copper; fossils ~2%.
  const count = (floor, n = 4000) => {
    const c = { stone: 0, copper: 0, iron: 0, gold: 0, gem: 0, fossil: 0 };
    for (let i = 0; i < n; i++) {
      const d = mineDrop(`k:${floor}:${i}`, floor, false);
      c[d.item]++;
      if (d.fossil) c.fossil++;
    }
    return c;
  };
  const top = count(3),
    deep = count(18);
  assert.equal(top.iron + top.gold, 0);
  assert.ok(top.copper > 900 && top.copper < 1350, `copper ${top.copper}`);
  assert.equal(deep.copper, 0);
  assert.ok(deep.gold > 900, `gold ${deep.gold}`);
  assert.ok(top.fossil > 40 && top.fossil < 130, `fossils ${top.fossil}`);
  const vein = mineDrop('v', 7, true);
  assert.ok(vein.item !== 'stone' && (vein.item === 'gem' || vein.n >= 3));
  // Fossils are museum pieces with icons in the item catalog.
  for (const f of REGION_ITEMS.filter((x) => x.id.startsWith('fossil-'))) {
    assert.equal(ITEM_BY_ID[f.id].museum, true);
    assert.ok(MUSEUM_IDS.includes(f.id));
  }
  assert.ok(MUSEUM_IDS.includes('songi') && MUSEUM_IDS.includes('yeongji') && !MUSEUM_IDS.includes('hardwood'));
});

test('mine: closed until 산길 정비, floor 1, ladders, pickaxe and lift gates', () => {
  const s = world();
  const [a, b] = s.members;
  s.fails(a, { kind: 'mineGo', floor: 1 }, GROWTH_REJECT.mineClosed);
  assert.equal(areaOpen(s.life, 'hill', T0), false);
  s.done('forge', 'trail');
  assert.equal(areaOpen(s.life, 'hill', T0), true);
  assert.equal(areaOpen(s.life, 'woods', T0), false);
  s.act(a, { kind: 'mineGo', floor: 1 });
  assert.deepEqual(s.u(a).mine, { at: 1, deep: 1 });
  assert.equal(s.xp(a, 'mine'), MINE_XP.newFloor);
  // The next floor needs today's ladder: break ladderNeed rocks first.
  s.fails(a, { kind: 'mineGo', floor: 2 }, GROWTH_REJECT.mineLadder);
  s.fails(a, { kind: 'mineGo', floor: 3 }, GROWTH_REJECT.mineFloor);
  const day = kstDay(T0);
  const f1 = mineFloor(day, 1);
  s.fails(a, { kind: 'mineRock', floor: 2, rock: f1.rocks[0].i }, GROWTH_REJECT.mineHere);
  s.fails(a, { kind: 'mineRock', floor: 1, rock: 999 }, GROWTH_REJECT.mineRock);
  s.fails(b, { kind: 'mineRock', floor: 1, rock: f1.rocks[0].i }, GROWTH_REJECT.mineHere);
  for (const r of f1.rocks.slice(0, f1.ladderNeed)) {
    const before = s.xp(a, 'mine');
    s.act(a, { kind: 'mineRock', floor: 1, rock: r.i });
    assert.ok(s.xp(a, 'mine') - before >= XP.rock);
  }
  s.fails(a, { kind: 'mineRock', floor: 1, rock: f1.rocks[0].i }, GROWTH_REJECT.nodeTaken);
  const inv = ['stone', 'copper', 'gem'].reduce((n, id) => n + s.inv(a, id), 0);
  assert.ok(inv >= f1.ladderNeed);
  assert.equal(s.view(a).regions.mine.ladder, true);
  assert.deepEqual(s.view(a).regions.mine.broken[1].length, f1.ladderNeed);
  s.act(a, { kind: 'mineGo', floor: 2 });
  assert.equal(s.u(a).mine.deep, 2);
  // Friends see where I am today.
  assert.equal(s.view(b).regions.mine.friends[a.actor], 2);
  // Floor 6 needs the iron-age pickaxe (tier 2), 11+ the lift.
  s.u(a).mine = { at: 5, deep: 5 };
  s.u(a).mrock = mineFloor(day, 5).rocks.slice(0, 6).map((r) => `5:${r.i}`);
  s.fails(a, { kind: 'mineGo', floor: 6 }, GROWTH_REJECT.minePick);
  s.tool(a, 'pickaxe', 2);
  s.act(a, { kind: 'mineGo', floor: 6 });
  s.u(a).mine = { at: 10, deep: 10 };
  s.tool(a, 'pickaxe', 4);
  s.fails(a, { kind: 'mineGo', floor: 11 }, GROWTH_REJECT.mineLift);
  s.fails(a, { kind: 'mineGo', floor: 21 }, GROWTH_REJECT.mineFloor);
  // With the lift: every 5th floor I reached, from anywhere.
  s.done('forge', 'trail', 'lift');
  s.act(a, { kind: 'mineGo', floor: 0 });
  s.act(a, { kind: 'mineGo', floor: 10 });
  s.act(a, { kind: 'mineGo', floor: 5 });
  s.fails(a, { kind: 'mineGo', floor: 15 }, GROWTH_REJECT.mineFloor);
  assert.equal(mineCanGo(s.life, a.id, 1, T0), null);
  // Rocks broken today reset tomorrow; the floor I am on stays.
  s.act(a, { kind: 'mineGo', floor: 1 }, T0 + DAY);
  assert.deepEqual(s.u(a).mrock ?? [], []);
});

test('mine rocks: ore amounts follow the band, fossils go to the bag with news', () => {
  // This seed finds fossils before the final news window, so the test also
  // exercises their news ageing out while the inventory remains intact.
  const s = world(1, ['00000000-0000-4000-8000-000000000018']);
  const [a] = s.members;
  s.done('forge', 'trail', 'lift');
  s.tool(a, 'pickaxe', 4);
  const gained = { stone: 0, copper: 0, iron: 0, gold: 0, gem: 0 };
  let fossils = 0;
  for (let d = 0; d < 30; d++) {
    const now = T0 + d * DAY;
    for (const floor of [16, 17]) {
      s.u(a).mine = { at: floor, deep: 20 };
      const before = { ...(s.life.ext?.[a.id]?.inv ?? {}) };
      for (const r of mineFloor(kstDay(now), floor, true).rocks) {
        const beforeFossils = s.inv(a, 'fossil-tooth');
        s.act(a, { kind: 'mineRock', floor, rock: r.i }, now);
        // News intentionally keeps only the recent days. Check the event at
        // discovery, not after the entire 30-day simulation has aged it out.
        if (s.inv(a, 'fossil-tooth') > beforeFossils)
          assert.ok(
            s.life.news?.find((entry) => entry.day === kstDay(now))?.lines.some((n) => n.text.includes('공룡 이빨 화석')),
            `fossil news missing on day ${d}, floor ${floor}, rock ${r.i}`,
          );
      }
      for (const k of Object.keys(gained)) gained[k] += s.inv(a, k) - (before[k] ?? 0);
      fossils += s.inv(a, 'fossil-tooth') - (before['fossil-tooth'] ?? 0);
    }
  }
  assert.equal(gained.copper, 0);
  assert.ok(gained.gold > gained.iron, JSON.stringify(gained));
  assert.ok(gained.gold > 0 && gained.gem > 0);
  assert.ok(fossils >= 1, 'a dinosaur tooth in ~700 rocks');
});

test('숲 깊은 곳: the fallen log needs axe 2 once for everyone; stumps need axe 3', () => {
  const s = world();
  const [a, b] = s.members;
  s.fails(a, { kind: 'clearGate', gate: 'woods' }, GROWTH_REJECT.area);
  s.done('forge', 'trail');
  s.fails(a, { kind: 'clearGate', gate: 'nope' }, GROWTH_REJECT.gate);
  s.fails(a, { kind: 'clearGate', gate: 'woods' }, GROWTH_REJECT.gateTool);
  s.tool(a, 'axe', GATES.woods.tier);
  const xp = s.xp(a, 'forage');
  s.act(a, { kind: 'clearGate', gate: 'woods' });
  assert.ok(s.xp(a, 'forage') > xp);
  assert.equal(s.life.growth.c.woods.actor, a.actor);
  s.fails(b, { kind: 'clearGate', gate: 'woods' }, GROWTH_REJECT.gateDone);
  assert.equal(areaOpen(s.life, 'woods', T0), true);
  assert.ok(s.life.news.flatMap((d) => d.lines).some((n) => n.text.includes('쓰러진 통나무')));
  // Woods nodes: stumps (axe 3) give 단단한 나무; mushroom logs give 송이/영지.
  const day = kstDay(T0);
  const nodes = nodesFor(s.life, b.id, day, 'woods');
  assert.deepEqual(
    nodes.map((n) => n.kind).sort(),
    ['shroom', 'shroom', 'stump', 'stump', 'tree', 'tree', 'tree'],
  );
  const stump = nodes.find((n) => n.kind === 'stump');
  s.fails(b, { kind: 'chop', node: stump.id }, GROWTH_REJECT.nodeTool);
  s.tool(b, 'axe', 3);
  s.act(b, { kind: 'chop', node: stump.id });
  assert.ok(s.inv(b, 'hardwood') >= 2);
  const shroom = nodes.find((n) => n.kind === 'shroom');
  s.act(b, { kind: 'chop', node: shroom.id });
  assert.ok(s.inv(b, 'songi') + s.inv(b, 'yeongji') >= 1);
  // Hill nodes need 산길 정비 and appear in the view.
  const view = s.view(b);
  assert.equal(view.regions.hill.nodes.length, 12);
  assert.equal(view.regions.woods.nodes.length, 7);
  assert.ok(view.regions.woods.nodes.find((n) => n.id === stump.id).taken);
  const tree = view.regions.hill.nodes.find((n) => n.kind === 'tree');
  const wood = s.inv(b, 'wood');
  s.act(b, { kind: 'chop', node: tree.id });
  assert.ok(s.inv(b, 'wood') >= wood + 5);
  // A node from another day's list or a region still closed is refused.
  const s2 = world(1);
  s2.fails(s2.members[0], { kind: 'chop', node: tree.id }, GROWTH_REJECT.area);
});
