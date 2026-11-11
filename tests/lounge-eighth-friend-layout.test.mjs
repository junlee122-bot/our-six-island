import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTORS } from '../app/lounge-roster.ts';
import { ACTOR_NAMES, FRIEND_PROFILES, gameDay, dayStart } from '../app/lounge-calendar.ts';
import { FRIEND_LINES } from '../app/lounge-friend-lines.ts';
import { FRIEND_GIFTS } from '../app/lounge-social-defs.ts';
import {
  FARM_COLLIDERS,
  FARM_D,
  FARM_FIELDS,
  FARM_HOUSES,
  FARM_W,
  farmField,
  farmHomePlace,
  farmHouse,
  farmStart,
} from '../app/lounge-farm-layout.ts';
import { FARM_COMMON, FARM_SITES, personalSites, yardMachineAt } from '../app/lounge-farm-sites-layout.ts';
import { PERSONAL_SITE_IDS, siteActor } from '../app/lounge-farm-sites-data.ts';
import { REGIONS, regionWalk } from '../app/lounge-areas.ts';
import { NPC_PLACES, npcPlan } from '../app/lounge-npc-schedule.ts';

const overlap = (a, b) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.z - b.z) * 2 < a.d + b.d;

test('the eighth home appends east without moving any original home or field', () => {
  // Save positions and player ids remain stable across the roster expansion.
  const originalX = [-27.2, -13.6, 0, 13.6, 27.2, -40.8, 40.8];
  for (const [actor, x] of originalX.entries()) {
    const house = farmHouse(actor);
    const field = farmField(actor);
    assert.deepEqual({ x: house.x, z: house.z }, { x, z: -27 });
    assert.deepEqual(field, { actor, x0: Math.round((x - 6) * 1000) / 1000, z0: -20.6, w: 12, d: 10 });
  }
  assert.equal(farmHouse(7).x, 54.4);
  assert.equal(farmHouse(7).name, '유찬의 집');
  assert.equal(farmHomePlace(7).actor, 7);
  assert.equal(farmHomePlace(7).id, 'home-7');
  assert.equal(FARM_HOUSES.length, 8);
  assert.equal(FARM_FIELDS.length, 8);
});

test('the new field and personal sites fit, reach their house, and avoid every existing facility', () => {
  assert.deepEqual(personalSites(7).map(s => s.id), ['P7', 'Q7']);
  assert.ok(PERSONAL_SITE_IDS.includes('P7') && PERSONAL_SITE_IDS.includes('Q7'));
  assert.equal(siteActor('P7'), 7);
  assert.equal(siteActor('Q7'), 7);
  assert.equal(siteActor('P8'), null);
  assert.equal(siteActor('P07'), null);
  const field = farmField(7);
  const added = [
    { id: 'field-7', x: field.x0 + field.w / 2, z: field.z0 + field.d / 2, w: field.w, d: field.d },
    ...personalSites(7),
  ];
  const existing = [
    ...FARM_SITES.filter(s => s.actor !== 7),
    { id: 'common', ...FARM_COMMON },
    ...FARM_FIELDS.filter(f => f.actor !== 7).map(f => ({ id: `field-${f.actor}`, x: f.x0 + f.w / 2, z: f.z0 + f.d / 2, w: f.w, d: f.d })),
    ...FARM_COLLIDERS.map((c, i) => ({ id: `wall-${i}`, x: c.x, z: c.z, w: c.shape === 'box' ? c.w : c.r * 2, d: c.shape === 'box' ? c.d : c.r * 2 })),
  ];
  for (const place of added) {
    assert.ok(Math.abs(place.x) + place.w / 2 < FARM_W / 2, `${place.id} inside east/west edge`);
    assert.ok(Math.abs(place.z) + place.d / 2 < FARM_D / 2, `${place.id} inside north/south edge`);
    for (const old of existing) assert.ok(!overlap(place, old), `${place.id} overlaps ${old.id}`);
  }
  assert.ok(!overlap(added[1], added[2]));
  const walk = regionWalk('farm');
  const from = REGIONS.farm.arrive.village;
  for (const point of [farmHouse(7).door, farmStart(7), ...added.map(p => ({x:p.x,z:p.z}))]) {
    assert.ok(walk.canWalk(point));
    const end = walk.path(from, point).at(-1);
    assert.ok(end && Math.hypot(end.x - point.x, end.z - point.z) < 0.05, `reachable ${JSON.stringify(point)}`);
  }
  for (const site of FARM_SITES.filter(s => s.size === 'medium')) {
    for (const actor of ACTORS.keys()) for (const slot of [0, 11]) {
      const p = yardMachineAt(site, actor, slot);
      assert.ok(Math.abs(p.x - site.x) < site.w / 2 && Math.abs(p.z - site.z) < site.d / 2, `machine ${actor}/${slot} inside ${site.id}`);
    }
  }
});

test('the eighth friend has neutral welcome content and no invented birthday or tastes', () => {
  assert.equal(ACTOR_NAMES[7], '유찬');
  assert.equal(FRIEND_PROFILES.length, ACTORS.length);
  assert.deepEqual(FRIEND_PROFILES[7], {birthday:null,likes:[],dislikes:[]});
  assert.equal(FRIEND_LINES.length, ACTORS.length);
  assert.ok(FRIEND_LINES[7].greet.day.length > 0);
  assert.equal(FRIEND_GIFTS.length, ACTORS.length);
});

test('the postal round can visit the eighth home without adding extra daily stops', () => {
  assert.ok(NPC_PLACES['fa.door-7']);
  let found = false;
  for (let day = 20730; day < 20758; day++) {
    const visits = npcPlan('sinjjajang', gameDay(dayStart(day)) + 12)
      .filter(([, place]) => place.startsWith('fa.door-'));
    assert.ok(visits.length <= 4);
    found ||= visits.some(([, place]) => place === 'fa.door-7');
  }
  assert.ok(found, '유찬 is included in the rotating mail delivery');
});
