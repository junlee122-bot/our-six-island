import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BEOM,
  newLoungeLedger,
  registerWallet,
  reserveGame,
  settleGame,
  voidGame,
  claimDailyGrant,
  spendBeom,
  grantBeom,
  compactLedger,
  kstDay,
} from '../app/lounge-economy.ts';
import { emptyLife, lifeAction } from '../app/lounge-life.ts';
import {
  economyReport,
  formatEconomyReport,
  economyReportMarkdown,
  economyReportHtml,
  reasonLabel,
  flowKind,
  kstDate,
  displayWidth,
  textTable,
} from '../app/lounge-economy-report.ts';

const uids = ['a', 'b', 'c'].map((s) => `${s.repeat(8)}-0000-4000-8000-${s.repeat(12)}`);
const w = (i) => 'wallet-' + uids[i];
const NOW = Date.UTC(2026, 8, 24, 3, 0, 0); // 2026-09-24 12:00 KST
const DAY = 86_400_000;
const members = uids.map((uid, actor) => ({ uid, actor, username: ['dowon', 'gangjae', 'minseo'][actor] }));

function world() {
  let l = [0, 1, 2].map(w).reduce(registerWallet, newLoungeLedger());
  // Games: chess settled (a +1000), blackjack settled (a +500, b -300), seotda void, poker reserved.
  l = reserveGame(l, 'chess-1', 'chess', [w(0), w(1)], [1000, 1000]);
  l = settleGame(l, 'chess-1', [1000, -1000]);
  l = reserveGame(l, 'bj-1', 'blackjack', [w(0), w(1)], [500, 500]);
  l = settleGame(l, 'bj-1', [500, -300]);
  l = reserveGame(l, 'seotda-1', 'seotda', [w(0), w(1), w(2)], [100, 100, 100]);
  l = voidGame(l, 'seotda-1');
  l = reserveGame(l, 'poker-1', 'poker', [w(1), w(2)], [2000, 3000]);
  // Money flows: an old daily grant (10 days ago), today's daily, a shop purchase.
  l = claimDailyGrant(l, w(0), NOW - 10 * DAY);
  l = claimDailyGrant(l, w(0), NOW);
  l = spendBeom(l, w(2), 1200, 'buy-x', NOW - DAY, 'buy-seed-carrot');
  // Farm sale through the real life engine.
  let life = emptyLife();
  const member = { id: uids[1], actor: 1 };
  const bagged = lifeAction(life, l, member, { kind: 'pick', tree: 'tree-1' }, NOW - 2 * DAY);
  life = bagged.life;
  life.bag[uids[1]].fruit = 10;
  const sold = lifeAction(life, bagged.ledger, member, { kind: 'sell', crop: 'fruit', n: 10 }, NOW - 2 * 3_600_000);
  return { schema: 1, ledger: sold.ledger, life: sold.life, rooms: {}, receipts: {} };
}

test('report totals match the ledger invariant and per-account rows', () => {
  const state = world();
  const r = economyReport({ state, now: NOW, members, revision: 42 });
  assert.equal(r.revision, 42);
  assert.equal(r.totals.accounts, 3);
  assert.equal(r.totals.initial, 3 * INITIAL_BEOM);
  assert.equal(r.totals.reserved, 5000);
  assert.equal(r.totals.houseBalance, -200 + 1200); // blackjack house lost 200, shop +1200
  assert.equal(r.totals.granted, 3000 + 3000 + 1500);
  assert.equal(r.totals.spent, 1200);
  assert.equal(r.totals.supply, r.totals.initial + r.totals.granted);
  assert.ok(r.totals.invariantOk);
  assert.deepEqual(r.warnings, []);

  const a = r.accounts.find((x) => x.uid === uids[0]);
  assert.equal(a.name, '도원(dowon)');
  assert.equal(a.balance, state.ledger.accounts[w(0)]);
  assert.equal(a.gamblingNet, 1500);
  assert.deepEqual(a.gamblingByGame, { chess: 1000, blackjack: 500 });
  assert.equal(a.games, 3); // chess, blackjack, void seotda
  assert.equal(a.dailyGranted, 6000);
  const b = r.accounts.find((x) => x.uid === uids[1]);
  assert.equal(b.reserved, 2000);
  assert.equal(b.gamblingNet, -1300);
  assert.equal(b.farmEarned, 1500);
  assert.equal(b.soldToday, 1500);
  assert.ok(b.harvested >= 1);
  const c = r.accounts.find((x) => x.uid === uids[2]);
  assert.equal(c.shopSpent, 1200);
  assert.equal(c.total, c.balance + 3000);
  // Sorted by total, descending.
  assert.deepEqual(
    r.accounts.map((x) => x.total),
    r.accounts.map((x) => x.total).sort((x, y) => y - x),
  );
});

test('game summary, sources/sinks, recent window and daily totals', () => {
  const r = economyReport({ state: world(), now: NOW, members });
  const game = (g) => r.games.find((x) => x.game === g);
  assert.deepEqual(
    { ...game('chess'), label: undefined },
    { game: 'chess', label: undefined, reserved: 0, settled: 1, void: 0, held: 0, staked: 2000, moved: 1000, houseNet: 0 },
  );
  assert.equal(game('blackjack').houseNet, -200);
  assert.equal(game('seotda').void, 1);
  assert.equal(game('poker').reserved, 1);
  assert.equal(game('poker').held, 5000);

  assert.ok(r.entries.complete);
  assert.equal(r.entries.retained, 4);
  assert.deepEqual(
    r.sources.map((s) => [s.reason, s.kind, s.count, s.amount]),
    [
      ['daily', 'daily', 2, 6000],
      ['sell-fruit', 'farm', 1, 1500],
    ],
  );
  assert.deepEqual(r.sinks.map((s) => [s.label, s.amount]), [['상점: 당근 씨앗', 1200]]);
  // The grant from 10 days ago falls outside the 7-day window.
  assert.equal(r.recent.granted, 3000 + 1500);
  assert.equal(r.recent.spent, 1200);
  assert.equal(r.recent.sources[0].reason, 'daily');
  assert.equal(r.recent.sources[0].amount, 3000);

  assert.equal(r.daily[0].date, '2026-09-24');
  assert.equal(r.daily[0].daily, 3000);
  assert.equal(r.daily[0].farm, 1500);
  const yesterday = r.daily.find((d) => d.date === '2026-09-23');
  assert.equal(yesterday.shop, 1200);
  assert.equal(yesterday.net, -1200);
  assert.equal(r.daily.length, 3);

  const narrow = economyReport({ state: world(), now: NOW, members, days: 1 });
  assert.equal(narrow.recent.spent, 1200); // exactly 24h ago is inside the window
  assert.equal(narrow.recent.granted, 4500);
});

test('names fall back to life.actors, then to a short id', () => {
  const state = world();
  const r = economyReport({ state, now: NOW });
  assert.equal(r.accounts.find((x) => x.uid === uids[1]).name, '강재(gangjae)');
  assert.match(r.accounts.find((x) => x.uid === uids[0]).name, /^알 수 없음 aaaaaaaa$/);
});

test('archived games and dropped entries are reported, not hidden', () => {
  let l = [0, 1].map(w).reduce(registerWallet, newLoungeLedger());
  for (let i = 0; i < 4; i++) {
    l = reserveGame(l, 'bj-' + i, 'blackjack', [w(0), w(1)], [100, 100]);
    l = settleGame(l, 'bj-' + i, [100, -100]);
  }
  l = compactLedger(l, 1);
  // Simulate the 200-entry cap: grants exist in the total but not in entries.
  l = grantBeom(l, w(0), 700, 'g-1', NOW, 'daily');
  l = { ...l, granted: l.granted + 50, accounts: { ...l.accounts, [w(1)]: l.accounts[w(1)] + 50 } };
  const r = economyReport({ state: { schema: 1, ledger: l }, now: NOW, members });
  assert.equal(r.archive.games, 3);
  assert.equal(r.archive.houseNet, 0);
  const a = r.accounts.find((x) => x.uid === uids[0]);
  assert.equal(a.gamblingNet, 400);
  assert.equal(a.gamblingByGame.archived, 300);
  assert.equal(a.gamblingByGame.blackjack, 100);
  assert.equal(a.games, 4);
  assert.equal(r.entries.complete, false);
  assert.ok(r.totals.invariantOk);
});

test('broken invariants and garbage input become warnings, never throws', () => {
  const state = world();
  state.ledger.accounts[w(0)] += 5;
  const r = economyReport({ state, now: NOW, members });
  assert.equal(r.totals.invariantOk, false);
  assert.equal(r.totals.invariantDiff, 5);
  assert.ok(r.warnings.some((x) => x.includes('총액 불일치')));
  for (const bad of [null, 1, 'x', [], { ledger: { accounts: [], games: 3, entries: 'x' } }]) {
    const out = economyReport({ state: bad, now: NOW });
    assert.equal(out.totals.accounts, 0);
    assert.ok(out.warnings.length > 0);
    assert.equal(typeof formatEconomyReport(out), 'string');
  }
});

test('labels, KST dates and flow kinds', () => {
  assert.equal(reasonLabel('sell-tomato'), '토마토 판매');
  assert.equal(reasonLabel('sell-fruit'), '과일 판매');
  assert.equal(reasonLabel('buy-palette-neon'), '상점: 네온 팔레트');
  assert.equal(reasonLabel('buy-unknown'), '상점: unknown');
  assert.equal(reasonLabel('daily-relief'), '오늘의 범(구제)');
  assert.equal(flowKind('grant', 'sell-carrot'), 'farm');
  assert.equal(flowKind('grant', 'grant'), 'grantOther');
  assert.equal(flowKind('spend', 'buy-seed-carrot'), 'shop');
  assert.equal(flowKind('spend', 'fee'), 'spendOther');
  // 2026-09-24 15:00 UTC is already 09-25 in Korea.
  assert.equal(kstDate(Date.UTC(2026, 8, 24, 15, 0)), '2026-09-25');
  assert.equal(kstDate(Date.UTC(2026, 8, 24, 14, 59)), '2026-09-24');
  assert.equal(kstDay(Date.UTC(2026, 8, 24, 15, 0)) * DAY, Date.UTC(2026, 8, 25));
});

test('renderers: aligned Korean text, markdown and escaped html', () => {
  assert.equal(displayWidth('도원(dowon)'), 11);
  const t = textTable({ title: '', head: ['이름', '금액'], rows: [['도원', '1범'], ['x', '10,000범']], right: [1] });
  const lines = t.split('\n');
  assert.equal(displayWidth(lines[2]), displayWidth(lines[3]));
  const r = economyReport({ state: world(), now: NOW, members });
  const text = formatEconomyReport(r);
  assert.match(text, /범타듀 밸리 경제 리포트/);
  assert.match(text, /통화량/);
  assert.match(text, /도원\(dowon\)/);
  const md = economyReportMarkdown(r);
  assert.match(md, /^# 범타듀 밸리 경제 리포트/);
  assert.match(md, /\| 친구 \| 잔액 \|/);
  const evil = economyReport({
    state: world(),
    now: NOW,
    members: [{ uid: uids[0], username: '<script>alert(1)</script>', actor: 99 }],
  });
  const html = economyReportHtml(evil);
  assert.ok(!html.includes('<script>'));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<html lang="ko">/);
});
