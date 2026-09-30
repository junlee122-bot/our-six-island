// Stage 2 of the village expansion: when ② 항구 구역 and ③ 언덕 주택가 open
// (handover/design/design-npcs-stage2.md §1). Server-authoritative and
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
//
// Cycle-safe like lounge-life-plus: bindings of the life modules are used
// only inside functions.
import { FISH_BY_ID } from './lounge-items.ts';
import { WALKING_NPCS, type WalkingNpcId } from './lounge-npc-data.ts';
import { DISTRICTS, DISTRICT_FLAG, districtRuleMet, type DistrictCtx, type DistrictId } from './lounge-districts.ts';
import { addMemory, addNews, hasFlag } from './lounge-life-plus.ts';
import type { LifeState } from './lounge-life.ts';

/** Districts stage 2 opens by a goal (the others are open from the start or not built). */
export const GOAL_DISTRICTS = ['harbor', 'hillside'] as const satisfies readonly DistrictId[];
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
/** Everything the district rules read, from the saved world. */
export function districtCtx(life: Pick<LifeState, 'ext' | 'museum' | 'flags'>): DistrictCtx {
  return { flags: [...(life.flags ?? [])], fishSpecies: museumFishSpecies(life), residentFriends: closeResidents(life).length };
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
  /** Districts I can walk into now. */
  open: DistrictId[];
  /** Goal progress for the gate signs. */
  goals: Record<GoalDistrict, { have: number; need: number; open: boolean }>;
  /** Which stage-1 residents count toward 언덕 (names shown on the sign). */
  close: WalkingNpcId[];
};
export function districtsView(life: LifeState): DistrictsView {
  const ctx = districtCtx(life);
  const hill = DISTRICTS.hillside.unlock,
    harbor = DISTRICTS.harbor.unlock;
  const flagged = (id: GoalDistrict) => hasFlag(life, DISTRICT_FLAG[id]!);
  return {
    open: (['market', ...GOAL_DISTRICTS.filter(flagged)] as DistrictId[]),
    goals: {
      harbor: { have: ctx.fishSpecies ?? 0, need: harbor.kind === 'fish' ? harbor.species : 0, open: flagged('harbor') },
      hillside: { have: ctx.residentFriends ?? 0, need: hill.kind === 'residents' ? hill.count : 0, open: flagged('hillside') },
    },
    close: closeResidents(life),
  };
}
