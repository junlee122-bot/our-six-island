// 범마을 증권 지점장 무잔 (handover/design/design-broker-muzan.md): his day,
// the broker's counter, the generated art's record, his lines (everyday,
// love, banter, the counter's stock remarks) and courting him.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { NPC_PLACES, MUZAN_DAY_OFF, kstDayStart, npcCanStand, npcSpot, npcPlan } from '../app/lounge-npc-schedule.ts';
import { SHOP_INTERIORS } from '../app/lounge-shop-interiors.ts';
import { NPCS, NPC_BONDS, NPC_IDS, npcBond } from '../app/lounge-npc-data.ts';
import { NPC_CHIBI } from '../app/lounge-npc-chibi.ts';
import { HOSTS } from '../app/lounge-dealer-lines.ts';
import { HOST_SHEET } from '../app/lounge-host-sprites.ts';
import { LOUNGE_ASSETS } from '../app/lounge-assets.ts';
import { allNpcLines, npcBanter } from '../app/lounge-npc-dialog.ts';
import { NPC_LOVE, NPC_LOVE_TIERS, allNpcLoveLines } from '../app/lounge-npc-love.ts';
import { NPC_BANTER_MUZAN } from '../app/lounge-npc-banter-muzan.ts';
import { BROKER_LINES, brokerRemark, brokerSituation } from '../app/lounge-broker-voice.ts';
import { emptyLife, ensureLifeMember, lifeAction } from '../app/lounge-life.ts';
import { NPC_DATING_POINTS } from '../app/lounge-romance.ts';

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 9, 5, 3);
const DAY0 = kstDay(T0);
const at = (d, h, m = 0) => kstDayStart(DAY0 + d) + h * HOUR + m * 60_000;
const weekdayOf = (d) => new Date(kstDayStart(DAY0 + d) + 9 * HOUR).getUTCDay();
const dayWith = (weekday) => [0, 1, 2, 3, 4, 5, 6].find((d) => weekdayOf(d) === weekday);

/** Words that do not belong in a village game (the original's demons, threats, violence). */
const FORBIDDEN = /혈귀|오니|귀살|식인|먹어 치|잡아먹|피를|죽여|죽이|죽을|베어|(?<!종)목을 |협박|복수|지옥|저주|살려/;

// ---------------------------------------------------------------- schedule
test('무잔 keeps the broker counter in market hours on workdays and takes Sunday off', () => {
  assert.equal(MUZAN_DAY_OFF, 0);
  for (let d = 0; d < 14; d++) {
    const work = weekdayOf(d) !== MUZAN_DAY_OFF;
    for (const [h, m] of [[9, 0], [10, 30], [13, 0], [15, 0], [15, 45]]) {
      const s = npcSpot('muzan', at(d, h, m));
      if (work) {
        assert.equal(s.place, 'broker.owner', `day ${d} ${h}:${m}`);
        assert.equal(s.area, 'broker');
        assert.ok(s.visible, 'drawn behind the counter');
        assert.equal(s.activity, 'work');
      } else assert.notEqual(s.place, 'broker.owner', `Sunday ${h}:${m}`);
    }
    // Noon tea at the ticker board, the walk after the close, a night out, bed.
    if (work) assert.equal(npcSpot('muzan', at(d, 12, 15)).place, 'broker.board');
    const evening = npcSpot('muzan', at(d, 20));
    assert.ok(['t.muzan', 'v.muzan-casino', 'm.muzan-lamp'].includes(evening.place), `day ${d} evening ${evening.place}`);
    assert.ok(evening.visible);
    assert.equal(npcSpot('muzan', at(d, 24, 30)).place, 't.muzan');
    assert.equal(npcSpot('muzan', at(d, 3)).activity, 'sleep');
  }
  // Monday and Thursday evenings by the casino (in fair weather), Tuesday and Friday in the tavern.
  for (const wd of [2, 5]) assert.equal(npcSpot('muzan', at(dayWith(wd), 20)).place, 't.muzan');
  // Sunday: the market stalls, lunch at the bakery, the harbor or the tavern.
  const sun = dayWith(0);
  assert.equal(npcSpot('muzan', at(sun, 11)).place, 'm.muzan');
  assert.equal(npcSpot('muzan', at(sun, 12, 30)).place, 'bakery.seat-cafe-3');
  // Every place of his day stands on walkable ground.
  for (let d = 0; d < 7; d++)
    for (const [, place] of npcPlan('muzan', DAY0 + d)) {
      const p = NPC_PLACES[place];
      assert.ok(p, place);
      if (p.area !== 'home') assert.ok(npcCanStand(p.area, p), `${place} walkable`);
    }
});

// ---------------------------------------------------------------- counter
test('the broker counter is 무잔’s: owner, staff strip spot, 창구 wording, his face and chibi', () => {
  const broker = SHOP_INTERIORS.broker;
  assert.equal(broker.owner, 'muzan');
  assert.equal(broker.deskWord, '창구');
  assert.equal(broker.ownerWord, '지점장');
  const spot = NPC_PLACES['broker.owner'];
  assert.deepEqual({ x: spot.x, z: spot.z }, broker.ownerAt);
  assert.ok(npcCanStand('broker', spot), 'his spot behind the counter is on the staff strip');
  assert.equal(HOSTS.muzan.name, '무잔');
  assert.equal(HOST_SHEET.muzan, LOUNGE_ASSETS.hostBroker);
  assert.equal(NPC_CHIBI.muzan.asset, LOUNGE_ASSETS.chibi_muzan);
  assert.equal(NPCS.muzan.art.kind, 'image');
  assert.equal(NPCS.muzan.art.asset, LOUNGE_ASSETS.npc_muzan);
  assert.equal(NPCS.muzan.art.portrait, LOUNGE_ASSETS.npc_muzan_portrait);
  assert.ok(NPC_IDS.includes('muzan'));
  assert.equal(NPCS.muzan.speech, 'polite');
});

// ---------------------------------------------------------------- art record
test('the generation record lists his originals and the web copies the script made', async () => {
  const dir = new URL('../public/assets/lounge/', import.meta.url);
  const record = JSON.parse(fs.readFileSync(new URL('broker-muzan-generation.json', dir), 'utf8'));
  const sha = (url) => crypto.createHash('sha256').update(fs.readFileSync(url)).digest('hex').toUpperCase();
  assert.deepEqual(record.assets.map((a) => a.id), ['broker-tall', 'broker-chibi', 'broker-host-sheet']);
  for (const a of record.assets) assert.equal(sha(new URL(a.original, dir)), a.sha256, a.original);
  assert.deepEqual(Object.keys(record.web).sort(), ['chibi/npc-muzan.webp', 'host-broker.png', 'host-broker.webp', 'npc-muzan-portrait.webp', 'npc-muzan.webp']);
  for (const [file, w] of Object.entries(record.web)) {
    const url = new URL(file, dir);
    assert.equal(sha(url), w.sha256, file);
    const meta = await sharp(fs.readFileSync(url)).metadata();
    assert.deepEqual([meta.width, meta.height], [w.w, w.h], file);
    assert.ok(meta.hasAlpha, `${file} is keyed`);
  }
  assert.deepEqual([record.web['npc-muzan.webp'].w, record.web['npc-muzan.webp'].h], [660, 990]);
  assert.deepEqual([record.web['host-broker.webp'].w, record.web['host-broker.webp'].h], [1320, 1320]);
  assert.match(record.keying, /optimize-assets\.mjs/);
  // The chibi record (sizes for lounge-npc-chibi.ts) has him too.
  const chibi = JSON.parse(fs.readFileSync(new URL('npc-chibi-generation.json', dir), 'utf8'));
  assert.deepEqual([chibi.web.muzan.w, chibi.web.muzan.h], [NPC_CHIBI.muzan.w, NPC_CHIBI.muzan.h]);
});

// ---------------------------------------------------------------- lines
test('his everyday lines: 80+, his catchphrase, polite voice, no demons or threats', () => {
  const lines = allNpcLines('muzan');
  assert.ok(lines.length >= 80, `${lines.length} lines`);
  const all = lines.join('\n');
  assert.match(all, /변동성은 아름답지요/);
  assert.match(all, /손실은 숫자/);
  for (const l of lines) {
    assert.ok(!FORBIDDEN.test(l), l);
    assert.ok(!/[A-Za-z]{3,}/.test(l.replace(/\{\w+\}/g, '')), l);
    assert.ok(!/\p{Extended_Pictographic}/u.test(l), l);
  }
});

test('love lines cover every heart band and state, 60 characters at most, nothing dark', () => {
  const L = NPC_LOVE.muzan;
  assert.ok(L);
  for (const tier of NPC_LOVE_TIERS) assert.ok(L.tier[tier].length >= 4, tier);
  for (const k of ['accept', 'decline']) assert.ok(L.propose[k].length >= 3);
  assert.ok(L.wedding.length >= 3);
  const lines = allNpcLoveLines('muzan');
  assert.ok(lines.length >= 100, `${lines.length} love lines`);
  for (const l of lines) {
    assert.ok(l.length <= 60, l);
    assert.ok(!FORBIDDEN.test(l), l);
  }
  // No possessive jealousy: light words only.
  assert.ok(L.jealous.every((l) => !/(못 가|가지 마|허락|내 거)/.test(l)));
});

test('무잔 dates, gets engaged and marries like anyone else', () => {
  const m = { id: '00000000-1111-4111-8111-111111111111', actor: 0 };
  let ledger = registerWallet(newLoungeLedger(), 'wallet-' + m.id);
  let life = ensureLifeMember(emptyLife(), m.id, m.actor);
  const ext = ((life.ext ??= {})[m.id] ??= {});
  ext.npcRelations = { muzan: { points: NPC_DATING_POINTS } };
  ext.inv = { ...ext.inv, bouquet: 1, 'pledge-ring': 1 };
  const act = (op, now) => {
    const r = lifeAction(life, ledger, m, { kind: 'npcSocial', npc: 'muzan', op }, now);
    life = r.life;
    ledger = r.ledger;
    validateLedger(ledger);
  };
  act('ask', T0);
  assert.equal(life.ext[m.id].npcRelations.muzan.love, 'dating');
  life.ext[m.id].npcRelations.muzan.points = 120;
  act('propose', T0 + 3 * 24 * HOUR);
  assert.equal(life.ext[m.id].npcRelations.muzan.love, 'engaged');
  act('wedding', T0 + 6 * 24 * HOUR);
  assert.equal(life.ext[m.id].npcRelations.muzan.love, 'married');
  assert.match(life.news.flatMap((d) => d.lines).find((l) => l.kind === 'wedding').text, /무잔이 광장에서 결혼식을 올렸어요/);
});

test('neighbours: 로제 the rival lender, 잔나 the reporter, 신형만 the land man, 루미 at the casino', () => {
  for (const [b, kind] of [['rose', 'rival'], ['janna', 'regular'], ['realtor', 'rival'], ['lumi', 'regular']]) {
    assert.equal(npcBond('muzan', b)?.kind, kind, b);
    assert.ok(npcBanter('muzan', b, 'k'), `${b} banter`);
  }
  assert.equal(NPC_BONDS.filter((x) => x.a === 'muzan' || x.b === 'muzan').length, 4);
  for (const entry of NPC_BANTER_MUZAN)
    for (const pair of entry.lines)
      for (const line of pair) {
        assert.ok(line.length <= 24, `"${line}"`);
        assert.ok(!FORBIDDEN.test(line), line);
      }
  // Love talk in the banter now and then.
  assert.ok(NPC_BANTER_MUZAN.some((e) => e.lines.some(([p]) => /연애|꽃다발/.test(p))));
});

// ---------------------------------------------------------------- the counter's stock remarks
const quote = (sym, name, prev, px) => ({ sym, name, prev, px, lo: Math.ceil(prev * 0.85), hi: Math.floor(prev * 1.15) });
function market({ open = true, positions = [], log = [], events = [], profit = 0, stocks } = {}) {
  return {
    open,
    stocks: stocks ?? [quote('coop', '범마을 농협', 12_000, 12_000), quote('bvidia', '범비디아', 30_000, 30_000), quote('bakery', '느긋한 빵집', 3_200, 3_200)],
    me: { positions, log, profit, credit: { used: 0, limit: 300_000 }, equity: 0, ret: 0 },
    ranking: [],
    events,
  };
}
const pos = (sym, side = 'long', call = false) => ({ sym, side, q: 10, avg: 1, loan: 0, coll: 0, interest: 0, value: 0, equity: 0, pnl: 0, ratio: 1, call });

test('무잔 reacts at the counter: 반대매매, margin call, 상한가, 하한가, dividends, theme news, the bells', () => {
  const tue = dayWith(2),
    mon = dayWith(1);
  const at10 = at(tue, 10, 20);
  assert.equal(brokerSituation(undefined, at10).situation, 'offline');
  // A friend holding a stock at its 상한가 hears praise naming it.
  const up = market({ stocks: [quote('coop', '범마을 농협', 12_000, Math.floor(12_000 * 1.15))], positions: [pos('coop')] });
  const r = brokerRemark(up, '도원', 0, at10);
  assert.equal(r.situation, 'limitUp');
  assert.equal(r.mood, 'wow');
  assert.ok(BROKER_LINES.limitUp.some((t) => r.line === t.replaceAll('{me}', '도원').replace('{stock|을/를}', '범마을 농협을').replaceAll('{stock}', '범마을 농협')), r.line);
  assert.equal(brokerSituation(market({ stocks: up.stocks, positions: [pos('coop', 'short')] }), at10).situation, 'limitUpShort');
  // 하한가 on a long.
  const down = market({ stocks: [quote('bakery', '느긋한 빵집', 3_200, Math.ceil(3_200 * 0.85))], positions: [pos('bakery')] });
  assert.equal(brokerSituation(down, at10).situation, 'limitDown');
  // A 반대매매 today comes first, coolly.
  const liq = market({ positions: [pos('coop', 'long', true)], log: [{ at: at(tue, 10), sym: 'bvidia', op: 'liquidate', q: 3, px: 1, amount: 0, fee: 0 }] });
  const lr = brokerRemark(liq, '도원', 0, at10);
  assert.equal(lr.situation, 'liquidated');
  assert.equal(lr.mood, 'sorry');
  assert.equal(brokerSituation(market({ positions: [pos('coop', 'long', true)] }), at10).situation, 'call');
  // Yesterday's 반대매매 is history.
  assert.notEqual(brokerSituation(market({ log: [{ at: at(tue - 1, 10), sym: 'coop', op: 'liquidate', q: 1, px: 1, amount: 0, fee: 0 }] }), at10).situation, 'liquidated');
  // Monday morning is dividend day.
  assert.equal(brokerSituation(market(), at(mon, 9, 30)).situation, 'dividend');
  // Theme news today: 범성전자 · 범이닉스 · 범비디아.
  const news = market({ events: [{ at: at(tue, 10), sym: 'bvidia', kind: 'news', text: '새 칩', actor: null, good: true }] });
  const nr = brokerRemark(news, '도원', 0, at10);
  assert.equal(nr.situation, 'theme');
  assert.match(nr.line, /범비디아/);
  // The bells and the closed market.
  assert.equal(brokerSituation(market(), at(tue, 9, 10)).situation, 'open');
  assert.equal(brokerSituation(market(), at(tue, 15, 10)).situation, 'close');
  assert.equal(brokerSituation(market({ open: false }), at(tue, 8)).situation, 'preopen');
  assert.equal(brokerSituation(market({ open: false, positions: [pos('coop')], profit: 5_000 }), at(tue, 17)).situation, 'afterProfit');
  assert.equal(brokerSituation(market({ open: false, positions: [pos('coop')], profit: -5_000 }), at(tue, 17)).situation, 'afterLoss');
  // Same friend, same hour: the same line on every screen; particles follow the name.
  assert.equal(brokerRemark(news, '도원', 0, at10).line, nr.line);
  for (const [k, pool] of Object.entries(BROKER_LINES))
    for (const t of pool) {
      assert.ok(!FORBIDDEN.test(t), `${k}: ${t}`);
      assert.ok(t.length <= 70, `${k}: ${t}`);
      for (const [, key] of t.matchAll(/\{(\w+)(?:\|[^}]+)?\}/g)) assert.ok(['me', 'stock'].includes(key), `${k}: {${key}}`);
    }
  for (const name of ['범성전자', '범이닉스', '범비디아']) {
    const line = brokerRemark(market({ events: [{ at: at(tue, 10), sym: 'bsung', kind: 'news', text: '', actor: null, good: false }], stocks: [quote('bsung', name, 1, 1)] }), '민서', 1, at10).line;
    assert.ok(!/\{|\}/.test(line), line);
  }
});
