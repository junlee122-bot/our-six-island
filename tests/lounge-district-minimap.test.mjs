// District minimaps (lounge-district-minimap.ts): every district on its own
// map, every E spot and shop-room door is a place you can click to walk to,
// and friends show where they are.
import test from 'node:test';
import assert from 'node:assert/strict';
import { districtFriendPins, districtMinimap } from '../app/lounge-district-minimap.ts';
import { DISTRICT_AREAS, REGIONS, regionToNetwork, regionWalk } from '../app/lounge-areas.ts';
import { BUILT_DISTRICTS } from '../app/lounge-districts.ts';
import { districtCounters } from '../app/lounge-district-counters.ts';
import { SHOP_AREAS, SHOP_INTERIORS } from '../app/lounge-shop-interiors.ts';

const THURSDAY = 4,
  SUNDAY = 0,
  WEDNESDAY = 3;

test('every built district has a minimap; the hub’s own outdoor areas do not', () => {
  assert.deepEqual([...DISTRICT_AREAS].sort(), [...BUILT_DISTRICTS].sort(), 'a district added to DISTRICTS and built gets a map');
  for (const area of DISTRICT_AREAS) {
    const map = districtMinimap(area, THURSDAY);
    assert.ok(map, area);
    assert.deepEqual(map.bounds, REGIONS[area].bounds);
    assert.ok(map.shapes.length > 4, `${area} draws its streets and buildings`);
    assert.equal(new Set(map.places.map((p) => p.id)).size, map.places.length, `${area}: place ids are unique`);
  }
  for (const area of ['hill', 'woods', 'mine']) assert.equal(districtMinimap(area, THURSDAY), null);
});

test('places: inside the map and their walk-to point is walkable', () => {
  for (const area of DISTRICT_AREAS)
    for (const day of [SUNDAY, WEDNESDAY, THURSDAY]) {
      const map = districtMinimap(area, day),
        walk = regionWalk(area),
        { w, d } = map.bounds;
      for (const p of map.places) {
        assert.ok(Math.abs(p.x) <= w / 2 && Math.abs(p.z) <= d / 2, `${area}/${p.id} pin inside`);
        const n = walk.near(p.go);
        assert.ok(Math.hypot(n.x - p.go.x, n.z - p.go.z) < 0.6, `${area}/${p.id} go (${p.go.x}, ${p.go.z}) is walkable`);
        assert.ok(p.label.length > 0 && p.title.length > 0);
      }
    }
});

test('every E spot, shop-room door and exit is on the map', () => {
  for (const area of DISTRICT_AREAS)
    for (const day of [SUNDAY, WEDNESDAY, THURSDAY]) {
      const map = districtMinimap(area, day);
      const gos = map.places.map((p) => p.go);
      for (const c of districtCounters(area, day)) {
        if (c.a.kind === 'signpost' || (c.a.kind === 'fish' && c.a.label.includes('통발'))) continue;
        assert.ok(gos.some((g) => g.x === c.x && g.z === c.z), `${area} day ${day}: ${c.a.label}`);
      }
      for (const e of REGIONS[area].exits) assert.ok(map.places.some((p) => p.kind === 'exit' && p.go.x === e.stand.x && p.go.z === e.stand.z), `${area}: ${e.label}`);
    }
  // Shop rooms (가게 실내): their doors are marked as doors in their own district.
  for (const shop of SHOP_AREAS) {
    const map = districtMinimap(SHOP_INTERIORS[shop].district, THURSDAY);
    const door = map.places.find((p) => p.id === SHOP_INTERIORS[shop].counter);
    assert.equal(door?.kind, 'door', shop);
    assert.match(door.title, new RegExp(SHOP_INTERIORS[shop].name));
  }
  const market = districtMinimap('market', THURSDAY),
    harbor = districtMinimap('harbor', THURSDAY),
    hillside = districtMinimap('hillside', THURSDAY);
  for (const id of ['coop', 'general', 'bakery', 'newspaper', 'post', 'police', 'board', 'exit-village']) assert.ok(market.places.some((p) => p.id === id), `market ${id}`);
  assert.equal(market.places.filter((p) => p.kind === 'stall').length, 0, 'no stalls on a Thursday');
  assert.equal(districtMinimap('market', SUNDAY).places.filter((p) => p.kind === 'stall').length, 4, 'four stalls on market day');
  assert.deepEqual(harbor.places.filter((p) => p.kind === 'fish').map((p) => p.label).sort(), ['방파제 낚시', '방파제 낚시', '선착장 낚시'].sort());
  for (const id of ['fishmarket', 'guild', 'exit-village']) assert.ok(harbor.places.some((p) => p.id === id), `harbor ${id}`);
  assert.ok(districtMinimap('harbor', WEDNESDAY).places.some((p) => p.kind === 'stall'), '마키마 on Wednesdays');
  assert.ok(hillside.places.some((p) => p.id === 'library'));
  assert.ok(hillside.places.filter((p) => p.kind === 'house').length >= 9, 'residents’ houses');
  assert.ok(hillside.places.filter((p) => p.kind === 'house').every((p) => !p.named && !p.label.startsWith('네')), 'houses are named on hover / when enlarged');
});

test('friends: where they walk in the district, inside a shop at its door, elsewhere not here', () => {
  const at = (area, p) => ({ area, ...regionToNetwork(area, p) });
  const players = [
    { id: 'me', actor: 0, ...at('market', { x: 0, z: 0 }) },
    { id: 'a', actor: 1, ...at('market', { x: 10, z: 5 }) },
    { id: 'b', actor: 2, area: 'bakery', x: 50, y: 60 },
    { id: 'c', actor: 3, area: 'fishmarket', x: 50, y: 60 },
    { id: 'd', actor: 4, area: 'village', x: 50, y: 60 },
    { id: 'friend-x', actor: 5, ...at('market', { x: 0, z: 0 }) },
    { id: 'a', actor: 1, ...at('market', { x: 10, z: 5 }) },
  ];
  const market = districtFriendPins(players, 'me', 'market');
  assert.deepEqual(market.map((p) => p.id), ['a', 'b']);
  assert.ok(Math.abs(market[0].point.x - 10) < 0.1 && Math.abs(market[0].point.z - 5) < 0.1);
  assert.equal(market[0].indoor, false);
  assert.equal(market[1].indoor, true);
  assert.equal(market[1].location, SHOP_INTERIORS.bakery.name);
  const bakery = districtMinimap('market', THURSDAY).places.find((p) => p.id === 'bakery');
  assert.ok(Math.hypot(market[1].point.x - bakery.x, market[1].point.z - bakery.z) < 2, 'pinned at the bakery');
  assert.deepEqual(districtFriendPins(players, 'me', 'harbor').map((p) => p.id), ['c']);
  assert.deepEqual(districtFriendPins(players, 'me', 'hillside'), []);
  assert.deepEqual(districtFriendPins(players, 'me', 'hill'), []);
});
