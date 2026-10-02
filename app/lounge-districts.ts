// The five new districts around the hub (handover/design/design-village-2x-npcs.md
// §2): each one is a separate map behind a gate on the hub's rim, like 뒷산
// behind the north gate. ① 시장 거리 is open from the start; stage 2 builds
// ② 항구 구역 and ③ 언덕 주택가, stage 3 ④ 목장·과수원 and ⑤ 산기슭 마을
// (design-npcs-stage3.md); each opens by a village goal (the server keeps the
// result as a village flag, lounge-district-unlocks.ts) and its gate stands
// locked with a sign that says what will open it. Pure data; the gates are
// in hub (village) coordinates, the maps themselves are regions in
// lounge-areas.ts.

export type DistrictId = 'market' | 'harbor' | 'hillside' | 'ranch' | 'foothill';
export const DISTRICT_IDS: readonly DistrictId[] = ['market', 'harbor', 'hillside', 'ranch', 'foothill'];
export const isDistrictId = (a: unknown): a is DistrictId => typeof a === 'string' && (DISTRICT_IDS as readonly string[]).includes(a);

/** How a district opens (design doc §2 "구역 해금"). */
export type DistrictUnlock =
  | { kind: 'open' }
  /**
   * A village-wide donation goal: this many different fish species donated
   * to the museum (first donations, any friend).
   */
  | { kind: 'fish'; species: number }
  /**
   * "친한 사이" with this many of the stage-1 residents: some friend (any
   * friend) has at least `points` with each of them (lounge-npc-data.ts
   * NPC_INVITE_POINTS, the 친구 level).
   */
  | { kind: 'residents'; count: number; points: number }
  /** A research project (P3 orchard/ranch). */
  | { kind: 'research'; project: string }
  /** Reaching a mine floor. */
  | { kind: 'mine'; floor: number };

export type DistrictGate = {
  /** The gate post on the rim (village coordinates). */
  x: number;
  z: number;
  /** Where you stand to use it (E). */
  stand: { x: number; z: number };
  reach: number;
  /** The road into it ("큰길", "둑길"…). */
  road: string;
  /** Which way the gate faces into the hub (radians about y; 0 = +z). */
  rot: number;
};
export type District = {
  id: DistrictId;
  no: 1 | 2 | 3 | 4 | 5;
  name: string;
  tagline: string;
  /** Map size (world units), as planned. */
  size: { w: number; d: number };
  stage: 1 | 2 | 3;
  gate: DistrictGate;
  unlock: DistrictUnlock;
  /** What the locked sign says. */
  hint: string;
};

export const DISTRICTS: Record<DistrictId, District> = {
  market: {
    id: 'market',
    no: 1,
    name: '시장 거리',
    tagline: '농협 · 잡화점 · 빵집 카페 · 신문사 · 증권사 · 우체국 · 파출소',
    size: { w: 56, d: 44 },
    stage: 1,
    gate: { x: 55.3, z: -5, stand: { x: 53.6, z: -5 }, reach: 1.9, road: '큰길', rot: -Math.PI / 2 },
    unlock: { kind: 'open' },
    hint: '큰길을 따라 동쪽으로 가면 시장 거리예요.',
  },
  harbor: {
    id: 'harbor',
    no: 2,
    name: '항구 구역',
    tagline: '어시장 · 낚시조합 · 큰 선착장 · 등대',
    size: { w: 60, d: 40 },
    stage: 2,
    gate: { x: 46, z: 43.4, stand: { x: 46, z: 42.2 }, reach: 1.9, road: '둑길', rot: Math.PI },
    unlock: { kind: 'fish', species: 12 },
    hint: '박물관에 물고기 12종을 기증하면 둑길이 열려요.',
  },
  hillside: {
    id: 'hillside',
    no: 3,
    name: '언덕 주택가',
    tagline: '주민 집 · 작은 공원 · 도서관',
    size: { w: 50, d: 50 },
    stage: 2,
    gate: { x: -55.3, z: -3, stand: { x: -53.6, z: -3 }, reach: 1.9, road: '계단', rot: Math.PI / 2 },
    // 친한 사이 = 친밀도 20 (the 친구 level, NPC_INVITE_POINTS).
    unlock: { kind: 'residents', count: 3, points: 20 },
    hint: '시장 거리 주민 세 명과 친한 사이가 되면 언덕 계단이 열려요.',
  },
  ranch: {
    id: 'ranch',
    no: 4,
    name: '목장·과수원',
    tagline: '닐라 목장 · 강물 과수원 · 개울과 원두막',
    size: { w: 60, d: 50 },
    stage: 3,
    gate: { x: 40, z: -43.4, stand: { x: 40, z: -42 }, reach: 1.9, road: '들길', rot: 0 },
    // The village research 'orchardHill' (V4 들길 개간, lounge-growth-data.ts RESEARCH).
    unlock: { kind: 'research', project: 'orchardHill' },
    hint: '마을 개척 연구 “들길 개간”을 마치면 들길이 열려요.',
  },
  foothill: {
    id: 'foothill',
    no: 5,
    name: '산기슭 마을',
    tagline: '오른의 대장간 · 메르시 의원 · 광산 입구 · 점집',
    size: { w: 50, d: 44 },
    stage: 3,
    gate: { x: -20, z: -43.4, stand: { x: -20, z: -42 }, reach: 1.9, road: '산길', rot: 0 },
    unlock: { kind: 'mine', floor: 10 },
    hint: '광산 10층까지 내려가 보면 산길이 열려요.',
  },
};

/** Districts with a map (stage 2 adds the harbor and the hillside, stage 3 the ranch and the foothill). */
export const BUILT_DISTRICTS: readonly DistrictId[] = ['market', 'harbor', 'hillside', 'ranch', 'foothill'];
export const districtBuilt = (id: DistrictId) => BUILT_DISTRICTS.includes(id);
/**
 * The village flag (world.life.flags) the server sets the moment a
 * district's goal is reached; once set it never closes again.
 */
export const DISTRICT_FLAG: Partial<Record<DistrictId, string>> = {
  harbor: 'district-harbor',
  hillside: 'district-hillside',
  ranch: 'district-ranch',
  foothill: 'district-foothill',
};

export type DistrictCtx = {
  /** Village flags (the server's record of opened districts). */
  flags?: readonly string[];
  /** 승준's temporary explorer pass (lounge-explorer-pass.ts): every district is open for him. */
  pass?: boolean;
  /** Different fish species in the museum. */
  fishSpecies?: number;
  /** Stage-1 residents some friend is 친한 사이 with. */
  residentFriends?: number;
  /** The deepest mine floor any friend has reached. */
  mineDeep?: number;
  /** Finished village research (their flags). */
  research?: readonly string[];
};
/** Whether a district's rule is met right now (the goal itself, not the flag). */
export function districtRuleMet(id: DistrictId, ctx: DistrictCtx): boolean {
  const u = DISTRICTS[id].unlock;
  switch (u.kind) {
    case 'open':
      return true;
    case 'fish':
      return (ctx.fishSpecies ?? 0) >= u.species;
    case 'residents':
      return (ctx.residentFriends ?? 0) >= u.count;
    case 'research':
      return !!ctx.research?.includes(u.project);
    case 'mine':
      return (ctx.mineDeep ?? 0) >= u.floor;
  }
}
/**
 * Whether I can walk in: built, and open from the start or opened (the
 * village flag). A rule met but not yet recorded counts only on the server,
 * which records it on the next action (lounge-district-unlocks.ts).
 */
export function districtOpen(id: DistrictId, ctx: DistrictCtx = {}): boolean {
  if (!districtBuilt(id)) return false;
  if (DISTRICTS[id].unlock.kind === 'open' || ctx.pass) return true;
  const flag = DISTRICT_FLAG[id];
  return !!flag && !!ctx.flags?.includes(flag);
}
/** Progress toward a district's goal for the gate sign ("물고기 7/12종"). */
export function districtGoalText(id: DistrictId, ctx: DistrictCtx): string {
  const u = DISTRICTS[id].unlock;
  switch (u.kind) {
    case 'fish':
      return `박물관 물고기 ${Math.min(u.species, ctx.fishSpecies ?? 0)}/${u.species}종`;
    case 'residents':
      return `친한 주민 ${Math.min(u.count, ctx.residentFriends ?? 0)}/${u.count}명`;
    case 'mine':
      return `광산 ${Math.min(u.floor, ctx.mineDeep ?? 0)}/${u.floor}층`;
    case 'research':
      return ctx.research?.includes(u.project) ? '연구 완료' : '연구 전';
    case 'open':
      return '';
  }
}

/**
 * Village flags as one friend's rules see them: with the explorer pass the
 * built districts count as opened (their fishing spots, auction, stalls,
 * reading club), without changing the village's own record.
 */
export function districtFlagsFor(flags: readonly string[] | undefined, pass: boolean): string[] {
  const out = [...(flags ?? [])];
  if (pass) for (const id of BUILT_DISTRICTS) {
    const f = DISTRICT_FLAG[id];
    if (f && !out.includes(f)) out.push(f);
  }
  return out;
}

/** 친구에게 가기 signpost in the hub, beside the plaza board (hub coordinates). */
export const HUB_SIGNPOST = { x: 6.5, z: 5.6, reach: 1.3 } as const;

/** Start fetching a district's models when the player comes this close to its gate. */
export const DISTRICT_PREFETCH_RADIUS = 10;
export const gateDistance = (id: DistrictId, p: { x: number; z: number }) =>
  Math.hypot(p.x - DISTRICTS[id].gate.stand.x, p.z - DISTRICTS[id].gate.stand.z);
/** The nearest gate within its reach (or the prefetch radius with `radius`). */
export function nearestDistrictGate(p: { x: number; z: number }, radius?: number): { id: DistrictId; distance: number } | null {
  let best: { id: DistrictId; distance: number } | null = null;
  for (const id of DISTRICT_IDS) {
    const d = gateDistance(id, p);
    if (d <= (radius ?? DISTRICTS[id].gate.reach) && (!best || d < best.distance)) best = { id, distance: d };
  }
  return best;
}

/** "박물관 물고기 7/12종" — a locked gate's progress line from the life view's goals (lounge-district-unlocks.ts). */
export function goalProgressText(id: DistrictId, goals: Partial<Record<DistrictId, { have: number; need: number }>>): string {
  const g = goals[id];
  if (!g) return '';
  switch (id) {
    case 'harbor':
      return `박물관 물고기 ${Math.min(g.have, g.need)}/${g.need}종`;
    case 'hillside':
      return `친한 주민 ${Math.min(g.have, g.need)}/${g.need}명`;
    case 'ranch':
      return g.have >= g.need ? '들길 개간 완료' : '들길 개간 연구 전';
    case 'foothill':
      return `광산 ${Math.min(g.have, g.need)}/${g.need}층`;
    case 'market':
      return '';
  }
}
