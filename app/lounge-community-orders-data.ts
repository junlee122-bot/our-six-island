// Weekly community orders: immutable leaf data, shared by server and UI.
// No life-engine imports. Canonical ids/names are checked against live catalogs
// by lounge-community-orders-data.test.mjs; never change an existing versioned
// order's needs/reward after release. Add a new id for a changed contract.

export type CommunityOrderDifficulty = 'easy' | 'normal' | 'hard';
export type CommunityOrderItemKind = 'crop' | 'fish' | 'good';
export type CommunityOrderNeed = { readonly item: string; readonly n: number; readonly q?: 0 | 1 | 2 | 3 };
export type CommunityOrderReward = { readonly furniture: string; readonly label: string };
export type CommunityOrderDef = {
  readonly id: string;
  readonly difficulty: CommunityOrderDifficulty;
  readonly title: string;
  readonly note: string;
  readonly needs: readonly CommunityOrderNeed[];
  readonly reward: CommunityOrderReward;
  /** A placed personal jar anywhere in the village, not a shared facility.
   * The engine checks this when choosing; later pickup never erases progress.
   */
  readonly gate?: { readonly machine: 'jar' };
};
export const COMMUNITY_ORDER_DIFFICULTY: Readonly<Record<CommunityOrderDifficulty, string>> = Object.freeze({
  easy: '가볍게 모으기', normal: '함께 준비하기', hard: '차근차근 가공하기',
});
export const COMMUNITY_ORDER_GATE_NOTE = '마을에 옹기 한 대를 먼저 배치해야 해요. 공용 가공 마당은 없어도 돼요.';

// Only the four starter crops (no season/flag/skill requirement), two common
// all-season/any-weather/any-time river/pond fish, and jar products of those
// starter crops. No greenhouse, sea bridge, specialist rod, rare spawn or
// holiday-dependent supply. Thus the same candidates remain feasible during
// winter and holiday season overrides without changing a chosen order's ids.
const ORDER_ITEMS: Readonly<Record<string, { readonly name: string; readonly kind: CommunityOrderItemKind }>> = Object.freeze({
  carrot: Object.freeze({ name: '당근', kind: 'crop' }),
  tomato: Object.freeze({ name: '토마토', kind: 'crop' }),
  pumpkin: Object.freeze({ name: '호박', kind: 'crop' }),
  strawberry: Object.freeze({ name: '딸기', kind: 'crop' }),
  crucian: Object.freeze({ name: '붕어', kind: 'fish' }),
  goldfish: Object.freeze({ name: '금붕어', kind: 'fish' }),
  'jar-carrot': Object.freeze({ name: '당근 장아찌', kind: 'good' }),
  'jar-tomato': Object.freeze({ name: '토마토 절임', kind: 'good' }),
  'jar-pumpkin': Object.freeze({ name: '호박 장아찌', kind: 'good' }),
  'jar-strawberry': Object.freeze({ name: '딸기 잼', kind: 'good' }),
});
export const communityOrderItemName = (item: string): string =>
  Object.hasOwn(ORDER_ITEMS, item) ? ORDER_ITEMS[item].name : '알 수 없는 품목';
export const communityOrderItemKind = (item: string): CommunityOrderItemKind | null =>
  Object.hasOwn(ORDER_ITEMS, item) ? ORDER_ITEMS[item].kind : null;
/** A good is collected into my private artisan store; all other needs use my bag.
 * Shared crops require an explicit source/consent in the engine and UI.
 */
export const communityOrderItemSource = (item: string): 'bag' | 'private' =>
  communityOrderItemKind(item) === 'good' ? 'private' : 'bag';

const order = (def: CommunityOrderDef): CommunityOrderDef => Object.freeze({
  ...def, needs: Object.freeze(def.needs.map((need) => Object.freeze({ ...need }))),
  reward: Object.freeze({ ...def.reward }), ...(def.gate ? { gate: Object.freeze({ ...def.gate }) } : {}),
});
/** One easy crop order needs at most eighteen plots, below the initial 24.
 * Normal orders need at most eight common fish and do not require a sea unlock.
 * Hard orders use exactly four jar batches: 64 real hours in one unmodified jar,
 * against a 168-hour KST week. No assumed machine speed/double-output perk.
 * Rewards are existing decorative furniture only: no 범, sale multiplier, skill
 * XP or rare festival/project-exclusive prize. Completion memories use the
 * existing album in the engine; a new generated photo asset is unnecessary.
 */
export const COMMUNITY_ORDER_POOL: readonly CommunityOrderDef[] = Object.freeze([
  order({
    id: 'neighbor-basket-v1', difficulty: 'easy', title: '이웃에게 보낼 작은 수확 상자',
    note: '사계절 자라는 당근과 토마토를 조금씩 모아요. 처음 밭만으로도 혼자 준비할 수 있어요.',
    needs: [{ item: 'carrot', n: 12 }, { item: 'tomato', n: 6 }],
    reward: { furniture: 'furn-plant', label: '꽃 화분 한 개' },
  }),
  order({
    id: 'warm-soup-basket-v1', difficulty: 'easy', title: '따뜻한 수프의 재료 상자',
    note: '당근과 호박을 이웃 부엌에 보내요. 요리를 직접 만들 필요는 없고 계절도 상관없어요.',
    needs: [{ item: 'carrot', n: 8 }, { item: 'pumpkin', n: 4 }],
    reward: { furniture: 'furn-rug', label: '체크 피크닉 매트 한 개' },
  }),
  order({
    id: 'red-harvest-basket-v1', difficulty: 'easy', title: '빨갛게 익은 수확 나눔',
    note: '토마토와 당근을 한 상자에 담아요. 계절 작물이나 공용 시설을 기다릴 필요가 없어요.',
    needs: [{ item: 'tomato', n: 8 }, { item: 'carrot', n: 6 }],
    reward: { furniture: 'instant-camera', label: '즉석 카메라 한 개' },
  }),
  order({
    id: 'river-picnic-v1', difficulty: 'normal', title: '강가 소풍을 위한 한 상자',
    note: '강이나 연못에서 붕어를 낚고 당근을 곁들여요. 기본 낚싯대로 낮밤이나 날씨를 가리지 않고 준비해요.',
    needs: [{ item: 'crucian', n: 6 }, { item: 'carrot', n: 8 }],
    reward: { furniture: 'furn-bench', label: '산책길 벤치 한 개' },
  }),
  order({
    id: 'pond-neighbor-v1', difficulty: 'normal', title: '연못 이웃들의 작은 잔치',
    note: '연못의 금붕어와 붕어, 밭의 토마토를 모아요. 바다 다리나 희귀 물고기는 필요 없어요.',
    needs: [{ item: 'goldfish', n: 3 }, { item: 'crucian', n: 4 }, { item: 'tomato', n: 4 }],
    reward: { furniture: 'photo-string', label: '추억 사진 줄 한 개' },
  }),
  order({
    id: 'waterside-table-v1', difficulty: 'normal', title: '물가에서 나누는 저녁 준비',
    note: '흔한 물고기와 사계절 호박을 나눠 준비해요. 동시에 접속하지 않아도 각자 조금씩 보탤 수 있어요.',
    needs: [{ item: 'crucian', n: 5 }, { item: 'goldfish', n: 2 }, { item: 'pumpkin', n: 3 }],
    reward: { furniture: 'furn-table', label: '원목 식탁 한 개' },
  }),
  order({
    id: 'jar-pantry-v1', difficulty: 'hard', title: '이웃 찬장을 채우는 장아찌',
    note: '옹기에 당근과 토마토를 두 번씩 넣고, 생당근도 보태요. 기본 옹기 한 대라면 가공 네 번에 실제 예순네 시간이 걸려요.',
    needs: [{ item: 'jar-carrot', n: 2 }, { item: 'jar-tomato', n: 2 }, { item: 'carrot', n: 8 }],
    reward: { furniture: 'furn-hanging-planter', label: '행잉 플랜트 한 개' }, gate: { machine: 'jar' },
  }),
  order({
    id: 'sweet-preserves-v1', difficulty: 'hard', title: '달고 든든한 저장 선물',
    note: '딸기 잼과 호박 장아찌를 두 병씩 준비해요. 원재료는 사계절 자라고 공용 온실은 필요 없어요.',
    needs: [{ item: 'jar-strawberry', n: 2 }, { item: 'jar-pumpkin', n: 2 }, { item: 'tomato', n: 6 }],
    reward: { furniture: 'furn-bookshelf', label: '이야기 책장 한 개' }, gate: { machine: 'jar' },
  }),
  order({
    id: 'harvest-keepsake-v1', difficulty: 'hard', title: '한 주를 담은 작은 저장 상자',
    note: '당근 장아찌와 딸기 잼, 갓 거둔 호박을 함께 담아요. 가공품은 개인 저장고에서, 호박은 가방에서 꺼내요.',
    needs: [{ item: 'jar-carrot', n: 1 }, { item: 'jar-strawberry', n: 3 }, { item: 'pumpkin', n: 3 }],
    reward: { furniture: 'photo-string', label: '추억 사진 줄 한 개' }, gate: { machine: 'jar' },
  }),
]);

/** week = floor((kstDay + 3) / 7), the existing Monday-based village week.
 * Each week has exactly one candidate at each difficulty, independent of who
 * opens the board and of later village unlocks. Gate reasons belong to the view.
 */
export function communityOrderCandidates(week: number): readonly CommunityOrderDef[] {
  if (!Number.isSafeInteger(week)) return [];
  const rotation = ((week % 3) + 3) % 3;
  return (['easy', 'normal', 'hard'] as const).map((difficulty) =>
    COMMUNITY_ORDER_POOL.filter((def) => def.difficulty === difficulty)[rotation]);
}
export function communityOrderById(week: number, id: string): CommunityOrderDef | undefined {
  return communityOrderCandidates(week).find((def) => def.id === id);
}
/** Restore an already chosen version even when future rotations stop offering
 * it. Choosing a new order must still use communityOrderById(week, id).
 */
export function communityOrderDefinition(id: string): CommunityOrderDef | undefined {
  return COMMUNITY_ORDER_POOL.find((def) => def.id === id);
}
