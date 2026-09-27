import test from 'node:test';
import assert from 'node:assert/strict';
import { BANKER_FRONT, BANKER_SPOT, BANK_OBSTACLES, nearBanker } from '../app/lounge-bank-layout.ts';
import { SALON_FRONT, SALON_STYLIST_SPOT, SALON_OBSTACLES, nearSalon } from '../app/lounge-salon-layout.ts';
import { AREA_DEFAULTS, AREAS, TABLE_AREA, chatScope } from '../app/lounge-games.ts';
import { INTERIOR_AREAS, VENUES } from '../app/lounge-venues.ts';
import { interiorAction, interiorCanWalk, interiorPath, interiorTables, segmentWalkable, INTERIOR_DOOR } from '../app/lounge-interior-layout.ts';
import { sceneCanWalk } from '../app/lounge-scene-layout.ts';
import { readReaction, reactionVisible } from '../app/lounge-reactions.ts';
import { villageFriendPins } from '../app/lounge-village-minimap.ts';
import { VILLAGE_PLACES } from '../app/lounge-village-layout.ts';

for (const { area, front, npc, furniture, near, action } of [
  { area: 'bank', front: BANKER_FRONT, npc: BANKER_SPOT, furniture: BANK_OBSTACLES, near: nearBanker, action: 'banker' },
  { area: 'salon', front: SALON_FRONT, npc: SALON_STYLIST_SPOT, furniture: SALON_OBSTACLES, near: nearSalon, action: 'salon' },
]) {
  test(`${area} is a separate shared interior with chat and no game tables`, () => {
    assert.ok(AREAS.includes(area)); assert.ok(INTERIOR_AREAS.includes(area));
    assert.equal(chatScope(area), area);
    assert.deepEqual(AREA_DEFAULTS[area], INTERIOR_DOOR);
    assert.deepEqual(interiorTables(area), []);
    assert.ok(!Object.values(TABLE_AREA).includes(area));
    assert.deepEqual(interiorAction(front, area), { kind: action });
    assert.deepEqual(interiorAction(INTERIOR_DOOR, area), { kind: 'door' });
  });
  test(`${area} service only opens at its public approach`, () => {
    assert.ok(near(front, area));
    for (const point of [INTERIOR_DOOR, npc, { x: NaN, y: 62 }, { x: front.x, y: 58.9 }, { x: front.x + 6.1, y: front.y }])
      assert.equal(near(point, area), false);
    assert.equal(near(front, 'village'), false);
    assert.equal(near(front, area === 'bank' ? 'salon' : 'bank'), false);
  });
  test(`${area} furniture blocks both floors and all public paths reach the service and door`, () => {
    assert.ok(interiorCanWalk(front, area));
    assert.ok(interiorCanWalk(INTERIOR_DOOR, area));
    for (const obstacle of furniture) {
      assert.equal(sceneCanWalk(obstacle, area), false, obstacle.id);
      assert.equal(interiorCanWalk(obstacle, area), false, obstacle.id);
    }
    for (const x of [18, 35, 50, 65, 82]) for (const y of [44, 62, 75, 85]) {
      const start = { x, y };
      if (!interiorCanWalk(start, area)) continue;
      for (const destination of [front, INTERIOR_DOOR]) {
        let current = start;
        const path = interiorPath(start, destination, area);
        assert.ok(path.length);
        for (const next of path) {
          assert.ok(segmentWalkable(current, next, area), `${area} ${JSON.stringify(current)} → ${JSON.stringify(next)}`);
          current = next;
        }
        assert.deepEqual(current, destination);
      }
    }
  });
  test(`${area} visitors appear at the real building and reactions stay in their venue`, () => {
    const [pin] = villageFriendPins([{ id: `${area}-visitor`, actor: 1, area, x: front.x, y: front.y }], 'other');
    const place = VILLAGE_PLACES.find(p => p.id === VENUES[area].place);
    assert.ok(pin.indoor); assert.equal(pin.placeId, place.id); assert.deepEqual(pin.point, place.entry);
    const reaction = readReaction({ id: 'jeje', at: 10000, scope: area });
    assert.equal(reaction?.scope, area);
    assert.ok(reactionVisible(reaction, area, undefined, 10001));
    assert.equal(reactionVisible(reaction, 'village', undefined, 10001), false);
  });
}
