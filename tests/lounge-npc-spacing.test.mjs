import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_DAY_MS,
  GAME_MINUTE_MS,
  gameDay,
} from '../app/lounge-calendar.ts';
import { NPC_IDS } from '../app/lounge-npc-data.ts';
import {
  NPC_HOME_DEPARTURE_SPREAD_MS,
  NPC_WALK_SPEED,
  npcCanStand,
  npcDayStart,
  npcSpot,
  npcTimeline,
  npcWalkSpeed,
  walkPath,
} from '../app/lounge-npc-schedule.ts';
import { npcMeetAt, assertNpcSocialContext } from '../app/lounge-romance.ts';
import { villageToNetwork } from '../app/lounge-village-layout.ts';
import { regionToNetwork } from '../app/lounge-areas.ts';

const START = npcDayStart(gameDay(Date.UTC(2026, 10, 25, 3)));
const OPEN = { hill: true, ranch: true, foothill: true };

test('residents keep individual bounded paces and finish the night within a short departure window', () => {
  const speeds = NPC_IDS.map(npcWalkSpeed);
  assert.equal(new Set(speeds).size, NPC_IDS.length);
  assert.ok(
    speeds.every((v) => v >= NPC_WALK_SPEED * 0.85 && v <= NPC_WALK_SPEED),
  );
  const departures = ['lumi', 'rose', 'realtor', 'misun'].map(
    (id) => npcTimeline(id, gameDay(START), OPEN)[0].t1,
  );
  assert.equal(new Set(departures).size, departures.length);
  for (const at of departures) {
    assert.ok(at >= START + 60 * GAME_MINUTE_MS);
    assert.ok(at < START + 60 * GAME_MINUTE_MS + NPC_HOME_DEPARTURE_SPREAD_MS);
  }
});

test('the shared night route no longer carries a stacked crowd for most of a minute', () => {
  let crowdSeconds = 0,
    longestOverlap = 0,
    stackedHosts = 0;
  const overlaps = new Map();
  for (let now = START; now < START + 3 * GAME_DAY_MS; now += 1000) {
    const spots = NPC_IDS.map((id) => npcSpot(id, now, OPEN)).filter(
      (s) => s.visible && s.walking,
    );
    const degree = new Map(),
      close = new Set();
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i],
          b = spots[j];
        if (a.area !== b.area) continue;
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        if (d < 0.85) {
          degree.set(a.id, (degree.get(a.id) ?? 0) + 1);
          degree.set(b.id, (degree.get(b.id) ?? 0) + 1);
        }
        if (d >= 0.15) continue;
        const key = [a.id, b.id].sort().join(':');
        close.add(key);
        const seconds = (overlaps.get(key) ?? 0) + 1;
        overlaps.set(key, seconds);
        longestOverlap = Math.max(longestOverlap, seconds);
        if (key === 'lumi:rose') stackedHosts++;
      }
    if ([...degree.values()].some((n) => n >= 2)) crowdSeconds++;
    for (const key of overlaps.keys())
      if (!close.has(key)) overlaps.delete(key);
  }
  // Passing at a corner is fine; the old route stacked hosts for 36 seconds
  // and held a three-person group together for 50 seconds in this fixture.
  assert.equal(stackedHosts, 0);
  assert.ok(longestOverlap <= 8, `${longestOverlap} seconds overlapping`);
  assert.ok(crowdSeconds <= 10, `${crowdSeconds} seconds in a crowd`);
});

test('individual walking lines keep original endpoints and every added segment stays walkable', () => {
  let changed = 0;
  for (const world of [{}, OPEN])
    for (let day = 0; day < 7; day++)
      for (const id of NPC_IDS) {
        const d = gameDay(START + day * 86_400_000);
        for (const e of npcTimeline(id, d, world).filter(
          (x) => x.k === 'walk',
        )) {
          const first = e.pts[0],
            last = e.pts.at(-1);
          const base = walkPath(e.area, first, last);
          assert.deepEqual(e.pts[0], base[0]);
          assert.deepEqual(last, base.at(-1));
          assert.equal(e.speed, npcWalkSpeed(id));
          assert.equal(e.t1 - e.t0, Math.ceil((e.cum.at(-1) / e.speed) * 1000));
          for (let i = 1; i < e.pts.length; i++) {
            const a = e.pts[i - 1],
              b = e.pts[i];
            // Existing grid paths have a few sub-cell tangencies. Check all
            // newly introduced edges, without loosening the base path tests.
            if (
              base.some(
                (p, k) =>
                  k &&
                  p.x === b.x &&
                  p.z === b.z &&
                  base[k - 1].x === a.x &&
                  base[k - 1].z === a.z,
              )
            )
              continue;
            changed++;
            const n = Math.max(
              1,
              Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.15),
            );
            for (let k = 0; k <= n; k++)
              assert.ok(
                npcCanStand(e.area, {
                  x: a.x + ((b.x - a.x) * k) / n,
                  z: a.z + ((b.z - a.z) * k) / n,
                }),
                `${id}: ${e.area} route to ${e.to}`,
              );
          }
        }
      }
  assert.ok(changed > 100, 'residents use separated walking lines');
});

test('a moving resident can be spoken to at the displayed walking line, with the same server reach', () => {
  const met = new Set();
  let checked = 0;
  for (let now = START; now < START + GAME_DAY_MS; now += 13_000)
    for (const id of NPC_IDS) {
      const s = npcSpot(id, now, OPEN);
      if (
        !s.visible ||
        !s.walking ||
        ![
          'village',
          'market',
          'harbor',
          'hillside',
          'ranch',
          'foothill',
          'farm',
        ].includes(s.area)
      )
        continue;
      const meet = npcMeetAt(id, now, OPEN);
      assert.deepEqual(meet.point, { x: s.x, z: s.z });
      const net =
        s.area === 'village' ? villageToNetwork(s) : regionToNetwork(s.area, s);
      const ctx = { ...net, ...OPEN, area: s.area, actor: 0, fishing: false };
      const action = { kind: 'npcSocial', op: 'talk', npc: id };
      assert.doesNotThrow(() => assertNpcSocialContext(action, {}, ctx, now));
      const far = { x: s.x + 12, z: s.z + 12 };
      const farNet =
        s.area === 'village'
          ? villageToNetwork(far)
          : regionToNetwork(s.area, far);
      assert.throws(
        () => assertNpcSocialContext(action, {}, { ...ctx, ...farNet }, now),
        /가까이/,
      );
      met.add(id);
      checked++;
    }
  assert.ok(checked > 100);
  assert.ok(met.size >= 20);
});
