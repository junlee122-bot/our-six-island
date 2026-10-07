// 기술 트리 재능 (handover/design/design-skill-tree.md §2·§4·§6): eight talents
// per skill, bought with talent points (one at Lv2·4·6·8·10, five at most), so
// a friend reaches six of them and leaves one out. Four are shared from Lv2/4;
// four hang under the two Lv5 professions (two each, Lv6/8). 낚시 has two more
// since 우리 농장 F5 (양식장 지기 · 알 받기, a second Lv8 pick under each
// 갈래): the same five points over seven reachable talents. 운명 다시 보기 at
// 신이치's resets a skill's professions and talents for a doubling price.
//
// A leaf like lounge-growth-data.ts (types and data only). Talents marked
// `farm` need 우리 농장 (tilling, wet soil, machine yard, hay from grass) and
// show locked until it ships; `lock` is the honest reason a talent cannot be
// taken yet. Effects are GrowthMods patches added by lounge-growth.ts.
import { MAX_LEVEL, type GrowthMods, type SkillId } from './lounge-growth-data.ts';

export type TalentDef = {
  id: string;
  skill: SkillId;
  name: string;
  text: string;
  /** Level needed (shared 2/4, branch 6/8). */
  level: 2 | 4 | 6 | 8;
  /** Talent that must be taken first (먼저). */
  after?: string;
  /** Lv5 profession this talent hangs under (갈래). */
  branch?: string;
  mods?: Partial<GrowthMods>;
  /** Opens with 우리 농장 (ⓕ). */
  farm?: true;
  /** Shown but not pickable yet, and why. */
  lock?: string;
};

/** Shown on every ⓕ talent until 우리 농장 ships. */
export const FARM_LOCK = '우리 농장에서 열려요';

const t = (
  id: string,
  skill: SkillId,
  level: TalentDef['level'],
  name: string,
  text: string,
  mods: Partial<GrowthMods> | null,
  extra: Partial<Pick<TalentDef, 'after' | 'branch' | 'farm' | 'lock'>> = {},
): TalentDef => ({
  id,
  skill,
  level,
  name,
  text,
  ...(mods ? { mods } : {}),
  ...extra,
  ...(extra.farm ? { lock: FARM_LOCK } : {}),
});

export const TALENTS: readonly TalentDef[] = [
  // 농사
  t('farm-t1', 'farm', 2, '씨앗 아끼기', '심을 때 8% 확률로 씨앗이 줄지 않아요', { seedKeep: 0.08 }),
  t('farm-t2', 'farm', 2, '촉촉한 흙', '물 준 흙이 하루 더 젖어 있어요', null, { farm: true }),
  t('farm-t3', 'farm', 4, '단단한 손목', '괭이·물뿌리개 범위가 한 단계 넓어요', null, { after: 'farm-t2', farm: true }),
  t('farm-t4', 'farm', 4, '까마귀 쫓기', '까마귀 피해 확률이 절반', { crowGuard: 0.5 }, { after: 'farm-t1' }),
  t('farm-a-t1', 'farm', 6, '덩굴 손질', '덩굴 작물 뒤 칸 그늘 페널티 없음', { noShade: true }, { branch: 'farm-a' }),
  t('farm-a-t2', 'farm', 8, '큰 작물', '대형 작물 확률 ×2', { giantMult: 1 }, { branch: 'farm-a', after: 'farm-a-t1' }),
  t('farm-b-t1', 'farm', 6, '단골 손님', '작물 판매 수요가 덜 빨리 줄어요', { demandCrop: 1 }, { branch: 'farm-b' }),
  t('farm-b-t2', 'farm', 8, '품평회 단골', '품평회 점수 +10%', { fairBonus: 0.1 }, { branch: 'farm-b', after: 'farm-b-t1' }),
  // 낚시
  t('fish-t1', 'fish', 2, '잔잔한 손', '릴 게이지가 10% 천천히 줄어요', { reelEase: 0.1 }),
  t('fish-t2', 'fish', 2, '통발 장인', '통발에서 하나 더 나올 확률 20%', { trapExtra: 0.2 }),
  t('fish-t3', 'fish', 4, '밤낚시', '밤(게임 20~05시) 희귀 물고기 ×1.15', { nightRare: 0.15 }, { after: 'fish-t1' }),
  t('fish-t4', 'fish', 4, '보물 냄새', '보물 상자 확률 ×1.5', { treasure: 0.5 }, { after: 'fish-t2' }),
  t('fish-a-t1', 'fish', 6, '대물 감각', '물고기 크기 기록 +10%', { bigFish: 0.1 }, { branch: 'fish-a' }),
  t('fish-a-t2', 'fish', 8, '바다 체질', '먼바다 뱃멀미 없음, 출항 시간 +1', { seaLegs: true }, { branch: 'fish-a', after: 'fish-a-t1' }),
  t('fish-b-t1', 'fish', 6, '미끼 상인', '미끼를 만들 때 재료 −1', { baitCheap: 1 }, { branch: 'fish-b' }),
  t('fish-b-t2', 'fish', 8, '어시장 흥정', '물고기 판매 수요가 덜 빨리 줄어요', { demandFish: 1 }, { branch: 'fish-b', after: 'fish-b-t1' }),
  // 우리 농장 F5 양식장: one more Lv8 pick under each 갈래 (the points stay five, so one more is left out).
  t('fish-a-t3', 'fish', 8, '양식장 지기', '양식장 물고기 상한 +2', { pondCap: 2 }, { branch: 'fish-a', after: 'fish-a-t1' }),
  t('fish-b-t3', 'fish', 8, '알 받기', '양식장에서 어란이 나올 확률 +20%p', { pondRoe: 20 }, { branch: 'fish-b', after: 'fish-b-t1' }),
  // 채집
  t('forage-t1', 'forage', 2, '산나물 눈', '오늘 채집할 곳을 미니맵에 표시', { forageMap: true }),
  t('forage-t2', 'forage', 2, '벌레잡이', '벌레를 잡을 때 15% 확률로 하나 더', { bugExtra: 0.15 }),
  t('forage-t3', 'forage', 4, '버섯 감별', '버섯·산삼 은별 이상 확률 +10%p', null, { after: 'forage-t1', lock: '채집물에는 아직 별 품질이 없어요 · 생기면 열려요' }),
  t('forage-t4', 'forage', 4, '열매 털기', '과일나무 재수확 대기 −20%', { fruitFast: 0.2 }, { after: 'forage-t2' }),
  t('forage-a-t1', 'forage', 6, '약초 달이기', '채집물 요리 효과 +20%', { herbBuff: 0.2 }, { branch: 'forage-a' }),
  t('forage-a-t2', 'forage', 8, '꽃말', '꽃 선물 친밀도 ×1.5', { flowerGift: 0.5 }, { branch: 'forage-a', after: 'forage-a-t1' }),
  t('forage-b-t1', 'forage', 6, '장작 패기', '나무 판매가 +20%', { woodSell: 0.2 }, { branch: 'forage-b' }),
  t('forage-b-t2', 'forage', 8, '숲 가꾸기', '농장 풀을 벨 때 건초 +1', null, { branch: 'forage-b', after: 'forage-b-t1', farm: true }),
  // 광업
  t('mine-t1', 'mine', 2, '광맥 냄새', '오늘의 광맥 층을 광산 입구 게시판에 표시', { veinHint: true }),
  t('mine-t2', 'mine', 2, '화석 손', '화석 확률 ×1.5', { fossil: 0.5 }),
  t('mine-t3', 'mine', 4, '사다리 감', '바위 1개 덜 깨도 사다리가 나와요', { ladderEarly: 1 }, { after: 'mine-t1' }),
  t('mine-t4', 'mine', 4, '보석 세공', '보석 판매가 +20%', { gemSell: 0.2 }, { after: 'mine-t2' }),
  t('mine-a-t1', 'mine', 6, '망치질', '돌 바위에서 구리가 나올 확률 +5%p', { copperPts: 5 }, { branch: 'mine-a' }),
  t('mine-a-t2', 'mine', 8, '용광로', '대장간에 맡긴 도구를 당일 저녁 6시에 찾아요', { forgeFast: true }, { branch: 'mine-a', after: 'mine-a-t1' }),
  t('mine-b-t1', 'mine', 6, '광석 지도', '광산 층에 들어서면 광석 바위가 반짝여요', null, { branch: 'mine-b', lock: '바위의 광석은 깰 때 정해져요 · 미리 정해지면 열려요' }),
  t('mine-b-t2', 'mine', 8, '깊은 숨', '승강기에서 한 층 더 깊이 시작', { liftPlus: 1 }, { branch: 'mine-b', after: 'mine-b-t1' }),
  // 솜씨
  t('craft-t1', 'craft', 2, '손이 빠른', '가공 기계 시간 −10%', { machineFast: 0.1 }),
  t('craft-t2', 'craft', 2, '재료 정리', '제작 재료 −5%', { craftDiscount: 0.05 }),
  t('craft-t3', 'craft', 4, '포장의 달인', '가공품 판매가 +5%', { artisanSell: 0.05 }, { after: 'craft-t1' }),
  t('craft-t4', 'craft', 4, '기계 한 칸 더', '가공 마당 슬롯 +1', null, { after: 'craft-t2', farm: true }),
  t('craft-a-t1', 'craft', 6, '양념 솜씨', '요리 효과 시간 +30%', { buffLong: 0.3 }, { branch: 'craft-a' }),
  t('craft-a-t2', 'craft', 8, '잔칫상', '요리를 선물하면 친밀도 ×1.5', { dishGift: 0.5 }, { branch: 'craft-a', after: 'craft-a-t1' }),
  t('craft-b-t1', 'craft', 6, '가구 장인', '원목 가구 제작 재료 −20%', { furnCheap: 0.2 }, { branch: 'craft-b' }),
  t('craft-b-t2', 'craft', 8, '수리공', '내 가공 기계가 10% 확률로 2개를 만들어요', { machineDouble: 0.1 }, { branch: 'craft-b', after: 'craft-b-t1' }),
  // 목축
  t('ranch-t1', 'ranch', 2, '다정한 손', '쓰다듬기 애정 +1', { petLove: 1 }),
  t('ranch-t2', 'ranch', 2, '건초 아끼기', '건초를 먹일 때 20% 확률로 건초가 줄지 않아요', { hayKeep: 0.2 }),
  t('ranch-t3', 'ranch', 4, '좋은 사료', '알·우유 금별 확률 +5%p', null, { after: 'ranch-t1', lock: '알·우유에 별 품질이 생기면(우리 농장 축사) 열려요' }),
  t('ranch-t4', 'ranch', 4, '부지런한 아침', '게임 시각 05~09시에 돌보면 XP ×1.5', { ranchMorning: 0.5 }, { after: 'ranch-t2' }),
  t('ranch-a-t1', 'ranch', 6, '동물 말', '동물 기분 말풍선 (무엇을 원하는지)', { animalTalk: true }, { branch: 'ranch-a' }),
  t('ranch-a-t2', 'ranch', 8, '목장 축제', '목장 대회(닐라) 점수 +10%', null, { branch: 'ranch-a', after: 'ranch-a-t1', lock: '닐라의 목장 대회가 생기면 열려요' }),
  t('ranch-b-t1', 'ranch', 6, '장인 손맛', '축산 가공품 한 단계 좋은 별 확률 +10%p', { ranchStar: 10 }, { branch: 'ranch-b' }),
  t('ranch-b-t2', 'ranch', 8, '납품 단골', '축산물·축산 가공품 판매 수요가 덜 빨리 줄어요', { demandRanch: 1 }, { branch: 'ranch-b', after: 'ranch-b-t1' }),
];
export const TALENT_BY_ID: Readonly<Record<string, TalentDef>> = Object.fromEntries(TALENTS.map((d) => [d.id, d]));
export const isTalentId = (id: unknown): id is string => typeof id === 'string' && Object.prototype.hasOwnProperty.call(TALENT_BY_ID, id);
export const talentsOf = (skill: SkillId) => TALENTS.filter((d) => d.skill === skill);

/** Talent points earned at a level: one at Lv2·4·6·8·10. */
export const talentPoints = (level: number) => Math.max(0, Math.min(MAX_LEVEL, Math.floor(level)) >> 1);

/** 운명 다시 보기: 500,000범, doubling each time the same skill is reset. */
export const RESPEC_BASE = 500_000;
/** Times counted (2^33 × 500,000 stays a safe integer; nobody gets near it). */
export const RESPEC_PRICE_MAX_TIMES = 33;
export const respecPrice = (times: number) => RESPEC_BASE * 2 ** Math.max(0, Math.min(RESPEC_PRICE_MAX_TIMES, Math.floor(times)));
