// 고백·청혼 거절 대사: every resident who can be courted turns a 꽃다발 or a
// 청혼 반지 down in their own voice (not yet · already promised to another
// friend · "쉬어요" during my breakup cooldown · the ring too soon), kindly,
// and the box picks the same refusal the server would (npcLoveRefusal).
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, LifeError } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, kstDay } from '../app/lounge-economy.ts';
import { NPC_BREAKUP, NPC_DATING_DAYS, NPC_DATING_POINTS, NPC_PROPOSE_POINTS } from '../app/lounge-romance.ts';
import { NPC_IDS, NPC_SPOUSES, isNpcId } from '../app/lounge-npc-data.ts';
import { NPC_LOVE, NPC_LOVE_FALLBACK, NPC_LOVE_MARRIED, npcLoveLine } from '../app/lounge-npc-love.ts';
import { npcLoveRefusal } from '../app/lounge-npc-speech.ts';
import { gameTimeOnDay } from '../app/lounge-calendar.ts';

const T0 = Date.UTC(2026, 9, 5, 3);
const at = (d, hour = 12) => gameTimeOnDay(kstDay(T0) + d, hour);
/** Residents who can be courted (the realty couple are married to each other). */
const COURTED = NPC_IDS.filter((id) => !NPC_SPOUSES[id]);
/** 발키리 keeps her lines as they are (user decision); she answers a cooldown with her decline. */
const KEPT = new Set(['carpenter']);
const CASES = [
  { moment: 'ask-decline', pool: (L) => L.ask.decline },
  { moment: 'ask-taken', pool: (L) => L.ask.taken },
  { moment: 'ask-cool', pool: (L) => L.ask.cool },
  { moment: 'propose-decline', pool: (L) => L.propose.decline },
];
const GENERIC = new Set([
  ...NPC_LOVE_FALLBACK.ask.decline,
  ...NPC_LOVE_FALLBACK.ask.taken,
  ...(NPC_LOVE_FALLBACK.ask.cool ?? []),
  ...NPC_LOVE_FALLBACK.propose.decline,
]);
const PLACEHOLDERS = new Set(['me', 'name']);

test('the love files cover every courted resident, with only known ids and keys', () => {
  for (const id of Object.keys(NPC_LOVE)) assert.ok(isNpcId(id) && !NPC_SPOUSES[id], `${id} is a courted resident`);
  for (const id of Object.keys(NPC_LOVE_MARRIED)) assert.ok(isNpcId(id) && NPC_SPOUSES[id], `${id} is married`);
  for (const id of COURTED) {
    const L = NPC_LOVE[id];
    assert.ok(L, `${id} has a love file`);
    for (const key of Object.keys(L.ask)) assert.ok(['accept', 'decline', 'taken', 'cool'].includes(key), `${id} ask.${key}`);
    for (const key of Object.keys(L.propose)) assert.ok(['accept', 'decline'].includes(key), `${id} propose.${key}`);
  }
});

test('every courted resident has their own refusal lines for every case', () => {
  const owner = new Map();
  for (const id of COURTED) {
    const L = NPC_LOVE[id];
    for (const { moment, pool } of CASES) {
      const lines = pool(L);
      if (KEPT.has(id) && moment === 'ask-cool') {
        assert.equal(lines, undefined, `${id} keeps her lines`);
        continue;
      }
      assert.ok(Array.isArray(lines) && lines.length >= 2 && lines.length <= 4, `${id} ${moment}: 2–4 lines`);
      assert.equal(new Set(lines).size, lines.length, `${id} ${moment}: no repeats`);
      for (const line of lines) {
        assert.ok(!GENERIC.has(line), `${id} ${moment}: generic "${line}"`);
        assert.ok(line.length <= 60, `${id}: too long "${line}"`);
        for (const [, key] of line.matchAll(/\{(\w+)\}/g)) assert.ok(PLACEHOLDERS.has(key), `${id}: {${key}} in "${line}"`);
        assert.ok(!/\}(이|가|은|는|을|를|과|와|랑|이랑|의|에게|한테)/.test(line), `${id}: josa after a placeholder in "${line}"`);
        // Kind: nobody is scolded for asking.
        assert.ok(!/위반|양다리|못쓴다|한심|꺼져|귀찮게/.test(line), `${id}: unkind "${line}"`);
        const other = owner.get(line);
        assert.ok(!other || other === id, `${id} and ${other} share "${line}"`);
        owner.set(line, id);
      }
    }
    // Already promised to another friend: about their own promise, never "you already have someone".
    for (const line of L.ask.taken) if (!KEPT.has(id)) assert.ok(!/이미 (좋은 사람|소중한 사람|연인이|사귀는 사람) 있잖/.test(line), `${id}: taken "${line}"`);
  }
});

test('npcLoveLine answers each refusal from the resident’s own pool', () => {
  for (const id of COURTED) {
    const L = NPC_LOVE[id];
    for (const { moment, pool } of CASES) {
      const lines = pool(L) ?? L.ask.decline;
      for (let k = 0; k < 24; k++) {
        const line = npcLoveLine(id, moment, `who:${k}`, '테스트');
        assert.ok(lines.includes(line), `${id} ${moment}: "${line}"`);
      }
    }
  }
  // The realty couple turn every 꽃다발 (a cooldown too) and ring down by naming each other.
  for (const id of Object.keys(NPC_LOVE_MARRIED)) {
    const M = NPC_LOVE_MARRIED[id];
    for (let k = 0; k < 12; k++) {
      for (const moment of ['ask-decline', 'ask-taken', 'ask-cool']) assert.ok(M.refuse.bouquet.includes(npcLoveLine(id, moment, `k${k}`)), `${id} ${moment}`);
      assert.ok(M.refuse.ring.includes(npcLoveLine(id, 'propose-decline', `k${k}`)), id);
    }
  }
});

function world() {
  const m = { id: '00000000-1111-4111-8111-111111111111', actor: 0 };
  const o = { id: '00000001-1111-4111-8111-111111111111', actor: 1 };
  let ledger = newLoungeLedger();
  let life = emptyLife();
  for (const x of [m, o]) {
    ledger = registerWallet(ledger, 'wallet-' + x.id);
    life = ensureLifeMember(life, x.id, x.actor);
  }
  const ext = (x) => ((life.ext ??= {})[x.id] ??= {});
  return {
    m,
    o,
    set: (x, npc, row) => ((ext(x).npcRelations ??= {})[npc] = row),
    give: (x, item) => (ext(x).inv = { ...ext(x).inv, [item]: (ext(x).inv?.[item] ?? 0) + 1 }),
    /** The server's answer: null for a yes, else its error text. */
    server: (op, npc, now) => {
      try {
        life = lifeAction(life, ledger, m, { kind: 'npcSocial', npc, op }, now).life;
        return null;
      } catch (e) {
        if (!(e instanceof LifeError)) throw e;
        return e.message;
      }
    },
    rows: () => ext(m).npcRelations ?? {},
  };
}

test('the box refuses exactly when the server would, for the same reason', () => {
  const day = kstDay(at(0));
  const ask = (w, npc, now = at(0), takenByOther = false) => {
    const rows = w.rows();
    const refusal = npcLoveRefusal({ op: 'ask', points: rows[npc]?.points ?? 0, day: kstDay(now), coolUntil: Math.max(0, ...Object.values(rows).map((r) => r.coolUntil ?? 0)), takenByOther });
    return { refusal, server: w.server('ask', npc, now) };
  };
  // Not yet: under 8 hearts.
  let w = world();
  w.set(w.m, 'gwen', { points: NPC_DATING_POINTS - 1 });
  w.give(w.m, 'bouquet');
  let r = ask(w, 'gwen');
  assert.equal(r.refusal, 'ask-decline');
  assert.match(r.server, /조금 더 가까워지면/);
  // During my breakup cooldown: the resident tells me to rest first.
  w = world();
  w.set(w.m, 'lux', { points: NPC_DATING_POINTS });
  w.set(w.m, 'gwen', { points: 20, coolUntil: day + NPC_BREAKUP.days });
  w.give(w.m, 'bouquet');
  r = ask(w, 'lux');
  assert.equal(r.refusal, 'ask-cool');
  assert.match(r.server, /마음을 추스르는/);
  // Promised to another friend.
  w = world();
  w.set(w.o, 'haku', { points: 120, love: 'engaged', since: day - 9, weddingDay: day + 3 });
  w.set(w.m, 'haku', { points: 110 });
  w.give(w.m, 'bouquet');
  r = ask(w, 'haku', at(0), true);
  assert.equal(r.refusal, 'ask-taken');
  assert.match(r.server, /다른 친구와 약속/);
  // Yes.
  w = world();
  w.set(w.m, 'janna', { points: NPC_DATING_POINTS });
  w.give(w.m, 'bouquet');
  r = ask(w, 'janna');
  assert.equal(r.refusal, null);
  assert.equal(r.server, null);
  // The ring: too few hearts, too few days, then yes.
  const propose = (points, since, now) => {
    const pw = world();
    pw.set(pw.m, 'mercy', { points, love: 'dating', since });
    pw.give(pw.m, 'pledge-ring');
    return { refusal: npcLoveRefusal({ op: 'propose', points, since, day: kstDay(now), coolUntil: 0, takenByOther: false }), server: pw.server('propose', 'mercy', now) };
  };
  r = propose(NPC_PROPOSE_POINTS - 1, day - 9, at(0));
  assert.equal(r.refusal, 'propose-decline');
  assert.match(r.server, /마음이 더 깊어지면/);
  r = propose(NPC_PROPOSE_POINTS, day, at(NPC_DATING_DAYS - 1));
  assert.equal(r.refusal, 'propose-decline');
  assert.match(r.server, /사귄 지/);
  r = propose(NPC_PROPOSE_POINTS, day, at(NPC_DATING_DAYS));
  assert.equal(r.refusal, null);
  assert.equal(r.server, null);
});
