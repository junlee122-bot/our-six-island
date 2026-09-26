import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATCH_UP,
  FIRST_TOOL_ROCKS,
  LEVEL_XP,
  NODE_SPOTS,
  PROFESSIONS,
  RESEARCH,
  RESEARCH_MIN_BEOM,
  RESPEC_PRICE,
  REST_MAX,
  SOFT_CAP,
  TOOL_COST,
  XP,
  fishXp,
  levelOf,
} from '../app/lounge-growth-data.ts';
import {
  GROWTH_REJECT,
  forgeReadyAt,
  gainXp,
  growthMods,
  nextSixAm,
  nodesFor,
  readGrowth,
  skillLevel,
  toolTier,
  toolUpgrade,
} from '../app/lounge-growth.ts';
import { FISH_BY_ID, ITEM_BY_ID, VILLAGE_FLAGS } from '../app/lounge-items.ts';
import { CROP_INFO, LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView, plotReadyAt, readLife } from '../app/lounge-life.ts';
import { INITIAL_BEOM, flowBucket, grantBeom, kstDay, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { reasonLabel } from '../app/lounge-economy-report.ts';
import { SPAWN_POINTS } from '../app/lounge-village-spots.ts';
import { villageCanWalk, VILLAGE_PATHS } from '../app/lounge-village-layout.ts';
import { KARCHIVE_FORGE } from '../app/lounge-village-karchive-layout.ts';

const HOUR = 3_600_000,
  DAY = 86_400_000;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
const T0 = kst(2026, 9, 24); // Thursday noon KST, autumn
const uuid = () => crypto.randomUUID();

function world(n = 3, rich = 0) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    if (rich) ledger = grantBeom(ledger, 'wallet-' + m.id, rich, 'test-' + m.id, T0, 'test');
    life = ensureLifeMember(life, m.id, m.actor);
  }
  const s = { members, ledger, life };
  s.act = (m, action, now) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    invariant(s.ledger);
    return r;
  };
  s.fails = (m, action, now, message) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.give = (m, item, k) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + k;
  };
  s.inv = (m, item) => s.life.ext?.[m.id]?.inv?.[item] ?? 0;
  s.xp = (m, skill) => s.life.growth?.u?.[m.id]?.xp?.[skill] ?? 0;
  s.g = (m, now) => lifeView(s.life, m.id, m.actor, now).growth;
  s.balance = (m) => s.ledger.accounts['wallet-' + m.id];
  return s;
}
function invariant(ledger) {
  validateLedger(ledger);
  const balances = Object.values(ledger.accounts).reduce((a, b) => a + b, 0);
  const reserved = Object.values(ledger.games)
    .filter((g) => g.state === 'reserved')
    .reduce((a, g) => a + g.deposits.reduce((x, y) => x + y, 0), 0);
  assert.equal(balances + reserved + (ledger.houseBalance ?? 0) - (ledger.granted ?? 0), Object.keys(ledger.accounts).length * INITIAL_BEOM);
}
/** Sets a skill's XP directly (and the day's counters to today). */
function setXp(s, m, skill, xp) {
  const g = (s.life.growth ??= {});
  const u = ((g.u ??= {})[m.id] ??= {});
  (u.xp ??= {})[skill] = xp;
  u.retro ??= 1;
}
/** Finishes the forge research directly (tests that need the blacksmith). */
function openForge(s, at = T0 - DAY) {
  ((s.life.growth ??= {}).r ??= {}).forge = { got: 150_000, mat: { wood: 120, stone: 100 }, by: { 0: 1, 1: 1, 2: 1 }, start: at - DAY, fullAt: at, doneAt: at };
}

// ------------------------------------------------------------ levels and XP
test('level curve: 10 levels, cumulative thresholds from the design', () => {
  assert.deepEqual([...LEVEL_XP], [0, 60, 160, 320, 560, 900, 1400, 2100, 3100, 4500]);
  assert.equal(levelOf(0), 1);
  assert.equal(levelOf(59.9), 1);
  assert.equal(levelOf(60), 2);
  assert.equal(levelOf(559), 4);
  assert.equal(levelOf(560), 5);
  assert.equal(levelOf(4499), 9);
  assert.equal(levelOf(4500), 10);
  assert.equal(levelOf(99_999), 10);
  assert.deepEqual([1, 5, 10, 20, 50].map(fishXp), [XP.fishLegend, XP.fishRare, XP.fishUncommon, XP.fishCommon, XP.fishCommon]);
});

test('farming gives XP for watering (1 per plot) and harvest by growth time and quality', () => {
  const s = world(1);
  const [m] = s.members;
  s.life.bag[m.id].seeds.strawberry = 6;
  s.act(m, { kind: 'plant', plot: -1, crop: 'strawberry' }, T0);
  s.act(m, { kind: 'water', plot: -1 }, T0 + 1000);
  assert.equal(s.xp(m, 'farm'), 6 * XP.water);
  const ready = Math.max(...s.life.farms[m.id].map((p) => plotReadyAt(p)));
  const view = lifeView(s.life, m.id, m.actor, ready);
  const expected = view.me.farm.reduce((sum, p) => sum + Math.round((2 + 8) * [1, 1.25, 1.5][p.quality] * 10) / 10, 6);
  s.act(m, { kind: 'harvest', plot: -1 }, ready);
  assert.ok(Math.abs(s.xp(m, 'farm') - expected) < 0.5, `${s.xp(m, 'farm')} vs ${expected}`);
  assert.equal(skillLevel(s.life, m.id, 'farm'), 2);
});

test('fishing XP by rarity, 1 XP for a miss; forage 5, bugs 4; cooking 6 and crafting 4', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'cast', spot: 'river' }, T0);
  let p = s.life.ext[m.id].pending;
  s.act(m, { kind: 'reel', token: p.token, timingMs: p.windowMs + 1 }, p.biteAt + 10);
  assert.equal(s.xp(m, 'fish'), XP.fishMiss);
  s.act(m, { kind: 'cast', spot: 'river' }, T0 + 60_000);
  p = s.life.ext[m.id].pending;
  const fish = p.fish;
  s.act(m, { kind: 'reel', token: p.token, timingMs: 10 }, p.biteAt + 10);
  assert.equal(s.xp(m, 'fish'), XP.fishMiss + fishXp(FISH_BY_ID[fish].weight));
  s.give(m, 'mushroom', 0);
  const spot = lifeView(s.life, m.id, m.actor, T0 + 2 * 60_000).me.spawns.find((x) => x.kind === 'forage');
  if (spot) {
    s.act(m, { kind: 'forage', spot: spot.spot }, T0 + 2 * 60_000);
    assert.equal(s.xp(m, 'forage'), XP.forage);
  }
  s.give(m, 'wood', 10);
  s.give(m, 'pinecone', 5);
  s.act(m, { kind: 'craft', recipe: 'fertilizer', n: 2 }, T0 + HOUR);
  assert.equal(s.xp(m, 'craft'), 2 * XP.craft);
});

test('daily soft cap: 200 in full, then 20%; resets at KST midnight', () => {
  const s = world(1);
  const [m] = s.members;
  setXp(s, m, 'fish', 0);
  gainXp(s.life, m.id, 'fish', 150, T0);
  gainXp(s.life, m.id, 'fish', 150, T0 + 1000);
  // 150 + 50 + 100 × 0.2
  assert.equal(s.xp(m, 'fish'), 150 + 50 + 20);
  gainXp(s.life, m.id, 'fish', 100, T0 + DAY);
  assert.equal(s.xp(m, 'fish'), 320);
  assert.equal(SOFT_CAP, 200);
});

test('rested XP: 100 per skill per day away (max 300) doubles XP until spent', () => {
  const s = world(1);
  const [m] = s.members;
  s.act(m, { kind: 'status', text: '안녕' }, T0);
  // Five days away: rest capped at 300.
  const back = T0 + 5 * DAY;
  s.act(m, { kind: 'status', text: '돌아왔어요' }, back + 5000);
  assert.equal(s.life.growth.u[m.id].rest.farm, REST_MAX);
  gainXp(s.life, m.id, 'farm', 100, back + 6000);
  assert.equal(s.xp(m, 'farm'), 200);
  assert.equal(s.life.growth.u[m.id].rest.farm, 200);
  // A day away after one day of play: only 100.
  const t = world(1);
  const [n] = t.members;
  t.act(n, { kind: 'status', text: 'a' }, T0);
  t.act(n, { kind: 'status', text: 'b' }, T0 + 2 * DAY);
  assert.equal(t.life.growth.u[n.id].rest.fish, 100);
});

test('catch-up: ×1.5 XP while below the village median level of that skill', () => {
  const s = world(3);
  const [a, b, c] = s.members;
  setXp(s, a, 'fish', LEVEL_XP[5]);
  setXp(s, b, 'fish', LEVEL_XP[5]);
  setXp(s, c, 'fish', 0);
  gainXp(s.life, c.id, 'fish', 10, T0);
  assert.equal(s.xp(c, 'fish'), 10 * CATCH_UP);
  gainXp(s.life, a.id, 'fish', 10, T0);
  assert.equal(s.xp(a, 'fish'), LEVEL_XP[5] + 10);
  assert.equal(s.g(c, T0).skills.find((k) => k.id === 'fish').behind, true);
});

test('retro XP from lifetime stats on first touch, capped at Lv5, never lowers XP', () => {
  const s = world(1);
  const [m] = s.members;
  (s.life.ext ??= {})[m.id] = { stats: { harvest: 1000, fish: 20, forage: 10, bug: 5, cook: 3, craft: 1 } };
  s.act(m, { kind: 'status', text: '처음' }, T0);
  const u = s.life.growth.u[m.id];
  assert.equal(u.xp.farm, LEVEL_XP[4]);
  assert.equal(u.xp.fish, 80);
  assert.equal(u.xp.forage, 70);
  assert.equal(u.xp.craft, 22);
  assert.equal(u.xp.mine, undefined);
  assert.ok(u.retro > 0);
  // Applied once: more stats later do not add again.
  s.life.ext[m.id].stats.fish = 999;
  s.act(m, { kind: 'status', text: '또' }, T0 + 10_000);
  assert.equal(s.xp(m, 'fish'), 80);
  // Levels reached by retro give a pick at Lv5 but no banner.
  const view = s.g(m, T0 + 20_000);
  assert.deepEqual(view.skills.find((k) => k.id === 'farm').choice, ['farm-a', 'farm-b']);
  assert.equal(view.ups.length, 0);
});

test('level-ups are recorded once (news + banner list) and bounded', () => {
  const s = world(1);
  const [m] = s.members;
  setXp(s, m, 'craft', 55);
  gainXp(s.life, m.id, 'craft', 10, T0);
  const ups = s.life.growth.u[m.id].ups;
  assert.deepEqual(ups.map((u) => [u.s, u.lv]), [['craft', 2]]);
  assert.ok(s.life.news.at(-1).lines.some((l) => l.kind === 'growth' && l.text.includes('Lv2')));
  // Many level-ups at once stay bounded (8), and old ones fade after 3 days.
  for (const skill of ['farm', 'fish', 'forage', 'mine']) for (let i = 0; i < 10; i++) gainXp(s.life, m.id, skill, 200, T0 + i);
  assert.equal(s.life.growth.u[m.id].ups.length, 8);
  gainXp(s.life, m.id, 'craft', 1, T0 + 4 * DAY);
  assert.equal(s.life.growth.u[m.id].ups, undefined);
});

// ------------------------------------------------------------ professions
test('professions: Lv5 pick, Lv10 pick under it, effects applied, respec for 50,000범', () => {
  const s = world(1, 200_000);
  const [m] = s.members;
  s.fails(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-a' }, T0, GROWTH_REJECT.profLevel);
  setXp(s, m, 'farm', LEVEL_XP[4]);
  s.fails(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-a1' }, T0, GROWTH_REJECT.profLevel);
  s.fails(m, { kind: 'chooseProf', skill: 'fish', prof: 'farm-a' }, T0, GROWTH_REJECT.prof);
  s.act(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-a' }, T0);
  s.fails(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-b' }, T0, GROWTH_REJECT.profTaken);
  assert.equal(growthMods(s.life, m.id).growSpeed, 10);
  // New plantings grow 10% faster.
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, T0 + 1000);
  assert.equal(s.life.farms[m.id][0].speed, 10);
  setXp(s, m, 'farm', LEVEL_XP[9]);
  s.fails(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-b1' }, T0 + 2000, GROWTH_REJECT.profParent);
  s.act(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-a2' }, T0 + 2000);
  assert.equal(growthMods(s.life, m.id).offSeason, true);
  // 온실지기: a summer crop in autumn on my own farm.
  s.life.bag[m.id].seeds.watermelon = 1;
  s.act(m, { kind: 'plant', plot: 1, crop: 'watermelon' }, T0 + 3000);
  const before = s.balance(m);
  s.act(m, { kind: 'respec', skill: 'farm' }, T0 + 4000);
  assert.equal(before - s.balance(m), RESPEC_PRICE);
  assert.equal(s.life.growth.u[m.id].prof, undefined);
  assert.equal(s.ledger.entries.at(-1).reason, 'respec');
  s.fails(m, { kind: 'respec', skill: 'farm' }, T0 + 5000, GROWTH_REJECT.noProf);
  // Picks again after the respec.
  s.act(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-b' }, T0 + 6000);
  assert.equal(growthMods(s.life, m.id).cropSell, 0.1);
});

test('profession effects: crop sell bonus, bite window, forage double, craft discount, copper', () => {
  const s = world(1, 100_000);
  const [m] = s.members;
  setXp(s, m, 'farm', LEVEL_XP[4]);
  setXp(s, m, 'fish', LEVEL_XP[4]);
  setXp(s, m, 'craft', LEVEL_XP[4]);
  s.act(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-b' }, T0);
  s.act(m, { kind: 'chooseProf', skill: 'fish', prof: 'fish-a' }, T0);
  s.act(m, { kind: 'chooseProf', skill: 'craft', prof: 'craft-b' }, T0);
  s.life.bag[m.id].produce.pumpkin = 1;
  const b0 = s.balance(m);
  s.act(m, { kind: 'sell', crop: 'pumpkin', n: 1 }, T0 + 1000);
  assert.equal(s.balance(m) - b0, Math.round(CROP_INFO.pumpkin.sell * 1.1));
  s.act(m, { kind: 'cast', spot: 'river' }, T0 + 2000);
  const p = s.life.ext[m.id].pending;
  // 어부 (+15%) and 낚시 Lv4 (+5%): ×1.2 on the rod-1 window.
  assert.equal(p.windowMs, Math.round(FISH_BY_ID[p.fish].windowMs * 1 * 1.2));
  // 공예가 (−25%) + 솜씨 Lv3 (−10%): a 3-wood bench-like input 3 → 2.
  const mods = growthMods(s.life, m.id);
  assert.ok(Math.abs(mods.craftDiscount - 0.35) < 1e-9);
  assert.ok(Math.abs(mods.biteWindow - 0.2) < 1e-9);
});

// ------------------------------------------------------------ research
test('research: 범 and materials, three helpers (reserved share), finishes at the next 06:00 KST', () => {
  const s = world(3, 500_000);
  const [a, b, c] = s.members;
  for (const m of s.members) {
    s.give(m, 'wood', 60);
    s.give(m, 'stone', 60);
  }
  s.fails(a, { kind: 'research', project: 'trail', beom: 10_000 }, T0, GROWTH_REJECT.projectSoon);
  s.fails(a, { kind: 'research', project: 'forge', item: 'shell', n: 1 }, T0, GROWTH_REJECT.giveItem);
  s.fails(a, { kind: 'research', project: 'forge', beom: 500 }, T0, GROWTH_REJECT.give);
  s.act(a, { kind: 'research', project: 'forge', beom: 200_000 }, T0);
  // Two helpers are still missing: 2 × 1,000범 stay reserved for them.
  assert.equal(s.life.growth.r.forge.got, 150_000 - 2 * RESEARCH_MIN_BEOM);
  s.act(a, { kind: 'research', project: 'forge', item: 'wood', n: 60 }, T0 + 1);
  s.act(b, { kind: 'research', project: 'forge', item: 'wood', n: 60 }, T0 + 2);
  s.act(b, { kind: 'research', project: 'forge', item: 'stone', n: 60 }, T0 + 3);
  s.act(a, { kind: 'research', project: 'forge', item: 'stone', n: 60 }, T0 + 4);
  assert.equal(s.life.growth.r.forge.mat.stone, 100);
  s.fails(a, { kind: 'research', project: 'forge', item: 'stone', n: 1 }, T0 + 5, GROWTH_REJECT.slotFull);
  // Now one helper is missing: a and b may give all but the last 1,000범.
  s.act(a, { kind: 'research', project: 'forge', beom: 5_000 }, T0 + 5);
  assert.equal(s.life.growth.r.forge.got, 149_000);
  s.fails(a, { kind: 'research', project: 'forge', beom: 1_000 }, T0 + 6, GROWTH_REJECT.reserved);
  assert.equal(s.g(a, T0 + 6).research[0].missing, 1);
  const bal = s.balance(c);
  s.act(c, { kind: 'research', project: 'forge', beom: 5_000 }, T0 + 7);
  assert.equal(bal - s.balance(c), 1_000);
  const st = s.life.growth.r.forge;
  assert.equal(st.got, 150_000);
  assert.equal(st.doneAt, nextSixAm(T0 + 7));
  assert.equal(st.doneAt, kst(2026, 9, 25, 6));
  s.fails(c, { kind: 'research', project: 'forge', beom: 1_000 }, T0 + 8, GROWTH_REJECT.projectFull);
  // Not open before 06:00; the view shows it done after (flags settle for views too).
  assert.equal(s.g(a, kst(2026, 9, 25, 5, 59)).forgeOpen, false);
  const v = lifeView(s.life, a.id, a.actor, kst(2026, 9, 25, 6));
  assert.equal(v.growth.forgeOpen, true);
  assert.ok(v.flags.includes('forge'));
  assert.ok(!s.life.flags?.includes('forge'), 'views do not write');
  // The next action settles: flag, plaques for all three helpers, one memory.
  s.act(b, { kind: 'status', text: '대장간!' }, kst(2026, 9, 25, 7));
  assert.ok(s.life.flags.includes('forge'));
  for (const m of s.members) assert.equal(s.life.ext[m.id].furn['furn-project-plaque'], 1);
  s.act(c, { kind: 'status', text: '또' }, kst(2026, 9, 25, 8));
  for (const m of s.members) assert.equal(s.life.ext[m.id].furn['furn-project-plaque'], 1);
  assert.equal(s.life.memories.filter((mm) => mm.kind === 'area').length, 1);
  assert.equal(s.ledger.entries.filter((e) => e.reason === 'research').reduce((x, e) => x + e.amount, 0), 150_000);
  // V2 opens its prerequisite but stays 준비 중 in P1.
  const v2 = lifeView(s.life, a.id, a.actor, kst(2026, 9, 25, 9)).growth.research.find((r) => r.id === 'trail');
  assert.equal(v2.open, false);
});

test('research: the three-helper rule relaxes after seven days', () => {
  const s = world(1, 500_000);
  const [a] = s.members;
  s.give(a, 'wood', 120);
  s.give(a, 'stone', 100);
  s.act(a, { kind: 'research', project: 'forge', item: 'wood', n: 120 }, T0);
  s.act(a, { kind: 'research', project: 'forge', item: 'stone', n: 100 }, T0 + 1);
  s.act(a, { kind: 'research', project: 'forge', beom: 150_000 }, T0 + 2);
  assert.equal(s.life.growth.r.forge.got, 148_000);
  s.fails(a, { kind: 'research', project: 'forge', beom: 2_000 }, T0 + 6 * DAY, GROWTH_REJECT.reserved);
  s.act(a, { kind: 'research', project: 'forge', beom: 2_000 }, T0 + 7 * DAY);
  assert.ok(s.life.growth.r.forge.doneAt > T0 + 7 * DAY);
});

// ------------------------------------------------------------ blacksmith
test('blacksmith: closed before 대장간 재건; drop off → pickup at 06:00 KST next day; old tier meanwhile', () => {
  const s = world(2, 100_000);
  const [m] = s.members;
  s.give(m, 'copper', 20);
  s.fails(m, { kind: 'forge', tool: 'pickaxe' }, T0, GROWTH_REJECT.forgeClosed);
  openForge(s);
  s.fails(m, { kind: 'forge', tool: 'rod' }, T0, GROWTH_REJECT.rodShop);
  s.fails(m, { kind: 'forge', tool: 'spade' }, T0, GROWTH_REJECT.tool);
  const b0 = s.balance(m);
  s.act(m, { kind: 'forge', tool: 'can' }, T0);
  assert.equal(b0 - s.balance(m), TOOL_COST[2].beom);
  assert.equal(s.inv(m, 'copper'), 12);
  assert.equal(s.ledger.entries.at(-1).reason, 'tool-can-2');
  assert.equal(flowBucket('spend', 'tool-can-2'), 'tool');
  assert.equal(reasonLabel('tool-pickaxe-2'), '대장간: 곡괭이 2단계');
  s.fails(m, { kind: 'forge', tool: 'hoe' }, T0 + 1, GROWTH_REJECT.forgeBusy);
  // Still the old can until picked up.
  assert.equal(toolTier(s.life, m.id, 'can'), 1);
  assert.equal(s.life.growth.u[m.id].forge.readyAt, forgeReadyAt(T0));
  assert.equal(forgeReadyAt(T0), kst(2026, 9, 25, 6));
  assert.equal(forgeReadyAt(kst(2026, 9, 25, 2)), kst(2026, 9, 26, 6));
  s.fails(m, { kind: 'forgePickup' }, kst(2026, 9, 25, 5, 59), GROWTH_REJECT.forgeWait);
  s.act(m, { kind: 'forgePickup' }, kst(2026, 9, 25, 6));
  assert.equal(toolTier(s.life, m.id, 'can'), 2);
  s.fails(m, { kind: 'forgePickup' }, kst(2026, 9, 25, 7), GROWTH_REJECT.forgeNone);
  // Tier 2 can: watering takes 45% off the rest (plot.w = 5).
  s.act(m, { kind: 'plant', plot: 0, crop: 'tomato' }, kst(2026, 9, 25, 8));
  s.act(m, { kind: 'water', plot: 0 }, kst(2026, 9, 25, 8));
  const plot = s.life.farms[m.id][0];
  assert.equal(plot.w, 5);
  assert.equal(plotReadyAt(plot) - plot.plantedAt, Math.ceil(HOUR * (1 - 0.4 - 0.05)));
  // Tier 3 needs iron (the mine is a later region).
  const up = toolUpgrade(s.life, m.id, 'can', kst(2026, 9, 25, 9));
  assert.deepEqual(up.mats, { iron: 8, copper: 4 });
  s.fails(m, { kind: 'forge', tool: 'can' }, kst(2026, 9, 25, 9), GROWTH_REJECT.materials);
});

test('blacksmith: hoe tier adds gold chance to new plantings; senior discount halves cost', () => {
  const s = world(2, 100_000);
  const [m, n] = s.members;
  openForge(s);
  ((s.life.growth.u ??= {})[m.id] ??= {}).tools = { hoe: 2 };
  s.act(m, { kind: 'plant', plot: 0, crop: 'carrot' }, T0);
  assert.equal(s.life.farms[m.id][0].g, 3);
  // A friend with a gold (4) hoe: tier 1 → 2 costs half.
  s.life.growth.u[m.id].tools.hoe = 4;
  const up = toolUpgrade(s.life, n.id, 'hoe', T0);
  assert.equal(up.senior, true);
  assert.equal(up.beom, TOOL_COST[2].beom / 2);
  assert.deepEqual(up.mats, { copper: 4 });
});

// ------------------------------------------------------------ material nodes
test('material nodes: a daily set on walkable ground off the paths; chop/smash once per day each', () => {
  for (const n of NODE_SPOTS) {
    assert.ok(villageCanWalk({ x: n.x, z: n.z }), n.id);
    for (const [x0, z0, x1, z1, w] of VILLAGE_PATHS) {
      const dx = x1 - x0,
        dz = z1 - z0,
        t = Math.max(0, Math.min(1, ((n.x - x0) * dx + (n.z - z0) * dz) / (dx * dx + dz * dz || 1)));
      assert.ok(Math.hypot(n.x - (x0 + t * dx), n.z - (z0 + t * dz)) - w / 2 >= 0.9, `${n.id} on a path`);
    }
    for (const p of Object.values(SPAWN_POINTS)) assert.ok(Math.hypot(p.x - n.x, p.z - n.z) > 1.3, `${n.id} near a spawn`);
    assert.ok(Math.hypot(KARCHIVE_FORGE.x - n.x, KARCHIVE_FORGE.z - n.z) > 4, `${n.id} near the forge`);
  }
  const s = world(1);
  const [m] = s.members;
  const today = nodesFor(s.life, m.id, kstDay(T0));
  assert.deepEqual(today.map((n) => n.id), nodesFor(s.life, m.id, kstDay(T0)).map((n) => n.id));
  assert.equal(today.filter((n) => n.kind === 'rock').length, 3);
  assert.equal(today.filter((n) => n.kind === 'bush').length, 2);
  assert.equal(today.filter((n) => n.kind === 'log').length, 1);
  const rock = today.find((n) => n.kind === 'rock'),
    bush = today.find((n) => n.kind === 'bush'),
    log = today.find((n) => n.kind === 'log');
  const other = NODE_SPOTS.find((n) => n.kind === 'rock' && !today.some((t) => t.id === n.id));
  s.fails(m, { kind: 'smash', node: other.id }, T0, GROWTH_REJECT.node);
  s.fails(m, { kind: 'chop', node: rock.id }, T0, GROWTH_REJECT.node);
  s.act(m, { kind: 'smash', node: rock.id }, T0);
  assert.equal(s.inv(m, 'stone'), 2);
  assert.ok(s.xp(m, 'mine') >= XP.rock);
  s.fails(m, { kind: 'smash', node: rock.id }, T0 + 1, GROWTH_REJECT.nodeTaken);
  s.act(m, { kind: 'chop', node: bush.id }, T0 + 2);
  s.act(m, { kind: 'chop', node: log.id }, T0 + 3);
  assert.equal(s.inv(m, 'wood'), 5);
  assert.equal(s.xp(m, 'forage'), XP.bush + XP.log);
  const view = s.g(m, T0 + 4);
  assert.equal(view.nodes.filter((n) => n.taken).length, 3);
  // A new day: fresh nodes (taken list resets).
  assert.equal(s.g(m, T0 + DAY).nodes.filter((n) => n.taken).length, 0);
});

test('village rocks give copper about 20% of the time (1–2), plus profession/perk extras', () => {
  const s = world(1);
  const [m] = s.members;
  let copper = 0,
    rocks = 0;
  for (let d = 0; d < 200; d++) {
    const t = T0 + d * DAY;
    for (const n of nodesFor(s.life, m.id, kstDay(t)).filter((x) => x.kind === 'rock')) {
      const before = s.inv(m, 'copper');
      s.act(m, { kind: 'smash', node: n.id }, t + rocks);
      if (s.inv(m, 'copper') > before) copper++;
      rocks++;
    }
  }
  // Mining XP from rocks raises copper odds a little (Lv3/Lv8 perks), and the
  // first 3 rocks a day can include extra rocks from the Lv4 perk.
  const share = copper / rocks;
  assert.ok(share > 0.17 && share < 0.33, `copper share ${share}`);
  assert.ok(s.life.growth.u[m.id].rocks === rocks);
});

test('first-tool gift: after 10 village rocks and the forge, a free copper pickaxe once', () => {
  const s = world(1);
  const [m] = s.members;
  s.fails(m, { kind: 'forgeGift' }, T0, GROWTH_REJECT.gift);
  ((s.life.growth ??= {}).u ??= {})[m.id] = { rocks: FIRST_TOOL_ROCKS, retro: 1 };
  s.fails(m, { kind: 'forgeGift' }, T0, GROWTH_REJECT.gift);
  openForge(s);
  assert.equal(s.g(m, T0).gift.available, true);
  s.act(m, { kind: 'forgeGift' }, T0);
  assert.equal(toolTier(s.life, m.id, 'pickaxe'), 2);
  s.fails(m, { kind: 'forgeGift' }, T0 + 1, GROWTH_REJECT.gifted);
});

// ------------------------------------------------------------ data model
test('migration: older worlds read without growth; hostile growth data is bounded', () => {
  const old = readLife({ farms: {}, bag: {}, seq: 3 });
  assert.equal(old.growth, undefined);
  assert.deepEqual(readGrowth(undefined), {});
  const id = uuid();
  const hostile = readLife({
    actors: { [id]: 1 },
    growth: {
      u: {
        [id]: {
          xp: { farm: 1e12, fish: -5, nope: 3 },
          prof: ['farm-a1', 'farm-a', 'farm-b', 'fish-a', 'x'],
          tools: { can: 9, hoe: 3, rod: 'x' },
          forge: { tool: 'axe', to: 7, at: 1, readyAt: 2 },
          nodes: ['r1', 'zz', 'r1'],
          day: 20000,
          ups: Array.from({ length: 50 }, () => ({ s: 'farm', lv: 3, at: 5 })),
        },
        'not-a-uuid': { xp: { farm: 5 } },
      },
      r: { forge: { got: 9e9, mat: { wood: 999, gold: 5 }, by: { 0: 1, 9: 2 }, start: 5 }, bogus: { got: 1, start: 1 } },
    },
  });
  const u = hostile.growth.u[id];
  assert.equal(u.xp.farm, 1_000_000);
  assert.equal(u.xp.fish, undefined);
  assert.deepEqual(u.prof, ['farm-a', 'fish-a']);
  assert.deepEqual(u.tools, { hoe: 3 });
  assert.equal(u.forge, undefined);
  assert.deepEqual(u.nodes, ['r1']);
  assert.equal(u.ups.length, 8);
  assert.equal(Object.keys(hostile.growth.u).length, 1);
  assert.deepEqual(hostile.growth.r.forge, { got: 150_000, mat: { wood: 120 }, by: { 0: 1 }, start: 5 });
  assert.equal(hostile.growth.r.bogus, undefined);
  // Round trip keeps everything.
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(hostile))).growth, hostile.growth);
});

test('size: seven friends with every growth field filled stay small', () => {
  const s = world(7, 0);
  const g = (s.life.growth = { u: {}, r: {} });
  for (const m of s.members)
    g.u[m.id] = {
      xp: { farm: 4500, fish: 4500, forage: 4500, mine: 4500, craft: 4500 },
      dxp: { farm: 999, fish: 999, forage: 999, mine: 999, craft: 999 },
      day: 20000,
      nodes: NODE_SPOTS.map((n) => n.id),
      rest: { farm: 300, fish: 300, forage: 300, mine: 300, craft: 300 },
      seen: 20000,
      retro: T0,
      prof: ['farm-a', 'farm-a1', 'fish-b', 'fish-b2', 'forage-a', 'forage-a2', 'mine-b', 'mine-b1', 'craft-a', 'craft-a2'],
      tools: { can: 5, hoe: 5, rod: 5, axe: 5, pickaxe: 5 },
      forge: { tool: 'axe', to: 5, at: T0, readyAt: T0 },
      rocks: 999_999,
      gift: true,
      ups: Array.from({ length: 8 }, (_, i) => ({ s: 'farm', lv: i + 2, at: T0 })),
    };
  for (const def of RESEARCH) g.r[def.id] = { got: def.beom, mat: { ...def.mats }, by: { 0: 99, 1: 99, 2: 99, 3: 99, 4: 99, 5: 99, 6: 99 }, start: T0, fullAt: T0, doneAt: T0 };
  const size = JSON.stringify(readLife(JSON.parse(JSON.stringify(s.life))).growth).length;
  assert.ok(size < 12_000, `growth ${size} bytes`);
});

test('catalog: ore items, research flags, professions and every research material exist', () => {
  for (const id of ['copper', 'iron', 'gold', 'gem']) assert.equal(ITEM_BY_ID[id].kind, 'material');
  for (const def of RESEARCH) {
    assert.ok(VILLAGE_FLAGS[def.flag], def.flag);
    for (const id of Object.keys(def.mats)) assert.ok(ITEM_BY_ID[id], id);
  }
  for (const t of Object.values(TOOL_COST)) for (const id of Object.keys(t.mats)) assert.ok(ITEM_BY_ID[id], id);
  for (const skill of ['farm', 'fish', 'forage', 'mine', 'craft']) {
    const five = PROFESSIONS.filter((p) => p.skill === skill && p.level === 5);
    assert.equal(five.length, 2);
    for (const p of five) assert.equal(PROFESSIONS.filter((q) => q.parent === p.id).length, 2);
  }
  assert.equal(RESEARCH.filter((r) => r.live).map((r) => r.id).join(), 'forge');
});
