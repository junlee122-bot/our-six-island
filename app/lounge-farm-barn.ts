// 우리 농장 F4 engine (handover/design/design-our-farm.md §4, §10-3, §11-5):
// the farm's 축사 (barn, a large shared site) and 닭장 (coop, a medium one),
// opened by V5 목장 울타리.
//
//  - My animals stay mine (life.ext[uid].s3.a, lounge-stage3.ts); each may
//    move from 닐라's ranch into the farm (Animal.f) and back. The farm has
//    its own room per friend: the site's slots (barn 4 → 8 with 축사 2층 at
//    목축 Lv7, coop 4 → 8 with 닭장 증축 at 목축 Lv3).
//  - Care at the farm is the same as at the ranch (careAnimals: 건초, 정,
//    products, the 목장 도우미).
//  - Every day (the site daily hook, lounge-farm-sites.ts DAILY, and once more
//    for my own share at 하루 마감, lounge-myday.ts) each animal at the farm
//    makes 거름; 퇴비 turns 거름 into 비료 for the field; the 사일로 cuts the
//    grass of my field into 건초 for the animals.
//
// Cycle-safe like the other farm modules (bindings used inside functions only).
import { type LoungeLedger } from './lounge-economy.ts';
import { LifeError, type LifeState } from './lounge-life.ts';
import { addInv, farmSizeOf, invCount } from './lounge-life-plus.ts';
import { gainXp } from './lounge-growth.ts';
import { FACILITY_BY_ID, slotsAt } from './lounge-farm-sites-data.ts';
import { tileOpen, GRID_TILES } from './lounge-farm-data.ts';
import { fixtureAt } from './lounge-farm.ts';
import { animalHome, careAnimals, farmUsed, myAnimals, ranchRoomLeft } from './lounge-stage3.ts';
import { myDay } from './lounge-myday.ts';
import type { SiteRecord } from './lounge-farm-sites.ts';
import {
  BARN_REJECT,
  COMPOST_XP,
  HAY_PER_GRASS,
  MANURE_HOLD,
  MANURE_PER_ANIMAL,
  MANURE_PER_FERT,
  SILO_XP,
  type BarnAction,
} from './lounge-farm-barn-data.ts';
import type { AnimalKind } from './lounge-stage3-data.ts';

const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const fail = (text: string): never => {
  throw new LifeError(text);
};
type Home = 'barn' | 'coop';
const homeOf = (k: AnimalKind): Home => animalHome(k);

// ---------------------------------------------------------------- the sites
/** The built barn / coop of the farm (the best tier if two stand), or null. */
export function farmShelter(life: LifeState, home: Home): { id: string; site: SiteRecord } | null {
  let best: { id: string; site: SiteRecord } | null = null;
  for (const [id, site] of Object.entries(life.farm?.sites ?? {}))
    if (site.kind === home && site.tier >= 1 && (!best || site.tier > best.site.tier)) best = { id, site };
  return best;
}
/** Room each friend has in the farm's barn / coop (0 when it is not built). */
export function farmRoom(life: LifeState, home: Home) {
  const s = farmShelter(life, home);
  return s ? slotsAt(FACILITY_BY_ID[home], s.site.tier) : 0;
}

// ---------------------------------------------------------------- the day
/** 거름 one friend's animals at the farm make in a day at a barn / coop. */
function manureOf(life: LifeState, uid: string, home: Home) {
  const animals = life.ext?.[uid]?.s3?.a ?? [];
  return animals.filter((a) => a.f && homeOf(a.k) === home).length * MANURE_PER_ANIMAL;
}
function addManure(site: SiteRecord, actor: number, n: number) {
  if (n <= 0) return 0;
  const mn = (site.state.mn ??= {}),
    before = mn[String(actor)] ?? 0,
    after = Math.min(MANURE_HOLD, before + n);
  if (after > 0) mn[String(actor)] = after;
  return after - before;
}
/** The barn / coop daily hook (lounge-farm-sites.ts DAILY): one day of 거름 for everyone's animals there. */
export function shelterDaily(life: LifeState, site: SiteRecord) {
  const home = site.kind === 'coop' ? 'coop' : 'barn';
  // Only the best-tier shelter of a kind houses the animals.
  if (farmShelter(life, home)?.site !== site) return;
  for (const [uid, actor] of Object.entries(life.actors)) addManure(site, actor, manureOf(life, uid, home));
}
/** 하루 마감: one more day of 거름 for my own animals (barn and coop). Returns how much. */
export function barnMyDay(life: LifeState, uid: string, actor: number, _now: number) {
  let got = 0;
  for (const home of ['barn', 'coop'] as const) {
    const s = farmShelter(life, home);
    if (s) got += addManure(s.site, actor, manureOf(life, uid, home));
  }
  return got;
}

// ---------------------------------------------------------------- 사일로
/** Grass tiles of my field I may cut now: open, never tilled, nothing on them, not cut this 나의 하루. */
export function grassTiles(life: LifeState, uid: string, now: number): number[] {
  const field = life.farms[uid] ?? [],
    size = farmSizeOf(life, uid),
    cut = cutToday(life, uid, now);
  const out: number[] = [];
  for (let t = 0; t < GRID_TILES; t++) {
    const p = field[t];
    if (!tileOpen(size, t) || !p || p.t || p.crop || p.dead || cut.includes(t) || fixtureAt(life, uid, t)) continue;
    out.push(t);
  }
  return out;
}
function cutToday(life: LifeState, uid: string, now: number): number[] {
  const s = farmShelter(life, 'barn'),
    actor = life.actors[uid],
    c = s?.site.state.cut?.[String(actor)];
  return c && c.d === myDay(life, uid, now) ? c.t : [];
}

// ---------------------------------------------------------------- actions
export function barnAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: BarnAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const uid = member.id,
    actor = member.actor;
  switch (a.kind) {
    case 'barnMove': {
      const animals = myAnimals(life, uid, now);
      if (!safe(a.i) || a.i < 0 || a.i >= animals.length) fail(BARN_REJECT.animal);
      const x = animals[a.i],
        home = homeOf(x.k);
      if (a.to === 'farm') {
        if (x.f) fail(BARN_REJECT.there);
        if (!farmShelter(life, home)) fail(home === 'barn' ? BARN_REJECT.noBarn : BARN_REJECT.noCoop);
        if (farmUsed(animals, home) >= farmRoom(life, home)) fail(BARN_REJECT.farmFull);
        x.f = 1;
      } else if (a.to === 'ranch') {
        if (!x.f) fail(BARN_REJECT.there);
        if (ranchRoomLeft(animals, home) <= 0) fail(BARN_REJECT.ranchFull);
        delete x.f;
      } else fail(BARN_REJECT.animal);
      return { life, ledger };
    }
    case 'barnCare': {
      const animals = myAnimals(life, uid, now);
      if (!animals.some((x) => x.f)) fail(BARN_REJECT.noFarmAnimals);
      if (a.i !== undefined && (!safe(a.i) || a.i < 0 || a.i >= animals.length || !animals[a.i].f)) fail(BARN_REJECT.animal);
      return careAnimals(life, ledger, uid, now, (x, i) => !!x.f && (a.i === undefined || a.i === i));
    }
    case 'siloCut': {
      const barn = farmShelter(life, 'barn');
      if (!barn) fail(BARN_REJECT.noBarn);
      const grass = grassTiles(life, uid, now);
      let tiles: number[];
      if (a.tile === -1) tiles = grass;
      else {
        if (!safe(a.tile) || a.tile < 0 || a.tile >= GRID_TILES) fail(BARN_REJECT.tile);
        if (!grass.includes(a.tile)) fail(cutToday(life, uid, now).includes(a.tile) ? BARN_REJECT.cut : BARN_REJECT.noGrass);
        tiles = [a.tile];
      }
      if (!tiles.length) fail(BARN_REJECT.noGrass);
      const day = myDay(life, uid, now),
        cut = (barn!.site.state.cut ??= {}),
        prev = cut[String(actor)];
      cut[String(actor)] = { d: day, t: [...(prev?.d === day ? prev.t : []), ...tiles].sort((x, y) => x - y) };
      addInv(life, uid, 'hay', HAY_PER_GRASS * tiles.length);
      gainXp(life, uid, 'ranch', SILO_XP * tiles.length, now);
      return { life, ledger };
    }
    case 'manureTake': {
      let got = 0;
      for (const home of ['barn', 'coop'] as const) {
        for (const site of Object.values(life.farm?.sites ?? {})) {
          if (site.kind !== home || !site.state.mn?.[String(actor)]) continue;
          got += site.state.mn[String(actor)];
          delete site.state.mn[String(actor)];
          if (!Object.keys(site.state.mn).length) delete site.state.mn;
        }
      }
      if (!got) fail(BARN_REJECT.noManure);
      addInv(life, uid, 'manure', got);
      return { life, ledger };
    }
    case 'compost': {
      if (!farmShelter(life, 'barn') && !farmShelter(life, 'coop')) fail(BARN_REJECT.noBarn);
      if (!safe(a.n) || a.n < 1 || a.n > 99) fail(BARN_REJECT.compostN);
      if (invCount(life, uid, 'manure') < a.n * MANURE_PER_FERT) fail(BARN_REJECT.manure);
      addInv(life, uid, 'manure', -a.n * MANURE_PER_FERT);
      addInv(life, uid, 'fertilizer', a.n);
      gainXp(life, uid, 'ranch', COMPOST_XP * a.n, now);
      return { life, ledger };
    }
    default:
      return fail('요청을 처리할 수 없어요.');
  }
}

// ---------------------------------------------------------------- view
export type BarnView = {
  /** My room at the farm (0: not built) and how much of it my animals use. */
  room: Record<Home, { max: number; used: number }>;
  /** 거름 waiting for me. */
  manure: number;
  /** Grass tiles of my field the 사일로 can cut today. */
  grass: number;
};
/** My barn / coop view; undefined until either stands (keeps the view small). */
export function barnView(life: LifeState, uid: string, now: number): BarnView | undefined {
  if (!farmShelter(life, 'barn') && !farmShelter(life, 'coop')) return undefined;
  const actor = life.actors[uid];
  const animals = life.ext?.[uid]?.s3?.a ?? [];
  let manure = 0;
  for (const site of Object.values(life.farm?.sites ?? {})) if (site.kind === 'barn' || site.kind === 'coop') manure += site.state.mn?.[String(actor)] ?? 0;
  return {
    room: {
      barn: { max: farmRoom(life, 'barn'), used: farmUsed(animals, 'barn') },
      coop: { max: farmRoom(life, 'coop'), used: farmUsed(animals, 'coop') },
    },
    manure,
    grass: farmShelter(life, 'barn') ? grassTiles(life, uid, now).length : 0,
  };
}
