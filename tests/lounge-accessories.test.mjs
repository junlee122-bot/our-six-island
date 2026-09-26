import test from 'node:test';
import assert from 'node:assert/strict';
import { figureFrame } from '../app/lounge-figure-frame.ts';
import { COLLECTIONS, GLASSES, HATS, collectionsFor, defaultLook, hatsFor, readLook, freshLounge, readLounge } from '../app/lounge-look.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS, accountSave, friendVisitView } from '../app/lounge-accounts.ts';

// A normalized figure (400×480 art placed at +60,+150) and accessories of real sizes.
const body = { x: 153, y: 165, w: 214, h: 450 };
const pieces = {
  none: body,
  glasses: { x: 180, y: 250, w: 160, h: 60 },
  // A headband knot sticks out on one side only.
  hachimaki: { x: 153, y: 165, w: 214 + 36, h: 450 },
};

test('an accessory never changes the body size or ground line', () => {
  const target = { width: 256, height: 320 };
  const bare = figureFrame(target, body, body);
  assert.equal(bare.scale, Math.min((256 * 0.92) / body.w, (320 * 0.94) / body.h));
  for (const [id, piece] of Object.entries(pieces)) {
    const f = figureFrame(target, body, piece);
    assert.equal(f.scale, bare.scale, id);
    // Soles stay on the anchor line and nothing leaves the canvas.
    assert.ok(Math.abs(f.dy + (body.y + body.h - piece.y) * f.scale) < 1e-6, id);
    assert.ok(f.anchorY + f.dy >= 0, `${id} cut off at the top`);
    // The body is centred whatever sticks out on one side.
    const bodyLeft = f.anchorX + f.dx + (body.x - piece.x) * f.scale;
    assert.ok(Math.abs(bodyLeft + (body.w * f.scale) / 2 - target.width / 2) < 1e-6, id);
  }
});

test('something reaching above the hair only shrinks the figure as much as it must', () => {
  const target = { width: 440, height: 540 };
  const bare = figureFrame(target, body, body);
  const tall = figureFrame(target, body, { x: 150, y: 165 - 40, w: 220, h: 450 + 40 });
  assert.ok(tall.scale < bare.scale);
  assert.ok(tall.anchorY + tall.dy >= 0);
  // Glasses or a clip inside the body box leave it untouched.
  assert.equal(figureFrame(target, body, { ...body, w: body.w - 4 }).scale, bare.scale);
});

test('portraits frame the face at the same place whatever is worn', () => {
  const target = { width: 200, height: 200 };
  const bare = figureFrame(target, body, body, { portrait: true });
  for (const [id, piece] of Object.entries(pieces)) {
    const f = figureFrame(target, body, piece, { portrait: true });
    assert.equal(f.scale, bare.scale, id);
    assert.equal(f.anchorY, bare.anchorY, id);
  }
});

test('a walk strip drawn at a fixed scale keeps it (no size jump at walk start)', () => {
  const target = { width: 256, height: 320 };
  const strip = { x: 40, y: 20, w: 240, h: 380 };
  const f = figureFrame(target, strip, strip, { scale: 0.5 });
  assert.equal(f.scale, 0.5);
  // Still shrinks if the fixed scale would not fit the canvas at all.
  assert.ok(figureFrame(target, strip, strip, { scale: 5 }).scale < 5);
});

const member = (actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' });
function harness() {
  let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} },
    now = Date.now();
  return {
    advance(ms) { now += ms; },
    async run(p, op, extra = {}) {
      const c = { op, connection: p.connection, code: p.code, ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}), ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}), ...extra };
      const r = cloudTransition(world, p, c, await commandHash(c), now);
      world = r.state;
      p.epoch = r.response.epoch;
      if (r.response.code) p.code = r.response.code;
      return r.response;
    },
  };
}
/** Every accessory/look combination a player can pick (pairwise over headwear × the rest). */
function allLooks(actor) {
  const out = [];
  const collections = collectionsFor(actor).map((c) => c.id);
  const styles = actor === 0 ? ['signature', 'buns'] : ['signature'];
  let i = 0;
  for (const hat of hatsFor(actor).map((h) => h.id))
    for (const collection of collections)
      for (const hairstyle of styles) {
        const glasses = GLASSES[i % GLASSES.length].id;
        out.push({ collection, hairstyle, hair: 'honey', top: 'berry', hat, glasses, clip: i % 2 === 0, hairColor: '#d0407a', skinColor: '#8d5a3c' });
        i++;
      }
  return out;
}

test('every current headband, glasses, clip, collection and colour is on the allowlist', () => {
  assert.deepEqual(HATS.map((h) => h.id), ['none', 'hachimaki']);
  assert.equal(COLLECTIONS.length, 12);
  for (let actor = 0; actor < 7; actor++)
    for (const look of allLooks(actor)) assert.deepEqual(readLook(look, actor), look, JSON.stringify([actor, look]));
  // The headband belongs to 도원's wardrobe only; others read it as bare-headed.
  assert.equal(readLook({ hat: 'hachimaki' }, 1).hat, 'none');
  assert.equal(readLook({ hat: 'hachimaki' }, 5).hat, 'none');
  assert.deepEqual(hatsFor(0).map((h) => h.id), ['none', 'hachimaki']);
  for (let actor = 1; actor < 7; actor++) assert.deepEqual(hatsFor(actor).map((h) => h.id), ['none']);
});

const REMOVED_HATS = ['cap', 'straw', 'bucket', 'beanie'];

test('removed hats read as bare-headed for every friend (saves, remote looks, old clients)', () => {
  for (let actor = 0; actor < 7; actor++) {
    assert.equal(defaultLook(actor).hat, 'none', `actor ${actor} default`);
    // A look with no hat field at all (never a fallback to 재민's old cap).
    assert.equal(readLook({ collection: 'classic' }, actor).hat, 'none');
    for (const hat of REMOVED_HATS) {
      const look = readLook({ hat, glasses: 'round', clip: true }, actor);
      assert.equal(look.hat, 'none', `actor ${actor} ${hat}`);
      // Everything else on the look survives the migration.
      assert.equal(look.glasses, 'round');
      assert.equal(look.clip, true);
    }
  }
  // An old save with hats everywhere comes back without them, headband kept.
  const old = freshLounge(5);
  old.looks = old.looks.map((l, i) => ({ ...l, hat: i === 0 ? 'hachimaki' : REMOVED_HATS[i % 4] }));
  old.saved = [{ id: 's', actor: 5, name: '모자', look: { ...old.looks[5], hat: 'cap' } }];
  const back = readLounge(JSON.stringify(old), 5);
  assert.deepEqual(back.looks.map((l) => l.hat), ['hachimaki', 'none', 'none', 'none', 'none', 'none', 'none']);
  assert.equal(back.saved[0].look.hat, 'none');
});

test('the room server stores none when an old client sends a removed hat', async () => {
  const h = harness(),
    me = member(5),
    friend = member(3);
  await h.run(me, 'open', { look: { ...defaultLook(5), hat: 'cap' } });
  friend.code = me.code;
  const joined = await h.run(friend, 'join');
  const seen = (packet) => packet.players.find((p) => p.actor === 5)?.look;
  assert.equal(seen(joined.packet).hat, 'none');
  h.advance(5000);
  await h.run(me, 'action', { action: { kind: 'look', look: { ...defaultLook(5), hat: 'beanie', glasses: 'sun' } } });
  h.advance(5000);
  const r = await h.run(friend, 'read');
  assert.equal(seen(r.packet).hat, 'none');
  assert.equal(seen(r.packet).glasses, 'sun');
});

test('saves and friend-visit views keep every accessory', () => {
  for (let actor = 0; actor < 7; actor++)
    for (const look of allLooks(actor)) {
      const save = freshLounge(actor);
      save.looks[actor] = look;
      save.saved = [{ id: 's', actor, name: 'x', look }];
      const back = readLounge(JSON.stringify(accountSave(save, actor)), actor);
      assert.deepEqual(back.looks[actor], look);
      assert.deepEqual(back.saved[0].look, look);
      assert.deepEqual(friendVisitView(actor, save, {}).look, look);
    }
});

test('room packets show a friend every accessory they join with or change to', async () => {
  for (let actor = 0; actor < 7; actor++) {
    const h = harness(),
      me = member(actor),
      friend = member(actor === 3 ? 4 : 3);
    const looks = allLooks(actor);
    await h.run(me, 'open', { look: looks[0] });
    friend.code = me.code;
    const joined = await h.run(friend, 'join');
    const seen = (packet) => packet.players.find((p) => p.actor === actor)?.look;
    assert.deepEqual(seen(joined.packet), looks[0], `actor ${actor} join`);
    for (const look of looks.slice(1)) {
      h.advance(5000); // past the look throttle
      await h.run(me, 'action', { action: { kind: 'look', look } });
      h.advance(5000);
      const r = await h.run(friend, 'read');
      assert.deepEqual(seen(r.packet), look, `actor ${actor} ${JSON.stringify(look)}`);
    }
  }
});
