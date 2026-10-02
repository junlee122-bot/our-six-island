// 마을 확장 3단계 engine (handover/design/design-npcs-stage3.md §2):
// server-authoritative actions for ④ 목장·과수원 and ⑤ 산기슭 마을.
// lounge-life.ts dispatches STAGE3_ACTION_KINDS here; the cloud engine checks
// the player stands in the district (or the shop's room). Money moves only
// through grantBeom / spendBeom; the one new grant (오늘의 광석 웃돈) is capped
// per friend per KST day. Numbers live in lounge-stage3-data.ts.
//
//   목장 (닐라)    animalBuy · hayBuy (sinks) · animalCare → eggs, milk, wool
//   과수원 (하쿠)  treePlant (sink) · treePick (in season, once a day) · treeClear
//   대장간 (오른)  smithUpgrade (범 + ores, sink) · oreSell (the normal sale at
//                 오른's counter + 20% on today's ore, ≤ 3,000범 a day)
//   의원 (메르시)  clinicCare (sink; mood needs through moodTreat), twice a day
//   점집 (신이치)  fortuneRead (sink; a 3-hour small buff), weekends and festivals
//
// Every trade is also tallied for the stock exchange (lounge-shop-sales.ts).
import { grantBeom, kstDay, spendBeom, type LoungeLedger } from './lounge-economy.ts';
import { seasonOfDay } from './lounge-calendar.ts';
import { LifeError, type LifeState } from './lounge-life.ts';
import { addInv, hasFlag, invCount, soldBeomToday } from './lounge-life-plus.ts';
import { gainXp } from './lounge-growth.ts';
import { moodTreat } from './lounge-mood.ts';
import { itemName } from './lounge-life-plus.ts';
import { DISTRICT_FLAG } from './lounge-districts.ts';
import { hasExplorerPass } from './lounge-explorer-pass.ts';
import { recordShopSale } from './lounge-shop-sales.ts';
import {
  ANIMALS,
  ANIMAL_BOND,
  ANIMAL_KINDS,
  ANIMAL_LOVE_MAX,
  BARN_ROOM,
  CLINIC_BY_ID,
  CLINIC_PER_DAY,
  COOP_ROOM,
  FORTUNE_PRICE,
  FRUIT_TREE_KINDS,
  HAY_PER_BUY,
  HAY_PRICE,
  ORCHARD_GROW_DAYS,
  ORCHARD_OLD_DAYS,
  ORCHARD_SLOTS,
  ORCHARD_YIELD,
  ORE_OF_DAY_PREMIUM,
  ORE_PREMIUM_CAP,
  SAPLINGS,
  SMITH_COST,
  SMITH_ORES,
  SMITH_TOOLS,
  SMITH_TOOL_NAME,
  STAGE3_ACTION_KINDS,
  basketExtra,
  fortuneFor,
  fortuneOpenOn,
  oreOfDay,
  type AnimalKind,
  type FruitTreeKind,
  type SmithOre,
  type SmithTier,
  type SmithTool,
  type Stage3Action,
} from './lounge-stage3-data.ts';
import { FORTUNE_MS, type Animal, type FruitTree, type Stage3User } from './lounge-stage3-state.ts';

export { STAGE3_ACTION_KINDS };
export type { Stage3Action };

export const STAGE3_REJECT = {
  ranchShut: '목장·과수원이 아직 열리지 않았어요.',
  foothillShut: '산기슭 마을이 아직 열리지 않았어요.',
  animal: '동물을 다시 골라 주세요.',
  coopFull: `닭장에는 닭 ${COOP_ROOM}마리까지 살 수 있어요.`,
  barnFull: `외양간에는 소와 양을 합쳐 ${BARN_ROOM}마리까지 살 수 있어요.`,
  noAnimals: '돌볼 동물이 없어요. 먼저 닐라에게 동물을 사 주세요.',
  cared: '오늘은 모두 돌봤어요. 내일 또 와 주세요.',
  hay: '건초가 모자라요. 닐라 목장에서 사 주세요.',
  hayN: `건초는 한 번에 1~${HAY_PER_BUY}개까지 살 수 있어요.`,
  slot: '과일나무 자리를 다시 골라 주세요.',
  slotTaken: '이 자리에는 이미 나무가 있어요.',
  tree: '묘목을 다시 골라 주세요.',
  noTree: '이 자리에는 나무가 없어요.',
  young: `묘목은 심고 ${ORCHARD_GROW_DAYS}일이 지나야 열매를 맺어요.`,
  offSeason: '제철이 아니라 열매가 없어요.',
  picked: '오늘은 이 나무에서 이미 땄어요.',
  tool: '강화할 도구를 다시 골라 주세요.',
  maxed: '이미 가장 좋은 단계예요.',
  mats: '광석이 모자라요.',
  ore: '오른은 구리·철·금 광석과 보석 원석을 사요.',
  oreN: '팔 개수를 다시 정해 주세요.',
  care: '처치를 다시 골라 주세요.',
  clinicMax: `의원은 하루 ${CLINIC_PER_DAY}번까지 들를 수 있어요. 푹 쉬고 내일 와요.`,
  fortuneShut: '신이치의 점집은 주말과 축제 기간에만 열려요.',
  fortuneDone: '오늘 운세는 이미 봤어요. 내일 또 와요.',
  balance: '범이 부족해요.',
} as const;
const fail = (text: string): never => {
  throw new LifeError(text);
};

// ---------------------------------------------------------------- state
type Ext = { s3?: Stage3User };
function stateOf(life: LifeState, uid: string, now: number): Stage3User {
  const x = ((life.ext ??= {})[uid] ??= {}) as Ext;
  const s = (x.s3 ??= {});
  const day = kstDay(now);
  if (s.day !== day) {
    s.day = day;
    delete s.cl;
    delete s.ore;
  }
  return s;
}
const stateRead = (life: LifeState, uid: string, now: number): Stage3User => {
  const s = ((life.ext?.[uid] ?? {}) as Ext).s3 ?? {};
  return s.day === kstDay(now) ? s : { ...s, cl: undefined, ore: undefined };
};
const roomOf = (k: AnimalKind) => ANIMALS[k].home;
const used = (animals: readonly Animal[], home: 'coop' | 'barn') => animals.filter((a) => roomOf(a.k) === home).length;
/** Whether an animal is bonded (큰 달걀 · 진한 우유 · daily wool). */
export const animalBonded = (a: Animal) => a.love >= ANIMAL_BOND;
/** What caring for `a` gives today (null: a sheep between wool days). */
export function careProduct(a: Animal): string | null {
  const def = ANIMALS[a.k];
  const bonded = animalBonded(a);
  if (a.k === 'sheep') return bonded || a.cares % def.every === 0 ? def.product : null;
  return bonded ? def.bonded : def.product;
}
/** A tree's age in KST days, whether it bears now and how many it gives. */
export function treeState(t: FruitTree, day: number) {
  const age = day - t.at;
  const grown = age >= ORCHARD_GROW_DAYS;
  const inSeason = seasonOfDay(day) === SAPLINGS[t.k].season;
  return { age, grown, inSeason, ripe: grown && inSeason && t.picked !== day, n: ORCHARD_YIELD + (age >= ORCHARD_OLD_DAYS ? 1 : 0) };
}

// ---------------------------------------------------------------- actions
const walletOf = (uid: string) => 'wallet-' + uid;
/** Runs the normal item sale (lounge-life-plus 'sellItem') at 오른's counter. */
export type OreSellRunner = (life: LifeState, ledger: LoungeLedger, action: { kind: 'sellItem'; item: string; n: number; at: 'smithy' }) => { life: LifeState; ledger: LoungeLedger };

export function stage3Action(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: Stage3Action,
  now: number,
  sell: OreSellRunner,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    wallet = walletOf(uid),
    day = kstDay(now);
  const opened = (id: 'ranch' | 'foothill') => hasFlag(life, DISTRICT_FLAG[id]!) || hasExplorerPass(member.actor, now);
  const ranch = () => opened('ranch') || fail(STAGE3_REJECT.ranchShut);
  const foothill = () => opened('foothill') || fail(STAGE3_REJECT.foothillShut);
  const pay = (beom: number, reason: string, tag: string) => {
    if ((ledger.accounts[wallet] ?? 0) < beom) fail(STAGE3_REJECT.balance);
    return spendBeom(ledger, wallet, beom, `life-${tag}-${uid}-${++life.seq}`, now, reason);
  };
  switch (a.kind) {
    case 'animalBuy': {
      ranch();
      if (!(ANIMAL_KINDS as readonly unknown[]).includes(a.animal)) fail(STAGE3_REJECT.animal);
      const s = stateOf(life, uid, now);
      const animals = (s.a ??= []);
      const home = roomOf(a.animal);
      if (used(animals, home) >= (home === 'coop' ? COOP_ROOM : BARN_ROOM)) fail(home === 'coop' ? STAGE3_REJECT.coopFull : STAGE3_REJECT.barnFull);
      const price = ANIMALS[a.animal].price;
      const next = pay(price, 'ranch-animal', 'animal');
      const n = Math.max(0, ...animals.filter((x) => x.k === a.animal).map((x) => x.n)) + 1;
      animals.push({ k: a.animal, n, love: 0, cares: 0 });
      recordShopSale(life, 'barn', { rev: price }, now);
      return { life, ledger: next };
    }
    case 'hayBuy': {
      ranch();
      const n = a.n;
      if (!Number.isSafeInteger(n) || n < 1 || n > HAY_PER_BUY) fail(STAGE3_REJECT.hayN);
      const next = pay(n * HAY_PRICE, 'ranch-hay', 'hay');
      addInv(life, uid, 'hay', n);
      recordShopSale(life, 'barn', { rev: n * HAY_PRICE }, now);
      return { life, ledger: next };
    }
    case 'animalCare': {
      ranch();
      const s = stateOf(life, uid, now);
      const animals = s.a ?? [];
      if (!animals.length) fail(STAGE3_REJECT.noAnimals);
      if (a.i !== undefined && (!Number.isSafeInteger(a.i) || a.i < 0 || a.i >= animals.length)) fail(STAGE3_REJECT.animal);
      const todo = animals.filter((x, i) => x.last !== day && (a.i === undefined || a.i === i));
      if (!todo.length) fail(STAGE3_REJECT.cared);
      if (invCount(life, uid, 'hay') < todo.length) fail(STAGE3_REJECT.hay);
      addInv(life, uid, 'hay', -todo.length);
      for (const x of todo) {
        // 정: −1 for each day missed since the last care, then +1 for today.
        const missed = x.last ? Math.max(0, day - x.last - 1) : 0;
        x.love = Math.max(0, Math.min(ANIMAL_LOVE_MAX, x.love - missed + 1));
        x.cares += 1;
        x.last = day;
        const got = careProduct(x);
        if (got) addInv(life, uid, got, 1);
      }
      gainXp(life, uid, 'farm', 3 * todo.length, now);
      return { life, ledger };
    }
    case 'treePlant': {
      ranch();
      if (!Number.isSafeInteger(a.slot) || a.slot < 0 || a.slot >= ORCHARD_SLOTS) fail(STAGE3_REJECT.slot);
      if (!(FRUIT_TREE_KINDS as readonly unknown[]).includes(a.tree)) fail(STAGE3_REJECT.tree);
      const s = stateOf(life, uid, now);
      const trees = (s.t ??= Array.from({ length: ORCHARD_SLOTS }, () => null));
      while (trees.length < ORCHARD_SLOTS) trees.push(null);
      if (trees[a.slot]) fail(STAGE3_REJECT.slotTaken);
      const price = SAPLINGS[a.tree as FruitTreeKind].price;
      const next = pay(price, 'orchard-sapling', 'sapling');
      trees[a.slot] = { k: a.tree, at: day };
      recordShopSale(life, 'orchardShop', { rev: price }, now);
      return { life, ledger: next };
    }
    case 'treePick': {
      ranch();
      const s = stateOf(life, uid, now);
      const t = Number.isSafeInteger(a.slot) ? s.t?.[a.slot] : null;
      if (!t) fail(STAGE3_REJECT.noTree);
      const st = treeState(t!, day);
      if (!st.grown) fail(STAGE3_REJECT.young);
      if (!st.inSeason) fail(STAGE3_REJECT.offSeason);
      if (t!.picked === day) fail(STAGE3_REJECT.picked);
      t!.picked = day;
      const n = st.n + basketExtra(life, uid, `tree:${a.slot}:${day}`);
      addInv(life, uid, t!.k, n);
      gainXp(life, uid, 'forage', 4 * n, now);
      return { life, ledger };
    }
    case 'treeClear': {
      ranch();
      const s = stateOf(life, uid, now);
      if (!Number.isSafeInteger(a.slot) || !s.t?.[a.slot]) fail(STAGE3_REJECT.noTree);
      s.t![a.slot] = null;
      if (!s.t!.some(Boolean)) delete s.t;
      return { life, ledger };
    }
    case 'smithUpgrade': {
      foothill();
      if (!(SMITH_TOOLS as readonly unknown[]).includes(a.tool)) fail(STAGE3_REJECT.tool);
      const s = stateOf(life, uid, now);
      const now1 = s.sm?.[a.tool as SmithTool] ?? 1;
      if (now1 >= 3) fail(STAGE3_REJECT.maxed);
      const to = (now1 + 1) as SmithTier;
      const cost = SMITH_COST[a.tool as SmithTool][to];
      for (const [id, n] of Object.entries(cost.mats)) if (invCount(life, uid, id) < n) fail(STAGE3_REJECT.mats);
      const next = pay(cost.beom, `smith-${a.tool}-${to}`, 'smith');
      for (const [id, n] of Object.entries(cost.mats)) addInv(life, uid, id, -n);
      (s.sm ??= {})[a.tool as SmithTool] = to;
      recordShopSale(life, 'smithy', { rev: cost.beom }, now);
      return { life, ledger: next };
    }
    case 'oreSell': {
      foothill();
      if (!(SMITH_ORES as readonly unknown[]).includes(a.item)) fail(STAGE3_REJECT.ore);
      if (!Number.isSafeInteger(a.n) || a.n < 1) fail(STAGE3_REJECT.oreN);
      const before = soldBeomToday(life, uid, now);
      // The ordinary sale at 오른's counter (demand curve, daily cap, 흥정) — it also tallies the shop's buying.
      const base = sell(life, ledger, { kind: 'sellItem', item: a.item, n: a.n, at: 'smithy' });
      const amount = soldBeomToday(base.life, uid, now) - before;
      const s = stateOf(base.life, uid, now);
      let next = base.ledger;
      if (a.item === oreOfDay(day)) {
        const premium = Math.min(Math.round(amount * ORE_OF_DAY_PREMIUM), ORE_PREMIUM_CAP - (s.ore ?? 0));
        if (premium > 0 && Object.prototype.hasOwnProperty.call(next.accounts, wallet)) {
          s.ore = (s.ore ?? 0) + premium;
          next = grantBeom(next, wallet, premium, `life-smith-ore-${uid}-${++base.life.seq}`, now, 'smith-ore');
          recordShopSale(base.life, 'smithy', { buy: premium }, now);
        }
      }
      return { life: base.life, ledger: next };
    }
    case 'clinicCare': {
      foothill();
      const care = typeof a.care === 'string' && Object.prototype.hasOwnProperty.call(CLINIC_BY_ID, a.care) ? CLINIC_BY_ID[a.care] : null;
      if (!care) fail(STAGE3_REJECT.care);
      const s = stateOf(life, uid, now);
      if ((s.cl ?? 0) >= CLINIC_PER_DAY) fail(STAGE3_REJECT.clinicMax);
      const next = pay(care!.price, 'clinic', 'clinic');
      s.cl = (s.cl ?? 0) + 1;
      moodTreat(life, uid, now, { rest: care!.rest, fun: care!.fun, let: 'drink' });
      recordShopSale(life, 'clinic', { rev: care!.price }, now);
      return { life, ledger: next };
    }
    case 'fortuneRead': {
      foothill();
      if (!fortuneOpenOn(day)) fail(STAGE3_REJECT.fortuneShut);
      const s = stateOf(life, uid, now);
      if (s.fo?.day === day) fail(STAGE3_REJECT.fortuneDone);
      const next = pay(FORTUNE_PRICE, 'fortune', 'fortune');
      s.fo = { kind: fortuneFor(uid, day).kind, until: now + FORTUNE_MS, day };
      recordShopSale(life, 'fortune', { rev: FORTUNE_PRICE }, now);
      return { life, ledger: next };
    }
    default:
      return fail('요청을 처리할 수 없어요.');
  }
}

// ---------------------------------------------------------------- view
export type Stage3View = {
  animals: { k: AnimalKind; n: number; name: string; love: number; bonded: boolean; cared: boolean; product: string | null }[];
  room: { coop: number; barn: number };
  hay: number;
  trees: ({ k: FruitTreeKind; name: string; age: number; grown: boolean; inSeason: boolean; ripe: boolean; picked: boolean; n: number } | null)[];
  smith: Record<SmithTool, 1 | SmithTier>;
  ore: { today: SmithOre; premiumLeft: number };
  clinic: { left: number };
  fortune: { open: boolean; read: boolean; name?: string; line?: string; until?: number };
};
export function stage3View(life: LifeState, uid: string, now: number): Stage3View {
  const s = stateRead(life, uid, now),
    day = kstDay(now);
  const animals = s.a ?? [];
  const fo = s.fo?.day === day ? fortuneFor(uid, day) : null;
  return {
    animals: animals.map((a) => {
      // What tomorrow's (or today's) care gives, from the 정 it would have then.
      const preview = { ...a, love: a.last === day ? a.love : Math.min(ANIMAL_LOVE_MAX, Math.max(0, a.love - (a.last ? Math.max(0, day - a.last - 1) : 0) + 1)), cares: a.last === day ? a.cares : a.cares + 1 };
      return { k: a.k, n: a.n, name: `${ANIMALS[a.k].name} ${a.n}`, love: a.love, bonded: animalBonded(a), cared: a.last === day, product: careProduct(preview) };
    }),
    room: { coop: COOP_ROOM - used(animals, 'coop'), barn: BARN_ROOM - used(animals, 'barn') },
    hay: invCount(life, uid, 'hay'),
    trees: Array.from({ length: ORCHARD_SLOTS }, (_, i) => {
      const t = s.t?.[i];
      if (!t) return null;
      const st = treeState(t, day);
      return { k: t.k, name: SAPLINGS[t.k].name, age: st.age, grown: st.grown, inSeason: st.inSeason, ripe: st.ripe, picked: t.picked === day, n: st.n };
    }),
    smith: { can: s.sm?.can ?? 1, hoe: s.sm?.hoe ?? 1, basket: s.sm?.basket ?? 1 },
    ore: { today: oreOfDay(day), premiumLeft: Math.max(0, ORE_PREMIUM_CAP - (s.ore ?? 0)) },
    clinic: { left: Math.max(0, CLINIC_PER_DAY - (s.cl ?? 0)) },
    fortune: { open: fortuneOpenOn(day), read: !!fo, ...(fo ? { name: fo.name, line: fo.line, until: s.fo!.until } : {}) },
  };
}
/** "물뿌리개 범위 2단계" for notices. */
export const smithLabel = (tool: SmithTool, tier: number) => `${SMITH_TOOL_NAME[tool]} ${tier}단계`;
/** "달걀 1" for the care notice. */
export const productName = (id: string) => itemName(id);
