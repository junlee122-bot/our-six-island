import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { fishCandidates } from '../app/lounge-life-plus.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay } from '../app/lounge-economy.ts';
import { FISH, FISH_BY_ID, ITEM_BY_ID, ITEM_PRICES, DISH_BY_ID, CRAFT_BY_ID } from '../app/lounge-items.ts';
import { seasonOf, weatherOf, kstHour } from '../app/lounge-calendar.ts';
import { FISH_PROFILE, POT_FISH, EXTRA_FISH, MORE_FISH, inHours } from '../app/lounge-fish-data.ts';
import { FISH_PAINTED } from '../app/lounge-assets.ts';
import {
  MAX_TICKS,
  TICK_MS,
  TraceRecorder,
  botPlay,
  replayTrace,
  traceShape,
  baseLoss,
  GAIN,
} from '../app/lounge-fish-minigame.ts';
import {
  ANGLING_REJECT,
  CRAB_READY_MS,
  CUP_PRIZES,
  HOOK_SLACK_MS,
  RARITY_INFO,
  RARITY_ORDER,
  anglerCandidates,
  anglingHooks,
  biteDelayMs,
  catchQuality,
  fishAvailable,
  hookSlackMs,
  rarityOf,
  readAngling,
  treasureChance,
  treasureLoot,
  TREASURE_TABLE,
} from '../app/lounge-fish-engine.ts';
import { fishSaleMult } from '../app/lounge-fish-quality.ts';

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 8, 24, 3); // 12:00 KST
const UIDS = [0, 1, 2, 3].map((i) => `${i}${i}${i}${i}${i}${i}${i}${i}-1111-4111-8111-11111111111${i}`);

function world(n = 1) {
  const members = UIDS.slice(0, n).map((id, actor) => ({ id, actor }));
  let ledger = newLoungeLedger();
  let life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, `wallet-${m.id}`);
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, life, ledger };
  s.act = (m, a, now) => {
    const next = lifeAction(s.life, s.ledger, m, a, now);
    s.life = next.life;
    s.ledger = next.ledger;
    validateLedger(s.ledger);
    const balances = Object.values(s.ledger.accounts).reduce((x, y) => x + y, 0);
    assert.equal(balances + (s.ledger.houseBalance ?? 0) - (s.ledger.granted ?? 0), Object.keys(s.ledger.accounts).length * 100_000);
    return next;
  };
  s.fails = (m, a, now, message) => assert.throws(() => s.act(m, a, now), { message });
  s.view = (m, now) => lifeView(s.life, m.id, m.actor, now);
  s.give = (m, item, n) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + n;
  };
  s.skill = (m, xp, rod) => {
    const u = (((s.life.growth ??= {}).u ??= {})[m.id] ??= {});
    u.xp = { ...u.xp, fish: xp };
    if (rod) u.tools = { ...u.tools, rod };
  };
  return s;
}
/** First time from `from` (hour steps, 4 weeks) that matches. */
function findTime(pred, from = T0) {
  for (let t = from; t < from + 28 * 24 * HOUR; t += HOUR) if (pred(t)) return t;
  throw new Error('no time found');
}
/** Cast → hook → fight with the reference player → land. Returns the last result. */
function fishOnce(s, m, spot, at, opts = {}) {
  s.act(m, { kind: 'anglerCast', spot, ...(opts.bait ? { bait: opts.bait } : {}) }, at);
  const cast = s.view(m, at).angling.me.cast;
  assert.ok(cast && cast.fish === undefined, 'the fish stays hidden');
  const hookAt = cast.biteAt + 120;
  s.act(m, { kind: 'anglerHook', token: cast.token }, hookAt);
  const fight = s.view(m, hookAt).angling.me.fight;
  assert.ok(fight, 'a fight starts at the hook');
  assert.equal(fight.fish, undefined);
  const play = botPlay(fight.setup, opts.bot);
  const landAt = hookAt + play.result.ticks * TICK_MS + 50;
  s.act(m, { kind: 'anglerLand', token: fight.token, runs: play.runs }, landAt);
  return { last: s.view(m, landAt).angling.me.last, play, landAt, setup: fight.setup };
}

// ------------------------------------------------------------ species
test('species availability follows season, weather, KST hours and legend gates', () => {
  const ctx = (now, extra = {}) => ({ season: seasonOf(now), weather: weatherOf(kstDay(now)), now, ...extra });
  // Hour windows wrap past midnight.
  assert.equal(inHours([20, 4], 21), true);
  assert.equal(inHours([20, 4], 3), true);
  assert.equal(inHours([20, 4], 12), false);
  assert.equal(inHours(undefined, 12), true);
  const eel = FISH_BY_ID.eel;
  const rainyNight = findTime((t) => eel.seasons.includes(seasonOf(t)) && weatherOf(kstDay(t)) === 'rain' && kstHour(t) === 22);
  assert.equal(fishAvailable(eel, ctx(rainyNight)), true);
  assert.equal(fishAvailable(eel, ctx(rainyNight - 3 * HOUR)), false, '19시: night, but outside 20–4');
  const dry = findTime((t) => eel.seasons.includes(seasonOf(t)) && weatherOf(kstDay(t)) === 'sunny' && kstHour(t) === 22);
  assert.equal(fishAvailable(eel, ctx(dry)), false, 'eel needs rain');
  const sandfish = FISH_BY_ID.sandfish;
  const winter = findTime((t) => seasonOf(t) === 'winter');
  const summer = findTime((t) => seasonOf(t) === 'summer');
  assert.equal(fishAvailable(sandfish, ctx(winter)), true);
  assert.equal(fishAvailable(sandfish, ctx(summer)), false);
  // Legend: spring, dry, 06–10 KST, level 5, rod 3, once.
  const bt = FISH_BY_ID.blossomtrout;
  const spring = findTime((t) => seasonOf(t) === 'spring' && !['rain', 'storm'].includes(weatherOf(kstDay(t))) && kstHour(t) === 7);
  assert.equal(fishAvailable(bt, ctx(spring, { level: 5, rod: 3 })), true);
  assert.equal(fishAvailable(bt, ctx(spring, { level: 4, rod: 3 })), false);
  assert.equal(fishAvailable(bt, ctx(spring, { level: 9, rod: 2 })), false);
  assert.equal(fishAvailable(bt, ctx(spring, { level: 9, rod: 3, caught: ['blossomtrout'] })), false);
  assert.equal(fishAvailable(bt, ctx(spring + 4 * HOUR, { level: 9, rod: 3 })), false, '11시');
  assert.ok(anglerCandidates('falls', ctx(spring, { level: 9, rod: 3 })).some((f) => f.id === 'blossomtrout'));
  // The legacy table never offers the new legends or crab-pot catches.
  for (const f of [...EXTRA_FISH.filter((f) => f.weight <= 1), ...POT_FISH])
    for (let t = T0; t < T0 + 28 * 24 * HOUR; t += 5 * HOUR)
      for (const spot of ['falls', 'lake', 'rocks', 'river', 'sea'])
        assert.ok(!fishCandidates(spot, seasonOf(t), weatherOf(kstDay(t)), t).some((c) => c.id === f.id));
  // Every rod fish has a profile; every season has its own legend.
  for (const f of FISH.filter((f) => f.spots.length)) assert.ok(FISH_PROFILE[f.id], `${f.id} profile`);
  const legendSeasons = FISH.filter((f) => f.weight <= 1).flatMap((f) => (FISH_PROFILE[f.id].season ? [FISH_PROFILE[f.id].season] : f.seasons));
  for (const season of ['spring', 'summer', 'autumn', 'winter']) assert.ok(legendSeasons.includes(season), season);
  // New items exist, can be bought or crafted, dishes are sellable.
  for (const id of ['bait-dough', 'bait-shrimp', 'tackle-float', 'tackle-trap', 'tackle-treasure', 'crabpot']) assert.ok(ITEM_PRICES[id] > 0 && ITEM_BY_ID[id]);
  assert.ok(CRAFT_BY_ID['bait-glow'] && CRAFT_BY_ID.crabpot);
  for (const id of ['sashimi', 'haemuljeon', 'guljeon', 'kkotgetang', 'daseulgiguk']) assert.ok(DISH_BY_ID[id].sell > 100 && ITEM_BY_ID[id].museum);
});

// ------------------------------------------------------------ minigame
test('the fight is deterministic and a recorded trace replays to the same result', () => {
  for (let i = 0; i < 40; i++) {
    const setup = { seed: 1000 + i * 7919, behaviour: ['calm', 'dart', 'sink', 'float', 'mixed'][i % 5], difficulty: 10 + (i * 13) % 85, bar: 2_800, gain: GAIN, loss: baseLoss(40), treasure: i % 3 ? null : { at: 60, pos: 5_000 } };
    const play = botPlay(setup);
    const again = replayTrace(setup, play.runs);
    assert.ok(again.ok);
    assert.deepEqual(again.result, play.result);
    assert.ok(play.result.ticks <= MAX_TICKS);
  }
  // Easy fish are catchable; legends are not free.
  let easy = 0, hard = 0;
  for (let i = 0; i < 100; i++) {
    easy += botPlay({ seed: i, behaviour: 'calm', difficulty: 15, bar: 2_500, gain: GAIN, loss: baseLoss(15), treasure: null }).result.caught;
    hard += botPlay({ seed: i, behaviour: 'dart', difficulty: 90, bar: 2_500, gain: GAIN, loss: baseLoss(90), treasure: null }, { react: 7, look: 3 }).result.caught;
  }
  assert.ok(easy >= 95, `easy ${easy}`);
  assert.ok(hard <= 20, `hard ${hard}`);
});

test('impossible traces are refused', () => {
  const setup = { seed: 42, behaviour: 'mixed', difficulty: 40, bar: 2_800, gain: GAIN, loss: baseLoss(40), treasure: null };
  assert.equal(traceShape('nope').ok, false);
  assert.equal(traceShape([]).ok, false);
  assert.equal(traceShape([5, -1]).reason, 'shape');
  assert.equal(traceShape([5, 0, 3]).reason, 'shape', 'only the first run may be 0');
  assert.equal(traceShape([1.5]).reason, 'shape');
  assert.equal(traceShape([MAX_TICKS, 1]).reason, 'long');
  // 40 Hz toggling is not a person.
  assert.equal(traceShape(Array.from({ length: 200 }, () => 1)).reason, 'inhuman');
  assert.equal(traceShape(Array.from({ length: 601 }, () => 3)).reason, 'shape');
  // Input that keeps going after the fish was landed.
  const play = botPlay(setup);
  const over = [...play.runs];
  over[over.length - 1] += 40;
  assert.equal(replayTrace(setup, over).reason, 'overrun');
  // A trace that stops early is an escape, never a catch.
  const short = replayTrace(setup, [10]);
  assert.ok(short.ok && !short.result.caught);
  // Holding the whole time loses a mixed fish.
  const hold = replayTrace(setup, [0, 400]);
  assert.ok(!hold.ok || !hold.result.caught);
  // TraceRecorder round trip.
  const rec = new TraceRecorder();
  for (const h of [false, false, true, true, true, false]) rec.push(h);
  assert.deepEqual(rec.toRuns(), [2, 3, 1]);
  const rec2 = new TraceRecorder();
  rec2.push(true);
  assert.deepEqual(rec2.toRuns(), [0, 1]);
});

test('the server re-simulates: claimed timing faster than real time or a forged trace is a miss', () => {
  const s = world(1), m = s.members[0];
  s.act(m, { kind: 'anglerCast', spot: 'pond' }, T0);
  const cast = s.view(m, T0).angling.me.cast;
  s.act(m, { kind: 'anglerHook', token: cast.token }, cast.biteAt + 100);
  const fight = s.view(m, cast.biteAt + 100).angling.me.fight;
  const play = botPlay(fight.setup);
  assert.ok(play.result.caught);
  const inv = { ...s.view(m, cast.biteAt).me.inv };
  // Landed only 100 ms after the hook with a multi-second trace.
  s.act(m, { kind: 'anglerLand', token: fight.token, runs: play.runs }, cast.biteAt + 200);
  const last = s.view(m, cast.biteAt + 200).angling.me.last;
  assert.equal(last.ok, false);
  assert.equal(last.reason, 'refused');
  assert.deepEqual(s.view(m, cast.biteAt + 200).me.inv, inv);
  // The fight is gone: the same token cannot be replayed.
  s.fails(m, { kind: 'anglerLand', token: fight.token, runs: play.runs }, cast.biteAt + 60_000, ANGLING_REJECT.token);
  // Early and late hooks miss like the legacy reel.
  s.act(m, { kind: 'anglerCast', spot: 'pond' }, T0 + 60_000);
  const c2 = s.view(m, T0 + 60_000).angling.me.cast;
  s.act(m, { kind: 'anglerHook', token: c2.token }, c2.castAt + 10);
  assert.equal(s.view(m, c2.castAt + 10).angling.me.last.reason, 'early');
  s.act(m, { kind: 'anglerCast', spot: 'pond' }, T0 + 120_000);
  const c3 = s.view(m, T0 + 120_000).angling.me.cast;
  s.act(m, { kind: 'anglerHook', token: c3.token }, c3.expiresAt + 1);
  assert.equal(s.view(m, c3.expiresAt + 1).angling.me.last.reason, 'late');
});

test('the hook grace follows the fish grade: common forgives the most, legend the least', () => {
  const order = ['common', 'uncommon', 'rare', 'legend'];
  for (let i = 1; i < order.length; i++) assert.ok(HOOK_SLACK_MS[order[i - 1]] > HOOK_SLACK_MS[order[i]], order[i]);
  assert.ok(HOOK_SLACK_MS.legend >= 800, 'a legend still covers a normal network round trip');
  for (const f of FISH) assert.equal(hookSlackMs(f), HOOK_SLACK_MS[rarityOf(f)], f.id);
  // In the engine: expiresAt = biteAt + windowMs + the grade's grace, and the
  // server hooks up to that moment and calls it late one millisecond after.
  const s = world(1), m = s.members[0];
  const seen = new Set();
  let at = T0;
  for (let n = 0; n < 400 && seen.size < 3; n++) {
    const spot = ['pond', 'river'][n % 2];
    at += 60_000;
    s.act(m, { kind: 'anglerCast', spot }, at);
    const cast = s.view(m, at).angling.me.cast;
    const grade = rarityOf(FISH_BY_ID[s.life.angling.u[m.id].cast.fish]);
    assert.equal(cast.expiresAt - cast.biteAt - cast.windowMs, HOOK_SLACK_MS[grade], grade);
    if (seen.has(grade)) {
      s.act(m, { kind: 'anglerCancel', token: cast.token }, at + 1);
      continue;
    }
    seen.add(grade);
    s.act(m, { kind: 'anglerHook', token: cast.token }, cast.expiresAt);
    const fight = s.view(m, cast.expiresAt).angling.me.fight;
    assert.ok(fight, `${grade}: hooked at the last moment of its grace`);
    assert.equal(fight.reactionMs, cast.windowMs + HOOK_SLACK_MS[grade]);
    s.act(m, { kind: 'anglerCancel', token: fight.token }, cast.expiresAt + 1);
    at += 60_000;
    s.act(m, { kind: 'anglerCast', spot }, at);
    const again = s.view(m, at).angling.me.cast;
    s.act(m, { kind: 'anglerHook', token: again.token }, again.expiresAt + 1);
    const last = s.view(m, again.expiresAt + 1).angling.me.last;
    assert.equal(last.reason, 'late');
    assert.equal(last.grade, 'E', 'a hook past the window keeps the slowest reaction grade');
  }
  assert.ok(seen.has('common') && seen.size >= 2, [...seen].join());
});

test('36 more species: unique, profiled, painted, and each one bites somewhere, sometime', () => {
  assert.equal(MORE_FISH.length, 36);
  const ids = FISH.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, 'fish ids are unique');
  const count = (r) => MORE_FISH.filter((f) => rarityOf(f) === r).length;
  assert.deepEqual([count('common'), count('uncommon'), count('rare'), count('legend')], [16, 11, 6, 3]);
  for (const f of MORE_FISH) {
    assert.ok(FISH_PROFILE[f.id], `${f.id} has a fight profile`);
    assert.ok(FISH_PAINTED[f.id], `${f.id} has a painted icon`);
    assert.ok(f.spots.length && f.note && f.cm[0] < f.cm[1], f.id);
    if (rarityOf(f) === 'legend') {
      assert.deepEqual(f.seasons, [], `${f.id}: the legacy cast never picks a legend`);
      assert.ok(FISH_PROFILE[f.id].legend && FISH_PROFILE[f.id].season, f.id);
    }
  }
  // Every new fish is available at one of its spots at some hour of some day
  // (seasons and weather cycle over the year), for a strong angler.
  const strong = { level: 10, rod: 5, caught: [] };
  for (const f of MORE_FISH) {
    let seen = false;
    for (let t = T0; t < T0 + 366 * 24 * HOUR && !seen; t += HOUR)
      seen = fishAvailable(f, { season: seasonOf(t), weather: weatherOf(kstDay(t)), now: t, ...strong });
    assert.ok(seen, `${f.id} bites at some time of the year`);
  }
  assert.deepEqual(RARITY_ORDER.map((r) => RARITY_INFO[r].stars), [1, 2, 3, 4]);
});

test('the fight view shows the hooked fish grade, never the fish', () => {
  const s = world(1), m = s.members[0];
  let at = T0;
  const grades = new Set();
  for (let n = 0; n < 60 && grades.size < 2; n++) {
    at += 60_000;
    s.act(m, { kind: 'anglerCast', spot: n % 2 ? 'pond' : 'river' }, at);
    const cast = s.view(m, at).angling.me.cast;
    s.act(m, { kind: 'anglerHook', token: cast.token }, cast.biteAt + 100);
    const fight = s.view(m, cast.biteAt + 100).angling.me.fight;
    const hidden = FISH_BY_ID[s.life.angling.u[m.id].fight.fish];
    assert.equal(fight.fish, undefined);
    assert.equal(fight.rarity, rarityOf(hidden));
    grades.add(fight.rarity);
    s.act(m, { kind: 'anglerCancel', token: fight.token }, cast.biteAt + 200);
  }
  assert.ok(grades.size >= 2, [...grades].join());
});

test('the bite is timed from when the cast left, so a reply that runs late still hooks in time', () => {
  // What is left to wait: biteAt − castAt, less the time since the cast left.
  assert.equal(biteDelayMs({ castAt: 100, biteAt: 3_100 }, 500), 2_500);
  assert.equal(biteDelayMs({ castAt: 100, biteAt: 3_100 }, 9_000), 0);
  assert.equal(biteDelayMs({ castAt: 100, biteAt: 3_100 }, -5), 3_000);
  // Against the server's window, on one clock: the cast reaches the server `up`
  // after it left at T0, its reply runs `late` after the server answered (seconds
  // on a page busy with software WebGL), and the hook also takes `up`.
  const react = 300;
  for (const up of [30, 250])
    for (const share of [0, 0.5, 0.95, 1.1]) {
      const s = world(1), m = s.members[0];
      const castAt = T0 + up;
      s.act(m, { kind: 'anglerCast', spot: 'pond' }, castAt);
      const cast = s.view(m, castAt).angling.me.cast;
      const late = Math.round((cast.biteAt - castAt) * share), ranAt = castAt + late;
      const shownAt = ranAt + biteDelayMs(cast, ranAt - T0);
      // One uplink before the server's bite however late the reply ran, or at
      // once when it only ran after the fish bit.
      assert.equal(shownAt, Math.max(cast.biteAt - up, ranAt), `up=${up} late=${late}`);
      const hookAt = shownAt + react + up;
      s.act(m, { kind: 'anglerHook', token: cast.token }, hookAt);
      const me = s.view(m, hookAt).angling.me;
      assert.ok(me.fight, `up=${up} late=${late}: hooked, not ${me.last?.reason}`);
      if (ranAt <= cast.biteAt - up) assert.equal(me.fight.reactionMs, react, 'the server times the player, not the page');
    }
});

// ------------------------------------------------------------ catch, records, quality
test('a landed fish: bag, log, records, quality, weight, cup score, XP; selling pays the quality', () => {
  const s = world(2), [m, n] = s.members;
  let at = T0, caught = null;
  for (let i = 0; i < 20 && !caught; i++, at += 60_000) {
    const r = fishOnce(s, m, 'pond', at);
    if (r.last.ok) caught = r;
  }
  assert.ok(caught, 'the reference player lands a pond fish');
  const { last } = caught;
  const f = FISH_BY_ID[last.fish];
  assert.ok(f.spots.includes('pond'));
  assert.ok(last.cm >= f.cm[0] && last.cm <= f.cm[1]);
  assert.ok(last.grams > 0 && last.cupScore > 0);
  assert.equal(last.quality, catchQuality(f, last.cm, !!last.perfect));
  const v = s.view(m, caught.landAt);
  assert.ok(v.me.inv[last.fish] >= 1);
  assert.ok(v.angling.me.log[last.fish].n >= 1);
  assert.ok(v.me.dex.includes(last.fish));
  assert.equal(v.records[last.fish].actor, 0);
  assert.ok(s.life.growth.u[m.id].xp.fish > 0, 'fishing XP');
  assert.equal(s.view(n, caught.landAt).records[last.fish].actor, 0, 'friends see the village record');
  assert.equal(v.angling.cup.standings[0].actor, 0);
  assert.equal(anglingHooks.villageFishTotal(s.life) >= 1, true);
  // Quality sells best first: 1 gold + 1 normal of the same fish.
  const id = 'crucian';
  s.give(m, id, 2);
  ((s.life.angling.u[m.id].fq ??= {})[id] = [0, 1]);
  const have = s.life.ext[m.id].inv[id];
  assert.equal(fishSaleMult(s.life, m.id, id, 1), 1.5);
  assert.equal(fishSaleMult(s.life, m.id, id, have), (1.5 + (have - 1)) / have);
  const before = s.ledger.accounts[`wallet-${m.id}`];
  s.act(m, { kind: 'sellItem', item: id, n: 1 }, caught.landAt + 1000);
  const paid = s.ledger.accounts[`wallet-${m.id}`] - before;
  assert.ok(paid >= Math.round(FISH_BY_ID[id].sell * 1.5 * 0.9), `gold crucian paid ${paid}`);
  assert.equal(s.life.angling.u[m.id].fq?.[id], undefined, 'the gold mark went with the sale');
});

test('legends are caught once per friend; co-op counts friends at the same spot', () => {
  const s = world(2), [m, n] = s.members;
  s.skill(m, 4_500, 3);
  const spring = findTime((t) => seasonOf(t) === 'spring' && !['rain', 'storm'].includes(weatherOf(kstDay(t))) && kstHour(t) === 7);
  s.life.flags = ['bridge'];
  const ctx = { season: 'spring', weather: weatherOf(kstDay(spring)), now: spring, level: 10, rod: 3 };
  assert.ok(fishAvailable(FISH_BY_ID.blossomtrout, ctx));
  (s.life.angling ??= {}).u = { [m.id]: { legends: ['blossomtrout'] } };
  const v = s.view(m, spring);
  assert.ok(v.angling.me.legends.includes('blossomtrout'));
  // Legacy best of an old legend counts as caught too.
  ((s.life.ext ??= {})[m.id] ??= {}).best = { goldcarp: 80 };
  assert.ok(s.view(m, spring).angling.me.legends.includes('goldcarp'));
  // Co-op: n casts at the pond, then m casts there within 90 s.
  s.act(n, { kind: 'anglerCast', spot: 'pond' }, T0);
  s.act(m, { kind: 'anglerCast', spot: 'pond' }, T0 + 30_000);
  assert.equal(s.view(m, T0 + 30_000).angling.me.cast.coop, 1);
  assert.deepEqual(s.view(m, T0 + 30_000).angling.anglers.pond.sort(), [0, 1]);
  s.act(m, { kind: 'anglerCast', spot: 'river' }, T0 + 40_000);
  assert.equal(s.view(m, T0 + 40_000).angling.me.cast.coop, 0);
});

// ------------------------------------------------------------ treasure
test('treasure: chance by level/tackle/co-op, chests show up at that rate, loot is never 범', () => {
  assert.equal(treasureChance(0, false, 0), 12);
  assert.equal(treasureChance(10, true, 3), 12 + 15 + 5 + 6);
  const s = world(1), m = s.members[0];
  let chests = 0, hooks = 0;
  for (let i = 0; i < 400; i++) {
    const at = T0 + i * 60_000;
    s.act(m, { kind: 'anglerCast', spot: 'river' }, at);
    const c = s.view(m, at).angling.me.cast;
    s.act(m, { kind: 'anglerHook', token: c.token }, c.biteAt + 50);
    const f = s.view(m, c.biteAt + 50).angling.me.fight;
    hooks++;
    if (f.setup.treasure) chests++;
    s.act(m, { kind: 'anglerCancel', token: f.token }, c.biteAt + 60);
  }
  const rate = chests / hooks;
  assert.ok(rate > 0.08 && rate < 0.17, `chest rate ${rate}`);
  const seen = {};
  for (let i = 0; i < 4000; i++) {
    const loot = treasureLoot(`k${i}`, 'spring');
    assert.ok(['item', 'seed', 'furn'].includes(loot.kind));
    assert.ok(loot.n >= 1);
    const key = loot.kind === 'item' ? loot.item : loot.kind;
    seen[key] = (seen[key] ?? 0) + 1;
  }
  const total = TREASURE_TABLE.reduce((a, t) => a + t.w, 0);
  assert.ok(Math.abs(seen.bait / 4000 - 30 / total) < 0.03, `bait ${seen.bait}`);
  assert.ok(seen.furn > 0 && seen.seed > 0 && seen.copper > 0);
});

// ------------------------------------------------------------ crab pots
test('crab pots: need a pot and bait, fill after 4 hours, re-bait, pick up', () => {
  const s = world(1), m = s.members[0];
  s.fails(m, { kind: 'crabSet', spot: 'river' }, T0, ANGLING_REJECT.potNone);
  s.give(m, 'crabpot', 1);
  s.fails(m, { kind: 'crabSet', spot: 'river' }, T0, ANGLING_REJECT.potBait);
  s.give(m, 'bait-dough', 2);
  s.act(m, { kind: 'crabSet', spot: 'river' }, T0);
  let v = s.view(m, T0);
  assert.equal(v.me.inv.crabpot, undefined);
  assert.equal(v.me.inv['bait-dough'], 1);
  assert.equal(v.angling.me.pots[0].readyAt, T0 + CRAB_READY_MS);
  s.fails(m, { kind: 'crabCollect', spot: 'river' }, T0 + CRAB_READY_MS - 1, ANGLING_REJECT.potWait);
  s.fails(m, { kind: 'crabSet', spot: 'river' }, T0 + 60_000, ANGLING_REJECT.potBaited);
  assert.equal(s.view(m, T0 + CRAB_READY_MS).angling.me.pots[0].ready, true);
  s.fails(m, { kind: 'crabTake', spot: 'river' }, T0 + CRAB_READY_MS, ANGLING_REJECT.potFull);
  s.act(m, { kind: 'crabCollect', spot: 'river' }, T0 + CRAB_READY_MS);
  v = s.view(m, T0 + CRAB_READY_MS);
  const got = ['snail', 'shrimp', 'crayfish'].filter((id) => v.me.inv[id]);
  assert.equal(got.length, 1, 'a freshwater catch');
  assert.ok(v.me.dex.includes(got[0]));
  s.fails(m, { kind: 'crabCollect', spot: 'river' }, T0 + CRAB_READY_MS + 1, ANGLING_REJECT.potWait);
  s.act(m, { kind: 'crabSet', spot: 'river' }, T0 + CRAB_READY_MS + 1);
  assert.equal(s.view(m, T0 + CRAB_READY_MS + 1).me.inv['bait-dough'], undefined);
  s.act(m, { kind: 'crabTake', spot: 'river' }, T0 + CRAB_READY_MS + 2);
  assert.equal(s.view(m, T0 + CRAB_READY_MS + 2).me.inv.crabpot, 1);
  assert.deepEqual(s.view(m, T0 + CRAB_READY_MS + 2).angling.me.pots, []);
  // Pot limit (3 below 낚시 Lv6).
  s.give(m, 'crabpot', 3);
  s.give(m, 'bait', 5);
  for (const spot of ['river', 'pond', 'lake']) s.act(m, { kind: 'crabSet', spot }, T0 + 5 * HOUR);
  s.fails(m, { kind: 'crabSet', spot: 'rapids' }, T0 + 5 * HOUR, ANGLING_REJECT.potMax);
  // Sea spots give seafood.
  s.life.flags = ['bridge'];
  s.act(m, { kind: 'crabTake', spot: 'lake' }, T0 + 5 * HOUR);
  s.act(m, { kind: 'crabSet', spot: 'sea' }, T0 + 5 * HOUR);
  s.act(m, { kind: 'crabCollect', spot: 'sea' }, T0 + 9 * HOUR);
  const inv = s.view(m, T0 + 9 * HOUR).me.inv;
  assert.equal(['clam', 'oyster', 'conch', 'crab'].filter((id) => inv[id]).length, 1);
});

// ------------------------------------------------------------ tackle
test('tackle slots follow the rod tier and wear out', () => {
  const s = world(1), m = s.members[0];
  s.give(m, 'tackle-float', 2);
  s.fails(m, { kind: 'anglerTackle', slot: 0, item: 'tackle-float' }, T0, ANGLING_REJECT.tackleSlot);
  s.skill(m, 0, 3);
  const before = s.view(m, T0).angling.me.bar;
  s.act(m, { kind: 'anglerTackle', slot: 0, item: 'tackle-float' }, T0);
  const v = s.view(m, T0);
  assert.equal(v.angling.me.bar, before + 700);
  assert.equal(v.me.inv['tackle-float'], 1);
  s.fails(m, { kind: 'anglerTackle', slot: 1, item: 'tackle-float' }, T0, ANGLING_REJECT.tackleSlot);
  // Unused tackle comes back to the bag.
  s.act(m, { kind: 'anglerTackle', slot: 0, item: null }, T0);
  assert.equal(s.view(m, T0).me.inv['tackle-float'], 2);
  s.act(m, { kind: 'anglerTackle', slot: 0, item: 'tackle-float' }, T0);
  for (let i = 0; i < 20; i++) {
    const at = T0 + (i + 1) * 60_000;
    s.act(m, { kind: 'anglerCast', spot: 'river' }, at);
    const c = s.view(m, at).angling.me.cast;
    s.act(m, { kind: 'anglerHook', token: c.token }, c.biteAt + 50);
    s.act(m, { kind: 'anglerCancel', token: c.token }, c.biteAt + 60);
  }
  assert.deepEqual(s.view(m, T0 + HOUR).angling.me.tackle, [], 'worn out after 20 fish');
});

// ------------------------------------------------------------ save migration
test('older worlds read without angling state; saved state round-trips and hostile values are dropped', () => {
  const old = readLife({ farms: {}, bag: {}, actors: {} });
  assert.equal(old.angling, undefined);
  assert.deepEqual(readAngling(undefined), {});
  const s = world(1), m = s.members[0];
  s.give(m, 'crabpot', 1);
  s.give(m, 'bait', 1);
  s.act(m, { kind: 'crabSet', spot: 'pond' }, T0);
  fishOnce(s, m, 'pond', T0 + 60_000);
  const saved = JSON.parse(JSON.stringify(s.life));
  const again = readLife(saved);
  assert.deepEqual(again.angling, s.life.angling);
  const hostile = readAngling({
    u: {
      [m.id]: {
        cast: { token: 'BAD TOKEN', spot: 'pond', fish: 'crucian' },
        fight: { token: 'abc', spot: 'moon', fish: 'crucian', setup: {} },
        log: { crucian: { n: -1 }, nothing: { n: 1, cm: 1, g: 1, q: 0, first: 1 } },
        fq: { crucian: [1e20, 1] },
        tackle: [{ id: 'tackle-float', uses: 999 }, { id: 'rod', uses: 1 }],
        pots: Array.from({ length: 50 }, () => ({ spot: 'pond', at: 1, bait: true })),
        legends: ['goldcarp', 'nope'],
      },
      'not-a-uid': { legends: ['goldcarp'] },
    },
    cup: { week: 1, e: { 9: [{ fish: 'crucian', cm: 1, score: 1 }], 1: [{ fish: 'crucian', cm: 10, score: 5000 }] } },
    total: -5,
  });
  const u = hostile.angling.u[m.id];
  assert.equal(u.cast, undefined);
  assert.equal(u.fight, undefined);
  assert.equal(u.log, undefined);
  assert.equal(u.fq, undefined);
  assert.deepEqual(u.tackle, [{ id: 'tackle-float', uses: 20 }]);
  assert.equal(u.pots.length, 1);
  assert.deepEqual(u.legends, ['goldcarp']);
  assert.equal(hostile.angling.u['not-a-uid'], undefined);
  assert.deepEqual(hostile.angling.cup.e, {});
  assert.equal(hostile.angling.total, undefined);
});

// ------------------------------------------------------------ weekly cup and the ledger
test('weekly cup: best three per friend, results archived, top three claim prizes through the ledger', () => {
  const s = world(4);
  let at = T0;
  const week0 = Math.floor((kstDay(at) + 3) / 7);
  for (const m of s.members) for (let i = 0; i < 6; i++, at += 60_000) fishOnce(s, m, 'river', at);
  const standings = s.view(s.members[0], at).angling.cup.standings;
  assert.ok(standings.length >= 3);
  for (const row of standings) assert.ok(row.top.length <= 3);
  s.fails(s.members[0], { kind: 'cupClaim', week: week0 }, at, ANGLING_REJECT.cup);
  // Next week: last week's result shows in history (even before anyone acts).
  const next = findTime((t) => Math.floor((kstDay(t) + 3) / 7) === week0 + 1, at);
  const hist = s.view(s.members[0], next).angling.cup.history;
  assert.equal(hist.at(-1).week, week0);
  const ranks = hist.at(-1).ranks;
  assert.equal(ranks.length, 3);
  const winner = s.members.find((m) => m.actor === ranks[0].actor);
  const loser = s.members.find((m) => !ranks.some((r) => r.actor === m.actor));
  const before = s.ledger.accounts[`wallet-${winner.id}`];
  s.act(winner, { kind: 'cupClaim', week: week0 }, next);
  assert.equal(s.ledger.accounts[`wallet-${winner.id}`] - before, CUP_PRIZES[0]);
  s.fails(winner, { kind: 'cupClaim', week: week0 }, next + 1, ANGLING_REJECT.cupClaimed);
  if (loser) s.fails(loser, { kind: 'cupClaim', week: week0 }, next + 1, ANGLING_REJECT.cup);
  validateLedger(s.ledger);
  assert.equal(anglingHooks.tournamentResult(s.life, week0).ranks[0].actor, ranks[0].actor);
});
