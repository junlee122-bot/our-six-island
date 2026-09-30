// Stage 1 of the village expansion: hub growth + district gates, 시장 거리,
// the residents' schedule engine, relations for every resident, the request
// board and the dialogue files.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPC_IDS, NPCS, WALKING_NPCS, giftReaction } from '../app/lounge-npc-data.ts';
import { NPC_PLACES, NPC_WALK_SPEED, npcCanStand, npcSpot, npcTimeline, kstDayStart, walkPath } from '../app/lounge-npc-schedule.ts';
import { readNpcRelations, npcSocialAction, assertNpcSocialContext, npcGiftable } from '../app/lounge-romance.ts';
import { NPC_REQUEST_BEOM_CAP, npcRequestsOn, npcBoardView, readNpcBoard } from '../app/lounge-npc-requests.ts';
import { NPC_LINES, allNpcLines, npcTalk, npcBanter, npcBubble, jannaForecast } from '../app/lounge-npc-dialog.ts';
import { NPC_BONDS } from '../app/lounge-npc-data.ts';
import { DISTRICTS, DISTRICT_IDS, districtOpen, nearestDistrictGate } from '../app/lounge-districts.ts';
import { REGIONS, regionWalk, regionToNetwork, regionFromNetwork, nearestExit, isOutdoorArea } from '../app/lounge-areas.ts';
import { AREAS, AREA_DEFAULTS, chatScope } from '../app/lounge-games.ts';
import { VILLAGE_BOUNDS, villageCanWalk, villagePath, villageToNetwork } from '../app/lounge-village-layout.ts';
import { MARKET_SHOPS, MARKET_SPOTS, MARKET_BOARD } from '../app/lounge-market-layout.ts';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay } from '../app/lounge-economy.ts';
import { ITEM_BY_ID } from '../app/lounge-items.ts';
import { CROPS } from '../app/lounge-life.ts';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 9, 1, 3); // 12:00 KST, Thursday 2026-10-01
const DAY0 = kstDay(T0);

// ---------------------------------------------------------------- hub + districts
test('hub grew to 112 × 88 and every district gate stands on the rim, walkable and reachable', () => {
  assert.deepEqual([VILLAGE_BOUNDS.width, VILLAGE_BOUNDS.depth], [112, 88]);
  for (const id of DISTRICT_IDS) {
    const g = DISTRICTS[id].gate;
    assert.ok(villageCanWalk(g.stand), `${id} stand walkable`);
    const onRim = Math.abs(Math.abs(g.x) - VILLAGE_BOUNDS.width / 2) < 1.5 || Math.abs(Math.abs(g.z) - VILLAGE_BOUNDS.depth / 2) < 1.5;
    assert.ok(onRim, `${id} gate on the rim`);
    const end = villagePath({ x: 0, z: 5 }, g.stand).at(-1);
    assert.ok(end && Math.hypot(end.x - g.stand.x, end.z - g.stand.z) < 0.05, `${id} reachable from the plaza`);
    assert.equal(nearestDistrictGate(g.stand)?.id, id);
    // Old network range still decodes inside the grown hub.
    const n = villageToNetwork(g.stand);
    assert.ok(n.x >= 15 && n.x <= 85 && n.y >= 42 && n.y <= 88);
  }
  assert.equal(districtOpen('market'), true);
  for (const id of ['harbor', 'hillside', 'ranch', 'foothill']) {
    assert.equal(districtOpen(id, { residentFriends: 99, mineDeep: 99, research: ['P3'], bundles: ['fishing-total'] }), false, `${id} not built in stage 1`);
    assert.ok(DISTRICTS[id].hint.length > 5);
  }
});

test('시장 거리 is a separate area the server accepts, with an exit back to the hub', () => {
  assert.ok(isOutdoorArea('market'));
  assert.ok(AREAS.includes('market'));
  assert.equal(chatScope('market'), 'village');
  const r = REGIONS.market;
  assert.deepEqual([r.bounds.w, r.bounds.d], [56, 44]);
  const w = regionWalk('market');
  const arrive = r.arrive.village;
  assert.ok(w.canWalk(arrive));
  const net = regionToNetwork('market', arrive);
  assert.deepEqual(net, AREA_DEFAULTS.market);
  const back = regionFromNetwork('market', AREA_DEFAULTS.market);
  assert.ok(Math.hypot(back.x - arrive.x, back.z - arrive.z) < 0.05);
  const exit = r.exits[0];
  assert.equal(nearestExit('market', exit.stand)?.to, 'village');
  // Every shop counter, the board and each named spot is walkable and reachable from the arrival.
  for (const s of MARKET_SHOPS) assert.ok(w.canWalk(s.counter), `${s.id} counter`);
  assert.ok(w.canWalk(MARKET_BOARD.front));
  for (const [id, p] of Object.entries(MARKET_SPOTS)) {
    assert.ok(w.canWalk(p), `market spot ${id} walkable`);
    const end = w.path(arrive, p).at(-1);
    assert.ok(end && Math.hypot(end.x - p.x, end.z - p.z) < 0.6, `market spot ${id} reachable`);
  }
});

// ---------------------------------------------------------------- schedule
const POSTS = /^(casino|lounge|bank|salon|tavern)\./;
test('every resident place is walkable in its area (posts are drawn by their own scenes)', () => {
  for (const [id, p] of Object.entries(NPC_PLACES)) {
    if (POSTS.test(id) || !['village', 'market', 'tavern'].includes(p.area)) continue;
    assert.ok(npcCanStand(p.area, p), `${id} (${p.area} ${p.x}, ${p.z}) walkable`);
  }
});

test('npcSpot is never off walkable ground over two weeks (every 2 minutes)', () => {
  for (let d = 0; d < 14; d++)
    for (const id of NPC_IDS)
      for (let m = 0; m < 1440; m += 2) {
        const s = npcSpot(id, kstDayStart(DAY0 + d) + m * 60_000 + 17_000);
        if (!s.visible) continue;
        assert.ok(['village', 'market', 'tavern'].includes(s.area), `${id} visible only in walk areas`);
        assert.ok(npcCanStand(s.area, s), `${id} day ${d} ${Math.floor(m / 60)}:${m % 60} ${s.area} (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`);
      }
});

test('no teleports: timelines are continuous and areas change only through an exit', () => {
  const portalEnds = new Set(['v.market-gate', 'm.gate', 'v.tavern-door', 't.door', 'v.home-gate', 'home', 'library', 'v.harbor-gate', 'harbor', 'v.realty-door', 'realty-in', 'v.furniture-door', 'furniture-in']);
  for (let d = 0; d < 14; d++)
    for (const id of NPC_IDS) {
      const ev = npcTimeline(id, DAY0 + d);
      assert.equal(ev[0].t0, kstDayStart(DAY0 + d), `${id} starts at midnight`);
      assert.ok(ev.at(-1).t1 >= kstDayStart(DAY0 + d + 1), `${id} lasts the day`);
      // Every day starts and ends at the same place (no jump at midnight).
      const first = ev[0], last = ev.at(-1);
      assert.equal(first.k, 'stay');
      assert.equal(last.k, 'stay');
      assert.equal(first.place, last.place, `${id} same place at midnight`);
      for (let i = 1; i < ev.length; i++) {
        const a = ev[i - 1], b = ev[i];
        assert.equal(a.t1, b.t0, `${id} day ${d} event ${i} contiguous`);
        if (b.k === 'hide') assert.ok(portalEnds.has(b.at) && portalEnds.has(b.to), `${id} hides only at exits (${b.at} → ${b.to})`);
        if (b.k === 'walk') {
          const start = b.pts[0];
          const from = a.k === 'stay' ? NPC_PLACES[a.place] : a.k === 'hide' ? NPC_PLACES[a.to] : a.pts.at(-1);
          assert.ok(Math.hypot(start.x - from.x, start.z - from.z) < 1e-6, `${id} walk starts where it stood`);
        }
      }
      // Minute by minute, a visible resident never moves faster than walking.
      let prev = null;
      for (let m = 0; m < 1440; m++) {
        const s = npcSpot(id, kstDayStart(DAY0 + d) + m * 60_000);
        if (prev && prev.visible && s.visible && prev.area === s.area)
          assert.ok(Math.hypot(prev.x - s.x, prev.z - s.z) <= NPC_WALK_SPEED * 60 + 0.01, `${id} jumped at ${m}`);
        prev = s;
      }
    }
});

test('walking legs follow walkable paths; two residents never share a spot while standing', () => {
  for (const [a, b] of [['v.plaza', 'v.market-gate'], ['m.gate', 'm.bakery'], ['t.door', 't.booth'], ['v.home-gate', 'v.home-3']]) {
    const pa = NPC_PLACES[a], pb = NPC_PLACES[b];
    const pts = walkPath(pa.area, pa, pb);
    for (let i = 1; i < pts.length; i++)
      for (let k = 0; k <= 10; k++) {
        const p = { x: pts[i - 1].x + ((pts[i].x - pts[i - 1].x) * k) / 10, z: pts[i - 1].z + ((pts[i].z - pts[i - 1].z) * k) / 10 };
        assert.ok(npcCanStand(pa.area, p) || Math.hypot(p.x - pb.x, p.z - pb.z) < 0.5, `${a} → ${b} leg ${i}`);
      }
  }
  for (let d = 0; d < 7; d++)
    for (let m = 0; m < 1440; m += 10) {
      const now = kstDayStart(DAY0 + d) + m * 60_000;
      const standing = WALKING_NPCS.map((id) => npcSpot(id, now)).filter((s) => s.visible && !s.walking);
      for (let i = 0; i < standing.length; i++)
        for (let j = i + 1; j < standing.length; j++)
          if (standing[i].area === standing[j].area)
            assert.ok(Math.hypot(standing[i].x - standing[j].x, standing[i].z - standing[j].z) > 0.8, `${standing[i].id} and ${standing[j].id} overlap at ${d}:${m}`);
    }
});

test('schedules follow the cards: 프리렌 opens late, 신짜장 delivers, everyone goes home at night', () => {
  const at = (id, h, m = 0, d = 0) => npcSpot(id, kstDayStart(DAY0 + d) + (h * 60 + m) * 60_000);
  assert.equal(at('nasera', 7).place, 'm.coop');
  assert.equal(at('frieren', 9).area, 'home');
  assert.ok(['m.bakery', 'home', 'village', 'market'].includes(at('frieren', 10, 30).area) || at('frieren', 10, 30).area === 'market');
  assert.equal(at('thresh', 9).place, 'm.general');
  assert.ok(/배달|우체국|카페|점심/.test(at('sinjjajang', 11).label + at('sinjjajang', 12, 20).label));
  for (const id of WALKING_NPCS) assert.equal(at(id, 3).area, 'home', `${id} at home at 3am`);
  // The eight who work indoors stay at their posts (문 사장·결 목수 take an evening walk).
  assert.equal(at('lumi', 14).area, 'casino');
  assert.equal(at('captain', 22).area, 'tavern');
  assert.equal(at('realtor', 19, 40).area, 'village');
});

// ---------------------------------------------------------------- relations
function world(n = 1) {
  const members = Array.from({ length: n }, (_, i) => ({ id: `1111111${i}-1111-4111-8111-111111111111`, actor: i }));
  let life = emptyLife();
  let ledger = newLoungeLedger();
  for (const m of members) {
    life = ensureLifeMember(life, m.id, m.actor);
    ledger = registerWallet(ledger, `wallet-${m.id}`);
  }
  life.ext = Object.fromEntries(members.map((m) => [m.id, { inv: { jam: 5, flowertea: 5, stone: 5, mugwort: 5 } }]));
  return {
    members,
    get life() { return life; },
    get ledger() { return ledger; },
    act(member, action, now = T0) {
      const r = lifeAction(life, ledger, member, action, now);
      life = r.life;
      ledger = r.ledger;
      validateLedger(ledger);
      const total = Object.values(ledger.accounts).reduce((a, b) => a + b, 0) + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0);
      assert.equal(total, Object.keys(ledger.accounts).length * 100_000);
      return lifeView(life, member.id, member.actor, now);
    },
  };
}

test('relation migration: old 루미/매화 rows stay, unknown ids and bad fields drop, new fields round-trip', () => {
  const old = { lumi: { points: 44, talkedDay: 20000, dates: 2 }, maehwa: { points: 12 }, nobody: { points: 50 }, frieren: { points: 30, lastGift: 'jam', rw: 7 }, janna: { points: 10, lastGift: 'not-an-item' } };
  const read = readNpcRelations(old);
  assert.deepEqual(read.lumi, { points: 44, talkedDay: 20000, dates: 2 });
  assert.deepEqual(read.maehwa, { points: 12 });
  assert.equal(read.nobody, undefined);
  assert.deepEqual(read.frieren, { points: 30, lastGift: 'jam', rw: 3 });
  assert.deepEqual(read.janna, { points: 10 });
  const s = world();
  s.life.ext[s.members[0].id].npcRelations = old;
  const loaded = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(loaded.ext[s.members[0].id].npcRelations, read);
  const view = lifeView(loaded, s.members[0].id, 0, T0);
  assert.equal(view.me.npcRelations.length, NPC_IDS.length);
  assert.equal(view.me.npcRelations.find((r) => r.npc === 'lumi').points, 44);
});

test('gift tastes point at real items; loved beats liked; level presents come once', () => {
  for (const id of NPC_IDS)
    for (const sel of [...NPCS[id].gifts.loved, ...NPCS[id].gifts.liked, ...NPCS[id].gifts.disliked]) {
      const ok = sel in ITEM_BY_ID || CROPS.includes(sel) || ['crop', 'crop:gold', 'fossil', 'fruit'].includes(sel) || sel.startsWith('kind:');
      assert.ok(ok, `${id} taste ${sel}`);
    }
  for (const id of NPC_IDS) for (const t of [40, 100]) assert.ok(NPCS[id].rewards[t][0] in ITEM_BY_ID, `${id} reward ${t}`);
  assert.equal(giftReaction('frieren', { id: 'jam', kind: 'dish', crop: false }), 'loved');
  assert.equal(giftReaction('frieren', { id: 'mugwort', kind: 'forage', crop: false }), 'disliked');
  assert.equal(giftReaction('nasera', { id: 'carrot', crop: true, gold: true }), 'loved');
  assert.equal(giftReaction('nasera', { id: 'carrot', crop: true }), 'liked');
  assert.ok(npcGiftable('carrot') && npcGiftable('fossil-leaf') && !npcGiftable('bait') && !npcGiftable('__proto__'));
  const life = { ext: { u: { inv: { jam: 3 }, npcRelations: { frieren: { points: 30 } } } }, bag: {}, farms: {} };
  const r = npcSocialAction(life, 'u', { kind: 'npcSocial', npc: 'frieren', op: 'gift', item: 'jam' }, T0);
  assert.equal(r.reaction, 'loved');
  assert.equal(life.ext.u.npcRelations.frieren.points, 42);
  assert.deepEqual(r.presents, [NPCS.frieren.rewards[40]]);
  assert.equal(life.ext.u.npcRelations.frieren.rw, 1);
  assert.equal(life.ext.u.npcRelations.frieren.lastGift, 'jam');
  const again = npcSocialAction(life, 'u', { kind: 'npcSocial', npc: 'frieren', op: 'talk' }, T0);
  assert.deepEqual(again.presents, []);
});

test('meeting a walking resident needs the same area and to stand near them', () => {
  const now = kstDayStart(DAY0) + 7 * 3_600_000; // 07:00 KST: 나세라 at the co-op counter
  const spot = npcSpot('nasera', now);
  assert.equal(spot.area, 'market');
  const near = regionToNetwork('market', { x: spot.x + 1, z: spot.z + 1 });
  const far = regionToNetwork('market', { x: spot.x + 20, z: spot.z });
  const talk = { kind: 'npcSocial', npc: 'nasera', op: 'talk' };
  const ctx = (area, p) => ({ area, actor: 0, fishing: false, ...(p ?? {}) });
  assert.doesNotThrow(() => assertNpcSocialContext(talk, {}, ctx('market', near), now));
  assert.throws(() => assertNpcSocialContext(talk, {}, ctx('market', far), now), /가까이/);
  assert.throws(() => assertNpcSocialContext(talk, {}, ctx('village', near), now), /시장 거리/);
  // At 3am she is at home up the hill: nobody can meet her.
  assert.throws(() => assertNpcSocialContext(talk, {}, ctx('market', near), kstDayStart(DAY0) + 3 * 3_600_000), /만날 수 없어요/);
  // Invited home, she can be met in my room whatever her schedule says.
  assert.doesNotThrow(() => assertNpcSocialContext(talk, { nasera: { points: 30, invitedUntil: now + 60_000 } }, { area: 'home', home: 0, actor: 0, fishing: false }, now));
});

// ---------------------------------------------------------------- request board
test('request board: 2–3 deterministic requests a day from different residents', () => {
  for (let d = 0; d < 28; d++) {
    const list = npcRequestsOn(DAY0 + d);
    assert.deepEqual(list, npcRequestsOn(DAY0 + d));
    assert.ok(list.length >= 2 && list.length <= 3);
    assert.equal(new Set(list.map((r) => r.npc)).size, list.length);
    for (const r of list) {
      assert.ok(WALKING_NPCS.includes(r.npc));
      assert.ok(r.item in ITEM_BY_ID || CROPS.includes(r.item), r.item);
      assert.ok(r.n >= 1 && r.n <= 4 && r.beom >= 300 && r.beom <= 1500);
    }
  }
});

test('request board keeps the ledger invariant, caps 범 per day and pays a co-op bonus', () => {
  const s = world(2);
  const [a, b] = s.members;
  const reqs = npcRequestsOn(DAY0);
  for (const m of s.members) {
    const inv = s.life.ext[m.id].inv;
    for (const r of reqs) {
      if (CROPS.includes(r.item)) {
        s.life.bag[m.id].produce[r.item] = (s.life.bag[m.id].produce[r.item] ?? 0) + r.n;
        s.life.ext[m.id].q0 ??= {};
      } else inv[r.item] = (inv[r.item] ?? 0) + r.n;
    }
  }
  const before = s.ledger.accounts[`wallet-${a.id}`];
  const first = s.act(a, { kind: 'npcRequest', id: reqs[0].id });
  assert.equal(first.me.npcBoard.requests[0].done, true);
  const paidA = s.ledger.accounts[`wallet-${a.id}`] - before;
  assert.equal(paidA, reqs[0].beom);
  assert.throws(() => s.act(a, { kind: 'npcRequest', id: reqs[0].id }), /이미/);
  assert.throws(() => s.act(a, { kind: 'npcRequest', id: 'nr-1-9' }), /게시판에 없는/);
  // b finishes the same one after a: co-op bonus.
  const beforeB = s.ledger.accounts[`wallet-${b.id}`];
  const viewB = s.act(b, { kind: 'npcRequest', id: reqs[0].id });
  const paidB = s.ledger.accounts[`wallet-${b.id}`] - beforeB;
  assert.ok(paidB > paidA, 'co-op pays more');
  assert.equal(viewB.me.npcBoard.requests[0].friends, 1);
  const rel = s.life.ext[b.id].npcRelations[reqs[0].npc].points;
  assert.equal(rel, 6);
  // The daily cap holds whatever the requests are worth.
  for (const r of reqs.slice(1)) s.act(a, { kind: 'npcRequest', id: r.id });
  assert.ok(s.life.ext[a.id].npcBoard.beom <= NPC_REQUEST_BEOM_CAP);
  assert.equal(npcBoardView(s.life, a.id, T0).beomToday, s.life.ext[a.id].npcBoard.beom);
  // A new day starts a clean board.
  assert.equal(readNpcBoard(s.life.ext[a.id].npcBoard, DAY0 + 1), undefined);
  assert.ok(npcBoardView(s.life, a.id, T0 + DAY).requests.every((r) => !r.done));
  // Saved and loaded again.
  const loaded = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(loaded.ext[a.id].npcBoard, s.life.ext[a.id].npcBoard);
});

// ---------------------------------------------------------------- dialogue
const EMOJI = /\p{Extended_Pictographic}/u;
const PLACEHOLDERS = new Set(['me', 'name', 'season', 'weather', 'item', 'n', 'place', 'other', 'forecast']);
test('dialogue files: plenty of lines, no emoji or English, known placeholders only', () => {
  for (const id of NPC_IDS) {
    const lines = allNpcLines(id);
    const min = WALKING_NPCS.includes(id) ? 80 : 40;
    assert.ok(lines.length >= min, `${id} has ${lines.length} lines (≥ ${min})`);
    for (const line of lines) {
      assert.ok(!EMOJI.test(line), `${id}: emoji in "${line}"`);
      assert.ok(!/[A-Za-z]{3,}/.test(line.replace(/\{\w+\}/g, '')), `${id}: English in "${line}"`);
      for (const [, key] of line.matchAll(/\{(\w+)\}/g)) assert.ok(PLACEHOLDERS.has(key), `${id}: {${key}}`);
      assert.ok(!/경험해 보세요|완벽한|다양한/.test(line), `${id}: ad copy in "${line}"`);
    }
    for (const t of [0, 1, 2, 3, 4]) assert.ok(NPC_LINES[id].tier[t].length, `${id} tier ${t}`);
    for (const k of ['loved', 'liked', 'neutral', 'disliked']) assert.ok(NPC_LINES[id].gift[k].length, `${id} gift ${k}`);
  }
  for (const b of NPC_BONDS.filter((x) => WALKING_NPCS.includes(x.a) && WALKING_NPCS.includes(x.b)))
    assert.ok(npcBanter(b.a, b.b, 'k'), `banter ${b.a}–${b.b}`);
});

test('dialogue selection is deterministic and fills every placeholder', () => {
  for (const id of NPC_IDS)
    for (let h = 0; h < 24; h += 3) {
      const ctx = { npc: id, me: '도원', who: 0, now: T0 + h * 3_600_000, points: h * 5, talkedToday: false, spot: npcSpot(id, T0 + h * 3_600_000), lastGiftName: '딸기잼' };
      const a = npcTalk(ctx), b = npcTalk({ ...ctx });
      assert.deepEqual(a, b);
      assert.ok(a.lines.length >= 1);
      for (const line of a.lines) assert.ok(!/\{\w+\}/.test(line), `${id}: unfilled "${line}"`);
      assert.equal(npcBubble(id, 'near', 'x', { me: '도원', now: ctx.now }), npcBubble(id, 'near', 'x', { me: '도원', now: ctx.now }));
    }
  assert.deepEqual(npcTalk({ npc: 'frieren', me: '민서', who: 2, now: T0, points: 0, talkedToday: true }).lines.length, 1);
  // 잔나's forecast misses some days, the same way for everyone.
  const misses = Array.from({ length: 60 }, (_, i) => jannaForecast(DAY0 + i).wrong).filter(Boolean).length;
  assert.ok(misses > 3 && misses < 30);
  assert.deepEqual(jannaForecast(DAY0), jannaForecast(DAY0));
});
