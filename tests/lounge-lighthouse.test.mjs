// 범마을 등대 (lounge-lighthouse.ts, lounge-lighthouse-layout.ts): the harbor
// door, entering and leaving, the stair between the two floors, the logbook
// pages, the night lamp and the once-a-day 바다 바라보기.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BEAM_TURN_MS,
  LIGHTHOUSE_AREAS,
  LIGHTHOUSE_PLACE,
  LIGHTHOUSE_STORY,
  LOGBOOK_PAGES,
  isLighthouseArea,
  lighthouseBeamAngle,
  lighthouseLampLit,
  lighthouseStory,
  logbookPage,
  logbookPages,
  otherFloor,
  rarestCatch,
} from '../app/lounge-lighthouse.ts';
import {
  BALCONY_FRONT,
  LAMP_FRONT,
  LIGHTHOUSE_ITEMS,
  LIGHTHOUSE_STAIR,
  LOGBOOK_FRONT,
  STAIR_FRONT,
  STAIR_REACH,
  lighthouseCanWalk,
  lighthouseHover,
  lighthouseTouch,
  nearBalcony,
  stairArrival,
  walksIntoStair,
} from '../app/lounge-lighthouse-layout.ts';
import { INTERIOR_DOOR, INTERIOR_DOOR_REACH, INTERIOR_ROOM, hasDoor, interiorAction, interiorArrival, interiorCanWalk, interiorPath } from '../app/lounge-interior-layout.ts';
import { AREAS, AREA_DEFAULTS, chatScope, moveClamp } from '../app/lounge-games.ts';
import { INTERIOR_AREAS, VENUES } from '../app/lounge-venues.ts';
import { LIGHTHOUSE_DOOR, SHOP_DOOR_REACH, districtCounters, lighthouseDoorOutside } from '../app/lounge-district-counters.ts';
import { districtFriendPins, districtMinimap } from '../app/lounge-district-minimap.ts';
import { villageFriendPins } from '../app/lounge-village-minimap.ts';
import { HARBOR_COLLIDERS, HARBOR_LIGHTHOUSE } from '../app/lounge-harbor-layout.ts';
import { REGIONS, regionToNetwork } from '../app/lounge-areas.ts';
import { gameTimeOnDay, weatherOf } from '../app/lounge-calendar.ts';
import { FISH_BY_ID } from '../app/lounge-items.ts';
import { kstDay, newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { MOODLETS, MOOD_REJECT } from '../app/lounge-mood-data.ts';

const D = 20_734; // a KST day (2026-10-08)

// ---------------------------------------------------------------- door, enter and leave
test('door: the harbor lighthouse door leads in; the minimap pin says it can be entered', () => {
  const doors = districtCounters('harbor', 1).filter((c) => c.a.kind === 'counter' && c.a.place === 'lighthouse');
  assert.equal(doors.length, 1);
  const door = doors[0];
  assert.equal(door.a.enter, 'lighthouse');
  assert.equal(door.a.label, '범마을 등대 들어가기');
  assert.deepEqual({ x: door.x, z: door.z }, { ...LIGHTHOUSE_DOOR });
  // You can stand at the door and on the way out (not inside the tower or the sea).
  const walk = REGIONS.harbor;
  const free = (p) => !HARBOR_COLLIDERS.some((c) => (c.shape === 'circle' ? Math.hypot(p.x - c.x, p.z - c.z) < c.r + 0.3 : Math.abs(p.x - c.x) < c.w / 2 + 0.3 && Math.abs(p.z - c.z) < c.d / 2 + 0.3));
  assert.ok(free(LIGHTHOUSE_DOOR), 'the door touch is clear of the tower');
  const out = lighthouseDoorOutside();
  assert.equal(out.district, 'harbor');
  assert.ok(free(out.at), 'out in front of the door is clear');
  assert.ok(Math.hypot(out.at.x - door.x, out.at.z - door.z) > SHOP_DOOR_REACH, 'outside, past the door reach');
  assert.ok(Math.abs(out.at.x - HARBOR_LIGHTHOUSE.x) < 0.01);
  assert.ok(walk.bounds, 'the harbor region exists');
  // The harbor minimap: a door pin on the tower whose title says it opens.
  const map = districtMinimap('harbor', 1);
  const pin = map.places.find((p) => p.id === 'lighthouse');
  assert.ok(pin, 'lighthouse pin');
  assert.equal(pin.kind, 'door');
  assert.equal(pin.label, '등대');
  assert.match(pin.title, /들어갈 수 있어요/);
  assert.deepEqual({ x: pin.x, z: pin.z }, { x: HARBOR_LIGHTHOUSE.x, z: HARBOR_LIGHTHOUSE.z });
});

test('enter and leave data: two interior floors; arrive inside the door or beside the stair', () => {
  assert.deepEqual([...LIGHTHOUSE_AREAS], ['lighthouse', 'lighthouseTop']);
  assert.equal(LIGHTHOUSE_PLACE, 'harbor-lighthouse');
  for (const a of LIGHTHOUSE_AREAS) {
    assert.ok(AREAS.includes(a));
    assert.ok(INTERIOR_AREAS.includes(a));
    assert.ok(isLighthouseArea(a));
    assert.equal(VENUES[a].music, 'harbor');
    assert.equal(chatScope(a), a);
    // Interior floor clamp (not the whole outdoor map).
    assert.deepEqual(moveClamp(a, 2, 99), { x: 15, y: 88 });
    // Where the server puts you without coordinates is where the client arrives.
    assert.deepEqual(AREA_DEFAULTS[a], interiorArrival(a));
    assert.ok(interiorCanWalk(interiorArrival(a), a));
    assert.equal(otherFloor(otherFloor(a)), a);
  }
  assert.equal(isLighthouseArea('harbor'), false);
  // 1층 has the shared door; the lamp room has none (its left wall is solid).
  assert.equal(hasDoor('lighthouse'), true);
  assert.equal(hasDoor('lighthouseTop'), false);
  const inside = interiorArrival('lighthouse');
  assert.ok(Math.hypot(inside.x - INTERIOR_DOOR.x, inside.y - INTERIOR_DOOR.y) > INTERIOR_DOOR_REACH, 'arrive past 나가기');
  assert.ok(interiorCanWalk({ x: INTERIOR_DOOR.x + 1, y: INTERIOR_DOOR.y }, 'lighthouse'), 'the way to the door is open');
  assert.deepEqual(interiorAction(INTERIOR_DOOR, 'lighthouse'), { kind: 'door' });
  assert.equal(interiorAction(INTERIOR_DOOR, 'lighthouseTop'), null);
  // Friends inside show at the tower on the harbor map and at the harbor gate on the hub's.
  const players = [{ id: 'p1', actor: 2, area: 'lighthouseTop', x: 50, y: 70 }];
  const pins = districtFriendPins(players, 'me', 'harbor');
  assert.equal(pins.length, 1);
  assert.equal(pins[0].indoor, true);
  assert.match(pins[0].location, /범마을 등대 꼭대기/);
  assert.match(villageFriendPins(players, 'me')[0].location, /범마을 등대/);
});

test('stair: E at its foot or walking on into the stairwell changes floors; arrival is past its reach', () => {
  for (const a of LIGHTHOUSE_AREAS) {
    assert.ok(interiorCanWalk(STAIR_FRONT, a), `${a}: the stair foot is walkable`);
    assert.deepEqual(lighthouseTouch(STAIR_FRONT, a), { kind: 'stair', to: otherFloor(a) });
    assert.deepEqual(interiorAction(STAIR_FRONT, a), { kind: 'lighthouse', touch: { kind: 'stair', to: otherFloor(a) } });
    const arrive = stairArrival(a);
    assert.ok(interiorCanWalk(arrive, a), `${a}: arrival is walkable`);
    assert.ok(Math.hypot(arrive.x - STAIR_FRONT.x, arrive.y - STAIR_FRONT.y) > STAIR_REACH, `${a}: arrival is past the stair's reach`);
    assert.equal(interiorAction(arrive, a), null);
    // Clicking the stair walks to its foot.
    const column = { x: LIGHTHOUSE_STAIR.x * 5 + 50, y: LIGHTHOUSE_STAIR.z * 5 + 65 };
    assert.deepEqual(lighthouseHover(column, a), { touch: { kind: 'stair', to: otherFloor(a) }, go: STAIR_FRONT });
    assert.equal(lighthouseCanWalk(column, a), false, 'the stair column is solid');
    // A route from the arrival to every touch spot exists.
    assert.ok(interiorPath(arrive, STAIR_FRONT, a).length >= 1);
  }
  // Toward the column from the foot takes the stair; walking away does not.
  const toward = { x: LIGHTHOUSE_STAIR.x * 5 + 50 - STAIR_FRONT.x, y: LIGHTHOUSE_STAIR.z * 5 + 65 - STAIR_FRONT.y };
  assert.equal(walksIntoStair(STAIR_FRONT, toward), true);
  assert.equal(walksIntoStair(STAIR_FRONT, { x: -toward.x, y: -toward.y }), false);
  assert.equal(walksIntoStair({ x: 30, y: 80 }, toward), false);
});

test('rooms: the logbook on 1층, the lamp and the balcony upstairs; every piece inside the room', () => {
  assert.ok(interiorCanWalk(LOGBOOK_FRONT, 'lighthouse'));
  assert.deepEqual(lighthouseTouch(LOGBOOK_FRONT, 'lighthouse'), { kind: 'logbook' });
  assert.equal(lighthouseTouch(LOGBOOK_FRONT, 'lighthouseTop'), null, 'no logbook upstairs');
  assert.ok(interiorCanWalk(LAMP_FRONT, 'lighthouseTop'));
  assert.deepEqual(lighthouseTouch(LAMP_FRONT, 'lighthouseTop'), { kind: 'lamp' });
  assert.ok(interiorCanWalk(BALCONY_FRONT, 'lighthouseTop'));
  assert.deepEqual(lighthouseTouch(BALCONY_FRONT, 'lighthouseTop'), { kind: 'seaView' });
  assert.equal(nearBalcony(BALCONY_FRONT, 'lighthouse'), false);
  assert.equal(nearBalcony({ x: 50, y: 60 }, 'lighthouseTop'), false);
  for (const a of LIGHTHOUSE_AREAS)
    for (const it of LIGHTHOUSE_ITEMS[a]) {
      assert.ok(it.x - it.w / 2 >= INTERIOR_ROOM.minX - 0.01 && it.x + it.w / 2 <= INTERIOR_ROOM.maxX + 0.01, `${a} ${it.id} x`);
      assert.ok(it.z - it.d / 2 >= INTERIOR_ROOM.minZ - 0.01 && it.z + it.d / 2 <= INTERIOR_ROOM.maxZ + 0.01, `${a} ${it.id} z`);
    }
});

// ---------------------------------------------------------------- logbook
const stormDay = () => {
  for (let d = D; d < D + 400; d++) if (weatherOf(d) === 'storm') return d;
  throw new Error('no storm day');
};
test('logbook: one page per real day from weather, the boat, this week\'s catches and storm warnings', () => {
  const catches = [
    { actor: 0, top: [{ fish: 'crucian', cm: 20 }, { fish: 'koi', cm: 55 }] },
    { actor: 3, top: [{ fish: 'carp', cm: 60 }] },
    { actor: 9, top: [{ fish: 'minnow', cm: 9 }] },
  ];
  const rare = rarestCatch(catches);
  assert.equal(rare.fish, 'koi', 'the lowest catch weight wins');
  assert.equal(rare.actor, 0);
  assert.equal(rarestCatch([]), null);
  assert.equal(rarestCatch([{ actor: 1, top: [{ fish: 'not-a-fish', cm: 5 }] }]), null);

  const day = stormDay() - 1 === D ? D + 1 : D;
  const page = logbookPage({ day, today: day, catches, sailing: [1, 4] });
  assert.equal(page.day, day);
  assert.match(page.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(page.title, /월 .*일 \(.\) 바다 일지/);
  const kinds = page.lines.map((l) => l.kind);
  for (const k of ['weather', 'voyage', 'fish', 'storm', 'note']) assert.ok(kinds.includes(k), k);
  assert.ok(page.lines.find((l) => l.kind === 'fish').text.includes(FISH_BY_ID.koi.name));
  assert.ok(page.lines.find((l) => l.kind === 'fish').text.includes('도원'));
  if (!page.storm) assert.ok(page.lines.some((l) => l.text.includes('지금 바다에 나간 친구: 강재, 민재')));
  // Deterministic: the same day reads the same on every screen.
  assert.deepEqual(logbookPage({ day, today: day, catches, sailing: [1, 4] }), page);
  // An older page has no "this week" fish line and no friends at sea.
  const older = logbookPage({ day: day - 1, today: day, catches, sailing: [1, 4] });
  assert.ok(!older.lines.some((l) => l.kind === 'fish'));
  assert.ok(!older.lines.some((l) => l.text.includes('지금 바다에')));
  // Pages: today first, then back LOGBOOK_PAGES - 1 days.
  const pages = logbookPages({ today: day, catches });
  assert.equal(pages.length, LOGBOOK_PAGES);
  assert.deepEqual(pages.map((p) => p.day), Array.from({ length: LOGBOOK_PAGES }, (_, i) => day - i));
});

test('logbook: storm days say the boat is off and warn; the day before warns ahead', () => {
  const s = stormDay();
  const storm = logbookPage({ day: s, today: s });
  assert.equal(storm.storm, true);
  assert.ok(storm.lines.some((l) => l.kind === 'voyage' && l.text.includes('결항')));
  assert.ok(storm.lines.some((l) => l.kind === 'storm' && l.text.includes('폭풍 경보')));
  if (weatherOf(s - 1) !== 'storm') {
    const eve = logbookPage({ day: s - 1, today: s - 1 });
    assert.ok(eve.lines.some((l) => l.kind === 'storm' && l.text.includes('내일 폭풍')));
    assert.ok(eve.lines.some((l) => l.kind === 'voyage' && l.text.includes('매시 출항')));
  }
});

test('story slot: empty for now; entries show in the logbook once their flags and day are reached', () => {
  assert.deepEqual([...LIGHTHOUSE_STORY], []);
  const entries = [
    { id: 'a3-lamp', kind: 'letter', title: '촌장의 편지', lines: ['등대에 다시 불을 켜세.'], needs: { flags: ['act3'], fromDay: D } },
    { id: 'always', kind: 'event', title: '등대의 밤', lines: ['모두 모였다.'] },
  ];
  assert.deepEqual(lighthouseStory({ day: D, flags: [] }, entries).map((e) => e.id), ['always']);
  assert.deepEqual(lighthouseStory({ day: D - 1, flags: ['act3'] }, entries).map((e) => e.id), ['always']);
  assert.deepEqual(lighthouseStory({ day: D, flags: ['act3'] }, entries).map((e) => e.id), ['a3-lamp', 'always']);
  const page = logbookPage({ day: D, today: D, flags: ['act3'], story: entries });
  assert.equal(page.lines.filter((l) => l.kind === 'story').length, 2);
  assert.ok(page.lines.some((l) => l.text.startsWith('✉ 촌장의 편지')));
});

// ---------------------------------------------------------------- the lamp
test('night lamp: lit from game 18:00 to 06:00; the beam turns at one shared speed', () => {
  assert.equal(lighthouseLampLit(gameTimeOnDay(D, 17, 59)), false);
  assert.equal(lighthouseLampLit(gameTimeOnDay(D, 18, 0)), true);
  assert.equal(lighthouseLampLit(gameTimeOnDay(D, 23, 30)), true);
  assert.equal(lighthouseLampLit(gameTimeOnDay(D, 0, 10)), true);
  assert.equal(lighthouseLampLit(gameTimeOnDay(D, 5, 59)), true);
  assert.equal(lighthouseLampLit(gameTimeOnDay(D, 6, 0)), false);
  assert.equal(lighthouseLampLit(gameTimeOnDay(D, 12, 0)), false);
  const t = gameTimeOnDay(D, 20, 0);
  const a = lighthouseBeamAngle(t);
  assert.ok(a >= 0 && a < Math.PI * 2);
  assert.ok(Math.abs(lighthouseBeamAngle(t + BEAM_TURN_MS) - a) < 1e-9, 'one full turn per BEAM_TURN_MS');
  assert.ok(Math.abs(lighthouseBeamAngle(t + BEAM_TURN_MS / 4) - ((a + Math.PI / 2) % (Math.PI * 2))) < 1e-9);
  assert.ok(lighthouseBeamAngle(-1) >= 0, 'never negative');
});

// ---------------------------------------------------------------- server
const T0 = Date.UTC(2026, 9, 8, 14, 57, 0); // Thursday 23:57 KST (the next real day is minutes away)
function server() {
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = T0;
  const person = (actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), code: '', epoch: 0, sequence: 0 });
  const run = async (p, op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}), ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
    const r = cloudTransition(state, p, command, await commandHash(command), now);
    state = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    validateLedger(state.ledger);
    return r.response;
  };
  return {
    person,
    run,
    act: (p, a) => run(p, 'action', { action: a }),
    get state() {
      return state;
    },
    later(ms) {
      now += ms;
    },
  };
}
const meIn = (r, p) => r.packet?.players.find((x) => x.id === p.id);

test('server: the lighthouse opens with the harbor; walk in, climb, come down and leave', async () => {
  const h = server();
  const a = h.person(0);
  await h.run(a, 'wallet');
  await h.run(a, 'open', { code: 'BEMTADUVLY' });
  let r = await h.act(a, { kind: 'area', area: 'lighthouse', ...INTERIOR_DOOR });
  assert.ok(r.error, 'refused before the harbor flag');
  h.state.life.flags = ['district-harbor'];
  const outside = regionToNetwork('harbor', LIGHTHOUSE_DOOR);
  r = await h.act(a, { kind: 'area', area: 'harbor', ...outside });
  assert.equal(r.ok, true, r.error);
  r = await h.act(a, { kind: 'area', area: 'lighthouse', ...interiorArrival('lighthouse') });
  assert.equal(r.ok, true, r.error);
  assert.equal(meIn(r, a).area, 'lighthouse');
  r = await h.act(a, { kind: 'area', area: 'lighthouseTop', ...stairArrival('lighthouseTop') });
  assert.equal(r.ok, true, r.error);
  assert.equal(meIn(r, a).area, 'lighthouseTop');
  r = await h.act(a, { kind: 'reaction', id: 'laugh', scope: 'lighthouseTop' });
  assert.equal(r.ok, true, r.error);
  r = await h.act(a, { kind: 'area', area: 'lighthouse', ...stairArrival('lighthouse') });
  assert.equal(r.ok, true, r.error);
  const back = regionToNetwork('harbor', lighthouseDoorOutside().at);
  r = await h.act(a, { kind: 'area', area: 'harbor', ...back });
  assert.equal(r.ok, true, r.error);
  assert.equal(meIn(r, a).area, 'harbor');
});

test('server: 바다 바라보기 calms the mood once a real day, only at the lamp room rail; no 범', async () => {
  assert.ok(MOODLETS.seaView.value > 0 && MOODLETS.seaView.value <= 3, 'a tiny calm');
  const h = server();
  const a = h.person(0);
  await h.run(a, 'wallet');
  await h.run(a, 'open', { code: 'BEMTADUVLY' });
  h.state.life.flags = ['district-harbor'];
  // Downstairs: refused.
  await h.act(a, { kind: 'area', area: 'lighthouse', ...interiorArrival('lighthouse') });
  let r = await h.act(a, { kind: 'seaView' });
  assert.match(r.error ?? '', /난간/);
  // Upstairs but away from the rail: refused.
  await h.act(a, { kind: 'area', area: 'lighthouseTop', ...stairArrival('lighthouseTop') });
  r = await h.act(a, { kind: 'seaView' });
  assert.match(r.error ?? '', /난간/);
  // At the rail: the moodlet, once.
  await h.act(a, { kind: 'move', ...BALCONY_FRONT });
  const ledger = JSON.stringify(h.state.ledger);
  r = await h.act(a, { kind: 'seaView' });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.life.mood.seaView, true);
  assert.ok(r.life.mood.lets.some((l) => l.id === 'seaView'));
  assert.equal(JSON.stringify(h.state.ledger), ledger, 'no economy impact');
  h.later(60_000);
  r = await h.act(a, { kind: 'seaView' });
  assert.equal(r.error, MOOD_REJECT.seaViewDone);
  // The next real day it works again.
  h.later(2 * 60_000);
  assert.equal(kstDay(T0 + 3 * 60_000), kstDay(T0) + 1);
  r = await h.act(a, { kind: 'seaView' });
  assert.equal(r.ok, true, r.error);
});
