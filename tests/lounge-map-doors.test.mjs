import test from 'node:test';
import assert from 'node:assert/strict';
import { ARRIVE_CLEARANCE, DOOR_COOLDOWN_MS, arrivalFacing, arrivalPoint, doorClock, inward, walksInto } from '../app/lounge-map-doors.ts';
import { OUTDOOR_AREAS, REGIONS, VILLAGE_GATE, nearestExit, outdoorReturnPoint, regionToNetwork, regionWalk } from '../app/lounge-areas.ts';
import { AREA_DEFAULTS } from '../app/lounge-games.ts';
import { BUILT_DISTRICTS, DISTRICTS, DISTRICT_IDS } from '../app/lounge-districts.ts';
import { villageCanWalk, villagePath, villageStep } from '../app/lounge-village-layout.ts';
import { villageAction } from '../app/lounge-village-actions.ts';
import { districtCounters, shopDoorOutside } from '../app/lounge-district-counters.ts';
import { SHOP_AREAS } from '../app/lounge-shop-interiors.ts';
import { INTERIOR_AREAS } from '../app/lounge-venues.ts';
import { interiorArrival, interiorCanWalk, interiorPath, nearDoor, INTERIOR_DOOR } from '../app/lounge-interior-layout.ts';

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('arrival geometry: a step in from the stand, past the trigger, facing in', () => {
  const d = { x: 10, z: 0, stand: { x: 8, z: 0 }, reach: 2 };
  assert.deepEqual(inward(d), { x: -1, z: 0 });
  assert.deepEqual(arrivalPoint(d), { x: 8 - 2 - ARRIVE_CLEARANCE, z: 0 });
  assert.equal(arrivalFacing(d), -1);
  assert.equal(arrivalFacing({ ...d, x: 6 }), 1);
  // Walking on into it (outward, near or past the stand) takes it…
  assert.ok(walksInto({ x: 8.3, z: 0 }, { x: 1, z: 0 }, d));
  assert.ok(walksInto({ x: 7.9, z: 0.5 }, { x: 1, z: 0.2 }, d));
  // …walking away, sideways, standing still or arriving does not.
  assert.ok(!walksInto({ x: 8.3, z: 0 }, { x: -1, z: 0 }, d));
  assert.ok(!walksInto({ x: 8.3, z: 0 }, { x: 0, z: 1 }, d));
  assert.ok(!walksInto({ x: 8.3, z: 0 }, { x: 0, z: 0 }, d));
  assert.ok(!walksInto(arrivalPoint(d), { x: 1, z: 0 }, d));
  assert.ok(!walksInto({ x: 8.3, z: 4 }, { x: 1, z: 0 }, d), 'far to the side of the doorway');
});

test('the door clock holds doorways for a moment after arriving', () => {
  let now = 1000;
  const clock = doorClock(() => now);
  assert.equal(clock.ready(), false);
  now += DOOR_COOLDOWN_MS - 1;
  assert.equal(clock.ready(), false);
  now += 1;
  assert.equal(clock.ready(), true);
  clock.arrive();
  assert.equal(clock.ready(), false);
  assert.ok(DOOR_COOLDOWN_MS >= 400 && DOOR_COOLDOWN_MS <= 1200);
});

test('every outdoor map: arrivals stand on open ground, out of every exit trigger, and reach their exit', () => {
  for (const area of OUTDOOR_AREAS) {
    const region = REGIONS[area];
    const w = regionWalk(area, { logCleared: true, day: 3, floor: 1 });
    for (const [from, p] of Object.entries(region.arrive)) {
      assert.ok(w.canWalk(p), `${area} arrive from ${from} is walkable`);
      if (area === 'mine') continue; // the mine's way up is its ladder spot (the cooldown covers it)
      assert.equal(nearestExit(area, p), null, `${area} arrive from ${from} is outside every exit trigger`);
      const exit = region.exits.find((e) => e.to === from) ?? region.exits.find((e) => from === 'village' && e.to === 'village');
      if (!exit) continue;
      assert.ok(Math.abs(dist(p, exit.stand) - (exit.reach + ARRIVE_CLEARANCE)) < 0.02, `${area}: one step in`);
      // From the arrival the exit is a short, clear walk back.
      const route = w.path(p, exit.stand);
      assert.ok(route.length && dist(route.at(-1), exit.stand) < 0.3, `${area}: path back to ${exit.id}`);
      // Pushing on past the stand toward the edge takes it.
      let q = { ...exit.stand };
      const n = inward(exit);
      let took = false;
      for (let i = 0; i < 20 && !took; i++) {
        const next = w.step(q, -n.x * 0.12, -n.z * 0.12);
        took = walksInto(next, { x: -n.x, z: -n.z }, exit);
        q = next;
      }
      assert.ok(took, `${area}: walking into ${exit.id} takes it`);
    }
    for (const e of region.exits) assert.ok(w.canWalk(e.stand) || area === 'hill', `${area} ${e.id} stand is walkable`);
  }
});

test('the server puts newcomers where the client arrives', () => {
  for (const area of ['hill', 'woods', 'market', 'harbor', 'hillside']) {
    const from = area === 'woods' ? 'hill' : 'village';
    assert.deepEqual(AREA_DEFAULTS[area], regionToNetwork(area, REGIONS[area].arrive[from]), area);
  }
  for (const area of ['bank', 'salon', ...SHOP_AREAS]) assert.deepEqual(AREA_DEFAULTS[area], interiorArrival(area), area);
});

test('the hub: back through a gate you stand a step in, facing in, with the gate not in your face', () => {
  for (const area of [...BUILT_DISTRICTS, 'hill']) {
    const back = outdoorReturnPoint(area);
    const gate = area === 'hill' ? VILLAGE_GATE : DISTRICTS[area].gate;
    assert.ok(villageCanWalk(back), `${area}: return point walkable`);
    assert.ok(dist(back, gate.stand) > gate.reach, `${area}: outside the gate trigger`);
    const action = villageAction(back, 0, { now: 0 });
    assert.ok(!action || (action.target.type === 'spot' && !['district', 'gate'].includes(action.target.spot.kind)), `${area}: ${JSON.stringify(action?.target)}`);
    // The gate's stand is walkable and a clear walk away; E works there.
    assert.ok(villageCanWalk(gate.stand), `${area}: gate stand walkable`);
    const route = villagePath(back, gate.stand);
    assert.ok(route.length && dist(route.at(-1), gate.stand) < 0.4, `${area}: path to the gate`);
    // (뒷산's gate needs the village's growth state; its reach is the same rule.)
    if (area !== 'hill') {
      const at = villageAction(gate.stand, 0, { now: 0 });
      assert.ok(at && at.target.spot?.kind === 'district', `${area}: the gate is offered at its stand`);
    }
    assert.equal(arrivalFacing(gate), Math.sign(back.x - gate.x) || 1);
  }
  // Every gate on the rim, built or not, can be walked into from its stand (locked ones say why).
  for (const gate of [...DISTRICT_IDS.map((id) => DISTRICTS[id].gate), VILLAGE_GATE]) {
    const n = inward(gate);
    let q = { ...gate.stand },
      took = false;
    for (let i = 0; i < 20 && !took; i++) {
      q = villageStep(q, -n.x * 0.12, -n.z * 0.12);
      took = walksInto(q, { x: -n.x, z: -n.z }, gate);
    }
    assert.ok(took, `gate at ${gate.x},${gate.z}`);
  }
});

test('shop doors: out on the street a step from the door; in the room a step from 나가기', () => {
  for (const area of SHOP_AREAS) {
    const out = shopDoorOutside(area);
    const w = regionWalk(out.district);
    assert.ok(w.canWalk(out.at), `${area} outside walkable`);
    for (const c of districtCounters(out.district, 1)) {
      if (c.a.kind === 'counter' && c.a.enter === area) assert.ok(dist(out.at, c) > c.reach, `${area}: its door is not in my face`);
      if (c.a.kind === 'counter' && c.a.enter) assert.ok(dist(out.at, c) > c.reach, `${area}: no shop door at my feet`);
    }
    assert.equal(nearestExit(out.district, out.at), null);
  }
  for (const area of INTERIOR_AREAS) {
    const p = interiorArrival(area);
    assert.ok(interiorCanWalk(p, area), `${area} arrival walkable`);
    assert.equal(nearDoor(p), false, `${area}: 나가기 not offered on arrival`);
    const back = interiorPath(p, INTERIOR_DOOR, area);
    assert.ok(back.length && nearDoor(back.at(-1)), `${area}: a clear walk back to the door`);
  }
});
