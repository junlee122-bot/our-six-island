import test from 'node:test';
import assert from 'node:assert/strict';
import { LoungeRoom } from '../app/lounge-room.ts';
import {
  defaultLook,
  freshLounge,
  readLounge,
  readLook,
} from '../app/lounge-look.ts';
import {
  channelIdentity,
  channelKey,
  seal,
  unseal,
} from '../app/lounge-crypto.ts';
import {
  ALL_CARDS,
  newGo,
  shuffleCards,
  goAction,
  goView,
  goPracticeAction,
  goScore,
  junkValue,
} from '../app/lounge-gostop.ts';
import { newChess, chessMove, chessBoard } from '../app/lounge-chess.ts';
import { registerWallet } from '../app/lounge-economy.ts';
function host() {
  const room = new LoungeRoom();
  room.view = {
    ...room.view,
    status: 'connected',
    role: 'host',
    self: 'p0',
    code: 'ABCDEFGHJK',
  };
  for (let i = 0; i < 7; i++) {
    const wallet = 'wallet-' + String(i).repeat(24);
    room.wallets.set('p' + i, wallet);
    room.bank.commit(registerWallet(room.bank.ledger, wallet));
    room.members.set('p' + i, {
      id: 'p' + i,
      actor: i,
      look: defaultLook(i),
      x: 50,
      y: 70,
      emote: '',
      emoteAt: 0,
      balance: 100000,
      area: 'lounge',
    });
  }
  room.sync();
  return room;
}
const apply = (r, id, a) => r.apply(id, a);
test('three independent game invitations survive and share a single funded ledger', () => {
  const r = host();
  assert(apply(r, 'p0', { kind: 'invite', game: 'chess', players: ['p1'] }));
  assert(
    apply(r, 'p2', {
      kind: 'invite',
      game: 'poker',
      players: ['p3'],
      required: 2,
    }),
  );
  assert(
    apply(r, 'p4', { kind: 'invite', game: 'gostop', players: ['p5', 'p6'] }),
  );
  assert.equal(r.view.invites.length, 3);
  for (const [game, ids] of [
    ['chess', ['p1']],
    ['poker', ['p3']],
    ['gostop', ['p5', 'p6']],
  ]) {
    const invitation = r.view.invites.find((q) => q.game === game);
    for (const id of ids)
      assert(apply(r, id, { kind: 'reply', id: invitation.id, accept: true }));
  }
  assert(r.view.chess && r.view.gostop && r.view.poker);
  assert.equal(r.view.poker.hand.length, 0);
  assert.equal(r.packet('p2').poker.hand.length, 2);
  assert.equal(r.packet('p4').poker.hand.length, 0);
  const g = r.poker;
  assert.equal(
    apply(r, 'p2', {
      kind: 'poker',
      id: g.id,
      revision: g.revision + 1,
      action: { kind: 'fold' },
    }),
    false,
  );
  assert(
    apply(r, 'p2', {
      kind: 'poker',
      id: g.id,
      revision: g.revision,
      action: { kind: 'fold' },
    }),
  );
  assert.equal(r.bank.ledger.games[g.id].state, 'settled');
  const before = JSON.stringify(r.bank.ledger);
  r.settle('poker', r.poker);
  assert.equal(JSON.stringify(r.bank.ledger), before);
});
test('failed reservation storage leaves pending invitation and game untouched', () => {
  const r = host();
  assert(
    apply(r, 'p0', {
      kind: 'invite',
      game: 'poker',
      players: ['p1'],
      required: 2,
    }),
  );
  const invite = r.view.invites[0],
    before = JSON.stringify(r.bank.ledger);
  r.bank.storage = {
    getItem: () => r.bank.raw,
    setItem: () => {
      throw new Error('quota');
    },
  };
  assert.throws(
    () => apply(r, 'p1', { kind: 'reply', id: invite.id, accept: true }),
    /quota/,
  );
  assert.equal(r.poker, null);
  assert.equal(r.view.invites[0].status, 'waiting');
  assert.deepEqual(r.view.invites[0].accepted, ['p0']);
  assert.equal(JSON.stringify(r.bank.ledger), before);
});
test('lounge storage validates identity, collection and accessories without touching other saves', () => {
  const fresh = freshLounge();
  assert.equal(fresh.looks.length, 7);
  assert.equal(fresh.actor, 6);
  assert.equal(defaultLook(1).glasses, 'round');
  assert.equal(defaultLook(5).hat, 'none');
  assert.deepEqual(readLounge('broken'), fresh);
  assert.equal(readLook({ collection: '3d', hair: 'bad' }, 0).hair, 'wine');
  assert.equal(readLook({ collection: '3d' }, 0).collection, 'classic');
  assert.equal(readLounge(JSON.stringify({ ...fresh, actor: 999 })).actor, 6);
});
test('old lounge wardrobes gain default hairstyles while preserving outfits and saved looks', () => {
  const old = freshLounge();
  old.actor = 0;
  old.visits = 9;
  old.looks[0] = {
    collection: 'street',
    hair: 'rose',
    top: 'coral',
    hat: 'bucket',
    glasses: 'silver',
    clip: true,
  };
  old.saved = [
    { id: 'old-look', actor: 0, look: { ...old.looks[0] }, name: '예전 코디' },
  ];
  const restored = readLounge(JSON.stringify(old));
  assert.equal(restored.visits, 9);
  // Hats other than 도원's headband were removed: the old bucket hat is dropped.
  assert.deepEqual(restored.looks[0], {
    ...old.looks[0],
    hat: 'none',
    hairstyle: 'signature',
  });
  assert.deepEqual(restored.saved[0].look, restored.looks[0]);
});
test('Daowon outfits, buns and hachimaki survive storage and host validation only for Daowon', () => {
  const look = {
    ...defaultLook(0),
    collection: 'miku',
    hairstyle: 'buns',
    hat: 'hachimaki',
    hair: 'wine',
  };
  for (const collection of ['wide-pants', 'denim', 'miku'])
    assert.deepEqual(readLook({ ...look, collection }, 0), {
      ...look,
      collection,
    });
  const saved = freshLounge();
  saved.actor = 0;
  saved.looks[0] = look;
  saved.saved = [{ id: 'miku-buns', actor: 0, look, name: '미쿠 코디' }];
  const restored = readLounge(JSON.stringify(saved));
  assert.deepEqual(restored.looks[0], look);
  assert.deepEqual(restored.saved[0].look, look);
  const r = host();
  assert(apply(r, 'p0', { kind: 'look', look }));
  assert.deepEqual(r.members.get('p0').look, look);
  for (let actor = 1; actor < 7; actor++) {
    const normalized = readLook(look, actor);
    assert.equal(normalized.collection, 'classic');
    assert.equal(normalized.hairstyle, 'signature');
    assert.equal(normalized.hat, 'none');
  }
  assert.equal(
    readLook({ hairstyle: 'bogus', hat: '<img>' }, 0).hairstyle,
    'signature',
  );
});
test('game invitations require consent, reject outsiders, reserve only accepted players, and start once', () => {
  const r = host();
  assert(
    apply(r, 'p0', {
      kind: 'invite',
      game: 'gostop',
      players: ['p1', 'p2', 'p3'],
    }),
  );
  const id = r.view.invites[0].id;
  assert.equal(r.go, null);
  assert(!apply(r, 'p4', { kind: 'reply', id, accept: true }));
  assert(apply(r, 'p1', { kind: 'reply', id, accept: true }));
  assert(!apply(r, 'p1', { kind: 'reply', id, accept: true }));
  assert.equal(r.go, null);
  assert(apply(r, 'p2', { kind: 'reply', id, accept: true }));
  const matchId = r.go.id;
  assert.equal(r.view.invites[0].status, 'started');
  assert.deepEqual(r.view.seats.gostop, ['p0', 'p1', 'p2']);
  assert(!apply(r, 'p3', { kind: 'reply', id, accept: true }));
  assert.equal(r.go.id, matchId);
  assert(!apply(r, 'p1', { kind: 'invite', game: 'chess', players: ['p3'] }));
});
test('chess and Go-Stop can run concurrently with independent seats and departures', () => {
  const r = host();
  assert(apply(r, 'p0', { kind: 'invite', game: 'chess', players: ['p1'] }));
  assert(
    apply(r, 'p1', { kind: 'reply', id: r.view.invites[0].id, accept: true }),
  );
  assert(
    apply(r, 'p2', { kind: 'invite', game: 'gostop', players: ['p3', 'p4'] }),
  );
  const id = r.view.invites.find((i) => i.status === 'waiting').id;
  assert(apply(r, 'p3', { kind: 'reply', id, accept: true }));
  assert(apply(r, 'p4', { kind: 'reply', id, accept: true }));
  const chessId = r.chess.id;
  const goRevision = r.go.revision,
    goPhase = r.go.phase;
  assert(apply(r, 'p3', { kind: 'stand', game: 'gostop' }));
  // Leaving no longer voids the round: the seat is marked away and played
  // automatically by the server until the round ends.
  assert.equal(r.go.phase, goPhase);
  assert.equal(r.go.revision, goRevision);
  assert.deepEqual(r.view.seats.gostop, ['p2', 'p3', 'p4']);
  assert.equal(r.goAway.has(1), goPhase !== 'over');
  assert.equal(r.chess.id, chessId);
  assert.equal(r.chess.winner, null);
  assert(apply(r, 'p1', { kind: 'stand', game: 'chess' }));
  assert.equal(r.chess.winner, 'w');
});
test('declined invitees leaving do not cancel an otherwise viable invitation', () => {
  const r = host();
  apply(r, 'p0', {
    kind: 'invite',
    game: 'gostop',
    players: ['p1', 'p2', 'p3'],
  });
  const id = r.view.invites[0].id;
  apply(r, 'p1', { kind: 'reply', id, accept: false });
  r.drop('p1');
  assert.equal(r.view.invites[0].status, 'waiting');
  assert(apply(r, 'p2', { kind: 'reply', id, accept: true }));
  assert(apply(r, 'p3', { kind: 'reply', id, accept: true }));
  assert.equal(r.view.invites[0].status, 'started');
});
test('expired invitations and double booking cannot start games', () => {
  const r = host();
  apply(r, 'p0', { kind: 'invite', game: 'gostop', players: ['p1', 'p2'] });
  const first = r.view.invites[0];
  apply(r, 'p3', { kind: 'invite', game: 'chess', players: ['p1'] });
  const second = r.view.invites.find((i) => i.game === 'chess');
  assert(apply(r, 'p1', { kind: 'reply', id: first.id, accept: true }));
  assert(!apply(r, 'p1', { kind: 'reply', id: second.id, accept: true }));
  assert(apply(r, 'p0', { kind: 'cancel', id: first.id }));
  assert(apply(r, 'p1', { kind: 'reply', id: second.id, accept: true }));
  assert.equal(r.chess.winner, null);
  assert(
    apply(r, 'p0', { kind: 'invite', game: 'gostop', players: ['p2', 'p4'] }),
  );
  const exp = r.view.invites.find((i) => i.status === 'waiting');
  exp.expires = Date.now() - 1;
  assert(!apply(r, 'p2', { kind: 'reply', id: exp.id, accept: true }));
  r.tick();
  assert.equal(r.view.invites.find((i) => i.id === exp.id).status, 'expired');
});
test('a guest who accepted can withdraw without cancelling the invite for everyone', () => {
  const r = host();
  apply(r, 'p0', {
    kind: 'invite',
    game: 'gostop',
    players: ['p1', 'p2', 'p3'],
  });
  const id = r.view.invites[0].id;
  assert(apply(r, 'p1', { kind: 'reply', id, accept: true }));
  assert(apply(r, 'p1', { kind: 'cancel', id }));
  let invite = r.view.invites.find((i) => i.id === id);
  assert.equal(invite.status, 'waiting');
  assert(!invite.accepted.includes('p1'));
  assert(invite.declined.includes('p1'));
  // Once too few friends are left, the withdrawal ends the invite.
  assert(apply(r, 'p2', { kind: 'reply', id, accept: true }));
  assert(apply(r, 'p2', { kind: 'cancel', id }));
  invite = r.view.invites.find((i) => i.id === id);
  assert.equal(invite.status, 'cancelled');
});
test('hidden hands are recipient-specific and authenticated encryption rejects another player', async () => {
  const a = await channelIdentity(),
    b = await channelIdentity(),
    c = await channelIdentity(),
    ab = await channelKey(a.privateKey, b.publicKey),
    ba = await channelKey(b.privateKey, a.publicKey),
    ca = await channelKey(c.privateKey, a.publicKey);
  const game = newGo('private', shuffleCards()),
    view = goView(game, 0);
  assert.equal(view.hand.length, 7);
  assert(!('deck' in view));
  assert(!('hands' in view));
  assert.equal(goView(game, -1).hand.length, 0);
  const packet = await seal(ab, view);
  assert.deepEqual(await unseal(ba, packet), view);
  await assert.rejects(unseal(ca, packet));
  const bad = { ...packet, data: packet.data.slice(0, -4) + 'AAAA' };
  await assert.rejects(unseal(ba, bad));
});
test('full Korean chat plus long chess history fits a signed lounge snapshot', async () => {
  const r = host();
  r.chess = { ...newChess('sizing'), moves: Array(6000).fill('a2a3') };
  r.go = newGo('g', shuffleCards());
  r.view.chat = Array.from({ length: 12 }, (_, i) => ({
    id: crypto.randomUUID(),
    actor: i % 7,
    text: '가'.repeat(120),
  }));
  const a = await channelIdentity(),
    b = await channelIdentity(),
    key = await channelKey(a.privateKey, b.publicKey);
  const data = r.packet('p0'),
    packet = await seal(key, data);
  assert(packet.data.length < 125000);
  assert(
    JSON.stringify({
      message: packet,
      v: 1,
      room: r.view.code,
      from: 'x'.repeat(60),
      to: 'y'.repeat(60),
      seq: 123456789,
    }).length < 131072,
  );
  assert.deepEqual(await unseal(key, packet), data);
});
test('Go-Stop scoring includes named combinations and November double junk', () => {
  assert.equal(junkValue('m11-02'), 2);
  assert.equal(junkValue('m12-04'), 2);
  assert.equal(goScore(['m01-01', 'm03-01', 'm08-01']).bright, 3);
  assert.equal(goScore(['m01-01', 'm03-01', 'm12-01']).bright, 2);
});
test('200 complete Go-Stop rounds conserve every card and never reveal another hand', () => {
  for (let run = 0; run < 200; run++) {
    let g = newGo('round-' + run, shuffleCards()),
      steps = 0;
    while (g.phase !== 'over') {
      assert(++steps < 110);
      const previous = JSON.stringify(g),
        view = goView(g, g.turn),
        action = goPracticeAction(view),
        next = goAction(g, g.turn, action);
      assert(next);
      assert.equal(JSON.stringify(g), previous);
      g = next;
      const cards = [
        ...g.hands.flat(),
        ...g.deck,
        ...g.floor,
        ...g.captured.flat(),
      ];
      if (g.pending) {
        if (!cards.includes(g.pending.played)) cards.push(g.pending.played);
        if (g.pending.drawn && !cards.includes(g.pending.drawn))
          cards.push(g.pending.drawn);
      }
      assert.equal(cards.length, 48);
      assert.equal(new Set(cards).size, 48);
      assert(cards.every((c) => ALL_CARDS.includes(c)));
      assert.equal(goView(g, -1).hand.length, 0);
    }
    assert.equal(
      g.result.reduce((a, b) => a + b, 0),
      0,
    );
  }
});
function motionFixture({ hand, floor, drawn, captured = [[], [], []] }) {
  const g = newGo('motion-fixture', ALL_CARDS);
  const used = new Set([...hand, ...floor, drawn, ...captured.flat()]);
  const rest = ALL_CARDS.filter((c) => !used.has(c));
  return {
    ...g,
    phase: 'play',
    winner: null,
    reason: '',
    result: [0, 0, 0],
    hands: [hand, rest.slice(0, 3), rest.slice(3, 6)],
    floor,
    captured,
    deck: [drawn, ...rest.slice(6)],
    events: [],
    revision: 0,
    motion: null,
  };
}
test('motion traces advance per public choice without exposing or replaying the deck', () => {
  let g = motionFixture({
    hand: ['m01-01', 'm10-03'],
    floor: ['m01-02', 'm01-03', 'm02-02', 'm02-03'],
    drawn: 'm02-01',
  });
  let n = goAction(g, 0, { kind: 'play', card: 'm01-01' });
  assert.equal(n.phase, 'choose');
  assert.equal(n.ply, 0);
  assert.equal(n.revision, 1);
  assert.deepEqual(n.motion, {
    seq: 1,
    actor: 0,
    steps: [{ kind: 'play', card: 'm01-01' }],
  });
  assert(!JSON.stringify(goView(n, 1).motion).includes('m02-01'));
  g = n;
  n = goAction(g, 0, { kind: 'pick', card: 'm01-02' });
  assert.equal(n.phase, 'choose');
  assert.equal(n.pending.stage, 'draw');
  assert.equal(n.ply, 0);
  assert.equal(n.revision, 2);
  assert.deepEqual(
    n.motion.steps.map((s) => s.kind),
    ['draw', 'collect'],
  );
  assert.equal(n.motion.steps[0].card, 'm02-01');
  g = n;
  n = goAction(g, 0, { kind: 'pick', card: 'm02-02' });
  assert.equal(n.revision, 3);
  assert.equal(n.motion.actor, 0);
  assert.equal(n.turn, 1);
  assert.deepEqual(n.motion.steps, [
    { kind: 'collect', cards: ['m02-01', 'm02-02'] },
  ]);
  assert.equal(goAction(n, 0, { kind: 'pick', card: 'm02-02' }), null);
});
test('ppuk leaves three cards on the table while ttadak collects exactly four', () => {
  const g = motionFixture({
    hand: ['m01-01', 'm10-03'],
    floor: ['m01-02', 'm02-03'],
    drawn: 'm01-03',
  });
  const n = goAction(g, 0, { kind: 'play', card: 'm01-01' });
  assert.deepEqual(
    n.motion.steps.map((s) => s.kind),
    ['play', 'draw'],
  );
  assert.equal(n.floor.filter((c) => c.startsWith('m01')).length, 3);
  const h = motionFixture({
    hand: ['m01-01', 'm10-03'],
    floor: ['m01-02', 'm01-03', 'm02-03'],
    drawn: 'm01-04',
  });
  const p = goAction(h, 0, { kind: 'play', card: 'm01-01' });
  const t = goAction(p, 0, { kind: 'pick', card: 'm01-02' });
  assert.deepEqual(
    t.motion.steps.map((s) => s.kind),
    ['draw', 'collect'],
  );
  assert.deepEqual([...t.motion.steps[1].cards].sort((a, b) => a.localeCompare(b)), [
    'm01-01',
    'm01-02',
    'm01-03',
    'm01-04',
  ]);
});
test('steal motion contains actual public source cards and is suppressed on the personal last hand', () => {
  const fields = {
    hand: ['m01-01', 'm10-03'],
    floor: ['m02-03'],
    drawn: 'm01-02',
    captured: [[], ['m11-02'], ['m12-04']],
  };
  const n = goAction(motionFixture(fields), 0, {
    kind: 'play',
    card: 'm01-01',
  });
  assert.deepEqual(
    n.motion.steps.map((s) => s.kind),
    ['play', 'draw', 'collect', 'steal'],
  );
  assert.deepEqual(n.motion.steps[3].cards, [
    { card: 'm11-02', from: 1 },
    { card: 'm12-04', from: 2 },
  ]);
  const last = goAction(motionFixture({ ...fields, hand: ['m01-01'] }), 0, {
    kind: 'play',
    card: 'm01-01',
  });
  assert(!last.motion.steps.some((s) => s.kind === 'steal'));
  assert.deepEqual(last.captured[1], ['m11-02']);
  assert.deepEqual(last.captured[2], ['m12-04']);
});
test('chess rejects wrong turns and moves after checkmate, retaining full history', () => {
  let g = newChess('mate');
  assert.equal(chessMove(g, 1, 'e7', 'e5'), null);
  for (const [seat, from, to] of [
    [0, 'f2', 'f3'],
    [1, 'e7', 'e5'],
    [0, 'g2', 'g4'],
    [1, 'd8', 'h4'],
  ])
    g = chessMove(g, seat, from, to);
  assert.equal(g.winner, 'b');
  assert(chessBoard(g).isCheckmate());
  assert.equal(chessMove(g, 0, 'a2', 'a3'), null);
});
