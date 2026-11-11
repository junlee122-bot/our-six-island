// Canonical gathering places. Server-safe leaf metadata: no renderer, life
// engine, coordinates, browser state or automatic activity commands.
export type GatheringActivity = 'fishing' | 'meal' | 'table';
export type GatheringPlaceId =
  | 'river-fishing' | 'pond-fishing' | 'bakery-meal' | 'tavern-meal'
  | 'hall-yacht' | 'hall-liar' | 'casino-chess' | 'tavern-liarsbar';
export type GatheringPlace = {
  readonly id: GatheringPlaceId;
  readonly activity: GatheringActivity;
  readonly label: string;
  readonly area: 'village' | 'bakery' | 'tavern' | 'lounge' | 'casino';
  readonly game?: 'yacht' | 'liar' | 'chess' | 'liarsbar';
  readonly hint: string;
};
export const GATHERING_ACTIVITY_LABEL: Readonly<Record<GatheringActivity, string>> = Object.freeze({
  fishing: '함께 낚시', meal: '함께 식사', table: '테이블 한 판',
});
export const GATHERING_PLACES: readonly GatheringPlace[] = Object.freeze([
  { id: 'river-fishing', activity: 'fishing', label: '마을 강가', area: 'village', hint: '강가에 도착하면 직접 낚싯대를 던져요. 잡히는 물고기는 계절과 날씨에 따라 달라요.' },
  { id: 'pond-fishing', activity: 'fishing', label: '마을 연못', area: 'village', hint: '연못 가장자리에서 직접 낚시를 시작해요. 도착만으로 낚싯대나 미끼를 쓰지 않아요.' },
  { id: 'bakery-meal', activity: 'meal', label: '느긋한 빵집 카페', area: 'bakery', hint: '빵집 카페 계산대에서 각자 음식과 음료를 골라요. 비용과 먹기 효과는 기존 규칙을 따라요.' },
  { id: 'tavern-meal', activity: 'meal', label: '허풍 주점 한 상', area: 'tavern', hint: '주점의 샹크스 앞에서 각자 안주나 음료를 골라요. 모임 참가만으로 음식을 먹거나 범을 쓰지 않아요.' },
  { id: 'hall-yacht', activity: 'table', label: '회관 야추 테이블', area: 'lounge', game: 'yacht', hint: '야추 테이블에서 직접 자리를 고르고 기존 화면으로 판을 열어요. 모임 참가가 좌석을 예약하지는 않아요.' },
  { id: 'hall-liar', activity: 'table', label: '회관 라이어 게임 테이블', area: 'lounge', game: 'liar', hint: '라이어 게임 테이블에서 직접 참여해요. 실제 게임 인원과 시작 여부는 테이블에서 정해요.' },
  { id: 'casino-chess', activity: 'table', label: '카지노 체스 테이블', area: 'casino', game: 'chess', hint: '체스 테이블에서 직접 자리를 고르거나 관전해요. 판의 조건은 기존 테이블 화면에서 확인해요.' },
  { id: 'tavern-liarsbar', activity: 'table', label: '주점 허풍 카드 테이블', area: 'tavern', game: 'liarsbar', hint: '허풍 카드 테이블에서 직접 판에 참여해요. 모임 인원과 실제 착석 인원은 다를 수 있어요.' },
].map((place) => Object.freeze(place as GatheringPlace)));

/** Unknown/free-form locations never become server-authorized meeting places. */
export function gatheringPlace(id: unknown): GatheringPlace | undefined {
  return typeof id === 'string' ? GATHERING_PLACES.find((place) => place.id === id) : undefined;
}
