import test from 'node:test';
import assert from 'node:assert/strict';
import { GATHERING_PLACES } from '../app/lounge-gatherings-data.ts';
import { gatheringNavigation } from '../app/lounge-gatherings-navigation.ts';
import { VILLAGE_PLACES, VILLAGE_START, villageCanWalk, villagePath } from '../app/lounge-village-layout.ts';
import { nearestFishSpot, FISH_REACH } from '../app/lounge-village-spots.ts';
import { DISTRICTS } from '../app/lounge-districts.ts';
import { REGIONS, regionWalk } from '../app/lounge-areas.ts';
import { districtCounters } from '../app/lounge-district-counters.ts';
import { interiorAction, interiorArrival, interiorCanWalk, interiorPath, nearDoor } from '../app/lounge-interior-layout.ts';
import { sceneTableSide } from '../app/lounge-scene-layout.ts';
import { activeRoomShape, roomDoorPoint, roomShape } from '../app/lounge-bedroom-data.ts';
import { roomAction } from '../app/lounge-bedroom-navigation.ts';
import { STAIR_FRONT } from '../app/lounge-lighthouse-layout.ts';

test('each final destination is walkable and offers the actual fishing, food or exact table interaction', () => {
  for (const place of GATHERING_PLACES) {
    const step = gatheringNavigation(place.id, place.area);
    assert.equal(step.final, true, place.id); assert.equal(step.area, place.area);
    assert.equal(step.nextArea, undefined);
    if (place.activity === 'fishing') {
      assert.equal(step.kind, 'outdoor'); assert.ok(villageCanWalk(step.point));
      const spot = nearestFishSpot(step.point);
      assert.equal(spot.spot, place.id === 'river-fishing' ? 'river' : 'pond');
      assert.ok(spot.distance <= FISH_REACH);
      assert.ok(villagePath(VILLAGE_START, step.point).length > 0);
    } else {
      assert.equal(step.kind, 'interior'); assert.ok(interiorCanWalk(step.point, step.area), place.id);
      assert.ok(interiorPath(interiorArrival(step.area), step.point, step.area).length > 0, place.id);
      const action = interiorAction(step.point, step.area);
      if (place.activity === 'table') {
        assert.deepEqual(action, { kind: 'table', game: place.game });
        assert.deepEqual(step.point, sceneTableSide(place.area, place.game));
      } else assert.equal(action.kind, place.id === 'bakery-meal' ? 'counter' : 'host');
    }
  }
});

test('bakery guidance visits the market gate, the real bakery door, then the counter without changing area', () => {
  const gate = gatheringNavigation('bakery-meal', 'village');
  assert.deepEqual(gate.point, DISTRICTS.market.gate.stand);
  assert.equal(gate.kind, 'outdoor'); assert.equal(gate.area, 'village');
  assert.equal(gate.nextArea, 'market'); assert.equal(gate.final, false);
  assert.ok(villageCanWalk(gate.point));
  const door = gatheringNavigation('bakery-meal', 'market');
  assert.equal(door.area, 'market'); assert.equal(door.nextArea, 'bakery'); assert.equal(door.final, false);
  assert.ok(regionWalk('market').canWalk(door.point));
  const touch = districtCounters('market', 1).find((c) => c.a.kind === 'counter' && c.a.enter === 'bakery');
  assert.ok(Math.hypot(door.point.x - touch.x, door.point.z - touch.z) <= touch.reach);
  assert.equal(gatheringNavigation('bakery-meal', 'bakery').final, true);
});

test('table and tavern destinations stop at their real village entrances before guiding indoors', () => {
  for (const place of GATHERING_PLACES.filter((p) => p.area !== 'village' && p.area !== 'bakery')) {
    const step = gatheringNavigation(place.id, 'village');
    const building = VILLAGE_PLACES.find((p) => p.destination === place.area);
    assert.equal(step.kind, 'outdoor'); assert.equal(step.area, 'village');
    assert.equal(step.nextArea, place.area); assert.equal(step.final, false);
    assert.deepEqual(step.point, building.entry); assert.ok(villageCanWalk(step.point));
    assert.ok(villagePath(VILLAGE_START, step.point).length > 0);
  }
});

test('cross-area routes always guide out of the current map first, never return a destination in a different map', () => {
  for (const current of ['lounge', 'casino', 'tavern', 'bakery', 'bank', 'salon', 'coop', 'fishmarket']) {
    const step = gatheringNavigation('river-fishing', current);
    assert.equal(step.kind, 'interior'); assert.equal(step.area, current); assert.equal(step.final, false);
    assert.ok(interiorCanWalk(step.point, current)); assert.ok(nearDoor(step.point, current));
  }
  for (const current of ['farm', 'market', 'harbor', 'hillside', 'ranch', 'foothill', 'hill', 'woods']) {
    const step = gatheringNavigation('hall-yacht', current);
    const exit = REGIONS[current].exits.find((e) => e.to === step.nextArea);
    assert.equal(step.kind, 'outdoor'); assert.equal(step.area, current); assert.equal(step.final, false);
    assert.ok(exit); assert.deepEqual(step.point, exit.stand); assert.ok(regionWalk(current).canWalk(step.point), current);
  }
});

test('a room and the lighthouse upper floor guide to existing exits; unavailable states cannot teleport away', () => {
  const own = gatheringNavigation('hall-yacht', 'home');
  assert.equal(own.kind, 'room'); assert.equal(own.area, 'home'); assert.equal(own.final, false);
  assert.deepEqual(own.point, roomDoorPoint(activeRoomShape()));
  assert.equal(roomAction(own.point, { items: [] }, { own: true }).kind, 'exit');
  const large = roomShape(3);
  assert.deepEqual(gatheringNavigation('pond-fishing', 'bedroom', { roomShape: large }).point, roomDoorPoint(large));
  const stairs = gatheringNavigation('hall-yacht', 'lighthouseTop');
  assert.equal(stairs.area, 'lighthouseTop'); assert.equal(stairs.nextArea, 'lighthouse');
  assert.deepEqual(stairs.point, STAIR_FRONT); assert.ok(interiorCanWalk(stairs.point, 'lighthouseTop'));
  for (const area of ['offshore', 'wardrobe', 'not-a-map']) assert.equal(gatheringNavigation('hall-yacht', area).kind, 'unavailable');
  for (const place of ['', '__proto__', 'not-a-place', undefined]) assert.equal(gatheringNavigation(place, 'village').kind, 'unavailable');
});

test('returned walking points cannot mutate the canonical geometry or introduce an automatic action', () => {
  const first = gatheringNavigation('river-fishing', 'village'); first.point.x = 12345;
  assert.notEqual(gatheringNavigation('river-fishing', 'village').point.x, 12345);
  for (const place of GATHERING_PLACES) {
    const step = gatheringNavigation(place.id, place.area);
    assert.equal('action' in step, false); assert.equal('command' in step, false);
    assert.equal('join' in step, false); assert.equal('seat' in step, false);
  }
});
