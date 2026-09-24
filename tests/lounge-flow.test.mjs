import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION_LABEL,
  ACTION_TIE,
  BANNER_QUEUE_LIMIT,
  EMPTY_BANNERS,
  bannerDuration,
  dropBanners,
  farmAction,
  nextBanner,
  pickAction,
  pushBanner,
} from '../app/lounge-flow.ts';
import { villageAction, villageActionKey } from '../app/lounge-village-actions.ts';
import { VILLAGE_PLACES } from '../app/lounge-village-layout.ts';
import { farmBed, farmFront, FRUIT_TREE_POINTS, walkableNear } from '../app/lounge-village-life.ts';
import {
  ROOM_DOOR_REACH,
  besideBed,
  canWalk,
  leavingThroughDoor,
  roomAction,
  roomObstacles,
} from '../app/lounge-bedroom-navigation.ts';
import { ROOM, ROOM_DOOR_POINT, defaultBedroom } from '../app/lounge-bedroom-data.ts';
import {
  SCENE_LAYOUT,
  sceneCanWalk,
  sceneNearestTable,
  sceneTableSide,
} from '../app/lounge-scene-layout.ts';

/* ------------------------------------------------------------ pickAction */

test('the closest candidate within its reach wins (relative to reach)', () => {
  const best = pickAction([
    { kind: 'pick', distance: 1.5, reach: 2 }, // 0.75
    { kind: 'plant', distance: 0.5, reach: 1.3 }, // 0.38
    { kind: 'talk', distance: 1.7, reach: 1.6 }, // out of reach
  ]);
  assert.equal(best?.kind, 'plant');
});

test('doors win ties', () => {
  const best = pickAction([
    { kind: 'mail', distance: 0.5, reach: 1 },
    { kind: 'enter', distance: 0.5 + ACTION_TIE / 2, reach: 1, door: true },
  ]);
  assert.equal(best?.kind, 'enter');
  // A clearly closer non-door still wins.
  const far = pickAction([
    { kind: 'mail', distance: 0.1, reach: 1 },
    { kind: 'enter', distance: 0.8, reach: 1, door: true },
  ]);
  assert.equal(far?.kind, 'mail');
});

test('fallbacks only apply when nothing is in reach; bad input is ignored', () => {
  assert.equal(
    pickAction([{ kind: 'decorate', distance: 0, reach: 1, fallback: true }, null, false])?.kind,
    'decorate',
  );
  assert.equal(
    pickAction([
      { kind: 'decorate', distance: 0, reach: 1, fallback: true },
      { kind: 'dress', distance: 0.4, reach: 0.9 },
    ])?.kind,
    'dress',
  );
  assert.equal(pickAction([{ kind: 'look', distance: NaN, reach: 1 }, { kind: 'look', distance: 0, reach: 0 }]), null);
  assert.equal(pickAction([]), null);
});

test('every action has a short Korean label', () => {
  for (const [kind, label] of Object.entries(ACTION_LABEL)) {
    assert.ok(label.length > 0 && label.length <= 7, kind);
    assert.match(label, /[가-힣]/);
  }
  assert.equal(ACTION_LABEL.enter, '들어가기');
  assert.equal(ACTION_LABEL.exit, '나가기');
});

test('farm label: 수확 > 심기 > 물 주기 > 돌보기', () => {
  const now = 1000;
  assert.equal(farmAction([{ crop: 'carrot', readyAt: 900, wateredAt: null }, { crop: null }], now), 'harvest');
  assert.equal(farmAction([{ crop: 'carrot', readyAt: 2000, wateredAt: null }, { crop: null }], now), 'plant');
  assert.equal(farmAction([{ crop: 'carrot', readyAt: 2000, wateredAt: null }], now), 'water');
  assert.equal(farmAction([{ crop: 'carrot', readyAt: 2000, wateredAt: 500 }], now), 'tend');
  assert.equal(farmAction([], now), 'tend');
});

/* ------------------------------------------------------------ village */

test('village: at my door the button enters, at my farm it farms', () => {
  const actor = 3;
  const home = VILLAGE_PLACES.find((p) => p.id === `home-${actor}`);
  const atDoor = villageAction(home.entry, actor, { now: 0 });
  assert.equal(atDoor?.kind, 'enter');
  assert.equal(atDoor.target.type, 'door');
  assert.equal(atDoor.target.entrance.place.id, home.id);
  const bed = farmBed(actor);
  const front = farmFront(bed);
  const atFarm = villageAction(front, actor, { now: 0 });
  assert.ok(['plant', 'tend', 'water', 'harvest'].includes(atFarm?.kind), atFarm?.kind);
  assert.equal(atFarm.target.spot.kind, 'farm');
  assert.notEqual(villageActionKey(atDoor), villageActionKey(atFarm));
  assert.equal(villageActionKey(null), '');
});

test("village: a friend's door visits only when visiting is possible", () => {
  const friend = VILLAGE_PLACES.find((p) => p.kind === 'home' && p.actor === 0);
  assert.equal(villageAction(friend.entry, 3, { now: 0 })?.kind, 'enter');
  const noVisit = villageAction(friend.entry, 3, { now: 0, canVisit: false });
  assert.notEqual(noVisit?.target.type, 'door');
});

test('village: civic doors enter; a ripe tree is picked; a nearby friend is talked to', () => {
  for (const id of ['hall', 'casino', 'wardrobe']) {
    const place = VILLAGE_PLACES.find((p) => p.id === id);
    assert.equal(villageAction(place.entry, 3, { now: 0 })?.kind, 'enter', id);
  }
  const tree = FRUIT_TREE_POINTS['tree-1'];
  const nearTree = walkableNear({ x: tree.x + 1.2, z: tree.z });
  const picked = villageAction(nearTree, 3, { now: 0 });
  assert.equal(picked?.kind, 'pick');
  const npc = { actor: 1, point: { x: nearTree.x + 0.3, z: nearTree.z } };
  assert.equal(villageAction(nearTree, 3, { now: 0, npcs: [npc] })?.kind, 'talk');
});

/* ------------------------------------------------------------ my room */

test('the day starts beside the bed on walkable floor', () => {
  for (let actor = 0; actor < 7; actor++) {
    const room = defaultBedroom(actor);
    const spot = besideBed(room);
    assert.ok(canWalk(spot, roomObstacles(room)), `actor ${actor}`);
    const bed = room.items.find((i) => i.ref === 'bed');
    assert.ok(Math.hypot(spot.x - bed.x, spot.z - bed.z) < 2.6, `actor ${actor} near bed`);
  }
  // No bed: just inside the door.
  const empty = besideBed({ items: [] });
  assert.ok(Math.hypot(empty.x - ROOM_DOOR_POINT.x, empty.z - ROOM_DOOR_POINT.z) < 0.5);
});

test('room button: 나가기 at the door, 꾸미기 elsewhere in my room, nothing in a friend’s room', () => {
  const room = defaultBedroom(3);
  assert.equal(roomAction(ROOM_DOOR_POINT, room, { own: true })?.kind, 'exit');
  assert.equal(roomAction({ x: 1, z: 0 }, room, { own: true })?.kind, 'decorate');
  assert.equal(roomAction({ x: 1, z: 0 }, room, { own: false }), null);
  assert.equal(roomAction(ROOM_DOOR_POINT, room, { own: false })?.kind, 'exit');
  const far = { x: ROOM_DOOR_POINT.x + ROOM_DOOR_REACH + 0.3, z: ROOM_DOOR_POINT.z };
  assert.notEqual(roomAction(far, room, { own: true })?.kind, 'exit');
  // A wardrobe in reach: 옷 갈아입기 (only when dressing is possible).
  const withWardrobe = {
    items: [{ id: 'w', ref: 'wardrobe', x: 3, z: -3.5, y: 0, rotY: 0, scale: 1 }],
  };
  assert.equal(roomAction({ x: 3, z: -2.6 }, withWardrobe, { own: true })?.kind, 'dress');
  assert.equal(roomAction({ x: 3, z: -2.6 }, withWardrobe, { own: true, canDress: false })?.kind, 'decorate');
});

test('walking into the left wall at the doorway leaves the room', () => {
  const at = { x: ROOM.minX + 0.25, z: (ROOM.door.z0 + ROOM.door.z1) / 2 };
  assert.ok(leavingThroughDoor(at, -0.02));
  assert.ok(!leavingThroughDoor(at, 0.02), 'walking away');
  assert.ok(!leavingThroughDoor({ x: at.x, z: 0 }, -0.02), 'not at the door');
  assert.ok(!leavingThroughDoor(ROOM_DOOR_POINT, -0.02), 'just walked in');
});

/* ------------------------------------------------------------ hall / casino */

test('standing up from a table puts me on open floor beside it', () => {
  for (const area of ['lounge', 'casino'])
    for (const { game } of SCENE_LAYOUT[area].tables) {
      const side = sceneTableSide(area, game);
      assert.ok(sceneCanWalk(side, area), `${area}/${game}`);
      assert.equal(sceneNearestTable(side, area)?.game, game, `${area}/${game} is the nearest`);
    }
  assert.equal(sceneNearestTable({ x: 50, y: 42 }, 'lounge', 0.5), null);
});

/* ------------------------------------------------------------ banners */

const b = (id, kind, text = `t${id}`, extra = {}) => ({ id, kind, text, ...extra });

test('one banner at a time; the rest wait in order', () => {
  let q = pushBanner(EMPTY_BANNERS, b(1, 'success'));
  q = pushBanner(q, b(2, 'mail'));
  q = pushBanner(q, b(3, 'info'));
  assert.equal(q.current.id, 1);
  assert.deepEqual(q.queue.map((x) => x.id), [2, 3]);
  q = nextBanner(q, 1);
  assert.equal(q.current.id, 2);
  q = nextBanner(q, 99); // stale timer: ignored
  assert.equal(q.current.id, 2);
  q = nextBanner(nextBanner(q, 2), 3);
  assert.equal(q.current, null);
  assert.equal(nextBanner(q).current, null);
});

test('invites and my turn jump ahead of mail and plain messages', () => {
  let q = pushBanner(EMPTY_BANNERS, b(1, 'info'));
  q = pushBanner(q, b(2, 'success'));
  q = pushBanner(q, b(3, 'mail'));
  q = pushBanner(q, b(4, 'invite'));
  q = pushBanner(q, b(5, 'turn'));
  assert.deepEqual(q.queue.map((x) => x.id), [4, 5, 3, 2]);
});

test('an error takes the slot at once; the interrupted banner comes back next', () => {
  let q = pushBanner(EMPTY_BANNERS, b(1, 'mail'));
  q = pushBanner(q, b(2, 'info'));
  q = pushBanner(q, b(3, 'error'));
  assert.equal(q.current.id, 3);
  assert.deepEqual(q.queue.map((x) => x.id), [1, 2]);
  // Errors queue behind another error.
  q = pushBanner(q, b(4, 'error'));
  assert.equal(q.current.id, 3);
  assert.equal(q.queue[0].id, 4);
});

test('same key replaces instead of stacking; drop removes a subject everywhere', () => {
  let q = pushBanner(EMPTY_BANNERS, b(1, 'mail', '새 편지 1통', { key: 'mail' }));
  q = pushBanner(q, b(2, 'invite', 'a', { key: 'invite-x' }));
  q = pushBanner(q, b(3, 'mail', '새 편지 2통', { key: 'mail' }));
  assert.equal(q.current.text, '새 편지 2통');
  assert.deepEqual(q.queue.map((x) => x.id), [2]);
  q = dropBanners(q, 'invite-x');
  assert.equal(q.queue.length, 0);
  q = dropBanners(q, 'mail');
  assert.equal(q.current, null);
  assert.equal(dropBanners(q, 'nothing'), q);
});

test('the queue stays short (oldest low-priority banner goes first) and empty text is ignored', () => {
  let q = pushBanner(EMPTY_BANNERS, b(0, 'invite'));
  for (let i = 1; i <= BANNER_QUEUE_LIMIT + 3; i++) q = pushBanner(q, b(i, i === 4 ? 'turn' : 'info'));
  assert.equal(q.queue.length, BANNER_QUEUE_LIMIT);
  assert.ok(q.queue.some((x) => x.id === 4), 'high priority kept');
  assert.ok(!q.queue.some((x) => x.id === 1), 'oldest info dropped');
  assert.equal(pushBanner(q, b(99, 'info', '')), q);
  assert.ok(bannerDuration('error') > bannerDuration('info'));
  assert.ok(bannerDuration('invite') >= bannerDuration('mail'));
});
