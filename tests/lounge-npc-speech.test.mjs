// The resident speech box (app/lounge/NpcTalkDialog.tsx on SpeechBox.tsx):
// hearts from relation points, the status next to the name, and the choices
// after the lines (app/lounge-npc-speech.ts). The rules behind the choices
// (one talk and one gift a day, where residents can be met) are covered in
// lounge-npc-stage1 / lounge-romance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPC_IDS, NPCS, NPC_POINTS_MAX, NPC_TALK_POINTS, npcLevel } from '../app/lounge-npc-data.ts';
import { npcSpot } from '../app/lounge-npc-schedule.ts';
import { GAME_MINUTE_MS, dayStart, gameTimeOnDay } from '../app/lounge-calendar.ts';
import { kstDay } from '../app/lounge-economy.ts';
import { npcHearts, npcTalkChoices, npcTalkFocus, npcTalkStatus } from '../app/lounge-npc-speech.ts';
import { npcTalk, npcTalkReply } from '../app/lounge-npc-dialog.ts';

const MIN = 60_000;
const T0 = Date.UTC(2026, 9, 1, 3); // 12:00 KST, Thursday 2026-10-01
const EMOJI = /\p{Extended_Pictographic}/u;
const LATIN = /[A-Za-z]/;

test('hearts: ten hearts over 0–120 points, like a friend’s row', () => {
  const cases = [
    [0, 0],
    [11, 0],
    [12, 1],
    [20, 1],
    [40, 3],
    [60, 5],
    [100, 8],
    [119, 9],
    [NPC_POINTS_MAX, 10],
    [999, 10],
    [-5, 0],
    [Number.NaN, 0],
  ];
  for (const [points, hearts] of cases) assert.equal(npcHearts(points), hearts, `${points} points`);
  let prev = 0;
  for (let p = 0; p <= NPC_POINTS_MAX; p++) {
    const h = npcHearts(p);
    assert.ok(h >= prev && h <= 10, `monotonic at ${p}`);
    prev = h;
  }
  // The level words start on distinct heart counts (1 · 3 · 5 · 8).
  assert.deepEqual([20, 40, 60, 100].map((p) => [npcLevel(p), npcHearts(p)]), [
    ['친구', 1],
    ['단골', 3],
    ['설레는 사이', 5],
    ['특별한 사이', 8],
  ]);
});

test('status: role, then what they are doing; a label that only names the workplace says 일하는 중', () => {
  assert.equal(npcTalkStatus('frieren', { label: '광장 벤치에서 별 보는 중', activity: 'stroll' }), '빵집 카페 사장 · 광장 벤치에서 별 보는 중');
  assert.equal(npcTalkStatus('frieren', { label: '빵집 카페', activity: 'work' }), '빵집 카페 사장 · 일하는 중');
  assert.equal(npcTalkStatus('lumi', { label: '별빛 카지노 딜러', activity: 'work' }), '별빛 카지노 딜러 · 일하는 중');
  assert.equal(npcTalkStatus('rose', { label: '카지노 대부 창구', activity: 'work' }), '카지노 대부 · 일하는 중');
  assert.equal(npcTalkStatus('nasera', { label: '농협 매입 창구', activity: 'work' }), '농협 조합장 · 농협 매입 창구');
  assert.equal(npcTalkStatus('thresh', { label: '잡화점', activity: 'rest' }), '잡화점 주인');
  assert.equal(npcTalkStatus('janna', { label: '  ', activity: 'work' }), '신문 기자');
  // Every resident, a week of real days at every half game hour: short, Korean, never the role twice.
  const start = dayStart(kstDay(T0));
  for (const npc of NPC_IDS)
    for (let t = start; t < start + 7 * 1440 * MIN; t += 30 * GAME_MINUTE_MS + 30 * MIN) {
      const s = npcTalkStatus(npc, npcSpot(npc, t));
      const role = NPCS[npc].role;
      assert.ok(s.startsWith(role), `${npc}: ${s}`);
      assert.equal(s.split(role).length - 1, 1, `${npc}: role repeated in "${s}"`);
      assert.ok(s.length <= 40, `${npc}: long status "${s}"`);
      assert.ok(!EMOJI.test(s) && !LATIN.test(s), `${npc}: "${s}"`);
    }
});

test('choices: talk, gift, notebook, today’s request, leave; done or unreachable ones stay listed but locked', () => {
  const base = { talked: false, gifted: false, busy: false, blocked: '' };
  const open = npcTalkChoices(base);
  assert.deepEqual(open.map((c) => c.id), ['talk', 'gift', 'book', 'bye']);
  assert.deepEqual(open.map((c) => c.label), [`이야기 나누기 · +${NPC_TALK_POINTS}`, '선물 주기', '주민 수첩', '그만 가기']);
  assert.ok(open.every((c) => !c.disabled));

  const withRequest = npcTalkChoices({ ...base, request: '당근 3개' });
  assert.deepEqual(withRequest.map((c) => c.id), ['talk', 'gift', 'book', 'request', 'bye']);
  assert.equal(withRequest[3].label, '부탁 보기 · 당근 3개');
  assert.ok(!withRequest[3].disabled);

  const done = npcTalkChoices({ ...base, talked: true, gifted: true });
  assert.deepEqual(done.map((c) => [c.label, c.disabled]), [
    ['오늘 대화 완료', true],
    ['오늘 선물 완료', true],
    ['주민 수첩', false],
    ['그만 가기', false],
  ]);

  // Out of reach (the server would refuse): talk and gift locked, the rest open.
  const far = npcTalkChoices({ ...base, blocked: '나세라에게 조금 더 가까이 가서 말을 걸어 주세요.' });
  assert.deepEqual(far.map((c) => c.disabled), [true, true, false, false]);
  assert.equal(far[0].label, `이야기 나누기 · +${NPC_TALK_POINTS}`);

  // While a talk or gift is on its way, neither can be sent again.
  const busy = npcTalkChoices({ ...base, busy: true });
  assert.deepEqual(busy.map((c) => c.disabled), [true, true, false, false]);

  for (const list of [open, withRequest, done, far, busy]) {
    assert.equal(new Set(list.map((c) => c.id)).size, list.length);
    assert.equal(list.at(-1).id, 'bye');
    for (const c of list) assert.ok(!EMOJI.test(c.label) && !LATIN.test(c.label), c.label);
  }
});

test('focus: holding E talks, then leaves; it never lands on a gift or another window by itself', () => {
  const base = { talked: false, gifted: false, busy: false, blocked: '' };
  const idOf = (list, after) => list[npcTalkFocus(list, after)]?.id;
  const open = npcTalkChoices(base);
  assert.equal(idOf(open), 'talk');
  assert.equal(idOf(open, 'open'), 'talk');
  assert.equal(idOf(open, 'reply'), 'bye');
  assert.equal(idOf(open, 'picker'), 'gift');
  const talked = npcTalkChoices({ ...base, talked: true, request: '당근 3개' });
  assert.equal(idOf(talked, 'open'), 'bye');
  assert.equal(idOf(talked, 'reply'), 'bye');
  assert.equal(idOf(talked, 'picker'), 'gift');
  const far = npcTalkChoices({ ...base, blocked: '멀어요' });
  assert.equal(idOf(far, 'open'), 'bye');
  assert.equal(idOf(far, 'picker'), 'bye');
  for (const list of [open, talked, far])
    for (const after of ['open', 'reply', 'picker']) assert.ok(!list[npcTalkFocus(list, after)].disabled, `${after}: focus on a locked choice`);
});

test('talk answer: never a line already said in the box, the same on every screen', () => {
  let checked = 0;
  for (const npc of NPC_IDS)
    for (let d = 0; d < 6; d++)
      for (const points of [0, 30, 70, 110]) {
        const now = gameTimeOnDay(kstDay(T0) + d, 9 + d * 2);
        const spot = npcSpot(npc, now);
        const ctx = { npc, me: '민서', who: 2, now, points, spot, lastGiftName: d % 2 ? '당근' : undefined };
        const opening = npcTalk({ ...ctx, talkedToday: false }).lines;
        const reply = npcTalkReply({ ...ctx, points: points + NPC_TALK_POINTS }, opening);
        assert.ok(reply && !opening.includes(reply), `${npc} day ${d} ${points}: "${reply}" repeats the opening`);
        assert.equal(npcTalkReply({ ...ctx, points: points + NPC_TALK_POINTS }, [...opening]), reply, `${npc}: not deterministic`);
        assert.ok(!/[{}]/.test(reply) && !EMOJI.test(reply), `${npc}: "${reply}"`);
        // After a gift and then the talk, nothing said earlier comes back either.
        const later = npcTalkReply(ctx, [...opening, reply, '고마워. 잘 쓸게.']);
        assert.ok(later && ![...opening, reply].includes(later), `${npc}: "${later}" said twice`);
        checked++;
      }
  assert.ok(checked >= NPC_IDS.length * 24);
  // Nothing new left to say: the "we talked today" line instead of a repeat.
  const ctx = { npc: 'frieren', me: '민서', who: 2, now: T0, points: 0, spot: null };
  const everything = [];
  for (let i = 0; i < 200; i++) {
    const r = npcTalkReply(ctx, everything);
    if (everything.includes(r)) break;
    everything.push(r);
  }
  assert.equal(npcTalkReply(ctx, everything), npcTalk({ ...ctx, talkedToday: true }).lines[0]);
});
