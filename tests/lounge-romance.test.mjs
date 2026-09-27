import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCS, NPC_INVITE_MS, assertNpcSocialContext, npcGuestOf, readNpcRelations } from '../app/lounge-romance.ts';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { FORAGE } from '../app/lounge-items.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const T0 = Date.UTC(2026, 8, 24, 3), DAY = 86400000;
const flower = FORAGE.find((f) => f.kind === 'flower').id;
function world() {
  const member = { id: '11111111-1111-4111-8111-111111111111', actor: 0 };
  let life = ensureLifeMember(emptyLife(), member.id, member.actor);
  life.ext = { [member.id]: { inv: { [flower]: 10, salad: 10 } } };
  let ledger = registerWallet(newLoungeLedger(), `wallet-${member.id}`);
  return {
    get life() { return life; }, get ledger() { return ledger; }, member,
    act(op, now = T0, npc = 'lumi', extra = {}) {
      const result = lifeAction(life, ledger, member, { kind: 'npcSocial', npc, op, ...extra }, now);
      life = result.life; ledger = result.ledger;
      validateLedger(ledger);
      return lifeView(life, member.id, member.actor, now);
    },
    view(now = T0) { return lifeView(life, member.id, member.actor, now); },
  };
}
test('adult NPC relationships are separate from seven-friend bonds and daily gift consumption is atomic', () => {
  assert.ok(Object.values(NPCS).every(npc => npc.age >= 20));
  const s = world(), ledger = structuredClone(s.ledger);
  s.act('talk');
  assert.equal(s.view().me.npcRelations[0].points, 6);
  s.act('gift', T0, 'lumi', { item: flower });
  assert.equal(s.view().me.npcRelations[0].points, 18);
  assert.equal(s.view().me.inv[flower], 9);
  assert.throws(() => s.act('gift', T0, 'lumi', { item: flower }), /오늘 선물/);
  assert.equal(s.view().me.inv[flower], 9);
  assert.throws(() => s.act('talk'), /오늘 이야기/);
  assert.throws(() => s.act('talk', T0, 0), /마을 주민/);
  assert.equal(s.life.bonds, undefined);
  assert.deepEqual(s.ledger, ledger);
  assert.equal(s.view().me.npcRelations[1].points, 0);
});
test('gift validation refuses absent or non-gift items without consuming or awarding', () => {
  const s = world(), before = s.life;
  assert.throws(() => s.act('gift', T0, 'lumi', { item: 'bait' }), /꽃이나/);
  assert.throws(() => s.act('gift', T0, 'lumi', { item: '__proto__' }), /꽃이나/);
  assert.throws(() => s.act('gift', T0, 'lumi', { item: 'fruittea' }), /주머니|꽃이나/);
  assert.equal(s.life, before);
});
test('home invitation lasts 20 minutes without refresh extension; another guest needs a farewell', () => {
  const s = world();
  assert.throws(() => s.act('invite'), /친밀도 20/);
  for (let d = 0; d < 4; d++) {
    s.act('talk', T0 + d * DAY);
    s.act('gift', T0 + d * DAY, 'lumi', { item: flower });
  }
  const now = T0 + 3 * DAY;
  s.act('invite', now);
  const guest = s.view(now).npcGuests['0'];
  assert.deepEqual(guest, { npc: 'lumi', until: now + NPC_INVITE_MS });
  assert.equal('points' in guest, false);
  s.life.ext[s.member.id].npcRelations.maehwa = { points: 20 };
  assert.throws(() => s.act('invite', now, 'maehwa'), /배웅한 뒤/);
  s.act('invite', now + 1000);
  assert.deepEqual(s.view(now + 1000).npcGuests['0'], guest);
  s.act('date', now + 1000);
  assert.equal(s.view(now).me.npcRelations[0].dates, 1);
  assert.throws(() => s.act('date', now + 2000), /오늘 데이트/);
  assert.deepEqual(s.view(now + NPC_INVITE_MS).npcGuests, {});
  assert.throws(() => s.act('date', now + NPC_INVITE_MS), /초대한 주민/);
  s.act('invite', now + NPC_INVITE_MS);
  s.act('dismiss', now + NPC_INVITE_MS + 1);
  assert.deepEqual(s.view(now + NPC_INVITE_MS + 1).npcGuests, {});
  s.act('invite', now + NPC_INVITE_MS + 2, 'maehwa');
  assert.equal(s.view(now + NPC_INVITE_MS + 2).npcGuests['0'].npc, 'maehwa');
});
test('server location gate rejects someone else’s home, expired visits, and fishing', () => {
  const action = (op, npc = 'lumi') => ({ kind: 'npcSocial', npc, op });
  const relation = { lumi: { points: 100, invitedUntil: T0 + NPC_INVITE_MS } };
  const at = (area, home = 0, fishing = false) => ({ area, home, actor: 0, fishing });
  assert.doesNotThrow(() => assertNpcSocialContext(action('talk'), relation, at('casino'), T0));
  assert.doesNotThrow(() => assertNpcSocialContext(action('talk', 'maehwa'), relation, at('lounge'), T0));
  assert.doesNotThrow(() => assertNpcSocialContext(action('date'), relation, at('home'), T0));
  assert.throws(() => assertNpcSocialContext(action('date'), relation, at('home', 1), T0), /내 방/);
  assert.throws(() => assertNpcSocialContext(action('date'), relation, at('home'), T0 + NPC_INVITE_MS), /내 방/);
  assert.throws(() => assertNpcSocialContext(action('invite'), relation, at('casino'), T0), /내 방/);
  assert.throws(() => assertNpcSocialContext(action('talk'), relation, at('lounge'), T0), /카지노/);
  assert.throws(() => assertNpcSocialContext(action('dismiss'), relation, at('home', 0, true), T0), /낚싯대/);
  assert.doesNotThrow(() => assertNpcSocialContext(action('dismiss'), relation, at('village'), T0));
});
test('save parser bounds NPC keys/counters and round-trips old and new worlds', () => {
  const s = world();
  assert.equal(readNpcRelations(null), undefined);
  const hostile = readNpcRelations({ lumi: { points: 9999, dates: 99999, invitedUntil: -1, talkedDay: NaN }, maehwa: { points: -1 }, '0': { points: 100 } });
  assert.deepEqual(hostile, { lumi: { points: 120, dates: 10000 } });
  assert.equal(npcGuestOf(hostile, T0), undefined);
  s.act('talk');
  s.act('gift', T0, 'lumi', { item: flower });
  s.act('talk', T0 + DAY);
  s.act('invite', T0 + DAY);
  const loaded = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(loaded.ext[s.member.id].npcRelations, s.life.ext[s.member.id].npcRelations);
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(loaded))), loaded);
  const old = ensureLifeMember(emptyLife(), s.member.id, 0);
  const before = JSON.stringify(old);
  const view = lifeView(old, s.member.id, 0, T0);
  assert.equal(view.me.npcRelations.length, 2);
  assert.deepEqual(view.npcGuests, {});
  assert.equal(JSON.stringify(old), before);
});

test('cloud NPC actions use authenticated identity, authoritative location, private views and idempotent receipts', async () => {
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  // Synthetic authenticated principals at the cloud boundary. Their public
  // account names match the fixed roster; no real credentials or saves exist.
  const people = [0, 1].map(actor => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), code: '', epoch: 0, sequence: 0 }));
  const [owner, visitor] = people;
  const apply = async (person, command, now = T0) => {
    const result = cloudTransition(state, person, command, await commandHash(command), now);
    state = result.state;
    person.epoch = result.response.epoch;
    if (result.response.code) person.code = result.response.code;
    validateLedger(state.ledger);
    const balances = Object.values(state.ledger.accounts).reduce((a, b) => a + b, 0);
    assert.equal(balances + (state.ledger.houseBalance ?? 0) - (state.ledger.granted ?? 0), Object.keys(state.ledger.accounts).length * 100000);
    return result.response;
  };
  const command = (person, op, extra = {}) => ({
    op, connection: person.connection, ...(person.code ? { code: person.code } : {}),
    ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++person.sequence } : {}),
    ...(['open', 'join'].includes(op) ? { epoch: person.epoch } : {}), ...extra,
  });
  const run = (person, op, extra = {}, now = T0) => apply(person, command(person, op, extra), now);
  const action = (person, value, now = T0) => run(person, 'action', { action: value }, now);
  assert.equal((await run(owner, 'open')).ok, true);
  visitor.code = owner.code;
  assert.equal((await run(visitor, 'join')).ok, true);
  assert.equal(state.life.actors[owner.id], 0);
  assert.equal(state.life.actors[visitor.id], 1);
  // Persisted synthetic progress/inventory lets the test isolate invitation
  // authorization without waiting several real days to earn the threshold.
  state.life.ext ??= {};
  state.life.ext[owner.id] = { ...state.life.ext[owner.id], inv: { [flower]: 2 }, npcRelations: { lumi: { points: 20 } } };

  const outside = await action(owner, { kind: 'npcSocial', npc: 'lumi', op: 'talk', area: 'casino' });
  assert.equal(outside.ok, false);
  assert.match(outside.error, /카지노/);
  assert.equal(state.life.ext[owner.id].npcRelations.lumi.points, 20);
  assert.equal((await action(owner, { kind: 'area', area: 'casino' })).ok, true);
  const talk = await action(owner, { kind: 'npcSocial', npc: 'lumi', op: 'talk' });
  assert.equal(talk.ok, true, talk.error);
  assert.equal(talk.life.me.npcRelations.find(row => row.npc === 'lumi').points, 26);
  assert.equal(state.life.ext[visitor.id]?.npcRelations, undefined);

  const giftCommand = command(owner, 'action', { action: { kind: 'npcSocial', npc: 'lumi', op: 'gift', item: flower } });
  const gift = await apply(owner, giftCommand);
  assert.equal(gift.ok, true, gift.error);
  assert.equal(gift.life.me.inv[flower], 1);
  assert.equal(gift.life.me.npcRelations[0].points, 38);
  const repeat = await apply(owner, giftCommand, T0 + 1);
  assert.equal(repeat.ok, true, repeat.error);
  assert.equal(repeat.life.me.inv[flower], 1, 'same successful receipt cannot consume a second gift');
  assert.equal(repeat.life.me.npcRelations[0].points, 38, 'same receipt cannot award points twice');
  assert.equal(state.receipts[owner.id].filter(receipt => receipt.id === giftCommand.requestId).length, 1);

  assert.equal((await action(owner, { kind: 'area', area: 'home', home: visitor.actor })).ok, true);
  const wrongHome = await action(owner, { kind: 'npcSocial', npc: 'lumi', op: 'invite', home: owner.actor });
  assert.equal(wrongHome.ok, false);
  assert.match(wrongHome.error, /내 방/);
  assert.equal(state.life.ext[owner.id].npcRelations.lumi.invitedUntil, undefined);
  assert.equal((await action(owner, { kind: 'area', area: 'home', home: owner.actor })).ok, true);
  const invited = await action(owner, { kind: 'npcSocial', npc: 'lumi', op: 'invite' }, T0 + 2);
  assert.equal(invited.ok, true, invited.error);
  const guest = { npc: 'lumi', until: T0 + 2 + NPC_INVITE_MS };
  assert.deepEqual(invited.life.npcGuests['0'], guest);
  const peer = await run(visitor, 'read', {}, T0 + 3);
  assert.equal(peer.ok, true, peer.error);
  assert.deepEqual(peer.life.npcGuests['0'], guest);
  assert.deepEqual(Object.keys(peer.life.npcGuests['0']).sort(), ['npc', 'until']);
  assert.equal(peer.life.me.npcRelations[0].points, 0, 'friend reads only their own private relationship');
  assert.equal(peer.life.ext, undefined, 'raw private NPC relation storage never reaches the public view');
  assert.equal(peer.life.npcRelations, undefined);
  const expired = await run(owner, 'wallet', {}, guest.until);
  assert.equal(expired.ok, true, expired.error);
  assert.deepEqual(expired.life.npcGuests, {}, 'server view removes the guest exactly at the 20-minute boundary');
});
