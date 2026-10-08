import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay } from '../app/lounge-economy.ts';
import { GAME_HOUR_MS, birthdayActors, gameTimeOnDay, isNighttime, timeOfDay, weatherOf } from '../app/lounge-calendar.ts';
import { NPC_IDS } from '../app/lounge-npc-data.ts';
import {
  COMPANION_BOND_DAY_CAP,
  COMPANION_EFFECTS,
  COMPANION_MIN_POINTS,
  COMPANION_MS,
  COMPANION_PLACES_OF,
} from '../app/lounge-companion-data.ts';
import {
  companionAfterAction,
  companionBusy,
  companionLogout,
  companionUntil,
  companionView,
  companionWhyNot,
  readCompanions,
  settleCompanion,
} from '../app/lounge-companion.ts';
import { companionFishMods, companionLadderEarly, companionNow, companionPrice, companionXpMult } from '../app/lounge-companion-effects.ts';
import { COMPANION_LINES, companionBubble, companionMomentDue, companionTalk } from '../app/lounge-npc-companion-lines.ts';
import { COMPANION_MOMENTS, COMPANION_PLACES, COMPANION_REACTS } from '../app/lounge-npc-companion-line-types.ts';
import { cloudTransition, commandHash, CLOUD_LEASE_MS } from '../app/lounge-cloud-engine.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';
import { xpMultiplier } from '../app/lounge-growth.ts';
import { tripEnd, voyageSway } from '../app/lounge-voyage.ts';

const T0 = Date.UTC(2026, 9, 5, 3);
const A = { id: '11111111-1111-4111-8111-111111111111', actor: 0 };
const B = { id: '22222222-2222-4222-8222-222222222222', actor: 1 };
/** A resident who never keeps a shop (comes along any time). */
const FREE = 'volibas';

function world(points = 60) {
  let life = ensureLifeMember(ensureLifeMember(emptyLife(), A.id, A.actor), B.id, B.actor);
  life.ext = {
    [A.id]: { npcRelations: Object.fromEntries(NPC_IDS.map((n) => [n, { points }])) },
    [B.id]: { npcRelations: Object.fromEntries(NPC_IDS.map((n) => [n, { points }])) },
  };
  let ledger = registerWallet(registerWallet(newLoungeLedger(), `wallet-${A.id}`), `wallet-${B.id}`);
  return {
    get life() { return life; },
    set life(v) { life = v; },
    get ledger() { return ledger; },
    act(member, action, now = T0) {
      const r = lifeAction(life, ledger, member, { kind: 'companion', ...action }, now);
      life = r.life;
      ledger = r.ledger;
      validateLedger(ledger);
      return r;
    },
    view(member = A, now = T0) { return lifeView(life, member.id, member.actor, now).companion; },
  };
}
/** The first quarter game hour from `from` where `ok` holds. */
function findTime(ok, from = T0, span = 7 * 86_400_000) {
  for (let t = Math.ceil(from / (GAME_HOUR_MS / 4)) * (GAME_HOUR_MS / 4); t < from + span; t += GAME_HOUR_MS / 4) if (ok(t)) return t;
  throw new Error('no such time');
}

test('invite needs two hearts; one companion per friend; a resident walks with one friend only', () => {
  const s = world();
  s.life.ext[A.id].npcRelations[FREE].points = COMPANION_MIN_POINTS - 1;
  assert.throws(() => s.act(A, { op: 'invite', npc: FREE }), /하트 2개부터/);
  s.life.ext[A.id].npcRelations[FREE].points = COMPANION_MIN_POINTS;
  const r = s.act(A, { op: 'invite', npc: FREE });
  assert.equal(companionNow(s.life, A.id, T0), FREE);
  const v = s.view();
  assert.equal(v.me.out.npc, FREE);
  assert.equal(v.all[A.id].npc, FREE);
  assert.deepEqual(v.me.met, [FREE]);
  // The first outing with them is in the memory album.
  assert.ok(s.life.memories.some((m) => m.kind === 'companion' && m.text.includes('처음으로 같이')));
  assert.equal(r.ledger, s.ledger);
  // One at a time, and not twice.
  assert.throws(() => s.act(A, { op: 'invite', npc: FREE }, T0 + 1), /이미 같이 다니는/);
  assert.throws(() => s.act(A, { op: 'invite', npc: 'janna' }, T0 + 1), /먼저 보내/);
  // Another friend asks the same resident.
  assert.throws(() => s.act(B, { op: 'invite', npc: FREE }, T0 + 1), /다니는 중이에요/);
  // Everyone sees who walks with whom.
  assert.equal(s.view(B, T0 + 1).all[A.id].npc, FREE);
  // 보내기 frees them for B.
  s.act(A, { op: 'dismiss' }, T0 + 2);
  assert.equal(s.view(A, T0 + 2).me.out, null);
  assert.equal(s.view(A, T0 + 2).me.last.end, 'dismiss');
  s.act(B, { op: 'invite', npc: FREE }, T0 + 3);
  assert.equal(s.view(A, T0 + 3).all[B.id].npc, FREE);
  // The why-not reasons the invite button shows.
  assert.match(companionWhyNot({ npc: FREE, points: 0, mine: null, holder: null, now: T0 }), /하트/);
  assert.match(companionWhyNot({ npc: FREE, points: 99, mine: null, holder: '강재', now: T0 }), /강재랑 다니는 중/);
  assert.equal(companionWhyNot({ npc: FREE, points: 99, mine: null, holder: null, now: T0 }), '');
});

test('shopkeepers refuse in their shop hours and go back when the shop opens; 무잔 only comes at night', () => {
  const s = world();
  const open = findTime((t) => companionBusy('frieren', t) === 'shop');
  assert.throws(() => s.act(A, { op: 'invite', npc: 'frieren' }, open), /가게 봐야 해서요/);
  // Invited off hours: the outing ends at the next opening, with 'shop'.
  const off = findTime((t) => companionBusy('frieren', t) === null && companionBusy('frieren', t + 4 * GAME_HOUR_MS) === 'shop');
  s.act(A, { op: 'invite', npc: 'frieren' }, off);
  const until = companionUntil('frieren', off);
  assert.equal(until.end, 'shop');
  assert.ok(until.until > off && until.until <= off + 4 * GAME_HOUR_MS);
  assert.equal(companionBusy('frieren', until.until), 'shop');
  assert.equal(s.view(A, until.until - 1).me.out?.npc, 'frieren');
  assert.equal(s.view(A, until.until).me.out, null);
  settleCompanion(s.life, A.id, until.until + 1);
  assert.equal(s.life.companions[A.id].last.end, 'shop');
  // The fixed-hour keepers: the bank keeps 나모 in during the day.
  assert.equal(companionBusy('nyamo', gameTimeOnDay(kstDay(T0), 12)), 'shop');
  assert.equal(companionBusy('nyamo', gameTimeOnDay(kstDay(T0), 21)), null);
  // 무잔: not by day; by night yes (and away at dawn's end).
  const day = gameTimeOnDay(kstDay(T0), 12, 0, 5);
  assert.equal(isNighttime(day), false);
  assert.throws(() => s.act(B, { op: 'invite', npc: 'muzan' }, day), /해가 진 뒤/);
  const night = gameTimeOnDay(kstDay(T0), 21, 0, 5);
  s.act(B, { op: 'invite', npc: 'muzan' }, night);
  const end = companionUntil('muzan', night);
  assert.ok(['night', 'shop'].includes(end.end));
  assert.equal(isNighttime(end.until - 1), true);
});

test('an outing lasts 18 game hours (45 real minutes)', () => {
  assert.equal(COMPANION_MS, 45 * 60_000);
  assert.equal(COMPANION_MS, 18 * GAME_HOUR_MS);
  const s = world();
  s.act(A, { op: 'invite', npc: FREE });
  assert.equal(s.life.companions[A.id].out.until, T0 + COMPANION_MS);
  assert.equal(s.view(A, T0 + COMPANION_MS - 1).me.out.npc, FREE);
  assert.equal(s.view(A, T0 + COMPANION_MS).me.out, null);
  assert.deepEqual(s.view(B, T0 + COMPANION_MS).all, {});
  // The next action settles it: they went home by the clock.
  s.act(A, { op: 'invite', npc: 'janna' }, T0 + COMPANION_MS + 5);
  assert.equal(s.life.companions[A.id].last.end, 'time');
  assert.equal(s.life.companions[A.id].out.npc, 'janna');
  // Reading back is stable, and hostile rows are dropped.
  const back = readLife(JSON.parse(JSON.stringify(s.life)));
  assert.deepEqual(back.companions, s.life.companions);
  assert.deepEqual(readCompanions({ x: { out: { npc: FREE } }, [A.id]: { out: { npc: 'nobody', at: 1, until: 2, end: 'time', h: 0 }, b: 99, d: 1 } }), {
    companions: { [A.id]: { d: 1, b: COMPANION_BOND_DAY_CAP } },
  });
});

test('logging out sends the companion home (leave, and a lease that runs out)', async () => {
  let state = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
  const people = [0, 1].map((actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), code: '', epoch: 0, sequence: 0 }));
  const [owner, visitor] = people;
  const apply = async (person, command, now) => {
    const result = cloudTransition(state, person, command, await commandHash(command), now);
    state = result.state;
    person.epoch = result.response.epoch;
    if (result.response.code) person.code = result.response.code;
    validateLedger(state.ledger);
    return result.response;
  };
  const command = (person, op, extra = {}) => ({
    op, connection: person.connection, ...(person.code ? { code: person.code } : {}),
    ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++person.sequence } : {}),
    ...(['open', 'join'].includes(op) ? { epoch: person.epoch } : {}), ...extra,
  });
  const run = (person, op, extra = {}, now = T0) => apply(person, command(person, op, extra), now);
  assert.equal((await run(owner, 'open')).ok, true);
  visitor.code = owner.code;
  assert.equal((await run(visitor, 'join')).ok, true);
  const walk = (uid, npc, at) => {
    state.life.companions = { ...state.life.companions, [uid]: { out: { npc, at, until: at + COMPANION_MS, end: 'time', h: 0 } } };
  };
  // Inviting needs me beside them (the server checks where I really stand).
  state.life.ext ??= {};
  state.life.ext[owner.id] = { ...state.life.ext[owner.id], npcRelations: { [FREE]: { points: 60 } } };
  const far = await run(owner, 'action', { action: { kind: 'companion', op: 'invite', npc: FREE } }, T0 + 100);
  assert.equal(far.ok, false);
  assert.equal(state.life.companions?.[owner.id]?.out, undefined);
  // A one-off moment: the server fills in where I stand (힘멜 loves the village plaza).
  assert.equal((await run(owner, 'action', { action: { kind: 'area', area: 'village' } }, T0 + 150)).ok, true);
  walk(owner.id, 'himmel', T0);
  const fav = await run(owner, 'action', { action: { kind: 'companion', op: 'moment', moment: 'favPlace', where: 'mine' } }, T0 + 200);
  assert.equal(fav.ok, true, fav.error);
  assert.deepEqual(state.life.companions[owner.id].said, ['himmel:favPlace']);
  const twice = await run(owner, 'action', { action: { kind: 'companion', op: 'moment', moment: 'favPlace' } }, T0 + 300);
  assert.equal(twice.ok, false);
  const bad = await run(owner, 'action', { action: { kind: 'companion', op: 'moment', moment: 'badPlace', where: 'mine' } }, T0 + 400);
  assert.equal(bad.ok, false, 'a client cannot claim to stand somewhere else');
  // Leaving the village: home they go.
  walk(owner.id, FREE, T0);
  const left = await run(owner, 'leave', {}, T0 + 1000);
  assert.equal(left.ok, true, left.error);
  assert.equal(state.life.companions[owner.id].out, undefined);
  assert.equal(state.life.companions[owner.id].last.end, 'logout');
  // A lease that runs out (closing the tab): the next command by anyone ends it.
  walk(visitor.id, 'janna', T0 + 2000);
  assert.equal((await run(visitor, 'action', { action: { kind: 'status', text: '산책 중' } }, T0 + 3000)).ok, true);
  assert.equal(state.life.companions[visitor.id].out.npc, 'janna');
  owner.code = visitor.code;
  owner.connection = crypto.randomUUID();
  assert.equal((await run(owner, 'join', {}, T0 + 4000)).ok, true);
  assert.equal((await run(owner, 'action', { action: { kind: 'status', text: '낚시 중' } }, T0 + 100_000)).ok, true);
  assert.equal(state.life.companions[visitor.id].out.npc, 'janna');
  const later = await run(owner, 'action', { action: { kind: 'status', text: '집에 가는 중' } }, T0 + 3000 + CLOUD_LEASE_MS + 1);
  assert.equal(later.ok, true, later.error);
  assert.equal(state.life.companions[visitor.id].out, undefined);
  assert.equal(state.life.companions[visitor.id].last.end, 'logout');
  // The direct helper does the same and is a no-op without an outing.
  const life = ensureLifeMember(emptyLife(), A.id, 0);
  assert.equal(companionLogout(life, A.id, T0), false);
});

test('walking together: +1 a game hour, at most +6 a day; a partner gets hours instead', () => {
  const s = world(30);
  s.act(A, { op: 'invite', npc: FREE });
  settleCompanion(s.life, A.id, T0 + 3 * GAME_HOUR_MS + 10);
  assert.equal(s.life.ext[A.id].npcRelations[FREE].points, 33);
  settleCompanion(s.life, A.id, T0 + 3 * GAME_HOUR_MS + 20);
  assert.equal(s.life.ext[A.id].npcRelations[FREE].points, 33, 'the same hours never count twice');
  settleCompanion(s.life, A.id, T0 + 17 * GAME_HOUR_MS);
  assert.equal(s.life.ext[A.id].npcRelations[FREE].points, 30 + COMPANION_BOND_DAY_CAP);
  assert.equal(s.view(A, T0 + 17 * GAME_HOUR_MS).me.bondToday, COMPANION_BOND_DAY_CAP);
  // The cap is per day across residents: a second outing the same day adds nothing.
  s.act(A, { op: 'dismiss' }, T0 + 17 * GAME_HOUR_MS + 1);
  s.act(A, { op: 'invite', npc: 'janna' }, T0 + 17 * GAME_HOUR_MS + 2);
  settleCompanion(s.life, A.id, T0 + 20 * GAME_HOUR_MS);
  assert.equal(s.life.ext[A.id].npcRelations.janna.points, 30);
  // A partner: no points, the hours are kept instead.
  const p = world(100);
  p.life.ext[A.id].npcRelations[FREE].love = 'dating';
  p.act(A, { op: 'invite', npc: FREE });
  settleCompanion(p.life, A.id, T0 + 4 * GAME_HOUR_MS);
  assert.equal(p.life.ext[A.id].npcRelations[FREE].points, 100);
  assert.equal(p.view(A, T0 + 4 * GAME_HOUR_MS).me.loveHours[FREE], 4);
});

test('effects apply only to the matching activity', () => {
  const s = world();
  const at = (npc) => {
    const life = structuredClone(s.life);
    life.companions = { [A.id]: { out: { npc, at: T0, until: T0 + COMPANION_MS, end: 'time', h: 0 } } };
    return life;
  };
  // XP: 럭스 for fishing only; nobody along: nothing.
  assert.equal(companionXpMult(at('lux'), A.id, 'fish', T0), 1.15);
  assert.equal(companionXpMult(at('lux'), A.id, 'farm', T0), 1);
  assert.equal(companionXpMult(s.life, A.id, 'fish', T0), 1);
  // 무잔 at night only.
  const night = findTime((t) => isNighttime(t));
  const noon = findTime((t) => !isNighttime(t));
  assert.equal(companionXpMult(at('muzan'), A.id, 'mine', night), 1.15);
  assert.equal(companionXpMult(at('muzan'), A.id, 'mine', noon), 1);
  // Fishing: 하쿠 on the river, not the sea; 미스 포츈 offshore only; 가붕 at sea only; 봇치 at night and alone.
  assert.equal(companionFishMods(at('haku'), A.id, 'river', T0).rare, 1.05);
  assert.equal(companionFishMods(at('haku'), A.id, 'sea', T0).rare, 1);
  assert.equal(companionFishMods(at('rose'), A.id, 'offshore', T0).treasure, 1.3);
  assert.equal(companionFishMods(at('rose'), A.id, 'river', T0).treasure, 1);
  assert.equal(companionFishMods(at('gabung'), A.id, 'breakwater', T0).loss, 0.9);
  assert.equal(companionFishMods(at('gabung'), A.id, 'pond', T0).loss, 1);
  assert.equal(companionFishMods(at('bocchi'), A.id, 'river', night).window, 1.05);
  assert.equal(companionFishMods(at('bocchi'), A.id, 'river', night, 2).window, 1);
  assert.equal(companionFishMods(at('bocchi'), A.id, 'river', noon).window, 1);
  // 마키마: the 행상 and the stalls, not the other shops.
  assert.equal(companionPrice(at('makima'), A.id, 'peddler', 1000, T0), 950);
  assert.equal(companionPrice(at('makima'), A.id, 'stall-veg', 1000, T0), 950);
  assert.equal(companionPrice(at('makima'), A.id, 'general', 1000, T0), 1000);
  assert.equal(companionPrice(at('lux'), A.id, 'peddler', 1000, T0), 1000);
  // 볼리바스: the ladder, one rock sooner.
  assert.equal(companionLadderEarly(at('volibas'), A.id, T0), 1);
  assert.equal(companionLadderEarly(at('ornn'), A.id, T0), 0);
  // The engines' own hooks see it: growth's XP multiplier, the voyage's end and sway.
  assert.equal(xpMultiplier(at('lux'), A.id, 'fish', T0), 1.15);
  assert.equal(xpMultiplier(at('lux'), A.id, 'forage', T0), 1);
  const trip = { id: 's1', dep: T0, fare: 0 };
  assert.equal(tripEnd({ ...trip, x: GAME_HOUR_MS }) - tripEnd(trip), GAME_HOUR_MS);
  assert.equal(voyageSway(at('captain'), A.id, T0), 0);
  assert.ok(voyageSway(at('lux'), A.id, T0) > 0);
  // After an action: 발키리 adds a log to chopping, not to foraging.
  const before = at('carpenter');
  const chopped = structuredClone(before);
  chopped.ext[A.id].inv = { wood: 2 };
  companionAfterAction(before, chopped, A, { kind: 'chop' }, T0 + 1);
  assert.equal(chopped.ext[A.id].inv.wood, 3);
  const foraged = structuredClone(before);
  foraged.ext[A.id].inv = { wood: 2 };
  companionAfterAction(before, foraged, A, { kind: 'forage' }, T0 + 1);
  assert.equal(foraged.ext[A.id].inv.wood, 2);
  // 나세라: plots sown now grow faster; a plot sown before is left alone.
  const sown = at('nasera');
  const after = structuredClone(sown);
  after.farms[A.id][0] = { crop: 'carrot', plantedAt: T0 + 1, wateredAt: null };
  after.farms[A.id][1] = { crop: 'carrot', plantedAt: T0 - 5, wateredAt: null };
  companionAfterAction(sown, after, A, { kind: 'plant' }, T0 + 1);
  assert.equal(after.farms[A.id][0].speed, 5);
  assert.equal(after.farms[A.id][1].speed, undefined);
  const watered = structuredClone(sown);
  watered.farms[A.id][0] = { crop: 'carrot', plantedAt: T0 + 1, wateredAt: null };
  companionAfterAction(sown, watered, A, { kind: 'water' }, T0 + 1);
  assert.equal(watered.farms[A.id][0].speed, undefined);
  // 하쿠: the hub fruit tree comes back a fifth sooner after a pick (only a pick).
  const pick = at('haku');
  const picked = structuredClone(pick);
  picked.fruitPickedAt[A.id] = { 'tree-1': T0 + 1 };
  companionAfterAction(pick, picked, A, { kind: 'pick', tree: 'tree-1' }, T0 + 1);
  assert.ok(picked.fruitPickedAt[A.id]['tree-1'] < T0 + 1);
  // 닐라: animals cared for today get +1, once a day.
  const ranch = at('nilah');
  ranch.ext[A.id].s3 = { a: [{ love: 3, cares: 1, last: kstDay(T0) - 1 }] };
  const cared = structuredClone(ranch);
  cared.ext[A.id].s3.a[0] = { love: 4, cares: 2, last: kstDay(T0) };
  companionAfterAction(ranch, cared, A, { kind: 'animalCare' }, T0 + 1);
  assert.equal(cared.ext[A.id].s3.a[0].love, 5);
  const again = structuredClone(cared);
  companionAfterAction(cared, again, A, { kind: 'animalCare' }, T0 + 2);
  assert.equal(again.ext[A.id].s3.a[0].love, 5);
  // Every resident has an effect line.
  for (const npc of NPC_IDS) assert.ok(COMPANION_EFFECTS[npc]?.text, npc);
});

test('companions never touch 범: the ledger is unchanged by every companion action', () => {
  const s = world();
  const ledger = structuredClone(s.ledger);
  s.act(A, { op: 'invite', npc: FREE });
  s.act(A, { op: 'dismiss' }, T0 + 1);
  s.act(A, { op: 'invite', npc: 'janna' }, T0 + 2);
  settleCompanion(s.life, A.id, T0 + 10 * GAME_HOUR_MS);
  assert.deepEqual(s.ledger, ledger);
  validateLedger(s.ledger);
  const balances = Object.values(s.ledger.accounts).reduce((a, b) => a + b, 0);
  assert.equal(balances + (s.ledger.houseBalance ?? 0) - (s.ledger.granted ?? 0), Object.keys(s.ledger.accounts).length * 100000);
});

test('companion talk: a due moment first (once), then the kinds in turn; bubbles stay rare', () => {
  // A dry day, mid-afternoon, not my birthday: no weather, sky or birthday moments.
  const calm = findTime((t) => ['sunny', 'cloudy'].includes(weatherOf(kstDay(t))) && timeOfDay(t) === 'day' && !birthdayActors(kstDay(t)).includes(0));
  const ctx = { npc: 'frieren', me: '도원', actor: 0, now: calm, area: 'woods', love: false, said: [], pend: [], turn: 0 };
  // 프리렌 loves the deep woods: the favourite-place moment comes first.
  assert.equal(COMPANION_PLACES_OF.frieren.fav, 'woods');
  const first = companionTalk(ctx);
  assert.equal(first.moment, 'favPlace');
  assert.ok(COMPANION_LINES.frieren.moment.favPlace.some((l) => first.text.includes(l.slice(0, 6))));
  // Said once: never again; a server-seen moment (pend) goes first.
  const after = companionTalk({ ...ctx, said: ['frieren:favPlace'] });
  assert.notEqual(after.moment, 'favPlace');
  assert.equal(companionTalk({ ...ctx, said: ['frieren:favPlace'], pend: ['firstLegend'] }).moment, 'firstLegend');
  assert.equal(companionMomentDue({ ...ctx, area: 'market', said: [], pend: [] }), null);
  // No moment: the turns walk through place / chat / activity / time / suggest.
  const kinds = new Set();
  for (let turn = 0; turn < 12; turn++) {
    const line = companionTalk({ ...ctx, area: 'market', activity: 'fish', turn });
    assert.ok(line.text && !line.text.includes('{'), line.text);
    kinds.add(line.kind);
  }
  for (const k of ['place', 'chat', 'activity', 'time', 'suggest']) assert.ok(kinds.has(k), k);
  // A partner gets the love lines.
  const love = new Set();
  for (let turn = 0; turn < 7; turn++) love.add(companionTalk({ ...ctx, area: 'market', love: true, turn }).kind);
  assert.ok(love.has('love'));
  // Bubbles: a reaction right after an event; otherwise at most three a game hour.
  assert.ok(companionBubble({ npc: 'lux', me: '도원', now: T0 + 1000, ev: { k: 'bigFish', at: T0 } }));
  for (const npc of ['lux', 'muzan', 'carpenter']) {
    for (let h = 0; h < 6; h++) {
      const start = Math.floor(T0 / GAME_HOUR_MS) * GAME_HOUR_MS + h * GAME_HOUR_MS;
      let windows = 0,
        on = false;
      for (let t = start; t < start + GAME_HOUR_MS; t += 500) {
        const b = !!companionBubble({ npc, me: '도원', now: t });
        if (b && !on) windows++;
        on = b;
      }
      assert.ok(windows >= 1 && windows <= 3, `${npc} ${windows}`);
    }
  }
});

test('companion line files: all residents, every key, short bubbles, places match the server table', () => {
  for (const npc of NPC_IDS) {
    const set = COMPANION_LINES[npc];
    assert.ok(set, npc);
    assert.deepEqual(set.places, COMPANION_PLACES_OF[npc], npc);
    let n = 0;
    const lines = (arr, max, label) => {
      assert.ok(Array.isArray(arr) && arr.length > 0, `${npc} ${label}`);
      for (const l of arr) {
        n++;
        assert.ok(l.replace(/\{[a-z]+\}/g, '___').length <= max, `${npc} ${label}: ${l}`);
        assert.ok(!/\}[가-힣]/.test(l), `${npc} ${label}: josa after a tag: ${l}`);
        assert.ok(!/[A-Za-z]/.test(l.replace(/\{[a-z]+\}/g, '')), `${npc} ${label}: ${l}`);
      }
    };
    for (const k of ['accept', 'firstAccept', 'busy', 'part', 'chat', 'meet', 'friend', 'lowMood']) lines(set[k], 60, k);
    for (const p of COMPANION_PLACES) lines(set.place[p], 60, `place.${p}`);
    for (const k of Object.keys(set.time)) lines(set.time[k], 60, `time.${k}`);
    for (const k of ['rain', 'snow']) lines(set.weather[k], 60, `weather.${k}`);
    for (const k of Object.keys(set.activity)) lines(set.activity[k], 60, `activity.${k}`);
    for (const k of ['fish', 'forage']) lines(set.suggest[k], 60, `suggest.${k}`);
    for (const k of COMPANION_REACTS) lines(set.react[k], 20, `react.${k}`);
    for (const k of COMPANION_MOMENTS) lines(set.moment[k], 60, `moment.${k}`);
    for (const k of ['accept', 'chat', 'part']) lines(set.love[k], 60, `love.${k}`);
    assert.ok(n >= 40 && n <= 200, `${npc}: ${n} lines`);
    assert.ok(set.suggest.fish.every((l) => l.includes('{spot}')) && set.suggest.forage.every((l) => l.includes('{spot}')), npc);
  }
  // Companion views of an older world (no companions) are empty and nothing is written.
  const old = ensureLifeMember(emptyLife(), A.id, 0);
  const before = JSON.stringify(old);
  const v = companionView(old, A.id, T0);
  assert.deepEqual(v.all, {});
  assert.equal(v.me.out, null);
  assert.equal(JSON.stringify(old), before);
});
