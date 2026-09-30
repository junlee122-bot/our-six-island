// 새 소식: what changed in the village, newest first, shown on the 마을 게시판
// (app/lounge/WhatsNew.tsx). Add an entry with every release that friends
// will notice; keep the lines short and concrete.

export type ChangeEntry = {
  /** Unique and sortable: date plus a letter. */
  id: string;
  date: string;
  title: string;
  items: readonly string[];
  /** Things we know are not right yet. */
  known?: readonly string[];
};

export const CHANGELOG: readonly ChangeEntry[] = [
  {
    id: '2026-10-01-b',
    date: '10월 1일',
    title: '주민과 이야기하는 대화 상자',
    items: [
      '주민에게 말을 걸면 쉬는 친구와 이야기할 때처럼 화면 아래 대화 상자에서 이야기해요.',
      '선물도 대화 상자 안에서 가방 물건을 골라 바로 건네요. 주민의 반응이 다음 말로 이어져요.',
      '대화 상자에 주민의 모습과 하트, 사이가 함께 보여요.',
    ],
  },
  {
    id: '2026-09-30-b',
    date: '9월 30일 밤',
    title: '방 안내와 승준 탐험',
    items: [
      '로그인할 때마다 방에서 뜨던 처음 안내가 이제 저절로 뜨지 않아요. 메뉴의 처음 안내 다시 보기로 언제든 볼 수 있어요.',
      '마을 적응하기 목록은 방이 아니라 마을에서만 보여요.',
      '시장 거리 주민들이 새벽 1시까지 주점, 광장 벤치, 강변 캠프, 호숫가에 나와 있어요.',
      '승준은 12월 31일까지 뒷산, 숲 깊은 곳, 광산 모든 층에 조건 없이 갈 수 있어요.',
    ],
  },
  {
    id: '2026-09-30-a',
    date: '9월 30일',
    title: '시장 거리, 새 텃밭, 새 낚시',
    items: [
      '마을이 넓어지고 가장자리에 구역 입구 다섯 곳이 생겼어요. 동쪽 큰길로 시장 거리에 갈 수 있어요.',
      '시장 거리 주민 여섯 명이 이사 왔어요: 나세라(농협), 프리렌(빵집 카페), 쓰레쉬(잡화점), 신짜장(우체국), 볼리바스(파출소), 잔나(신문사).',
      '주민에게 말을 걸고 하루 한 번 선물을 줄 수 있어요. 주민 수첩에서 지금 어디 있는지 보여요.',
      '시장 거리 의뢰 게시판에 주민 부탁이 하루 두세 개 올라와요.',
      '텃밭: 작물 26종, 밭 칸에 스프링클러·허수아비·벌통 배치, 가공 기계, 출하함, 작물 품평회가 생겼어요.',
      '낚시: 입질 뒤 손맛 겨루기, 물고기 58종(전설 5종), 미끼·찌·통발, 크기 기록, 주간 낚시 대회가 생겼어요.',
      '게임마다 규칙·기록 창이 생겼어요. 이번 주 순위도 볼 수 있어요.',
      '블랙잭에 서렌더가 생겼어요. 첫 두 장에서 판돈 절반을 돌려받고 접을 수 있어요.',
      '판 중간에 끊겼다 돌아와도 자리를 되찾아요.',
      '로제에게 빌린 돈이 기한을 넘기면 소지금, 그다음 은행 예금에서 자동으로 걷어 가요.',
    ],
    known: ['낚시에서 입질 뒤 손맛 겨루기로 넘어가지 않고 늦었다고 나오는 경우가 있어요. 고치는 중이에요.'],
  },
  {
    id: '2026-09-28-a',
    date: '9월 28일',
    title: '은행, 미용실, 카지노 대부',
    items: [
      '범마을 은행(냐모)에서 범을 맡기고 찾거나 친구에게 차용증을 쓸 수 있어요.',
      '보송 미용실(그웬)에서 머리 모양과 색을 바꿀 수 있어요.',
      '카지노 대부 창구(로제)에서 급한 범을 빌릴 수 있어요. 이자는 한 번만 30%예요.',
      '허풍 주점 카드가 새 그림으로 바뀌었어요.',
    ],
  },
];

export const LATEST_CHANGE = CHANGELOG[0]?.id ?? '';

/** How many entries are newer than the one this device saw last. */
export function unseenChanges(seen: string | null): number {
  if (!seen) return CHANGELOG.length;
  const i = CHANGELOG.findIndex((c) => c.id === seen);
  return i < 0 ? CHANGELOG.length : i;
}
