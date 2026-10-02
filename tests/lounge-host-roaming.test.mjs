// 루미 · 매화 · 로제 walk the village (lounge-npc-schedule.ts hostPlan) and
// 로제's credit tiers (lounge-casino-lender.ts). The tables and the lender's
// desk never wait for them: blackjack, go-stop practice, borrowing,
// repaying and overdue collection all work while they are out.
import test from 'node:test';
import assert from 'node:assert/strict';
import { HOST_DAY_OFF, NPC_POSTS, NPC_WALK_AREAS, npcAtPost, npcCanStand, npcSpot, kstDayStart } from '../app/lounge-npc-schedule.ts';
import { weatherOf, weekdayOf } from '../app/lounge-calendar.ts';
import { kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { ensureLifeMember, readLife } from '../app/lounge-life.ts';
import { collectOverdue, financeAction, readFinance } from '../app/lounge-finance.ts';
import { CASINO_CREDIT_TIERS, CASINO_LENDER_FRONT, casinoCreditOf } from '../app/lounge-casino-lender.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { tableIdOf, isPracticeAi } from '../app/lounge-games.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { NPC_LINES } from '../app/lounge-npc-dialog.ts';

const HOUR = 3_600_000, DAY = 86_400_000;
const DAY0 = kstDay(Date.UTC(2026, 9, 1, 3));
const HOSTS = ['lumi', 'maehwa', 'rose'];
const at = (day, h, m = 0) => kstDayStart(day) + (h * 60 + m) * 60_000;
/** The first day from DAY0 with this KST weekday. */
const nextWeekday = (wd, from = DAY0) => { let d = from; while (weekdayOf(d) !== wd) d++; return d; };
const dry = (d) => !['rain', 'storm'].includes(weatherOf(d));

// ---------------------------------------------------------------- schedules
test('the three hosts work the evening rush, take breaks and one day off a week, and sleep at home', () => {
  for (let d = DAY0; d < DAY0 + 28; d++)
    for (const id of HOSTS) {
      const off = weekdayOf(d) === HOST_DAY_OFF[id];
      assert.equal(npcSpot(id, at(d, 3)).area, 'home', `${id} asleep at home at 3am`);
      if (off) {
        // A whole day away from the post, out somewhere you can meet them.
        for (let m = 2 * 60; m < 24 * 60; m += 15) assert.equal(npcAtPost(id, at(d, 0, m)), false, `${id} off on day ${d} at ${m}`);
        const s = npcSpot(id, at(d, 14, 30));
        assert.ok(s.visible || s.walking, `${id} out and about on the day off (${s.area} ${s.label})`);
      } else {
        for (const [h, m] of [[12, 0], [20, 0], [21, 30], [23, 30]]) assert.ok(npcAtPost(id, at(d, h, m)), `${id} at ${NPC_POSTS[id]} ${h}:${m} day ${d}`);
      }
    }
  // Breaks on a dry working day: 루미 at the pond's flowers, 매화 in the hall's yard, 로제 on the breakwater.
  const lumiDay = [DAY0, DAY0 + 1, DAY0 + 2, DAY0 + 3, DAY0 + 4, DAY0 + 5, DAY0 + 6].find((d) => dry(d) && weekdayOf(d) !== HOST_DAY_OFF.lumi);
  assert.equal(npcSpot('lumi', at(lumiDay, 15, 30)).place, 'v.lumi-flower');
  const maehwaDay = [0, 1, 2, 3, 4, 5, 6].map((i) => DAY0 + i).find((d) => dry(d) && weekdayOf(d) !== HOST_DAY_OFF.maehwa);
  assert.equal(npcSpot('maehwa', at(maehwaDay, 18, 20)).place, 'v.hall-yard');
  const roseDay = [0, 1, 2, 3, 4, 5, 6].map((i) => DAY0 + i).find((d) => dry(d) && weekdayOf(d) !== HOST_DAY_OFF.rose);
  assert.equal(npcSpot('rose', at(roseDay, 18, 10)).place, 'hb.rose-sunset');
  assert.equal(npcSpot('rose', at(roseDay, 10, 50)).place, 'general.browse');
});

test('the hosts are drawn only where residents walk, on walkable ground, and leave through the doors', () => {
  for (let d = DAY0; d < DAY0 + 14; d++)
    for (const id of HOSTS)
      for (let m = 0; m < 1440; m += 3) {
        const s = npcSpot(id, at(d, 0, m) + 11_000);
        if (!s.visible) continue;
        assert.ok(NPC_WALK_AREAS.includes(s.area), `${id} drawn in ${s.area}`);
        assert.ok(npcCanStand(s.area, s), `${id} ${s.area} (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`);
      }
  // At the post the scene draws them (the schedule does not), and in transit nobody does.
  const d = nextWeekday((HOST_DAY_OFF.lumi + 1) % 7);
  const post = npcSpot('lumi', at(d, 21));
  assert.equal(post.place, 'casino.lumi');
  assert.equal(post.visible, false);
});

test('each host has lines for where they are met off duty', () => {
  for (const id of HOSTS)
    for (const act of ['stroll', 'eat', 'rest', 'walk']) assert.ok((NPC_LINES[id].activity[act] ?? []).length >= 2, `${id} ${act}`);
  for (const id of HOSTS) assert.ok(NPC_LINES[id].activity[id === 'maehwa' ? 'eat' : 'drink']?.length, `${id} tavern lines`);
});

// ---------------------------------------------------------------- the tables run without them
const uuid = () => crypto.randomUUID();
const member = (actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });
function harness(start) {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} }, now = start;
  return {
    get world() { return world; },
    async run(p, op, extra = {}) {
      const command = { op, connection: p.connection, code: p.code, ...(!['read', 'wallet'].includes(op) ? { requestId: uuid(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
      const result = cloudTransition(world, p, command, await commandHash(command), now);
      world = result.state;
      p.epoch = result.response.epoch;
      if (result.response.code) p.code = result.response.code;
      validateLedger(world.ledger);
      return result.response;
    },
    act(p, action) { return this.run(p, 'action', { action }); },
    advance(ms) { now += ms; },
  };
}

test('blackjack deals and settles while 루미 is out on her day off', async () => {
  const t = at(nextWeekday(HOST_DAY_OFF.lumi), 14, 30);
  assert.equal(npcAtPost('lumi', t), false);
  const h = harness(t), a = member(3);
  await h.run(a, 'open');
  assert.equal((await h.act(a, { kind: 'area', area: 'casino' })).ok, true);
  const sat = await h.act(a, { kind: 'invite', game: 'blackjack', players: [], stake: 1000, required: 1, table: tableIdOf('blackjack') });
  assert.equal(sat.ok, true, sat.error);
  let bj = sat.packet.blackjack;
  for (let i = 0; i < 40 && bj.phase !== 'over'; i++) {
    const r = bj.legal.enabled
      ? await h.act(a, { kind: 'blackjack', id: bj.id, revision: bj.revision, action: { kind: 'stand' } })
      : (h.advance(1500), await h.run(a, 'read'));
    bj = r.packet.blackjack;
  }
  assert.equal(bj.phase, 'over');
  assert.equal(h.world.ledger.games[bj.id]?.state, 'settled');
});

test('the hall’s go-stop practice table opens while 매화 is out on her day off', async () => {
  const t = at(nextWeekday(HOST_DAY_OFF.maehwa), 14, 30);
  assert.equal(npcAtPost('maehwa', t), false);
  const h = harness(t), a = member(2);
  await h.run(a, 'open');
  assert.equal((await h.act(a, { kind: 'area', area: 'lounge' })).ok, true);
  const sat = await h.act(a, { kind: 'invite', game: 'gostop', players: [], table: tableIdOf('gostop'), practice: true });
  assert.equal(sat.ok, true, sat.error);
  assert.equal(sat.packet.seats.gostop.filter(isPracticeAi).length, 2);
  assert.ok(sat.packet.gostop);
});

// ---------------------------------------------------------------- 로제's desk and credit
const ids = [0, 1].map((i) => `00000000-0000-4000-8000-00000000000${i}`);
const wallets = ids.map((id) => 'wallet-' + id);
function world() {
  let ledger = newLoungeLedger(), life = readLife(undefined);
  ids.forEach((id, i) => { ledger = registerWallet(ledger, wallets[i]); life = ensureLifeMember(life, id, i); });
  return { state: undefined, ledger, life };
}
const desk = ids.map((id, actor) => ({ id, actor, area: 'casino', ...CASINO_LENDER_FRONT }));
function act(w, a, now) {
  const n = financeAction(w.state, w.ledger, w.life, ids[0], { kind: 'finance', ...a }, now, desk);
  validateLedger(n.ledger);
  return n;
}
const borrowAndRepay = (w, amount, now) => {
  const b = act(w, { op: 'borrow', amount }, now), loan = b.state.loans.at(-1);
  return act(b, { op: 'repay', id: loan.id, amount: loan.principal + loan.interest }, now + HOUR);
};

test('로제’s desk lends, takes repayments and collects overdue debt while she is out', () => {
  const t = at(nextWeekday(HOST_DAY_OFF.rose), 14, 30);
  assert.equal(npcAtPost('rose', t), false);
  const w = act(world(), { op: 'borrow', amount: 20_000 }, t);
  const loan = w.state.loans[0];
  assert.equal(loan.days, 3);
  const part = act(w, { op: 'repay', id: loan.id, amount: 6000 }, t + HOUR);
  assert.equal(part.state.loans[0].paid, 6000);
  // Overdue on her next day off too: collection does not ask where she is.
  const due = at(nextWeekday(HOST_DAY_OFF.rose, kstDay(loan.dueAt) + 1), 15);
  assert.equal(npcAtPost('rose', due), false);
  const c = collectOverdue(part.state, part.ledger, ids[0], due);
  assert.equal(c.state.loans[0].state, 'paid');
  assert.equal(c.state.loans[0].late, true);
});

test('credit tiers: twice the old limit to start, more for on-time repayments, back to 30,000 after a late one', () => {
  const t0 = Date.UTC(2026, 9, 1, 3);
  assert.deepEqual(CASINO_CREDIT_TIERS.map((t) => [t.id, t.max, t.days]), [['late', 30_000, 3], ['new', 60_000, 3], ['regular', 80_000, 4], ['trusted', 100_000, 5], ['vip', 120_000, 5]]);
  let w = world();
  assert.throws(() => act(w, { op: 'borrow', amount: 60_001 }, t0), /새 손님.*60,000/);
  assert.throws(() => act(w, { op: 'borrow', amount: 999 }, t0));
  // Tiny loans repaid on time do not count toward the tiers.
  for (let i = 0; i < 3; i++) w = borrowAndRepay(w, 9_000, t0 + i * DAY);
  assert.equal(casinoCreditOf(w.state.loans, ids[0], t0 + 3 * DAY).tier.id, 'new');
  // Two on-time loans of 10,000+ → 단골 (80,000, 4 days).
  w = borrowAndRepay(w, 60_000, t0 + 3 * DAY);
  w = borrowAndRepay(w, 10_000, t0 + 4 * DAY);
  const regular = casinoCreditOf(w.state.loans, ids[0], t0 + 5 * DAY);
  assert.equal(regular.tier.id, 'regular');
  assert.equal(regular.next.id, 'trusted');
  const big = act(w, { op: 'borrow', amount: 80_000 }, t0 + 5 * DAY);
  assert.equal(big.state.loans.at(-1).days, 4);
  assert.equal(big.state.loans.at(-1).interest, 24_000);
  assert.equal(big.state.loans.at(-1).dueAt, t0 + 9 * DAY);
  assert.match(big.state.logs.at(-1).text, /4일 뒤 104,000범 상환 \(단골 단계/);
  // Four, then six → 믿을 손님, then 로제의 VIP (120,000 for 5 days, still 30%).
  w = borrowAndRepay(w, 10_000, t0 + 5 * DAY);
  w = borrowAndRepay(w, 10_000, t0 + 6 * DAY);
  assert.equal(casinoCreditOf(w.state.loans, ids[0], t0 + 7 * DAY).tier.id, 'trusted');
  w = borrowAndRepay(w, 10_000, t0 + 7 * DAY);
  w = borrowAndRepay(w, 10_000, t0 + 8 * DAY);
  const vip = casinoCreditOf(w.state.loans, ids[0], t0 + 9 * DAY);
  assert.equal(vip.tier.id, 'vip');
  assert.equal(vip.next, null);
  assert.throws(() => act(w, { op: 'borrow', amount: 120_001 }, t0 + 9 * DAY));
  const top = act(w, { op: 'borrow', amount: 120_000 }, t0 + 9 * DAY);
  const note = top.state.loans.at(-1);
  assert.deepEqual([note.principal, note.interest, note.days], [120_000, 36_000, 5]);
  // Still one casino loan at a time.
  assert.throws(() => act(top, { op: 'borrow', amount: 1000 }, t0 + 9 * DAY), /먼저 갚아/);
  // Late: overdue the moment the term ends, collected from the wallet, and the limit drops to 30,000.
  const overdue = note.dueAt + 1;
  assert.equal(casinoCreditOf(top.state.loans, ids[0], overdue).tier.id, 'late');
  const c = collectOverdue(top.state, top.ledger, ids[0], overdue);
  assert.equal(c.state.loans.at(-1).state, 'paid');
  const after = { ...top, state: readFinance(JSON.parse(JSON.stringify(c.state))), ledger: c.ledger };
  assert.equal(after.state.loans.at(-1).late, true);
  assert.throws(() => act(after, { op: 'borrow', amount: 30_001 }, overdue + HOUR), /연체 기록.*30,000/);
  assert.equal(act(after, { op: 'borrow', amount: 30_000 }, overdue + HOUR).state.loans.at(-1).days, 3);
  // Thirty days later the late note has aged out of the window.
  assert.notEqual(casinoCreditOf(after.state.loans, ids[0], note.offeredAt + 31 * DAY).tier.id, 'late');
});

test('a late flag must be exactly true in a saved book', () => {
  const t0 = Date.UTC(2026, 9, 1, 3);
  const w = act(world(), { op: 'borrow', amount: 10_000 }, t0);
  const saved = JSON.parse(JSON.stringify(w.state));
  saved.loans[0].late = 'yes';
  assert.throws(() => readFinance(saved), /장부/);
  saved.loans[0].late = true;
  assert.equal(readFinance(saved).loans[0].late, true);
});
