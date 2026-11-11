import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeView } from '../app/lounge-life.ts';
import { returnBoardNavigation } from '../app/lounge-return-navigation.ts';
import { ACTOR_COUNT } from '../app/lounge-roster.ts';
import { kstDay } from '../app/lounge-economy.ts';
import { gameDay, gameTimeOnDay } from '../app/lounge-calendar.ts';
import {
  farmField,
  fieldDistance,
  FIELD_REACH,
} from '../app/lounge-farm-layout.ts';
import {
  COMMON_SIGN,
  FARM_SITES,
  siteDistance,
  SITE_REACH,
} from '../app/lounge-farm-sites-layout.ts';
import { DISTRICT_IDS } from '../app/lounge-districts.ts';
import { regionWalk, regionToNetwork } from '../app/lounge-areas.ts';
import {
  villageCanWalk,
  villageToNetwork,
} from '../app/lounge-village-layout.ts';
import {
  besideBed,
  canWalk,
  roomObstacles,
  ROOM_SLEEP_REACH,
} from '../app/lounge-bedroom-navigation.ts';
import {
  defaultBedroom,
  itemFootprint,
  roomOfHouse,
  setActiveRoomShape,
} from '../app/lounge-bedroom-data.ts';
import { npcSpot, npcTimeline } from '../app/lounge-npc-schedule.ts';
import { npcSocialSpot } from '../app/lounge-npc-social.ts';
import { assertNpcSocialContext } from '../app/lounge-romance.ts';
import {
  interiorCanWalk,
  worldToInterior,
} from '../app/lounge-interior-layout.ts';
import {
  SHOP_AREAS,
  SHOP_INTERIORS,
  shopCanWalk,
} from '../app/lounge-shop-interiors.ts';

const NOW = Date.UTC(2026, 10, 11, 3);
const DAY = kstDay(NOW);
const WORLD = { hill: true, ranch: true, foothill: true };
const FLAGS = [
  'district-harbor',
  'district-hillside',
  'district-ranch',
  'district-foothill',
];
function view() {
  const uid = crypto.randomUUID();
  const life = ensureLifeMember(emptyLife(), uid, 7);
  life.flags = [...FLAGS];
  const result = lifeView(life, uid, 7, NOW);
  result.districts.open = [...DISTRICT_IDS];
  return result;
}
function find(npc, predicate) {
  for (let d = DAY; d < DAY + 7; d++)
    for (let h = 0; h < 24; h++) {
      const now = gameTimeOnDay(d, h, 0, 12);
      const spot = npcSocialSpot(npcSpot(npc, now, WORLD), now, WORLD);
      if (predicate(spot)) return { now, spot };
    }
  assert.fail(`could not find ${npc}'s requested schedule state`);
}
function assertNpcReach(npc, nav, now) {
  const point =
    nav.kind === 'interior'
      ? nav.point
      : nav.area === 'village'
        ? villageToNetwork(nav.point)
        : regionToNetwork(nav.area, nav.point);
  assert.doesNotThrow(() =>
    assertNpcSocialContext(
      { kind: 'npcSocial', npc, op: 'talk' },
      {},
      {
        area: nav.area,
        x: point.x,
        y: point.y,
        actor: 7,
        fishing: false,
        hill: true,
        ranch: true,
        foothill: true,
      },
      now,
    ),
  );
}

test('every original and eighth field ends on walkable front paving within E reach at every size', () => {
  const life = view();
  const room = defaultBedroom(7);
  for (let actor = 0; actor < ACTOR_COUNT; actor++)
    for (const size of [24, 48, 80, 120]) {
      life.actors = { test: actor };
      life.fieldSizes = { test: size };
      const nav = returnBoardNavigation(
        { kind: 'field', actor },
        life,
        room,
        NOW,
      );
      assert.equal(nav.kind, 'outdoor');
      assert.equal(nav.area, 'farm');
      assert.ok(regionWalk('farm').canWalk(nav.point));
      assert.ok(
        fieldDistance(farmField(actor), size, nav.point) <= FIELD_REACH,
      );
      assert.ok(
        nav.point.z < farmField(actor).z0,
        'outside the cropped tiles on the house-front path',
      );
    }
  assert.equal(
    returnBoardNavigation(
      { kind: 'field', actor: ACTOR_COUNT },
      life,
      room,
      NOW,
    ).kind,
    'unavailable',
  );
});

test('all facility sites lead outside their footprint but inside E reach; absent buildings are honest', () => {
  const life = view();
  const room = defaultBedroom(7);
  life.farmSites = {
    sites: FARM_SITES.map((s) => ({ id: s.id, k: 'greenhouseMini', t: 1 })),
    field: { till: [], p: [], giants: [] },
    store: [],
    slots: 4,
    goal: { n: 0, need: 1, by: [], crop: 'carrot' },
  };
  for (const site of FARM_SITES) {
    const nav = returnBoardNavigation(
      { kind: 'site', site: site.id },
      life,
      room,
      NOW,
    );
    assert.equal(nav.kind, 'outdoor', site.id);
    assert.equal(nav.area, 'farm');
    assert.ok(regionWalk('farm').canWalk(nav.point), site.id);
    assert.ok(
      siteDistance(site, nav.point) > 0 &&
        siteDistance(site, nav.point) <= SITE_REACH,
      site.id,
    );
  }
  life.farmSites.sites[0].t = 0;
  assert.equal(
    returnBoardNavigation(
      { kind: 'site', site: FARM_SITES[0].id },
      life,
      room,
      NOW,
    ).kind,
    'unavailable',
  );
  assert.equal(
    returnBoardNavigation({ kind: 'site', site: 'not-a-site' }, life, room, NOW)
      .kind,
    'unavailable',
  );
  assert.deepEqual(
    returnBoardNavigation({ kind: 'commonField' }, life, room, NOW),
    {
      kind: 'outdoor',
      area: 'farm',
      point: { ...COMMON_SIGN },
      label: '공동 밭 안내판',
    },
  );
});

test('the bed target uses its saved placement and the existing bedside walker without changing the room', () => {
  const life = view();
  for (const tier of [0, 4]) {
    setActiveRoomShape(roomOfHouse(tier));
    const room = defaultBedroom(7);
    room.items.find((i) => i.ref === 'bed').x = tier === 4 ? 9 : 3;
    const before = structuredClone(room);
    const nav = returnBoardNavigation(
      { kind: 'bed', actor: 7 },
      life,
      room,
      NOW,
    );
    assert.equal(nav.kind, 'bed');
    assert.deepEqual(nav.point, besideBed(room));
    assert.ok(canWalk(nav.point, roomObstacles(room)));
    const box = itemFootprint(room.items.find((i) => i.ref === 'bed'));
    const dx = Math.max(0, box.x0 - nav.point.x, nav.point.x - box.x1);
    const dz = Math.max(0, box.z0 - nav.point.z, nav.point.z - box.z1);
    assert.ok(Math.hypot(dx, dz) <= ROOM_SLEEP_REACH);
    assert.deepEqual(room, before);
  }
  setActiveRoomShape(roomOfHouse(0));
  assert.equal(
    returnBoardNavigation(
      { kind: 'bed', actor: 7 },
      life,
      { ...defaultBedroom(7), items: [] },
      NOW,
    ).kind,
    'unavailable',
  );
});

test('shop staff destinations stay on the customer side and satisfy the server talk context', () => {
  const life = view();
  for (const area of SHOP_AREAS) {
    const npc = SHOP_INTERIORS[area].owner;
    const { now, spot } = find(
      npc,
      (s) => s.area === area && s.place === `${area}.owner` && !s.walking,
    );
    const nav = returnBoardNavigation(
      { kind: 'npc', npc },
      life,
      defaultBedroom(7),
      now,
    );
    assert.equal(nav.kind, 'interior', `${npc} / ${area}`);
    assert.equal(nav.area, area);
    assert.deepEqual(nav.point, SHOP_INTERIORS[area].front);
    assert.ok(shopCanWalk(nav.point, area), `${area} public floor`);
    assert.ok(interiorCanWalk(nav.point, area));
    assert.notDeepEqual(
      nav.point,
      worldToInterior(spot),
      'the staff position is not a player destination',
    );
    assertNpcReach(npc, nav, now);
  }
});

test('bank, salon, tavern and casino posts use existing reachable public spots, not raw NPC anchors', () => {
  const life = view();
  for (const [npc, area] of [
    ['nyamo', 'bank'],
    ['gwen', 'salon'],
    ['captain', 'tavern'],
    ['rose', 'casino'],
    ['lumi', 'casino'],
    ['maehwa', 'lounge'],
  ]) {
    const { now } = find(
      npc,
      (s) =>
        s.area === area && !s.visible && !s.walking && s.activity !== 'transit',
    );
    const nav = returnBoardNavigation(
      { kind: 'npc', npc },
      life,
      defaultBedroom(7),
      now,
    );
    assert.equal(nav.kind, 'interior', `${npc} / ${area}`);
    assert.equal(nav.area, area);
    assert.ok(interiorCanWalk(nav.point, area), `${npc}'s public approach`);
    assertNpcReach(npc, nav, now);
  }
});

test('outdoor residents and village-door staff have walkable targets inside server interaction reach', () => {
  const life = view();
  for (const [npc, check] of [
    [
      'sinjjajang',
      (s) => s.visible && !s.walking && ['village', 'market'].includes(s.area),
    ],
    ['carpenter', (s) => s.area === 'furniture' && !s.walking],
    ['realtor', (s) => s.area === 'realty' && !s.walking],
  ]) {
    const { now } = find(npc, check);
    const nav = returnBoardNavigation(
      { kind: 'npc', npc },
      life,
      defaultBedroom(7),
      now,
    );
    assert.equal(nav.kind, 'outdoor', npc);
    assert.ok(
      nav.area === 'village'
        ? villageCanWalk(nav.point)
        : regionWalk(nav.area).canWalk(nav.point),
    );
    assertNpcReach(npc, nav, now);
  }
});

test('a moving, hidden or locked-away resident produces an honest message and no invented destination', () => {
  const life = view();
  const room = defaultBedroom(7);
  const timeline = npcTimeline('sinjjajang', gameDay(NOW), WORLD);
  const moving = timeline.find((e) => e.k === 'walk');
  assert.ok(moving);
  const mid = (moving.t0 + moving.t1) / 2;
  assert.equal(npcSpot('sinjjajang', mid, WORLD).walking, true);
  assert.equal(
    returnBoardNavigation({ kind: 'npc', npc: 'sinjjajang' }, life, room, mid)
      .kind,
    'unavailable',
  );
  const hidden = find(
    'beatrice',
    (s) => !s.visible && s.area === 'hillside' && !s.walking,
  );
  assert.equal(
    returnBoardNavigation(
      { kind: 'npc', npc: 'beatrice' },
      life,
      room,
      hidden.now,
    ).kind,
    'unavailable',
  );
  life.flags = [];
  life.districts.open = ['farm', 'market'];
  assert.equal(
    returnBoardNavigation({ kind: 'npc', npc: 'haku' }, life, room, NOW).kind,
    'unavailable',
  );
  assert.equal(
    returnBoardNavigation({ kind: 'commonField' }, life, room, NaN).kind,
    'unavailable',
  );
});
