import test from 'node:test';
import assert from 'node:assert/strict';
import { figureFrame, HAT_HEADROOM, withHatHeadroom } from '../app/lounge-figure-frame.ts';
import { COLLECTIONS, GLASSES, HATS, collectionsFor, hatsFor, readLook, freshLounge, readLounge } from '../app/lounge-look.ts';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS, accountSave, friendVisitView } from '../app/lounge-accounts.ts';

// A normalized figure (400×480 art placed at +60,+150) and hats of real sizes.
const body = { x: 153, y: 165, w: 214, h: 450 };
const hats = {
  none: body,
  beanie: { x: 150, y: 165 - 132, w: 220, h: 450 + 132 },
  straw: { x: 116, y: 165 - 116, w: 288, h: 450 + 116 },
  // A headband knot sticks out on one side only.
  hachimaki: { x: 153, y: 165, w: 214 + 36, h: 450 },
};

test('a hat never changes the body size or ground line on world canvases', () => {
  const target = { width: 256, height: withHatHeadroom(320) };
  const bare = figureFrame(target, body, body, false, HAT_HEADROOM);
  // The body keeps the size it had on the old 256×320 canvas.
  assert.ok(Math.abs(bare.scale * body.h - 320 * 0.94) < 2);
  for (const [id, piece] of Object.entries(hats)) {
    const f = figureFrame(target, body, piece, false, HAT_HEADROOM);
    assert.equal(f.scale, bare.scale, id);
    // Soles stay on the anchor line; the hat's top stays inside the canvas.
    assert.ok(Math.abs(f.dy + (body.y + body.h - piece.y) * f.scale) < 1e-6, id);
    assert.ok(f.anchorY + f.dy >= 0, `${id} cut off at the top`);
    // The body is centred whatever sticks out on one side.
    const bodyLeft = f.anchorX + f.dx + (body.x - piece.x) * f.scale;
    assert.ok(Math.abs(bodyLeft + (body.w * f.scale) / 2 - target.width / 2) < 1e-6, id);
  }
});

test('without headroom an accessory only shrinks the figure as much as it must', () => {
  const target = { width: 440, height: 540 };
  const bare = figureFrame(target, body, body);
  assert.equal(bare.scale, Math.min((440 * 0.92) / body.w, (540 * 0.94) / body.h));
  const beanie = figureFrame(target, body, hats.beanie);
  assert.ok(beanie.scale < bare.scale);
  assert.ok(beanie.anchorY + beanie.dy >= 0);
  // Glasses or a clip inside the body box leave it untouched.
  assert.equal(figureFrame(target, body, { ...body, w: body.w - 4 }).scale, bare.scale);
});

test('portraits frame the face: a hat never pushes it out of a round crop', () => {
  const target = { width: 200, height: 200 };
  const bare = figureFrame(target, body, body, true);
  for (const [id, piece] of Object.entries(hats)) {
    const f = figureFrame(target, body, piece, true);
    assert.equal(f.scale, bare.scale, id);
    // The hair top (body top) moves down at most 8% of the frame.
    assert.ok(f.anchorY - bare.anchorY <= 16 + 1e-9, id);
    assert.ok(f.anchorY >= bare.anchorY, id);
  }
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
/** Every accessory/look combination a player can pick (pairwise over hats × the rest). */
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

test('every current hat, glasses, clip, collection and colour is on the allowlist', () => {
  assert.ok(HATS.some((h) => h.id === 'hachimaki'));
  assert.equal(COLLECTIONS.length, 9);
  for (let actor = 0; actor < 7; actor++)
    for (const look of allLooks(actor)) assert.deepEqual(readLook(look, actor), look, JSON.stringify([actor, look]));
  // The headband belongs to 도원's wardrobe only; others fall back to their default hat.
  assert.equal(readLook({ hat: 'hachimaki' }, 1).hat, 'none');
  assert.equal(readLook({ hat: 'hachimaki' }, 5).hat, 'cap');
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
