import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { freshLounge } from '../app/lounge-look.ts';
import { DEFAULT_BED } from '../app/lounge-bedroom-data.ts';
import { applyYuchanRoom, yuchanRoomSpots } from '../app/lounge-yuchan-room.ts';
import { ensureLifeMember, readLife } from '../app/lounge-life.ts';
import { ROOMS_RESET_ID } from '../app/lounge-rooms-reset.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';

const NOW = Date.UTC(2026, 10, 16, 4);
const member = (actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' });

test('the actual owner-room wrapper keeps the bound starter after theft and masks excess copies on edit', async () => {
  let rendered, submitted;
  const stubKey = '__yuchanBedroomWrapperTest';
  globalThis[stubKey] = {
    Bedroom3D: (props) => { rendered = props; return null; },
    MessageCircle: () => null, OwnerGuestbook: () => null, preloadRoomAssets() {},
  };
  const wrapperUrl = new URL('../app/lounge-bedroom.tsx', import.meta.url);
  const require = createRequire(import.meta.url);
  const stubUrl = 'data:text/javascript;base64,' + Buffer.from(`export const {Bedroom3D,MessageCircle,OwnerGuestbook,preloadRoomAssets}=globalThis.${stubKey};`).toString('base64');
  try {
    const { outputText } = ts.transpileModule(await readFile(wrapperUrl, 'utf8'), { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX,
    } });
    const source = outputText.replace(/from\s+(['"])([^'"]+)\1/g, (_all, _quote, specifier) => {
      const stubbed = ['./lounge-bedroom-3d', './ui/icons', './lounge/FriendVisit', './lounge-bedroom-scene'].includes(specifier);
      const resolved = stubbed ? stubUrl : specifier.startsWith('.') ? new URL(specifier + '.ts', wrapperUrl).href : pathToFileURL(require.resolve(specifier)).href;
      return `from ${JSON.stringify(resolved)}`;
    });
    const { BedroomEditor } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
    const save = freshLounge(7), before = structuredClone(save);
    const render = (s) => renderToStaticMarkup(createElement(BedroomEditor, {
      save: s, notice() {}, onChange: (next) => { submitted = next; },
      view: { life: { me: { furniture: {}, furnitureStrict: { chair: true } } } },
    }));
    render(save);
    assert.equal(rendered.save.bedroom.items.filter((i) => i.ref === 'chair').length, 1, 'the owner still sees the room-bound chair after a theft');
    const extra = { ...save, bedroom: { ...save.bedroom, items: [...save.bedroom.items, { ...save.bedroom.items.find((i) => i.ref === 'chair'), id: 'extra-chair' }] } };
    rendered.onChange(extra);
    assert.equal(submitted.bedroom.items.filter((i) => i.ref === 'chair').length, 1, 'the real wrapper callback saves only the permitted copy');
    render({ ...extra, actor: 0 });
    assert.equal(rendered.save.bedroom.items.filter((i) => i.ref === 'chair').length, 0, 'a different bound owner receives no free set allowance');
    assert.deepEqual(save, before);
  } finally { delete globalThis[stubKey]; }
});

test('the actual profile API saves a chosen starter, reloads it for visits and refuses cross-account free furniture', async () => {
  const y = member(7), friend = member(0);
  const old = { ...freshLounge(7), bedroom: { version: 4, theme: 'miku', wall: 'cream', floor: 'oak', access: 'friends', items: [{ ...DEFAULT_BED }] } };
  const records = new Map([
    [y.id, { user_id: y.id, actor: 7, username: y.username, save: old, save_revision: 0, activated: true }],
    [friend.id, { user_id: friend.id, actor: 0, username: friend.username, save: freshLounge(0), save_revision: 0, activated: true }],
  ]);
  const life = ensureLifeMember(ensureLifeMember(readLife(undefined), y.id, 7), friend.id, 0);
  life.roomsReset = { id: ROOMS_RESET_ID, at: NOW, backup: {} };
  const worldBefore = structuredClone(life), friendBefore = structuredClone(records.get(friend.id));
  let authenticated = y.id, handler;
  const stubKey = '__yuchanRoomApiTest';
  globalThis[stubKey] = {
    HttpError: class extends Error {}, key: '', url: '', log() {}, rate: async () => {},
    member: async () => ({ m: records.get(authenticated) }),
    profile: (m) => ({ save: m.save, revision: m.save_revision }),
    serve: (_name, callback) => { handler = callback; },
    rpc: async (name, args) => {
      if (name === 'hh_world_read') return { state: { life } };
      if (name === 'hh_member') return [...records.values()].find((r) => r.username === args.p_username);
      if (name === 'hh_profile_save') {
        assert.equal(args.p_uid, authenticated, 'only the authenticated owner can be persisted');
        const record = records.get(args.p_uid);
        if (args.p_expected !== record.save_revision) return { conflict: true, save: record.save, revision: record.save_revision };
        records.set(args.p_uid, { ...record, save: JSON.parse(JSON.stringify(args.p_save)), save_revision: record.save_revision + 1 });
        return { conflict: false, save: records.get(args.p_uid).save, revision: record.save_revision + 1 };
      }
      throw new Error(`Unexpected RPC: ${name}`);
    },
  };
  const apiUrl = new URL('../supabase/functions/hohyeon-api/index.ts', import.meta.url);
  const stub = `export const {HttpError,key,url,log,rate,member,profile,serve,rpc}=globalThis.${stubKey};`;
  const stubUrl = 'data:text/javascript;base64,' + Buffer.from(stub).toString('base64');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('External requests are forbidden in this fixture'); };
  try {
    const source = (await readFile(apiUrl, 'utf8')).replace(/from\s+(['"])([^'"]+)\1/g, (_all, _quote, specifier) =>
      `from ${JSON.stringify(specifier === '../_shared/server.ts' ? stubUrl : new URL(specifier, apiUrl).href)}`);
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
    await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
    assert.deepEqual((await handler({ op: 'profile' }, {}, {})).profile.save.bedroom, old.bedroom, 'reading an existing starter never upgrades it automatically');
    const chosen = { ...old, bedroom: applyYuchanRoom(old.bedroom, 7) };
    const saved = await handler({ op: 'save', revision: 0, save: chosen }, {}, {});
    assert.equal(saved.conflict, false);
    assert.deepEqual(saved.save.bedroom, chosen.bedroom);
    assert.deepEqual((await handler({ op: 'profile' }, {}, {})).profile.save.bedroom, chosen.bedroom);
    const stale = await handler({ op: 'save', revision: 0, save: old }, {}, {});
    assert.equal(stale.conflict, true);
    assert.deepEqual(stale.save.bedroom, chosen.bedroom, 'a stale device cannot erase the chosen room');
    const decorated = { ...chosen, bedroom: { ...chosen.bedroom, items: chosen.bedroom.items.map((i) => i.ref === 'plant' ? { ...i, x: 3.7, z: 1.6 } : i) } };
    await handler({ op: 'save', revision: 1, save: decorated }, {}, {});
    records.set(y.id, JSON.parse(JSON.stringify(records.get(y.id))));
    authenticated = friend.id;
    const visit = await handler({ op: 'visit', owner: 7 }, {}, {});
    assert.deepEqual(visit.visit.bedroom, decorated.bedroom, 'a visiting/reconnecting friend sees the saved edits');
    assert.equal(yuchanRoomSpots(visit.visit.bedroom, 7).length, 3);
    await assert.rejects(handler({ op: 'save', revision: 0, owner: 7, save: { ...freshLounge(0), actor: 7, bedroom: decorated.bedroom } }, {}, {}), /사지 않은 소품/);
    assert.deepEqual(records.get(friend.id), friendBefore);
    assert.deepEqual(records.get(y.id).save.bedroom, decorated.bedroom);
    assert.deepEqual(life, worldBefore, 'saving/visiting gives no furniture, money, inventory or life rewards');
  } finally { delete globalThis[stubKey]; globalThis.fetch = originalFetch; }
});

test('Yuchan home entry, owner permissions and short guestbook notes survive cloud reload without granting furniture', async () => {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const y = member(7), friend = member(0);
  const run = async (p, op, extra = {}) => {
    const command = { op, connection: p.connection, ...(p.code ? { code: p.code } : {}),
      ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}),
      ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
    const hash = await commandHash(command), r = cloudTransition(world, p, command, hash, NOW);
    world = r.state; p.epoch = r.response.epoch;
    if (r.response.code) p.code = r.response.code;
    validateLedger(world.ledger);
    return { ...r, command, hash };
  };
  const act = (p, action) => run(p, 'action', { action });
  assert.equal((await run(y, 'open')).response.ok, true);
  friend.code = y.code; assert.equal((await run(friend, 'join')).response.ok, true);
  const balances = structuredClone(world.ledger.accounts);
  const entered = await act(friend, { kind: 'area', area: 'home', home: 7 });
  assert.equal(entered.response.ok, true, entered.response.error);
  assert.equal(entered.response.packet.players.find((p) => p.id === friend.id).home, 7);
  const ownOnly = await act(friend, { kind: 'room', access: 'closed', owner: 7 });
  assert.equal(ownOnly.response.life.rooms[0].access, 'closed');
  assert.notEqual(ownOnly.response.life.rooms[7]?.access, 'closed', 'an injected owner never changes another home');
  const note = await act(friend, { kind: 'guestbook', owner: 7, text: '차 자리가 포근하네. 잘 쉬고 가!' });
  assert.equal(note.response.ok, true, note.response.error);
  world = cloudTransition(world, friend, note.command, note.hash, NOW).state;
  assert.equal(readLife(world.life).guestbook[y.id].length, 1, 'receipt replay writes only one note');
  world = JSON.parse(JSON.stringify(world));
  const reloaded = await run(y, 'read');
  assert.equal(reloaded.response.life.me.guestbook[0].actor, 0);
  assert.equal(reloaded.response.life.me.guestbookUnread, 1);
  assert.equal((await act(y, { kind: 'room', access: 'closed' })).response.ok, true);
  const outside = await run(friend, 'read');
  assert.notEqual(outside.response.packet.players.find((p) => p.id === friend.id).area, 'home', 'closing the home evicts a current visitor');
  assert.equal((await act(friend, { kind: 'area', area: 'home', home: 7 })).response.ok, false);
  assert.equal((await act(y, { kind: 'area', area: 'home', home: 7 })).response.ok, true, 'the owner can still enter');
  assert.deepEqual((await run(y, 'read')).response.life.me.furniture, {});
  assert.deepEqual((await run(friend, 'read')).response.life.me.furniture, {});
  assert.deepEqual(world.ledger.accounts, balances);
});
