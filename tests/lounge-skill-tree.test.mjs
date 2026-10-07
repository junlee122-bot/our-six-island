// 기술 트리 (handover/design/design-skill-tree.md S1·S2 + §6 목축): talent
// points, prerequisites, branch gating, locked (우리 농장) talents, 운명 다시
// 보기 (price doubling through the ledger), 목축 XP and older saves.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_XP, PROFESSIONS, PROF_BY_ID, SKILLS, SOFT_CAP, XP, NO_MODS, LEVEL_PERKS } from '../app/lounge-growth-data.ts';
import { FARM_LOCK, RESPEC_BASE, TALENTS, TALENT_BY_ID, respecPrice, talentPoints, talentsOf } from '../app/lounge-growth-talents.ts';
import { GROWTH_REJECT, forgeReadyAt, giftMult, growthMods, readGrowth, respecCost, talentBlock, talentsLeft } from '../app/lounge-growth.ts';
import { LifeError, emptyLife, ensureLifeMember, lifeAction, lifeView, readLife } from '../app/lounge-life.ts';
import { INITIAL_BEOM, grantBeom, newLoungeLedger, registerWallet, validateLedger } from '../app/lounge-economy.ts';
import { DEMAND_SOFT_STEP, demandHalfLife, demandMult, demandSoft, sellBonus } from '../app/lounge-life-plus.ts';
import { mineStops } from '../app/lounge-mine.ts';
import { ANIMALS, HAY_PRICE } from '../app/lounge-stage3-data.ts';
import { GAME_HOUR_MS, gameDayStart, gameDay } from '../app/lounge-calendar.ts';
import { tillField } from './farm-test-help.mjs';

const DAY = 86_400_000;
const kst = (y, m, d, h = 12, min = 0) => Date.UTC(y, m - 1, d, h - 9, min);
const T0 = kst(2026, 9, 24); // Thursday noon KST
const uuid = () => crypto.randomUUID();

function world(n = 1, rich = 0) {
  const members = Array.from({ length: n }, (_, actor) => ({ id: uuid(), actor }));
  let ledger = newLoungeLedger(),
    life = emptyLife();
  for (const m of members) {
    ledger = registerWallet(ledger, 'wallet-' + m.id);
    if (rich) ledger = grantBeom(ledger, 'wallet-' + m.id, rich, 'test-' + m.id, T0, 'test');
    life = ensureLifeMember(life, m.id, m.actor);
    // 우리 농장 F2: fields start as grass; these tests start from a tilled field.
    tillField(life, m.id);
  }
  life.flags = ['district-ranch', 'district-foothill'];
  const s = { members, ledger, life };
  s.act = (m, action, now = T0) => {
    const r = lifeAction(s.life, s.ledger, m, action, now);
    s.life = r.life;
    s.ledger = r.ledger;
    invariant(s.ledger);
    return r;
  };
  s.fails = (m, action, message, now = T0) =>
    assert.throws(
      () => lifeAction(s.life, s.ledger, m, action, now),
      (e) => e instanceof LifeError && (!message || e.message === message),
    );
  s.give = (m, item, k) => {
    const x = ((s.life.ext ??= {})[m.id] ??= {});
    (x.inv ??= {})[item] = (x.inv[item] ?? 0) + k;
  };
  s.user = (m) => s.life.growth?.u?.[m.id] ?? {};
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
function setLevel(s, m, skill, level) {
  const u = (((s.life.growth ??= {}).u ??= {})[m.id] ??= {});
  (u.xp ??= {})[skill] = LEVEL_XP[level - 1];
  u.retro ??= 1;
}
const pick = (s, m, skill, talent, now) => s.act(m, { kind: 'pickTalent', skill, talent }, now);

// ------------------------------------------------------------ data
test('every skill has a tree: 8 talents (4 shared Lv2/4, 2+2 under the Lv5 picks at Lv6/8; 낚시 2+3 since F5), 6 professions', () => {
  assert.deepEqual([...SKILLS], ['farm', 'fish', 'forage', 'mine', 'craft', 'ranch']);
  assert.equal(TALENTS.length, 50);
  for (const skill of SKILLS) {
    const tal = talentsOf(skill);
    // 우리 농장 F5: 낚시 has a second Lv8 pick under each 갈래 (양식장 지기 · 알 받기).
    const pond = skill === 'fish';
    assert.equal(tal.length, pond ? 10 : 8, skill);
    const shared = tal.filter((t) => !t.branch);
    assert.equal(shared.length, 4);
    assert.deepEqual(shared.map((t) => t.level).sort((a, b) => a - b), [2, 2, 4, 4]);
    const five = PROFESSIONS.filter((p) => p.skill === skill && p.level === 5);
    assert.equal(five.length, 2);
    for (const p of five) {
      const branch = tal.filter((t) => t.branch === p.id);
      assert.deepEqual(branch.map((t) => t.level), pond ? [6, 8, 8] : [6, 8], `${p.id} branch`);
      for (const t of branch.slice(1)) assert.equal(t.after, branch[0].id);
    }
    // Talent points stay five (Lv2·4·6·8·10): with six or seven talents in reach, at least one is left out.
    const reach = shared.length + tal.filter((t) => t.branch === five[0].id).length;
    assert.ok(reach > talentPoints(10), skill);
    for (const t of tal) if (t.after) assert.equal(TALENT_BY_ID[t.after].skill, skill);
    assert.equal(LEVEL_PERKS[skill].length, 9);
  }
  // ⓕ talents show locked until 우리 농장.
  const farmOnly = TALENTS.filter((t) => t.farm).map((t) => t.id);
  assert.deepEqual(farmOnly, ['farm-t2', 'farm-t3', 'forage-b-t2', 'craft-t4']);
  for (const id of farmOnly) assert.equal(TALENT_BY_ID[id].lock, FARM_LOCK);
  // Every talent that can be taken changes something.
  for (const t of TALENTS) if (!t.lock) assert.ok(t.mods && Object.keys(t.mods).length, t.id);
  for (const t of TALENTS) for (const k of Object.keys(t.mods ?? {})) assert.ok(k in NO_MODS, `${t.id} ${k}`);
  assert.deepEqual(TALENT_BY_ID['fish-a-t3'].mods, { pondCap: 2 });
  assert.deepEqual(TALENT_BY_ID['fish-b-t3'].mods, { pondRoe: 20 });
});

test('talent points: one at Lv2·4·6·8·10, at most 5; free = floor(level/2) − taken', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(talentPoints), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5]);
  assert.equal(talentPoints(99), 5);
  const s = world(1);
  const [m] = s.members;
  assert.equal(talentsLeft(s.life, m.id, 'fish'), 0);
  s.fails(m, { kind: 'pickTalent', skill: 'fish', talent: 'fish-t1' }, GROWTH_REJECT.talentLevel);
  setLevel(s, m, 'fish', 3);
  assert.equal(talentsLeft(s.life, m.id, 'fish'), 1);
  pick(s, m, 'fish', 'fish-t1');
  assert.equal(talentsLeft(s.life, m.id, 'fish'), 0);
  s.fails(m, { kind: 'pickTalent', skill: 'fish', talent: 'fish-t2' }, GROWTH_REJECT.talentPoints);
  s.fails(m, { kind: 'pickTalent', skill: 'fish', talent: 'fish-t1' }, GROWTH_REJECT.talentTaken);
  s.fails(m, { kind: 'pickTalent', skill: 'farm', talent: 'fish-t2' }, GROWTH_REJECT.talent);
  s.fails(m, { kind: 'pickTalent', skill: 'fish', talent: 'nope' }, GROWTH_REJECT.talent);
  const v = lifeView(s.life, m.id, m.actor, T0).growth.skills.find((k) => k.id === 'fish');
  assert.deepEqual(v.tal, ['fish-t1']);
  assert.equal(v.points, 1);
  assert.equal(v.left, 0);
  // Lv10: five points for six reachable talents — one is left out.
  setLevel(s, m, 'fish', 10);
  s.act(m, { kind: 'chooseProf', skill: 'fish', prof: 'fish-a' });
  for (const t of ['fish-t2', 'fish-t3', 'fish-t4', 'fish-a-t1']) pick(s, m, 'fish', t);
  assert.equal(talentsLeft(s.life, m.id, 'fish'), 0);
  s.fails(m, { kind: 'pickTalent', skill: 'fish', talent: 'fish-a-t2' }, GROWTH_REJECT.talentPoints);
  // The talents' effects add up with the rest.
  const mods = growthMods(s.life, m.id);
  assert.equal(mods.reelEase, 0.1);
  // 낚시 Lv3 통발 손질 (+10%) and 재능 통발 장인 (+20%).
  assert.equal(mods.trapExtra, 0.1 + 0.2);
  assert.equal(mods.nightRare, 0.15);
  assert.equal(mods.treasure, 0.5);
  assert.equal(mods.bigFish, 0.1);
  assert.equal(mods.biteWindow, 0.05 + 0.05 + 0.15);
});

test('prerequisites (먼저) and branches (갈래): Lv4 after its head, branch talents after the Lv5 pick at Lv6', () => {
  const s = world(1);
  const [m] = s.members;
  setLevel(s, m, 'mine', 4);
  s.fails(m, { kind: 'pickTalent', skill: 'mine', talent: 'mine-t3' }, GROWTH_REJECT.talentAfter);
  pick(s, m, 'mine', 'mine-t1');
  pick(s, m, 'mine', 'mine-t3');
  setLevel(s, m, 'mine', 6);
  s.fails(m, { kind: 'pickTalent', skill: 'mine', talent: 'mine-a-t1' }, GROWTH_REJECT.talentBranch);
  s.act(m, { kind: 'chooseProf', skill: 'mine', prof: 'mine-a' });
  pick(s, m, 'mine', 'mine-a-t1');
  assert.equal(growthMods(s.life, m.id).copperPts, 3 + 5);
  s.fails(m, { kind: 'pickTalent', skill: 'mine', talent: 'mine-a-t2' }, GROWTH_REJECT.talentLevel);
  setLevel(s, m, 'mine', 8);
  // The other 갈래 stays closed.
  s.fails(m, { kind: 'pickTalent', skill: 'mine', talent: 'mine-b-t2' }, GROWTH_REJECT.talentBranch);
  pick(s, m, 'mine', 'mine-a-t2');
  // 용광로: a tool left before 18:00 is ready the same evening.
  assert.equal(growthMods(s.life, m.id).forgeFast, true);
  assert.equal(forgeReadyAt(T0, true), kst(2026, 9, 24, 18));
  assert.equal(forgeReadyAt(kst(2026, 9, 24, 19), true), kst(2026, 9, 25, 6));
  // A locked predecessor does not hold its successor back (광석 지도 → 깊은 숨).
  const b = world(1);
  const [n] = b.members;
  setLevel(b, n, 'mine', 8);
  b.act(n, { kind: 'chooseProf', skill: 'mine', prof: 'mine-b' });
  b.fails(n, { kind: 'pickTalent', skill: 'mine', talent: 'mine-b-t1' }, TALENT_BY_ID['mine-b-t1'].lock);
  pick(b, n, 'mine', 'mine-b-t2');
  assert.equal(growthMods(b.life, n.id).liftPlus, 1);
  assert.deepEqual(mineStops({ deep: 10, pickaxe: 5 }, false, 1).map((x) => x.floor), [1, 5, 6, 10, 11]);
  assert.deepEqual(mineStops({ deep: 10, pickaxe: 5 }).map((x) => x.floor), [1, 5, 10]);
});

test('ⓕ talents and other locked nodes show but cannot be taken; locked professions cannot be chosen', () => {
  const s = world(1);
  const [m] = s.members;
  setLevel(s, m, 'farm', 10);
  s.fails(m, { kind: 'pickTalent', skill: 'farm', talent: 'farm-t2' }, FARM_LOCK);
  // 단단한 손목 sits after a locked one but is itself locked too.
  s.fails(m, { kind: 'pickTalent', skill: 'farm', talent: 'farm-t3' }, FARM_LOCK);
  assert.equal(talentBlock(s.life, m.id, TALENT_BY_ID['craft-t4']), FARM_LOCK);
  // 목축: 치즈 장인 is open since 축산 가공품 (치즈·마요네즈) came with the farm barn; no profession is locked.
  setLevel(s, m, 'ranch', 10);
  assert.ok(PROFESSIONS.every((p) => !p.lock));
  assert.equal(PROF_BY_ID['ranch-b'].lock, undefined);
  s.act(m, { kind: 'chooseProf', skill: 'ranch', prof: 'ranch-a' });
  // Locked talents never count, even if a save carried one.
  s.life.growth.u[m.id].tal = ['farm-t2'];
  assert.equal(growthMods(s.life, m.id).seedKeep, 0);
});

// ------------------------------------------------------------ 운명 다시 보기
test('운명 다시 보기: 500,000범 doubling per skill, resets talents and professions, a pure sink', () => {
  const s = world(2, 3_000_000);
  const [m, other] = s.members;
  setLevel(s, m, 'farm', 6);
  pick(s, m, 'farm', 'farm-t1');
  pick(s, m, 'farm', 'farm-t4');
  s.act(m, { kind: 'chooseProf', skill: 'farm', prof: 'farm-b' });
  pick(s, m, 'farm', 'farm-b-t1');
  assert.equal(talentsLeft(s.life, m.id, 'farm'), 0);
  assert.equal(respecCost(s.life, m.id, 'farm'), RESPEC_BASE);
  assert.deepEqual([0, 1, 2, 3].map(respecPrice), [500_000, 1_000_000, 2_000_000, 4_000_000]);
  // Only once 산기슭 마을 is open (the cloud engine also checks I stand at the tent).
  s.life.flags = ['district-ranch'];
  s.fails(m, { kind: 'respec', skill: 'farm' }, GROWTH_REJECT.respecShut);
  s.life.flags = ['district-ranch', 'district-foothill'];
  const before = s.balance(m),
    house = s.ledger.houseBalance ?? 0;
  s.act(m, { kind: 'respec', skill: 'farm' });
  assert.equal(before - s.balance(m), 500_000);
  assert.equal(s.ledger.entries.at(-1).reason, 'respec');
  assert.ok((s.ledger.houseBalance ?? 0) >= house);
  assert.equal(s.user(m).tal, undefined);
  assert.equal(s.user(m).prof, undefined);
  assert.equal(talentsLeft(s.life, m.id, 'farm'), 3);
  // Picks again, then the second reset costs double; other skills keep their own count.
  pick(s, m, 'farm', 'farm-t1');
  assert.equal(respecCost(s.life, m.id, 'farm'), 1_000_000);
  assert.equal(respecCost(s.life, m.id, 'fish'), 500_000);
  const mid = s.balance(m);
  s.act(m, { kind: 'respec', skill: 'farm' });
  assert.equal(mid - s.balance(m), 1_000_000);
  assert.equal(s.user(m).resp.farm, 2);
  assert.equal(lifeView(s.life, m.id, m.actor, T0).growth.skills.find((k) => k.id === 'farm').respec, 2_000_000);
  s.fails(m, { kind: 'respec', skill: 'farm' }, GROWTH_REJECT.noProf);
  // Not enough 범: nothing changes.
  setLevel(s, other, 'fish', 2);
  pick(s, other, 'fish', 'fish-t1');
  s.life.growth.u[other.id].resp = { fish: 3 };
  s.fails(other, { kind: 'respec', skill: 'fish' });
  assert.deepEqual(s.user(other).tal, ['fish-t1']);
});

// ------------------------------------------------------------ news, friends
test('news: one batched talent line per friend per day; friends see each other’s trees', () => {
  const s = world(2);
  const [m, f] = s.members;
  setLevel(s, m, 'forage', 4);
  pick(s, m, 'forage', 'forage-t1');
  pick(s, m, 'forage', 'forage-t2');
  const lines = s.life.news.at(-1).lines.filter((l) => l.key.startsWith('tal:'));
  assert.equal(lines.length, 1);
  assert.match(lines[0].text, /채집 ‘산나물 눈’·채집 ‘벌레잡이’/);
  // The next day starts a new line.
  setLevel(s, m, 'forage', 6);
  pick(s, m, 'forage', 'forage-t4', T0 + DAY);
  assert.match(s.life.news.at(-1).lines.find((l) => l.key === `tal:${m.actor}`).text, /‘열매 털기’/);
  const trees = lifeView(s.life, f.id, f.actor, T0 + DAY).growth.friends;
  assert.equal(trees.length, 1);
  assert.equal(trees[0].actor, m.actor);
  const forage = trees[0].skills.find((k) => k.id === 'forage');
  assert.equal(forage.level, 6);
  assert.deepEqual(forage.tal, ['forage-t1', 'forage-t2', 'forage-t4']);
});

// ------------------------------------------------------------ 목축
test('목축: XP from caring (feeding, petting) and products, under the same daily cap; perks and talents', () => {
  const s = world(1, 200_000);
  const [m] = s.members;
  s.act(m, { kind: 'animalBuy', animal: 'chicken' });
  s.act(m, { kind: 'animalBuy', animal: 'cow' });
  s.act(m, { kind: 'hayBuy', n: 20 });
  // Noon: no morning bonus.
  s.act(m, { kind: 'animalCare' });
  const u = s.user(m);
  assert.equal(u.xp.ranch, 2 * XP.care + 2 * XP.product);
  assert.equal(u.dxp.ranch, 2 * XP.care + 2 * XP.product);
  assert.equal(u.xp.farm ?? 0, 0);
  // Lv3: hay −10%, Lv2 love chance; 목동 / 목장 주인 lower prices.
  setLevel(s, m, 'ranch', 10);
  const hay = s.balance(m);
  s.act(m, { kind: 'hayBuy', n: 10 });
  assert.equal(hay - s.balance(m), Math.round(10 * HAY_PRICE * 0.9));
  s.act(m, { kind: 'chooseProf', skill: 'ranch', prof: 'ranch-a' });
  s.act(m, { kind: 'chooseProf', skill: 'ranch', prof: 'ranch-a2' });
  const buy = s.balance(m);
  s.act(m, { kind: 'animalBuy', animal: 'sheep' });
  assert.equal(buy - s.balance(m), Math.round(ANIMALS.sheep.price * 0.75));
  // 다정한 손: +1 정 on every care.
  pick(s, m, 'ranch', 'ranch-t1');
  const love = s.life.ext[m.id].s3.a[0].love;
  s.act(m, { kind: 'animalCare' }, T0 + DAY);
  assert.ok(s.life.ext[m.id].s3.a[0].love >= love + 2);
  // 부지런한 아침: care XP ×1.5 at game 05–09.
  pick(s, m, 'ranch', 'ranch-t2');
  pick(s, m, 'ranch', 'ranch-t4');
  const morning = gameDayStart(gameDay(T0 + 2 * DAY) + 1) + 6 * GAME_HOUR_MS;
  const xp0 = s.user(m).xp.ranch;
  s.act(m, { kind: 'animalCare' }, morning);
  const got = s.user(m).xp.ranch - xp0;
  assert.ok(got > 0);
  const products = 3 + growthMods(s.life, m.id).woolExtra; // a fresh sheep's wool day aside, eggs and milk
  assert.ok(got >= (3 * XP.care + 2 * XP.product) * 1.5 - 0.1, `morning XP ${got} (${products})`);
  // The daily soft cap counts 목축 like any other skill.
  assert.ok(s.user(m).dxp.ranch <= SOFT_CAP + 1000);
  // 동물 말: the view says what each animal wants.
  pick(s, m, 'ranch', 'ranch-a-t1', morning);
  assert.ok(lifeView(s.life, m.id, m.actor, morning).stage3.animals.every((a) => typeof a.want === 'string'));
});

// ------------------------------------------------------------ effects
test('talent effects reach the systems: demand, sale bonus, gifts, crows, seeds', () => {
  const soft = demandSoft({ demandCrop: 1, demandFish: 0, demandRanch: 1 }, 'carrot');
  assert.equal(soft, 1);
  assert.equal(demandSoft({ demandRanch: 1 }, 'milk'), 1);
  assert.equal(demandSoft({ demandCrop: 1 }, 'milk'), 0);
  assert.ok(demandMult('carrot', 6, 1) > demandMult('carrot', 6));
  assert.equal(demandMult('carrot', 5, 1), Math.max(0.15, 0.5 ** (5 / (demandHalfLife('carrot') * (1 + DEMAND_SOFT_STEP)))));
  const base = { cropSell: 0, starSell: 0, fishSell: 0, dishSell: 0 };
  assert.equal(sellBonus({ ...base, woodSell: 0.2 }, 'wood'), 0.2);
  assert.equal(sellBonus({ ...base, gemSell: 0.2 }, 'gem'), 0.2);
  assert.equal(sellBonus({ ...base, artisanSell: 0.05 }, 'jar-cabbage'), 0.05);
  assert.equal(sellBonus(base, 'wood'), 0);
  const s = world(1);
  const [m] = s.members;
  assert.equal(giftMult(s.life, m.id, 'wildflower'), 1);
  setLevel(s, m, 'forage', 8);
  s.act(m, { kind: 'chooseProf', skill: 'forage', prof: 'forage-a' });
  pick(s, m, 'forage', 'forage-a-t1');
  pick(s, m, 'forage', 'forage-a-t2');
  assert.equal(giftMult(s.life, m.id, 'wildflower'), 1.5);
  assert.equal(giftMult(s.life, m.id, 'stone'), 1);
  // 씨앗 아끼기: over many plantings some seeds are kept.
  setLevel(s, m, 'farm', 2);
  pick(s, m, 'farm', 'farm-t1');
  let kept = 0, total = 0;
  for (let i = 0; i < 60; i++) {
    s.life.farms[m.id] = s.life.farms[m.id].map(() => ({ crop: null, plantedAt: 0, t: 1 }));
    // 우리 농장: a field has more open tiles than seeds handed out, so count seeds kept per planting.
    s.life.bag[m.id].seeds.carrot = 200;
    s.act(m, { kind: 'plant', plot: -1, crop: 'carrot' }, T0 + i * 1000);
    const planted = s.life.farms[m.id].filter((p) => p?.crop === 'carrot').length;
    kept += planted - (200 - s.life.bag[m.id].seeds.carrot);
    total += planted;
  }
  assert.ok(kept > 0 && kept < total * 0.3, `kept ${kept} of ${total}`);
});

// ------------------------------------------------------------ saves
test('older saves read as empty trees; garbage drops; talents and reset counts round-trip', () => {
  const uid = uuid();
  const old = readGrowth({ u: { [uid]: { xp: { farm: 900 }, prof: ['farm-a'] } } });
  assert.equal(old.growth.u[uid].tal, undefined);
  assert.equal(old.growth.u[uid].resp, undefined);
  const hostile = readGrowth({
    u: {
      [uid]: {
        xp: { farm: 4500, ranch: 4500, bogus: 4 },
        tal: ['farm-t1', 'farm-t1', 'nope', 7, 'farm-t4', 'farm-a-t1', 'farm-a-t2', 'farm-b-t1', 'farm-b-t2', 'fish-t1'],
        resp: { farm: 2, fish: -1, bogus: 3, ranch: 1e9 },
        tn: ['farm-t1'],
      },
    },
  });
  const u = hostile.growth.u[uid];
  assert.equal(u.xp.ranch, 4500);
  assert.equal(u.xp.bogus, undefined);
  assert.deepEqual(u.tal, ['farm-t1', 'farm-t4', 'farm-a-t1', 'farm-a-t2', 'farm-b-t1', 'fish-t1']);
  assert.deepEqual(u.resp, { farm: 2, ranch: 33 });
  // Today's talent list needs its day.
  assert.equal(u.tn, undefined);
  const life = readLife({ ...emptyLife(), growth: hostile.growth });
  assert.deepEqual(readLife(JSON.parse(JSON.stringify(life))).growth, life.growth);
});
