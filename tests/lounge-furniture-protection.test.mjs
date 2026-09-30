import test from 'node:test';
import assert from 'node:assert/strict';
import { maskBedroomFurniture, maskFurnitureSave } from '../app/lounge-furniture-protection.ts';
import { furniturePolicyOf, protectProfileFurniture, serverAccountSave, lifeUnlocksOf, friendVisitView, AccountSaveError } from '../app/lounge-accounts.ts';
import { catalogEntry, defaultBedroom } from '../app/lounge-bedroom-data.ts';
import { freshLounge } from '../app/lounge-look.ts';
import { readLife, ensureLifeMember, lifeView } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet } from '../app/lounge-economy.ts';
import { financeAction } from '../app/lounge-finance.ts';
import { roomScore } from '../app/lounge-mood-room.ts';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { ROOMS_RESET_ID } from '../app/lounge-rooms-reset.ts';

const ids = [0, 1].map((i) => `00000000-0000-4000-8000-00000000000${i}`);
const ref = 'furn-armchair-navy', now = Date.UTC(2026, 8, 28, 3);
const piece = (id, itemRef, x) => ({ id, ref: itemRef, kind: catalogEntry(itemRef).kind, x, z: 1, rotY: 0, scale: 1 });
function fixture() {
  // A world after the 새 방 furniture reset (its done-mark is stored).
  let life = { ...readLife(undefined), roomsReset: { id: ROOMS_RESET_ID, at: 0, backup: {} } }, ledger = newLoungeLedger();
  ids.forEach((id, actor) => { life = ensureLifeMember(life, id, actor); ledger = registerWallet(ledger, 'wallet-' + id); });
  life.ext ??= {};
  life.ext[ids[1]] = { furn: { [ref]: 2 } };
  const save = { ...freshLounge(1), bedroom: { ...defaultBedroom(1), items: [
    piece('armchair-a', ref, -2), piece('armchair-b', ref, 2), piece('legacy-chair', 'furn-chair', 0),
  ] } };
  const presence = ids.map((id, actor) => ({ id, actor, area: 'village', x: 40 + actor, y: 50 }));
  const robbed = financeAction(undefined, ledger, life, ids[0], { kind: 'finance', op: 'rob', to: 1, item: 'furniture' }, now, presence, () => 0);
  return { save, life, robbed };
}
const copies = (save) => save.bedroom.items.filter((i) => i.ref === ref).length;

test('a furniture transfer masks only stolen extra placements and preserves the historical profile', () => {
  const { save, life, robbed } = fixture(), original = structuredClone(save);
  assert.equal(robbed.life.ext[ids[1]].furn[ref], 1);
  assert.equal(robbed.life.ext[ids[0]].furn[ref], 1);
  const policy = furniturePolicyOf(robbed.life, ids[1]);
  const masked = maskFurnitureSave(save, policy);
  assert.equal(copies(masked), 1);
  assert.deepEqual(masked.bedroom.items.map((i) => i.id), ['armchair-a', 'legacy-chair']);
  assert.deepEqual(save, original);
  assert.equal(maskFurnitureSave(save, furniturePolicyOf(life, ids[1])), save);
  assert.equal(maskBedroomFurniture(masked.bedroom, policy.owned, policy.strict), masked.bedroom);
  assert.ok(roomScore(masked, 1) < roomScore(save, 1));
});

test('persisted strict ownership reaches profile, visit and current-owner life views', () => {
  const { save, robbed } = fixture();
  const life = readLife(JSON.parse(JSON.stringify(robbed.life)));
  assert.deepEqual(life.ext[ids[1]].furnStrict, { [ref]: true });
  assert.deepEqual(lifeView(life, ids[1], 1, now).me.furnitureStrict, { [ref]: true });
  assert.equal(copies(protectProfileFurniture(save, life, ids[1])), 1);
  const visit = friendVisitView(1, save, life);
  assert.equal(visit.bedroom.items.filter((i) => i.ref === ref).length, 1);
  assert.equal(visit.bedroom.items.some((i) => i.id === 'legacy-chair'), true);
  assert.deepEqual(protectProfileFurniture(null, life, ids[1]), null);
});

test('stale and legacy writes cannot grandfather stolen copies back into a save', () => {
  const { save, robbed } = fixture(), life = robbed.life;
  const policy = furniturePolicyOf(life, ids[1]), unlocks = lifeUnlocksOf(life, ids[1]);
  const safe = serverAccountSave(save, 1, save, unlocks, policy);
  assert.equal(copies(safe), 1);
  assert.equal(safe.bedroom.items.some((i) => i.id === 'legacy-chair'), true);
  const outfitOnly = { ...save }; delete outfitOnly.bedroom;
  assert.equal(copies(serverAccountSave(outfitOnly, 1, save, unlocks, policy)), 1);
  assert.equal(copies(serverAccountSave(save, 1, safe, unlocks, policy)), 1);
  // The same filter handles a profile-CAS conflict reply with its older raw save.
  assert.equal(copies(protectProfileFurniture(save, life, ids[1])), 1);
  assert.throws(() => serverAccountSave({ ...save, version: 999 }, 1, save, unlocks, policy), AccountSaveError);
});

test('rebuying restores the allowed copy count without restoring unlimited grandfather rights', () => {
  const { save, robbed } = fixture(), life = robbed.life;
  life.ext[ids[1]].furn[ref]++;
  const policy = furniturePolicyOf(life, ids[1]);
  assert.equal(maskFurnitureSave(save, policy), save);
  const three = { ...save, bedroom: { ...save.bedroom, items: [...save.bedroom.items, piece('armchair-c', ref, 3)] } };
  assert.equal(copies(serverAccountSave(three, 1, three, lifeUnlocksOf(life, ids[1]), policy)), 2);
  assert.equal(copies(maskFurnitureSave(save, { owned: {}, strict: { [ref]: true } })), 0);
});

test('strict ownership reader rejects unknown refs and non-boolean flags', () => {
  const { life } = fixture();
  life.ext[ids[1]].furnStrict = { [ref]: true, 'furn-chair': 1, unknown: true };
  assert.deepEqual(readLife(life).ext[ids[1]].furnStrict, { [ref]: true });
});

test('the actual API masks profile, visit, successful save and conflict replies after a concurrent theft', async () => {
  const { save, life, robbed } = fixture();
  let handler, worlds = [], conflict = false, submitted;
  const member = { user_id: ids[1], actor: 1, username: 'gangjae', save, save_revision: 4, activated: true };
  const stubKey = '__furnitureApiTest';
  globalThis[stubKey] = {
    HttpError: class extends Error {}, key: '', url: '', log() {}, rate: async () => {},
    member: async () => ({ m: member }), profile: (m) => ({ save: m.save, revision: m.save_revision }),
    serve: (_name, callback) => { handler = callback; },
    rpc: async (name, args) => {
      if (name === 'hh_world_read') return { state: { life: worlds.shift() ?? robbed.life } };
      if (name === 'hh_member') return member;
      if (name === 'hh_profile_save') {
        submitted = args.p_save;
        return { conflict, save: conflict ? save : args.p_save, revision: 5, updatedAt: '2026-09-28' };
      }
      throw new Error(`Unexpected RPC: ${name}`);
    },
  };
  const apiUrl = new URL('../supabase/functions/hohyeon-api/index.ts', import.meta.url);
  const stub = `export const {HttpError,key,url,log,rate,member,profile,serve,rpc}=globalThis.${stubKey};`;
  const stubUrl = 'data:text/javascript;base64,' + Buffer.from(stub).toString('base64');
  try {
    const source = (await readFile(apiUrl, 'utf8')).replace(/from\s+(['"])([^'"]+)\1/g, (_all, _quote, specifier) =>
      `from ${JSON.stringify(specifier === '../_shared/server.ts' ? stubUrl : new URL(specifier, apiUrl).href)}`);
    const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
    await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
    const profile = await handler({ op: 'profile' }, {}, {});
    assert.equal(copies(profile.profile.save), 1);
    const visit = await handler({ op: 'visit', owner: 1 }, {}, {});
    assert.equal(visit.visit.bedroom.items.filter((i) => i.ref === ref).length, 1);
    // Save validation saw two owned copies; the world changed while profile CAS ran.
    worlds = [life, robbed.life];
    const saved = await handler({ op: 'save', revision: 4, save }, {}, {});
    assert.equal(copies(submitted), 2);
    assert.equal(copies(saved.save), 1);
    conflict = true;
    worlds = [robbed.life, robbed.life];
    const rejected = await handler({ op: 'save', revision: 4, save }, {}, {});
    assert.equal(rejected.conflict, true);
    assert.equal(copies(submitted), 1);
    assert.equal(copies(rejected.save), 1);
    assert.equal(copies(save), 2);
  } finally { delete globalThis[stubKey]; }
});
