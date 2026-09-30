// The five new districts around the hub (handover/design/design-village-2x-npcs.md
// §2): each one is a separate map behind a gate on the hub's rim, like 뒷산
// behind the north gate. Stage 1 opens only ① 시장 거리; the other four gates
// stand locked with a sign that says what opens them (the unlock rules are
// kept here as data for the later stages). Pure data; the gates are in hub
// (village) coordinates, the maps themselves are regions in lounge-areas.ts.

export type DistrictId = 'market' | 'harbor' | 'hillside' | 'ranch' | 'foothill';
export const DISTRICT_IDS: readonly DistrictId[] = ['market', 'harbor', 'hillside', 'ranch', 'foothill'];

/** How a district opens (design doc §2 "구역 해금"). */
export type DistrictUnlock =
  | { kind: 'open' }
  /** A village-wide donation goal (the fishing total for the harbor). */
  | { kind: 'bundle'; goal: string }
  /** Friends with this many residents (points ≥ 친구). */
  | { kind: 'residents'; count: number }
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
    tagline: '농협 · 잡화점 · 빵집 카페 · 신문사 · 우체국 · 파출소',
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
    unlock: { kind: 'bundle', goal: 'fishing-total' },
    hint: '마을 공동 낚시 기부를 채우면 둑길이 열려요.',
  },
  hillside: {
    id: 'hillside',
    no: 3,
    name: '언덕 주택가',
    tagline: '주민 집 · 작은 공원 · 도서관',
    size: { w: 50, d: 50 },
    stage: 2,
    gate: { x: -55.3, z: -3, stand: { x: -53.6, z: -3 }, reach: 1.9, road: '계단', rot: Math.PI / 2 },
    unlock: { kind: 'residents', count: 6 },
    hint: '마을 주민 여섯 명과 친구가 되면 언덕 계단이 열려요.',
  },
  ranch: {
    id: 'ranch',
    no: 4,
    name: '목장·과수원',
    tagline: '목장 · 과수원 · 동물병원',
    size: { w: 60, d: 50 },
    stage: 3,
    gate: { x: 40, z: -43.4, stand: { x: 40, z: -42 }, reach: 1.9, road: '들길', rot: 0 },
    unlock: { kind: 'research', project: 'P3' },
    hint: '마을 개척 연구 3단계(과수원·목장)를 마치면 들길이 열려요.',
  },
  foothill: {
    id: 'foothill',
    no: 5,
    name: '산기슭 마을',
    tagline: '대장간 · 의원 · 온천 입구',
    size: { w: 50, d: 44 },
    stage: 3,
    gate: { x: -20, z: -43.4, stand: { x: -20, z: -42 }, reach: 1.9, road: '산길', rot: 0 },
    unlock: { kind: 'mine', floor: 10 },
    hint: '광산 10층까지 내려가 보면 산길이 열려요.',
  },
};

/** Stage 1 builds only 시장 거리; the other gates stay shut whatever their rule says. */
export const BUILT_DISTRICTS: readonly DistrictId[] = ['market'];
export const districtBuilt = (id: DistrictId) => BUILT_DISTRICTS.includes(id);

/** Whether a district's rule is met (for the later stages; stage 1 only builds the market). */
export function districtRuleMet(
  id: DistrictId,
  ctx: { residentFriends?: number; mineDeep?: number; research?: readonly string[]; bundles?: readonly string[] },
): boolean {
  const u = DISTRICTS[id].unlock;
  switch (u.kind) {
    case 'open':
      return true;
    case 'bundle':
      return !!ctx.bundles?.includes(u.goal);
    case 'residents':
      return (ctx.residentFriends ?? 0) >= u.count;
    case 'research':
      return !!ctx.research?.includes(u.project);
    case 'mine':
      return (ctx.mineDeep ?? 0) >= u.floor;
  }
}
export const districtOpen = (id: DistrictId, ctx: Parameters<typeof districtRuleMet>[1] = {}) =>
  districtBuilt(id) && districtRuleMet(id, ctx);

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
