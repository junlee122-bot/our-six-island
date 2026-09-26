// 무드 UI helpers: HUD moodles, tooltip, time left and "이러면 나아져요" tips.
import test from 'node:test';
import assert from 'node:assert/strict';
import { moodles, moodTips, moodTooltip, timeLeft } from '../app/lounge-mood-ui.ts';
import { emptyLife, ensureLifeMember, lifeView } from '../app/lounge-life.ts';

const T0 = Date.UTC(2026, 9, 1, 3);
const HOUR = 3_600_000;
function view(patch) {
  const me = crypto.randomUUID(),
    pal = crypto.randomUUID();
  const life = ensureLifeMember(ensureLifeMember(emptyLife(), me, 3), pal, 6);
  life.mood = { [me]: { n: [70, 100, 60, 60], at: T0, v: 60, ...patch.me }, ...(patch.pal ? { [pal]: { n: [50, 50, 50, 50], at: T0, v: 50, ...patch.pal } } : {}) };
  return lifeView(life, me, 3, T0).mood;
}

test('moodles: the three strongest effects, negatives marked, needs included', () => {
  const m = view({ me: { n: [5, 100, 60, 60], l: [['festival', T0 + HOUR], ['rain', T0 + HOUR], ['chat', T0 + HOUR]] } });
  const list = moodles(m);
  assert.equal(list.length, 3);
  assert.equal(list[0].key, 'festival');
  assert.ok(list.some((x) => x.key === 'need-food' && x.value === -6));
  assert.match(moodTooltip(m, T0), /^괜찮아요 \d+ · 축제에 참가했어요 \+10/);
  assert.equal(timeLeft(T0 + 40 * 60_000, T0), '40분');
  assert.equal(timeLeft(T0 + 2 * HOUR, T0), '2시간');
  assert.equal(timeLeft(T0 + 30_000, T0), '곧 사라져요');
});

test('tips: the cup first, then the lowest needs; a low friend asks for a cheer; never empty', () => {
  const base = { produce: { carrot: 2 }, fruit: 0, inv: {}, ate: false, online: [], now: T0 };
  const hungry = moodTips({ ...base, mood: view({ me: { n: [8, 20, 60, 60], cup: T0 } }) });
  assert.deepEqual(hungry.map((t) => t.action), ['tea', 'snack', 'rest']);
  assert.equal(hungry[1].item, 'carrot');
  const lonely = moodTips({ ...base, online: [6], mood: view({ me: { n: [90, 90, 30, 30] }, pal: { v: 22, n: [0, 0, 0, 0] } }) });
  assert.ok(lonely.some((t) => t.action === 'invite' && t.actor === 6));
  assert.ok(lonely.some((t) => t.action === 'cheer' && t.actor === 6));
  const fine = moodTips({ ...base, mood: view({ me: { n: [90, 90, 90, 90] } }) });
  assert.equal(fine.length, 1);
  assert.equal(fine[0].action, 'none');
});
