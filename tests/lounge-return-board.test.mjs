import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyLife,
  ensureLifeMember,
  lifeAction,
  lifeView,
} from '../app/lounge-life.ts';
import { addCropQ, itemCount } from '../app/lounge-life-plus.ts';
import { needHave } from '../app/lounge-life-ui.ts';
import {
  newLoungeLedger,
  registerWallet,
  kstDay,
} from '../app/lounge-economy.ts';
import { gameTimeOnDay } from '../app/lounge-calendar.ts';
import { NPC_TALK } from '../app/npc-talk/index.ts';
import { nextChapter, registerTalkBooks } from '../app/lounge-npc-talk.ts';
import {
  returnBoardItems,
  returnBoardStoryNpcs,
} from '../app/lounge-return-board.ts';

registerTalkBooks(NPC_TALK);
const NOW = Date.UTC(2026, 10, 11, 3);
const DAY = 86_400_000;
function player(actor = 7, now = NOW) {
  const member = { id: crypto.randomUUID(), actor };
  const life = ensureLifeMember(emptyLife(), member.id, actor);
  return { member, life, view: lifeView(life, member.id, actor, now) };
}
const rows = (view, kind, now = NOW) =>
  returnBoardItems(view, 7, now).filter((item) => item.kind === kind);
const readyPlot = (extra = {}) => ({
  crop: 'carrot',
  plantedAt: NOW - DAY,
  readyAt: NOW - 1,
  ready: true,
  stage: 3,
  ...extra,
});
const sitePlot = (t, extra = {}) => ({ t, c: 'carrot', g: 4, r: 1, ...extra });

test('new players and an absent/old-server view do not acquire invented unfinished tasks', () => {
  const { view } = player();
  assert.deepEqual(returnBoardItems(view, 7, NOW), []);
  assert.deepEqual(returnBoardStoryNpcs(view), []);
  assert.equal(view.myday.left, 2); // ordinary daily chances are not a backlog
  delete view.myday;
  delete view.farmx;
  delete view.farmSites;
  assert.deepEqual(returnBoardItems(view, 7, NOW), []);
  assert.deepEqual(returnBoardItems(null, 7, NOW), []);
  assert.deepEqual(returnBoardItems(view, 8, NOW), []);
});

test('harvest tasks use projected server readiness, exclude locked/dead/expired crops and friends fields', () => {
  const { view } = player();
  view.me.farm = [
    readyPlot(),
    readyPlot(),
    readyPlot({ locked: true }),
    readyPlot({ dead: 'carrot' }),
    readyPlot({ crop: null }),
    readyPlot({ ready: false, readyAt: NOW - 10 }),
    readyPlot({ witherAt: NOW }),
  ];
  view.housesPlotsPublic['another-player'] = [
    { tile: 0, crop: 'carrot', stage: 3, needsWater: false },
  ];
  const before = structuredClone(view);
  const tasks = rows(view, 'harvest');
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].count, 2);
  assert.deepEqual(tasks[0].destination, { kind: 'field', actor: 7 });
  assert.deepEqual(
    view,
    before,
    'indexing cannot mutate a save or a server snapshot',
  );
  view.me.farm = [];
  assert.equal(
    rows(view, 'harvest').length,
    0,
    'finishing the original work removes its task',
  );
});

test('common and greenhouse harvests include only communal crops and this players authorized plots', () => {
  const { view } = player();
  view.farmSites = {
    sites: [
      {
        id: 'L1',
        k: 'greenhouse',
        t: 1,
        p: [
          sitePlot(0),
          sitePlot(1, { o: 7 }),
          sitePlot(2, { o: 0 }),
          sitePlot(3, { d: 'carrot' }),
        ],
      },
      { id: 'P7', k: 'greenhouseMini', t: 1, o: 7, p: [sitePlot(0)] },
      { id: 'P0', k: 'greenhouseMini', t: 1, o: 0, p: [sitePlot(0)] },
      { id: 'Q7', k: 'greenhouseMini', t: 0, o: 7, p: [sitePlot(0)] },
    ],
    field: {
      till: [0, 1],
      p: [sitePlot(0), sitePlot(1, { d: 'carrot' })],
      giants: [],
    },
    store: [],
    goal: { n: 0, need: 1, by: [], crop: 'carrot' },
    slots: 4,
  };
  const tasks = rows(view, 'harvest');
  assert.deepEqual(
    tasks.map((x) => [x.id, x.count]),
    [
      ['harvest-common', 1],
      ['harvest-site-L1', 2],
      ['harvest-site-P7', 1],
    ],
  );
  assert.deepEqual(tasks[0].open, { kind: 'commonField' });
  assert.deepEqual(tasks[1].destination, { kind: 'site', site: 'L1' });
});

test('processing completion requires an actual output and its fixed server deadline', () => {
  const { view } = player();
  view.farmx.machines = [
    { slot: 0, kind: 'jar', out: 'jar-carrot', n: 1, doneAt: NOW },
    { slot: 1, kind: 'keg', out: 'keg-grape', n: 1, doneAt: NOW + 1 },
    { slot: 2, kind: 'jar', doneAt: NOW - 1 },
    { slot: 3, kind: 'jar', out: 'jar-carrot' },
    { slot: 4, kind: 'jar', out: 'jar-carrot', doneAt: NaN },
    { slot: 5, kind: 'jar', out: 'jar-carrot', n: 0, doneAt: NOW },
  ];
  assert.deepEqual(
    rows(view, 'processing').map((x) => x.id),
    ['processing-0'],
  );
  assert.deepEqual(
    rows(view, 'processing', NOW + 1).map((x) => x.id),
    ['processing-0', 'processing-1'],
  );
  assert.equal(
    rows(view, 'processing', NOW + 100 * DAY).length,
    2,
    'absence does not fabricate repeated batches',
  );
  assert.deepEqual(rows(view, 'processing')[0].open, {
    kind: 'farm',
    page: 'works',
  });
  delete view.farmx.machines[0].out;
  assert.equal(
    rows(view, 'processing').length,
    0,
    'collection is reflected without a second task ledger',
  );
});

test('story readiness respects all nextChapter gates and excludes a not-yet-loaded book', () => {
  const original = NPC_TALK.lumi;
  const need = {
    points: 12,
    days: 2,
    visit: { area: 'village', from: 18, to: 21 },
    bring: { item: 'carrot' },
    mem: 'test-promise',
    love: 'dating',
  };
  const book = { ...original, chapters: [{ ...original.chapters[0], need }] };
  registerTalkBooks({ lumi: book });
  try {
    const { view } = player();
    const row = {
      npc: 'lumi',
      points: 12,
      tc: 2,
      ch: 0,
      vis: 1,
      mem: ['test-promise'],
      love: 'dating',
    };
    view.me.npcRelations = [row];
    view.me.bag.produce.carrot = 1;
    assert.equal(rows(view, 'story').length, 1);
    for (const missing of [
      { points: 11 },
      { tc: 1 },
      { vis: undefined },
      { mem: [] },
      { love: undefined },
    ]) {
      view.me.npcRelations = [{ ...row, ...missing }];
      assert.equal(rows(view, 'story').length, 0, JSON.stringify(missing));
    }
    view.me.npcRelations = [row];
    view.me.bag.produce.carrot = 0;
    assert.equal(rows(view, 'story').length, 0, 'missing bring item');
    view.me.bag.produce.carrot = 1;
    view.me.npcRelations = [{ ...row, ch: 1 }];
    assert.equal(rows(view, 'story').length, 0, 'completed last chapter');
    view.me.npcRelations = [row];
    registerTalkBooks({ lumi: undefined });
    assert.equal(rows(view, 'story').length, 0, 'loading is not assumed ready');
  } finally {
    registerTalkBooks({ lumi: original });
  }
});

test('quality crops in the bag unlock the same real chapter in the board, notebook helper and server', () => {
  const { life, member } = player();
  const book = NPC_TALK.lumi;
  const ch = book.chapters.findIndex(
    (chapter) => chapter.need.bring?.item === 'strawberry',
  );
  assert.ok(ch >= 0);
  life.ext = {
    [member.id]: { npcRelations: { lumi: { points: 90, tc: 10, ch } } },
  };
  addCropQ(life, member.id, 'strawberry', 2, 1);
  const view = lifeView(life, member.id, 7, NOW);
  assert.equal(
    view.me.inv.strawberry ?? 0,
    0,
    'crop is held in produce, not inv',
  );
  assert.equal(view.me.quality.gold.strawberry, 1);
  assert.equal(
    needHave(view.me, { item: 'strawberry' }),
    itemCount(life, member.id, 'strawberry'),
  );
  assert.equal(
    nextChapter(
      book,
      view.me.npcRelations.find((r) => r.npc === 'lumi'),
      (item) => needHave(view.me, { item }),
    ).open,
    true,
  );
  assert.equal(
    rows(view, 'story').some((x) => x.id === 'story-lumi'),
    true,
  );
  const ledger = registerWallet(newLoungeLedger(), 'wallet-' + member.id);
  const done = lifeAction(
    life,
    ledger,
    member,
    { kind: 'npcChat', npc: 'lumi', op: 'story', pick: 0 },
    NOW,
  );
  assert.equal(done.life.ext[member.id].npcRelations.lumi.ch, ch + 1);
  assert.equal(itemCount(done.life, member.id, 'strawberry'), 0);
});

test('the UI inventory helper counts every crop quality once, with the same minimum-quality rule as the server', () => {
  const { life, member } = player();
  for (const q of [0, 1, 2, 3])
    addCropQ(life, member.id, 'strawberry', q, q + 1);
  const { me } = lifeView(life, member.id, 7, NOW);
  assert.equal(me.bag.produce.strawberry, 10);
  for (const q of [0, 1, 2, 3]) {
    assert.equal(
      needHave(me, { item: 'strawberry', q }),
      itemCount(life, member.id, 'strawberry', q),
    );
  }
  assert.equal(
    needHave(me, { item: 'strawberry' }),
    10,
    'produce total already includes the quality subcounts',
  );
});

test('a ready story behind a locked district is not advertised before its residents arrive', () => {
  const { view } = player();
  view.me.npcRelations = [{ npc: 'haku', points: 20, tc: 3, ch: 0 }];
  assert.equal(
    nextChapter(NPC_TALK.haku, view.me.npcRelations[0], () => 0).open,
    true,
  );
  assert.equal(rows(view, 'story').length, 0);
  view.flags = [...view.flags, 'district-ranch'];
  assert.equal(rows(view, 'story').length, 1);
});

test('makeup uses existing server chances, labels the night and refuses stale day/week rollover', () => {
  const { view } = player();
  view.myday = { n: 2, left: 3, mk: 3 };
  const day = kstDay(NOW);
  const noon = gameTimeOnDay(day, 12, 0, 12);
  const night = gameTimeOnDay(day, 22, 0, 12);
  assert.equal(rows(view, 'makeup', noon)[0].count, 3);
  assert.match(rows(view, 'makeup', noon)[0].detail, /밤 여덟/);
  assert.match(rows(view, 'makeup', night)[0].detail, /밤이에요/);
  assert.equal(rows(view, 'makeup', NOW + DAY).length, 0);
  assert.equal(rows(view, 'makeup', NOW + 100 * DAY).length, 0);
  view.myday = { n: 5, left: 0, mk: 0 };
  assert.equal(rows(view, 'makeup').length, 0);
});
