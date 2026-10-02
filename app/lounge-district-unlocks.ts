// When the districts open: stage 2's ② 항구 구역 and ③ 언덕 주택가
// (handover/design/design-npcs-stage2.md §1) and stage 3's ④ 목장·과수원 and
// ⑤ 산기슭 마을 (design-npcs-stage3.md §1). Server-authoritative and
// migration-safe: the goal is computed from data every world already keeps
// (the museum's first donations, every friend's resident relations), and the
// moment it is met the server records a village flag ('district-harbor',
// 'district-hillside' in world.life.flags). A recorded district never closes
// again, even if the numbers behind it change. Older worlds without the flag
// simply open on the next action once their numbers qualify.
//
//   ② 항구: 12 different fish species donated to the museum (any friend).
//   ③ 언덕: some friend is 친한 사이 (친밀도 ≥ 20, the 친구 level) with at
//           least three of the six 시장 거리 residents — the 이사 event.
//   ④ 목장·과수원: the village research V4 들길 개간 ('orchardHill') is done
//           (its flag in life.flags) — design-npcs-stage3.md §1.
//   ⑤ 산기슭 마을: some friend has reached mine floor 10.
//
// Cycle-safe like lounge-life-plus: bindings of the life modules are used
// only inside functions.
import { FISH_BY_ID } from './lounge-items.ts';
import { WALKING_NPCS, type WalkingNpcId } from './lounge-npc-data.ts';
import { DISTRICTS, DISTRICT_FLAG, districtRuleMet, type DistrictCtx, type DistrictId } from './lounge-districts.ts';
import { addMemory, addNews, hasFlag } from './lounge-life-plus.ts';
import type { LifeState } from './lounge-life.ts';
import { hasExplorerPass } from './lounge-explorer-pass.ts';

/** Districts that open by a goal (시장 거리 is open from the start). */
export const GOAL_DISTRICTS = ['harbor', 'hillside', 'ranch', 'foothill'] as const satisfies readonly DistrictId[];
export type GoalDistrict = (typeof GOAL_DISTRICTS)[number];

/** Different fish species the museum shows (first donations). */
export function museumFishSpecies(life: Pick<LifeState, 'museum'>): number {
  let n = 0;
  for (const id of Object.keys(life.museum ?? {})) if (Object.prototype.hasOwnProperty.call(FISH_BY_ID, id)) n++;
  return n;
}
const residentPoints = () => {
  const u = DISTRICTS.hillside.unlock;
  return u.kind === 'residents' ? u.points : 20;
};
/** Stage-1 residents some friend is 친한 사이 with (their best friend's points). */
export function closeResidents(life: Pick<LifeState, 'ext'>): WalkingNpcId[] {
  const need = residentPoints();
  const out: WalkingNpcId[] = [];
  for (const npc of WALKING_NPCS)
    if (Object.values(life.ext ?? {}).some((x) => (x?.npcRelations?.[npc]?.points ?? 0) >= need)) out.push(npc);
  return out;
}
/** The deepest mine floor any friend has reached (growth.u[uid].mine.deep). */
export function villageMineDeep(life: Pick<LifeState, 'growth'>): number {
  let deep = 0;
  for (const u of Object.values(life.growth?.u ?? {})) deep = Math.max(deep, u?.mine?.deep ?? 0);
  return deep;
}
/** Everything the district rules read, from the saved world. */
export function districtCtx(life: Pick<LifeState, 'ext' | 'museum' | 'flags' | 'growth'>): DistrictCtx {
  const flags = [...(life.flags ?? [])];
  return { flags, fishSpecies: museumFishSpecies(life), residentFriends: closeResidents(life).length, mineDeep: villageMineDeep(life), research: flags };
}

/** The one-time lines when a district opens (news + a shared memory). */
export const DISTRICT_OPEN_LINES: Record<GoalDistrict, { news: string; banner: string }> = {
  harbor: {
    news: '박물관 물고기가 12종이 됐어요. 둑길 끝 항구 구역이 열렸어요',
    banner: '둑길이 열렸어요. 남동쪽 항구 구역에 어시장과 등대가 생겼어요.',
  },
  hillside: {
    news: '시장 거리 주민들이 언덕 주택가로 이사했어요. 서쪽 계단이 열렸어요',
    banner: '이사 날이에요. 주민들이 언덕 주택가에 집을 얻었고, 이제 밤이면 언덕 집으로 퇴근해요.',
  },
  ranch: {
    news: '들길 개간이 끝났어요. 북동쪽 들길 너머 목장·과수원이 열렸어요',
    banner: '들길이 열렸어요. 닐라의 목장과 하쿠의 과수원에서 동물과 과일나무를 기를 수 있어요.',
  },
  foothill: {
    news: '광산 10층까지 길이 났어요. 북쪽 산길 너머 산기슭 마을이 열렸어요',
    banner: '산길이 열렸어요. 오른의 대장간과 메르시 의원이 문을 열었고, 주말엔 점집도 서요.',
  },
};

/**
 * Records every district whose goal is met but not yet flagged. Runs on a
 * cloned life after each life action (lounge-life.ts lifeAction). Returns
 * the districts opened just now. Never touches the ledger.
 */
export function settleDistrictUnlocks(life: LifeState, now: number): GoalDistrict[] {
  const opened: GoalDistrict[] = [];
  let ctx: DistrictCtx | null = null;
  for (const id of GOAL_DISTRICTS) {
    const flag = DISTRICT_FLAG[id]!;
    if (hasFlag(life, flag)) continue;
    ctx ??= districtCtx(life);
    if (!districtRuleMet(id, ctx)) continue;
    (life.flags ??= []).push(flag);
    opened.push(id);
    const line = DISTRICT_OPEN_LINES[id];
    addNews(life, now, `district:${id}`, 'bundle', line.news, []);
    addMemory(life, now, 'district', [], line.news);
  }
  return opened;
}

export type DistrictsView = {
  /** Districts I can walk into now (the village's, or all built ones with the explorer pass). */
  open: DistrictId[];
  /** 승준's temporary explorer pass (lounge-explorer-pass.ts). */
  pass: boolean;
  /** Goal progress for the gate signs. */
  goals: Record<GoalDistrict, { have: number; need: number; open: boolean }>;
  /** Which stage-1 residents count toward 언덕 (names shown on the sign). */
  close: WalkingNpcId[];
};
export function districtsView(life: LifeState, actor?: number, now = 0): DistrictsView {
  const ctx = districtCtx(life);
  const pass = hasExplorerPass(actor, now);
  const hill = DISTRICTS.hillside.unlock,
    harbor = DISTRICTS.harbor.unlock,
    foot = DISTRICTS.foothill.unlock;
  const flagged = (id: GoalDistrict) => hasFlag(life, DISTRICT_FLAG[id]!);
  return {
    open: ['market', ...GOAL_DISTRICTS.filter((id) => pass || flagged(id))] as DistrictId[],
    pass,
    goals: {
      harbor: { have: ctx.fishSpecies ?? 0, need: harbor.kind === 'fish' ? harbor.species : 0, open: flagged('harbor') },
      hillside: { have: ctx.residentFriends ?? 0, need: hill.kind === 'residents' ? hill.count : 0, open: flagged('hillside') },
      // The research is done (1) or not (0).
      ranch: { have: districtRuleMet('ranch', ctx) ? 1 : 0, need: 1, open: flagged('ranch') },
      foothill: { have: ctx.mineDeep ?? 0, need: foot.kind === 'mine' ? foot.floor : 0, open: flagged('foothill') },
    },
    close: closeResidents(life),
  };
}

