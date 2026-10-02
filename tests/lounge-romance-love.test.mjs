// 연애·결혼 (handover/design/design-romance.md): 친구 → 연인 → 약혼 → 결혼,
// one partner at a time, hearts capped below dating, breakup cooldown, the
// spouse at home and the love lines of every resident.
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, LifeError } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay } from '../app/lounge-economy.ts';
import {
  NPC_BREAKUP,
  NPC_DATING_POINTS,
  NPC_DIVORCE,
  assertNpcSocialContext,
  npcGuestOf,
  readNpcRelations,
  spouseAtHome,
  spouseGiftOf,
} from '../app/lounge-romance.ts';
import { NPC_IDS, NPCS, NPC_SPOUSES, NPC_SISTER_FRIENDS } from '../app/lounge-npc-data.ts';
import { shopOffer } from '../app/lounge-shops.ts';
import { NPC_LOVE, NPC_LOVE_MARRIED, NPC_LOVE_BANTER, NPC_LOVE_TIERS, allNpcLoveLines, npcAnniversary, npcLoveLine, npcLovePools, npcLoveTier, npcWeddingLines } from '../app/lounge-npc-love.ts';
import { npcTalk, npcBanter } from '../app/lounge-npc-dialog.ts';
import { GAME_HOUR_MS, gameTimeOnDay } from '../app/lounge-calendar.ts';
import { npcLoveChoices, npcLoveTalk, npcTalkChoices } from '../app/lounge-npc-speech.ts';

const DAY = 86_400_000;
const HOUR = 3_600_000;
/** KST 12:00 of a day (03:00 UTC). */
const T0 = Date.UTC(2026, 9, 5, 3);
/** Game `hour` on real day `d` from T0 (게임 하루 = 실제 1시간). */
const at = (d, hour = 12) => gameTimeOnDay(kstDay(T0) + d, hour);

function world(n = 2) {
  const members = Array.from({ length: n }, (_, i) => ({ id: `0000000${i}-1111-4111-8111-111111111111`, actor: i }));
  let ledger = newLoungeLedger();
  let life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, get life() { return life; }, get ledger() { return ledger; } };
  s.act = (m, action, now = T0) => {
    const r = lifeAction(life, ledger, m, { kind: 'npcSocial', ...action }, now);
    life = r.life;
    ledger = r.ledger;
    validateLedger(ledger);
    return lifeView(life, m.id, m.actor, now);
  };
  s.buy = (m, item, now = T0) => {
    const r = lifeAction(life, ledger, m, { kind: 'buyItem', item, n: 1, at: 'general' }, now);
    life = r.life;
    ledger = r.ledger;
    validateLedger(ledger);
  };
  s.fails = (m, action, re, now = T0) => assert.throws(() => lifeAction(life, ledger, m, { kind: 'npcSocial', ...action }, now), (e) => e instanceof LifeError && re.test(e.message));
  s.rel = (m, npc) => life.ext?.[m.id]?.npcRelations?.[npc];
  s.set = (m, npc, row) => {
    const ext = ((life.ext ??= {})[m.id] ??= {});
    (ext.npcRelations ??= {})[npc] = row;
  };
  s.give = (m, item, n = 1) => {
    const ext = ((life.ext ??= {})[m.id] ??= {});
    ext.inv = { ...ext.inv, [item]: (ext.inv?.[item] ?? 0) + n };
  };
  s.view = (m, now = T0) => lifeView(life, m.id, m.actor, now);
  return s;
}

test('without dating, points stop at 8 hearts; older rows above it keep what they had', () => {
  const s = world(1), [m] = s.members;
  s.set(m, 'nasera', { points: NPC_DATING_POINTS - 2 });
  s.act(m, { npc: 'nasera', op: 'talk' });
  assert.equal(s.rel(m, 'nasera').points, NPC_DATING_POINTS);
  s.set(m, 'frieren', { points: 110 });
  s.act(m, { npc: 'frieren', op: 'talk' }, at(0, 13));
  assert.equal(s.rel(m, 'frieren').points, 110);
  assert.equal(s.view(m).me.npcRelations.find((r) => r.npc === 'nasera').hearts, 8);
});

test('the 등불 잡화점 sells the bouquet and the ring; nobody else does, and buying keeps the ledger whole', () => {
  for (const item of ['bouquet', 'pledge-ring']) {
    assert.ok(shopOffer({ flags: [] }, 0, 'general', item, T0), item);
    for (const shop of ['coop', 'bakery', 'fishmarket', 'tavern', 'peddler', 'forge']) assert.equal(shopOffer({ flags: ['district-harbor'] }, 0, shop, item, T0), null, `${shop} ${item}`);
  }
  const s = world(1), [m] = s.members;
  s.buy(m, 'bouquet');
  s.buy(m, 'pledge-ring');
  assert.equal(s.view(m).me.inv.bouquet, 1);
  assert.equal(s.view(m).me.inv['pledge-ring'], 1);
  // Not a gift: the ordinary gift path refuses it.
  s.set(m, 'lumi', { points: 50 });
  s.fails(m, { npc: 'lumi', op: 'gift', item: 'bouquet' }, /꽃이나/);
});

test('friend → 연인 → 약혼 → 결혼, with the ceremony in the news and the ledger untouched', () => {
  const s = world(2), [m, other] = s.members;
  const ledger = structuredClone(s.ledger);
  s.set(m, 'janna', { points: NPC_DATING_POINTS - 12 });
  s.fails(m, { npc: 'janna', op: 'ask' }, /꽃다발이 없어요/);
  s.give(m, 'bouquet', 2);
  s.fails(m, { npc: 'janna', op: 'ask' }, /8하트/);
  assert.equal(s.view(m).me.inv.bouquet, 2, 'a refusal keeps the bouquet');
  s.rel(m, 'janna').points = NPC_DATING_POINTS;
  s.act(m, { npc: 'janna', op: 'ask' });
  assert.equal(s.rel(m, 'janna').love, 'dating');
  assert.equal(s.rel(m, 'janna').since, kstDay(T0));
  assert.equal(s.view(m).me.inv.bouquet, 1);
  // One partner at a time.
  s.set(m, 'lux', { points: 100 });
  s.fails(m, { npc: 'lux', op: 'ask' }, /함께하는 동안/);
  // Dating lifts the cap.
  s.act(m, { npc: 'janna', op: 'talk' });
  assert.equal(s.rel(m, 'janna').points, NPC_DATING_POINTS + 6);
  s.rel(m, 'janna').points = 120;
  s.fails(m, { npc: 'janna', op: 'propose' }, /청혼 반지가 없어요/);
  s.give(m, 'pledge-ring');
  s.fails(m, { npc: 'janna', op: 'propose' }, /사귄 지 3일/, at(2));
  s.act(m, { npc: 'janna', op: 'propose' }, at(3));
  assert.equal(s.rel(m, 'janna').love, 'engaged');
  assert.equal(s.rel(m, 'janna').weddingDay, kstDay(at(6)));
  assert.equal(s.view(m, at(3)).me.inv['pledge-ring'] ?? 0, 0);
  // An engaged resident belongs to one friend.
  s.set(other, 'janna', { points: NPC_DATING_POINTS });
  s.give(other, 'bouquet');
  s.fails(other, { npc: 'janna', op: 'ask' }, /다른 친구와 약속/, at(3));
  assert.deepEqual(s.view(other, at(3)).npcSpouses, { janna: 0 });
  s.fails(m, { npc: 'janna', op: 'wedding' }, /3일 뒤/, at(3));
  s.act(m, { npc: 'janna', op: 'wedding' }, at(6));
  assert.equal(s.rel(m, 'janna').love, 'married');
  const news = s.life.news.flatMap((d) => d.lines).find((l) => l.kind === 'wedding');
  assert.match(news.text, /잔나가 광장에서 결혼식을 올렸어요/);
  assert.deepEqual(news.actors, [0]);
  assert.deepEqual(s.ledger, ledger);
});

test('the ceremony is at the plaza; asking and proposing happen where the resident is', () => {
  const rel = { janna: { points: 120, love: 'engaged', weddingDay: 0 } };
  const ctx = (area) => ({ area, actor: 0, fishing: false });
  assert.throws(() => assertNpcSocialContext({ kind: 'npcSocial', npc: 'janna', op: 'wedding' }, rel, ctx('market'), T0), /광장/);
  assertNpcSocialContext({ kind: 'npcSocial', npc: 'janna', op: 'wedding' }, rel, ctx('village'), T0);
  assertNpcSocialContext({ kind: 'npcSocial', npc: 'janna', op: 'breakup' }, rel, ctx('mine'), T0);
  assert.throws(() => assertNpcSocialContext({ kind: 'npcSocial', npc: 'janna', op: 'ask' }, {}, ctx('mine'), T0));
});

test('a spouse sleeps in my room, hands over one present a day there, and works by day', () => {
  const s = world(1), [m] = s.members;
  s.set(m, 'lumi', { points: 120, love: 'married', since: 0, weddingDay: kstDay(T0) });
  const night = at(1, 3);
  assert.ok(spouseAtHome('lumi', night));
  assert.ok(!spouseAtHome('lumi', at(1, 14)));
  const guest = s.view(m, night).npcGuests['0'];
  assert.equal(guest.npc, 'lumi');
  assert.equal(guest.spouse, true);
  assert.ok(guest.until > night && guest.until <= at(1, 8) + GAME_HOUR_MS);
  assert.equal(npcGuestOf(s.life.ext[m.id].npcRelations, at(1, 14)), undefined);
  // The present: at home, once a day.
  const home = { area: 'home', home: 0, actor: 0, fishing: false };
  assertNpcSocialContext({ kind: 'npcSocial', npc: 'lumi', op: 'homeGift' }, s.life.ext[m.id].npcRelations, home, night);
  assert.throws(() => assertNpcSocialContext({ kind: 'npcSocial', npc: 'lumi', op: 'homeGift' }, s.life.ext[m.id].npcRelations, { ...home, area: 'village' }, night), /내 방/);
  const item = spouseGiftOf('lumi', m.id, kstDay(night));
  const before = s.view(m, night).me.inv[item] ?? 0;
  s.act(m, { npc: 'lumi', op: 'homeGift' }, night);
  assert.equal(s.view(m, night).me.inv[item], before + 1);
  s.fails(m, { npc: 'lumi', op: 'homeGift' }, /오늘 선물/, night + 1000);
  s.fails(m, { npc: 'lumi', op: 'homeGift' }, /일하러/, at(2, 14));
  assert.equal(s.view(m, night).me.npcRelations.find((r) => r.npc === 'lumi').homeGifted, true);
  // Talking at home needs no trip to the casino.
  assertNpcSocialContext({ kind: 'npcSocial', npc: 'lumi', op: 'talk' }, s.life.ext[m.id].npcRelations, home, night);
});

test('breaking up costs hearts and starts a cooldown for any new bouquet', () => {
  const s = world(1), [m] = s.members;
  s.set(m, 'gwen', { points: 110, love: 'dating', since: 0 });
  s.act(m, { npc: 'gwen', op: 'breakup' });
  assert.equal(s.rel(m, 'gwen').points, NPC_BREAKUP.points);
  assert.equal(s.rel(m, 'gwen').love, undefined);
  s.set(m, 'lux', { points: NPC_DATING_POINTS });
  s.give(m, 'bouquet');
  s.fails(m, { npc: 'lux', op: 'ask' }, /7일 뒤/);
  s.act(m, { npc: 'lux', op: 'ask' }, at(NPC_BREAKUP.days));
  assert.equal(s.rel(m, 'lux').love, 'dating');
  // Divorce costs more.
  s.set(m, 'lux', { points: 120, love: 'married', weddingDay: 1 });
  s.act(m, { npc: 'lux', op: 'breakup' }, at(NPC_BREAKUP.days));
  assert.equal(s.rel(m, 'lux').points, NPC_DIVORCE.points);
  assert.equal(s.rel(m, 'lux').coolUntil, kstDay(at(NPC_BREAKUP.days)) + NPC_DIVORCE.days);
  s.fails(m, { npc: 'gwen', op: 'breakup' }, /헤어질 사이/);
});

test('saved love fields load back; malformed ones are dropped', () => {
  const out = readNpcRelations({ lumi: { points: 120, love: 'married', since: 3, weddingDay: 9, homeGiftDay: 10, coolUntil: 2 }, gwen: { points: 50, love: 'boss', since: -1 } });
  assert.deepEqual(out.lumi, { points: 120, love: 'married', since: 3, weddingDay: 9, homeGiftDay: 10, coolUntil: 2 });
  assert.deepEqual(out.gwen, { points: 50 });
});

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const LOVE_PLACEHOLDERS = new Set(['me', 'name', 'season', 'weather', 'item', 'partner', 'days', 'place']);
/** The writing rules every love line keeps (design-romance.md 3장). */
function checkLines(id, lines) {
  for (const line of lines) {
    assert.ok(line.length <= 60, `${id}: too long "${line}"`);
    assert.ok(!EMOJI.test(line), `${id}: emoji in "${line}"`);
    assert.ok(!/[A-Za-z]{3,}/.test(line.replace(/\{\w+\}/g, '')), `${id}: English in "${line}"`);
    for (const [, key] of line.matchAll(/\{(\w+)\}/g)) assert.ok(LOVE_PLACEHOLDERS.has(key), `${id}: {${key}}`);
    assert.ok(!/\}(이|가|은|는|을|를|과|와|랑|이랑|의|에게|한테)/.test(line), `${id}: josa after a placeholder in "${line}"`);
    assert.ok(!/경험해 보세요|완벽한|다양한/.test(line), `${id}: ad copy in "${line}"`);
  }
}
// The realty couple (신형만 · 봉미선) are married to each other: friendship lines only (NPC_LOVE_MARRIED).
const WRITTEN = NPC_IDS.filter((id) => !NPC_SPOUSES[id]);
test('every resident but the married couple has love lines for every heart band and state', () => {
  const min = { h0: 4, h3: 4, h5: 4, h7: 5, dating: 7, engaged: 5, married: 7 };
  for (const id of WRITTEN) {
    const L = NPC_LOVE[id];
    assert.ok(L, `${id} love file`);
    for (const tier of NPC_LOVE_TIERS) assert.ok(L.tier[tier].length >= min[tier], `${id} ${tier}`);
    for (const t of ['dawn', 'day', 'evening', 'night']) assert.ok(L.greet[t].length >= 2, `${id} greet ${t}`);
    for (const w of ['rain', 'snow', 'sunny']) assert.ok(L.weather[w].length >= 2, `${id} weather ${w}`);
    for (const se of ['spring', 'summer', 'autumn', 'winter']) assert.ok(L.season[se].length >= 2, `${id} season ${se}`);
    for (const k of ['accept', 'decline', 'taken']) assert.ok(L.ask[k].length >= 2, `${id} ask ${k}`);
    for (const k of ['accept', 'decline']) assert.ok(L.propose[k].length >= 3, `${id} propose ${k}`);
    assert.ok(L.wedding.length >= 3, `${id} wedding`);
    for (const k of ['morning', 'evening', 'anniversary', 'gift', 'night']) assert.ok(L.home[k].length >= 3, `${id} home ${k}`);
    assert.ok(L.home.anniversary.every((l) => l.includes('{days}')), `${id} anniversary {days}`);
    assert.ok(L.home.gift.every((l) => l.includes('{item}')), `${id} gift {item}`);
    for (const k of ['jealous', 'tease', 'breakup']) assert.ok(L[k].length >= 3, `${id} ${k}`);
    const lines = allNpcLoveLines(id);
    assert.ok(lines.length >= 90, `${id} has ${lines.length} love lines`);
    checkLines(id, lines);
  }
});

test('talks unlock the love lines by hearts and state', () => {
  assert.equal(npcLoveTier(0), 'h0');
  assert.equal(npcLoveTier(40), 'h3');
  assert.equal(npcLoveTier(70), 'h5');
  assert.equal(npcLoveTier(96), 'h7');
  assert.equal(npcLoveTier(96, 'dating'), 'dating');
  assert.equal(npcAnniversary(100), 100);
  assert.equal(npcAnniversary(101), null);
  for (const id of WRITTEN) {
    const L = NPC_LOVE[id];
    const seen = { dating: false, married: false, jealous: false };
    for (let d = 0; d < 40; d++) {
      const base = { npc: id, me: '도원', who: 0, now: at(d), talkedToday: false };
      const date = npcTalk({ ...base, points: 110, love: 'dating', days: d + 1 }).lines;
      if (date.some((l) => L.tier.dating.some((t) => l === t.replaceAll('{me}', '도원')) || Object.values(L.greet).flat().some((t) => l === t.replaceAll('{me}', '도원')))) seen.dating = true;
      const wed = npcTalk({ ...base, now: at(d, 6), points: 120, love: 'married', days: d + 1, atHome: true }).lines;
      if (wed.some((l) => [...L.tier.married, ...L.home.morning].some((t) => l === t.replaceAll('{me}', '도원')))) seen.married = true;
      const jealous = npcTalk({ ...base, points: 80, otherPartner: '루미' }).lines;
      if (jealous.some((l) => L.jealous.some((t) => l === t.replaceAll('{me}', '도원').replaceAll('{partner}', '루미')))) seen.jealous = true;
    }
    assert.deepEqual(seen, { dating: true, married: true, jealous: true }, id);
  }
});

test('the box offers a bouquet, a ring, the ceremony and the morning present when they apply', () => {
  const day = 100;
  const rows = [{ npc: 'lumi', points: 96 }];
  assert.deepEqual(npcLoveChoices({ npc: 'lumi', rows, day, bouquets: 1, rings: 0, area: 'casino' }), ['ask']);
  assert.deepEqual(npcLoveChoices({ npc: 'lumi', rows, day, bouquets: 0, rings: 0, area: 'casino' }), []);
  const dating = [{ npc: 'lumi', points: 120, love: 'dating', since: 90 }];
  assert.deepEqual(npcLoveChoices({ npc: 'lumi', rows: dating, day, bouquets: 1, rings: 1, area: 'casino' }), ['propose']);
  assert.deepEqual(npcLoveChoices({ npc: 'gwen', rows: dating, day, bouquets: 1, rings: 1, area: 'salon' }), []);
  const engaged = [{ npc: 'lumi', points: 120, love: 'engaged', weddingDay: 100 }];
  assert.deepEqual(npcLoveChoices({ npc: 'lumi', rows: engaged, day, bouquets: 0, rings: 0, area: 'village' }), ['wedding']);
  const married = [{ npc: 'lumi', points: 120, love: 'married', weddingDay: 60, atHome: true }];
  assert.deepEqual(npcLoveChoices({ npc: 'lumi', rows: married, day, bouquets: 0, rings: 0, area: 'home' }), ['homeGift']);
  assert.deepEqual(npcLoveTalk(married, 'lumi', day), { love: 'married', days: 40, atHome: true });
  assert.deepEqual(npcLoveTalk(married, 'gwen', day), { otherPartner: NPCS.lumi.name, otherNpc: 'lumi', otherLove: 'married' });
  const choices = npcTalkChoices({ talked: false, gifted: false, busy: false, blocked: '', love: ['ask'] }).map((c) => c.id);
  assert.deepEqual(choices, ['talk', 'gift', 'ask', 'book', 'bye']);
});

test('residents tease each other about love when they meet', () => {
  let love = 0;
  for (let k = 0; k < 60; k++) {
    const b = npcBanter('janna', 'sinjjajang', `k${k}`);
    if (b && /꽃|연애|마음|좋아|데이트|결혼|고백/.test(b.lines.join(' '))) love++;
  }
  assert.ok(love > 0);
});

// 발키리 (carpenter): a full love file, 한남 jokes that turn into "내가 한남이랑
// 결혼을 하다니", and 언니·동생 lines for the friends in NPC_SISTER_FRIENDS.
test('발키리 dates, gets engaged and marries like anyone else', () => {
  const s = world(1), [m] = s.members;
  s.set(m, 'carpenter', { points: NPC_DATING_POINTS });
  s.give(m, 'bouquet');
  s.act(m, { npc: 'carpenter', op: 'ask' });
  assert.equal(s.rel(m, 'carpenter').love, 'dating');
  s.rel(m, 'carpenter').points = 120;
  s.give(m, 'pledge-ring');
  s.act(m, { npc: 'carpenter', op: 'propose' }, at(3));
  assert.equal(s.rel(m, 'carpenter').love, 'engaged');
  s.act(m, { npc: 'carpenter', op: 'wedding' }, at(6));
  assert.equal(s.rel(m, 'carpenter').love, 'married');
  assert.match(s.life.news.flatMap((d) => d.lines).find((l) => l.kind === 'wedding').text, /발키리가 광장에서 결혼식을 올렸어요/);
});

test('발키리’s lines: tsundere warming by hearts, the 한남 marriage gag, 언니·동생 for the sister friends', () => {
  const L = NPC_LOVE.carpenter;
  const gag = /한남(이랑|한테).*(결혼|연애|꽃)/;
  for (const pool of [L.ask.accept, L.propose.accept, L.wedding, L.tier.engaged, L.tier.married]) assert.ok(pool.some((l) => gag.test(l)), pool[0]);
  assert.ok(L.tier.h0.some((l) => /한남/.test(l)));
  assert.ok(L.tier.h7.some((l) => /꽃/.test(l)));
  // 언니·동생: every band, the bouquet and ring answers and the vows, with no 한남 jab.
  const S = L.sister;
  for (const tier of NPC_LOVE_TIERS) {
    assert.ok(S.tier[tier].length >= 4, `sister ${tier}`);
    assert.ok(S.tier[tier].every((l) => !/한남이랑|한남아|한남 손님/.test(l)), `sister ${tier}`);
  }
  assert.ok(Object.values(S.tier).flat().some((l) => /언니|동생/.test(l)));
  const sister = NPC_SISTER_FRIENDS[0];
  assert.ok(S.ask.accept.includes(npcLoveLine('carpenter', 'ask-accept', 'k', sister)));
  assert.ok(L.ask.accept.includes(npcLoveLine('carpenter', 'ask-accept', 'k', '영수')));
  assert.ok(S.propose.accept.includes(npcLoveLine('carpenter', 'propose-accept', 'k', sister)));
  assert.deepEqual(npcWeddingLines('carpenter', sister), S.wedding);
  assert.deepEqual(npcWeddingLines('carpenter', '영수'), L.wedding);
  // Talks: a sister friend hears her band from the sister lines, anyone else from the main ones.
  const pools = (me) => npcLovePools({ npc: 'carpenter', points: 110, love: 'dating', me }, at(0));
  assert.deepEqual(pools(sister)[0], S.tier.dating);
  assert.deepEqual(pools('영수')[0], L.tier.dating);
  checkLines('carpenter', allNpcLoveLines('carpenter'));
});

// 신형만 · 봉미선: married to each other, never to a friend.
test('the realty couple turn down a bouquet and a ring (the item stays) and old love rows are dropped', () => {
  assert.deepEqual(NPC_SPOUSES, { realtor: 'misun', misun: 'realtor' });
  const s = world(1), [m] = s.members;
  for (const [npc, spouse] of [['realtor', '봉미선'], ['misun', '신형만']]) {
    s.set(m, npc, { points: 120 });
    s.give(m, 'bouquet');
    s.give(m, 'pledge-ring');
    s.fails(m, { npc, op: 'ask' }, new RegExp(`${spouse}.*결혼한 사이`));
    s.fails(m, { npc, op: 'propose' }, /결혼한 사이/);
    assert.equal(s.rel(m, npc).love, undefined);
  }
  assert.equal(s.view(m).me.inv.bouquet, 2, 'refusals keep the bouquets');
  assert.equal(s.view(m).me.inv['pledge-ring'], 2, 'refusals keep the rings');
  // Their refusals name the spouse; there is no yes.
  for (const [npc, spouse] of [['realtor', /미선/], ['misun', /형만/]]) {
    const M = NPC_LOVE_MARRIED[npc];
    assert.ok(M.refuse.bouquet.filter((l) => spouse.test(l)).length >= 3, npc);
    assert.ok(M.refuse.ring.every((l) => /반지|계약|미선|형만/.test(l)), npc);
    for (let k = 0; k < 20; k++) {
      for (const moment of ['ask-accept', 'ask-decline', 'ask-taken']) assert.ok(M.refuse.bouquet.includes(npcLoveLine(npc, moment, `k${k}`)), `${npc} ${moment}`);
      for (const moment of ['propose-accept', 'propose-decline']) assert.ok(M.refuse.ring.includes(npcLoveLine(npc, moment, `k${k}`)), `${npc} ${moment}`);
    }
  }
  // A row saved while 'realtor' could still be courted loads as a friendship.
  const read = readNpcRelations({ realtor: { points: 110, love: 'married', since: 3, weddingDay: 9, homeGiftDay: 10 }, misun: { points: 40, love: 'dating', since: 2, coolUntil: 7 } });
  assert.deepEqual(read.realtor, { points: 110 });
  assert.deepEqual(read.misun, { points: 40, coolUntil: 7 });
  assert.deepEqual(s.view(m).npcSpouses, {});
});

test('the realty couple have friendship lines by hearts, banter about each other, and cheer a friend’s love', () => {
  for (const id of ['realtor', 'misun']) {
    const M = NPC_LOVE_MARRIED[id];
    assert.equal(NPC_LOVE[id], undefined, `${id} is not courted`);
    for (const t of ['h0', 'h3', 'h5', 'h7']) assert.ok(M.tier[t].length >= 4, `${id} ${t}`);
    for (const k of ['spouse', 'carpenter', 'advice']) assert.ok(M[k].length >= 4, `${id} ${k}`);
    for (const k of ['dating', 'engaged', 'married']) assert.ok(M.news[k].length >= 3, `${id} news ${k}`);
    assert.ok(M.newsCarpenter.length >= 2 && M.newsCarpenter.every((l) => /발키리/.test(l)), `${id} 발키리 news`);
    assert.ok(M.carpenter.every((l) => /발키리/.test(l)), `${id} about 발키리`);
    assert.ok(M.spouse.every((l) => /(미선|형만|아내)/.test(l)), `${id} about the spouse`);
    // No romance with a friend in their bands.
    assert.ok(Object.values(M.tier).flat().every((l) => !/사랑|설레|고백|사귀/.test(l)), `${id} bands are friendship`);
    const lines = allNpcLoveLines(id);
    assert.ok(lines.length >= 60, `${id} has ${lines.length} lines`);
    checkLines(id, lines);
    // Pools: the band, the spouse and 발키리; news by stage, 발키리 news, advice once engaged.
    const base = { npc: id, points: 70 };
    const plain = npcLovePools(base, T0);
    assert.deepEqual(plain, [M.tier.h5, M.tier.h5, M.spouse, M.carpenter]);
    assert.equal(npcLovePools({ ...base, points: 120 }, T0)[0], M.tier.h7);
    const dating = npcLovePools({ ...base, otherPartner: '루미', otherNpc: 'lumi', otherLove: 'dating' }, T0);
    assert.ok(dating.includes(M.news.dating) && !dating.includes(M.advice) && !dating.includes(M.newsCarpenter));
    const wed = npcLovePools({ ...base, otherPartner: '발키리', otherNpc: 'carpenter', otherLove: 'married' }, T0);
    assert.ok(wed.includes(M.news.married) && wed.includes(M.advice) && wed.includes(M.newsCarpenter));
    // A talk carries them (the friend is married to 발키리).
    let heard = false;
    for (let d = 0; d < 40 && !heard; d++) {
      const talk = npcTalk({ npc: id, me: '도원', who: 0, now: at(d), points: 70, talkedToday: false, otherPartner: '발키리', otherNpc: 'carpenter', otherLove: 'married' }).lines;
      heard = talk.some((l) => [...M.news.married, ...M.newsCarpenter, ...M.advice].some((t) => l === t.replaceAll('{me}', '도원').replaceAll('{partner}', '발키리')));
    }
    assert.ok(heard, `${id} cheers`);
  }
});

test('love banter for the couple and 발키리 stays short and meets', () => {
  for (const [a, b] of [['misun', 'realtor'], ['realtor', 'carpenter'], ['misun', 'carpenter'], ['carpenter', 'tsunade']]) {
    const entry = NPC_LOVE_BANTER.find((x) => x.a === a && x.b === b && x.lines.some(([p]) => /연애|꽃|결혼|청혼|한남/.test(p)));
    assert.ok(entry, `${a}-${b} love banter`);
    for (const pair of entry.lines) for (const line of pair) assert.ok(line.length <= 24, `${a}-${b}: "${line}"`);
  }
});
