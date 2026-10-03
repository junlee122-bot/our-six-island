// 주민 이름·모습 교체 (handover/design/character-swaps-2026-10-03.md): the ids
// stay (hearts, romance and companion records carry over), the names, the
// art and the voices change.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { NPCS, NPC_IDS } from '../app/lounge-npc-data.ts';
import { HOSTS } from '../app/lounge-dealer-lines.ts';
import { NPC_CHIBI } from '../app/lounge-npc-chibi.ts';
import { HOST_SHEET } from '../app/lounge-host-sprites.ts';
import { LENDER_NAME } from '../app/lounge-casino-lender.ts';
import { BANKER_NAME } from '../app/lounge-bank-layout.ts';

const SWAPS = { captain: '샹크스', maehwa: '예림이', lumi: '미쿠', rose: '미스 포츈', nyamo: '나모' };

test('the five residents keep their ids and carry their new names everywhere', () => {
  for (const [id, name] of Object.entries(SWAPS)) {
    assert.ok(NPC_IDS.includes(id), `${id} is still a resident id`);
    assert.equal(NPCS[id].name, name);
  }
  assert.equal(HOSTS.captain.name, '샹크스');
  assert.equal(HOSTS.maehwa.name, '예림이');
  assert.equal(HOSTS.lumi.name, '미쿠');
  assert.equal(LENDER_NAME, '미스 포츈');
  assert.equal(BANKER_NAME, '나모');
});

test('no old name is left in the game text', () => {
  const dir = new URL('../app/', import.meta.url);
  const files = fs.readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('lounge-changelog.ts'));
  const hits = [];
  for (const f of files) {
    const text = fs.readFileSync(new URL(f, dir), 'utf8');
    for (const [i, line] of text.split('\n').entries()) if (/허 선장|매화|루미|로제|냐모/.test(line)) hits.push(`${f}:${i + 1}`);
  }
  assert.deepEqual(hits, []);
});

test('샹크스 and 예림이: new tall art, chibi and host sheets from shanks-jeong-generation.json', () => {
  const lounge = new URL('../public/assets/lounge/', import.meta.url);
  const record = JSON.parse(fs.readFileSync(new URL('shanks-jeong-generation.json', lounge), 'utf8'));
  const hash = (f) => crypto.createHash('sha256').update(fs.readFileSync(new URL(f, lounge))).digest('hex').toUpperCase();
  for (const a of record.assets) assert.equal(hash(a.original), a.sha256, a.original);
  for (const [file, w] of Object.entries(record.web)) assert.equal(hash(file), w.sha256, file);
  const size = (f) => [record.web[f].w, record.web[f].h];
  for (const who of ['shanks', 'jeong']) {
    assert.deepEqual(size(`npc-${who}.webp`), [660, 990]);
    assert.deepEqual(size(`npc-${who}-portrait.webp`), [384, 384]);
    assert.deepEqual(size(`chibi/npc-${who}.webp`), [512, 640]);
  }
  for (const host of ['captain', 'maehwa']) {
    assert.deepEqual(size(`host-${host}.png`), [1320, 1320]);
    assert.deepEqual(size(`host-${host}.webp`), [1320, 1320]);
    assert.equal(HOST_SHEET[host], `/assets/lounge/host-${host}.webp`);
  }
  assert.deepEqual(NPCS.captain.art, { kind: 'image', asset: '/assets/lounge/npc-shanks.webp', portrait: '/assets/lounge/npc-shanks-portrait.webp', foot: 0.985 });
  assert.deepEqual(NPCS.maehwa.art, { kind: 'image', asset: '/assets/lounge/npc-jeong.webp', portrait: '/assets/lounge/npc-jeong-portrait.webp', foot: 0.985 });
  assert.equal(NPC_CHIBI.captain.asset, '/assets/lounge/chibi/npc-shanks.webp');
  assert.equal(NPC_CHIBI.maehwa.asset, '/assets/lounge/chibi/npc-jeong.webp');
  // 미쿠, 미스 포츈, 나모 keep their pictures.
  assert.deepEqual(NPCS.lumi.art, { kind: 'sheet', host: 'lumi' });
});
