import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNT_IDS, ACTOR_COLORS, ACTOR_COUNT, ACTOR_IDS, ACTORS, isActor, isActorKey } from '../app/lounge-roster.ts';
import { ACCOUNTS, accountSave, serverAccountSave } from '../app/lounge-accounts.ts';
import { collectionsFor, defaultLook, freshLounge, readLounge, readLoungeStrict } from '../app/lounge-look.ts';
import { cloudTransition, commandHash, CloudError } from '../app/lounge-cloud-engine.ts';
import { INITIAL_BEOM, newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { ensureLifeMember, packLife, readLife, uidOf } from '../app/lounge-life.ts';
import { maxPlayers, validHomeOwner } from '../app/lounge-games.ts';
import { readSocial } from '../app/lounge-life-social.ts';

const OLD_NAMES = ['도원', '강재', '민서', '승준', '민재', '재민', '호현'];
const OLD_USERS = ['dowon', 'gangjae', 'minseo', 'seungjun', 'minjae', 'jaemin', 'hohyeon'];

test('Yuchan appends actor 7 while the original seven identities stay fixed', () => {
  assert.deepEqual(ACTORS.slice(0, 7), OLD_NAMES);
  assert.deepEqual(ACCOUNT_IDS.slice(0, 7), OLD_USERS);
  assert.equal(ACTOR_COUNT, 8);
  assert.equal(ACTOR_COLORS.length, ACTOR_COUNT);
  assert.deepEqual(ACTOR_IDS, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(ACCOUNTS[7], { actor: 7, username: 'yuchan', name: '유찬' });
  for (const actor of ACTOR_IDS) assert.equal(isActor(actor), true);
  for (const invalid of [-1, 8, 7.5, NaN, Infinity, '7', null, false, undefined])
    assert.equal(isActor(invalid), false, String(invalid));
  assert.equal(isActorKey('7'), true);
  for (const invalid of ['8', '-1', '07', '7.0', '', 'constructor']) assert.equal(isActorKey(invalid), false);
});

test('seven-look saves gain only the missing default look and keep their owner, room and outfits', () => {
  for (let actor = 0; actor < 7; actor++) {
    const legacy = freshLounge(actor);
    legacy.looks = legacy.looks.slice(0, 7);
    legacy.looks[actor] = { ...legacy.looks[actor], hairColor: '#123456', skinColor: '#fedcba' };
    legacy.saved = [{ id: 'kept', actor, name: '그대로', look: legacy.looks[actor] }];
    legacy.visits = 17;
    const restored = readLoungeStrict(JSON.stringify(legacy), actor);
    assert.equal(restored.actor, actor);
    assert.equal(restored.version, legacy.version);
    assert.deepEqual(restored.looks.slice(0, 7), legacy.looks);
    assert.deepEqual(restored.looks[7], defaultLook(7));
    assert.deepEqual(restored.saved, legacy.saved);
    assert.deepEqual(restored.bedroom, legacy.bedroom);
    assert.equal(restored.visits, 17);
  }
  assert.equal(freshLounge().actor, 6, 'legacy default stays HoHyeon');
  assert.equal(readLounge(JSON.stringify({ version: 1, actor: 8 })).actor, 6);
});

test('the new account saves its own outfits, rejects out-of-roster owners and cannot spoof another actor', () => {
  const save = freshLounge(7);
  assert.equal(save.actor, 7);
  assert.equal(save.looks.length, ACTOR_COUNT);
  assert.equal(defaultLook(7).hair, 'ink');
  assert.equal(defaultLook(7).top, 'cream');
  assert.deepEqual(collectionsFor(7).map((c) => c.id), ['classic', 'street', 'smart', 'akatsuki', 'maid']);
  save.saved.push({ id: 'yuchan', actor: 7, name: '내 옷', look: defaultLook(7) });
  const stored = serverAccountSave({ ...save, actor: 0 }, 7);
  assert.equal(stored.actor, 7);
  assert.equal(stored.saved[0].actor, 7);
  assert.deepEqual(readLoungeStrict(JSON.stringify(stored), 7), stored);
  for (const invalid of [-1, 8, 7.5, NaN]) assert.throws(() => accountSave(save, invalid), RangeError);
});

test('actor 7 persists through life and friendship readers without admitting unknown actor keys', () => {
  const uid = crypto.randomUUID();
  const life = ensureLifeMember(readLife(null), uid, 7);
  assert.equal(uidOf(life, 7), uid);
  assert.equal(readLife(packLife(life)).actors[uid], 7);
  assert.throws(() => ensureLifeMember(life, crypto.randomUUID(), 8));
  const social = readSocial({
    lines: { 7: ['유찬의 이야기'], 8: ['없는 친구'], '07': ['잘못된 키'] },
    hr: { '0>7': 2, '7>0': 4, '0>8': 2, '07>0': 2 },
    bondAt: { '0-7': 100, '0-8': 100 },
  });
  assert.deepEqual(social.lines, { 7: ['유찬의 이야기'] });
  assert.deepEqual(social.hr, { '0>7': 2, '7>0': 4 });
  assert.deepEqual(social.bondAt, { '0-7': 100 });
});

test('eight fixed accounts can share a village and reconnect with no extra initial grant', async () => {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const members = ACTOR_IDS.map((actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' }));
  const now = Date.UTC(2026, 10, 11, 3);
  const run = async (m, op) => {
    const command = { op, connection: m.connection, code: m.code,
      ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++m.sequence } : {}),
      ...(['open', 'join'].includes(op) ? { epoch: m.epoch } : {}) };
    const result = cloudTransition(world, m, command, await commandHash(command), now);
    world = result.state;
    m.epoch = result.response.epoch;
    if (result.response.code) m.code = result.response.code;
    validateLedger(world.ledger);
    assert.equal(result.response.ok, true);
    return result.response;
  };
  await run(members[0], 'open');
  for (const m of members.slice(1)) { m.code = members[0].code; await run(m, 'join'); }
  let packet = (await run(members[7], 'read')).packet;
  assert.deepEqual(packet.players.map((p) => p.actor).sort((a, b) => a - b), ACTOR_IDS);
  assert.equal(Object.keys(world.ledger.accounts).length, ACTOR_COUNT);
  assert.equal(Object.values(world.ledger.accounts).reduce((a, b) => a + b, 0), ACTOR_COUNT * INITIAL_BEOM);
  const balance = world.ledger.accounts['wallet-' + members[7].id];
  await run(members[7], 'leave');
  await run(members[7], 'join');
  assert.equal(world.ledger.accounts['wallet-' + members[7].id], balance);
  packet = (await run(members[0], 'read')).packet;
  assert.equal(packet.players.length, ACTOR_COUNT);
  assert.equal(validHomeOwner(7), true);
  assert.equal(validHomeOwner(8), false);
  assert.equal(maxPlayers('poker'), 7);
  assert.equal(maxPlayers('blackjack'), 7);
  assert.equal(maxPlayers('seotda'), 7);
  const invalid = { ...members[7], actor: 8 };
  const command = { op: 'read', connection: invalid.connection, code: invalid.code };
  assert.throws(() => cloudTransition(world, invalid, command, 'invalid', now), (e) => e instanceof CloudError && e.status === 403);
});
