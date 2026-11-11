// Read-only material planning. Never calls an action, reserves stock or spends 범.
// Keep life bindings inside functions: life-plus imports this module for saves.
import { CROPS, CROP_INFO, type Crop, type LifeView, type Quality } from './lounge-life.ts';
import { CRAFTS, CRAFT_BY_ID, DISHES, DISH_BY_ID, FURNITURE_BY_REF, ITEM_BY_ID, type Need, type RecipeDef } from './lounge-items.ts';
import { buildGoods, DAIRY_BIG, FIXTURES, FIXTURE_BY_ID, FROST_COVER_RECIPE, isGoodId, MACHINES, MACHINE_BY_ID, STAR_FERT_RECIPE, type Recipe } from './lounge-farm-data.ts';
import { FACILITIES, FACILITY_BY_ID } from './lounge-farm-sites-data.ts';
import { NO_MODS, type GrowthMods } from './lounge-growth-data.ts';

export type CraftTargetKind = 'cook' | 'craft' | 'farm' | 'facility' | 'good';
/** Desired finished stock, including what is already owned (not craft batches). */
export type CraftTarget = { kind: CraftTargetKind; id: string; quantity: number };
export type CraftTargetOption = { kind: CraftTargetKind; id: string; name: string; count: number };
export const CRAFT_TARGET_LIMIT = 3;
export const CRAFT_TARGET_MAX_QUANTITY = 999;
export const craftTargetKey = (target: Pick<CraftTarget, 'kind' | 'id'>) => `${target.kind}:${target.id}`;
export const targetKey = craftTargetKey;

const farmRecipe = (id: string): Recipe | undefined => id === 'fertilizer-star' ? STAR_FERT_RECIPE
  : id === 'frostcover' ? FROST_COVER_RECIPE : FIXTURE_BY_ID[id]?.recipe ?? MACHINE_BY_ID[id]?.recipe;
const valid = (kind: unknown, id: unknown): kind is CraftTargetKind => {
  if (typeof id !== 'string' || !id || id.length > 80) return false;
  switch (kind) {
    case 'cook': return Object.hasOwn(DISH_BY_ID, id);
    case 'craft': return Object.hasOwn(CRAFT_BY_ID, id);
    case 'farm': return !!farmRecipe(id);
    case 'facility': return Object.hasOwn(FACILITY_BY_ID, id) && FACILITY_BY_ID[id].live;
    case 'good': return isGoodId(id);
    default: return false;
  }
};
/** Tolerant save restoration. Invalid rows are discarded, never coerced. */
export function readCraftTargets(raw: unknown): CraftTarget[] {
  if (!Array.isArray(raw)) return [];
  const out: CraftTarget[] = [], seen = new Set<string>();
  for (const row of raw) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const { kind, id, quantity } = row as Record<string, unknown>;
    if (!valid(kind, id) || typeof id !== 'string' || typeof quantity !== 'number' || !Number.isInteger(quantity)
      || quantity < 1 || quantity > (kind === 'facility' ? 1 : CRAFT_TARGET_MAX_QUANTITY)) continue;
    const target = { kind, id, quantity }, key = craftTargetKey(target);
    if (seen.has(key)) continue;
    seen.add(key); out.push(target);
    if (out.length === CRAFT_TARGET_LIMIT) break;
  }
  return out;
}

const count = (n: number | undefined) => Number.isFinite(n) ? Math.max(0, Math.floor(n!)) : 0;
const nameOf = (id: string) => id === 'beom' ? '범' : id === 'fruit' ? '과일'
  : CROP_INFO[id as Crop]?.name ?? ITEM_BY_ID[id]?.name ?? FURNITURE_BY_REF[id]?.name ?? id;
const goodDefs = () => buildGoods(nameOf, (id) => CROP_INFO[id as Crop]?.sell ?? ITEM_BY_ID[id]?.sell ?? 0);
export function craftTargetOptions(): CraftTargetOption[] {
  return [
    ...DISHES.map((r) => ({ kind: 'cook' as const, id: r.id, name: r.name, count: r.count })),
    ...CRAFTS.map((r) => ({ kind: 'craft' as const, id: r.id, name: r.name, count: r.count })),
    ...[...FIXTURES, ...MACHINES, { id: 'fertilizer-star', name: '별빛 비료' }, { id: 'frostcover', name: '서리 덮개' }]
      .map((r) => ({ kind: 'farm' as const, id: r.id, name: r.name, count: 1 })),
    ...FACILITIES.filter((f) => f.live).map((f) => ({ kind: 'facility' as const, id: f.id, name: f.name, count: 1 })),
    ...goodDefs().map((r) => ({ kind: 'good' as const, id: r.id, name: r.name, count: 1 })),
  ];
}
type Scope = 'bag' | 'inv' | 'furniture' | 'goods' | 'facility';
type Material = { id: string; n: number; q?: Quality; cat?: 'fish' | 'bug' | 'flower' | 'forage'; alternatives?: string[]; scope: Scope };
type PlanRecipe = { key: string; id: string; scope: Scope; count: number; needs: Material[]; warnings: string[]; blocked?: boolean; durationMs?: number };
export type CraftAllocation = { id: string; quality: Quality; quantity: number; source: 'bag' | 'private' | 'production' | 'plan'; readyAt?: number; slot?: number };
export type CraftMaterial = {
  key: string; id: string; name: string; quality: Quality; scope: Scope;
  required: number;
  /** Eligible personal stock before any goal reserves it; shared is informational. */
  owned: number; bag: number; private: number; shared: number;
  allocated: number; queued: number; planned: number;
  /** Still needs to be obtained or produced; a branch expands this into children. */
  missing: number; batches: number; allocations: CraftAllocation[]; children: CraftMaterial[];
  warnings: string[];
};
export type CraftProduction = { slot: number; id: string; name: string; quality: Quality; quantity: number; allocated: number; readyAt: number; remainingMs: number; ready: boolean };
export type CraftTargetPlan = {
  target: CraftTarget; key: string; name: string; owned: number; missing: number; complete: boolean;
  queued: number; toProduce: number; batches: number; ready: boolean;
  requirements: CraftMaterial[]; raw: CraftMaterial[]; production: CraftProduction[]; warnings: string[];
};
export type CraftTrackerResult = { targets: CraftTargetPlan[]; totals: CraftMaterial[]; raw: CraftMaterial[]; production: CraftProduction[] };

function output(target: CraftTarget): { id: string; scope: Scope } {
  if (target.kind === 'cook' || target.kind === 'craft') {
    const r = target.kind === 'cook' ? DISH_BY_ID[target.id] : CRAFT_BY_ID[target.id];
    return { id: r?.makes ?? target.id, scope: r?.makes.startsWith('furn-') ? 'furniture' : 'inv' };
  }
  return { id: target.id, scope: target.kind === 'good' ? 'goods' : target.kind === 'facility' ? 'facility' : 'inv' };
}
/** Exact current output stock; queued goods are deliberately excluded. */
export function outputHave(life: LifeView, target: CraftTarget, actor?: number): number {
  if (!valid(target.kind, target.id)) return 0;
  const o = output(target);
  if (o.scope === 'facility') {
    const def = FACILITY_BY_ID[target.id];
    return (life.farmSites?.sites ?? []).filter((s) => s.k === target.id && s.t >= 1
      && (def.owner === 'shared' || (actor !== undefined && s.o === actor))).length;
  }
  if (o.scope === 'goods') return (life.farmx?.goods ?? []).filter((s) => s.id === o.id).reduce((n, s) => n + count(s.n), 0);
  return count(o.scope === 'furniture' ? life.me.furniture?.[o.id] : life.me.inv?.[o.id]);
}

/** Build the same extra-output pin from every UI entry point. Never silently
 * clamp a requested increase into a goal the player has already completed.
 */
export function additionalCraftTarget(life: LifeView, base: Pick<CraftTarget, 'kind' | 'id'>, additional: number, actor?: number): {
  target: CraftTarget | null; problem: string | null;
} {
  if (!valid(base.kind, base.id)) return { target: null, problem: '제작 목표의 종류와 항목을 확인해 주세요.' };
  if (!Number.isInteger(additional) || additional < 1 || additional > CRAFT_TARGET_MAX_QUANTITY)
    return { target: null, problem: '추가 수량은 하나부터 999개까지 정수로 입력해 주세요.' };
  const target: CraftTarget = { kind: base.kind, id: base.id, quantity: 1 };
  if (base.kind === 'facility') return { target, problem: null };
  const owned = outputHave(life, target, actor), quantity = owned + additional;
  if (quantity > CRAFT_TARGET_MAX_QUANTITY) return {
    target: null,
    problem: `현재 ${owned.toLocaleString('ko-KR')}개를 보유하고 있어요. 보유 목표는 최대 999개까지 설정할 수 있어요.`,
  };
  return { target: { ...target, quantity }, problem: null };
}

/** Guaranteed finished output of the selected batches. Random cooking extras
 * are not promised; exact fertilizer/bait bonuses match the server loop.
 */
export function craftOutputCount(life: LifeView, kind: 'cook' | 'craft', id: string, batches: number): number {
  if ((kind !== 'cook' && kind !== 'craft') || !valid(kind, id) || !Number.isSafeInteger(batches) || batches < 1) return 0;
  const recipe = recipeFor({ kind, id }, life, { ...NO_MODS, ...life.growth?.mods });
  const made = (recipe?.count ?? 0) * batches;
  return Number.isSafeInteger(made) ? made : 0;
}

function recipeFor(target: Pick<CraftTarget, 'kind' | 'id'>, life: LifeView, mods: GrowthMods): PlanRecipe | null {
  const key = craftTargetKey(target), warnings: string[] = [];
  if (target.kind === 'cook' || target.kind === 'craft') {
    const r: RecipeDef | undefined = target.kind === 'cook' ? DISH_BY_ID[target.id] : CRAFT_BY_ID[target.id];
    if (!r) return null;
    const needs = r.needs.flatMap((need: Need & { n: number }): Material[] => {
      let n = need.n;
      if (target.kind === 'craft' && !('beom' in need)) {
        if (r.id === 'fertilizer-deluxe' && 'item' in need && need.item === 'fertilizer' && mods.deluxeCheap) n--;
        if (r.makes.startsWith('bait')) n -= mods.baitCheap;
        const discount = mods.craftDiscount + (r.makes.startsWith('furn-') && 'item' in need && need.item === 'wood' ? mods.furnCheap : 0);
        if (discount > 0 && n >= 2) n -= Math.floor(n * Math.min(0.9, discount));
        n = Math.max(1, n);
      }
      // cook/craft ignore beom needs in their actual takeNeed loop.
      if ('beom' in need) return [];
      return [{ id: 'item' in need ? need.item : `cat:${need.cat}`, n, q: 'item' in need ? need.q : 0,
        ...('cat' in need ? { cat: need.cat } : {}), scope: 'bag' }];
    });
    let made = r.count;
    if (target.kind === 'craft' && r.makes === 'bait') made += mods.baitExtra;
    if (target.kind === 'craft' && r.makes === 'fertilizer') made += mods.fertExtra;
    const blocked = !!r.flag && !life.flags?.includes(r.flag);
    if (blocked) warnings.push('마을 해금 조건을 먼저 완료해야 해요.');
    if (target.kind === 'cook' && mods.cookExtra > 0) warnings.push('확률로 늘어나는 요리 수량은 미리 세지 않아요.');
    return { key, id: r.makes, scope: r.makes.startsWith('furn-') ? 'furniture' : 'inv', count: made, needs, warnings, blocked };
  }
  if (target.kind === 'farm' || target.kind === 'facility') {
    const def = target.kind === 'facility' ? FACILITY_BY_ID[target.id] : undefined;
    const r = def?.build ?? farmRecipe(target.id);
    if (!r) return null;
    const skill = target.kind === 'farm' ? farmRecipe(target.id) : undefined;
    const unlock = def?.unlock ?? skill;
    if (unlock?.skill && (life.growth?.skills.find((s) => s.id === unlock.skill)?.level ?? 1) < (unlock.level ?? 1))
      warnings.push('제작 기술 레벨이 아직 부족해요.');
    if (def?.unlock.flag && !life.flags?.includes(def.unlock.flag)) warnings.push('마을 해금 조건을 먼저 완료해야 해요.');
    if (def?.unlock.research && !life.growth?.research.some((r) => r.id === def.unlock.research && r.done)) warnings.push('마을 연구를 먼저 완료해야 해요.');
    const blocked = !!warnings.length;
    if (def?.owner === 'shared') warnings.push('공동 시설은 전체 건설 예산이에요. 기존 모금액과 기부 재료를 여기서 차감하지 않아요.');
    return { key, id: target.id, scope: def ? 'facility' : 'inv', count: 1, warnings, blocked,
      needs: [...Object.entries(r.mats).map(([id, n]): Material => ({ id, n, scope: 'inv' })),
        ...(r.beom > 0 ? [{ id: 'beom', n: r.beom, scope: 'inv' as const }] : [])] };
  }
  const g = goodDefs().find((g) => g.id === target.id);
  if (!g) return null;
  if (g.machine === 'beehouse') return { key, id: g.id, scope: 'goods', count: 1, needs: [], warnings: ['벌통의 꽃과 수확 시점에 따라 꿀이 달라져요. 꽃을 소모 재료로 세지 않아요.'] };
  const machine = MACHINE_BY_ID[g.machine];
  const blocked = !(life.farmx?.machines ?? []).some((m) => m.kind === g.machine);
  if (blocked) warnings.push(`${machine.name}를 먼저 배치해야 해요.`);
  const alternatives = Object.entries(DAIRY_BIG).filter(([, small]) => small === g.from).map(([big]) => big);
  return { key, id: g.id, scope: 'goods', count: 1, needs: [{ id: g.from!, n: machine.per, scope: 'bag', ...(alternatives.length ? { alternatives } : {}) }],
    durationMs: Math.round(machine.ms * (1 - Math.min(0.9, mods.machineFast + (alternatives.length ? mods.ranchFast : 0)))), warnings, blocked };
}

type Lot = { id: string; q: Quality; n: number; scope: Scope; source: CraftAllocation['source']; production?: CraftProduction };
const materialScope = (m: Material): Scope => m.scope === 'bag' && !(CROPS as string[]).includes(m.id) && m.id !== 'fruit' && !m.cat ? 'inv' : m.scope;
const materialKey = (m: Material) => `${materialScope(m)}:${m.id}@${m.q ?? 0}`;
const categoryName = { fish: '물고기', bug: '곤충', flower: '꽃', forage: '채집물' };
function matches(lot: Lot, m: Material): boolean {
  if (lot.q < (m.q ?? 0)) return false;
  if (m.cat) return lot.scope === 'inv' && ITEM_BY_ID[lot.id]?.cat === m.cat;
  return lot.scope === materialScope(m) && (lot.id === m.id || !!m.alternatives?.includes(lot.id));
}
function aggregate(rows: CraftMaterial[], keepChildren = false): CraftMaterial[] {
  const map = new Map<string, CraftMaterial>();
  for (const row of rows) {
    const old = map.get(row.key);
    if (!old) map.set(row.key, { ...row, children: keepChildren ? [...row.children] : [], allocations: [...row.allocations], warnings: [...row.warnings] });
    else {
      for (const key of ['required', 'allocated', 'queued', 'planned', 'missing', 'batches'] as const) old[key] += row[key];
      old.allocations.push(...row.allocations); old.warnings = [...new Set([...old.warnings, ...row.warnings])];
      if (keepChildren) old.children.push(...row.children);
    }
  }
  return [...map.values()];
}

/** Account-local calculation, with one shared allocation pool for all pinned goals.
 * Current goal outputs are reserved first so another goal cannot consume them.
 * Planned intermediates and actual queued outputs are distinct from owned stock.
 */
export function craftTracker({ life, balance, targets, actor, now = life.serverNow }: {
  life: LifeView; balance: number; targets: unknown; actor?: number; now?: number;
}): CraftTrackerResult {
  const goals = readCraftTargets(targets), mods = { ...NO_MODS, ...life.growth?.mods };
  const lots: Lot[] = [], add = (id: string, q: Quality, n: number, scope: Scope, source: Lot['source'] = 'bag') => {
    if (count(n)) lots.push({ id, q, n: count(n), scope, source });
  };
  for (const crop of CROPS) {
    const silver = count(life.me.quality?.silver?.[crop]), gold = count(life.me.quality?.gold?.[crop]), star = count(life.me.quality?.star?.[crop]);
    add(crop, 0, count(life.me.bag.produce[crop]) - silver - gold - star, 'bag');
    add(crop, 1, silver, 'bag'); add(crop, 2, gold, 'bag'); add(crop, 3, star, 'bag');
  }
  add('fruit', 0, life.me.bag.fruit, 'bag');
  for (const [id, n] of Object.entries(life.me.inv ?? {})) add(id, 0, n, 'inv');
  for (const [id, n] of Object.entries(life.me.furniture ?? {})) add(id, 0, n, 'furniture', 'private');
  for (const s of life.farmx?.goods ?? []) add(s.id, s.q, s.n, 'goods', 'private');
  add('beom', 0, balance, 'inv');
  const original = lots.map((l) => ({ ...l }));
  const production: CraftProduction[] = (life.farmx?.machines ?? []).flatMap((m) => {
    if (!m.out || !Number.isFinite(m.doneAt) || !count(m.n)) return [];
    const p = { slot: m.slot, id: m.out, name: goodDefs().find((g) => g.id === m.out)?.name ?? nameOf(m.out), quality: m.q ?? 0,
      quantity: count(m.n), allocated: 0, readyAt: m.doneAt!, remainingMs: Math.max(0, m.doneAt! - now), ready: m.doneAt! <= now };
    // Only artisan outputs go to private goods. Seed outputs do not become bag items here.
    if (isGoodId(m.out)) lots.push({ id: m.out, q: m.q ?? 0, n: count(m.n), scope: 'goods', source: 'production', production: p });
    return [p];
  });
  const candidateSort = (m: Material) => (a: Lot, b: Lot) =>
    (m.cat ? (ITEM_BY_ID[a.id]?.sell ?? 0) - (ITEM_BY_ID[b.id]?.sell ?? 0) || a.id.localeCompare(b.id) : a.q - b.q)
    || (a.production?.readyAt ?? 0) - (b.production?.readyAt ?? 0);
  function allocate(m: Material, n: number, source: 'owned' | 'production' | 'plan'): CraftAllocation[] {
    const rows: CraftAllocation[] = [];
    for (const lot of lots.filter((l) => matches(l, m) && (source === 'owned' ? l.source === 'bag' || l.source === 'private' : l.source === source)).sort(candidateSort(m))) {
      const used = Math.min(n, lot.n);
      if (!used) continue;
      lot.n -= used; n -= used;
      if (lot.production) lot.production.allocated += used;
      rows.push({ id: lot.id, quality: lot.q, quantity: used, source: lot.source, ...(lot.production ? { readyAt: lot.production.readyAt, slot: lot.production.slot } : {}) });
      if (!n) break;
    }
    return rows;
  }
  const sum = (a: CraftAllocation[]) => a.reduce((n, row) => n + row.quantity, 0);
  const allRows: CraftMaterial[] = [], rawRows: CraftMaterial[] = [];
  function expandNeeds(r: PlanRecipe, batches: number, trail: string[]): CraftMaterial[] {
    // A recipe can name a fish and also accept any fish (꽃게탕). The server
    // alternates these per batch; reserving every named fish first is incorrect.
    const overlap = r.needs.some((a) => a.cat && r.needs.some((b) => !b.cat && ITEM_BY_ID[b.id]?.cat === a.cat));
    return overlap ? aggregate(Array.from({ length: batches }, () => r.needs.map((need) => node(need, need.n, trail))).flat(), true)
      : r.needs.map((need) => node(need, need.n * batches, trail));
  }
  function node(m: Material, n: number, trail: string[]): CraftMaterial {
    const snapshot = original.filter((l) => matches(l, m));
    const allocations = allocate(m, n, 'owned'), allocated = sum(allocations);
    const queue = allocate(m, n - allocated, 'production'), queued = sum(queue);
    const surplus = allocate(m, n - allocated - queued, 'plan'), planned = sum(surplus);
    const missing = n - allocated - queued - planned;
    const shared = (life.farmSites?.store ?? []).filter((s) => s.q >= (m.q ?? 0) && (s.id === m.id || !!m.alternatives?.includes(s.id)))
      .reduce((n, s) => n + count(s.n), 0);
    const row: CraftMaterial = { key: materialKey(m), id: m.id, name: m.cat ? `아무 ${categoryName[m.cat]}` : nameOf(m.id), scope: materialScope(m), quality: m.q ?? 0,
      required: n, owned: snapshot.reduce((n, l) => n + l.n, 0), bag: snapshot.filter((l) => l.source === 'bag').reduce((n, l) => n + l.n, 0),
      private: snapshot.filter((l) => l.source === 'private').reduce((n, l) => n + l.n, 0), shared,
      allocated, queued, planned, missing, batches: 0, allocations: [...allocations, ...queue, ...surplus], children: [], warnings: [] };
    allRows.push(row);
    if (!missing) return row;
    const candidate = !m.cat && (m.q ?? 0) === 0
      ? CRAFTS.find((r) => r.makes === m.id && (materialScope(m) === 'inv' || materialScope(m) === 'furniture'))
        ?? DISHES.find((r) => r.makes === m.id && materialScope(m) === 'inv') : undefined;
    const kind = candidate && (Object.hasOwn(CRAFT_BY_ID, candidate.id) ? 'craft' : 'cook');
    const r = candidate && kind ? recipeFor({ kind, id: candidate.id }, life, mods)
      : !m.cat && (m.q ?? 0) === 0 && materialScope(m) === 'inv' && farmRecipe(m.id)
        ? recipeFor({ kind: 'farm', id: m.id }, life, mods) : null;
    if (!r || r.scope !== materialScope(m) || trail.includes(r.key) || trail.length >= 16) {
      if (r && (trail.includes(r.key) || trail.length >= 16)) row.warnings.push('재료 조합이 순환하여 여기서 계산을 멈췄어요.');
      rawRows.push(row); return row;
    }
    row.batches = Math.ceil(missing / r.count); row.warnings.push(...r.warnings);
    row.children = expandNeeds(r, row.batches, [...trail, r.key]);
    const extra = row.batches * r.count - missing;
    if (extra) add(r.id, 0, extra, r.scope, 'plan');
    return row;
  }
  const reserved = goals.map((target) => {
    const o = output(target), owned = outputHave(life, target, actor);
    if (o.scope !== 'facility') allocate({ id: o.id, n: 0, scope: o.scope }, Math.min(target.quantity, owned), 'owned');
    return owned;
  });
  const plans = goals.map((target, index): CraftTargetPlan => {
    const owned = reserved[index], missing = Math.max(0, target.quantity - owned), o = output(target);
    const queue = allocate({ id: o.id, n: 0, scope: o.scope }, missing, 'production'), queued = sum(queue), toProduce = missing - queued;
    const r = recipeFor(target, life, mods), batches = r ? Math.ceil(toProduce / r.count) : 0;
    const rawStart = rawRows.length;
    const requirements = toProduce && r ? expandNeeds(r, batches, [r.key]) : [];
    if (r && r.scope !== 'facility' && batches * r.count > toProduce) add(r.id, 0, batches * r.count - toProduce, r.scope, 'plan');
    const warnings = [...(toProduce ? r?.warnings ?? [] : [])];
    if (target.kind === 'facility' && FACILITY_BY_ID[target.id]?.owner === 'personal' && actor === undefined) warnings.push('개인 시설 소유자를 확인하려면 내 캐릭터 정보가 필요해요.');
    if (toProduce && target.kind === 'good' && r?.durationMs) warnings.push('새 가공의 완료 시각은 기계에 직접 넣은 뒤 확인해요.');
    const relevant = new Set(queue.map((q) => q.slot));
    const walk = (row: CraftMaterial): void => { row.allocations.forEach((a) => { if (a.slot !== undefined) relevant.add(a.slot); }); row.children.forEach(walk); };
    requirements.forEach(walk);
    return { target, key: craftTargetKey(target), name: craftTargetOptions().find((o) => o.kind === target.kind && o.id === target.id)?.name ?? target.id,
      owned, missing, complete: !missing, queued, toProduce, batches,
      ready: !!toProduce && !!r?.needs.length && !r.blocked && requirements.every((row) => row.allocated >= row.required),
      requirements, raw: aggregate(rawRows.slice(rawStart)), production: production.filter((p) => relevant.has(p.slot)), warnings };
  });
  return { targets: plans, totals: aggregate(allRows), raw: aggregate(rawRows), production };
}
