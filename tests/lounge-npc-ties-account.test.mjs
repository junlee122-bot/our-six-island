// 주민 관계도 kept with the account: 엿듣기 / 끼어들기 note the pair on the
// server (same meeting and reach check as joining), the member's view carries
// it, and the pairs an older client kept in the browser are taken once.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, kstDay } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { VISIBLE_NPC_IDS } from '../app/lounge-npc-data.ts';
import { NPC_TIES, NPC_TIE_KEYS, addTiesSeen, pairKey, readTiesSeen } from '../app/lounge-npc-social-ties.ts';
import { npcSocialScene } from '../app/lounge-npc-social.ts';
import { npcSpot } from '../app/lounge-npc-schedule.ts';
import { dayStart } from '../app/lounge-calendar.ts';
import { assertNpcSocialContext, npcSocialAction } from '../app/lounge-romance.ts';
import { lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { regionToNetwork } from '../app/lounge-areas.ts';
import { villageToNetwork } from '../app/lounge-village-layout.ts';
import { legacyNpcTiesSeen, migrateNpcTiesSeen } from '../app/lounge/npc-ties-seen.ts';

const uuid = () => crypto.randomUUID();
const T0 = Date.UTC(2026, 9, 1, 3);
/** A meeting of two tied residents outdoors (no district flags), with a point beside it. */
function meeting() {
  for (let d = 0; d < 14; d++)
    for (let m = 6 * 60; m < 24 * 60; m += 20) {
      const now = dayStart(kstDay(T0) + d) + m * 60_000;
      const spots = VISIBLE_NPC_IDS.map((id) => npcSpot(id, now, {}));
      for (const ev of npcSocialScene(spots, now)) {
        if (!NPC_TIE_KEYS.has(pairKey(ev.a, ev.b))) continue;
        const p = ev.area === 'village' ? villageToNetwork(ev.pos[ev.a]) : ['market'].includes(ev.area) ? regionToNetwork(ev.area, ev.pos[ev.a]) : null;
        if (p) return { now, ev, near: p };
      }
    }
  throw new Error('no meeting found');
}

test('stored pairs: only real tie keys, no repeats, capped', () => {
  const key = pairKey(NPC_TIES[0].a, NPC_TIES[0].b);
  assert.deepEqual(readTiesSeen([key, key, 'nope:x', 7, 'a:b']), [key]);
  assert.equal(readTiesSeen('x'), undefined);
  assert.equal(readTiesSeen(['bad']), undefined);
  assert.equal(addTiesSeen([key], [key, 'bad']), null, 'nothing new');
  const all = [...NPC_TIE_KEYS];
  assert.equal(addTiesSeen([], [...all, ...all]).length, NPC_TIE_KEYS.size);
  assert.ok(readTiesSeen([...all, ...all]).length <= NPC_TIE_KEYS.size);
});

test('overhear is checked like join and notes the pair without points; join notes it too', () => {
  const { now, ev, near } = meeting();
  const ctx = { area: ev.area, actor: 0, fishing: false, x: near.x, y: near.y };
  const overhear = { kind: 'npcSocial', npc: ev.a, op: 'overhear', with: ev.b };
  assert.doesNotThrow(() => assertNpcSocialContext(overhear, {}, ctx, now));
  assert.throws(() => assertNpcSocialContext(overhear, {}, { ...ctx, area: ev.area === 'village' ? 'market' : 'village' }, now), /가까이/);
  assert.throws(() => assertNpcSocialContext({ ...overhear, with: ev.a }, {}, ctx, now), /다시 골라/);
  const life = { ext: {}, bag: {}, farms: {} };
  npcSocialAction(life, 'u', overhear, now);
  assert.deepEqual(life.ext.u.npcTiesSeen, [pairKey(ev.a, ev.b)]);
  assert.equal(life.ext.u.npcRelations, undefined, 'no points and no relation rows');
  npcSocialAction(life, 'u', overhear, now);
  assert.equal(life.ext.u.npcTiesSeen.length, 1, 'no repeats');
  const other = { ext: {}, bag: {}, farms: {} };
  npcSocialAction(other, 'v', { ...overhear, op: 'join' }, now);
  assert.deepEqual(other.ext.v.npcTiesSeen, [pairKey(ev.a, ev.b)]);
});

test('cloud: every member keeps their own pairs; the view returns them; far away is refused', async () => {
  const { now, ev, near } = meeting();
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const member = (actor) => ({ id: uuid(), actor, username: ACCOUNT_IDS[actor], connection: uuid(), sequence: 0, epoch: 0, code: '' });
  const run = async (p, op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}), ...(op !== 'read' ? { requestId: uuid(), sequence: ++p.sequence } : {}), ...(op === 'open' ? { epoch: p.epoch } : {}), ...extra };
    const r = cloudTransition(world, p, command, await commandHash(command), now);
    world = r.state;
    p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    return r.response;
  };
  const a = member(2), b = member(5);
  await run(a, 'open', { code: 'BEMTADUVLY' });
  await run(b, 'open', { code: 'BEMTADUVLY' });
  const overhear = { kind: 'npcSocial', npc: ev.a, op: 'overhear', with: ev.b };
  // b stays far from the pair: refused, nothing noted.
  await run(b, 'action', { action: { kind: 'area', area: ev.area === 'village' ? 'market' : 'village' } });
  assert.equal((await run(b, 'action', { action: overhear })).ok, false);
  await run(a, 'action', { action: { kind: 'area', area: ev.area, x: near.x, y: near.y } });
  const r = await run(a, 'action', { action: overhear });
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(r.life.me.npcTiesSeen, [pairKey(ev.a, ev.b)]);
  assert.deepEqual(readLife(world.life).ext[a.id].npcTiesSeen, [pairKey(ev.a, ev.b)]);
  assert.deepEqual((await run(b, 'read')).life.me.npcTiesSeen, []);
});

test('the browser’s old pairs are taken once (valid keys only), then later sends change nothing', () => {
  const m = { id: uuid(), actor: 3 };
  const keys = [...NPC_TIE_KEYS];
  let life = readLife(undefined);
  ({ life } = lifeAction(life, newLoungeLedger(), m, { kind: 'npcTies', pairs: [keys[0], keys[1], 'evil:key', keys[0]] }, T0));
  assert.deepEqual(lifeView(life, m.id, m.actor, T0).me.npcTiesSeen.sort(), [keys[0], keys[1]].sort());
  ({ life } = lifeAction(life, newLoungeLedger(), m, { kind: 'npcTies', pairs: keys }, T0 + 1));
  assert.equal(lifeView(life, m.id, m.actor, T0).me.npcTiesSeen.length, 2, 'only the first send counts');
  assert.throws(() => lifeAction(life, newLoungeLedger(), { id: uuid(), actor: 4 }, { kind: 'npcTies', pairs: 'x' }, T0));
  // Survives a round trip through the stored state.
  assert.equal(readLife(JSON.parse(JSON.stringify(life))).ext[m.id].npcTiesSeen.length, 2);
});

test('migration: sends the stored pairs once and clears them; nothing to send, nothing sent', async () => {
  const keys = [...NPC_TIE_KEYS];
  const store = new Map([['bumtadew:npc-ties-seen', JSON.stringify([keys[0], 'bad', keys[2]])]]);
  const storage = { getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k) };
  assert.deepEqual(legacyNpcTiesSeen(storage), [keys[0], keys[2]]);
  const sent = [];
  const room = { life: async (a) => (sent.push(a), true) };
  assert.equal(await migrateNpcTiesSeen(room, storage), true);
  assert.deepEqual(sent, [{ kind: 'npcTies', pairs: [keys[0], keys[2]] }]);
  assert.equal(store.size, 0);
  assert.equal(await migrateNpcTiesSeen(room, storage), false);
  assert.equal(sent.length, 1);
  // A refused send keeps them for the next load.
  store.set('bumtadew:npc-ties-seen', JSON.stringify([keys[1]]));
  assert.equal(await migrateNpcTiesSeen({ life: async () => false }, storage), false);
  assert.equal(store.size, 1);
});
